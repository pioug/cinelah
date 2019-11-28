<template>
  <main>
    <top-bar></top-bar>
    <div class="cinemas">
      <h1>Movie Theaters</h1>
      <NuxtLink
        class="cinema-tile"
        :to="`/cinemas/${cinema.id}`"
        v-for="cinema in cinemaEls"
        v-bind:key="cinema.id"
      >
        <div class="cinema-tile-description-column-1">
          <div
            class="cinema-tile-description-group"
            v-bind:class="
              `cinema-tile-description-group ${cinema.group.toLowerCase()}`
            "
          >
            {{ cinema.group }}
          </div>
        </div>
        <div class="cinema-tile-description">
          <div class="cinema-tile-description-title">{{ cinema.name }}</div>
          <div class="cinema-tile-description-subtitle">
            <div class="cinema-tile-description-rating">
              <svg
                fill="#FFFFFF"
                height="24"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
                />
                <path d="M0 0h24v24H0V0z" fill="none" />
              </svg>
              {{ cinema.mrt }}
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </main>
</template>

<script>
import { getData } from "../../Ajax.js";
import TopBar from "../TopBar.vue";

export default {
  asyncData() {
    return getData().then(function({ cinemas }) {
      const cinemaEls = Object.keys(cinemas)
        .map(id => {
          const mrt = cinemas[id].mrt;
          const [group, name] = cinemas[id].name.split(" - ");
          return {
            id: id,
            group,
            name,
            mrt
          };
        })
        .sort((a, b) => {
          a = a.group.toLowerCase() + a.name.toLowerCase();
          b = b.group.toLowerCase() + b.name.toLowerCase();
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        });
      return { cinemaEls };
    });
  },
  components: {
    TopBar
  }
};
</script>
