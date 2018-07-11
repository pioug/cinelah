const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const phantom = require('phantom');
const url = require('url');
const { dateFormat, formatCinema, timeFormat } = require('./formatter');

module.exports = {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
};

const SHAW = 'http://m.shaw.sg/';

function getShawJson() {
  return phantom.create(['--load-images=no'])
    .then(instance => {
      return instance.createPage()
        .then(page => {
          return page.open(SHAW)
            .then(() => {
              return page.property('content');
            })
            .then(content => {
              const dates = parseShawMobileDates(content);
              return dates.reduce((res, date) => {
                return res.then(() => {
                  const promise = new Promise(resolve => {
                    page.on('onLoadFinished', () => {
                      page.off('onLoadFinished');
                      resolve(page.property('content'));
                    });

                    page.evaluate(function(date) { // eslint-disable-line prefer-arrow-callback
                      document.querySelector('#globalform').ddlShowDate.value = date;
                      return document.querySelector('[type="submit"]').click();
                    }, date.formDate);
                  });

                  return promise;
                })
                  .then(content => {
                    date.cinemas = parseShawMobileDay(content);
                    return dates;
                  });
              }, Promise.resolve());
            });
        })
        .then(content => {
          return instance.exit()
            .then(() => {
              console.info('getShawJson finished');
              return content;
            });
        });
    });
}

function parseShawMobileDates(page) {
  const $ = cheerio.load(page);
  return $('#ddlShowDate option')
    .map((i, el) => {
      const date = $(el).attr('value');
      const formattedDate = moment(date, 'M/DD/YYYY').utcOffset('+08:00').format(dateFormat);
      return {
        date: formattedDate,
        formDate: date
      };
    })
    .get();
}

function parseShawMobileDay(page) {
  const $ = cheerio.load(page);
  return $('.persist-area')
    .map((i, el) => {
      return {
        name: formatCinema($('.floatingHeader .category.cplex.header', el).text()),
        movies: $('.filminfo', el)
          .map((i, el) => {
            return {
              title: $('.filmtitle', el).text(),
              timings: $('.filmshowtime a', el)
                .map((i, el) => {
                  return {
                    time: moment($(el).text(), 'k:mmA').format(timeFormat),
                    url: url.resolve(SHAW, $(el).attr('href') || '')
                  };
                })
                .get()
            };
          })
          .get()
      };
    })
    .get();
}

const CATHAY = 'http://www.cathaycineplexes.com.sg/showtimes/';

function getCathay() {
  return axios.get(CATHAY)
    .then(res => {
      return res.data;
    });
}

function parseCathay(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('.tabs')
    .map((i, a) => {
      return {
        dates: $('.tabbers', a)
          .map((i, el) => {
            const date = $(`[value=${$(el).attr('id')}]`).eq(0).text().split(',')[1].trim();
            const formattedDate = moment(date, 'D MMM').utcOffset('+08:00').format(dateFormat);
            return {
              date: formattedDate,
              movies: $('.movie-container', el)
                .filter((i, el) => {
                  return $('.mobileLink', el).text();
                })
                .map((i, el) => {
                  return {
                    name: formatCinema($('.M_movietitle', a).text().trim() || $('.mobileLink', el).prevAll('strong').text().trim()),
                    title: $('.mobileLink', el).text(),
                    timings: $('.cine_time .st', el)
                      .map((i, el) => {
                        return {
                          time: $(el).contents().filter(function() {
                            return this.type === 'text';
                          }).text(),
                          url: url.resolve(CATHAY, $(el).attr('data-href') || '')
                        };
                      })
                      .get()
                  };
                })
                .get()
            };
          })
          .get()
      };
    })
    .get();
}

function getCathayJson() {
  return getCathay()
    .then(parseCathay)
    .then(json => {
      console.info('getCathay finished');
      return json;
    })
    .catch(err => {
      console.error('getCathay failed');
      return Promise.reject(err);
    });
}

const GV_CINEMAS = 'https://www.gv.com.sg/GVCinemas';

function getGVCinemaRequests() {
  return phantom.create(['--load-images=no'])
    .then(instance => {
      return instance.createPage()
        .then(page => {
          const promise = new Promise((resolve, reject) => {
            page.on('onResourceRequested', request => {
              if (!request.url.includes('cinemasbytype')) {
                return;
              }
              page.off('onResourceRequested');
              page.stop();
              resolve(request);
            });
            page.open(GV_CINEMAS)
              .then(reject);
          });
          return promise
            .then(replayGVCinemasRequest)
            .then(cinemas => {
              return cinemas.reduce((res, cinema) => {
                return res.then(() => {
                  const promise = new Promise((resolve, reject) => {
                    page.on('onResourceRequested', request => {
                      if (!request.url.includes('session')) {
                        return;
                      }
                      page.off('onResourceRequested');
                      page.stop();
                      cinema.request = request;
                      resolve(cinemas);
                    });
                    page.open(cinema.url)
                      .then(reject);
                  });
                  return promise;
                });
              }, Promise.resolve());
            })
            .then(content => {
              return page.close()
                .then(() => {
                  return instance.exit();
                })
                .then(() => {
                  return content;
                });
            });
        });
    });
}

function parseGVCinemaJSON(json) {
  return json.films.map(film => {
    return {
      title: film.filmTitle,
      dates: film.dates.map(({ date, times }) => {
        const ddmmyyyy = moment(date).utcOffset('+08:00').format('DD-MM-YYYY');
        const yyyymdd = moment(date).utcOffset('+08:00').format(dateFormat);
        return {
          date: yyyymdd,
          timings: times.map(timing => {
            return {
              time: moment(timing.time12, 'kk:mmA').format(timeFormat),
              url: `https://www.gv.com.sg/GVSeatSelection#/cinemaId/${json.id}/filmCode/${film.filmCd}/showDate/${ddmmyyyy}/showTime/${timing.time24}/hallNumber/${timing.hallNumber}`
            };
          })
        };
      })
    };
  })
    .filter(({ title }) => {
      return title !== 'Zen Zone 2017*';
    });
}

function replayGVCinemasRequest(request) {
  return axios.post(request.url, request.postData, {
    headers: request.headers.reduce((res, item) => {
      res[item.name] = item.value;
      return res;
    }, {})
  })
    .then(({ data: { data } }) => {
      return data.map(({ name, id }) => {
        return {
          name: formatCinema(name),
          url: `https://www.gv.com.sg/GVCinemaDetails#/cinema/${id}`
        };
      });
    });
}

function replayGVCinemaRequest(cinema) {
  return axios.post(cinema.request.url, cinema.request.postData, {
    headers: cinema.request.headers.reduce((res, item) => {
      res[item.name] = item.value;
      return res;
    }, {})
  })
    .then(response => {
      delete cinema.request;
      cinema.movies = parseGVCinemaJSON(response.data.data[0]);
      return cinema;
    });
}

function getGVJson() {
  return getGVCinemaRequests()
    .then(cinemas => {
      return Promise.all(cinemas.map(replayGVCinemaRequest));
    })
    .then(json => {
      console.info('getGVJson finished');
      return json;
    })
    .catch(err => {
      console.error('getGVJson failed');
      return Promise.reject(err);
    });
}

const FILMGARDE = 'http://tickets.fgcineplex.com.sg/visInternetTicketing/';

function getFilmgardeJson() {
  return phantom.create(['--load-images=no'])
    .then(instance => {
      return instance.createPage()
        .then(page => {
          return page.open(FILMGARDE)
            .then(() => {
              return page.property('content');
            })
            .then(content => {
              const dates = parseFilmgardeDates(content);
              return dates.reduce((res, date) => {
                return res.then(() => {
                  const promise = new Promise(resolve => {
                    page.on('onLoadFinished', () => {
                      page.off('onLoadFinished');
                      resolve(page.property('content'));
                    });
                  });

                  page.evaluate(function(date) { // eslint-disable-line prefer-arrow-callback
                    document.querySelector('[name="ddlFilterDate"]').value = date;
                    return document.querySelector('[name="ddlFilterDate"]').onchange();
                  }, date.date);

                  return promise;
                })
                  .then(content => {
                    date.cinemas = parseFilmgardeDay(content);
                    return dates;
                  });
              }, Promise.resolve());
            });
        })
        .then(content => {
          return instance.exit()
            .then(() => {
              console.info('getFilmgardeJson finished');
              return content;
            });
        });
    })
    .catch(err => {
      console.error('getFilmgardeJson failed');
      return Promise.reject(err);
    });
}

function parseFilmgardeDates(page) {
  const $ = cheerio.load(page);
  return $('#ddlFilterDate option')
    .map((i, el) => {
      const date = $(el).attr('value');
      const formattedDate = moment(date, 'DD MMM').utcOffset('+08:00').format(dateFormat);
      return {
        date: formattedDate
      };
    })
    .get();
}

function parseFilmgardeDay(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('.ShowtimesCinemaRow')
    .map((i, el) => {
      return {
        name: formatCinema($(el).text().trim()),
        movies: $(el).nextUntil('.ShowtimesCinemaRow')
          .map((i, el) => {
            return {
              title: $('.ShowtimesMovieLink', el).text(),
              timings: $('.ShowtimesSessionLink', el)
                .map((i, el) => {
                  return {
                    time: $(el).text(),
                    url: url.resolve(FILMGARDE, $(el).attr('href'))
                  };
                })
                .get()
            };
          })
          .get()
      };
    })
    .get();
}

const WE_CINEMAS = 'https://www.wecinemas.com.sg/buy-ticket.aspx';

function getWe() {
  return phantom.create(['--load-images=no'])
    .then(instance => {
      return instance.createPage()
        .then(page => {
          return page.open(WE_CINEMAS)
            .then(() => {
              return page.property('content');
            });
        })
        .then(content => {
          return instance.exit()
            .then(() => {
              return content;
            });
        });
    });
}

function parseWe(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('#DataListCinemas h2')
    .map((i, el) => {
      return {
        name: formatCinema($(el).text().trim()),
        dates: $('.showtime-date-con', $(el).closest('table'))
          .map((i, el) => {
            const date = $('.showtime-date', el).text();
            const formattedDate = moment(date, 'D MMMM YYYY, dddd').utcOffset('+08:00').format(dateFormat);
            return {
              date: formattedDate,
              movies: $('h3', $(el).closest('table'))
                .map((i, el) => {
                  return {
                    title: $(el).text(),
                    timings: $('.showtimes-but', $(el).closest('tr').next().next().next())
                      .map((i, el) => {
                        return {
                          time: moment($(el).text(), 'k:mmA').format(timeFormat),
                          url: url.resolve(WE_CINEMAS, $('a', el).attr('href'))
                        };
                      })
                      .get()
                  };
                })
                .get()
            };
          })
          .get()
      };
    })
    .get();
}

function getWeJson() {
  return getWe()
    .then(parseWe)
    .then(json => {
      console.info('getWe finished');
      return json;
    })
    .catch(err => {
      console.error('getWe failed');
      return Promise.reject(err);
    });
}
