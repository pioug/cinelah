const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const fs = require('fs');

const bucket = gcs.bucket('cinelah-92dbb.appspot.com');
const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require('./scraper.js');
const { getShowtimes } = require('./showtimes.js');

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
      return storeInBucket(showtimes, 'showtimes')
        .then(function() {
          return res.send(showtimes);
        });
    });
});

function storeInBucket(json, name) {
  fs.writeFileSync(`/tmp/${name}.json`, JSON.stringify(json));
  return bucket.upload(`/tmp/${name}.json`, {
    destination: `${name}.json`,
    gzip: true,
    public: true
  });
}

module.exports = {
  scrapeShowtimes,
};
