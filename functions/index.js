const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const fs = require('fs');
const path = require('path');

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
        return res
          .then(function() {
            return getMovie(movies[key].title);
          })
          .then(function([details, poster, backdrop]) {
            return Promise.all([
              storeJsonInBucket(details, 'details', `movies/${movies[key].id}/`),
              storeImageInBucket(poster, 'poster', `movies/${movies[key].id}/`),
              storeImageInBucket(backdrop || poster, 'backdrop', `movies/${movies[key].id}/`)
            ]);
          })
          .catch(function(err) {
            console.error(key, err);
            return Promise.resolve();
          });
      }, Promise.resolve());
    });
});

function storeImageInBucket(buffer, name, baseDir = '') {
  fs.writeFileSync(`/tmp/${name}.jpg`, buffer);
  return bucket.upload(`/tmp/${name}.jpg`, {
    destination: `${baseDir}${name}.jpg`,
    gzip: true,
    public: true
  });
}

function storeJsonInBucket(json, name, baseDir = '') {
  fs.writeFileSync(`/tmp/${name}.json`, JSON.stringify(json));
  return bucket.upload(`/tmp/${name}.json`, {
    destination: `${baseDir}${name}.json`,
    gzip: true,
    public: true
  });
}

module.exports = {
  scrapeShowtimes,
  scrapeMovies
};
