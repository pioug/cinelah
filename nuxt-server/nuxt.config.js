export default {
  head: {
    title: "Cinelah",
    meta: [
      { charset: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes"
      },
      { name: "theme-color", content: "#3E86C6" },
      {
        name: "description",
        property: "og:description",
        content:
          "Find out now showing movies in Singapore and get showtimes for local cinemas. Cinelah aggregates timings from Cathay, Filmgarde, GV, Shaw and WE."
      },
      {
        name: "twitter:description",
        content:
          "Find out now showing movies in Singapore and get showtimes for local cinemas. Cinelah aggregates timings from Cathay, Filmgarde, GV, Shaw and WE."
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:creator", content: "@pioug" },
      {
        name: "twitter:image",
        content: "https://www.cinelah.com/open-graph.png"
      },
      { name: "twitter:title", content: "Cinelah" },
      {
        property: "og:image",
        content: "https://www.cinelah.com/open-graph.png"
      },
      { property: "og:image:height", content: "400" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "400" },
      { property: "og:site_name", content: "Cinelah" },
      { property: "og:title", content: "Cinelah" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.cinelah.com/" }
    ],
    link: [
      { rel: "apple-touch-icon", sizes: "192x192", href: "/favicon.png" },
      { rel: "icon", sizes: "192x192", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.json" }
    ]
  }
};
