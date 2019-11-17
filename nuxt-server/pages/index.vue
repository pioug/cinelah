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
    <div class="movies">
      <h1>Now Showing</h1>
      <NuxtLink
        :to="`/movies/${movie.id}`"
        class="movie-tile"
        v-for="movie in movies"
        v-bind:key="movie.id"
      >
        <div
          class="movie-tile-poster"
          v-bind:style="{ backgroundImage: movie.backdrop }"
        />
        <div class="movie-tile-description">
          <div class="movie-tile-description-title">{{ movie.title }}</div>
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
      </NuxtLink>
    </div>
  </main>
</template>

<script>
import { getData } from "../Ajax.js";

export default {
  asyncData() {
    return getData();
  }
};
</script>

<style lang="sass">
@import '../assets/style';
</style>
