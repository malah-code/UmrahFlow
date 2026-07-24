// UmrahFlow Service Worker
// Enables complete offline-first operation by caching static assets.

const CACHE_NAME = 'umrahflow-v16';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/icon.svg',
  './assets/icon-maskable.svg',
  './assets/ihram_attire.svg',
  './assets/tawaf_map.svg',
  './assets/sai_flow.svg',
  './assets/haircut_rules.svg'
];

// Install Event
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker: Pre-caching static assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache registry:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Cache First strategy)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // Return cache hit, otherwise request from network
      return cachedResponse || fetch(e.request).then(networkResponse => {
        // If it's a valid response, cache it dynamically for later
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Fallback in case both fail (should not happen for cached assets)
      return caches.match('./index.html');
    })
  );
});
