const {
  cathay,
  filmgarde,
  gv,
  shaw,
  we
} = require('./data.json');

const fs = require('fs');
const moment = require('moment');
const { dateFormat } = require('./formatter.js');

function getCathayCinemas(json) {
  return json.map(function({ name, dates }) {
    return {
      name,
      dates: dates.map(function({ date, movies }) {
        return {
          date: moment(date, 'DD MMM').format(dateFormat),
          movies
        };
      }).filter(function({ movies }) {
        return movies.length;
      })
    };
  });
}

function getFilmgardeCinemas(json) {
  const hash = json.reduce(function(res, { date, cinemas }) {

    cinemas.reduce(function(x, { name, movies }) {
      res[name] = res[name] || {};
      res[name].dates = res[name].dates || [];
      res[name].dates = res[name].dates.concat({
        date: moment(date, 'DD/M/YYYY').format(dateFormat),
        movies
      });
      return x;
    }, {});

    return res;
  }, {});

  return Object.keys(hash).map(function(name) {
    return {
      name,
      dates: hash[name].dates
    };
  });
}

function getGVCinemas(json) {
  return json.map(function({ name, movies }) {
    const hash = movies.reduce(function(res, { title, dates }) {
      dates.reduce(function(x, { date, timings }) {
        res[date] = res[date] || {};
        res[date].movies = res[date].movies || [];
        res[date].movies = res[date].movies.concat({
          title,
          timings
        });
        return x;
      });
      return res;
    }, {});

    return {
      name,
      dates: Object.keys(hash).map(function(date) {
        return {
          date,
          movies: hash[date].movies
        };
      })
    };
  });
}

function getShawCinemas(json) {
  const hash = json.reduce(function(res, { date, cinemas }) {

    cinemas.reduce(function(x, { name, movies }) {
      res[name] = res[name] || {};
      res[name].dates = res[name].dates || [];
      res[name].dates = res[name].dates.concat({
        date: moment(date, 'M/DD/YYYY').format(dateFormat),
        movies
      });
      return x;
    }, {});

    return res;
  }, {});

  return Object.keys(hash).map(function(name) {
    return {
      name,
      dates: hash[name].dates
    };
  });
}

function getWeCinemas(json) {
  return json.map(function({ name, dates }) {
    return {
      name,
      dates: dates.map(function({ date, movies }) {
        return {
          date: moment(date, 'DD MMM YYYY, ddd').format(dateFormat),
          movies
        };
      })
    };
  });
}

function getCinemas() {
  return [
    ...getCathayCinemas(cathay),
    ...getFilmgardeCinemas(filmgarde),
    ...getGVCinemas(gv),
    ...getShawCinemas(shaw),
    ...getWeCinemas(we)
  ];
}

// fs.writeFileSync('test.json', gstr(getCathayCinemas(cathay)));
// fs.writeFileSync('test.json', gstr(getFilmgardeCinemas(filmgarde)));
// fs.writeFileSync('test.json', gstr(getGVCinemas(gv)));
// fs.writeFileSync('test.json', gstr(getShawCinemas(shaw)));
// fs.writeFileSync('test.json', gstr(getWeCinemas(we)));
fs.writeFileSync('cinemas.json', gstr(getCinemas()));

function gstr(ob) {
  return JSON.stringify(ob, null, 2);
}
