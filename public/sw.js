const CACHE_NAME = 'cricket-scorer-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json'];
const BALL_QUEUE_STORE = 'ball-queue';

// Open IndexedDB for queuing offline balls
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('cricscorer-offline', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(BALL_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueBall(url, body) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BALL_QUEUE_STORE, 'readwrite');
    tx.objectStore(BALL_QUEUE_STORE).add({ url, body, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
  const db = await openDB();
  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction(BALL_QUEUE_STORE, 'readonly');
    const req = tx.objectStore(BALL_QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      });
      if (res.ok) {
        // Remove from queue
        const tx = db.transaction(BALL_QUEUE_STORE, 'readwrite');
        tx.objectStore(BALL_QUEUE_STORE).delete(item.id);
      }
    } catch (_) {
      // Still offline — stop trying
      break;
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Intercept ball recording POST requests to queue when offline
  if (event.request.method === 'POST' && url.includes('/api/matches/') && url.endsWith('/ball')) {
    event.respondWith(
      event.request.clone().text().then(async (body) => {
        try {
          return await fetch(event.request);
        } catch (_) {
          // Offline — queue the ball
          await queueBall(url, body);
          return new Response(JSON.stringify({ queued: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })
    );
    return;
  }

  // Only cache GET requests, skip API routes
  if (event.request.method !== 'GET' || url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached ?? networkFetch;
    })
  );
});

// Flush queued balls when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-ball-queue') {
    event.waitUntil(flushQueue());
  }
});

self.addEventListener('online', () => {
  flushQueue().catch(() => {});
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = { title: 'CricScorer', body: 'New update', url: '/' };
  try {
    data = event.data?.json() ?? data;
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/manifest.json',
      badge: '/manifest.json',
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
