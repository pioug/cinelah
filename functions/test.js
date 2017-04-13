const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require('./scraper.js');

const fs = require('fs');

Promise.all([
  getCathayJson(),
  getFilmgardeJson(),
  getGVJson(),
  getShawJson(),
  getWeJson()
])
  .then(function([cathay, filmgarde, gv, shaw, we]) {
    fs.writeFileSync('data.json', gstr({
      cathay,
      filmgarde,
      gv,
      shaw,
      we
    }));
  });

function gstr(ob) {
  return JSON.stringify(ob, null, 2);
}
