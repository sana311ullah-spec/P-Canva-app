const CACHE_VERSION = 'pcanva-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;
const PHOTO_CACHE = `${CACHE_VERSION}-photos`;
const API_CACHE = `${CACHE_VERSION}-api`;

const CORE_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/icon.svg',
  '/src/assets/images/photo_modern_workspace_1795238221169.jpg',
  '/src/assets/images/photo_product_headphones_1795238221093.jpg',
  '/src/assets/images/photo_botanical_skincare_1795238221151.jpg',
  '/src/assets/images/photo_abstract_waves_1795238220934.jpg',
  '/src/assets/images/avatar_design_lead_1795238221705.jpg',
];

// Build step injects generated asset URLs here; stays empty array in dev mode
const BUILD_PRECACHE_URLS = /*__PRECACHE_MANIFEST__*/ [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const urls = Array.from(new Set([...CORE_PRECACHE_URLS, ...BUILD_PRECACHE_URLS]));
      await Promise.allSettled(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res && res.ok) {
              await cache.put(url, res);
            }
          } catch {
            // Skip any transient offline failure during background precache
          }
        }),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keepCaches = new Set([SHELL_CACHE, FONT_CACHE, PHOTO_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!keepCaches.has(key)) {
              return caches.delete(key);
            }
            return Promise.resolve(true);
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept WebSocket upgrades or Vite HMR/dev internals incorrectly
  if (url.pathname.startsWith('/ws')) return;

  // 1. Navigation requests (app shell): Network-first with fast cache fallback for instant offline load
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.put('/index.html', copy)));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          );
        }),
    );
    return;
  }

  // 2. Photo search API: Network-first with cached fallback
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/photos/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            event.waitUntil(caches.open(API_CACHE).then((c) => c.put(request, copy)));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ photos: [], hasMore: false, offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }),
    );
    return;
  }

  // Skip other /api/ endpoints from caching
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Google Fonts & external stock/starter photos: Cache-first
  if (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(request, res.clone());
        }
        return res;
      }),
    );
    return;
  }

  if (
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('images.pexels.com') ||
    url.hostname.includes('upload.wikimedia.org') ||
    url.hostname.includes('api.openverse.org')
  ) {
    event.respondWith(
      caches.open(PHOTO_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(request, res.clone());
        }
        return res;
      }),
    );
    return;
  }

  // 4. Same-origin app files (JS, CSS, modules, icons, images): Stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkPromise;
      }),
    );
  }
});
