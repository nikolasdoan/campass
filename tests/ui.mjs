// CampusPass UI verification (Playwright, Chromium). Needs `npm run dev` on :8787 with DEV_LOGIN=true.
// Run: npm run test:ui   (screenshots go to test-results/)
import { chromium } from 'playwright';
const B = 'http://localhost:8787';
import { readFileSync, mkdirSync } from 'node:fs';
// Expected Explore counts, from the data: default school NTU, not expired.
const EXPECT = (() => {
  const d = JSON.parse(readFileSync(new URL('../data/deals.json', import.meta.url), 'utf8'));
  const act = (x) => x.auto_renew || !x.expires_on || x.expires_on >= new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  const ntu = d.filter((x) => x.schools.includes('NTU') && act(x));
  return { student: ntu.filter((x) => x.eligibility.student).length, all: ntu.length };
})();
const OUT = process.env.SHOTS_DIR || new URL('../test-results/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const DATA = JSON.parse(readFileSync(new URL('../data/deals.json', import.meta.url), 'utf8'));
const BY_ID = new Map(DATA.map((d) => [d.id, d]));
const EXPIRED = '82303c4708';
const FULL = '58a27e58ee'; // has phone + address
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

// Playwright finds its own Chromium (PLAYWRIGHT_BROWSERS_PATH); CHROMIUM_PATH overrides it.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1280, height: 800 } };

let ctxN = 0;
async function newPage(opts, tag) {
  // A client IP of its own per context, so the per-IP rate limits never trip across checks.
  const ip = `10.77.${Date.now() % 250}.${++ctxN}`;
  const ctx = await browser.newContext({ ...opts, serviceWorkers: 'block', extraHTTPHeaders: { 'CF-Connecting-IP': ip } });
  const page = await ctx.newPage();
  page._errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page._errors.push(`${tag}: ${m.text()}`); });
  page.on('pageerror', (e) => page._errors.push(`${tag}: pageerror ${e.message}`));
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.png` });
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth);
const rect = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, display: getComputedStyle(e).display, vis: getComputedStyle(e).visibility }; }, sel);
const itemCount = (page, scope = '#list') => page.$$eval(`${scope} .item`, (l) => l.length);
const settle = (page, ms = 450) => page.waitForTimeout(ms);
// Rows use content-visibility:auto, so the page grows a little as rows are first painted:
// scroll to the bottom until the height stops changing.
async function scrollBottom(page) {
  for (let i = 0, h = -1; i < 8; i++) {
    const nh = await page.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); return document.documentElement.scrollHeight; });
    if (nh === h) break;
    h = nh;
    await page.waitForTimeout(150);
  }
}
const allErrors = [];

/* ================= PHONE ================= */
{
  const { ctx, page } = await newPage(MOBILE, 'phone');
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#list .item');
  check('phone: no horizontal scroll (explore)', await noHScroll(page));
  const nav = await rect(page, '#tabbar');
  check('phone: bottom tab bar visible at bottom', nav && nav.display !== 'none' && Math.abs(nav.bottom - 844) < 1 && nav.height >= 52, JSON.stringify(nav));
  check('phone: rail hidden', (await rect(page, '#rail')).display === 'none');
  check('phone: tab aria-current on Explore', await page.$eval('#tabbar [data-tab="explore"]', (a) => a.getAttribute('aria-current') === 'page'));
  const navH = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
  const navPx = await page.evaluate(() => { const d = document.createElement('div'); d.style.height = 'var(--nav-h)'; document.body.append(d); const h = d.getBoundingClientRect().height; d.remove(); return h; });
  check('phone: --nav-h equals tab bar height', Math.abs(navPx - nav.height) < 0.5, `${navH} → ${navPx}px vs ${nav.height}`);
  const tb = await rect(page, '#toolbar');
  const first = await rect(page, '#list .item');
  check('phone: first row starts below the sticky chrome', first.top >= tb.bottom - 0.5, `toolbar ${tb.bottom} row ${first.top}`);
  await shot(page, 'phone-explore');

  // Scroll to the very bottom: last row must clear the tab bar.
  await scrollBottom(page);
  await settle(page, 300);
  const last = await page.evaluate(() => { const l = [...document.querySelectorAll('#list .item')].pop().getBoundingClientRect(); return { top: l.top, bottom: l.bottom }; });
  const navTop = (await rect(page, '#tabbar')).top;
  const tbBottom = (await rect(page, '#toolbar')).bottom;
  check('phone: last row fully visible above tab bar when scrolled to bottom', last.bottom <= navTop && last.top >= tbBottom, `row ${last.top}-${last.bottom}, nav ${navTop}, toolbar ${tbBottom}`);
  const appbarTop = (await rect(page, '#appbar')).top;
  check('phone: app bar stays pinned while scrolled', appbarTop === 0);
  await shot(page, 'phone-explore-bottom');
  await page.evaluate(() => scrollTo(0, 0));

  // Filters
  const total = await itemCount(page);
  const foodPill = await page.$('[data-cat="food"]');
  const foodN = Number(await foodPill.$eval('.n', (n) => n.textContent));
  await foodPill.click(); await settle(page, 150);
  const cats = await page.$$eval('#list .item .meta', (m) => m.map((x) => x.textContent));
  check('phone: category filter (美食)', (await itemCount(page)) === foodN && cats.every((c) => c.startsWith('美食')), `${foodN} rows`);
  await page.click('[data-cat="all"]'); await settle(page, 150);
  await page.fill('#q', '福華'); await settle(page, 250);
  const names = await page.$$eval('#list .item .itxt', (n) => n.map((x) => x.querySelector('.nm').textContent + ' ' + (x.querySelector('.sub')?.textContent || '')));
  check('phone: search filters by name/subtitle', names.length > 0 && names.every((n) => n.includes('福華')), names.join(','));
  await page.fill('#q', '台北福華'); await settle(page, 250);
  check('phone: search treats 台/臺 alike & is case-insensitive', (await itemCount(page)) >= 1);
  await page.fill('#q', 'SOS'); await settle(page, 250);
  check('phone: expired deal hidden from Explore', (await itemCount(page)) === 0 && (await page.isVisible('#list .empty')));
  await page.fill('#q', ''); await settle(page, 250);
  check('phone: default shows student-eligible, non-expired only', total === EXPECT.student, `${total} vs ${EXPECT.student}`);
  await page.click('[data-toggle="students"]'); await settle(page, 150);
  check('phone: 學生適用 toggle off shows all non-expired', (await itemCount(page)) === EXPECT.all, `${await itemCount(page)} vs ${EXPECT.all}`);
  await page.click('[data-toggle="students"]'); await settle(page, 150);
  await page.click('[data-pick="region"]'); await settle(page, 400);
  await shot(page, 'phone-region-sheet');
  check('phone: region picker opens as bottom sheet', await page.evaluate(() => { const d = document.querySelector('dialog[open]'); if (!d) return false; const r = d.getBoundingClientRect(); return Math.abs(r.bottom - innerHeight) < 2 && r.width === innerWidth; }));
  await page.click('dialog[open] [data-value="east"]'); await settle(page, 400);
  // The row's meta shows the area (花蓮縣…) when known, the region otherwise: check the data.
  const eastIds = await page.$$eval('#list .item', (l) => l.map((x) => x.dataset.id));
  check('phone: region filter (東部)', eastIds.length > 0 && eastIds.every((id) => BY_ID.get(id)?.regions.includes('east')), `${eastIds.length}`);
  await page.click('[data-reset]'); await settle(page, 150);
  check('phone: reset filters', (await itemCount(page)) === EXPECT.student);

  // Locked detail + back
  const firstId = await page.$eval('#list .item', (li) => li.dataset.id);
  await page.click(`#list .item[data-id="${firstId}"] .pick`); await settle(page);
  check('phone: detail route pushed', new URL(page.url()).pathname === `/deal/${firstId}`);
  const lockText = await page.textContent('#detail .lockcard');
  const lodging = BY_ID.get(firstId)?.category === 'lodging';
  check('phone: locked detail shows login card (訂房代碼 only for lodging)', await page.isVisible('#detail .lockcard') && lockText.includes('登入看完整條件') && lockText.includes('登入後可查看優惠條件') && lockText.includes('訂房代碼') === lodging, lockText.replace(/\s+/g, ' ').trim().slice(0, 60));
  const det = await rect(page, '#detail');
  check('phone: detail is a full-screen page', det.top === 0 && det.left === 0 && det.width === 390 && det.vis === 'visible');
  await shot(page, 'phone-detail-locked');
  await page.evaluate(() => { const b = document.querySelector('#detailBody'); b.scrollTop = b.scrollHeight; });
  await settle(page, 200);
  const dlast = await page.evaluate(() => document.querySelector('#detailBody .dfine').getBoundingClientRect().bottom);
  check('phone: detail content scrolls clear of the tab bar', dlast <= (await rect(page, '#tabbar')).top, `${dlast}`);
  await shot(page, 'phone-detail-locked-bottom');
  await page.goBack(); await settle(page);
  check('phone: browser Back closes detail', new URL(page.url()).pathname === '/' && (await rect(page, '#detail')).vis === 'hidden');
  await page.click(`#list .item[data-id="${firstId}"] .pick`); await settle(page);
  await page.click('#dhead [data-close-detail]'); await settle(page);
  check('phone: in-app back button closes detail', new URL(page.url()).pathname === '/' && (await rect(page, '#detail')).vis === 'hidden');
  // Deep link to an expired deal
  await page.goto(B + `/deal/${EXPIRED}`, { waitUntil: 'networkidle' }); await settle(page);
  check('phone: expired deal reachable by deep link with 已過期 chip', (await page.textContent('#detail .dhero')).includes('已過期'));
  await page.click('#dhead [data-close-detail]'); await settle(page);
  check('phone: back from a cold deep link lands on Explore', new URL(page.url()).pathname === '/');

  // Saved logged out + sign-in sheet from star
  await page.click('#tabbar [data-tab="saved"]'); await settle(page);
  check('phone: Saved (signed out) shows sign-in CTA', await page.isVisible('#savedBody .gbtn'));
  await shot(page, 'phone-saved-signedout');
  await page.click('#tabbar [data-tab="explore"]'); await settle(page);
  await page.click('#list .item .star'); await settle(page);
  check('phone: star while signed out opens sign-in sheet', await page.isVisible('dialog[open] .gbtn') && (await page.textContent('dialog[open]')).includes('我們只會記錄你的 Email'));
  await shot(page, 'phone-signin-sheet');
  await page.keyboard.press('Escape'); await settle(page);
  check('phone: Esc closes dialog', !(await page.$('dialog[open]')));

  // EN toggle + theme on /me
  await page.click('#tabbar [data-tab="me"]'); await settle(page);
  await shot(page, 'phone-me');
  await page.click('button[data-lang="en"]'); await settle(page, 200);
  check('phone: EN toggle switches labels', (await page.textContent('#tabbar [data-tab="explore"]')).trim() === 'Explore' && (await page.getAttribute('html', 'lang')) === 'en');
  await page.click('#tabbar [data-tab="explore"]'); await settle(page);
  await shot(page, 'phone-explore-en');
  check('phone: no horizontal scroll (EN)', await noHScroll(page));
  await page.click('#tabbar [data-tab="me"]'); await settle(page);
  await page.click('button[data-theme="dark"]'); await settle(page, 300);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const meta = await page.$eval('meta[name="theme-color"]', (m) => m.content);
  check('phone: dark theme applies + theme-color meta updated', bg === 'rgb(23, 23, 27)' && meta === '#202026', `${bg} ${meta}`);
  await shot(page, 'phone-me-dark-en');
  await page.click('#tabbar [data-tab="explore"]'); await settle(page);
  await shot(page, 'phone-explore-dark-en');
  await page.reload({ waitUntil: 'networkidle' });
  check('phone: theme + language persist across reload', (await page.getAttribute('html', 'data-theme')) === 'dark' && (await page.getAttribute('html', 'data-lang')) === 'en');
  allErrors.push(...page._errors);
  await ctx.close();
}

/* ============ PHONE, signed in (dev login) ============ */
{
  const { ctx, page } = await newPage(MOBILE, 'phone-auth');
  await page.goto(B + `/auth/dev-login?email=ui-test@example.com&next=/deal/${FULL}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#detail .prose');
  // Start clean
  await page.evaluate(async (ids) => { for (const id of ids) await fetch('/api/favorites/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }); }, [FULL, EXPIRED]);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose');
  check('auth: detail shows offer text', (await page.textContent('#detail .prose')).length > 10);
  check('auth: phone is a tel: link', !!(await page.$('#detail a.row[href^="tel:"]')));
  check('auth: address links to Google Maps', !!(await page.$('#detail a.row[href^="https://www.google.com/maps/search/"]')));
  check('auth: no lock card', !(await page.$('#detail .lockcard')));
  await shot(page, 'phone-detail-unlocked');
  await page.click('#dhead [data-star]'); await settle(page, 600);
  check('auth: save from detail (optimistic, aria-pressed)', (await page.getAttribute('#dhead [data-star]', 'aria-pressed')) === 'true');
  const favs = await page.evaluate(async () => (await (await fetch('/api/me')).json()).favorites);
  check('auth: favourite persisted on server', favs.includes('58a27e58ee'));
  await page.click('#dhead [data-report]').catch(() => {});
  await page.click('#detail [data-report]'); await settle(page, 400);
  check('auth: report modal opens with textarea', await page.isVisible('dialog[open] textarea'));
  await page.fill('dialog[open] textarea', 'UI test report — please ignore');
  await shot(page, 'phone-report');
  await page.click('dialog[open] [type="submit"]'); await settle(page, 700);
  check('auth: report submits and closes', !(await page.$('dialog[open]')));
  await page.goto(B + `/deal/${EXPIRED}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose');
  await page.click('#dhead [data-star]'); await settle(page, 600);
  await page.click('#tabbar [data-tab="saved"]'); await settle(page);
  const savedIds = await page.$$eval('#savedBody .item', (l) => l.map((x) => x.dataset.id));
  check('auth: saved deals appear on /saved (incl. expired)', savedIds.includes('58a27e58ee') && savedIds.includes(EXPIRED), savedIds.join(','));
  check('auth: expired saved row is marked', await page.$eval(`#savedBody .item[data-id="${EXPIRED}"]`, (li) => li.classList.contains('expired') && li.textContent.includes('已過期')));
  check('auth: tab badge shows saved count', (await page.textContent('#tabbar [data-saved-count]')).trim() === '2');
  await shot(page, 'phone-saved');
  await page.click(`#savedBody .item[data-id="${EXPIRED}"] .pick`); await settle(page);
  check('auth: detail from Saved keeps Saved tab current', await page.$eval('#tabbar [data-tab="saved"]', (a) => a.getAttribute('aria-current') === 'page'));
  await page.goBack(); await settle(page);
  check('auth: back returns to /saved', new URL(page.url()).pathname === '/saved');
  await page.click(`#savedBody .item[data-id="${EXPIRED}"] .star`); await settle(page, 600);
  check('auth: unsave on /saved removes the row', !(await page.$(`#savedBody .item[data-id="${EXPIRED}"]`)));
  await page.click('#tabbar [data-tab="me"]'); await settle(page);
  check('auth: /me shows profile email', (await page.textContent('#meBody')).includes('ui-test@example.com'));
  await shot(page, 'phone-me-signedin');

  // Standalone emulation: 47px top / 34px bottom safe areas.
  await page.addStyleTag({ content: ':root{--sat:47px !important;--sab:34px !important;}' });
  await page.evaluate(() => document.documentElement.classList.add('is-standalone'));
  await page.click('#tabbar [data-tab="explore"]'); await settle(page);
  const ab = await rect(page, '#appbar');
  const nb = await rect(page, '#tabbar');
  const brand = await rect(page, '#appbar .brand');
  check('standalone: app bar = 52 + 47 inset, content below status bar', Math.round(ab.height) === 99 && brand.top >= 47, `${ab.height} brand@${brand.top}`);
  check('standalone: tab bar = 52 + 34 inset', Math.round(nb.height) === 86, `${nb.height}`);
  const tabLbl = await page.evaluate(() => document.querySelector('#tabbar .tab').getBoundingClientRect().bottom);
  check('standalone: tab buttons sit above the home indicator', tabLbl <= 844 - 34 + 0.5, `${tabLbl}`);
  await shot(page, 'standalone-explore');
  await scrollBottom(page); await settle(page, 300);
  const last2 = await page.evaluate(() => [...document.querySelectorAll('#list .item')].pop().getBoundingClientRect().bottom);
  check('standalone: last row clears the tab bar', last2 <= (await rect(page, '#tabbar')).top, `${last2}`);
  await shot(page, 'standalone-explore-bottom');
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('#list .item .pick'); await settle(page);
  const dh = await rect(page, '#dhead');
  check('standalone: detail header respects the top inset', Math.round(dh.height) === 99);
  await shot(page, 'standalone-detail');
  await page.click('#dhead [data-close-detail]'); await settle(page);
  await page.click('[data-pick="region"]'); await settle(page, 400);
  await shot(page, 'standalone-sheet');
  await page.keyboard.press('Escape'); await settle(page);
  allErrors.push(...page._errors);
  await ctx.close();
}

/* ================= DESKTOP ================= */
{
  const { ctx, page } = await newPage(DESKTOP, 'desktop');
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await page.waitForSelector('#list .item');
  check('desktop: no horizontal scroll', await noHScroll(page));
  const rail = await rect(page, '#rail');
  check('desktop: rail visible, 72px', rail.display !== 'none' && rail.width === 72);
  check('desktop: tab bar + app bar hidden', (await rect(page, '#tabbar')).display === 'none' && (await rect(page, '#appbar')).display === 'none');
  const col = await rect(page, '#view-explore .col');
  check('desktop: list column max 760px', col.width <= 760.5, `${col.width}`);
  await page.keyboard.press('/');
  check('desktop: "/" focuses search', await page.evaluate(() => document.activeElement.id === 'q'));
  await page.keyboard.press('Escape');
  await page.click('body', { position: { x: 1200, y: 400 } });
  await shot(page, 'desktop-explore');
  await page.click('#list .item:nth-child(2) .pick'); await settle(page);
  const det = await rect(page, '#detail');
  const listCol = await rect(page, '#view-explore .col');
  check('desktop: detail opens as right panel (~420px), list still visible', det.display !== 'none' && det.width > 380 && det.width < 460 && Math.abs(det.right - 1280) < 1 && listCol.width > 300 && listCol.right <= det.left + 1, `panel ${det.width} list ${listCol.width}`);
  check('desktop: selected row highlighted', await page.$eval('#list .item:nth-child(2)', (li) => li.classList.contains('sel')));
  await shot(page, 'desktop-detail');
  await page.click('#list .item:nth-child(3) .pick'); await settle(page);
  await page.goBack(); await settle(page);
  check('desktop: switching deals replaces history (Back closes panel)', new URL(page.url()).pathname === '/');
  await page.click('#list .item:nth-child(2) .pick'); await settle(page);
  await page.keyboard.press('Escape'); await settle(page);
  check('desktop: Esc closes the panel', (await rect(page, '#detail')).display === 'none' && new URL(page.url()).pathname === '/');
  await scrollBottom(page); await settle(page, 200);
  const last = await page.evaluate(() => [...document.querySelectorAll('#list .item')].pop().getBoundingClientRect().bottom);
  check('desktop: last row reachable', last <= 800);
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('#rail [data-signin]'); await settle(page, 400);
  check('desktop: sign-in opens as centred modal', await page.evaluate(() => { const d = document.querySelector('dialog[open] .dlg-card').getBoundingClientRect(); return Math.abs((d.left + d.right) / 2 - innerWidth / 2) < 2; }));
  await shot(page, 'desktop-signin');
  // Focus trap
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  check('desktop: focus stays inside the dialog', await page.evaluate(() => !!document.activeElement.closest('dialog[open]')));
  await page.keyboard.press('Escape'); await settle(page);
  await page.click('[data-pick="region"]'); await settle(page, 300);
  await shot(page, 'desktop-region-popover');
  await page.keyboard.press('Escape'); await settle(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.click('#list .item:nth-child(1) .pick'); await settle(page);
  await shot(page, 'desktop-dark-detail');
  check('desktop: system dark mode renders dark', (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(23, 23, 27)');
  allErrors.push(...page._errors);
  await ctx.close();
}
{
  const { ctx, page } = await newPage(DESKTOP, 'desktop-auth');
  await page.goto(B + '/auth/dev-login?email=ui-test@example.com&next=/saved', { waitUntil: 'networkidle' });
  await settle(page);
  await shot(page, 'desktop-saved');
  await page.click('#railAvatar'); await settle(page, 300);
  check('desktop: avatar opens account menu', await page.isVisible('dialog.acct[open]'));
  await shot(page, 'desktop-account-menu');
  await page.click('dialog.acct [data-signout]'); await settle(page, 700);
  check('desktop: sign out works', (await page.evaluate(async () => (await (await fetch('/api/me')).json()).user)) === null && (await page.isVisible('#rail [data-signin]')));
  await page.goto(B + '/?login_error=access_denied', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('desktop: login_error shows a toast and is removed from the URL', (await page.textContent('#toast')).includes('取消') && !page.url().includes('login_error'));
  allErrors.push(...page._errors);
  await ctx.close();
}

/* ============ edge widths ============ */
for (const w of [360, 414, 820, 821]) {
  const phone = w <= 820;
  const { ctx, page } = await newPage(phone ? { viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: 760 } }, `w${w}`);
  await page.goto(B + '/?lang=x', { waitUntil: 'networkidle' });
  await page.waitForSelector('#list .item');
  check(`${w}px: no horizontal scroll`, await noHScroll(page));
  check(`${w}px: ${phone ? 'tab bar' : 'rail'} shown`, (await rect(page, phone ? '#tabbar' : '#rail')).display !== 'none' && (await rect(page, phone ? '#rail' : '#tabbar')).display === 'none');
  await page.click('#list .item:nth-child(2) .pick'); await settle(page);
  check(`${w}px: detail open without horizontal scroll`, await noHScroll(page));
  if (w === 360 || w === 821) await shot(page, `w${w}-detail`);
  await page.click('[data-close-detail]'); await settle(page);
  check(`${w}px: closed`, new URL(page.url()).pathname === '/');
  if (phone) {
    await page.click('[data-pick="region"]'); await settle(page, 300);
    check(`${w}px: body.has-overlay while a sheet is open`, await page.evaluate(() => document.body.classList.contains('has-overlay')));
    await page.keyboard.press('Escape'); await settle(page, 400);
    check(`${w}px: has-overlay cleared`, await page.evaluate(() => !document.body.classList.contains('has-overlay')));
  }
  if (w === 360) await shot(page, 'w360-explore');
  allErrors.push(...page._errors);
  await ctx.close();
}

/* ============ redemption: pass, shop pairing, scan landing, outcome, /merchants ============ */
// QR decoding uses jsQR (a dev dependency); JSQR_PATH can point at another copy's entry file
// at its dist/jsQR.js, or install it here. Without it the decode checks are skipped, not passed.
let jsQR = null;
try { jsQR = (await import(process.env.JSQR_PATH || 'jsqr')).default; } catch {}
async function decodeQR(page, sel) {
  if (!jsQR) return undefined;
  const buf = await page.locator(sel).screenshot();
  const img = await page.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    return { w: c.width, h: c.height, data: Array.from(x.getImageData(0, 0, c.width, c.height).data) };
  }, buf.toString('base64'));
  return jsQR(Uint8ClampedArray.from(img.data), img.w, img.h)?.data ?? null;
}
const qrCheck = (name, got, want) => got === undefined ? console.log(`SKIP  ${name}  — jsQR not installed`) : check(name, got === want, `${got} vs ${want}`);
const apiGet = (page, url) => page.evaluate(async (u) => { const r = await fetch(u, { cache: 'no-store' }); return { status: r.status, data: await r.json().catch(() => null) }; }, url);
const passCode = async (page) => (await page.textContent('#passCode')).replace(/\s/g, '');
const OTHER = (() => {
  const d = JSON.parse(readFileSync(new URL('../data/deals.json', import.meta.url), 'utf8'));
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  return d.filter((x) => x.id !== FULL && x.eligibility.student && (x.auto_renew || !x.expires_on || x.expires_on >= today)).slice(0, 2).map((x) => x.id);
})();
const shopRes = await fetch(B + '/admin/merchant-keys', { method: 'POST', headers: { Authorization: 'Bearer change-me', 'Content-Type': 'application/json' }, body: JSON.stringify({ label: '台北福華', deal_ids: [FULL] }) });
const SHOP = new URL((await shopRes.json()).url).pathname; // /m/<key>
check('setup: admin issued a shop link', shopRes.ok && /^\/m\/[\w-]+$/.test(SHOP), SHOP);
const STUDENT = `redeem-${Date.now()}@ntu.edu.tw`; // fresh user: passes are reused per user for 15 min

{
  const { ctx, page } = await newPage(MOBILE, 'pass-phone');
  await page.goto(B + `/auth/dev-login?email=${STUDENT}&next=/deal/${FULL}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#detail .prose'); await settle(page);
  const use = await rect(page, '#detailUse');
  const tabTop = (await rect(page, '#tabbar')).top;
  check('pass: phone 使用優惠 bar sits right above the tab bar', use && use.display !== 'none' && Math.abs(use.bottom - tabTop) < 1, JSON.stringify(use));
  check('pass: one signature CTA (pill) on the detail', (await page.$$('#detail .btn-cta')).length === 1 && (await page.textContent('#detailUse .btn-cta')).includes('使用優惠'));
  await page.evaluate(() => { const b = document.querySelector('#detailBody'); b.scrollTop = b.scrollHeight; }); await settle(page, 200);
  const fine = await page.evaluate(() => document.querySelector('#detailBody .dfine').getBoundingClientRect().bottom);
  check('pass: detail content scrolls clear of the 使用優惠 bar', fine <= use.top + 1, `${fine} vs ${use.top}`);
  await page.click('[data-redeem]');
  await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page);
  const dlg = await rect(page, 'dialog.pass');
  check('pass: phone pass is full screen', dlg && dlg.top === 0 && dlg.left === 0 && dlg.width === 390 && Math.abs(dlg.height - 844) < 1, JSON.stringify(dlg));
  check('pass: body.has-overlay while the pass is open', await page.evaluate(() => document.body.classList.contains('has-overlay')));
  const code = await passCode(page);
  check('pass: code shown in 3+3 groups', /^[A-HJ-NP-Z2-9]{3} [A-HJ-NP-Z2-9]{3}$/.test(await page.textContent('#passCode')), await page.textContent('#passCode'));
  const left1 = await page.textContent('#passLeft');
  const clock1 = await page.textContent('#passClock');
  check('pass: 15-minute countdown', /^1[45]:[0-5]\d$/.test(left1), left1);
  const tpe = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  check('pass: live clock in Asia/Taipei', /^\d\d:\d\d:\d\d$/.test(clock1) && clock1.slice(0, 5) === tpe, `${clock1} vs ${tpe}`);
  await page.waitForTimeout(1300);
  check('pass: clock and countdown tick', (await page.textContent('#passClock')) !== clock1 && (await page.textContent('#passLeft')) !== '15:00');
  check('pass: shimmer bar animates', await page.$eval('.pass-live i', (i) => getComputedStyle(i).animationName === 'passSweep'));
  check('pass: masked email', (await page.textContent('.pass-who')).trim() === 'r***@ntu.edu.tw', await page.textContent('.pass-who'));
  check('pass: instruction text', (await page.textContent('.pass-instr')).includes('合作店家可掃描 QR 確認'));
  check('pass: asks for the student ID too', (await page.isVisible('#passId')) && (await page.textContent('#passId')).includes('請同時出示學生證'));
  check('pass: QR is black on white', await page.$eval('.pass-qr svg', (s) => s.querySelector('rect').getAttribute('fill') === '#FFFFFF' && s.querySelector('path').getAttribute('fill') === '#000000'));
  qrCheck('pass: QR decodes to /r/<code> (phone)', await decodeQR(page, '.pass-qr'), `${B}/r/${code}`);
  check('pass: own redemption readable while open', (await apiGet(page, `/api/redemptions/${code}`)).data?.code === code);
  await shot(page, 'pass-phone');
  await page.emulateMedia({ colorScheme: 'dark' }); await settle(page, 200);
  check('pass: dark mode keeps the QR black on white', await page.$eval('.pass-qr svg', (s) => getComputedStyle(s.querySelector('rect')).fill === 'rgb(255, 255, 255)' && getComputedStyle(s.querySelector('path')).fill === 'rgb(0, 0, 0)')
    && (await page.evaluate(() => getComputedStyle(document.querySelector('dialog.pass .dlg-card')).backgroundColor)) === 'rgb(32, 32, 38)');
  qrCheck('pass: QR decodes in dark mode', await decodeQR(page, '.pass-qr'), `${B}/r/${code}`);
  await shot(page, 'pass-phone-dark');
  await page.emulateMedia({ colorScheme: 'light' });

  // The shop: pair a phone via its private link, then "scan" (open /r/<code>) and confirm.
  const shopP = await newPage(MOBILE, 'shop');
  const sp = shopP.page;
  await sp.goto(B + SHOP, { waitUntil: 'networkidle' }); await sp.waitForSelector('#shopTitle');
  check('shop: page shows the shop label and 30-day count', (await sp.textContent('#shopTitle')) === '台北福華' && /近 30 天已確認 \d+ 次/.test(await sp.textContent('#shopCount')));
  check('shop: no tab bar, no rail tab highlighted, noindex', (await rect(sp, '#tabbar')).display === 'none' && !(await sp.$('[data-tab][aria-current]')) && (await sp.$eval('meta[name="robots"]', (m) => m.content)).includes('noindex'));
  check('shop: pairing cookie is HttpOnly', (await shopP.ctx.cookies()).some((c) => c.name === 'cp_merchant' && c.httpOnly));
  const fs = await sp.$eval('#shopCode', (i) => ({ fs: parseFloat(getComputedStyle(i).fontSize), mode: i.inputMode, ac: i.autocomplete }));
  check('shop: code input ≥16px, inputmode=text, autocomplete=off', fs.fs >= 16 && fs.mode === 'text' && fs.ac === 'off', JSON.stringify(fs));
  await sp.type('#shopCode', 'ab-c');
  check('shop: code input auto-uppercases and strips separators', (await sp.inputValue('#shopCode')) === 'ABC');
  await sp.click('#shopForm [type="submit"]'); await settle(sp, 200);
  check('shop: short code asks for all 6 characters', (await sp.textContent('#shopResult')).includes('6 碼'));
  await sp.fill('#shopCode', 'ZZZZZZ'); await sp.click('#shopForm [type="submit"]');
  await sp.waitForSelector('#shopResult .result.err');
  check('shop: unknown code → invalid', (await sp.textContent('#shopResult')).includes('找不到這組代碼'));
  await shot(sp, 'shop-invalid');
  await sp.goto(B + `/r/${code}`, { waitUntil: 'networkidle' }); await sp.waitForSelector('[data-scan-confirm]');
  check('scan: paired phone sees shop + deal + 確認使用', (await sp.textContent('#scanBody')).includes('台北福華') && (await sp.textContent('#scanBody')).includes('台北福華大飯店') && (await sp.textContent('[data-scan-confirm]')).includes('確認使用'));
  const scanText = await sp.textContent('#scanBody');
  check('scan: cashier sees who the deal is for, the masked account (a dev login is flagged 測試登入, not 學校信箱) and 請核對學生證', scanText.includes('限臺大學生') && scanText.includes('r***@ntu.edu.tw') && scanText.includes('測試登入') && !scanText.includes('學校信箱') && scanText.includes('請核對學生證後再確認') && !scanText.includes(STUDENT), scanText.replace(/\s+/g, ' ').slice(0, 160));
  check('scan: a dev-login school card is shown as 測試, never as verified (請核對學生證 stays)', scanText.includes('臺大身分（測試登入，未經驗證）') && !scanText.includes('已驗證 臺大') && (await sp.$$('#scanBody .vline.is-test .testtag')).length === 1 && scanText.includes('請核對學生證後再確認'));
  const terms = BY_ID.get(FULL).offer.slice(0, 12);
  check('scan: cashier sees the deal terms (優惠條件)', (await sp.textContent('#scanBody .cashfacts')).includes('優惠條件') && (await sp.textContent('#scanBody .cashoffer')).includes(terms));
  check('scan: the ID check comes before 確認使用', await sp.evaluate(() => !!(document.querySelector('.idcheck').compareDocumentPosition(document.querySelector('[data-scan-confirm]')) & Node.DOCUMENT_POSITION_FOLLOWING)));
  await shot(sp, 'scan-paired');
  const t0 = Date.now();
  await sp.click('[data-scan-confirm]'); await sp.waitForSelector('.scanstate.ok');
  check('scan: confirm → big ✓ with time', /\d\d:\d\d 確認/.test(await sp.textContent('#scanBody')));
  check('scan: the confirmed result still shows the deal and who it is for', (await sp.textContent('#scanBody .cashfacts')).includes('台北福華大飯店') && (await sp.textContent('#scanBody .cashfacts')).includes('限臺大'));
  await shot(sp, 'scan-confirmed');
  await page.waitForSelector('dialog.pass .pass-done', { timeout: 7000 }).catch(() => {});
  const flipped = Date.now() - t0;
  check('pass: student pass flips to 店家已確認 within ~5s', (await page.$('dialog.pass .pass-done')) && flipped < 6000 && (await page.textContent('.pass-done')).includes('店家已確認'), `${flipped}ms`);
  check('pass: once confirmed, the footer says done (no "show the cashier")', (await page.textContent('#passInstr')).includes('已完成') && !(await page.isVisible('#passId')));
  await shot(page, 'pass-phone-confirmed');
  await sp.goto(B + SHOP, { waitUntil: 'networkidle' }); await sp.waitForSelector('#shopCode');
  await sp.fill('#shopCode', code.toLowerCase()); await sp.press('#shopCode', 'Enter');
  await sp.waitForSelector('#shopResult .result.err');
  check('shop: manual re-entry of a confirmed code → already confirmed', (await sp.textContent('#shopResult')).includes('已經確認過'));
  await shot(sp, 'shop-page');
  check('shop: no horizontal scroll', await noHScroll(sp));
  await sp.goto(B + '/m/not-a-real-key-123', { waitUntil: 'networkidle' }); await sp.waitForSelector('#shopBody .empty');
  check('shop: invalid key → friendly error', (await sp.textContent('#shopBody')).includes('無效或已停用'));
  allErrors.push(...sp._errors);
  await shopP.ctx.close();

  // Anyone else scanning the QR: an explanation, never the student.
  const anon = await newPage(MOBILE, 'scan-anon');
  await anon.page.goto(B + `/r/${code}`, { waitUntil: 'networkidle' }); await anon.page.waitForSelector('.scancard');
  const anonText = await anon.page.textContent('#scanBody');
  check('scan: unpaired phone sees the explanation', anonText.includes('這是 CampusPass 優惠使用憑證，只有合作店家的手機可以確認。') && !!(await anon.page.$('#scanBody a[href="/merchants"]')) && !!(await anon.page.$('#scanBody a[href="/"]')));
  check('scan: unpaired phone sees no student or deal data', !anonText.includes('@') && !anonText.includes('福華') && !(await anon.page.$('[data-scan-confirm]')));
  // iOS: a shop paired in its home-screen app scans into Safari, unpaired: the code to type on the shop page.
  check('scan: unpaired phone shows the code (3+3) to enter on the shop page', (await anon.page.textContent('.scanbig')) === `${code.slice(0, 3)} ${code.slice(3)}` && anonText.includes('店家：請在你的店家頁輸入此代碼'));
  await shot(anon.page, 'scan-unpaired');
  await anon.page.goto(B + `/deal/${FULL}`, { waitUntil: 'networkidle' }); await anon.page.waitForSelector('#detail .lockcard');
  check('pass: signed out → sign-in card, no 使用優惠', (await rect(anon.page, '#detailUse')).display === 'none');
  allErrors.push(...anon.page._errors);
  await anon.ctx.close();

  // Back closes the pass (its own history entry); a confirmed pass asks nothing.
  await page.goBack(); await settle(page, 600);
  check('pass: Back closes the pass, detail stays', !(await page.$('dialog.pass')) && new URL(page.url()).pathname === `/deal/${FULL}` && (await rect(page, '#detail')).vis === 'visible');
  check('pass: confirmed pass → no outcome prompt', !(await page.$('dialog.ask')));

  // Outcome prompt after closing an unconfirmed pass: 有，用成功了 → used.
  await page.goto(B + `/deal/${OTHER[0]}`, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-redeem]');
  await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg');
  const code2 = await passCode(page);
  await page.click('dialog.pass [data-close]'); await page.waitForSelector('dialog.ask[open]', { timeout: 3000 }).catch(() => {});
  check('ask: closing the pass asks 這次優惠有成功使用嗎？ with 3 answers', (await page.textContent('dialog.ask')).includes('這次優惠有成功使用嗎') && (await page.$$('dialog.ask [data-outcome]')).length === 3);
  check('ask: the pass history entry is gone', !(await page.evaluate(() => history.state?.pass)));
  await shot(page, 'ask-phone');
  await page.click('dialog.ask [data-outcome="used"]'); await settle(page, 600);
  check('ask: answer posts outcome=used', (await apiGet(page, `/api/redemptions/${code2}`)).data?.outcome === 'used' && !(await page.$('dialog.ask')));
  // An answered pass is not reused: re-opening issues a new code, and that one may be asked about.
  await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page);
  const code2b = await passCode(page);
  check('ask: an answered pass is not reused (new code)', code2b !== code2, `${code2} → ${code2b}`);
  await page.keyboard.press('Escape'); await page.waitForSelector('dialog.ask[open]', { timeout: 3000 }).catch(() => {});
  check('ask: the new pass is asked about', !!(await page.$('dialog.ask[open]')));
  // Dismissed without an answer: re-opening within the window reuses the same pass and code,
  // and closing it again asks again (a new attempt, still unanswered).
  await page.keyboard.press('Escape'); await settle(page, 500);
  check('ask: focus returns to 使用優惠 after the prompt closes', await page.evaluate(() => document.activeElement?.matches('[data-redeem]')));
  await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page);
  check('ask: an unanswered pass is reused (same code)', (await passCode(page)) === code2b);
  await page.keyboard.press('Escape'); await page.waitForSelector('dialog.ask[open]', { timeout: 3000 }).catch(() => {});
  check('ask: a re-opened, still unanswered pass is asked about again on close', !!(await page.$('dialog.ask[open]')));
  if (await page.$('dialog.ask[open]')) await page.click('dialog.ask [data-close]');
  await settle(page, 500);
  // Closed once more without re-opening: one ask per opening, not a second one.
  check('ask: dismissing the ask does not bring it back by itself', !(await page.$('dialog.ask')));
  // 店家不接受 → refused, and the report dialog opens prefilled.
  await page.goto(B + `/deal/${OTHER[1]}`, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-redeem]');
  await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg');
  const code3 = await passCode(page);
  await page.keyboard.press('Escape'); await page.waitForSelector('dialog.ask[open]', { timeout: 3000 }).catch(() => {});
  await page.click('dialog.ask [data-outcome="refused"]'); await page.waitForSelector('dialog.report textarea', { timeout: 3000 }).catch(() => {});
  check('ask: refused posts and offers the report, prefilled', (await apiGet(page, `/api/redemptions/${code3}`)).data?.outcome === 'refused' && (await page.inputValue('dialog.report textarea').catch(() => '')).includes('店家表示不接受') && !(await page.$eval('dialog.report [type="submit"]', (b) => b.disabled)));
  await shot(page, 'ask-refused-report');
  await page.keyboard.press('Escape'); await settle(page);
  await page.goto(B + `/deal/${EXPIRED}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#detailUse .usehint');
  check('pass: expired deal → no usable 使用優惠, the reason shown', await page.$eval('#detailUse .btn-cta', (b) => b.disabled) && (await page.textContent('#detailUse')).includes('已過期'));
  await shot(page, 'pass-expired-deal');
  allErrors.push(...page._errors);
  await ctx.close();
}

// Desktop: the strip under the panel header, the pass as a centred modal.
{
  const { ctx, page } = await newPage(DESKTOP, 'pass-desktop');
  await page.goto(B + `/auth/dev-login?email=desk-${STUDENT}&next=/deal/${FULL}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#detail .prose'); await settle(page);
  const hero = await rect(page, '#detailBody .dhero'); const use = await rect(page, '#detailUse');
  check('pass: desktop 使用優惠 follows the deal heading (DOM and screen)', await page.$eval('#detailUse', (u) => u.previousElementSibling?.classList.contains('dhero')) && use.top >= hero.bottom - 1 && use.right <= 1280.5, `${hero.bottom} ${use.top}`);
  await page.focus('#detailName'); await page.keyboard.press('Tab');
  check('pass: desktop tab order is deal name → 使用優惠', await page.evaluate(() => document.activeElement?.matches('[data-redeem]')));
  await shot(page, 'desktop-detail-use');
  await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page);
  const card = await rect(page, 'dialog.pass .dlg-card');
  check('pass: desktop pass is a centred modal', Math.abs((card.left + card.right) / 2 - 640) < 2 && card.width <= 430 && card.height <= 800, JSON.stringify(card));
  const code = await passCode(page);
  qrCheck('pass: QR decodes to /r/<code> (desktop)', await decodeQR(page, '.pass-qr'), `${B}/r/${code}`);
  check('pass: desktop countdown running', /^1[0-4]:[0-5]\d$|^15:00$/.test(await page.textContent('#passLeft')));
  await shot(page, 'pass-desktop');
  await page.emulateMedia({ colorScheme: 'dark' }); await settle(page, 200);
  qrCheck('pass: QR decodes in dark mode (desktop)', await decodeQR(page, '.pass-qr'), `${B}/r/${code}`);
  await shot(page, 'pass-desktop-dark');
  await page.keyboard.press('Escape'); await settle(page, 700);
  check('pass: desktop Esc closes the pass and drops its history entry', !(await page.$('dialog.pass')) && !(await page.evaluate(() => history.state?.pass)));
  await page.emulateMedia({ colorScheme: 'light' });
  if (await page.$('dialog.ask')) await page.click('dialog.ask [data-close]');
  await settle(page);
  // /m/ on a desktop: no rail.
  await page.goto(B + SHOP, { waitUntil: 'networkidle' }); await page.waitForSelector('#shopTitle');
  check('shop: desktop hides the rail, content uses the full width', (await rect(page, '#rail')).display === 'none' && (await page.evaluate(() => getComputedStyle(document.body).paddingLeft)) === '0px');
  await shot(page, 'desktop-shop');
  await page.goto(B + `/r/${code}`, { waitUntil: 'networkidle' }); await page.waitForSelector('[data-scan-confirm]');
  await shot(page, 'desktop-scan-paired');
  allErrors.push(...page._errors);
  await ctx.close();
}

// /merchants: pitch, validation, honeypot, success; linked from /me and the list footer.
{
  const { ctx, page } = await newPage(MOBILE, 'merchants');
  await page.goto(B + '/me', { waitUntil: 'networkidle' }); await settle(page);
  check('merchants: /me has a 商家合作 row', !!(await page.$('#meBody a.row[href="/merchants"]')));
  await page.click('#meBody a.row[href="/merchants"]'); await page.waitForSelector('#leadForm');
  check('merchants: in-app route, only the parent 我的 tab marked, back button shown', new URL(page.url()).pathname === '/merchants' && !(await page.$('#tabbar [aria-current="page"]')) && (await page.getAttribute('#tabbar [data-tab="me"]', 'aria-current')) === 'true' && (await page.isVisible('#appbarBack')));
  check('merchants: pitch + 4 interest options', (await page.textContent('#merchantsBody')).includes('CampusPass 整理學生可用的特約優惠') && (await page.$$('#leadForm input[name="interest"]')).length === 4
    && (await page.textContent('#leadForm .radios')).includes('洽談 CampusPass 專屬優惠'));
  const hp = await page.evaluate(() => { const w = document.querySelector('.hp'); const i = w.querySelector('input'); const r = w.getBoundingClientRect(); return { aria: w.getAttribute('aria-hidden'), tab: i.tabIndex, left: r.right, disp: getComputedStyle(i).display }; });
  check('merchants: honeypot off screen, aria-hidden, tabindex=-1', hp.aria === 'true' && hp.tab === -1 && hp.left < 0 && hp.disp !== 'none', JSON.stringify(hp));
  await page.click('#leadForm [type="submit"]'); await settle(page, 200);
  check('merchants: empty submit flags shop name and contact', (await page.getAttribute('#lead_shop_name', 'aria-invalid')) === 'true' && (await page.isVisible('#lead_email_err')) && (await page.evaluate(() => document.activeElement.id)) === 'lead_shop_name');
  await page.fill('#lead_shop_name', 'UI 測試小吃店');
  await page.fill('#lead_email', 'not-an-email');
  await page.click('#leadForm [type="submit"]'); await settle(page, 200);
  check('merchants: bad email flagged', (await page.textContent('#lead_email_err')).includes('格式'));
  await shot(page, 'merchants-errors');
  await page.fill('#lead_email', '');
  await page.fill('#lead_phone', '02-1234-5678');
  await page.click('#leadForm label.radio:has(input[value="featured_paid"])');
  await page.fill('#lead_offer', '出示學生證 9 折');
  await page.click('#leadForm [type="submit"]');
  await page.waitForSelector('.leaddone', { timeout: 4000 }).catch(() => {});
  check('merchants: valid lead → success state', (await page.textContent('#merchantsBody')).includes('已收到，謝謝'));
  const csv = await (await fetch(B + '/admin/merchants.csv', { headers: { Authorization: 'Bearer change-me' } })).text();
  check('merchants: lead stored with interest', csv.split('\n').some((l) => l.includes('UI 測試小吃店') && l.includes('featured_paid')));
  await shot(page, 'merchants-success');
  await page.click('#appbarBack'); await settle(page);
  check('merchants: back button returns to /me', new URL(page.url()).pathname === '/me');
  await page.click('#tabbar [data-tab="explore"]'); await page.waitForSelector('#exploreFoot a[href="/merchants"]');
  check('merchants: list footer links to /merchants', true);
  allErrors.push(...page._errors);
  await ctx.close();
}

// 360px: nothing scrolls sideways on the new screens.
{
  const W360 = { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  const { ctx, page } = await newPage(W360, 'w360-redeem');
  await page.goto(B + `/auth/dev-login?email=w360-${STUDENT}&next=/deal/${FULL}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-redeem]'); await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page);
  const fits = await page.evaluate(() => { const c = document.querySelector('dialog.pass .dlg-card'); return c.scrollWidth <= c.clientWidth && document.documentElement.scrollWidth <= innerWidth; });
  check('360px: pass fits without horizontal scroll', fits);
  await shot(page, 'w360-pass');
  await page.keyboard.press('Escape'); await settle(page, 700);
  if (await page.$('dialog.ask')) { await page.keyboard.press('Escape'); await settle(page); }
  for (const path of [SHOP, '/r/ABCDEF', '/merchants']) {
    await page.goto(B + path, { waitUntil: 'networkidle' }); await settle(page, 300);
    check(`360px: ${path.split('/')[1] || path} has no horizontal scroll`, await noHScroll(page));
  }
  await shot(page, 'w360-merchants');
  allErrors.push(...page._errors);
  await ctx.close();
}

/* ============ QA round 1 fixes: sessions, failures, races, a11y ============ */
{
  const { ctx, page } = await newPage(MOBILE, 'fixes');
  const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const toastText = () => page.textContent('#toast');

  // Unknown URLs: a not-found page, URL kept; trailing slashes canonicalised; a mangled pass URL.
  await page.goto(B + '/nope/x', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('404: unknown path keeps its URL and shows a not-found page', new URL(page.url()).pathname === '/nope/x' && (await page.isVisible('#view-notfound')) && (await page.textContent('#notfoundBody')).includes('找不到這個頁面') && (await page.title()).startsWith('找不到這個頁面'));
  check('404: the not-found title is the page heading', !!(await page.$('#notfoundBody [role="heading"][aria-level="1"]')));
  await page.goto(B + '/saved/', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('404: /saved/ is canonicalised to /saved', new URL(page.url()).pathname === '/saved');
  await page.goto(B + '/r/AB-CD', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('404: a mangled pass URL shows 找不到這張憑證 (title too)', (await page.textContent('#scanBody')).includes('找不到這張憑證') && (await page.title()).startsWith('找不到這張憑證'));
  await page.goto(B + '/deal/no-such-deal', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('404: a missing deal titles the page 找不到這項優惠', (await page.title()).startsWith('找不到這項優惠'));

  // A cancelled sign-in returns to the page it started from: toast there, parameter stripped.
  await page.goto(B + `/deal/${FULL}?login_error=access_denied`, { waitUntil: 'networkidle' }); await settle(page, 300);
  check('login_error: toast on the page it started from, URL cleaned', new URL(page.url()).pathname === `/deal/${FULL}` && !page.url().includes('login_error') && (await toastText()).includes('已取消'));

  // Region picker: a radio group with arrow keys, Home/End and Enter.
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  await page.click('[data-pick="region"]'); await settle(page, 350);
  const roles = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); return { group: d.querySelector('.opts').getAttribute('role'), radios: [...d.querySelectorAll('.opt')].every((b) => b.getAttribute('role') === 'radio' && b.hasAttribute('aria-checked')), li: [...d.querySelectorAll('.opts > li')].every((l) => l.getAttribute('role') === 'none'), stops: [...d.querySelectorAll('.opt')].filter((b) => b.tabIndex === 0).length, focused: document.activeElement.dataset.value }; });
  check('picker: radiogroup > none > radio, one Tab stop on the chosen option', roles.group === 'radiogroup' && roles.radios && roles.li && roles.stops === 1 && roles.focused === 'all', JSON.stringify(roles));
  await page.keyboard.press('ArrowDown');
  const afterDown = await page.evaluate(() => document.activeElement.dataset.value);
  await page.keyboard.press('End');
  const afterEnd = await page.evaluate(() => document.activeElement.dataset.value);
  await page.keyboard.press('Home'); await page.keyboard.press('ArrowUp');
  const wrapped = await page.evaluate(() => document.activeElement.dataset.value);
  check('picker: ArrowDown / End / Home+ArrowUp move focus (wrapping)', afterDown === 'north' && afterEnd === 'east' && wrapped === 'east', `${afterDown} ${afterEnd} ${wrapped}`);
  await page.keyboard.press('Enter'); await settle(page, 350);
  check('picker: Enter picks the focused option and closes', !(await page.$('dialog[open]')) && (await page.textContent('[data-pick="region"]')).includes('東部'));
  await page.click('[data-reset]'); await settle(page, 150);

  // Filters and the place in the list survive the Google round trip (simulated: start → dev-login).
  await page.route('**/auth/google/start**', (r) => { const next = new URL(r.request().url()).searchParams.get('next') || '/'; r.fulfill({ status: 302, headers: { Location: `/auth/dev-login?email=fixes-${STUDENT}&next=${encodeURIComponent(next)}` } }); });
  await page.click('[data-cat="food"]'); await settle(page, 150);
  await page.fill('#q', '飯'); await settle(page, 300);
  const rows = await page.$$eval('#list .item', (l) => l.map((x) => x.dataset.id));
  const target = rows[Math.min(rows.length - 1, 12)];
  await page.$eval(`#list .item[data-id="${target}"]`, (li) => li.scrollIntoView({ block: 'center' })); await settle(page, 300);
  const topBefore = await page.$eval(`#list .item[data-id="${target}"]`, (li) => li.getBoundingClientRect().top);
  await page.click(`#list .item[data-id="${target}"] .star`); await settle(page, 350);
  const navDone = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.click('dialog[open] .gbtn'); await navDone;
  await page.waitForSelector('#list .item'); await settle(page, 900);
  const back = await page.evaluate((id) => ({ q: document.querySelector('#q').value, cat: document.querySelector('[data-cat][aria-pressed="true"]')?.dataset.cat, top: document.querySelector(`#list .item[data-id="${id}"]`)?.getBoundingClientRect().top, star: document.querySelector(`#list .item[data-id="${id}"] .star`)?.getAttribute('aria-pressed') }), target);
  check('sign-in: search, category and scroll position survive the round trip, star saved', back.q === '飯' && back.cat === 'food' && Math.abs(back.top - topBefore) < 30 && back.star === 'true', `${JSON.stringify(back)} vs top ${topBefore}`);
  await page.unroute('**/auth/google/start**');
  await page.evaluate((id) => fetch('/api/favorites/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }), target);
  await page.click('[data-reset]').catch(() => {}); await settle(page, 150);

  // "expired" after Back into Google's picker while signed in: no error toast.
  await page.goto(B + '/?login_error=expired', { waitUntil: 'networkidle' }); await settle(page, 500);
  check('login_error=expired while signed in: no error toast', !(await page.$('#toast.show.err')) && !page.url().includes('login_error'));
  // Google not set up yet on this deployment: a calm notice, not an error.
  await page.goto(B + '/saved?login_error=not_configured', { waitUntil: 'networkidle' }); await settle(page, 500);
  check('login_error=not_configured: "opens soon" notice, not an error toast', (await page.textContent('#toast.show').catch(() => '')).includes('即將開放') && !(await page.$('#toast.show.err')) && page.url().endsWith('/saved'));

  // Favourite race: on, off within one slow PUT → the last tap wins, on the server too.
  await page.goto(B + `/deal/${FULL}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose');
  await page.evaluate((id) => fetch('/api/favorites/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }), FULL);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose');
  let favCalls = 0;
  await page.route('**/api/favorites/**', async (r) => { if (r.request().method() !== 'GET') favCalls++; await new Promise((ok) => setTimeout(ok, 1200)); r.continue(); });
  await page.click('#dhead [data-star]'); await settle(page, 100);
  await page.click('#dhead [data-star]'); await settle(page, 3200);
  const srvFavs = (await apiGet(page, '/api/me')).data.favorites;
  check('favourite race: on+off → not saved in the UI and on the server', (await page.getAttribute('#dhead [data-star]', 'aria-pressed')) === 'false' && !srvFavs.includes(FULL) && favCalls <= 2, `calls ${favCalls}`);
  await page.click('#dhead [data-star]'); await settle(page, 100);
  await page.click('#dhead [data-star]'); await settle(page, 100);
  await page.click('#dhead [data-star]'); await settle(page, 3200);
  check('favourite race: on+off+on → saved in the UI and on the server', (await page.getAttribute('#dhead [data-star]', 'aria-pressed')) === 'true' && (await apiGet(page, '/api/me')).data.favorites.includes(FULL));
  await page.unroute('**/api/favorites/**');

  // Double pass: a slow redeem, a re-render across the breakpoint, a second tap → one request.
  let redeemCalls = 0;
  await page.route('**/api/deals/*/redeem', async (r) => { redeemCalls++; await new Promise((ok) => setTimeout(ok, 1500)); r.continue(); });
  await page.click('[data-redeem]'); await settle(page, 200);
  await page.setViewportSize({ width: 1024, height: 768 }); await settle(page, 200);
  await page.setViewportSize({ width: 390, height: 844 }); await settle(page, 200);
  check('double pass: the CTA stays busy through a re-render', await page.$eval('[data-redeem]', (b) => b.disabled && b.textContent.includes('開啟中')));
  await page.click('[data-redeem]', { force: true }).catch(() => {});
  await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page, 600);
  check('double pass: one request, one pass dialog with its QR', redeemCalls === 1 && (await page.$$('dialog.pass')).length === 1 && !!(await page.$('dialog.pass #passClock:not(:empty)')), `calls ${redeemCalls}`);
  await page.unroute('**/api/deals/*/redeem');
  await page.keyboard.press('Escape'); await settle(page, 700);
  if (await page.$('dialog.ask')) { await page.click('dialog.ask [data-outcome="not_used"]'); await settle(page, 600); }

  // The countdown runs on the server's clock (server_now), not the phone's: a phone 10 min fast.
  await page.addInitScript(() => { const real = Date.now; Date.now = () => real() + 10 * 60e3; });
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('[data-redeem]'); await settle(page);
  await page.click('[data-redeem]'); await page.waitForSelector('dialog.pass .pass-qr svg'); await settle(page);
  const left = await page.textContent('#passLeft'); const clock = await page.textContent('#passClock');
  const tpe = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  check('pass: countdown and clock use server_now despite a phone clock 10 min fast', /^1[45]:[0-5]\d$/.test(left) && clock.slice(0, 5) === tpe, `${left} ${clock} vs ${tpe}`);
  await page.keyboard.press('Escape'); await settle(page, 700);
  if (await page.$('dialog.ask')) await page.keyboard.press('Escape');
  await settle(page, 300);

  // A toast while a dialog is open is announced: the live region moves into the dialog.
  await page.click('#detail [data-report]'); await page.waitForSelector('dialog.report textarea');
  await page.route('**/api/deals/*/report', (r) => r.fulfill(json(500, { error: 'boom' })));
  await page.fill('dialog.report textarea', 'live region check');
  await page.click('dialog.report [type="submit"]'); await settle(page, 300);
  check('toast: announced inside an open dialog (#live in the dialog)', await page.evaluate(() => !!document.querySelector('dialog[open] #live') && document.querySelector('#live').textContent.includes('送出失敗')));
  // 429 from the report: a friendly message, the text kept.
  await page.unroute('**/api/deals/*/report');
  await page.route('**/api/deals/*/report', (r) => r.fulfill(json(429, { error: 'rate_limited' })));
  await page.click('dialog.report [type="submit"]'); await settle(page, 300);
  check('429: report says to wait a minute, text kept', (await toastText()).includes('稍候一分鐘') && (await page.inputValue('dialog.report textarea')) === 'live region check');
  await page.unroute('**/api/deals/*/report');

  // Expired session (cookies cleared) mid-report: signed out, detail locked, sign-in offered;
  // after signing in again the report reopens with the text.
  await ctx.clearCookies();
  await page.fill('dialog.report textarea', 'kept across sign-in');
  await page.click('dialog.report [type="submit"]'); await settle(page, 500);
  check('401: report → sign-in sheet (expired reason), detail locked again', (await page.textContent('dialog[open]')).includes('登入已過期') && !!(await page.$('#detail .lockcard')) && (await rect(page, '#detailUse')).display === 'none');
  check('toast: the live region goes back to the page when its dialog closes', await page.evaluate(() => document.querySelector('#live')?.parentElement === document.body));
  await page.goto(B + `/auth/dev-login?email=fixes-${STUDENT}&next=/deal/${FULL}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('dialog.report textarea', { timeout: 5000 }).catch(() => {});
  check('401: after signing in the report reopens with the text', (await page.inputValue('dialog.report textarea').catch(() => '')) === 'kept across sign-in');
  await page.keyboard.press('Escape'); await settle(page);
  // …and a star: the sheet opens and the star is kept for after sign-in.
  await page.evaluate((id) => fetch('/api/favorites/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }), FULL);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose');
  await ctx.clearCookies();
  await page.click('#dhead [data-star]'); await settle(page, 600);
  check('401: star → sign-in sheet, the star kept for after sign-in', (await page.textContent('dialog[open]')).includes('登入已過期') && (await page.evaluate(() => sessionStorage.getItem('cp_pending_fav'))) === FULL);
  await page.goto(B + `/auth/dev-login?email=fixes-${STUDENT}&next=/deal/${FULL}`, { waitUntil: 'networkidle' }); await settle(page, 900);
  check('401: the star is saved after signing in again', (await apiGet(page, '/api/me')).data.favorites.includes(FULL));

  // /api/me failing (offline or 5xx) is not "signed out": the last known account stays.
  await page.route('**/api/me', (r) => r.abort('internetdisconnected'));
  await page.goto(B + '/me', { waitUntil: 'domcontentloaded' }); await settle(page, 900);
  check('me failure: /me keeps the account (no Google sign-in prompt), offers retry', (await page.textContent('#meBody')).includes(`fixes-${STUDENT}`) && !(await page.$('#meBody .gbtn')) && !!(await page.$('#meBody [data-retry-me]')));
  await page.goto(B + '/saved', { waitUntil: 'domcontentloaded' }); await settle(page, 900);
  check('me failure: /saved shows the kept list (offline note) with a retry, not a sign-in prompt', !(await page.$('#savedBody .gbtn')) && !!(await page.$('#savedBody [data-retry-me]')) && !!(await page.$(`#savedBody .item[data-id="${FULL}"]`)));
  await page.unroute('**/api/me');
  await page.click('#savedBody [data-retry-me]'); await settle(page, 900);
  check('me failure: retry recovers the saved list', !!(await page.$(`#savedBody .item[data-id="${FULL}"]`)));

  // A request that hangs gives up (timeout) and shows the error with a retry that works.
  await page.route('**/api/deals', () => {}); // never answers
  await page.goto(B + '/', { waitUntil: 'domcontentloaded' });
  const skelRows = await page.evaluate(() => ({ cats: document.querySelectorAll('#cats .pill').length, filters: document.querySelectorAll('#filterRow .pill').length }));
  check('loading: filter rows hold placeholder pills (no layout shift)', skelRows.cats > 0 && skelRows.filters > 0, JSON.stringify(skelRows));
  await page.waitForSelector('#list [data-retry]', { timeout: 16000 }).catch(() => {});
  check('timeout: a hung /api/deals ends in the error state with 重試', !!(await page.$('#list [data-retry]')) && (await page.getAttribute('#list', 'aria-busy')) === 'false');
  await page.unroute('**/api/deals');
  await page.click('#list [data-retry]'); await page.waitForSelector('#list .item', { timeout: 8000 }).catch(() => {});
  check('timeout: 重試 loads the list', (await itemCount(page)) > 0);

  // Detail load error (row already known): an inline retry.
  const anyId = await page.$eval('#list .item', (li) => li.dataset.id);
  await page.route(`**/api/deals/${anyId}`, (r) => r.fulfill(json(500, { error: 'boom' })));
  await page.click(`#list .item[data-id="${anyId}"] .pick`); await settle(page, 500);
  check('detail error: inline note with a 重試 button', !!(await page.$('#detailBody [data-retry-detail]')));
  await page.unroute(`**/api/deals/${anyId}`);
  await page.click('#detailBody [data-retry-detail]'); await settle(page, 700);
  check('detail error: 重試 loads the deal', !(await page.$('#detailBody [data-retry-detail]')) && !!(await page.$('#detailBody .dhero')));
  await page.click('#dhead [data-close-detail]'); await settle(page);

  // 429 on the merchant lead form.
  await page.goto(B + '/merchants', { waitUntil: 'networkidle' }); await page.waitForSelector('#leadForm');
  await page.route('**/api/merchant-leads', (r) => r.fulfill(json(429, { error: 'rate_limited' })));
  await page.fill('#lead_shop_name', 'QA 429'); await page.fill('#lead_phone', '0912345678');
  await page.click('#leadForm [type="submit"]'); await settle(page, 400);
  check('429: lead form says to wait a minute', (await page.textContent('#leadErr')).includes('稍候一分鐘'));
  await page.unroute('**/api/merchant-leads');
  await page.fill('#lead_phone', 'abc'); await page.click('#leadForm [type="submit"]'); await settle(page, 200);
  check('lead: a phone without 7 digits is flagged', (await page.textContent('#lead_phone_err')).includes('電話格式不正確'));

  // Delete account: confirm dialog explains, then signed out with a toast.
  await page.goto(B + '/me', { waitUntil: 'networkidle' }); await page.waitForSelector('[data-delete-account]');
  await page.click('[data-delete-account]'); await page.waitForSelector('dialog.confirm[open]');
  check('delete: confirm dialog explains what is deleted', (await page.textContent('dialog.confirm')).includes('永久刪除') && (await page.textContent('dialog.confirm')).includes('無法復原'));
  await shot(page, 'me-delete-confirm');
  await page.click('dialog.confirm [data-delete-confirm]'); await settle(page, 900);
  check('delete: signed out, toast shown, account gone on the server', (await toastText()).includes('帳號已刪除') && !!(await page.$('#meBody .gbtn')) && (await apiGet(page, '/api/me')).data.user === null && (await page.evaluate(() => localStorage.getItem('cp_me'))) === null);
  check('delete: focus lands on the page heading, not <body>', await page.evaluate(() => document.activeElement?.id === 'meTitle'));

  allErrors.push(...page._errors.filter((e) => !/Failed to load resource|net::ERR_/.test(e)));
  await ctx.close();
}

// Shop: pasted 「ＧＧ６３ - ＣＦ」 (full width, separators), the way back from a scan result.
{
  const { ctx, page } = await newPage(MOBILE, 'fixes-shop');
  await page.goto(B + SHOP, { waitUntil: 'networkidle' }); await page.waitForSelector('#shopCode');
  check('shop: the shop manifest is linked once the key is valid', (await page.getAttribute('link[rel="manifest"]', 'href')).startsWith('/api/merchant/'));
  await page.focus('#shopCode');
  await page.evaluate(() => { const i = document.querySelector('#shopCode'); i.value = 'ｇｇ６３ - ｃｆ'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  check('shop: a full-width, spaced paste normalises to 6 characters', (await page.inputValue('#shopCode')) === 'GG63CF' && (await page.getAttribute('#shopCode', 'maxlength')) === null);
  await page.evaluate(() => { const i = document.querySelector('#shopCode'); i.value = 'abcd-efg'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  check('shop: a 7th character is not dropped silently (hint, first 6 kept)', (await page.inputValue('#shopCode')) === 'ABCDEF' && (await page.textContent('#shopResult')).includes('已保留前 6 碼'));
  await page.goto(B + '/r/ZZZZZZ', { waitUntil: 'networkidle' }); await page.waitForSelector('#scanBody .scanstate');
  check('scan: every result links back to the shop page', (await page.getAttribute('#scanBody .scanactions a', 'href')) === SHOP);
  await page.goto(B + '/m/not-a-real-key-123', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('shop: an invalid key keeps the app manifest', (await page.getAttribute('link[rel="manifest"]', 'href')) === '/manifest.webmanifest');
  allErrors.push(...page._errors.filter((e) => !/Failed to load resource/.test(e)));
  await ctx.close();
}

/* ================= QA round 2 ================= */
const TODAY_TPE = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
const isActive = (x) => x.auto_renew || !x.expires_on || x.expires_on >= TODAY_TPE;
const liveText = (page) => page.evaluate(() => document.getElementById('live')?.textContent || '');

// Explore: order, search aliases, Reset keeps the school, the expired note follows the filters.
{
  const { ctx, page } = await newPage(MOBILE, 'qa2-explore');
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  const firstCat = BY_ID.get(await page.$eval('#list .item', (li) => li.dataset.id))?.category;
  check('order: 全部 opens with food, not the source sheet\'s hotels', firstCat === 'food', firstCat);
  const ids = () => page.$$eval('#list .item', (l) => l.map((x) => x.dataset.id));
  await page.fill('#q', 'Tainan'); await settle(page, 250);
  let got = await ids();
  check('search: an English city name finds deals by area (Tainan → 臺南)', got.length > 0 && got.every((id) => (BY_ID.get(id)?.area || '').startsWith('臺南')), `${got.length}`);
  await page.fill('#q', '大安區'); await settle(page, 250);
  got = await ids();
  check('search: the area matches (大安區)', got.length > 0 && got.some((id) => (BY_ID.get(id)?.area || '').includes('大安區')), `${got.length}`);
  check('list: the row meta shows the area', (await page.$eval('#list .item .meta', (m) => m.textContent)).includes('區'));
  await page.fill('#q', '九折'); await settle(page, 250);
  const nine = (await ids()).length;
  await page.fill('#q', '9折'); await settle(page, 250);
  check('search: 九折 ≡ 9折', nine > 0 && nine === (await ids()).length, `${nine}`);
  await page.fill('#q', 'hotel'); await settle(page, 250);
  got = await ids();
  check('search: English category words (hotel → 住宿)', got.length > 0 && got.every((id) => BY_ID.get(id)?.category === 'lodging'), `${got.length}`);
  check('pills: zero-count categories are disabled, 全部 is not', (await page.$$eval('[data-cat]', (l) => l.filter((b) => b.querySelector('.n').textContent === '0').every((b) => b.disabled))) && !(await page.$eval('[data-cat="all"]', (b) => b.disabled)));
  await page.fill('#q', 'xyzzy'); await settle(page, 250);
  check('expired note: hidden when nothing is hidden by date', !(await page.textContent('#exploreFoot')).includes('已過期'));
  await page.fill('#q', ''); await settle(page, 250);
  const expNTU = DATA.filter((x) => x.schools.includes('NTU') && x.eligibility.student && !isActive(x)).length;
  check('expired note: counts only what these filters hide by date', (await page.textContent('#exploreFoot')).includes(`另有 ${expNTU} 項已過期`), `${expNTU}`);
  await page.click('[data-pick="school"]'); await settle(page, 400);
  check('school picker: short name with the full name under it, every count shown', await page.evaluate(() => [...document.querySelectorAll('dialog[open] .opt')].every((b) => { const n = b.querySelector('.n').getBoundingClientRect(); return n.right <= innerWidth && n.width > 0; }) && !!document.querySelector('dialog[open] .optlbl small')));
  await page.click('dialog[open] [data-value="NCCU"]'); await settle(page, 400);
  check('school: a chosen school is remembered (cp_school)', (await page.textContent('[data-pick="school"] [data-label]')) === '政大' && (await page.evaluate(() => localStorage.getItem('cp_school'))) === 'NCCU');
  check('reset: a school other than the default offers Reset', !(await page.$eval('#filterRow [data-reset]', (b) => b.hidden)));
  await page.fill('#q', 'zzzz'); await settle(page, 250);
  await page.click('#list [data-reset]'); await settle(page, 250);
  check('reset: back to the default school (signed out: NTU), cp_school forgotten, search cleared', (await page.textContent('[data-pick="school"] [data-label]')) === '臺大' && (await page.inputValue('#q')) === '' && (await page.evaluate(() => localStorage.getItem('cp_school'))) === null && (await itemCount(page)) === EXPECT.student);
  await page.click('[data-pick="school"]'); await settle(page, 400);
  await page.click('dialog[open] [data-value="NTU"]'); await settle(page, 400);
  // Route changes are announced; a child page marks its parent tab; 404 doesn't repeat its title.
  await page.click('#tabbar [data-tab="saved"]'); await settle(page, 300);
  check('a11y: a tab change is announced (polite live region)', (await liveText(page)) === '收藏');
  await page.click('#tabbar [data-tab="me"]'); await settle(page, 300);
  check('me: the app-bar avatar/sign-in is hidden on /me', await page.$eval('#appbarActions', (e) => e.hidden));
  await page.click('#meBody a[href="/merchants"]'); await settle(page, 300);
  check('merchants: the 我的 tab is marked as the parent (aria-current=true)', (await page.getAttribute('#tabbar [data-tab="me"]', 'aria-current')) === 'true' && !(await page.$('#tabbar [aria-current="page"]')));
  await page.goto(B + '/nope', { waitUntil: 'networkidle' }); await settle(page, 300);
  check('404: the app bar does not repeat the page title', (await page.textContent('#appbarTitle')) === '');
  await page.goto(B + `/deal/${FULL}`, { waitUntil: 'networkidle' }); await settle(page, 400);
  check('a11y: on a phone the open detail is the main landmark', (await page.getAttribute('#detail', 'role')) === 'main');
  allErrors.push(...page._errors);
  await ctx.close();
}

// Desktop, English: deal content is marked Chinese; pill ‹ ›; popovers across the 820px breakpoint.
{
  const { ctx, page } = await newPage(DESKTOP, 'qa2-desktop');
  await page.addInitScript(() => localStorage.setItem('cp_lang', 'en'));
  await page.goto(B + `/auth/dev-login?email=qa2-desk-${STUDENT}&next=/`, { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  check('lang: EN page, Chinese deal names marked zh-Hant-TW', (await page.getAttribute('html', 'lang')) === 'en' && (await page.$eval('#list .item .nm', (e) => e.closest('[lang]').lang)) === 'zh-Hant-TW');
  check('lang: generic badges are English in EN', !(await page.$$eval('#list .item .badge', (l) => l.some((b) => b.textContent === '專屬優惠價' || b.textContent === '特約優惠'))));
  const arrows = await page.evaluate(() => ({ wrap: document.getElementById('catWrap').className, r: getComputedStyle(document.querySelector('.pillarrow.r')).display, l: getComputedStyle(document.querySelector('.pillarrow.l')).display }));
  check('pills: a › button shows at the cut-off edge (desktop), ‹ hidden at the start', /more-r/.test(arrows.wrap) && arrows.r !== 'none' && arrows.l === 'none', JSON.stringify(arrows));
  await page.click('.pillarrow.r'); await settle(page, 700);
  check('pills: › scrolls the category row', (await page.$eval('#cats', (c) => c.scrollLeft)) > 0 && (await page.$eval('.pillarrow.l', (b) => getComputedStyle(b).display)) !== 'none');
  await page.click('#list .item .pick'); await settle(page, 500);
  check('lang: detail name and offer are zh-Hant-TW in EN', (await page.$eval('#detailName', (e) => e.closest('[lang]').lang)) === 'zh-Hant-TW');
  await page.keyboard.press('Escape'); await settle(page, 300);
  // Account popover clears the rail; crossing to a phone closes it.
  await page.click('#railAvatar'); await settle(page, 350);
  const pop = await rect(page, 'dialog.acct'); const rail = await rect(page, '#rail');
  check('account menu: the popover does not overlap the rail', pop.left >= rail.right + 7, `${pop.left} vs ${rail.right}`);
  await page.setViewportSize({ width: 800, height: 800 }); await settle(page, 400);
  check('breakpoint: an open account popover closes when the window becomes a phone', !(await page.$('dialog[open]')));
  await page.setViewportSize({ width: 1280, height: 800 }); await settle(page, 300);
  await page.click('[data-pick="region"]'); await settle(page, 350);
  check('breakpoint: the region picker opens as a popover on a desktop', !!(await page.$('dialog.picker.dlg-pop[open]')));
  await page.setViewportSize({ width: 800, height: 800 }); await settle(page, 500);
  const sheet = await page.evaluate(() => { const d = document.querySelector('dialog.picker[open]'); if (!d) return null; const r = d.getBoundingClientRect(); return { pop: d.classList.contains('dlg-pop'), bottom: r.bottom, width: r.width, h: innerHeight }; });
  check('breakpoint: the open picker re-opens as a bottom sheet on a phone', sheet && !sheet.pop && Math.abs(sheet.bottom - sheet.h) < 2 && sheet.width === 800, JSON.stringify(sheet));
  await page.keyboard.press('Escape'); await settle(page, 400);
  allErrors.push(...page._errors);
  await ctx.close();
}

// Saved deals readable offline (cp_saved_cache), expired grouped last, wiped on sign-out / another account.
{
  const { ctx, page } = await newPage(MOBILE, 'qa2-offline');
  const A = `qa2-a-${STUDENT}`;
  await page.goto(B + `/auth/dev-login?email=${A}&next=/deal/${FULL}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose');
  await page.click('#dhead [data-star]'); await settle(page, 1200);
  const cache = () => page.evaluate(() => JSON.parse(localStorage.getItem('cp_saved_cache') || 'null'));
  let c = await cache();
  check('offline copy: saving a deal keeps its full detail for this account', c?.email === A && c.order.includes(FULL) && !!c.deals[FULL]?.address && !!c.deals[FULL]?.offer, JSON.stringify(c && { email: c.email, order: c.order }));
  await page.evaluate((id) => fetch('/api/favorites/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }), EXPIRED);
  await page.goto(B + '/saved', { waitUntil: 'networkidle' }); await page.waitForSelector('#savedBody .item');
  const groups = await page.evaluate(() => [...document.querySelectorAll('#savedBody .list')].map((ul) => [...ul.querySelectorAll('.item')].map((li) => li.dataset.id)));
  check('saved: usable deals first, expired ones under 已過期 at the bottom', groups.length === 2 && groups[0].includes(FULL) && groups[1].includes(EXPIRED) && (await page.textContent('#savedBody .listhead')) === '已過期', JSON.stringify(groups));
  // The network goes away (a tunnel): the browser says offline, the account and the deal can't load
  // (the shell itself would come from the service worker, blocked in these tests).
  await page.addInitScript(() => { if (sessionStorage.getItem('__fakeOffline')) Object.defineProperty(Navigator.prototype, 'onLine', { get: () => false }); });
  await page.evaluate(() => sessionStorage.setItem('__fakeOffline', '1'));
  await page.route('**/api/me', (r) => r.abort()); await page.route('**/api/deals/**', (r) => r.abort()); await page.route('**/api/deals', (r) => r.abort());
  await page.goto(B + '/saved', { waitUntil: 'domcontentloaded' }); await page.waitForSelector('#savedBody .offnote', { timeout: 15000 }).catch(() => {});
  check('offline: /saved lists the kept saved deals, labelled 離線顯示，上次更新', (await page.textContent('#savedBody .offnote').catch(() => '')).includes('離線顯示，上次更新') && !!(await page.$(`#savedBody .item[data-id="${FULL}"]`)));
  await shot(page, 'qa2-saved-offline');
  await page.click(`#savedBody .item[data-id="${FULL}"] .pick`); await page.waitForSelector('#detailBody .offnote', { timeout: 15000 }).catch(() => {});
  const det = await page.textContent('#detailBody');
  check('offline: a saved deal opens with its terms and address, marked offline, no 使用優惠', det.includes(BY_ID.get(FULL).address || '仁愛路') && !!(await page.$('#detailBody .prose')) && det.includes('離線顯示') && (await rect(page, '#detailUse')).display === 'none');
  await shot(page, 'qa2-detail-offline');
  await page.unroute('**/api/me'); await page.unroute('**/api/deals/**'); await page.unroute('**/api/deals');
  await page.evaluate(() => sessionStorage.removeItem('__fakeOffline'));
  // Another account signs in on this browser: A's copy is gone.
  await page.goto(B + `/auth/dev-login?email=qa2-b-${STUDENT}&next=/saved`, { waitUntil: 'networkidle' }); await settle(page, 600);
  c = await cache();
  check('offline copy: another account signing in replaces it (no deals of the first)', !c || (c.email !== A && !c.deals[FULL]), JSON.stringify(c && c.email));
  // Back to A, then sign out: wiped.
  await page.goto(B + `/auth/dev-login?email=${A}&next=/deal/${FULL}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose'); await settle(page, 600);
  check('offline copy: opening a saved deal refreshes it', !!(await cache())?.deals?.[FULL]);
  const code = (await page.evaluate((id) => fetch(`/api/deals/${id}/redeem`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((r) => r.json()), FULL)).code;
  await page.goto(B + '/me', { waitUntil: 'networkidle' }); await page.click('#meBody [data-signout]'); await settle(page, 700);
  check('offline copy: wiped on sign-out', (await page.evaluate(() => localStorage.getItem('cp_saved_cache'))) === null);
  allErrors.push(...page._errors.filter((e) => !/Failed to load resource|net::ERR_/.test(e)));
  await ctx.close();

  // /m/<key> on an iPhone: the ID check before confirming, the Safari note, and what was confirmed.
  const IPHONE = { ...MOBILE, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' };
  const shopI = await newPage(IPHONE, 'shop');
  const sp = shopI.page;
  await sp.goto(B + SHOP, { waitUntil: 'networkidle' }); await sp.waitForSelector('#shopCode');
  check('shop (iOS Safari): keep this page in Safari, or type the code', (await sp.textContent('#shopBody')).includes('請用 Safari 開啟並保留此頁') && !!(await sp.$('#shopBody .confirmcard .idcheck')));
  await sp.fill('#shopCode', code); await sp.click('#shopForm [type="submit"]'); await sp.waitForSelector('#shopResult .result.ok');
  const res = await sp.textContent('#shopResult');
  check('shop: a typed code shows the deal, its terms, who it is for and the masked account', res.includes('台北福華大飯店') && res.includes(BY_ID.get(FULL).offer.slice(0, 12)) && res.includes('限臺大') && res.includes('q***@') && res.includes('測試登入'), res.replace(/\s+/g, ' ').slice(0, 160));
  await shopI.ctx.close();
  const standalone = await newPage(IPHONE, 'shop');
  await standalone.page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { get: () => true }));
  await standalone.page.goto(B + SHOP, { waitUntil: 'networkidle' }); await standalone.page.waitForSelector('#shopCode');
  check('shop (iOS home screen): scanning opens Safari, so type the code', (await standalone.page.textContent('#shopBody')).includes('用相機掃描 QR 會跳到 Safari'));
  await standalone.ctx.close();
}

// Saved deals sync in bulk (/api/favorites/details: no views), including ones saved on another device.
{
  const { ctx, page } = await newPage(MOBILE, 'qa2-sync');
  const U = `qa2-sync-${STUDENT}`;
  await page.goto(B + `/auth/dev-login?email=${U}&next=/`, { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  await page.evaluate((id) => fetch('/api/favorites/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }), EXPIRED); // "another device"
  const detailGets = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (/^\/api\/deals\/[^/]+$/.test(u.pathname)) detailGets.push(u.pathname); });
  const bulk = page.waitForResponse((r) => r.url().includes('/api/favorites/details'), { timeout: 8000 }).catch(() => null);
  await page.reload({ waitUntil: 'networkidle' }); await bulk; await settle(page, 400);
  const cache = () => page.evaluate(() => JSON.parse(localStorage.getItem('cp_saved_cache') || 'null'));
  let c = await cache();
  check('sync: on app start the full saved deals arrive in one request (also those saved elsewhere)', c?.email === U && !!c.deals[EXPIRED] && 'offer' in c.deals[EXPIRED] && c.order.includes(EXPIRED));
  const id = await page.$eval('#list .item', (li) => li.dataset.id);
  await page.click(`#list .item[data-id="${id}"] .star`); await settle(page, 2200);
  c = await cache();
  check('sync: a star from the list is kept in full with no per-deal request (no extra views)', !!c?.deals[id] && 'offer' in c.deals[id] && detailGets.length === 0, `${detailGets.join(',')}`);
  await page.click(`#list .item[data-id="${id}"] .star`); await settle(page, 2200);
  check('sync: unsaving drops it from the kept copy', !(await cache())?.deals[id]);
  // The server fails while online: /saved says so, not 「目前離線」.
  await page.route('**/api/me', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await page.evaluate(() => localStorage.removeItem('cp_saved_cache'));
  await page.goto(B + '/saved', { waitUntil: 'networkidle' }); await settle(page, 500);
  const sv = await page.textContent('#savedBody');
  check('saved: a server error while online is not called offline', sv.includes('無法載入收藏') && !sv.includes('目前離線') && !!(await page.$('#savedBody [data-retry-me]')), sv.replace(/\s+/g, ' ').slice(0, 80));
  await page.unroute('**/api/me');
  allErrors.push(...page._errors.filter((e) => !/Failed to load resource/.test(e)));
  await ctx.close();
}

// Offline, an answer from a cache is not "back online" (no false 「已恢復連線」).
{
  const { ctx, page } = await newPage(MOBILE, 'qa2-online');
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  const list = await apiGet(page, '/api/deals');
  await page.evaluate(() => { window.__toasts = []; new MutationObserver(() => window.__toasts.push(document.getElementById('toast').textContent)).observe(document.getElementById('toast'), { childList: true, characterData: true, subtree: true }); });
  await ctx.setOffline(true); await settle(page, 300);
  // What the service worker does offline: /api/deals answered from its cache.
  await page.route('**/api/deals', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(list.data) }));
  await page.evaluate(() => dispatchEvent(new Event('cp:deals-updated'))); await settle(page, 800);
  const toasts = await page.evaluate(() => window.__toasts);
  check('offline: a cached answer does not flash 已恢復連線', toasts.some((x) => x.includes('離線')) && !toasts.some((x) => x.includes('已恢復連線')), JSON.stringify(toasts));
  await page.unroute('**/api/deals');
  await ctx.setOffline(false); await settle(page, 800);
  check('online again: 已恢復連線 once the network is really back', (await page.evaluate(() => window.__toasts)).some((x) => x.includes('已恢復連線')));
  await ctx.close();
}

// Back from Google onto a deep row: it lands where it was (rows above are content-visibility placeholders).
{
  const { ctx, page } = await newPage(MOBILE, 'qa2-deep');
  await page.route('**/auth/google/start**', (r) => { const next = new URL(r.request().url()).searchParams.get('next') || '/'; r.fulfill({ status: 302, headers: { Location: `/auth/dev-login?email=qa2-deep-${STUDENT}&next=${encodeURIComponent(next)}` } }); });
  await page.goto(B + '/', { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  await scrollBottom(page); await page.evaluate(() => scrollTo(0, 0)); await settle(page, 200);
  await page.mouse.wheel(0, 6000); await settle(page, 600);
  const target = await page.evaluate(() => [...document.querySelectorAll('#list .item')].find((li) => li.getBoundingClientRect().top > 300)?.dataset.id);
  const before = await page.$eval(`#list .item[data-id="${target}"]`, (li) => li.getBoundingClientRect().top);
  await page.click(`#list .item[data-id="${target}"] .star`); await settle(page, 350);
  const navDone = page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  await page.click('dialog[open] .gbtn'); await navDone;
  await page.waitForSelector('#list .item'); await settle(page, 1200);
  const after = await page.evaluate((id) => document.querySelector(`#list .item[data-id="${id}"]`)?.getBoundingClientRect().top, target);
  check('sign-in: a deep-scrolled row comes back within a few px', Math.abs(after - before) <= 8, `${before} → ${after}`);
  await page.evaluate((id) => fetch('/api/favorites/' + id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }), target);
  await ctx.close();
}

// Desktop deep link, signed in, the list answering first: one deal request (one view), heading focused.
{
  const { ctx, page } = await newPage(DESKTOP, 'qa2-deeplink');
  await page.goto(B + `/auth/dev-login?email=qa2-dl-${STUDENT}&next=/`, { waitUntil: 'networkidle' }); await page.waitForSelector('#list .item');
  let gets = 0;
  await page.route(`**/api/deals/${FULL}`, async (r) => { gets++; await new Promise((res) => setTimeout(res, 700)); await r.continue(); });
  await page.goto(B + `/deal/${FULL}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#detail .prose'); await settle(page, 600);
  check('deep link: the deal is fetched once (one view)', gets === 1, `${gets}`);
  check('deep link: focus is on the deal heading, not <body>', await page.evaluate(() => document.activeElement?.id === 'detailName'));
  await ctx.close();
}

/* ================= School cards (CampusPass 校園卡) ================= */
// Explore counts for a set of schools: student-eligible, not expired, any of the schools.
const countFor = (schools) => DATA.filter((x) => x.eligibility.student && isActive(x) && x.schools.some((sc) => schools.includes(sc))).length;
const sourcesFor = (sc) => new Set(DATA.filter((x) => x.schools.includes(sc)).map((x) => x.source_org));
const CARD_USER = 'x@ntu.edu.tw';
const meJSON = (page) => apiGet(page, '/api/me').then((r) => r.data);
const delCard = (page, id) => page.evaluate((i) => fetch('/api/identities/' + i, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}' }), id);
{
  const { ctx, page } = await newPage(MOBILE, 'cards');
  await page.goto(B + `/auth/dev-login?email=${CARD_USER}&next=/me`, { waitUntil: 'networkidle' });
  // A clean start: only the NTU card that this sign-in creates, as a student, no school chosen.
  for (const c of (await meJSON(page)).identities) {
    if (c.school !== 'NTU') await delCard(page, c.id);
    else if (c.role !== 'student') await page.evaluate((i) => fetch('/api/identities/' + i, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'student' }) }), c.id);
  }
  await page.evaluate(() => localStorage.removeItem('cp_school'));
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('.idcard');
  const cardTexts = () => page.$$eval('#meBody .idcards > li.idcard', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ')));
  let cards = await cardTexts();
  check('cards: signing in with a school email shows that school\'s card (臺大, full name, email, role, expiry)', cards.length === 1 && cards[0].includes('臺大') && cards[0].includes('國立臺灣大學') && cards[0].includes(CARD_USER) && cards[0].includes('學生') && cards[0].includes('有效至'), cards.join(' | '));
  check('cards: a dev login is tagged 測試, not claimed as verified', cards[0].includes('測試登入') && !cards[0].includes('已驗證'));
  check('cards: a list of cards, each named by its school heading', await page.evaluate(() => { const ul = document.querySelector('#meBody ul.idcards'); const li = ul?.querySelector('li.idcard'); return !!ul && !!li && document.getElementById(li.getAttribute('aria-labelledby'))?.tagName === 'H3'; }));
  check('cards: the remove button and the role picker are labelled', (await page.getAttribute('.idcard [data-remove-card]', 'aria-label')) === '移除臺大校園卡' && (await page.getAttribute('.idcard select[data-role-id]', 'aria-label')).includes('身分（自填）'));
  check('cards: chip row under the name (臺大)', (await page.$$eval('#meBody .profile .idchips li', (l) => l.map((x) => x.textContent))).join() === '臺大');
  check('cards: never a school\'s branding (CampusPass 校園卡, no school logo images)', (await page.textContent('.idcard .idc-brand')).includes('CampusPass 校園卡') && !(await page.$('.idcard img')));
  check('cards: no horizontal scroll at 390', await noHScroll(page));

  // Explore with one card: 我的學校 is the default.
  await page.click('#tabbar [data-tab="explore"]'); await page.waitForSelector('#list .item'); await settle(page, 300);
  check('explore: with a card and no school chosen, the default is 我的學校', (await page.textContent('[data-pick="school"] [data-label]')) === '我的學校' && (await itemCount(page)) === countFor(['NTU']), `${await itemCount(page)}`);

  // Add NCCU through the test path in the add sheet.
  await page.click('#tabbar [data-tab="me"]'); await settle(page, 300);
  await page.click('#meBody .idc-add'); await settle(page, 450);
  const sheet = await page.textContent('dialog[open]');
  check('add sheet: Google (enabled), school-email code (disabled, 即將推出), test path labelled 測試用（未經 Google 驗證）',
    (await page.getAttribute('dialog[open] a.method[data-link-google]', 'href')) === '/auth/google/start?link=1&next=%2Fme'
    && (await page.$eval('dialog[open] button.method', (b) => b.disabled && b.textContent.includes('以學校信箱收驗證碼') && b.textContent.includes('即將推出')))
    && sheet.includes('測試用（未經 Google 驗證）') && !!(await page.$('dialog[open] form.devlink input[name="email"][type="email"]')));
  check('add sheet: a bottom sheet on a phone, focus inside it', await page.evaluate(() => { const d = document.querySelector('dialog[open]'); const r = d.getBoundingClientRect(); return Math.abs(r.bottom - innerHeight) < 2 && d.contains(document.activeElement); }));
  await shot(page, 'cards-add-sheet');
  await page.fill('#devEmail', 'x@nccu.edu.tw');
  await Promise.all([page.waitForURL((u) => u.pathname === '/me' && !u.search.includes('identity_added'), { timeout: 10000 }).catch(() => {}), page.click('dialog[open] form.devlink [type="submit"]')]);
  await page.waitForSelector('.idcard >> nth=1'); await settle(page, 500);
  cards = await cardTexts();
  check('add: back on /me with two cards, a toast, and the parameter stripped', cards.length === 2 && cards.some((c) => c.includes('政大')) && (await page.textContent('#toast')).includes('已新增政大校園卡') && new URL(page.url()).search === '', `${cards.length} ${page.url()}`);
  check('add: chips 臺大 · 政大', (await page.$$eval('#meBody .profile .idchips li', (l) => l.map((x) => x.textContent))).join() === '臺大,政大');
  await shot(page, 'cards-phone-light');

  // Sources on /me: grouped by the reader's schools, everything else folded away.
  const groups = await page.$$eval('#meBody .srcschool', (l) => l.filter((h) => !h.closest('details')).map((h) => h.textContent));
  const shownSrc = await page.$$eval('#meBody .srclist', (l) => l.filter((u) => !u.closest('details')).flatMap((u) => [...u.querySelectorAll('li > span:first-child')].map((x) => x.textContent)));
  const mineSrc = new Set([...sourcesFor('NTU'), ...sourcesFor('NCCU')]);
  check('sources: grouped under the reader\'s schools (國立臺灣大學, 國立政治大學), only their sources', groups.join() === '國立臺灣大學,國立政治大學' && shownSrc.length > 0 && shownSrc.every((x) => mineSrc.has(x)), `${groups} / ${shownSrc.length}`);
  const other = await page.$eval('#meBody details.srcother', (d) => ({ open: d.open, sum: d.querySelector('summary').textContent, n: d.querySelectorAll('.srclist li').length, leak: [...d.querySelectorAll('.srclist li > span:first-child')].map((x) => x.textContent) }));
  check('sources: other schools\' sources collapsed under 其他學校的來源 (closed), none repeated', !other.open && other.sum.includes('其他學校的來源') && other.n > 0 && other.leak.every((x) => !mineSrc.has(x)), JSON.stringify(other).slice(0, 120));

  // Explore: 我的學校 = the union of both cards.
  await page.click('#tabbar [data-tab="explore"]'); await page.waitForSelector('#list .item'); await settle(page, 300);
  const union = countFor(['NTU', 'NCCU']);
  await scrollBottom(page); await page.evaluate(() => scrollTo(0, 0));
  check('explore: 我的學校 covers both cards (count = union)', (await itemCount(page)) === union && (await page.textContent('#fcount')).includes(String(union)), `${await itemCount(page)} vs ${union}`);
  check('explore: no Reset for the default school', await page.$eval('#filterRow [data-reset]', (b) => b.hidden));
  await page.click('[data-pick="school"]'); await settle(page, 450);
  const firstOpt = await page.$eval('dialog[open] .opt', (b) => ({ v: b.dataset.value, t: b.textContent, checked: b.getAttribute('aria-checked') }));
  check('picker: 我的學校（臺大、政大） first, chosen, with the union count', firstOpt.v === 'mine' && firstOpt.t.includes('我的學校（臺大、政大）') && firstOpt.t.includes(String(union)) && firstOpt.checked === 'true', JSON.stringify(firstOpt));
  await shot(page, 'cards-explore-picker');
  await page.click('dialog[open] [data-value="NCCU"]'); await settle(page, 400);
  check('explore: choosing one school still works and is remembered', (await page.textContent('[data-pick="school"] [data-label]')) === '政大' && (await page.evaluate(() => localStorage.getItem('cp_school'))) === 'NCCU' && (await itemCount(page)) === countFor(['NCCU']));
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForSelector('#list .item'); await settle(page, 400);
  check('explore: the chosen school survives a reload', (await page.textContent('[data-pick="school"] [data-label]')) === '政大');
  await page.click('#filterRow [data-reset]'); await settle(page, 300);
  check('reset: back to 我的學校 (the reader\'s default)', (await page.textContent('[data-pick="school"] [data-label]')) === '我的學校' && (await page.evaluate(() => localStorage.getItem('cp_school'))) === null);
  await shot(page, 'cards-explore-mine');

  // Role change → PATCH.
  await page.click('#tabbar [data-tab="me"]'); await settle(page, 300);
  const nccu = (await meJSON(page)).identities.find((c) => c.school === 'NCCU');
  await page.focus(`select[data-role-id="${nccu.id}"]`);
  await page.selectOption(`select[data-role-id="${nccu.id}"]`, 'alumni'); await settle(page, 700);
  check('role: picking 校友 saves it (PATCH), focus stays on the picker', (await meJSON(page)).identities.find((c) => c.id === nccu.id)?.role === 'alumni' && (await page.evaluate(() => document.activeElement?.matches('select[data-role-id]'))) && (await page.textContent('#toast')).includes('已更新身分'));

  // Dark mode screenshot of the two cards.
  await page.emulateMedia({ colorScheme: 'dark' }); await settle(page, 250);
  await shot(page, 'cards-phone-dark');
  await page.emulateMedia({ colorScheme: 'light' });

  // Remove the NCCU card: confirm dialog (focus trapped), DELETE, Explore follows.
  await page.click(`[data-remove-card="${nccu.id}"]`); await settle(page, 400);
  check('remove: a confirm dialog names the card', (await page.textContent('dialog[open] h2')) === '移除政大校園卡？');
  const trap = [];
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); trap.push(await page.evaluate(() => !!document.activeElement.closest('dialog[open]'))); }
  check('remove: focus is trapped in the dialog', trap.every(Boolean));
  await page.click('dialog[open] [data-remove-confirm]'); await settle(page, 700);
  cards = await cardTexts();
  check('remove: the card is gone (here and on the server), focus lands on 新增學校身分', cards.length === 1 && cards[0].includes('臺大') && !(await meJSON(page)).identities.some((c) => c.school === 'NCCU') && (await page.evaluate(() => document.activeElement?.classList.contains('idc-add'))));
  await page.click('#tabbar [data-tab="explore"]'); await page.waitForSelector('#list .item'); await settle(page, 300);
  check('remove: Explore\'s 我的學校 follows (NTU only)', (await itemCount(page)) === countFor(['NTU']));

  // identity_error → toast, parameter stripped.
  await page.goto(B + '/me?identity_error=unknown_school', { waitUntil: 'networkidle' }); await settle(page, 400);
  check('identity_error: toast 這個信箱不屬於目前支援的學校, parameter stripped', (await page.textContent('#toast')).includes('這個信箱不屬於目前支援的學校') && new URL(page.url()).search === '');
  await page.goto(B + '/me?identity_error=whatever', { waitUntil: 'networkidle' }); await settle(page, 400);
  check('identity_error: an unknown reason gets the generic message', (await page.textContent('#toast')).includes('無法新增學校身分'));

  // The Google link path through the mock: start?link=1 → account picker → back on /me with identity_added.
  await page.click('#meBody .idc-add'); await settle(page, 400);
  await Promise.all([page.waitForURL(/localhost:9876/, { timeout: 10000 }), page.click('dialog[open] a.method[data-link-google]')]);
  await page.fill('input[name="login_hint"]', 'x@nccu.edu.tw');
  await Promise.all([page.waitForURL((u) => u.host === 'localhost:8787' && u.pathname === '/me', { timeout: 15000 }), page.click('#continue')]);
  await page.waitForSelector('.idcard >> nth=1'); await settle(page, 500);
  const g = (await meJSON(page)).identities.find((c) => c.school === 'NCCU');
  const gText = (await cardTexts()).find((c) => c.includes('政大')) || '';
  check('google link: the mock round trip adds a Google-verified card (✓ 已驗證 · Google 驗證), same account', g?.method === 'google' && gText.includes('已驗證') && gText.includes('Google 驗證') && (await meJSON(page)).user.email === CARD_USER && (await page.textContent('#toast')).includes('已新增政大校園卡'), gText);
  await page.setViewportSize({ width: 360, height: 780 }); await settle(page, 200);
  check('cards: no horizontal scroll at 360', await noHScroll(page));
  const wrapped = await page.evaluate(() => [...document.querySelectorAll('.idc-status, .idc-lbl, .idc-short, .idc-add span, .idc-sel select, .schip')].filter((e) => e.getClientRects().length > 1 || e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  check('cards: labels and pills never wrap or clip at 360', wrapped.length === 0, wrapped.join(' | '));
  await page.setViewportSize({ width: 390, height: 844 });
  await delCard(page, g.id);

  // An expired card (stubbed /api/me): greyed, 已過期，請重新驗證, 重新驗證 opens the add flow; not in 我的學校.
  const real = await meJSON(page);
  const ntu = real.identities.find((c) => c.school === 'NTU');
  await page.route('**/api/me', (r) => r.request().method() === 'GET'
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...real, identities: [ntu, { id: 999999, school: 'NCCU', role: 'student', email: 'x@nccu.edu.tw', method: 'google', verified_at: '2025-01-02 03:04:05', expires_at: '2026-01-02 03:04:05', active: false }] }) })
    : r.continue());
  await page.goto(B + '/me', { waitUntil: 'networkidle' }); await page.waitForSelector('.idcard.is-expired'); await settle(page, 300);
  const exp = await page.$eval('.idcard.is-expired', (li) => li.textContent.replace(/\s+/g, ' '));
  check('expired: greyed card says 已過期，請重新驗證 with a 重新驗證 button and its expiry', exp.includes('已過期，請重新驗證') && exp.includes('2026/01/02') && !!(await page.$('.idcard.is-expired [data-reverify]')) && (await page.$eval('.idcard.is-expired', (li) => li.classList.contains('tone-expired'))), exp);
  check('expired: the chip row lists only active cards', (await page.$$eval('#meBody .profile .idchips li', (l) => l.map((x) => x.textContent))).join() === '臺大');
  await page.evaluate(() => document.querySelector('.idcard.is-expired').scrollIntoView({ block: 'center' })); await settle(page, 200);
  await shot(page, 'cards-expired');
  await page.click('.idcard.is-expired [data-reverify]'); await settle(page, 400);
  check('expired: 重新驗證 opens the add sheet (test email prefilled)', (await page.isVisible('dialog[open] a.method[data-link-google]')) && (await page.inputValue('#devEmail')) === 'x@nccu.edu.tw');
  await page.keyboard.press('Escape'); await settle(page, 300);
  await page.click('#tabbar [data-tab="explore"]'); await page.waitForSelector('#list .item'); await settle(page, 300);
  await page.click('[data-pick="school"]'); await settle(page, 400);
  check('expired: 我的學校 counts active cards only (臺大)', (await page.$eval('dialog[open] .opt', (b) => b.textContent)).includes('我的學校（臺大）'));
  await page.keyboard.press('Escape'); await settle(page, 200);

  // Features off: no Google, no test path.
  await page.unroute('**/api/me');
  await page.route('**/api/me', (r) => r.request().method() === 'GET'
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...real, identities: [], features: { google: false, dev_login: false, email_code: false } }) })
    : r.continue());
  await page.goto(B + '/me', { waitUntil: 'networkidle' }); await page.waitForSelector('#meBody .idc-empty'); await settle(page, 300);
  check('empty: no cards explains why to add one', (await page.textContent('#meBody .idc-empty')).includes('探索會預設顯示你學校的優惠'));
  await shot(page, 'cards-empty');
  await page.click('#meBody .idc-empty [data-add-card]'); await settle(page, 400);
  check('add sheet: without Google it says 「Google 登入尚未開放」 and offers no test path', (await page.textContent('dialog[open]')).includes('Google 登入尚未開放') && !(await page.$('dialog[open] a[data-link-google]')) && !(await page.$('dialog[open] form.devlink')));
  await page.keyboard.press('Escape'); await settle(page, 200);
  await page.click('#tabbar [data-tab="explore"]'); await page.waitForSelector('#list .item'); await settle(page, 300);
  check('explore: no active cards → NTU as before', (await page.textContent('[data-pick="school"] [data-label]')) === '臺大' && (await itemCount(page)) === EXPECT.student);
  await page.unroute('**/api/me');

  // English: no Chinese in the card chrome.
  await page.evaluate(() => localStorage.setItem('cp_lang', 'en'));
  await page.goto(B + '/me', { waitUntil: 'networkidle' }); await page.waitForSelector('.idcard'); await settle(page, 300);
  const enCard = await page.$eval('.idcard', (li) => [...li.querySelectorAll('.idc-brand, .idc-status, .idc-lbl, select, .idc-short')].map((e) => e.textContent).join(' '));
  check('en: card chrome in English (CampusPass card, Role · self-declared, Valid until, NTU)', enCard.includes('CampusPass card') && enCard.includes('Role · self-declared') && enCard.includes('Valid until') && enCard.includes('NTU') && !/[一-鿿]/.test(enCard), enCard);
  await page.evaluate(() => localStorage.removeItem('cp_lang'));
  allErrors.push(...page._errors.filter((e) => !/status of 404/.test(e)));
  await ctx.close();
}

// Desktop: the cards side by side.
{
  const { ctx, page } = await newPage(DESKTOP, 'cards-desk');
  await page.goto(B + `/auth/dev-login?email=desk-${CARD_USER}&next=/me`, { waitUntil: 'networkidle' });
  await page.goto(B + `/auth/dev-login?email=desk-x@nccu.edu.tw&link=1&next=/me`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.idcard >> nth=1'); await settle(page, 500);
  const r = await page.$$eval('.idcard', (l) => l.map((x) => x.getBoundingClientRect().top));
  check('desktop: two cards side by side', r.length === 2 && Math.abs(r[0] - r[1]) < 1);
  await shot(page, 'cards-desktop');
  await page.emulateMedia({ colorScheme: 'dark' }); await settle(page, 200);
  await shot(page, 'cards-desktop-dark');
  for (const c of (await meJSON(page)).identities) if (c.school === 'NCCU') await delCard(page, c.id);
  allErrors.push(...page._errors);
  await ctx.close();
}

// Cashier: a Google-verified card shows 已驗證 臺大身分（Google）; the ID check stays.
{
  const stu = await newPage(MOBILE, 'cards-pass');
  const sp = stu.page;
  const email = `gcard-${Date.now()}@ntu.edu.tw`;
  await Promise.all([sp.waitForURL(/localhost:9876/, { timeout: 10000 }), sp.goto(B + `/auth/google/start?next=${encodeURIComponent('/deal/' + FULL)}`)]);
  await sp.fill('input[name="login_hint"]', email);
  await Promise.all([sp.waitForURL((u) => u.host === 'localhost:8787' && u.pathname === `/deal/${FULL}`, { timeout: 15000 }), sp.click('#continue')]);
  await sp.waitForSelector('#detail .prose'); await settle(sp, 300);
  await sp.click('[data-redeem]'); await sp.waitForSelector('dialog.pass .pass-qr svg');
  const code = await passCode(sp);
  const shopP = await newPage(MOBILE, 'shop');
  await shopP.page.goto(B + SHOP, { waitUntil: 'networkidle' }); await shopP.page.waitForSelector('#shopTitle');
  await shopP.page.goto(B + `/r/${code}`, { waitUntil: 'networkidle' }); await shopP.page.waitForSelector('[data-scan-confirm]');
  const txt = (await shopP.page.textContent('#scanBody')).replace(/\s+/g, ' ');
  check('cashier /r: 已驗證 臺大身分（Google） with the self-declared role, and 請核對學生證 still shown', txt.includes('已驗證 臺大身分（Google）') && txt.includes('自填身分：學生') && txt.includes('請核對學生證後再確認') && !(await shopP.page.$('#scanBody .vline.is-test')), txt.slice(0, 200));
  await shopP.page.evaluate(() => document.querySelector('.vlines').scrollIntoView({ block: 'center' })); await settle(shopP.page, 200);
  await shot(shopP.page, 'cards-cashier-verified');
  await shopP.page.goto(B + SHOP, { waitUntil: 'networkidle' }); await shopP.page.waitForSelector('#shopCode');
  await shopP.page.fill('#shopCode', code); await shopP.page.press('#shopCode', 'Enter');
  await shopP.page.waitForSelector('#shopResult .result.ok');
  check('cashier /m: the confirmed result shows the verified card too', (await shopP.page.textContent('#shopResult')).includes('已驗證 臺大身分（Google）'));
  await shot(shopP.page, 'cards-shop-result');
  allErrors.push(...sp._errors);
  await shopP.ctx.close();
  await stu.ctx.close();
}

// The shop/scan checks provoke 403/404/409/410 answers on purpose; Chromium logs every non-2xx
// fetch as a console error. Only those, and only on those pages, are expected.
const EXPECTED_HTTP = /^(shop|scan-anon|w360-redeem): Failed to load resource: the server responded with a status of (403|404|409|410)\b/;
const filtered = allErrors.filter((e) => !/Service Worker registration blocked/.test(e) && !EXPECTED_HTTP.test(e));
check('no console errors', filtered.length === 0, filtered.join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
