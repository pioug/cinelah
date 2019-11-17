<template>
  <article>
    <h1>{{ displayDate }}</h1>
    <article>
      <cinema-day-movie
        v-for="movie in list"
        v-bind:movie="movie"
        v-bind:key="movie.id"
      ></cinema-day-movie>
    </article>
  </article>
</template>

<script>
import CinemaDayMovie from "./CinemaDayMovie.vue";

export default {
  props: ["displayDate", "list"],
  components: {
    CinemaDayMovie
  }
};
</script>
