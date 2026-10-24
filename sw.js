var CACHE_NAME = 'sg-learning-hub-v67';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-152.png',
  './icons/icon-167.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/flag-of-singapore-hd.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Network-first for API calls (AI question generation)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('anthropic.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for the app shell, so a new release shows up the next time the app is
  // opened (no more "I still see the old version"). The cached copy is only used offline.
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }).then(function(response) {
      if (response && response.status === 200 && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
