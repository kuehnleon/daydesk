const CACHE_NAME = 'daydesk-v5';

const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
];

// Protected pages that require authentication — never serve from cache
// so the proxy redirect to /auth/signin is always respected
const PROTECTED_PATHS = ['/dashboard', '/calendar', '/settings', '/export', '/statistics'];

// Install event - cache static assets (production only)
self.addEventListener('install', (event) => {
  if (self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
    );
  }
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching entirely in dev (localhost) — SW is only needed for notifications
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-HTTP(S) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Skip auth-related requests (never cache)
  if (url.pathname.startsWith('/api/auth')) return;

  // Skip root path — it redirects to /dashboard, and caching redirects causes errors
  if (url.pathname === '/') return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful, non-redirected responses
          if (response.ok && !response.redirected) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache when offline
          return caches.match(request);
        })
    );
    return;
  }

  // Protected pages: network-first so auth redirects are always respected
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok && !networkResponse.redirected) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });

      // Return cached response immediately, update cache in background
      return cachedResponse || fetchPromise;
    })
  );
});

// Handle notification clicks - open/focus dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Try to focus any open window
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => client.navigate('/dashboard'));
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});
