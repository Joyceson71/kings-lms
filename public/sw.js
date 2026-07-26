const TILE_CACHE = 'iv-tiles-v1';
const APP_CACHE  = 'iv-app-v1';
const SYNC_TAG   = 'iv-location-sync';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(APP_CACHE).then(c =>
      c.addAll(['/', '/dashboard/iv-tracker', '/offline.html'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== TILE_CACHE && k !== APP_CACHE)
        .map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Cache OpenStreetMap tiles
  if (url.hostname.includes('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(async c => {
        const cached = await c.match(e.request);
        if (cached) return cached;
        try {
          const res = await fetch(e.request);
          if (res.ok) c.put(e.request, res.clone());
          return res;
        } catch { return cached || new Response('', {status: 503}); }
      })
    );
    return;
  }
  // Network-first for API calls, cache fallback for app shell
  if (url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r || caches.match('/offline.html'))
    )
  );
});

// Background sync — flush buffered location pings
self.addEventListener('sync', e => {
  if (e.tag === SYNC_TAG) {
    e.waitUntil((async () => {
      const db = await openIDB();
      const pings = await getAllPings(db);
      if (!pings.length) return;
      const res = await fetch('/api/iv/location-batch', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ pings })
      });
      if (res.ok) await clearPings(db);
    })());
  }
});

// Web Push
self.addEventListener('push', e => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'Kings IV', {
      body: data.body ?? 'Admin sent a message.',
      icon: '/logo.png',
      badge: '/badge.png',
      data: { url: data.url ?? '/dashboard/iv-tracker' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(cs => {
      const c = cs.find(c => c.url.includes('/dashboard'));
      if (c) { c.focus(); c.navigate(e.notification.data.url); }
      else clients.openWindow(e.notification.data.url);
    })
  );
});

// Simple IndexedDB helpers embedded in the SW
function openIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('iv-offline', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('pings', {autoIncrement:true});
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function getAllPings(db) {
  return new Promise(res => {
    const items = [];
    db.transaction('pings').objectStore('pings').openCursor().onsuccess = e => {
      const c = e.target.result;
      if (c) { items.push({key: c.key, ...c.value}); c.continue(); }
      else res(items);
    };
  });
}
function clearPings(db) {
  return new Promise(res => {
    db.transaction('pings','readwrite').objectStore('pings').clear().onsuccess = res;
  });
}
