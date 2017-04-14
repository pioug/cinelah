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

function send(parseFn) {
  return functions.https.onRequest(function(req, res) {
    return parseFn()
      .then(function(json) {
        res.send(json);
      });
  });
}

const update = functions.https.onRequest(function(req, res) {
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
  fs.writeFileSync(`/tmp/${name}.json`, JSON.stringify(json), null, 2);
  return bucket.upload(`/tmp/${name}.json`, {
    destination: `${name}.json`,
    gzip: true,
    public: true
  });
}

module.exports = {
  cathay: send(getCathayJson),
  filmgarde: send(getFilmgardeJson),
  gv: send(getGVJson), // 512 MB
  shaw: send(getShawJson), // 512 MB
  update,
  we: send(getWeJson)
};
