const axios = require('axios');
const cheerio = require('cheerio');
const memoize = require('lodash.memoize');
const Case = require('case');

const TMDB_API_KEY = 'bd09ff783d37c8e5a07b105ab39a7503';

module.exports = {
  dateFormat: 'YYYY-MM-DD',
  formatTiming,
  formatTitle: memoize(formatTitle)
};

function formatTiming(str) {
  return str;
}

function formatTitle(str) {
  str = str
    .replace(/Dining\sSet\*/g, '')
    .replace(/Fans\`\sSc\*/g, '')
    .replace(/Kids\sFlix \–/g, '')
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
  str = Case.title(str);
  return searchTitleOnTmbd(str)
    .then(function(response) {
      if (!response.data.total_results) {
        str = str
          .replace(/\s*\w*\.\w*\s+/gi, ' ')
          .replace(/\s*\w*\'\w*\s+/gi, ' ')
          .trim();
        return searchTitleOnTmbd(str);
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
      if (err.response && err.response.status === 429) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(formatTitle(str));
          }, 10000);
        });
      } else if (err.message === 'No results on TMDB') {
        return searchTitleOnImdbViaDDG(str);
      }
    });
}

function searchTitleOnTmbd(str) {
  return axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${str}`);
}

function searchTitleOnImdbViaDDG(str) {
  return axios.get(`https://duckduckgo.com/?q=!ducky+${str} 2017+site%3Aimdb.com`)
    .then(function(response) {
      var [id] = response.data.match(/tt\d+/);
      return axios.get(`http://www.imdb.com/title/${id}/`);
    })
    .then(function(response) {
      const $ = cheerio.load(response.data);
      return $('h1[itemprop="name"]')
         .children()
         .remove()
         .end()
         .text();
    });
}
