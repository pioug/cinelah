const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require('./scraper.js');

const { getShowtimes } = require('./showtimes.js');

const fs = require('fs');

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
  .then(function(json) {
    fs.writeFileSync('showtimes.json', gstr(json));
  });

function gstr(ob) {
  return JSON.stringify(ob, null, 2);
}
