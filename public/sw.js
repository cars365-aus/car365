/*
 * HireCar Service Worker
 *
 * Caching strategies (see design.md "Service Worker Caching Strategy"):
 *   - Static assets (CSS, JS, fonts)      -> Cache-first (versioned, indefinite)
 *   - Homepage + listing pages            -> Stale-while-revalidate
 *   - Images                              -> Cache-first with 7-day TTL
 *   - API calls                           -> Network-first
 *   - Navigation failure (offline)        -> Fallback to the /offline page
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4
 */

// Bump on asset changes to invalidate stale caches (e.g. the old placeholder
// PWA icons) — the activate handler deletes caches that don't match.
const VERSION = 'v3';
const STATIC_CACHE = `hirecar-static-${VERSION}`;
const PAGE_CACHE = `hirecar-pages-${VERSION}`;
const IMAGE_CACHE = `hirecar-images-${VERSION}`;

const EXPECTED_CACHES = [STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE];

// Images are considered fresh for 7 days.
const IMAGE_TTL = 7 * 24 * 60 * 60 * 1000;
const TIMESTAMP_HEADER = 'sw-cache-timestamp';

// Route used as the offline fallback for navigation requests.
const OFFLINE_URL = '/offline';

// Assets to warm the caches with on install.
const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/offline.html',
  '/manifest.json',
  '/LOGO.png',
];

// ---------------------------------------------------------------------------
// Request classification helpers
// ---------------------------------------------------------------------------

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:css|js|mjs|woff2?|ttf|otf|eot)$/i.test(url.pathname)
  );
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

// Homepage and vehicle listing pages use stale-while-revalidate.
function isHomeOrListing(url) {
  return (
    url.pathname === '/' ||
    url.pathname.startsWith('/search') ||
    url.pathname.startsWith('/locations') ||
    url.pathname.startsWith('/cars')
  );
}

// ---------------------------------------------------------------------------
// Caching strategy implementations
// ---------------------------------------------------------------------------

// Cache-first: serve from cache, otherwise fetch and cache.
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

// Stale-while-revalidate: serve cache immediately while refreshing in the
// background. Falls back to the network when nothing is cached yet.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkFetch);
}

// Network-first: try the network, fall back to cache on failure.
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Cache-first with a TTL. Stale entries are re-fetched. A timestamp header is
// attached to same-origin responses so freshness can be evaluated on reads.
async function cacheFirstWithTTL(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedAt = Number(cached.headers.get(TIMESTAMP_HEADER));
    const isFresh = cachedAt && Date.now() - cachedAt < ttl;
    if (isFresh) return cached;
    // Stale: fall through and try to refresh, but keep the stale copy as a
    // backup if the network is unavailable.
  }

  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      const stamped = await withTimestamp(response.clone());
      cache.put(request, stamped);
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

// Reconstruct a response with a cache timestamp header so TTL can be checked.
async function withTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set(TIMESTAMP_HEADER, Date.now().toString());
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Resolve the offline fallback for failed navigations.
async function offlineFallback() {
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

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !EXPECTED_CACHES.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch routing
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests; let the browser handle the rest.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // API calls: network-first.
  if (sameOrigin && isApiRequest(url)) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // Navigation requests (HTML pages).
  if (request.mode === 'navigate') {
    if (sameOrigin && isHomeOrListing(url)) {
      // Homepage + listing pages: stale-while-revalidate with offline fallback.
      event.respondWith(
        staleWhileRevalidate(request, PAGE_CACHE).then(
          (response) => response || offlineFallback()
        )
      );
    } else {
      // Other pages: network-first, fall back to offline page.
      event.respondWith(networkFirst(request, PAGE_CACHE).catch(offlineFallback));
    }
    return;
  }

  // Static assets: cache-first.
  if (sameOrigin && isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: cache-first with a 7-day TTL.
  if (isImageRequest(request, url)) {
    event.respondWith(
      cacheFirstWithTTL(request, IMAGE_CACHE, IMAGE_TTL).catch(
        () => caches.match(request)
      )
    );
    return;
  }

  // Everything else: try network, fall back to any cached copy.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
