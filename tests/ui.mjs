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
const EXPIRED = '82303c4708';
const FULL = '58a27e58ee'; // has phone + address
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1280, height: 800 } };

async function newPage(opts, tag) {
  const ctx = await browser.newContext({ ...opts, serviceWorkers: 'block' });
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
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
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
  const metas = await page.$$eval('#list .item .meta', (m) => m.map((x) => x.textContent));
  check('phone: region filter (東部)', metas.length > 0 && metas.every((m) => m.includes('東部') || m.includes('全臺')), `${metas.length}`);
  await page.click('[data-reset]'); await settle(page, 150);
  check('phone: reset filters', (await itemCount(page)) === EXPECT.student);

  // Locked detail + back
  const firstId = await page.$eval('#list .item', (li) => li.dataset.id);
  await page.click(`#list .item[data-id="${firstId}"] .pick`); await settle(page);
  check('phone: detail route pushed', new URL(page.url()).pathname === `/deal/${firstId}`);
  check('phone: locked detail shows login card', await page.isVisible('#detail .lockcard') && (await page.textContent('#detail .lockcard')).includes('登入後查看完整優惠條件、訂房代碼與聯絡方式'));
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
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await settle(page, 300);
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
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await settle(page, 200);
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

const filtered = allErrors.filter((e) => !/Service Worker registration blocked/.test(e));
check('no console errors', filtered.length === 0, filtered.join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
