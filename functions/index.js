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

const scrapeShowtimes = functions.https.onRequest((req, res) => {
  Promise.all([
    getCathayJson(),
    getFilmgardeJson(),
    getGVJson(),
    getShawJson(),
    getWeJson()
  ])
    .then(([cathay, filmgarde, gv, shaw, we]) => {
      return getShowtimes({
        cathay,
        filmgarde,
        gv,
        shaw,
        we
      });
    })
    .then(showtimes => {
      const normalizedShowtimes = normalizeShowtimes(showtimes);
      return storeJsonInBucket(normalizedShowtimes, 'showtimes')
        .then(() => {
          return res.send(normalizedShowtimes);
        });
    });
});

const scrapeMovies = functions.storage.object().onChange(event => {
  const object = event.data;
  const temp = `/tmp/${path.basename(object.name)}`;

  if (!object.name.includes('showtimes.json')) {
    return;
  }

  return bucket.file(object.name).download({
    destination: temp
  })
    .then(() => {
      const { movies } = JSON.parse(fs.readFileSync(temp, 'utf8'));
      return Object.keys(movies).reduce((res, key) => {
        return bucket.file(`movies/${movies[key].id}/details.json`).exists()
          .then(([exists]) => {
            if (exists) {
              return Promise.resolve();
            }

            return getMovie(movies[key].title)
              .then(([details, poster, backdrop]) => {
                return Promise.all([
                  storeJsonInBucket(details, 'details', `movies/${movies[key].id}/`),
                  sharp(poster)
                    .resize(200, null)
                    .jpeg({ progressive: true })
                    .toBuffer()
                    .then(x => {
                      return storeImageInBucket(x, 'poster', `movies/${movies[key].id}/`);
                    }),
                  sharp(backdrop || poster)
                    .resize(144, 100)
                    .jpeg({ progressive: true })
                    .toBuffer()
                    .then(y => {
                      return storeImageInBucket(y, 'backdrop', `movies/${movies[key].id}/`);
                    })
                ]);
              });
          })
          .catch(err => {
            console.error(key, err);
            return Promise.resolve();
          });
      }, Promise.resolve());
    })
    .catch(err => {
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

const sitemap = functions.https.onRequest((req, res) => {
  bucket.file('showtimes.json').download()
    .then(data => {
      const { movies } = JSON.parse(data);
      const urls = Object.keys(movies).map(movieId => {
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
