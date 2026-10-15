/* CampusPass service worker.
 *
 * What it is for: the installed app has to open, and show the deal list, on a phone with no
 * signal. That is the whole job, and every rule below is the smallest one that does it.
 *
 *   navigations           network-first → cached app shell ("/") → offline.html
 *   GET /api/deals        stale-while-revalidate (public list, same for everyone)
 *   same-origin assets    stale-while-revalidate (css/js/svg/png/…)
 *   everything else       not touched: the browser goes to the network as if we were not here
 *
 * Never cached, on purpose: /api/me, /api/deals/:id (terms are shown only to a signed-in
 * user, so a cached copy would leak one person's view to the next), any other /api/*,
 * /auth/*, /admin/*, and every non-GET. Cross-origin requests (Google Fonts) are left alone.
 *
 * Stale code is the classic way a PWA becomes unshippable, so: the HTML is network-first, a
 * new sw.js waits until the reader taps 「有新版本 · 重新整理」 (pwa.js), and bumping VERSION
 * drops every older campuspass-* cache on activate. Reference assets as /app.js?v=<hash> and
 * a new hash is a new cache key, fetched fresh; old ?v= copies of the same file are pruned.
 */
const VERSION = 'v1';
const CACHE = `campuspass-${VERSION}`;
const SHELL = '/';
/* offline.html is served at /offline: Workers assets (html_handling: auto-trailing-slash)
   answers /offline.html with a 307 to /offline, and a redirected response cannot be stored
   and replayed for a navigation. */
const OFFLINE = '/offline';

/* Each one cached on its own: the UI files may be missing or renamed while the app is being
   built, and one 404 must not fail the whole install (cache.addAll is all-or-nothing). */
const PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/pwa.js',
  OFFLINE,
  '/icons/icon.svg',
  '/manifest.webmanifest',
];

/* How long a navigation waits for the network before the cached shell is shown instead, when
   there is one. A train tunnel is not "offline" — fetch just hangs — and an app that shows a
   blank screen for 30s there is worse than one that shows yesterday's list. */
const NAV_TIMEOUT_MS = 5000;

const NEVER = [/^\/api\/(?!deals$)/, /^\/auth(\/|$)/, /^\/admin(\/|$)/];
const STATIC_EXT = /\.(?:css|js|mjs|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|webmanifest)$/i;

/* Workers assets answers a missing file with index.html and a 200 (single-page-application
   not_found_handling). That must never be stored as styles.css or app.js. */
function isUsable(response, pathname) {
  if (!response || !response.ok || response.type === 'opaque' || response.redirected) return false;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (STATIC_EXT.test(pathname) && type.includes('text/html')) return false;
  return true;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(async url => {
      try {
        const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
        // /index.html redirects to / on Workers assets; "/" already holds that document.
        if (isUsable(response, new URL(url, self.location.origin).pathname)) await cache.put(url, response);
      } catch (e) {
        /* Missing or offline: skip this one, keep installing. */
      }
    }));
    /* The very first install has nothing to replace, so it may take over at once. An UPDATE
       waits for the page to ask (SKIP_WAITING from pwa.js's toast), so a reader is never
       switched to new code in the middle of what they are doing. */
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('campuspass-') && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const data = event.data;
  if (!data) return;
  if (data === 'SKIP_WAITING' || data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  /* pwa.js sends the same-origin assets the page loaded before this worker controlled it (the
     ES modules under /js/, fonts, images). Without this, a reader who installs on the first
     visit and next opens the app offline would get the shell and app.js but not its imports. */
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) event.waitUntil(cacheUrls(data.urls.slice(0, 100)));
});

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE);
  await Promise.all(urls.map(async href => {
    try {
      const url = new URL(href, self.location.origin);
      if (url.origin !== self.location.origin || !STATIC_EXT.test(url.pathname) || url.pathname === '/sw.js') return;
      if (NEVER.some(re => re.test(url.pathname))) return;
      if (await cache.match(url.href)) return;
      const response = await fetch(url.href, { credentials: 'same-origin' });
      if (isUsable(response, url.pathname)) await cache.put(url.href, response);
    } catch (e) { /* skip */ }
  }));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;          // Google Fonts etc.: straight to network
  if (NEVER.some(re => re.test(url.pathname))) return;        // signed-in or private: never cached

  if (request.mode === 'navigate') {
    event.respondWith(navigate(event, request, url));
    return;
  }
  if (url.pathname === '/api/deals') {
    event.respondWith(staleWhileRevalidate(event, request, url, { notify: true }));
    return;
  }
  if (url.pathname === '/sw.js') return;
  if (STATIC_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request, url, { notify: false }));
  }
});

async function navigate(event, request, url) {
  const cache = await caches.open(CACHE);
  const fallback = async () =>
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match(SHELL)) ||
    (await cache.match(OFFLINE)) ||
    new Response('目前離線，請連線後再試 · You are offline.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });

  const network = fetch(request).then(response => {
    /* Keep the shell fresh from every visit to the start page (start_url is /?source=pwa).
       Only "/": another HTML page stored under the shell key would open in its place offline. */
    if (url.pathname === '/' && isUsable(response, url.pathname) &&
        (response.headers.get('content-type') || '').includes('text/html')) {
      const copy = response.clone();
      event.waitUntil(cache.put(SHELL, copy).catch(() => {}));
    }
    return response;
  });

  const haveShell = !!(await cache.match(SHELL));
  if (!haveShell) return network.catch(fallback);

  let timer;
  const timeout = new Promise(resolve => { timer = setTimeout(resolve, NAV_TIMEOUT_MS, null); });
  try {
    const first = await Promise.race([network, timeout]);
    if (first) return first;
    // Slow network: show the cached shell now; the request carries on and refreshes the cache.
    event.waitUntil(network.catch(() => {}));
    return fallback();
  } catch (e) {
    return fallback();
  } finally {
    clearTimeout(timer);
  }
}

async function staleWhileRevalidate(event, request, url, { notify }) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  // Cloned now: the page will have read `cached` by the time the network answers.
  const before = notify && cached ? cached.clone() : null;

  const refresh = fetch(request).then(async response => {
    if (!isUsable(response, url.pathname)) return response;
    const fresh = response.clone();
    if (before) {
      /* Tell open pages when the deal list changed under them, so they can re-render without
         a reload. Compared by body: the list is small and carries no ETag. */
      const [was, now] = await Promise.all([before.text(), response.clone().text()]);
      if (was !== now) {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const c of clients) c.postMessage({ type: 'cp:deals-updated', url: request.url });
      }
    }
    await cache.put(request, fresh);
    if (url.search) await prune(cache, request);
    return response;
  });

  if (cached) {
    event.waitUntil(refresh.catch(() => {}));
    return cached;
  }
  try {
    return await refresh;
  } catch (e) {
    /* Offline and never fetched with exactly this query: the same path with any query is
       better than nothing (e.g. /api/deals?school=NTU when only /api/deals was cached). */
    const near = await cache.match(request, { ignoreSearch: true });
    if (near) return near;
    throw e;
  }
}

/* One copy per path for versioned assets (/app.js?v=abc): drop the older ?v= entries. */
async function prune(cache, request) {
  if (new URL(request.url).pathname === '/api/deals') return; // different queries are different lists
  const same = await cache.keys(request, { ignoreSearch: true });
  await Promise.all(same.filter(k => k.url !== request.url).map(k => cache.delete(k)));
}
