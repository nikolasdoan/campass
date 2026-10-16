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

/* ================= 5. One stack: install card, update toast and the app toast never overlap ================= */
// Order, bottom up: tab bar / 使用優惠 bar → install card → update toast → app toast (#toast, js/ui.js).
// pwa.js publishes --float-floor on <html>; the app toast sits on it. Checked at phone and desktop size,
// on Explore and on a deal with the 使用優惠 bar. PWA_SHOTS=<dir> saves a screenshot of each.
{
  const SHOTS = process.env.PWA_SHOTS || '';
  if (SHOTS) (await import('node:fs')).mkdirSync(SHOTS, { recursive: true });
  const boxes = (page) => page.evaluate(() => {
    const r = (el) => { if (!el) return null; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return null; const b = el.getBoundingClientRect(); return b.width && b.height ? { top: b.top, bottom: b.bottom, left: b.left, right: b.right } : null; };
    return { card: r(document.getElementById('cpInstall')), update: r(document.querySelector('.cp-update')), toast: r(document.getElementById('toast')),
      tabbar: r(document.getElementById('tabbar')), usebar: r(document.getElementById('detailUse')),
      floor: getComputedStyle(document.documentElement).getPropertyValue('--float-floor').trim(), H: innerHeight, W: innerWidth };
  });
  const overlap = (a, b) => !!(a && b) && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5 && a.left < b.right - 0.5 && b.left < a.right - 0.5;
  const fmt = (b) => b ? `${Math.round(b.top)}-${Math.round(b.bottom)}` : '-';
  // The app's own toast, through the app's own module (the same instance app.js imported).
  const appToast = (page, msg) => page.evaluate(async (m) => {
    const u = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/js\/ui\.js(\?|$)/.test(n));
    const ui = await import(u);
    ui.toast(m, { ms: 20000 });
  }, msg);
  const settle = async (page) => { await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); await sleep(450); };

  for (const [label, opts] of [['390', ANDROID], ['1280', { viewport: { width: 1280, height: 800 } }]]) {
    const ctx = await newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${B}/auth/dev-login?email=${encodeURIComponent('pwa-stack@example.com')}&next=/`, { waitUntil: 'load' });
    await until(() => page.evaluate(() => !!navigator.serviceWorker.controller), 10000);
    await until(() => page.$$eval('#list .item', (l) => l.length), 8000);
    await page.evaluate(() => navigator.serviceWorker.register('/sw.js?pwastack=' + Date.now(), { scope: '/' }));
    const up = await until(() => page.$('.cp-update:not([data-state])'), 10000);
    check(`stack ${label}: update toast is up (precondition)`, !!up);
    await page.evaluate(() => window.__cpShowInstall('android'));
    await appToast(page, '已收藏');
    await settle(page);

    for (const where of ['explore', 'deal']) {
      if (where === 'deal') {
        await page.evaluate((id) => { history.pushState(null, '', '/deal/' + id); dispatchEvent(new PopStateEvent('popstate')); }, FULL);
        await until(() => page.evaluate(() => !!document.querySelector('#detail.open')), 6000);
        if (label === '390') await until(() => rect(page, '#detailUse'), 6000);
        await appToast(page, '已複製連結');
        await settle(page);
      }
      const b = await boxes(page);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/stack-${label}-${where}.png` });
      const tag = `stack ${label} ${where}:`;
      const info = `bar ${fmt(b.tabbar)} use ${fmt(b.usebar)} card ${fmt(b.card)} update ${fmt(b.update)} toast ${fmt(b.toast)} floor=${b.floor}`;
      // On a phone the open detail covers the page, and the card steps out of its way (its restraint rule).
      const stepsAside = label === '390' && where === 'deal';
      if (stepsAside) {
        check(`${tag} the install card steps aside for the open detail; update toast and app toast are up`, !b.card && b.update && b.toast && b.usebar, info);
        check(`${tag} the floor follows: app toast right above the update toast`, b.update && b.toast && b.toast.bottom <= b.update.top + 0.5 && b.update.top - b.toast.bottom < 16, info);
      } else check(`${tag} card, update toast and app toast are all on screen`, b.card && b.update && b.toast, info);
      const pairs = [['card', 'update'], ['card', 'toast'], ['update', 'toast']].filter(([x, y]) => overlap(b[x], b[y]));
      check(`${tag} no two of card / update toast / app toast overlap`, !pairs.length, pairs.map((p) => p.join('×')).join(' ') || info);
      const covers = ['card', 'update', 'toast'].flatMap((k) => ['tabbar', 'usebar'].filter((bar) => overlap(b[k], b[bar])).map((bar) => `${k}×${bar}`));
      check(`${tag} none covers the tab bar or the 使用優惠 bar`, !covers.length, covers.join(' ') || info);
      if (!stepsAside) check(`${tag} order bottom-up: card → update toast → app toast`, b.card && b.update && b.toast && b.card.top >= b.update.bottom - 0.5 && b.update.top >= b.toast.bottom - 0.5, info);
      check(`${tag} all inside the viewport`, (stepsAside ? ['update', 'toast'] : ['card', 'update', 'toast']).every((k) => b[k] && b[k].top >= 0 && b[k].bottom <= b.H && b[k].left >= 0 && b[k].right <= b.W), info);
      // The contract holds in styles.css itself, not only through pwa.js's !important safety net.
      const own = await page.evaluate(() => {
        const sheet = document.getElementById('cp-pwa-style')?.sheet; if (!sheet) return null;
        const i = [...sheet.cssRules].findIndex((r) => r.selectorText && r.selectorText.includes('#toast'));
        if (i < 0) return null;
        const text = sheet.cssRules[i].cssText; const before = document.getElementById('toast').getBoundingClientRect().bottom;
        sheet.deleteRule(i); const after = document.getElementById('toast').getBoundingClientRect().bottom; sheet.insertRule(text, i);
        return { before, after };
      });
      check(`${tag} styles.css alone puts the app toast on --float-floor`, own && Math.abs(own.before - own.after) < 1, JSON.stringify(own));
      if (label === '1280') {
        const mid = (r) => (r.left + r.right) / 2;
        check(`${tag} update toast and app toast share one centre line`, b.update && b.toast && Math.abs(mid(b.update) - mid(b.toast)) < 1.5, b.update && b.toast ? `${mid(b.update)} vs ${mid(b.toast)}` : '');
      }
    }

    // Back on Explore, the card returns; dismissed, the floor drops to the update toast and the app toast follows.
    await page.evaluate(() => { history.pushState(null, '', '/'); dispatchEvent(new PopStateEvent('popstate')); });
    await until(() => page.evaluate(() => !document.querySelector('#detail.open')), 6000);
    await settle(page);
    await page.click('#cpInstall .install-x');
    await sleep(600);
    await settle(page);
    const d = await boxes(page);
    check(`stack ${label}: after the card closes, the app toast sits right above the update toast`, !d.card && d.update && d.toast && d.toast.bottom <= d.update.top + 0.5 && d.update.top - d.toast.bottom < 16,
      `update ${fmt(d.update)} toast ${fmt(d.toast)} floor=${d.floor}`);
    check(`stack ${label}: no page errors`, !errors.length, errors.join(' | '));
    await ctx.close();
  }
}

/* ================= 6. The install card promises offline only what the app keeps offline ================= */
{
  const ctx = await newContext(ANDROID);
  const page = await ctx.newPage();
  await page.goto(B + '/', { waitUntil: 'load' });
  const cardText = () => page.evaluate(() => { document.getElementById('cpInstall')?.remove(); return window.__cpShowInstall('android').innerText; });
  await page.evaluate(() => localStorage.removeItem('cp_saved_cache'));
  const plain = await cardText();
  check('install card: no offline promise without a local copy of saved deals', !/離線|offline/i.test(plain), plain.replace(/\s+/g, ' '));
  await page.evaluate(() => localStorage.setItem('cp_saved_cache', JSON.stringify({ email: 'x@example.com', deals: {} })));
  const off = await cardText();
  check('install card: with cp_saved_cache, it says loaded and saved deals work offline', /離線也能看已載入的優惠與收藏/.test(off), off.replace(/\s+/g, ' '));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? `, ${failed.length} failed:\n  - ${failed.map((f) => f.name).join('\n  - ')}` : ''}`);
process.exit(failed.length ? 1 : 0);
