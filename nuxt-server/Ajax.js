import { isAfter, parseISO } from "date-fns";

const BUCKET = "https://storage.googleapis.com/cinelah-92dbb.appspot.com";
const IMG_FORMAT = "webp";

export function getData() {
  return fetch(
    "https://storage.googleapis.com/cinelah-92dbb.appspot.com/showtimes.json"
  )
    .then(body => body.json())
    .then(({ cinemas, movies, showtimes }) => {
      const now = new Date();
      showtimes = showtimes
        .filter(({ date, time }) => {
          return isAfter(parseISO(`${date}T${time}`), now);
        })
        .map(showtime => {
          return Object.assign(showtime, {
            movie: movies[showtime.movie].title,
            movieId: showtime.movie,
            cinema: cinemas[showtime.cinema].name,
            cinemaId: showtime.cinema,
            rating: movies[showtime.movie].rating,
            genre: movies[showtime.movie].genre,
            country: movies[showtime.movie].country
          });
        });
      movies = Object.keys(movies).reduce((acc, slug) => {
        acc[slug] = {
          backdrop: `url(${BUCKET}/movies/${slug}/backdrop.${IMG_FORMAT})`,
          poster: `${BUCKET}/movies/${slug}/poster.${IMG_FORMAT}`,
          ...movies[slug]
        };
        return acc;
      }, {});
      return { cinemas, movies, showtimes };
    });
}
