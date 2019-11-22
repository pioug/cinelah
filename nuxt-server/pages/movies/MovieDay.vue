<template>
  <article>
    <h1>{{ displayDate }}</h1>
    <movie-day-showtimes
      v-for="showtimes in list"
      v-bind:showtimes="showtimes"
      v-bind:key="showtimes.cinemaId"
    ></movie-day-showtimes>
  </article>
</template>

<script>
import MovieDayShowtimes from "./MovieDayShowtimes.vue";

export default {
  props: ["displayDate", "list"],
  components: {
    MovieDayShowtimes
  }
};
</script>
