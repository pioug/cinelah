const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const fs = require('fs');
const path = require('path');

const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require('./scraper.js');
const BUCKET = gcs.bucket('cinelah-92dbb.appspot.com');

function send(parseFn) {
  return functions.https.onRequest(function(req, res) {
    return parseFn()
      .then(function(json) {
        return res.send(json);
      });
  });
}

function update() {
  return functions.https.onRequest(function(req, res) {
    return Promise.all([
      getCathayJson(),
      getFilmgardeJson(),
      getGVJson(),
      getShawJson(),
      getWeJson()
    ])
      .then(function([cathay, filmgarde, gv, shaw, we]) {
        return res.send({
          cathay,
          filmgarde,
          gv,
          shaw,
          we
        });
      });
  });
}

module.exports = {
  cathay: send(getCathayJson),
  filmgarde: send(getFilmgardeJson),
  gv: send(getGVJson), // 512 MB, 540 secs
  shaw: send(getShawJson), // 512 MB, 540 secs
  update: update(),
  we: send(getWeJson),
};
