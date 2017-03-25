const functions = require('firebase-functions');
const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require('./scraper.js');


function send(parseFn) {
  return functions.https.onRequest(function(req, res) {
    return parseFn()
      .then(function(json) {
        return res.send(json);
      });
  });
}

module.exports = {
  cathay: send(getCathayJson),
  filmgarde: send(getFilmgardeJson),
  gv: send(getGVJson),
  shaw: send(getShawJson),
  we: send(getWeJson)
};
