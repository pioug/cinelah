<template>
  <article class="cinema-times">
    <div class="cinema-tile">
      <div
        class="cinema-tile-description-column-1"
        style="min-height: auto; padding-top: 0;"
      >
        <NuxtLink
          :to="`/cinemas/${showtimes.cinemaId}`"
          v-bind:class="
            `cinema-tile-description-group ${showtimes.group.toLowerCase()}`
          "
        >
          {{ showtimes.group }}
        </NuxtLink>
      </div>
      <div class="cinema-tile-description">
        <div class="cinema-tile-description-title" style="margin-bottom: 0">
          {{ showtimes.name }}
        </div>
      </div>
    </div>
    <div class="times">
      <movie-time
        v-for="showtime in showtimes.showtimesByCinemaEls"
        v-bind:url="showtime.showtime.url"
        v-bind:time="showtime.showtime.time"
        v-bind:key="showtime.showtime.time"
      ></movie-time>
    </div>
  </article>
</template>

<script>
import MovieTime from "./MovieTime.vue";

export default {
  props: ["showtimes"],
  components: {
    MovieTime
  }
};
</script>
