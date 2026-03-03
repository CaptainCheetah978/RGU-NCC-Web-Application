const CACHE_NAME = 'ncc-pwa-v3';

// App shell: pages and static assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/manifest.json',
    '/ncc-logo.png',
    '/rgu-logo.png',
];

// Install — pre-cache the shell
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate — delete old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch strategy:
//   - Supabase / API calls  → network-only (never cache auth/data)
//   - Everything else       → cache-first with network update in background
//
// Previously used network-first which caused ~30s hangs on slow connections
// because a slow network doesn't throw — it just stalls the request.
// Cache-first with background revalidation serves the cached shell instantly.

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Always go to network for Supabase, API routes, and non-GET requests
    if (
        event.request.method !== 'GET' ||
        url.hostname.includes('supabase.co') ||
        url.pathname.startsWith('/api/')
    ) {
        return; // Let the browser handle it normally
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cached = await cache.match(event.request);

            // Kick off a network fetch to keep cache fresh (background update)
            const networkFetch = fetch(event.request)
                .then(response => {
                    // Only cache valid responses
                    if (response && response.status === 200 && response.type === 'basic') {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                })
                .catch(() => null); // Network failure is fine — we have cache

            // Return cached version immediately if available (stale-while-revalidate)
            // Otherwise wait for network
            return cached || networkFetch;
        })
    );
});
