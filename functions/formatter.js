const axios = require("axios");
const Case = require("case");
const cheerio = require("cheerio");
const deburr = require("lodash.deburr");
const kebabCase = require("lodash.kebabcase");
const memoize = require("lodash.memoize");
const setTimeoutPromise = require("delay");
const tokenizeEnglish = require("tokenize-english")(require("tokenize-text")());

const { mrt } = require("./cinemas.js");

const TMDB_API_KEY = "bd09ff783d37c8e5a07b105ab39a7503";

module.exports = {
  dateFormat: "YYYY-MM-DD",
  formatCinema,
  formatTitle: memoize(formatTitle),
  getCountry: memoize(getCountry),
  getGenre: memoize(getGenre),
  getMovie,
  getRating: memoize(getRating),
  getSummary: memoize(getSummary),
  normalizeShowtimes,
  timeFormat: "HH:mm"
};

function formatCinema(originalStr) {
  return (
    {
      "AMK HUB": "Cathay - AMK Hub",
      "CAUSEWAY POINT": "Cathay - Causeway Point",
      "CINELEISURE ORCHARD": "Cathay - Cineleisure Orchard",
      "DOWNTOWN EAST": "Cathay - Downtown East",
      "Filmgarde Cineplex - Bugis": "Filmgarde - Bugis",
      "Filmgarde Cineplex - Century Square": "Filmgarde - Century Square",
      "Filmgarde Cineplex - Kallang": "Filmgarde - Kallang",
      "GV Bedok": "GV - Bedok",
      "GV Bishan": "GV - Bishan",
      "GV City Square": "GV - City Square",
      "GV Grand, Great World City": "GV - Gemini Grand, Great World City",
      "GV Jurong Point": "GV - Jurong Point",
      "GV Katong": "GV - Katong",
      "GV Paya Lebar": "GV - Paya Lebar",
      "GV Plaza": "GV - Plaza",
      "GV Suntec City": "GV - Suntec City",
      "GV Tampines": "GV - Tampines",
      "GV Tiong Bahru": "GV - Tiong Bahru",
      "GV VivoCity": "GV - VivoCity",
      "GV Yishun": "GV - Yishun",
      "PARKWAY PARADE": "Cathay - Parkway Parade",
      "Shaw Theatres Balestier": "Shaw - Theatres Balestier",
      "Shaw Theatres Century": "Shaw - Theatres Century",
      "Shaw Theatres JCube": "Shaw - Theatres JCube",
      "Shaw Theatres Lido": "Shaw - Theatres Lido",
      "Shaw Theatres Lot One": "Shaw - Theatres Lot One",
      "Shaw Theatres nex": "Shaw - Theatres nex",
      "Shaw Theatres Seletar": "Shaw - Theatres Seletar",
      "Shaw Theatres Waterway Point": "Shaw - Theatres Waterway Point",
      "THE CATHAY": "Cathay - The Cathay",
      "WE Cinemas, Clementi": "WE - Cinemas",
      "WEST MALL": "Cathay - West Mall",
      JEM: "Cathay - Jem"
    }[originalStr] || originalStr
  );
}

function formatTitle(originalStr) {
  let cleanStr = originalStr
    .replace(/GFF\*/g, "")
    .replace(/Dining\sSet\*/g, "")
    .replace(/Fans`\sSc\*/g, "")
    .replace(/Fans`\sPrev\*/g, "")
    .replace(/Fans`\sScreening*/g, "")
    .replace(/Kids\sFlix –/g, "")
    .replace(/Mums\s&\sBabies –/, "")
    .replace(/Zen\sZone\s\d+.*/, "")
    .replace(/\bthe\b/gi, "")
    .replace(/`/g, "'")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/\s*:/g, ":")
    .replace(/\s+3D/g, "")
    .replace(/PG(\d*)/g, "")
    .replace(/NC(\d+)/g, "")
    .replace(/M(\d+)/g, "")
    .replace(/\*Atmos/g, "")
    .replace(/Marathon/g, "")
    .replace(/TBA/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .replace(/(\s)+/g, " ")
    .replace(/&/g, "and")
    .trim();

  if (!cleanStr) {
    return Promise.reject(`${originalStr} is not a movie title`);
  }

  cleanStr = Case.title(cleanStr);

  return getImdbPage(cleanStr)
    .then(response => {
      return getMovieOnImdbPage(response.data);
    })
    .catch(err => {
      console.log(err);
      return searchTitleOnTmbd(cleanStr).then(response => {
        if (response.data.total_results) {
          return response.data.results[0].title;
        }
        return Promise.reject(new Error(`No results on TMDB for ${cleanStr}`));
      });
    })
    .then(clean => {
      console.info(`formatTitle ${originalStr} to ${clean}`);
      return clean;
    });
}

const searchTitleOnTmbd = memoize(searchTitleOnTmbd_);
function searchTitleOnTmbd_(str) {
  return axios
    .get(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${str}`
    )
    .catch(err => {
      if (
        (err.response && err.response.status === 429) ||
        (err.code && err.code === "ETIMEDOUT")
      ) {
        return setTimeoutPromise(10000).then(() => searchTitleOnTmbd_(str));
      }

      console.error(err);
      return Promise.reject(err);
    });
}

const getMovieOnTmdb = memoize(getMovieOnTmdb_);
function getMovieOnTmdb_(id) {
  return axios
    .get(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`)
    .then(response => {
      const baseImageUrl = "https://image.tmdb.org/t/p/w500";
      response.data.poster_path =
        response.data.poster_path &&
        `${baseImageUrl}${response.data.poster_path}`;
      response.data.backdrop_path =
        response.data.backdrop_path &&
        `${baseImageUrl}${response.data.backdrop_path}`;
      return response;
    })
    .catch(err => {
      if (
        (err.response && err.response.status === 429) ||
        (err.code && err.code === "ETIMEDOUT")
      ) {
        return setTimeoutPromise(10000).then(() => getMovieOnTmdb_(id));
      }

      console.error(err);
      return Promise.reject(err);
    });
}

const getImdbPage = memoize(getImdbPage_);
function getImdbPage_(str) {
  return getImdbId(str).then(id => {
    return axios.get(`http://www.imdb.com/title/${id}/`, {
      headers: {
        "Accept-Language": "en,en-US;q=0.9,fr;q=0.8"
      }
    });
  });
}

const getImdbSummaryPage = memoize(getImdbSummaryPage_);
function getImdbSummaryPage_(str) {
  return getImdbId(str).then(id => {
    return axios.get(`http://www.imdb.com/title/${id}/plotsummary`);
  });
}

const getImdbId = memoize(getImdbId_);
function getImdbId_(str) {
  return axios
    .get(
      `https://www.google.com.sg/search?q=${str} ${new Date().getFullYear()} movie imdb&btnI`,
      {
        headers: {
          "Accept-Language": "en,en-US;q=0.9,fr;q=0.8"
        }
      }
    )
    .then(response => {
      const [id] = response.data.match(/tt\d+/);
      return id;
    })
    .catch(() => {
      return searchTitleOnTmbd(str).then(({ data }) => {
        if (data.total_results) {
          return getMovieOnTmdb(data.results[0].id).then(({ data }) => {
            return (
              data.imdb_id ||
              Promise.reject(new Error(`No results on TMDB for ${str}`))
            );
          });
        }
      });
    });
}

function getMovieOnImdbPage(page) {
  const $ = cheerio.load(page);
  return $('.title_wrapper h1')
    .children()
    .remove()
    .end()
    .text()
    .trim();
}

function normalizeShowtimes(json) {
  const movies = json.reduce(
    (res, { country, genre, movie, rating, summary }) => {
      const id = kebabCase(movie);
      res[id] = {
        country,
        id,
        summary,
        title: movie,
        genre,
        rating
      };
      return res;
    },
    {}
  );
  const cinemas = json.reduce((res, { cinema }) => {
    const id = kebabCase(cinema);
    res[id] = {
      id,
      name: cinema,
      mrt: mrt[id]
    };
    return res;
  }, {});

  const showtimes = json.map(({ cinema, movie, url, date, time }) => {
    return {
      cinema: kebabCase(cinema),
      movie: kebabCase(movie),
      url,
      date,
      time
    };
  });
  return {
    movies,
    cinemas,
    showtimes
  };
}

function getPosterOnImdbPage(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return axios
    .get(
      `http://www.imdb.com${$(".poster a")
        .eq(0)
        .attr("href")}`
    )
    .then(response => {
      const id = response.config.url.split("/")[6].split("?")[0];
      const start = "window.IMDbReactInitialState.push(";
      const end = '"isModal":false}}';
      const json = eval(
        `(${response.data.substr(
          response.data.indexOf(start) + start.length,
          response.data.indexOf(end) -
            response.data.indexOf(start) -
            start.length +
            end.length
        )})`
      ); // eslint-disable-line no-eval
      return json.mediaviewer.galleries[
        response.config.url.split("/")[4]
      ].allImages.find(img => img.id === id).src;
    });
}

function getPoster(title) {
  return getImdbPage(title)
    .then(response => {
      return getPosterOnImdbPage(response.data);
    })
    .catch(() => {
      return searchTitleOnTmbd(title).then(({ data }) => {
        if (data.results.length && data.results[0].poster_path) {
          const baseImageUrl = "https://image.tmdb.org/t/p/w500";
          return baseImageUrl + data.results[0].poster_path;
        }
      });
    });
}

function getMovie(title) {
  return Promise.all([getPoster(title), getStill(title)])
    .then(([poster_path, backdrop_path]) => {
      return {
        data: {
          title,
          poster_path,
          backdrop_path
        }
      };
    })
    .then(({ data: movie }) => {
      return Promise.all([
        movie,
        movie.poster_path &&
          axios
            .get(movie.poster_path, { responseType: "arraybuffer" })
            .then(response => response.data),
        movie.backdrop_path &&
          axios
            .get(movie.backdrop_path, { responseType: "arraybuffer" })
            .then(response => response.data)
      ]);
    });
}

function getStill(title) {
  return getImdbId(title)
    .then(id => {
      return axios.get(`http://www.imdb.com/title/${id}/mediaindex`);
    })
    .then(response => {
      const $ = cheerio.load(response.data);
      return `${
        $(".media_index_thumb_list img")
          .eq(0)
          .attr("src")
          .split("_V1_")[0]
      }_V1_.jpg`;
    })
    .catch(() => {
      return searchTitleOnTmbd(title).then(({ data }) => {
        if (data.results.length && data.results[0].backdrop_path) {
          const baseImageUrl = "https://image.tmdb.org/t/p/w500";
          return baseImageUrl + data.results[0].backdrop_path;
        }
      });
    });
}

function getRating(title) {
  return getImdbPage(title).then(response => {
    return getRatingOnImdbPage(response.data);
  });
}

function getRatingOnImdbPage(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return parseFloat($('.ratingValue strong').text()) || null;
}

function getCountry(title) {
  return getImdbPage(title).then(response => {
    return getCountryOnImdbPage(response.data);
  });
}

function getCountryOnImdbPage(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return (
    $('[href^="/search/title?country_of_origin"]')
      .eq(0)
      .text() || null
  );
}

function getGenre(title) {
  return getImdbPage(title).then(response => {
    return getGenreOnImdbPage(response.data);
  });
}

function getGenreOnImdbPage(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return (
    $('[href$="tt_stry_gnr"]')
      .eq(0)
      .text() || null
  );
}

function getSummary(title) {
  return getImdbSummaryPage(title)
    .then(response => {
      return getSummaryOnImdbPage(response.data);
    })
    .then(summary => {
      if (!summary) {
        return searchTitleOnTmbd(title).then(response => {
          if (response.data.total_results) {
            return getMovieOnTmdb(response.data.results[0].id).then(
              ({ data: movie }) => {
                return getFirstSentenses(movie.overview) || null;
              }
            );
          }
        });
      }

      return summary;
    });
}

function getSummaryOnImdbPage(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  const summary = $(".ipl-zebra-list__item")
    .eq(0)
    .find("p")
    .text()
    .trim();
  return getFirstSentenses(summary);
}

function getFirstSentenses(text) {
  return tokenizeEnglish
    .sentences()(text)
    .map(token => token.value)
    .reduce((res, token) => {
      if (res.length > 140) {
        return res;
      }

      return res + token;
    }, "")
    .trim();
}
