const fs = require("fs");
const functions = require("firebase-functions");
const path = require("path");
const pMap = require("p-map");
const sharp = require("sharp");
const { Storage } = require("@google-cloud/storage");

const bucket = new Storage({
  projectId: "cinelah-92dbb"
}).bucket("cinelah-92dbb.appspot.com");
const {
  getCathayJson,
  getFilmgardeJson,
  getGVJson,
  getShawJson,
  getWeJson
} = require("./scraper.js");
const { getShowtimes } = require("./showtimes.js");
const { getMovie, normalizeShowtimes } = require("./formatter.js");

const scrapeShowtimes = functions.https.onRequest((req, res) => {
  pMap(
    [getCathayJson, getFilmgardeJson, getGVJson, getShawJson, getWeJson],
    fn => fn(),
    { concurrency: 1 }
  )
    .then(([cathay, filmgarde, gv, shaw, we]) => {
      return getShowtimes({
        cathay,
        filmgarde,
        gv,
        shaw,
        we
      });
    })
    .then(showtimes => {
      const normalizedShowtimes = normalizeShowtimes(showtimes);
      return Promise.all([
        storeJsonInBucket(normalizedShowtimes, "showtimes"),
        storeJsonInBucket({ movies: normalizedShowtimes.movies }, "index")
      ]).then(() => {
        return res.send(normalizedShowtimes);
      });
    });
});

const scrapeMovies = functions.storage.object().onFinalize(object => {
  const temp = `/tmp/${path.basename(object.name)}`;

  if (!object.name.includes("showtimes.json")) {
    return Promise.resolve();
  }

  return bucket
    .file(object.name)
    .download({
      destination: temp
    })
    .then(() => {
      const { movies } = JSON.parse(fs.readFileSync(temp, "utf8"));
      return Object.keys(movies).reduce((res, key) => {
        return getMovie(movies[key].title)
          .then(([details, poster, backdrop]) => {
            return Promise.all([
              storeJsonInBucket(
                details,
                "details",
                `movies/${movies[key].id}/`
              ),
              sharp(poster)
                .resize(200, null)
                .jpeg({ progressive: true })
                .toBuffer()
                .then(x => {
                  return storeImageInBucket(
                    x,
                    "poster",
                    "jpg",
                    `movies/${movies[key].id}/`
                  );
                }),
              sharp(backdrop || poster)
                .resize(144, 100)
                .jpeg({ progressive: true })
                .toBuffer()
                .then(y => {
                  return storeImageInBucket(
                    y,
                    "backdrop",
                    "jpg",
                    `movies/${movies[key].id}/`
                  );
                }),
              sharp(poster)
                .resize(200, null)
                .webp()
                .toBuffer()
                .then(x => {
                  return storeImageInBucket(
                    x,
                    "poster",
                    "webp",
                    `movies/${movies[key].id}/`
                  );
                }),
              sharp(backdrop || poster)
                .resize(144, 100)
                .webp()
                .toBuffer()
                .then(y => {
                  return storeImageInBucket(
                    y,
                    "backdrop",
                    "webp",
                    `movies/${movies[key].id}/`
                  );
                })
            ]);
          })
          .catch(err => {
            console.error(key, err);
            return Promise.resolve();
          });
      }, Promise.resolve());
    })
    .catch(err => {
      console.error(err);
      return Promise.reject();
    });
});

const fixMovies = functions.https.onRequest((req, res) => {
  return bucket
    .file("showtimes.json")
    .download()
    .then(data => {
      const { movies } = JSON.parse(data);
      const promises = Object.keys(movies).map(key => {
        return getMovie(movies[key].title)
          .then(([details, poster, backdrop]) => {
            console.log(JSON.stringify(details));
            return Promise.all([
              storeJsonInBucket(
                details,
                "details",
                `movies/${movies[key].id}/`
              ),
              sharp(poster)
                .resize(200, null)
                .jpeg({ progressive: true })
                .toBuffer()
                .then(x => {
                  return storeImageInBucket(
                    x,
                    "poster",
                    "jpg",
                    `movies/${movies[key].id}/`
                  );
                }),
              sharp(backdrop || poster)
                .resize(144, 100)
                .jpeg({ progressive: true })
                .toBuffer()
                .then(y => {
                  return storeImageInBucket(
                    y,
                    "backdrop",
                    "jpg",
                    `movies/${movies[key].id}/`
                  );
                }),
              sharp(poster)
                .resize(200, null)
                .webp()
                .toBuffer()
                .then(x => {
                  return storeImageInBucket(
                    x,
                    "poster",
                    "webp",
                    `movies/${movies[key].id}/`
                  );
                }),
              sharp(backdrop || poster)
                .resize(144, 100)
                .webp()
                .toBuffer()
                .then(y => {
                  return storeImageInBucket(
                    y,
                    "backdrop",
                    "webp",
                    `movies/${movies[key].id}/`
                  );
                })
            ]);
          })
          .catch(err => {
            console.error(key, err);
            return Promise.resolve();
          });
      });
      return Promise.all(promises);
    })
    .catch(err => {
      console.error(err);
      return Promise.reject();
    })
    .then(() => {
      res.status(200).send("Merci");
    });
});

function storeImageInBucket(buffer, name, ext, baseDir = "") {
  const ts = Math.random();
  fs.writeFileSync(`/tmp/${name}${ts}.${ext}`, buffer);
  return bucket.upload(`/tmp/${name}${ts}.${ext}`, {
    destination: `${baseDir}${name}.${ext}`,
    gzip: true,
    public: true,
    metadata: {
      cacheControl: "max-age=604800"
    }
  });
}

function storeJsonInBucket(json, name, baseDir = "") {
  const ts = Math.random();
  fs.writeFileSync(`/tmp/${name}${ts}.json`, JSON.stringify(json));
  return bucket.upload(`/tmp/${name}${ts}.json`, {
    destination: `${baseDir}${name}.json`,
    gzip: true,
    public: true,
    metadata: {
      cacheControl: "no-cache"
    }
  });
}

const sitemap = functions.https.onRequest((req, res) => {
  bucket
    .file("showtimes.json")
    .download()
    .then(data => {
      const { movies } = JSON.parse(data);
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          ${Object.keys(movies)
            .map(
              movieId => `
            <url>
              <loc>https://www.cinelah.com/movies/${movieId}</loc>
            </url>
          `
            )
            .join("")}
        </urlset>
      `.trim();
      res
        .set("Cache-Control", "public, max-age=604800, s-maxage=604800")
        .set("Content-Type", "text/xml")
        .status(200)
        .send(xml);
    });
});

module.exports = {
  fixMovies,
  scrapeShowtimes,
  scrapeMovies,
  sitemap
};
