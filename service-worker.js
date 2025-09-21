const CACHE_VERSION = "v3";
const CACHE_NAME = `oracle-mode-cache-${CACHE_VERSION}`;
const BASE = "/oracle_image_converter";

// List of resources to cache

const urlsToCache = [
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/assets/css/oracle-image-processing.css`,
  `${BASE}/assets/js/oracle-image-processing.js`,
  `${BASE}/assets/images/icon-16.png`,
  `${BASE}/assets/images/icon-32.png`,
  `${BASE}/assets/images/icon-192.jpg`,
  `${BASE}/assets/images/icon-512.png`,
  `${BASE}/assets/images/icon-maskable-192.png`,
  `${BASE}/assets/images/icon-maskable-512.png`,
  `${BASE}/assets/js/omggif.min.js`,
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log("Cache install failed:", error);
        // Continue even if some resources fail to cache
        return caches.open(CACHE_NAME).then((cache) => {
          const cachePromises = urlsToCache.map((url) => {
            return cache.add(url).catch((err) => {
              console.log("Failed to cache:", url, err);
            });
          });
          return Promise.allSettled(cachePromises);
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Return a fallback page for navigation requests when offline
        if (event.request.destination === "document") {
          return caches.match("/index.html");
        }
      })
  );
});

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle any background sync tasks here
      console.log("Background sync triggered")
    );
  }
});

// Push notification handling (optional for future use)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "/assets/images/icon-192.jpg",
    badge: "/assets/images/icon-192.jpg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
  };

  event.waitUntil(self.registration.showNotification("Oracle Mode", options));
});
