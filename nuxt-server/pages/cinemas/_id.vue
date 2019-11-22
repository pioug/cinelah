<template>
  <main>
    <top-bar v-bind:title="cinema.name"></top-bar>
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
import TopBar from "../TopBar.vue";

export default {
  asyncData({ params: { id }, redirect }) {
    return getData().then(({ movies, cinemas, showtimes }) => {
      if (!cinemas[id]) {
        redirect("/");
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
                  a = addDays(parseISO(`${a.date} ${a.time}`), 1);
                } else {
                  a = addDays(parseISO(`${a.date} ${a.time}`), 0);
                }

                if (parseInt(b.time) < 6) {
                  b = addDays(parseISO(`${b.date} ${b.time}`), 1);
                } else {
                  b = addDays(parseISO(`${b.date} ${b.time}`), 0);
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

      return {
        movies,
        cinemas,
        showtimes,
        list,
        cinemaShowtimes,
        cinema: cinemas[id]
      };
    });
  },
  components: {
    CinemaDay,
    TopBar
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
