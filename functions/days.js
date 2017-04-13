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

const days = [0, 1, 2, 3, 4, 5, 6].map(function(item) {
  return getDay(moment().add(item, 'd'));
});

fs.writeFileSync('days.json', JSON.stringify(days, null, 2));

function getCathayDay(json, day) {
  return json.map(function(cinema) {
    const showtimes = cinema.dates.find(function({ date }) {
      return date === moment(day).format('DD MMM');
    });
    return {
      name: cinema.name,
      movies: showtimes && showtimes.movies || [],
    };
  })
  .filter(function({ movies }) {
    return movies.length;
  });
}

function getFilmgardeDay(json, day) {
  const showtimes = json.find(function({ date }) {
    return date === moment(day).format('DD/M/YYYY');
  });
  return showtimes && showtimes.cinemas || [];
}

function getGvDay(json, day) {
  return json.map(function({ name, movies }) {
    return {
      name,
      movies: movies.map(function({ title, dates }) {
        return {
          title,
          timings: dates.filter(function({ date }) {
            return date === moment(day).format('DD-MM-YYYY');
          })
        };
      }).filter(function({ timings }) {
        return timings.length;
      })
    };
  });
}

function getShawDay(json, day) {
  const showtimes = json.find(function({ date }) {
    return date === moment(day).format('M/DD/YYYY');
  });
  return showtimes && showtimes.cinemas || [];
}

function getWeDay(json, day) {
  return json.map(function({ name, dates }) {
    return {
      name,
      movies: dates.find(function({ date }) {
        return date === moment(day).format('D MMMM YYYY, dddd').toUpperCase();
      }).movies
    };
  });
}

function getDay(day) {
  const date = moment(day).format(dateFormat);
  return {
    date,
    cinemas: [
      ...getCathayDay(cathay, date),
      ...getFilmgardeDay(filmgarde, date),
      ...getGvDay(gv, date),
      ...getShawDay(shaw, date),
      ...getWeDay(we, date)
    ].filter(function({ movies }) {
      return movies.length;
    })
  };
}
