const cheerio = require("cheerio");
const moment = require("moment");
const pMap = require("p-map");
const puppeteer = require("puppeteer");
const url = require("url");
const { dateFormat, formatCinema, timeFormat } = require("./formatter");


module.exports = {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
};

async function getHtmlBody(url, timer = 0) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    timeout: 0
  });
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitFor(timer);
  try {
    const body = await page.evaluate(() => document.body.innerHTML);
    await browser.close();
    return body;
  } catch(err) {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitFor(timer);
    const body = await page.evaluate(() => document.body.innerHTML);
    await browser.close();
    return body;
  }
}

const SHAW = "https://www.shaw.sg";

async function getShawShowtimesUrls() {
  const body = await getHtmlBody(SHAW);
  const $ = cheerio.load(body);
  return $(".date-top-selector option")
    .map((i, el) => {
      return moment($(el).attr("value"), "YYYY-MM-DD")
        .utcOffset("+08:00")
        .format(dateFormat);
    })
    .get();
}

async function getShawJson() {
  const dates = await getShawShowtimesUrls();
  let json = dates.map(date => {
    return {
      date,
      url: `${SHAW}/Showtimes/${date}/All/All`
    };
  });
  json = await pMap(
    json,
    async showtimesPage => {
      const body = await getHtmlBody(showtimesPage.url);
      return { ...showtimesPage, body };
    },
    { concurrency: 1 }
  );
  json = json.map(showtimesPage => {
    const { body, ...rest } = showtimesPage;
    return {
      ...rest,
      cinemas: parseShowtimesPage(body)
    };
  });

  console.info("getShawJson finished");
  return json;
}

function parseShowtimesPage(body) {
  const $ = cheerio.load(body);
  return $(".location-area-persist")
    .map((i, el) => {
      const name = formatCinema(
        $(el)
          .find(".theatre-title")
          .eq(0)
          .text()
      );
      const movies = $(el)
        .find(".movies_item-movie")
        .map((i, movieEl) => {
          const title = $(movieEl)
            .find(".title")
            .text();
          const timings = $(".showtimes-block", movieEl)
            .map((i, showtimeEl) => {
              return {
                time: moment($("a", showtimeEl).text(), ["h:mm A"]).format(
                  timeFormat
                ),
                url: url.resolve(SHAW, $("a", showtimeEl).attr("href"))
              };
            })
            .get();
          return { title, timings };
        })
        .get();
      return { name, movies };
    })
    .get();
}

const CATHAY = "https://www.cathaycineplexes.com.sg/showtimes/";

function parseCathay(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $(".tabs")
    .map((i, a) => {
      return {
        dates: $(".tabbers", a)
          .map((i, el) => {
            const date = $(`[value=${$(el).attr("id")}]`)
              .eq(0)
              .text()
              .split(",")[1]
              .trim();
            const formattedDate = moment(date, "D MMM")
              .utcOffset("+08:00")
              .format(dateFormat);
            return {
              date: formattedDate,
              movies: $(".movie-container", el)
                .filter((i, el) => {
                  return $(".mobileLink", el).text();
                })
                .map((i, el) => {
                  return {
                    name: formatCinema(
                      $(".M_movietitle", a)
                        .text()
                        .trim() ||
                        $(".mobileLink", el)
                          .prevAll("strong")
                          .text()
                          .trim()
                    ),
                    title: $(".mobileLink", el).text(),
                    timings: $(".cine_time", el)
                      .map((i, el) => {
                        return {
                          time: $(el)
                            .contents()
                            .filter(function() {
                              return this.type === "text";
                            })
                            .text(),
                          url: url.resolve(
                            CATHAY,
                            $(el).attr("data-href") || ""
                          )
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
  return getHtmlBody(CATHAY, 10000)
    .then(parseCathay)
    .then(json => {
      console.info("getCathay finished");
      return json;
    })
    .catch(err => {
      console.error("getCathay failed");
      return Promise.reject(err);
    });
}

const GV_CINEMAS = "https://www.gv.com.sg/GVCinemas";

async function getGVCinemaRequests() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    timeout: 0
  });
  const page = await browser.newPage();
  const cinemasResponse = page.waitForResponse(response =>
    response.url().includes("cinemasbytype")
  );

  await page.goto(GV_CINEMAS);

  const { data } = await (await cinemasResponse).json();

  const cinemas = data.map(({ name, id }) => {
    return {
      name: formatCinema(name),
      url: `https://www.gv.com.sg/GVCinemaDetails#/cinema/${id}`
    };
  });

  await pMap(
    cinemas,
    async cinema => {
      const moviesResponse = page.waitForResponse(response =>
        response.url().includes("session")
      );

      await page.goto(cinema.url);

      const { data: categories } = await (await moviesResponse).json();

      cinema.movies = parseGVCinemaJSON(categories);

      return cinema;
    },
    { concurrency: 1 }
  );

  await browser.close();

  return cinemas;
}

function parseGVCinemaJSON(json) {
  return json
    .reduce((acc, category) => {
      return [
        ...acc,
        ...category.films.map(film => {
          return {
            title: film.filmTitle,
            dates: film.dates.map(({ date, times }) => {
              const ddmmyyyy = moment(date)
                .utcOffset("+08:00")
                .format("DD-MM-YYYY");
              const yyyymdd = moment(date)
                .utcOffset("+08:00")
                .format(dateFormat);
              return {
                date: yyyymdd,
                timings: times.map(timing => {
                  return {
                    time: moment(timing.time12, "kk:mmA").format(timeFormat),
                    url: `https://www.gv.com.sg/GVSeatSelection#/cinemaId/${category.id}/filmCode/${film.filmCd}/showDate/${ddmmyyyy}/showTime/${timing.time24}/hallNumber/${timing.hallNumber}`
                  };
                })
              };
            })
          };
        })
      ];
    }, [])
    .filter(({ title }) => {
      return title !== "Zen Zone 2017*";
    });
}

function getGVJson() {
  return getGVCinemaRequests()
    .then(json => {
      console.info("getGVJson finished");
      return json;
    })
    .catch(err => {
      console.error("getGVJson failed");
      return Promise.reject(err);
    });
}

const FILMGARDE = "http://fgcineplex.com.sg/buyticket";

async function getFilmgardeJson() {
  const body = await getHtmlBody(FILMGARDE);
  const $ = cheerio.load(body);
  const json = $(".mobile-hide.hidden-xs .container.p-0.bread-comb")
    .map((i, el) => {
      const name = formatCinema(
        $(el)
          .text()
          .trim()
      );
      const cinemaEl = $(el).next();
      const dates = $('[data-toggle="tab"]', cinemaEl)
        .map((i, el) => {
          const date = moment($(el).text(), "ddd DD/MMM")
            .utcOffset("+08:00")
            .format(dateFormat);
          const id = $(el).attr("href");
          const movies = $(`${id} .ticket-cinem-list`)
            .map((i, movieEl) => {
              const title = $(".cinema-title h2 a", movieEl).text();
              const timings = $(".cinema-time-table li", movieEl)
                .map((i, el) => {
                  const time = moment(
                    $("a", el)
                      .text()
                      .trim(),
                    "h:mm A"
                  ).format(timeFormat);
                  const url = $("a", el).attr("href");
                  return { time, url };
                })
                .get();
              return { title, timings };
            })
            .get();
          return { date, movies };
        })
        .get();
      return { name, dates };
    })
    .get();

  console.info("getFilmgardeJson finished");
  return json;
}

const WE_CINEMAS = "https://www.wecinemas.com.sg/buy-ticket.aspx";

function parseWe(page) {
  const $ = cheerio.load(page, {
    normalizeWhitespace: true
  });
  return $("#DataListCinemas h2")
    .map((i, el) => {
      return {
        name: formatCinema(
          $(el)
            .text()
            .trim()
        ),
        dates: $(".showtime-date-con", $(el).closest("table"))
          .map((i, el) => {
            const date = $(".showtime-date", el).text();
            const formattedDate = moment(date, "D MMMM YYYY, dddd")
              .utcOffset("+08:00")
              .format(dateFormat);
            return {
              date: formattedDate,
              movies: $("h3", $(el).closest("table"))
                .map((i, el) => {
                  return {
                    title: $(el).text(),
                    timings: $(
                      ".showtimes-but",
                      $(el)
                        .closest("tr")
                        .next()
                        .next()
                        .next()
                    )
                      .map((i, el) => {
                        return {
                          time: moment($(el).text(), "k:mmA").format(
                            timeFormat
                          ),
                          url: url.resolve(WE_CINEMAS, $("a", el).attr("href"))
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
  return getHtmlBody(WE_CINEMAS)
    .then(parseWe)
    .then(json => {
      console.info("getWe finished");
      return json;
    })
    .catch(err => {
      console.error("getWe failed");
      return Promise.reject(err);
    });
}
