<template>
  <article class="movie-times">
    <div class="movie-tile">
      <NuxtLink
        :to="`/movies/${movie.movieId}`"
        class="movie-tile-poster"
        v-bind:style="{ backgroundImage: movie.backdrop }"
      />
      <div class="movie-tile-description">
        <div class="movie-tile-description-title">{{ movie.movie }}</div>
        <div class="movie-tile-description-subtitle">
          <div class="movie-tile-description-rating" v-if="movie.rating">
            <svg
              class="icon-star"
              fill="#FFFFFF"
              height="48"
              viewBox="0 0 24 24"
              width="48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
              <path d="M0 0h24v24H0z" fill="none" />
            </svg>
            {{ movie.rating }}
          </div>
          <div class="movie-tile-description-rating" v-if="movie.genre">
            {{ movie.genre }}
          </div>
          <div class="movie-tile-description-rating" v-if="movie.country">
            {{ movie.country }}
          </div>
        </div>
      </div>
    </div>
    <div class="times">
      <movie-time
        v-for="showtime in movie.showtimesByCinemaEls"
        v-bind:url="showtime.showtime.url"
        v-bind:time="showtime.showtime.time"
        v-bind:key="showtime.showtime.time"
      ></movie-time>
    </div>
  </article>
</template>

<script>
import MovieTime from "../movies/MovieTime.vue";

export default {
  props: ["movie"],
  components: {
    MovieTime
  }
};
</script>
