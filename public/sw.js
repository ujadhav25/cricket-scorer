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
  // Do NOT self.skipWaiting() here — wait for user confirmation
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Take control of all pages immediately after activation
  self.clients.claim();
});

// Handle skip-waiting message from the update prompt
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  // Build rich notification actions and data lines for the score card look
  const score = data.score;
  const actions = [];

  // On Android, we can add action buttons
  if (score) {
    actions.push({ action: 'view', title: '📊 View Scorecard' });
  }

  // Build a multi-line body that mimics a score card
  let body = data.body;
  if (score) {
    const lines = [];
    lines.push(`${score.teamA}: ${score.scoreA}`);
    lines.push(`${score.teamB}: ${score.scoreB}`);
    if (score.status) lines.push(score.status);
    body = lines.join('\n');
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: data.score ? `match-score-${data.url}` : 'cricscorer',  // same tag = replaces previous score notif
      renotify: true,
      data: { url: data.url ?? '/' },
      vibrate: data.score?.event === 'WICKET' ? [300, 100, 300, 100, 300] :
               data.score?.event === 'SIX'    ? [200, 100, 200] :
               data.score?.event === 'FOUR'   ? [150] :
               [200, 100, 200],
      actions,
      // Silent for boundary updates, vibrate for wickets
      silent: data.score?.event === 'FOUR',
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
