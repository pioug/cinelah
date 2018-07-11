const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require("./scraper.js");

const { getShowtimes } = require("./showtimes.js");
const { getMovie, normalizeShowtimes } = require("./formatter.js");

const fs = require("fs");

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
  .then(json => {
    fs.writeFileSync("./showtimes.json", gstr(normalizeShowtimes(json)));
    getMovies();
  })
  .catch(err => {
    console.log(err.stack);
  });

// getMovies();

function getMovies() {
  const json = require("../showtimes.json");
  return Object.keys(json.movies).reduce((res, key) => {
    return getMovie(json.movies[key].title).catch(err => {
      console.error(key, err.stack);
    });
  });
}

function gstr(obj) {
  return JSON.stringify(obj, null, 2);
}
