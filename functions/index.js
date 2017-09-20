const fs = require('fs');
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const path = require('path');
const sharp = require('sharp');

const bucket = gcs.bucket('cinelah-92dbb.appspot.com');
const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require('./scraper.js');
const { getShowtimes } = require('./showtimes.js');
const { getMovie, normalizeShowtimes } = require('./formatter.js');

const scrapeShowtimes = functions.https.onRequest(function(req, res) {
  Promise.all([
    getCathayJson(),
    getFilmgardeJson(),
    getGVJson(),
    getShawJson(),
    getWeJson()
  ])
    .then(function([cathay, filmgarde, gv, shaw, we]) {
      return getShowtimes({
        cathay,
        filmgarde,
        gv,
        shaw,
        we
      });
    })
    .then(function(showtimes) {
      const normalizedShowtimes = normalizeShowtimes(showtimes);
      return storeJsonInBucket(normalizedShowtimes, 'showtimes')
        .then(function() {
          return res.send(normalizedShowtimes);
        });
    });
});

const scrapeMovies = functions.storage.object().onChange(function(event) {
  const object = event.data;
  const temp = `/tmp/${path.basename(object.name)}`;

  if (!object.name.includes('showtimes.json')) {
    return;
  }

  return bucket.file(object.name).download({
    destination: temp
  })
    .then(function() {
      const { movies } = JSON.parse(fs.readFileSync(temp, 'utf8'));
      return Object.keys(movies).reduce(function(res, key) {
        return bucket.file(`movies/${movies[key].id}/details.json`).exists()
          .then(function([exists]) {
            if (exists) {
              return Promise.resolve();
            }

            return getMovie(movies[key].title)
              .then(function([details, poster, backdrop]) {
                return Promise.all([
                  storeJsonInBucket(details, 'details', `movies/${movies[key].id}/`),
                  sharp(poster)
                    .resize(200, null)
                    .jpeg({ progressive: true })
                    .toBuffer()
                    .then(function(x) {
                      return storeImageInBucket(x, 'poster', `movies/${movies[key].id}/`);
                    }),
                  sharp(backdrop || poster)
                    .resize(144, 100)
                    .jpeg({ progressive: true })
                    .toBuffer()
                    .then(function(y) {
                      return storeImageInBucket(y, 'backdrop', `movies/${movies[key].id}/`);
                    })
                ]);
              });
          })
          .catch(function(err) {
            console.error(key, err);
            return Promise.resolve();
          });
      }, Promise.resolve());
    })
    .catch(function(err) {
      console.error(err);
      return Promise.reject();
    });
});

function storeImageInBucket(buffer, name, baseDir = '') {
  const ts = Math.random();
  fs.writeFileSync(`/tmp/${name}${ts}.jpg`, buffer);
  return bucket.upload(`/tmp/${name}${ts}.jpg`, {
    destination: `${baseDir}${name}.jpg`,
    gzip: true,
    public: true,
    metadata: {
      cacheControl: 'public, max-age=86400'
    }
  });
}

function storeJsonInBucket(json, name, baseDir = '') {
  const ts = Math.random();
  fs.writeFileSync(`/tmp/${name}${ts}.json`, JSON.stringify(json));
  return bucket.upload(`/tmp/${name}${ts}.json`, {
    destination: `${baseDir}${name}.json`,
    gzip: true,
    public: true,
    metadata: {
      cacheControl: 'public, max-age=21600'
    }
  });
}

const sitemap = functions.https.onRequest(function(req, res) {
  bucket.file('showtimes.json').download()
    .then(function(data) {
      const { movies } = JSON.parse(data);
      const urls = Object.keys(movies).map(function(movieId) {
        return `https://www.cinelah.com/movies/${movieId}\n`;
      });
      res.status(200).send(urls);
    });
});

module.exports = {
  scrapeShowtimes,
  scrapeMovies,
  sitemap
};
