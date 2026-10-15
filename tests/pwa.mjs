// CampusPass PWA checks (Playwright, Chromium): service worker, offline, update toast, install card.
// Needs `npm run dev` on :8787 with DEV_LOGIN=true. Run: node tests/pwa.mjs
//
// Offline here means offline for the page AND the service worker. Playwright's setOffline()
// alone does not reach the worker (its fetch() still gets through, so offline checks pass
// falsely); PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 plus a context route that aborts
// every request does. Routing also turns off the HTTP cache, so only the worker can answer.
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';
const { chromium } = await import('playwright');

const B = process.env.BASE || 'http://localhost:8787';
const FULL = '58a27e58ee'; // a deal with phone + address
const ANDROID = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36' };
const IPHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' };

const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, ms = 8000, step = 150) => { const end = Date.now() + ms; let v; while (Date.now() < end) { try { v = await fn(); if (v) return v; } catch {} await sleep(step); } return v; };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function newContext(opts) {
  const ctx = await browser.newContext(opts);
  ctx._off = false;
  await ctx.route('**/*', (route) => (ctx._off ? route.abort('internetdisconnected') : route.continue()));
  return ctx;
}
async function offline(ctx) { ctx._off = true; await ctx.setOffline(true); }
async function online(ctx) { ctx._off = false; await ctx.setOffline(false); }
const cacheKeys = (page) => page.evaluate(async () => {
  const out = [];
  for (const n of await caches.keys()) if (n.startsWith('campuspass-')) for (const r of await (await caches.open(n)).keys()) out.push(r.url.replace(location.origin, ''));
  return out;
});
const pageAssets = (page) => page.evaluate(() => [...document.querySelectorAll('script[src],link[rel=stylesheet][href],link[rel=modulepreload][href]')]
  .map((e) => e.getAttribute('src') || e.getAttribute('href')).filter((u) => u.startsWith('/')));
const rect = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null; }, sel);
async function gotoSafe(page, url) { try { return await page.goto(url, { waitUntil: 'load', timeout: 15000 }); } catch (e) { return e; } }
const isOfflinePage = (page) => page.evaluate(() => /離線/.test(document.title) && !!document.getElementById('retry')).catch(() => false);

/* ================= 1. Install, single visit, then offline ================= */
{
  const ctx = await newContext(ANDROID);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(B + '/', { waitUntil: 'load' });
  const controlled = await until(() => page.evaluate(() => !!navigator.serviceWorker.controller), 10000);
  check('install: the service worker controls the first page (no reload)', controlled);

  // One visit, no reload: the cache already has the deal list and the page's own versioned assets.
  const assets = await pageAssets(page);
  const keys = await until(async () => { const k = await cacheKeys(page); return k.includes('/api/deals') && assets.every((a) => k.includes(a)) ? k : null; }, 8000) || await cacheKeys(page);
  check('single visit: /api/deals is cached', keys.includes('/api/deals'));
  const missing = assets.filter((a) => !keys.includes(a));
  check('single visit: every <script>/<link> asset the page requested is cached', !missing.length, missing.join(', '));
  const stray = keys.filter((k) => ['/index.html', '/styles.css', '/app.js'].includes(k));
  check('precache holds no URL the page never requests', !stray.length, stray.join(', '));
  const priv = keys.filter((k) => /^\/api\/(?!deals$)|^\/auth|^\/admin/.test(k));
  check('no per-user /api/*, /auth/*, /admin/* response is cached', !priv.length, priv.join(', '));

  await offline(ctx);
  // Harness: the worker's own fetch() must fail too. Online it would store this new key.
  await page.evaluate(() => fetch('/icons/icon-192.png?probe=' + Date.now()).catch(() => null));
  await sleep(500);
  const probed = (await cacheKeys(page)).filter((k) => k.includes('probe='));
  check('harness: offline reaches the service worker (its fetch fails too)', !probed.length, probed.join(', '));
  await page.close();

  for (const path of ['/', '/?source=pwa', `/deal/${FULL}`]) {
    const p = await ctx.newPage();
    await gotoSafe(p, B + path);
    const n = await until(() => p.$$eval('#list .item', (l) => l.length), 8000);
    const err = await p.evaluate(() => /無法載入優惠/.test(document.body.innerText)).catch(() => true);
    check(`offline after one visit: ${path} shows the deal list`, n > 0 && !err, `items=${n} error=${err}`);
    if (path.startsWith('/deal/')) {
      const name = await until(() => p.evaluate(() => document.querySelector('#detail.open #detailName, #detail.open h1, #detail.open h2')?.textContent.trim()), 4000);
      check(`offline after one visit: ${path} opens the detail`, !!name, name || 'no detail title');
    }
    await p.close();
  }
  {
    const p = await ctx.newPage();
    await gotoSafe(p, B + '/saved');
    const ok = await until(() => p.evaluate(() => !document.getElementById('view-saved').hidden && document.getElementById('savedBody').children.length > 0), 6000);
    const deals = await p.evaluate(async () => { try { const r = await fetch('/api/deals'); return (await r.json()).deals.length; } catch { return 0; } });
    check('offline after one visit: /saved renders, with the list available', ok && deals > 0, `rendered=${!!ok} deals=${deals}`);
    await p.close();
  }

  // Navigations the shell must not answer, and private routes: the offline page, never the browser error.
  for (const path of ['/auth/google/start', '/admin.html']) {
    const p = await ctx.newPage();
    await gotoSafe(p, B + path);
    const off = await until(() => isOfflinePage(p), 4000);
    const url = new URL(p.url());
    check(`offline: ${path} shows the offline page`, off && url.pathname === path, `url=${p.url()}`);
    await p.close();
  }
  check('no page errors in the offline run', !errors.length, errors.join(' | '));
  await ctx.close();
}

/* ================= 2. Online behaviour of /auth through the worker; update toast placement ================= */
{
  const ctx = await newContext(IPHONE);
  const page = await ctx.newPage();
  await page.goto(B + '/', { waitUntil: 'load' });
  await until(() => page.evaluate(() => !!navigator.serviceWorker.controller), 10000);
  // Sign in through a worker-controlled navigation: the redirect and cookie pass through untouched.
  await page.goto(`${B}/auth/dev-login?email=${encodeURIComponent('pwa-test@example.com')}&next=/deal/${FULL}`, { waitUntil: 'load' });
  const me = await page.evaluate(async () => (await (await fetch('/api/me')).json()));
  check('online: /auth/* navigation under the worker still signs in and redirects', !!(me && me.user) && new URL(page.url()).pathname === `/deal/${FULL}`, page.url());

  // The real Google round-trip through the worker, when the mock (node tests/mock-google.mjs) is up.
  const mockUp = await fetch('http://localhost:9876/').then(() => true, () => false);
  if (mockUp) {
    const g = await ctx.newPage();
    await g.goto(B + '/', { waitUntil: 'load' });
    await until(() => g.evaluate(() => !!navigator.serviceWorker.controller), 10000);
    await g.goto(B + '/auth/google/start', { waitUntil: 'load' });
    await g.fill('input[name=login_hint]', 'pwa-oauth@ntu.edu.tw').catch(() => {});
    await Promise.all([g.waitForURL((u) => u.origin === new URL(B).origin && !u.pathname.startsWith('/auth'), { timeout: 10000 }).catch(() => {}), g.press('input[name=login_hint]', 'Enter').catch(() => {})]);
    const gm = await g.evaluate(async () => (await (await fetch('/api/me')).json())).catch(() => null);
    check('online: Google sign-in (mock) completes under the worker', gm?.user?.email === 'pwa-oauth@ntu.edu.tw', g.url());
    await g.close();
  } else console.log('SKIP  Google sign-in (mock) under the worker — mock not running on :9876');

  const bar = await until(() => rect(page, '#detailUse'), 6000);
  check('detail shows the 使用優惠 action bar (precondition)', !!bar);
  // A new worker waiting to take over: same script under another URL.
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js?pwatest=' + Date.now(), { scope: '/' }));
  const toast = await until(async () => { await page.evaluate(() => new Promise(requestAnimationFrame)); const t = await rect(page, '.cp-update'); return t && !(await page.$('.cp-update[data-state]')) ? t : null; }, 10000);
  await sleep(400);
  const t1 = await rect(page, '.cp-update');
  const b1 = await rect(page, '#detailUse');
  check('update toast appears for a waiting worker', !!t1);
  check('update toast sits above the 使用優惠 bar, not on it', t1 && b1 && t1.bottom <= b1.top + 0.5, t1 && b1 ? `toast ${Math.round(t1.top)}-${Math.round(t1.bottom)} bar ${Math.round(b1.top)}-${Math.round(b1.bottom)}` : '');
  const hitTest = () => page.evaluate(() => { const b = document.querySelector('#detailUse button, #detailUse a'); if (!b) return 'no-button'; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return b.contains(e) ? 'cta' : (e && e.className) || 'none'; });
  const hit = (await until(async () => ((await hitTest()) === 'cta' ? 'cta' : null), 3000)) || (await hitTest());
  check('a tap on the 使用優惠 button reaches the button', hit === 'cta', hit);

  // Back to Explore, then the install card on top: the two stack, both above the tab bar.
  await page.goto(B + '/', { waitUntil: 'load' });
  await until(() => page.$('.cp-update'), 6000);
  await page.evaluate(() => window.__cpShowInstall('ios'));
  await sleep(700);
  const card = await rect(page, '#cpInstall');
  const t2 = await rect(page, '.cp-update');
  const tab = await rect(page, '#tabbar');
  check('install card and update toast do not overlap', card && t2 && (t2.bottom <= card.top + 0.5 || card.bottom <= t2.top + 0.5), card && t2 ? `card ${Math.round(card.top)}-${Math.round(card.bottom)} toast ${Math.round(t2.top)}-${Math.round(t2.bottom)}` : `card=${!!card} toast=${!!t2}`);
  check('install card and update toast clear the tab bar', card && t2 && tab && card.bottom <= tab.top + 0.5 && t2.bottom <= tab.top + 0.5);

  /* Prune: other ?v= copies of a file never evict the version the page uses. */
  const appSrc = await page.evaluate(() => document.querySelector('script[type=module][src*="app.js"]')?.getAttribute('src'));
  await page.evaluate(async () => { await fetch('/app.js?v=6'); await new Promise((r) => setTimeout(r, 300)); await fetch('/app.js?v=999'); });
  const keys = await until(async () => { const k = await cacheKeys(page); return k.includes('/app.js?v=999') ? k : null; }, 5000) || await cacheKeys(page);
  const apps = keys.filter((k) => k.startsWith('/app.js'));
  check('prune keeps the current version of a file', !!appSrc && apps.includes(appSrc), `${appSrc} in [${apps.join(', ')}]`);
  check('prune drops stale copies that are not current', !apps.includes('/app.js?v=6'), apps.join(', '));
  await ctx.close();
}

/* ================= 3. Install card is never shown (or counted) on a shop page ================= */
{
  const ctx = await newContext(IPHONE);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('cp_first_visit')) localStorage.setItem('cp_first_visit', String(Date.now() - 3600e3)); } catch {} });
  const page = await ctx.newPage();
  await page.goto(B + '/m/pwatestkey0001', { waitUntil: 'load' });
  await sleep(6000);
  const st = await page.evaluate(() => ({ card: !!document.getElementById('cpInstall'), asks: localStorage.getItem('cp_install_asks') }));
  check('no install card on /m/<key>, and no ask spent', !st.card && !st.asks, JSON.stringify(st));
  await page.goto(B + '/r/ABCD2345', { waitUntil: 'load' });
  await sleep(5500);
  const st2 = await page.evaluate(() => ({ card: !!document.getElementById('cpInstall'), asks: localStorage.getItem('cp_install_asks') }));
  check('no install card on /r/<code>, and no ask spent', !st2.card && !st2.asks, JSON.stringify(st2));
  // Control: the same returning iPhone visitor on Explore does get the card (so the check above means something).
  await page.goto(B + '/', { waitUntil: 'load' });
  const shown = await until(() => page.$('#cpInstall'), 9000);
  check('control: the install card does show on Explore', !!shown);
  await ctx.close();
}

/* ================= 4. Offline page follows the stored theme ================= */
{
  const ctx = await browser.newContext({ ...ANDROID, colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(B + '/offline');
  await page.evaluate(() => localStorage.setItem('cp_theme', 'dark'));
  await page.reload();
  const dark = await page.evaluate(() => [...document.querySelectorAll('meta[name=theme-color]')].map((m) => m.content));
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check('offline page: stored dark theme → dark status bar on a light system', dark.every((c) => c.toUpperCase() === '#17171B') && bg === 'rgb(23, 23, 27)', `${dark.join(',')} ${bg}`);
  await page.evaluate(() => localStorage.removeItem('cp_theme'));
  await page.reload();
  const sys = await page.evaluate(() => [...document.querySelectorAll('meta[name=theme-color]')].map((m) => `${m.media}=${m.content}`));
  check('offline page: no stored theme → follows the system', sys.includes('(prefers-color-scheme: light)=#FAFAFA') && sys.includes('(prefers-color-scheme: dark)=#17171B'), sys.join(' '));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `, ${failed.length} failed:\n  - ${failed.map((f) => f.name).join('\n  - ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
