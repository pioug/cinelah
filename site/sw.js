self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('cinelah').then(cache => {
      return cache.addAll([
        '/',
        '/?utm_source=pwa',
        '/index.html',
        '/index.html?utm_source=pwa',
        '/favicon.png',
        '/bundle.js'
      ])
        .then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (!navigator.onLine) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(response => response || caches.match('/', { ignoreSearch: true }))
    );
    return;
  }

  if (event.request.url.includes('.jpg') || event.request.url.includes('.json')) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true })
        .then(response => {
          const fetching = fetchThenCache(event);
          return response || fetching;
        })
    );
    return;
  }

  event.respondWith(fetchThenCache(event));
});

function fetchThenCache(event) {
  return fetch(event.request)
    .then(response => {
      return caches.open('cinelah')
        .then(cache => cache.put(event.request, response.clone()))
        .catch(() => caches.delete('cinelah'))
        .then(() => response);
    });
}
