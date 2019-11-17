<template>
  <main>
    <header>
      <div>
        <NuxtLink to="/">Cinelah</NuxtLink>
      </div>
      <div>
        <NuxtLink to="/" aria-label="Go to Now Showing">
          <svg
            aria-hidden="true"
            fill="#000000"
            height="48"
            viewBox="0 0 24 24"
            width="48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"
            />
            <path d="M0 0h24v24H0z" fill="none" />
          </svg>
        </NuxtLink>
        <NuxtLink to="/cinemas" aria-label="Go to Movie Theaters">
          <svg
            aria-hidden="true"
            fill="#000000"
            height="48"
            viewBox="0 0 24 24"
            width="48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
            <path d="M0 0h24v24H0z" fill="none" />
          </svg>
        </NuxtLink>
      </div>
    </header>
    <div>
      <cinema-day
        v-for="day in list"
        v-bind:displayDate="day.displayDate"
        v-bind:key="day.displayDate"
        v-bind:list="day.list"
      ></cinema-day>
    </div>
  </main>
</template>

<script>
import {
  addDays,
  format,
  isAfter,
  isToday,
  isTomorrow,
  parseISO
} from "date-fns";
import { getData } from "../../Ajax.js";
import CinemaDay from "./CinemaDay.vue";

export default {
  asyncData({ params: { id }, redirect }) {
    return getData().then(({ movies, cinemas, showtimes }) => {
      if (!cinemas[id]) {
        redirect('/');
      }

      const cinemaShowtimes = showtimes
        .filter(({ cinemaId }) => {
          return id === cinemaId;
        })
        .reduce((res, showtime) => {
          const showtimeDay =
            parseInt(showtime.time) < 6
              ? format(addDays(parseISO(showtime.date), -1), "yyyy-MM-dd")
              : showtime.date;
          const date = res.get(showtimeDay) || {
            date: showtimeDay,
            showtimes: []
          };
          date.showtimes.push(showtime);
          res.set(showtimeDay, date);
          return res;
        }, new Map());

      const list = Array.from(cinemaShowtimes.keys())
        .sort((a, b) => {
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        })
        .map(date => {
          const { showtimes } = cinemaShowtimes.get(date);
          const showtimesByMovie = showtimes.reduce((res, showtime) => {
            const movie = res.get(showtime.movie) || {
              movie: showtime.movie,
              movieId: showtime.movieId,
              rating: showtime.rating,
              country: showtime.country,
              genre: showtime.genre,
              showtimes: []
            };

            movie.showtimes.push(showtime);
            res.set(showtime.movie, movie);
            return res;
          }, new Map());

          const list = Array.from(showtimesByMovie.keys()).map(movie => {
            const {
              showtimes,
              movieId,
              rating,
              genre,
              country
            } = showtimesByMovie.get(movie);
            const showtimesByCinemaEls = showtimes
              .sort((a, b) => {
                if (parseInt(a.time) < 6) {
                  a = addDays(`${a.date} ${a.time}`, 1);
                } else {
                  a = addDays(`${a.date} ${a.time}`, 0);
                }

                if (parseInt(b.time) < 6) {
                  b = addDays(`${b.date} ${b.time}`, 1);
                } else {
                  b = addDays(`${b.date} ${b.time}`, 0);
                }

                if (isAfter(b, a)) return -1;
                if (isAfter(a, b)) return 1;
                return 0;
              })
              .map(showtime => {
                return { showtime };
              });

            return {
              movieId,
              movie,
              rating,
              genre,
              country,
              showtimesByCinemaEls,
              backdrop: movies[movieId].backdrop
            };
          });
          return { displayDate: displayDate(date), list };
        });

      return { movies, cinemas, showtimes, list, cinemaShowtimes };
    });
  },
  components: {
    CinemaDay
  }
};

function displayDate(date) {
  if (isToday(parseISO(date))) {
    return "Today";
  } else if (isTomorrow(parseISO(date))) {
    return "Tomorrow";
  } else {
    return format(parseISO(date), "iiii d MMMM");
  }
}
</script>

<style lang="sass">
@import '../../assets/style';
</style>
