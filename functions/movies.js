const cathay = require('./cathay.json');
const filmgarde = require('./filmgarde.json');
const gv = require('./gv.json');
const shaw = require('./shaw.json');
const we = require('./we.json');

const fs = require('fs');
const moment = require('moment');
const Case = require('case');
const { dateFormat } = require('./formatter.js');

function getCathayMovies(json) {
  const hash = json.reduce(function(a, { name, dates }) {

    dates.reduce(function(b, { date, movies }) {
      const formattedDate = moment(date, 'DD MMM').format(dateFormat);

      movies.reduce(function(c, { title, timings }) {
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[formattedDate] = a[title].dates[formattedDate] || [];
        a[title].dates[formattedDate] = a[title].dates[formattedDate].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(function(title) {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(function(date) {
        return {
          date,
          cinemas: hash[title].dates[date]
        };
      })
    };
  });

  return hashy;
}

function getFilmgardeMovies(json) {
  const hash = json.reduce(function(a, { date, cinemas }) {
    const formattedDate = moment(date, 'DD MMM').format(dateFormat);

    cinemas.reduce(function(b, { name, movies }) {

      movies.reduce(function(c, { title, timings }) {
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[formattedDate] = a[title].dates[formattedDate] || [];
        a[title].dates[formattedDate] = a[title].dates[formattedDate].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(function(title) {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(function(date) {
        return {
          date,
          cinemas: hash[title].dates[date]
        };
      })
    };
  });

  return hashy;
}

function getGvMovies(json) {
  const hash = json.reduce(function(a, { name, movies }) {

    movies.reduce(function(b, { title, dates }) {

      dates.reduce(function(c, { date, timings }) {
        const formattedDate = moment(date, 'DD MMM').format(dateFormat);
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[formattedDate] = a[title].dates[formattedDate] || [];
        a[title].dates[formattedDate] = a[title].dates[formattedDate].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(function(title) {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(function(date) {
        return {
          date,
          cinemas: hash[title].dates[date]
        };
      })
    };
  });

  return hashy;
}

function getShawMovies(json) {
  const hash = json.reduce(function(a, { date, cinemas }) {
    const formattedDate = moment(date, 'M/DD/YYYY').format(dateFormat);

    cinemas.reduce(function(b, { name, movies }) {

      movies.reduce(function(c, { title, timings }) {
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[formattedDate] = a[title].dates[formattedDate] || [];
        a[title].dates[formattedDate] = a[title].dates[formattedDate].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(function(title) {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(function(date) {
        return {
          date,
          cinemas: hash[title].dates[date]
        };
      })
    };
  });

  return hashy;
}

function getWeMovies(json) {
  const hash = json.reduce(function(a, { name, dates }) {

    dates.reduce(function(b, { date, movies }) {
      const formattedDate = moment(date, 'D MMMM YYYY, dddd').format(dateFormat);

      movies.reduce(function(c, { title, timings }) {
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[formattedDate] = a[title].dates[formattedDate] || [];
        a[title].dates[formattedDate] = a[title].dates[formattedDate].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(function(title) {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(function(date) {
        return {
          date,
          cinemas: hash[title].dates[date]
        };
      })
    };
  });

  return hashy;
}

function getMovies() {
  return [
    ...getCathayMovies(cathay),
    ...getFilmgardeMovies(filmgarde),
    ...getGvMovies(gv),
    ...getShawMovies(shaw),
    ...getWeMovies(we)
  ];
}

// fs.writeFileSync('test.json', gstr(getCathayMovies(cathay)));
// fs.writeFileSync('test.json', gstr(getFilmgardeMovies(filmgarde)));
// fs.writeFileSync('test.json', gstr(getGvMovies(gv)));
// fs.writeFileSync('test.json', gstr(getShawMovies(shaw)));
// fs.writeFileSync('test.json', gstr(getWeMovies(we)));
fs.writeFileSync('movies.json', gstr(getMovies()));

function gstr(ob) {
  return JSON.stringify(ob, null, 2);
}

getMovies()
  .map(function({ title }) {
    title = title
      .toLowerCase()
      .replace(/\`/g, '\'')
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/\s*\:/gi, ':')
      .replace(/PG(\d*)/gi, '')
      .replace(/NC(\d+)/gi, '')
      .replace(/M(\d+)/gi, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\*/g, '')
      .trim();
    return Case.title(title);
  })
  .sort(function(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  })
  .map(i => console.log(i));
