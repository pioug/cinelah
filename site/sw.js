const BUCKET = 'https://storage.googleapis.com/cinelah-92dbb.appspot.com';

self.addEventListener('fetch', function(event) {
  if (!navigator.onLine) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(response => response || caches.match('/'))
    );
    return;
  }

  if (event.request.url.includes('.json')) {
    const fetched = fetchThenCache(event);

    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(response => response || fetched.then(response => response.clone()))
    );

    fetched
      .then(response => response.clone().json())
      .then(function({ movies }) {
        return caches.open('cinelah')
          .then(cache => {
            return cache.addAll([
              ...Object.keys(movies).map(movie => `${BUCKET}/movies/${movie}/backdrop.jpg`),
              ...Object.keys(movies).map(movie => `${BUCKET}/movies/${movie}/poster.jpg`)
            ]);
          });
      });
    return;
  }

  if (event.request.url.includes('.jpg')) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(response => response || fetchThenCache(event))
    );
    return;
  }

  event.respondWith(fetch(event.request));
});

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('cinelah').then(cache => {
      return cache.addAll(['/', '/favicon.png', '/bundle.js']);
    })
  );
});

function fetchThenCache(event) {
  return fetch(event.request)
    .then(response => {
      return caches.open('cinelah')
        .then(cache => cache.put(event.request, response.clone()))
        .then(() => response);
    });
}
