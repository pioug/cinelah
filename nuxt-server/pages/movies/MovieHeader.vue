<template>
  <div
    class="movie-header"
    v-bind:style="{ backgroundImage: `url(${movie.poster})` }"
  >
    <div class="movie-header-poster-container">
      <img v-bind:src="movie.poster" v-bind:alt="`${movie.title} poster`" />
    </div>
    <dl>
      <dt v-if="movie.summary">Summary</dt>
      <dd v-if="movie.summary">{{ movie.summary }}</dd>
      <div style="display: flex; margin-top: 12px">
        <div style="margin-right: 16px" v-if="movie.rating">
          <dt>Rating</dt>
          <dd>{{ movie.rating }}</dd>
        </div>
        <div style="margin-right: 16px" v-if="movie.country">
          <dt>Country</dt>
          <dd>{{ movie.country }}</dd>
        </div>
        <div style="flex: 1" v-if="movie.genre">
          <dt>Genre</dt>
          <dd>{{ movie.genre }}</dd>
        </div>
      </div>
    </dl>
  </div>
</template>

<script>
export default {
  props: ["movie"]
};
</script>
