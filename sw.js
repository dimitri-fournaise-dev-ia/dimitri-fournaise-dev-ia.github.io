const CACHE_NAME = 'dimitri-portfolio-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/flowsteo.html',
  '/css/style.css',
  '/js/main.js',
  '/images/profile/dimitri-hero.jpg',
  '/images/profile/dimitri-profile.jpg',
  '/images/profile/dimitri-about.jpg',
  '/images/flowsteo/logo.png',
  '/images/flowsteo/flowsteo-hero.jpg',
  '/images/flowsteo/flowsteo-dashboard-main.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});