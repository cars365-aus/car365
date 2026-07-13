/*
 * Cars365 Service Worker
 *
 * Freshness-first strategy for a server-rendered, ISR-backed lead-gen site:
 *   - HTML navigations                    -> Network-first (always fresh
 *                                            inventory), offline fallback.
 *   - Hashed static assets (/_next/static)-> Cache-first (URLs are immutable,
 *                                            so this is safe and fast).
 *   - Images                              -> Cache-first with a 7-day TTL.
 *   - API calls                           -> Network-only (never cached).
 *
 * NOTE: HTML is deliberately NOT stale-while-revalidate. The previous version
 * served cached HTML that referenced stale hashed CSS/JS chunks, which made the
 * whole site appear stale after every deploy. Network-first avoids that.
 *
 * The cache names below are versioned; bumping the version makes the activate
 * handler purge ALL non-matching caches (including the legacy hirecar-* caches)
 * for every returning visitor.
 */

const VERSION = 'cars365-v1';
const STATIC_CACHE = `static-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;

const EXPECTED_CACHES = [STATIC_CACHE, IMAGE_CACHE];

const IMAGE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const TIMESTAMP_HEADER = 'sw-cache-timestamp';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [OFFLINE_URL, '/offline.html', '/manifest.json', '/LOGO.png'];

// ── Request classification ──────────────────────────────────────────────────
function isHashedStaticAsset(url) {
  // Only content-hashed build assets are safe to cache-first.
  return url.pathname.startsWith('/_next/static/');
}
function isFontAsset(url) {
  return /\.(?:woff2?|ttf|otf)$/i.test(url.pathname);
}
function isImageRequest(request, url) {
  return (
    request.destination === 'image' ||
    /\.(?:png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname)
  );
}
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

// ── Strategies ──────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNav(request) {
  try {
    return await fetch(request);
  } catch {
    const cached =
      (await caches.match(OFFLINE_URL)) || (await caches.match('/offline.html'));
    return (
      cached ||
      new Response('You are offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

async function cacheFirstWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const cachedAt = Number(cached.headers.get(TIMESTAMP_HEADER));
    if (cachedAt && Date.now() - cachedAt < ttl) return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      const headers = new Headers(response.headers);
      headers.set(TIMESTAMP_HEADER, Date.now().toString());
      const body = await response.clone().blob();
      cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => !EXPECTED_CACHES.includes(name)).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch routing ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // API: never cached — go straight to the network.
  if (sameOrigin && isApiRequest(url)) return;

  // HTML navigations: always fresh, offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // Immutable hashed build assets + fonts: cache-first.
  if (sameOrigin && (isHashedStaticAsset(url) || isFontAsset(url))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: cache-first with a 7-day TTL.
  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirstWithTTL(request, IMAGE_CACHE, IMAGE_TTL).catch(() => caches.match(request)));
    return;
  }

  // Everything else: network, falling back to any cached copy.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
