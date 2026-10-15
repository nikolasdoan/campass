/* CampusPass service worker.
 *
 * What it is for: the installed app has to open, and show the deal list, on a phone with no
 * signal. That is the whole job, and every rule below is the smallest one that does it.
 *
 *   app-route navigations  network-first → cached app shell ("/") → offline page
 *   other navigations      network → offline page (/admin.html, /auth/*, unknown paths: never
 *                          the student app in their place, never the browser's error page)
 *   GET /api/deals         stale-while-revalidate (public list, same for everyone); stored at
 *                          install, so a single visit is enough to see the list offline
 *   same-origin assets     stale-while-revalidate (css/js/svg/png/…)
 *   everything else        not touched: the browser goes to the network as if we were not here
 *
 * Never cached, on purpose: /api/me, /api/deals/:id (terms are shown only to a signed-in
 * user, so a cached copy would leak one person's view to the next), any other /api/*,
 * /auth/*, /admin/*, and every non-GET. Cross-origin requests (Google Fonts) are left alone.
 * A failed NAVIGATION to one of those gets the offline page (nothing is stored for it).
 *
 * Stale code is the classic way a PWA becomes unshippable, so: the HTML is network-first, a
 * new sw.js waits until the reader taps 「有新版本 · 重新整理」 (pwa.js), and bumping VERSION
 * drops every older campuspass-* cache on activate. Reference assets as /app.js?v=<n>: a new
 * value is a new cache key, fetched fresh. Old ?v= copies are pruned, but only ever in favour
 * of the version the cached shell references (see prune()).
 */
const VERSION = 'v2';
const CACHE = `campuspass-${VERSION}`;
const SHELL = '/';
/* offline.html is served at /offline: Workers assets (html_handling: auto-trailing-slash)
   answers /offline.html with a 307 to /offline, and a redirected response cannot be stored
   and replayed for a navigation. */
const OFFLINE = '/offline';
const DEALS = '/api/deals';

/* Fixed entries. The versioned CSS/JS are not listed here: they are read out of the shell
   HTML at install (shellAssets), so the cache holds exactly the URLs the page asks for. */
const PRECACHE = [SHELL, OFFLINE, DEALS, '/manifest.webmanifest', '/icons/icon.svg'];

/* How long a navigation waits for the network before the cached shell is shown instead, when
   there is one. A train tunnel is not "offline" — fetch just hangs — and an app that shows a
   blank screen for 30s there is worse than one that shows yesterday's list. */
const NAV_TIMEOUT_MS = 5000;

const NEVER = [/^\/api\/(?!deals$)/, /^\/auth(\/|$)/, /^\/admin(\/|$)/];
const STATIC_EXT = /\.(?:css|js|mjs|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|webmanifest)$/i;
/* The paths the student app (index.html) renders; must match app.js parse(). Only these may
   be answered with the cached shell. */
const APP_ROUTES = [/^\/$/, /^\/saved\/?$/, /^\/me\/?$/, /^\/merchants\/?$/, /^\/deal\/[A-Za-z0-9_-]{1,64}\/?$/,
  /^\/m\/[A-Za-z0-9_-]{8,64}\/?$/, /^\/r\/[A-Za-z0-9]{4,12}\/?$/];

const sameOrigin = url => url.origin === self.location.origin;
const isNever = pathname => NEVER.some(re => re.test(pathname));
const isAppRoute = pathname => APP_ROUTES.some(re => re.test(pathname));

/* Workers assets answers a missing file with index.html and a 200 (single-page-application
   not_found_handling). That must never be stored as styles.css or app.js. */
function isUsable(response, pathname) {
  if (!response || !response.ok || response.type === 'opaque' || response.redirected) return false;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (STATIC_EXT.test(pathname) && type.includes('text/html')) return false;
  if (pathname === DEALS && !type.includes('json')) return false;
  return true;
}

/* What may be stored from a hand-over or the shell: same-origin static files and the public
   deal list (exactly /api/deals, no query). Never sw.js, never anything private. */
function storable(url) {
  if (!sameOrigin(url) || url.pathname === '/sw.js' || isNever(url.pathname)) return false;
  if (url.pathname === DEALS) return !url.search;
  return STATIC_EXT.test(url.pathname);
}

/* The same-origin assets the shell HTML references (<link href>, <script src>), absolute. */
function shellAssets(html) {
  const out = new Set();
  const re = /<(?:link|script)\b[^>]*?\s(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const url = new URL(m[1].replace(/&amp;/g, '&'), self.location.origin);
      if (storable(url) && url.pathname !== DEALS) out.add(url.href);
    } catch (e) { /* ignore */ }
  }
  return [...out].slice(0, 60);
}

/* What the cached shell asks for, for pruning: its exact asset URLs, and its ?v= values (a
   module imported by app.js, e.g. /js/util.js?v=8, is current when the shell is on v=8). */
async function shellRefs(cache) {
  const res = await cache.match(SHELL);
  if (!res) return null;
  const urls = new Set(shellAssets(await res.text()));
  const versions = new Set();
  for (const u of urls) { const v = new URL(u).searchParams.get('v'); if (v) versions.add(v); }
  return { urls, versions };
}

async function put(cache, url, init) {
  try {
    const response = await fetch(new Request(url, { credentials: 'same-origin', ...init }));
    if (isUsable(response, new URL(url, self.location.origin).pathname)) {
      await cache.put(url, response);
      return response;
    }
  } catch (e) { /* missing or offline: skip this one */ }
  return null;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* Each one on its own: one 404 must not fail the whole install (addAll is all-or-nothing). */
    await Promise.all(PRECACHE.map(url => put(cache, url, { cache: 'reload' })));
    /* Then the CSS/JS/fonts this exact shell references, at the versions it references. */
    const shell = await cache.match(SHELL);
    if (shell) {
      const assets = shellAssets(await shell.text());
      await Promise.all(assets.map(async url => { if (!(await cache.match(url))) await put(cache, url); }));
    }
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
  /* pwa.js sends what the page loaded before this worker controlled it (its <script>/<link>
     URLs, the ES modules under /js/, fonts, images, /api/deals). Without this, a reader who
     installs on the first visit and next opens the app offline could miss some of them. */
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) event.waitUntil(cacheUrls(data.urls.slice(0, 100)));
});

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE);
  await Promise.all(urls.map(async href => {
    try {
      const url = new URL(href, self.location.origin);
      if (!storable(url)) return;
      if (await cache.match(url.href)) return;
      await put(cache, url.href);
    } catch (e) { /* skip */ }
  }));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (!sameOrigin(url)) return;                                // Google Fonts etc.: straight to network

  if (isNever(url.pathname)) {
    /* Signed-in or private: never cached. A navigation there (使用 Google 登入 tapped offline)
       still gets our offline page instead of the browser's error page, which in an installed
       app has no way back. Online, the network response passes through untouched. */
    /* Not the OAuth callback: it arrives from Google (cross-site, never offline), and is left
       entirely to the browser so its SameSite cookie handling is exactly the default. */
    if (request.mode === 'navigate' && !/\/callback$/.test(url.pathname)) {
      event.respondWith(fetch(request).catch(offlinePage));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigate(event, request, url));
    return;
  }
  if (url.pathname === DEALS) {
    event.respondWith(staleWhileRevalidate(event, request, url, { notify: true }));
    return;
  }
  if (url.pathname === '/sw.js') return;
  if (STATIC_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request, url, { notify: false }));
  }
});

async function offlinePage() {
  const cache = await caches.open(CACHE);
  return (await cache.match(OFFLINE)) ||
    new Response('目前離線，請連線後再試 · You are offline.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
}

async function navigate(event, request, url) {
  const cache = await caches.open(CACHE);
  const appRoute = isAppRoute(url.pathname);
  const fallback = async () =>
    (url.pathname === OFFLINE && (await cache.match(OFFLINE))) ||
    (appRoute && (await cache.match(SHELL))) ||
    offlinePage();

  const network = fetch(request).then(response => {
    /* Keep the shell fresh from every visit to the start page (start_url is /?source=pwa).
       Only "/": another HTML page stored under the shell key would open in its place offline. */
    if (url.pathname === '/' && isUsable(response, url.pathname) &&
        (response.headers.get('content-type') || '').includes('text/html')) {
      const copy = response.clone();
      event.waitUntil(cache.put(SHELL, copy).then(() => pruneAll(cache)).catch(() => {}));
    }
    return response;
  });

  const haveShell = appRoute && !!(await cache.match(SHELL));
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
    if (url.search && url.pathname !== DEALS) await prune(cache, request.url);
    return response;
  });

  if (cached) {
    event.waitUntil(refresh.catch(() => {}));
    return cached;
  }
  try {
    return await refresh;
  } catch (e) {
    /* Offline and never fetched with exactly this query: the same path with another query is
       better than nothing. Prefer the copy the current shell references. */
    const near = await cache.keys(request, { ignoreSearch: true });
    if (near.length) {
      const refs = await shellRefs(cache);
      const pick = (refs && near.find(k => isCurrent(k.url, refs))) || near[near.length - 1];
      const hit = await cache.match(pick);
      if (hit) return hit;
    }
    throw e;
  }
}

function isCurrent(href, refs) {
  if (!refs) return false;
  if (refs.urls.has(href)) return true;
  const v = new URL(href).searchParams.get('v');
  return !!v && refs.versions.has(v);
}

/* Several ?v= copies of one file (/app.js?v=7, /app.js?v=8): keep the copy the cached shell
   references, and the one just fetched (the shell may be a moment behind a fresh deploy);
   drop the rest. With nothing current among them, keep the highest version. Never deletes the
   version the shell asks for, so an offline launch never mixes old JS/CSS under new HTML. */
async function prune(cache, justFetched) {
  const same = await cache.keys(justFetched, { ignoreSearch: true });
  if (same.length < 2) return;
  const refs = await shellRefs(cache);
  const current = same.filter(k => isCurrent(k.url, refs));
  let keep;
  if (current.length) keep = new Set([...current.map(k => k.url), justFetched]);
  else {
    const num = k => { const v = new URL(k.url).searchParams.get('v'); return v && /^\d+$/.test(v) ? Number(v) : -1; };
    const newest = same.reduce((a, b) => (num(b) >= num(a) ? b : a));
    keep = new Set([newest.url, justFetched]);
  }
  await Promise.all(same.filter(k => !keep.has(k.url)).map(k => cache.delete(k)));
}

/* After the shell itself changed (a deploy): drop every ?v= copy the new shell does not ask
   for, wherever the shell asks for some version of that path. */
async function pruneAll(cache) {
  const refs = await shellRefs(cache);
  if (!refs || !refs.versions.size) return;
  const keys = await cache.keys();
  const byPath = new Map();
  for (const k of keys) {
    const u = new URL(k.url);
    if (!u.searchParams.get('v') || u.pathname === DEALS) continue;
    if (!byPath.has(u.pathname)) byPath.set(u.pathname, []);
    byPath.get(u.pathname).push(k);
  }
  const drops = [];
  for (const list of byPath.values()) {
    if (list.length < 2 || !list.some(k => isCurrent(k.url, refs))) continue;
    for (const k of list) if (!isCurrent(k.url, refs)) drops.push(cache.delete(k));
  }
  await Promise.all(drops);
}
