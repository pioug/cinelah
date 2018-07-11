const dateFns = require("date-fns");
const deburr = require("lodash.deburr");
const { dateFormat } = require("./formatter");
const {
  getCountry,
  getGenre,
  getRating,
  getSummary,
  formatTitle
} = require("./formatter.js");

module.exports = {
  getShowtimes
};

function getCathayMovies(json) {
  const hash = json.reduce((a, { dates }) => {
    dates.reduce((b, { date, movies }) => {
      movies.reduce((c, { name, title, timings }) => {
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[date] = a[title].dates[date] || [];
        a[title].dates[date] = a[title].dates[date].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(title => {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(date => {
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
  const hash = json.reduce((a, { date, cinemas }) => {
    cinemas.reduce((b, { name, movies }) => {
      movies.reduce((c, { title, timings }) => {
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[date] = a[title].dates[date] || [];
        a[title].dates[date] = a[title].dates[date].concat({
          name,
          timings
        });
        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(title => {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(date => {
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
  const hash = json.reduce((a, { name, movies }) => {
    movies.reduce((b, { title, dates }) => {
      dates.reduce((c, { date, timings }) => {
        const stricltyToday = timings.filter(timing => {
          return parseInt(timing.time) > 6;
        });
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[date] = a[title].dates[date] || [];
        a[title].dates[date] = a[title].dates[date].concat({
          name,
          timings: stricltyToday
        });

        const strictlyNextDay = timings.filter(timing => {
          return parseInt(timing.time) < 6;
        });
        const nextDay = dateFns.format(dateFns.addDays(date, 1), dateFormat);
        a[title].dates[nextDay] = a[title].dates[nextDay] || [];
        a[title].dates[nextDay] = a[title].dates[nextDay].concat({
          name,
          timings: strictlyNextDay
        });

        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(title => {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(date => {
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
  const hash = json.reduce((a, { date, cinemas }) => {
    cinemas.reduce((b, { name, movies }) => {
      movies.reduce((c, { title, timings }) => {
        const stricltyToday = timings.filter(timing => {
          return parseInt(timing.time) > 6;
        });
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[date] = a[title].dates[date] || [];
        a[title].dates[date] = a[title].dates[date].concat({
          name,
          timings: stricltyToday
        });

        const strictlyNextDay = timings.filter(timing => {
          return parseInt(timing.time) < 6;
        });
        const nextDay = dateFns.format(dateFns.addDays(date, 1), dateFormat);
        a[title].dates[nextDay] = a[title].dates[nextDay] || [];
        a[title].dates[nextDay] = a[title].dates[nextDay].concat({
          name,
          timings: strictlyNextDay
        });

        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(title => {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(date => {
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
  const hash = json.reduce((a, { name, dates }) => {
    dates.reduce((b, { date, movies }) => {
      movies.reduce((c, { title, timings }) => {
        const stricltyToday = timings.filter(timing => {
          return parseInt(timing.time) > 6;
        });
        a[title] = a[title] || {};
        a[title].dates = a[title].dates || {};
        a[title].dates[date] = a[title].dates[date] || [];
        a[title].dates[date] = a[title].dates[date].concat({
          name,
          timings: stricltyToday
        });

        const strictlyNextDay = timings.filter(timing => {
          return parseInt(timing.time) < 6;
        });
        const nextDay = dateFns.format(dateFns.addDays(date, 1), dateFormat);
        a[title].dates[nextDay] = a[title].dates[nextDay] || [];
        a[title].dates[nextDay] = a[title].dates[nextDay].concat({
          name,
          timings: strictlyNextDay
        });

        return c;
      }, {});

      return b;
    }, {});

    return a;
  }, {});

  const hashy = Object.keys(hash).map(title => {
    return {
      title,
      dates: Object.keys(hash[title].dates).map(date => {
        return {
          date,
          cinemas: hash[title].dates[date]
        };
      })
    };
  });

  return hashy;
}

function getMovies({ cathay, filmgarde, gv, shaw, we }) {
  return [
    ...getCathayMovies(cathay),
    ...getFilmgardeMovies(filmgarde),
    ...getGvMovies(gv),
    ...getShawMovies(shaw),
    ...getWeMovies(we)
  ];
}

function getShowtimes({ cathay, filmgarde, gv, shaw, we }) {
  console.info("getShowtimes started");
  return Promise.all(
    getMovies({ cathay, filmgarde, gv, shaw, we }).map(movie => {
      return formatTitle(movie.title)
        .then(title => {
          movie.title = title;
          title = deburr(title);
          return Promise.all([
            getGenre(title),
            getRating(title),
            getCountry(title),
            getSummary(title)
          ]);
        })
        .then(([genre, rating, country, summary]) => {
          movie.country = country;
          movie.genre = genre;
          movie.rating = rating;
          movie.summary = summary;
          return movie;
        })
        .catch(err => {
          console.error(err);
          return false;
        });
    })
  ).then(movies => {
    const now = new Date();
    const showtimes = movies
      .filter(movie => movie)
      .reduce((a, { title, genre, rating, country, dates, summary }) => {
        dates.reduce((b, { date, cinemas }) => {
          cinemas.reduce((c, { name, timings }) => {
            a = [
              ...a,
              ...timings.map(({ time, url }) => {
                return {
                  cinema: name,
                  country,
                  date,
                  genre,
                  movie: title,
                  rating,
                  summary,
                  time,
                  url
                };
              })
            ];
            return c;
          }, []);

          return b;
        }, []);

        return a;
      }, [])
      .sort((a, b) => {
        return a.movie < b.movie ? -1 : a.movie > b.movie ? 1 : 0;
      })
      .filter(({ date, time }) => {
        return dateFns.isAfter(`${date} ${time}`, now);
      });

    console.info("getShowtimes finished");
    return showtimes;
  });
}
