// BunkBuddy Service Worker
// Provides offline functionality with IndexedDB support

const CACHE_NAME = "bunkbuddy-v3"; // Increment version to clear old cache
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/utils.js",
  "/storage.js",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-180.png",
  "https://cdn.jsdelivr.net/npm/chart.js",
];

// Install event - cache files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log("Cache error:", err);
      })
  );
  self.skipWaiting();
});

// Fetch event - Network first for HTML/JS, cache first for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Network-first strategy for HTML and JavaScript files
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for images, CSS, and other assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
