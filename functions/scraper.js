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
  console.info('getShawJson started');
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(SHAW)
            .then(function() {
              return page.property('content');
            })
            .then(function(content) {
              const dates = parseShawMobileDates(content);
              return dates.reduce(function(res, date) {
                return res.then(function() {
                  const promise = new Promise(resolve => {
                    page.on('onLoadFinished', function() {
                      page.off('onLoadFinished');
                      resolve(page.property('content'));
                    });

                    page.evaluate(function(date) {
                      document.querySelector('#globalform').ddlShowDate.value = date;
                      return document.querySelector('[type=\"submit\"]').click();
                    }, date.formDate);
                  });

                  return promise;
                })
                .then(function(content) {
                  date.cinemas = parseShawMobileDay(content);
                  return dates;
                });
              }, Promise.resolve());
            });
        })
        .then(function(content) {
          return instance.exit()
            .then(function() {
              console.info('getShawJson finished');
              return content;
            });
        });
    });
}

function parseShawMobileDates(page) {
  const $ = cheerio.load(page);
  return $('#ddlShowDate option')
    .map(function(i, el) {
      const date = $(el).attr('value');
      const formattedDate = moment(date, 'M/DD/YYYY').format(dateFormat);
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
    .map(function(i, el) {
      return {
        name: formatCinema($('.floatingHeader .category.cplex.header', el).text()),
        movies: $('.filminfo', el)
          .map(function(i, el) {
            return {
              title: $('.filmtitle', el).text(),
              timings: $('.filmshowtime a', el)
                .map(function(i, el) {
                  return {
                    time: moment($(el).text(), 'k:mmA').format(timeFormat),
                    url: url.resolve(SHAW, $(el).attr('href'))
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
    .then(function(res) {
      return res.data;
    });
}

function parseCathay(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('.tabs')
    .map(function(i, a) {
      return {
        dates: $('.tabbers', a)
          .map(function(i, el) {
            const date = $(`[value=${$(el).attr('id')}]`).eq(0).text().split(',')[1].trim();
            const formattedDate = moment(date, 'D MMM').format(dateFormat);
            return {
              date: formattedDate,
              movies: $('.movie-container', el)
                .filter(function(i, el) {
                  return $('.mobileLink', el).text();
                })
                .map(function(i, el) {
                  return {
                    name: formatCinema($('.M_movietitle', a).text().trim() || $('.mobileLink', el).prevAll('strong').text().trim()),
                    title: $('.mobileLink', el).text(),
                    timings: $('.cine_time', el)
                      .map(function(i, el) {
                        return {
                          time: $(el).text(),
                          url: url.resolve(CATHAY, $(el).attr('data-href'))
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
  console.info('getCathay started');
  return getCathay()
    .then(parseCathay)
    .then(function(json) {
      console.info('getCathay finished');
      return json;
    })
    .catch(function(err) {
      console.error('getCathay failed');
      return Promise.reject(err);
    });
}

const GV_CINEMAS = 'https://www.gv.com.sg/GVCinemas';

function getGVCinemaRequests() {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          const promise = new Promise(function(resolve, reject) {
            page.on('onResourceRequested', function(request) {
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
            .then(function(cinemas) {
              return cinemas.reduce(function(res, cinema) {
                return res.then(function() {
                  const promise = new Promise(function(resolve, reject) {
                    page.on('onResourceRequested', function(request) {
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
            .then(function(content) {
              return page.close()
                .then(function() {
                  return instance.exit();
                })
                .then(function() {
                  return content;
                });
            });
        });
    });
}

function parseGVCinemaJSON(json) {
  return json.films.map(function(film) {
    return {
      title: film.filmTitle,
      dates: film.dates.map(function({ date, times }) {
        const ddmmyyyy = moment(new Date(date)).format('DD-MM-YYYY');
        const yyyymdd = moment(new Date(date)).format(dateFormat);
        return {
          date: yyyymdd,
          timings: times.map(function(timing) {
            return {
              time: moment(timing.time12, 'kk:mmA').format(timeFormat),
              url: `https://www.gv.com.sg/GVSeatSelection#/cinemaId/${json.id}/filmCode/${film.filmCd}/showDate/${ddmmyyyy}/showTime/${timing.time24}/hallNumber/${timing.hallNumber}`
            };
          })
        };
      })
    };
  })
  .filter(function({ title }) {
    return title !== 'Zen Zone 2017*';
  });
}

function replayGVCinemasRequest(request) {
  return axios.post(request.url, request.postData, {
    headers: request.headers.reduce(function(res, item) {
      res[item.name] = item.value;
      return res;
    }, {})
  })
    .then(function({ data: { data } }) {
      return data.map(function({ name, id }) {
        return {
          name: formatCinema(name),
          url: `https://www.gv.com.sg/GVCinemaDetails#/cinema/${id}`
        };
      });
    });
}

function replayGVCinemaRequest(cinema) {
  return axios.post(cinema.request.url, cinema.request.postData, {
    headers: cinema.request.headers.reduce(function(res, item) {
      res[item.name] = item.value;
      return res;
    }, {})
  })
    .then(function(response) {
      delete cinema.request;
      cinema.movies = parseGVCinemaJSON(response.data.data[0]);
      return cinema;
    });
}

function getGVJson() {
  console.info('getGVJson started');
  return getGVCinemaRequests()
  .then(function(cinemas) {
    return Promise.all(cinemas.map(replayGVCinemaRequest));
  })
  .then(function(json) {
    console.info('getGVJson finished');
    return json;
  })
  .catch(function(err) {
    console.error('getGVJson failed');
    return Promise.reject(err);
  });
}

const FILMGARDE = 'http://tickets.fgcineplex.com.sg/visInternetTicketing/';

function getFilmgardeJson() {
  console.info('getFilmgardeJson started');
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(FILMGARDE)
            .then(function() {
              return page.property('content');
            })
            .then(function(content) {
              const dates = parseFilmgardeDates(content);
              return dates.reduce(function(res, date) {
                return res.then(function() {
                  const promise = new Promise(resolve => {
                    page.on('onLoadFinished', function() {
                      page.off('onLoadFinished');
                      resolve(page.property('content'));
                    });
                  });

                  page.evaluate(function(date) {
                    document.querySelector('[name="ddlFilterDate"]').value = date;
                    return document.querySelector('[name="ddlFilterDate"]').onchange();
                  }, date.date);

                  return promise;
                })
                .then(function(content) {
                  date.cinemas = parseFilmgardeDay(content);
                  return dates;
                });
              }, Promise.resolve());
            });
        })
        .then(function(content) {
          return instance.exit()
            .then(function() {
              console.info('getFilmgardeJson finished');
              return content;
            });
        });
    })
    .catch(function(err) {
      console.error('getFilmgardeJson failed');
      return Promise.reject(err);
    });
}

function parseFilmgardeDates(page) {
  const $ = cheerio.load(page);
  return $('#ddlFilterDate option')
    .map(function(i, el) {
      const date = $(el).attr('value');
      const formattedDate = moment(date, 'DD MMM').format(dateFormat);
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
    .map(function(i, el) {
      return {
        name: formatCinema($(el).text().trim()),
        movies: $(el).nextUntil('.ShowtimesCinemaRow')
          .map(function(i, el) {
            return {
              title: $('.ShowtimesMovieLink', el).text(),
              timings: $('.ShowtimesSessionLink', el)
                .map(function(i, el) {
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
  return axios.get(WE_CINEMAS)
    .then(function(res) {
      return res.data;
    });
}

function parseWe(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('#DataListCinemas h2')
    .map(function(i, el) {
      return {
        name: formatCinema($(el).text().trim()),
        dates: $('.showtime-date-con', $(el).closest('table'))
          .map(function(i, el) {
            const date = $('.showtime-date', el).text();
            const formattedDate = moment(date, 'D MMMM YYYY, dddd').format(dateFormat);
            return {
              date: formattedDate,
              movies: $('h3', $(el).closest('table'))
                .map(function(i, el) {
                  return {
                    title: $(el).text(),
                    timings: $('.showtimes-but', $(el).closest('tr').next().next().next())
                      .map(function(i, el) {
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
  console.info('getWe started');
  return getWe()
    .then(parseWe)
    .then(function(json) {
      console.info('getWe finished');
      return json;
    })
    .catch(function(err) {
      console.error('getWe failed');
      return Promise.reject(err);
    });
}
