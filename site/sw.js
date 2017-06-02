const BUCKET = 'https://storage.googleapis.com/cinelah-92dbb.appspot.com';

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .catch(function() {
        return fetch(event.request);
      })
      .then(function(response) {
        return response || caches.match('/');
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    fetch(`${BUCKET}/showtimes.json`)
      .then(body => body.json())
      .then(function({ movies }) {
        const backdrops = Object.keys(movies).map(movie => `${BUCKET}/movies/${movie}/backdrop.jpg`);
        const posters = Object.keys(movies).map(movie => `${BUCKET}/movies/${movie}/poster.jpg`);
        const assets = [
          '/',
          '/favicon.png',
          '/bundle.js',
          'https://storage.googleapis.com/cinelah-92dbb.appspot.com/showtimes.json'
        ];
        return caches.open('cinelah')
          .then(function(cache) {
            return cache.addAll([
              ...assets,
              ...backdrops,
              ...posters
            ]);
          });
      })
    );
});
