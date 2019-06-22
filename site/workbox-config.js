module.exports = {
  globDirectory: "../public/",
  globIgnores: ["workbox-cli-config.js"],
  globPatterns: ["index.html", "bundle.js", "manifest.json", "*.png"],
  navigateFallback: "index.html",
  navigateFallbackWhitelist: [/^(?!.*(sitemap|robots))/],
  runtimeCaching: [
    {
      urlPattern: /https:\/\/storage.googleapis.com\/cinelah-92dbb.appspot.com\/movies\/.*\/.*\.webp/,
      handler: "CacheFirst"
    },
    {
      urlPattern: /https:\/\/storage.googleapis.com\/cinelah-92dbb.appspot.com\/.*\.json/,
      handler: "NetworkFirst"
    }
  ],
  swDest: "../public/sw.js"
};
