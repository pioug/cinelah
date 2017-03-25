const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const phantom = require('phantom');
const url = require('url');
const fs = require('fs');

const TIMEOUT_AFTER_CLOSING = 1000;

module.exports = {
  getCathayJson,
  getFilmgardeJson, // NOK
  getGVJson, // NOK
  getShawJson, // NOK
  getWeJson
};

const SHAW = 'http://m.shaw.sg/';

function getShawMobileDates() {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(SHAW)
            .then(function() {
              const content = page.property('content');
              page.close();
              return content;
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseShawMobileDates(page) {
  const $ = cheerio.load(page);
  return $('#ddlShowDate option')
    .map(function(i, el) {
      return {
        date: $(el).attr('value')
      };
    })
    .get();
}

function getShawMobileDay({ date }) {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(SHAW)
            .then(function() {
              return page.evaluate(function(date) {
                document.querySelector('#globalform').ddlShowDate.value = date;
                return document.querySelector('[type=\"submit\"]').click();
              }, date);
            })
            .then(function() {
              return new Promise(resolve => {
                page.on('onLoadFinished', function(status) {
                  const content = page.property('content');
                  page.close();
                  resolve(content);
                });
              });
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseShawMobileDay(page) {
  const $ = cheerio.load(page);
  return $('.persist-area')
    .map(function(i, el) {
      return {
        name: $('.floatingHeader .category.cplex.header', el).text(),
        date: $('.floatingHeader .showdate', el).text(),
        address: $('.floatingHeader #address', el).text(),
        movies: $('.filminfo')
          .map(function(i, el) {
            return {
              title: $('.filmtitle', el).text(),
              timings: $('.filmshowtime a', el)
                .map(function(i, el) {
                  return {
                    time: $(el).text(),
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

function getShawJson() {
  return getShawMobileDates()
    .then(parseShawMobileDates)
    .then(function(results) {
      return results.reduce(function(res, date) {
        return res.then(function() {
          return getShawMobileDay(date)
            .then(parseShawMobileDay)
            .then(function(cinemas) {
              date.cinemas = cinemas;
              return Promise.resolve(results)
            });
        })
      }, Promise.resolve())
    });
}

const CATHAY = 'http://www.cathaycineplexes.com.sg/showtimes/';

function getCathay() {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(CATHAY)
            .then(function() {
              const content = page.property('content');
              page.close();
              return content;
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseCathay(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('.tabs')
    .map(function(i, el) {
      return {
        name: $('.M_movietitle', el).text().trim() || 'PLATINUM MOVIE SUITES',
        day: $('.tabbers', el)
          .map(function(i, el) {
            return {
              date: $(`#${$(el).attr('aria-labelledby')} .smalldate`, $(el).parent()).text(),
              movies: $('.movie-container', el)
                .filter(function(i, el) {
                  return $('.mobileLink', el).text();
                })
                .map(function(i, el) {
                  return {
                    title: $('.mobileLink', el).text(),
                    timings: $('.cine_time', el)
                      .map(function(i, el) {
                        return {
                          time: $(el).text(),
                          url: url.resolve(SHAW, $(el).attr('href'))
                        };
                      })
                      .get()
                  };
                })
                .get()
            }
          })
          .get()
      }
    })
    .get();
}

function getCathayJson() {
  return getCathay()
    .then(parseCathay);
}

const GV_CINEMAS = 'https://www.gv.com.sg/GVCinemas';

function getGVCinemas() {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(GV_CINEMAS)
            .then(function() {
              const content = page.property('content');
              page.close();
              return content;
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseGVCinemas(page) {
  const $ = cheerio.load(page);
  return [... parseList(), ... parseCards()];

  function parseList() {
    return $('.cinemas-list li')
      .map(function(i, el) {
        return {
          name: $(el).text(),
          url: url.resolve(GV_CINEMAS, $('a', el).attr('href'))
        };
      })
      .get();
  }

  function parseCards() {
    return $('.brand-cinemas-list .col-lg-4')
      .map(function(i, el) {
        return {
          name: $('.heading img', el).attr('alt'),
          url: url.resolve(GV_CINEMAS, $('a', el).attr('href'))
        };
      })
      .get();
  }
}

function getGVCinema(url) {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          page.open(url).catch(() => {});
          return new Promise(function(resolve, reject) {
            page.on('onResourceRequested', function(request, network) {
              if (!request.url.includes('session')) {
                return;
              }
              page.close();
              instance.exit();
              resolve(request);
            });
          });
        })
        .then(function(request) {
          return axios.post(request.url, request.postData, {
            headers: request.headers.reduce(function(res, item) {
                res[item.name] = item.value;
                return res;
              }, {})
            });
        })
        .then(function(response) {
          return response.data.data[0];
        })
        .then(function(content) {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseGVCinemaJSON(json) {
  return json.films.map(function(film) {
    return {
      title: film.filmTitle,
      timings: film.dates[0].times.map(function(date) {
        var ddmmyyyy = moment(new Date(date.midnightDate)).format('DD-MM-YYYY');
        return {
          day: ddmmyyyy,
          time: date.time12,
          url: `https://www.gv.com.sg/GVSeatSelection#/cinemaId/${json.id}/filmCode/${film.filmCd}/showDate/${ddmmyyyy}/showTime/${date.time24}/hallNumber/${date.hallNumber}`
        };
      })
    }
  })
}

function getGVJson() {
  return getGVCinemas()
  .then(parseGVCinemas)
  .then(function(cinemas) {
    return cinemas.reduce(function(res, cinema) {
      return res
        .then(function() {
          return getGVCinema(cinema.url)
        })
        .then(parseGVCinemaJSON)
        .then(function(movies) {
          cinema.movies = movies;
          return Promise.resolve(cinemas);
        });
    }, Promise.resolve());
  });
}

const FILMGARDE = 'http://tickets.fgcineplex.com.sg/visInternetTicketing/';

function getFilmgardeDates() {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(FILMGARDE)
            .then(function() {
              const content = page.property('content');
              page.close();
              return content;
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseFilmgardeDates(page) {
  const $ = cheerio.load(page);
  return $('#ddlFilterDate option')
    .map(function(i, el) {
      return {
        date: $(el).attr('value')
      };
    })
    .get();
}

function getFilmgardeDay({ date }) {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(FILMGARDE)
            .then(function() {
              return page.evaluate(function(date) {
                document.querySelector('[name="ddlFilterDate"]').value = date;
                return document.querySelector('[name="ddlFilterDate"]').onchange();
              }, date);
            })
            .then(function() {
              return new Promise(resolve => {
                page.on('onLoadFinished', function(status) {
                  const content = page.property('content');
                  page.close();
                  resolve(content);
                });
              });
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseFilmgardeDay(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('.ShowtimesCinemaRow')
    .map(function(i, el) {
      return {
        name: $(el).text().trim(),
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

function getFilmgardeJson() {
  return getFilmgardeDates()
    .then(parseFilmgardeDates)
    .then(function(results) {
      return results.reduce(function(res, date) {
        return res.then(function() {
          return getFilmgardeDay(date)
            .then(parseFilmgardeDay)
            .then(function(cinemas) {
              date.cinemas = cinemas;
              return Promise.resolve(results)
            });
        })
      }, Promise.resolve())
    });
}

const WE_CINEMAS = 'https://www.wecinemas.com.sg/buy-ticket.aspx';

function getWe() {
  return phantom.create(['--load-images=no'])
    .then(function(instance) {
      return instance.createPage()
        .then(function(page) {
          return page.open(WE_CINEMAS)
            .then(function() {
              const content = page.property('content');
              page.close();
              resolve(content);
            });
        })
        .then(function(content) {
          instance.exit();
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(content);
            }, TIMEOUT_AFTER_CLOSING);
          });
        });
    });
}

function parseWe(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $('#DataListCinemas h2')
    .map(function(i, el) {
      return {
        name: $(el).text().trim(),
        dates: $('.showtime-date-con', $(el).closest('table'))
          .map(function(i, el) {
            return {
              date: $('.showtime-date', el).text(),
              movies: $('h3', $(el).closest('table'))
                .map(function(i, el) {
                  return {
                    title: $(el).text(),
                    timings: $('.showtimes-but', $(el).closest('tr').next().next().next())
                      .map(function(i, el) {
                        return {
                          time: $(el).text(),
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
    .then(parseWe);
}
