<template>
  <main>
    <top-bar v-bind:title="movie.title"></top-bar>
    <movie-header v-bind:movie="movie"></movie-header>
    <movie-day
      v-for="day in list"
      v-bind:list="day.list"
      v-bind:displayDate="day.displayDate"
      v-bind:key="day.displayDate"
    ></movie-day>
    <article v-if="!list.length">
      <h1 class="error">No timing found</h1>
      <section>
        <p>Go back to <NuxtLink to="/">Now Showing</NuxtLink>.</p>
      </section>
    </article>
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
import MovieDay from "./MovieDay.vue";
import MovieHeader from "./MovieHeader.vue";
import TopBar from "../TopBar.vue";

export default {
  head() {
    return {
      title: `${this.movie.title} • Cinelah`,
      meta: [
        {
          hid: "description",
          name: "description",
          property: "og:description",
          content: `Find the perfect showtime to watch ${this.movie.title} in Singapore with Cinelah.`
        },
        {
          hid: "twitter:description",
          name: "twitter:description",
          content: `Find the perfect showtime to watch ${this.movie.title} in Singapore with Cinelah.`
        },
        {
          hid: "twitter:image",
          name: "twitter:image",
          content: this.movie.poster
        },
        {
          hid: "og:title",
          property: "og:title",
          content: `${this.movie.title} • Cinelah`
        },
        {
          hid: "twitter:title",
          name: "twitter:title",
          content: `${this.movie.title} • Cinelah`
        },
        {
          hid: "og:image",
          property: "og:image",
          content: this.movie.poster
        },
        {
          hid: "og:image:height",
          property: "og:image:height",
          content: "300"
        },
        {
          property: "og:image:type",
          content: "image/png"
        },
        {
          hid: "og:image:width",
          property: "og:image:width",
          content: "200"
        },
        {
          hid: "og:url",
          property: "og:url",
          content: `https://www.cinelah.com/${this.$route.fullPath}`
        }
      ]
    };
  },
  asyncData({ params: { id }, redirect }) {
    return getData().then(({ movies, cinemas, showtimes }) => {
      if (!movies[id]) {
        redirect("/");
      }

      const movieShowtimes = showtimes
        .filter(({ movieId }) => {
          return id === movieId;
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
      const list = Array.from(movieShowtimes.keys())
        .sort((a, b) => {
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        })
        .map(date => {
          const { showtimes } = movieShowtimes.get(date);
          const showtimesByCinema = showtimes.reduce((res, showtime) => {
            const cinema = res.get(showtime.cinemaId) || {
              cinema: showtime.cinemaId,
              showtimes: []
            };
            cinema.showtimes.push(showtime);
            res.set(showtime.cinemaId, cinema);
            return res;
          }, new Map());

          const list = Array.from(showtimesByCinema.keys())
            .sort((a, b) => {
              if (a < b) return -1;
              if (a > b) return 1;
              return 0;
            })
            .map(cinemaId => {
              const { showtimes } = showtimesByCinema.get(cinemaId);
              const showtimesByCinemaEls = showtimes
                .sort((a, b) => {
                  if (parseInt(a.time) < 6) {
                    a = addDays(parseISO(`${a.date}T${a.time}`), 1);
                  } else {
                    a = addDays(parseISO(`${a.date}T${a.time}`), 0);
                  }

                  if (parseInt(b.time) < 6) {
                    b = addDays(parseISO(`${b.date}T${b.time}`), 1);
                  } else {
                    b = addDays(parseISO(`${b.date}T${b.time}`), 0);
                  }

                  if (isAfter(b, a)) return -1;
                  if (isAfter(a, b)) return 1;
                  return 0;
                })
                .map(({ time, url }) => {
                  return { showtime: { time, url } };
                });
              const [group, name] = cinemas[cinemaId].name.split(" - ");
              return { cinemaId, group, name, showtimesByCinemaEls };
            });

          return { displayDate: displayDate(date), list };
        });

      return {
        movie: movies[id],
        list
      };
    });
  },
  components: {
    MovieHeader,
    MovieDay,
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
