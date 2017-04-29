const axios = require('axios');
const Case = require('case');
const cheerio = require('cheerio');
const kebabCase = require('lodash.kebabcase');
const memoize = require('lodash.memoize');

const TMDB_API_KEY = 'bd09ff783d37c8e5a07b105ab39a7503';

module.exports = {
  dateFormat: 'YYYY-MM-DD',
  formatCinema,
  formatTitle: memoize(formatTitle),
  getMovie,
  normalizeShowtimes: normalizeShowtimes,
  timeFormat: 'HH:mm'
};

function formatCinema(originalStr) {
  return {
    'AMK HUB': 'Cathay - AMK Hub',
    'Bugis+': 'Filmgarde - Bugis+',
    'CAUSEWAY POINT': 'Cathay - Causeway Point',
    'CINELEISURE ORCHARD': 'Cathay - Cineleisure Orchard',
    'DOWNTOWN EAST': 'Cathay - Downtown East',
    'GV Bishan': 'GV - Bishan',
    'GV City Square': 'GV - City Square',
    'GV Grand, Great World City': 'GV - Gemini Grand, Great World City',
    'GV Jurong Point': 'GV - Jurong Point',
    'GV Katong': 'GV - Katong',
    'GV Plaza': 'GV - Plaza',
    'GV Suntec City': 'GV - Suntec City',
    'GV Tampines': 'GV - Tampines',
    'GV Tiong Bahru': 'GV - Tiong Bahru',
    'GV VivoCity': 'GV - VivoCity',
    'GV Yishun': 'GV - Yishun',
    'JEM': 'Cathay - Jem',
    'Leisure Park Kallang': 'Filmgarde - Leisure Park Kallang',
    'Shaw Theatres Balestier': 'Shaw - Theatres Balestier',
    'Shaw Theatres Century': 'Shaw - Theatres Century',
    'Shaw Theatres JCube': 'Shaw - Theatres JCube',
    'Shaw Theatres Lido': 'Shaw - Theatres Lido',
    'Shaw Theatres Lot One': 'Shaw - Theatres Lot One',
    'Shaw Theatres Seletar': 'Shaw - Theatres Seletar',
    'Shaw Theatres Waterway Point': 'Shaw - Theatres Waterway Point',
    'Shaw Theatres nex': 'Shaw - Theatres nex',
    'THE CATHAY': 'Cathay - The Cathay',
    'WE Cinemas, Clementi': 'WE - Cinemas',
    'WEST MALL': 'Cathay - West Mall'
  }[originalStr] || originalStr;
}

function formatTitle(originalStr) {
  let cleanStr = originalStr
    .replace(/Dining\sSet\*/g, '')
    .replace(/Fans\`\sSc\*/g, '')
    .replace(/Kids\sFlix \–/g, '')
    .replace(/Mums\ \&\ Babies\ /, '')
    .replace(/the\smovie/gi, '')
    .replace(/\`/g, '\'')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/\s*\:/g, ':')
    .replace(/\s+3D/g, '')
    .replace(/PG(\d*)/g, '')
    .replace(/NC(\d+)/g, '')
    .replace(/M(\d+)/g, '')
    .replace(/\*Atmos/g, '')
    .replace(/Marathon/g, '')
    .replace(/TBA/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\*/g, '')
    .trim();

  cleanStr = Case.title(cleanStr);

  return searchTitleOnTmbd(cleanStr)
    .then(function(response) {
      if (!response.data.total_results) {
        cleanStr = cleanStr
          .replace(/\s*\w*\.\w*\s+/gi, ' ')
          .replace(/\s*\w*\'\w*\s+/gi, ' ')
          .trim();
        return searchTitleOnTmbd(cleanStr);
      }

      return response;
    })
    .then(function(response) {
      if (response.data.total_results) {
        return response.data.results[0].title;
      }
      return Promise.reject(new Error('No results on TMDB'));
    })
    .catch(function(err) {
      if (err.message === 'No results on TMDB') {
        return searchTitleOnImdbViaDDG(cleanStr)
          .then(function(response) {
            return getMovieOnImdbPage(response.data);
          });
      }
    })
    .then(function(clean) {
      console.info(`formatTitle ${originalStr} to ${clean}`);
      return clean;
    });
}

function searchTitleOnTmbd(str) {
  return axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${str}`)
    .catch(function(err) {
      if (err.response && err.response.status === 429) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(searchTitleOnTmbd(str));
          }, 10000);
        });
      } else {
        console.error(err);
        return Promise.reject(err);
      }
    });
}

function getMovieOnTmdb(id) {
  return axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`)
    .then(function(response) {
      const baseImageUrl = 'https://image.tmdb.org/t/p/w500';
      response.data.poster_path = response.data.poster_path && `${baseImageUrl}${response.data.poster_path}`;
      response.data.backdrop_path = response.data.backdrop_path && `${baseImageUrl}${response.data.backdrop_path}`;
      return response;
    })
    .catch(function(err) {
      if (err.response && err.response.status === 429) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(getMovieOnTmdb(id));
          }, 10000);
        });
      } else {
        console.error(err);
        return Promise.reject(err);
      }
    });
}

function searchTitleOnImdbViaDDG(str) {
  return axios.get(`http://www.google.com/search?q=${str} imdb.com&btnI`)
    .then(function(response) {
      var [id] = response.data.match(/tt\d+/);
      return axios.get(`http://www.imdb.com/title/${id}/`);
    });
}

function getMovieOnImdbPage(page) {
  const $ = cheerio.load(page);
  return $('h1[itemprop="name"]')
     .children()
     .remove()
     .end()
     .text()
     .trim();
}

function normalizeShowtimes(json) {
  const movies = json.reduce(function(res, { movie }) {
    const id = kebabCase(movie);
    res[id] = {
      id,
      title: movie
    };
    return res;
  }, {});
  const cinemas = json.reduce(function(res, { cinema }) {
    const id = kebabCase(cinema);
    res[id] = {
      id,
      name: cinema
    };
    return res;
  }, {});
  const showtimes = json.map(function({ cinema, movie, url, date, time }) {
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
  return axios.get(`http://www.imdb.com${$('.poster a').eq(0).attr('href')}`)
    .then(function(response) {
      const id = response.config.url.split('/')[6].split('?')[0];
      const start = 'window.IMDbReactInitialState.push(';
      const end = '"isModal":false}}';
      const json = eval(`(${response.data.substr(response.data.indexOf(start) + start.length, response.data.indexOf(end) - response.data.indexOf(start) - start.length + end.length)})`);  // eslint-disable-line no-eval
      return json.mediaviewer.galleries[response.config.url.split('/')[4]].allImages.find(img => img.id === id).src;
    });
}

function getMovie(title) {
  return searchTitleOnTmbd(title)
    .then(function({ data }) {
      if (data.results.length) {
        return getMovieOnTmdb(data.results[0].id);
      } else {
        return searchTitleOnImdbViaDDG(title)
          .then(function(response) {
            return getPosterOnImdbPage(response.data);
          })
          .then(function(poster_path) {
            return {
              data: {
                title,
                poster_path
              }
            };
          });
      }
    })
    .then(function({ data: movie }) {
      return Promise.all([
        movie,
        movie.poster_path && axios.get(movie.poster_path, { responseType: 'arraybuffer' }).then(response => response.data),
        movie.backdrop_path && axios.get(movie.backdrop_path, { responseType: 'arraybuffer' }).then(response => response.data)
      ]);
    });
}
