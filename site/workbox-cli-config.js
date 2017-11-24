module.exports = {
  globDirectory: '../public/',
  globIgnores: [
    'workbox-cli-config.js'
  ],
  globPatterns: [
    'index.html',
    'bundle.js',
    'manifest.json',
    '*.png'
  ],
  navigateFallback: 'index.html',
  runtimeCaching: [{
    urlPattern: 'https://storage.googleapis.com/cinelah-92dbb.appspot.com/movies/:title/:type.webp',
    handler: 'cacheFirst'
  }, {
    urlPattern: 'https://storage.googleapis.com/cinelah-92dbb.appspot.com/(.*).json',
    handler: 'staleWhileRevalidate'
  }],
  swDest: '../public/sw.js',
};
