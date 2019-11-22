<template>
  <a class="time" target="_blank" rel="noopener" v-bind:href="url">
    {{ time }}
  </a>
</template>

<script>
export default {
  props: ["time", "url"]
};
</script>
