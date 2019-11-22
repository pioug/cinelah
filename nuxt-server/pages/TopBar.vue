<template>
  <header>
    <div>
      <NuxtLink to="/">{{ title }}</NuxtLink>
    </div>
    <div>
      <NuxtLink
        to="/"
        aria-label="Go to Now Showing"
        exact-active-class="active"
      >
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
      <NuxtLink
        to="/cinemas"
        aria-label="Go to Movie Theaters"
        exact-active-class="active"
      >
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
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: "Cinelah"
    }
  }
};
</script>
