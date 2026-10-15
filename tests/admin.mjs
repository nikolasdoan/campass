// Admin dashboard (/admin.html) checks. Needs `npm run dev` on :8787 with ADMIN_TOKEN=change-me.
// Run: node tests/admin.mjs   (screenshots: test-results/admin-*.png)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const B = process.env.BASE || "http://localhost:8787";
const TOKEN = process.env.ADMIN_TOKEN || "change-me";
const OUT = process.env.SHOTS_DIR || new URL("../test-results/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(!!ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra && !ok ? `  — ${extra}` : ""}`);
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
const DESKTOP = { viewport: { width: 1280, height: 900 } };

// Some usage so the tables have rows: a dev-login user views a deal and opens a pass.
{
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${B}/auth/dev-login?email=admin-test@ntu.edu.tw`);
  const id = await p.evaluate(async () => (await (await fetch("/api/deals")).json()).deals[0].id);
  const ok = await p.evaluate(async (id) => {
    const v = await fetch(`/api/deals/${id}`);
    const r = await fetch(`/api/deals/${id}/redeem`, { method: "POST" });
    return v.ok && r.ok;
  }, id);
  check("setup: dev-login user viewed a deal and opened a pass", ok);
  await ctx.close();
}

async function newPage(opts) {
  const ctx = await browser.newContext({ ...opts, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  // A 401 is expected once (the wrong-token check); Chromium logs it as a failed resource.
  page.on("console", (m) => m.type() === "error" && !/status of 401/.test(m.text()) && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return { ctx, page, errors };
}

const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

// ---------- main flow, phone ----------
{
  const { ctx, page, errors } = await newPage(PHONE);
  const res = await page.goto(`${B}/admin.html`);
  check("/admin.html loads (200 after redirect)", res && res.status() === 200, String(res?.status()));
  check("robots noindex meta", (await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"));
  check("sign-in form shown first", await page.locator("#signin").isVisible());

  // Wrong token -> clear 401 message, token not kept.
  await page.fill("#token", "wrong-token");
  await page.click('#signinForm button[type="submit"]');
  await page.waitForFunction(() => document.getElementById("signinMsg").textContent.includes("401"));
  check("wrong token: 401 message", (await page.textContent("#signinMsg")).includes("401"));
  check("wrong token: not stored", (await page.evaluate(() => sessionStorage.getItem("cp_admin_token"))) === null);

  // Right token.
  await page.fill("#token", TOKEN);
  await page.click('#signinForm button[type="submit"]');
  await page.waitForSelector("#dash:not([hidden])");
  check("dashboard shown after sign-in", await page.locator("#dash").isVisible());
  check("token in sessionStorage", (await page.evaluate(() => sessionStorage.getItem("cp_admin_token"))) === TOKEN);
  check("token not in localStorage", await page.evaluate(() => !Object.values({ ...localStorage }).some((v) => v.includes("change-me"))));
  check("gate: two meters with progress bars", (await page.locator("#gate .meter .bar[role=progressbar]").count()) === 2);
  check("gate: targets 30 and 5", (await page.textContent("#gate")).includes("/ 30") && (await page.textContent("#gate")).includes("/ 5"));
  check("users: 5 tiles", (await page.locator("#users .tile").count()) === 5);
  const usage = await page.textContent("#usage");
  check("usage: tiers 1-3 labelled", ["Tier 1", "Tier 2", "Tier 3"].every((t) => usage.includes(t)));
  check("top viewed table has a row", (await page.locator("#topViewed tbody tr").count()) >= 1);
  check("top passes table has a row", (await page.locator("#topRedeemed tbody tr").count()) >= 1);
  check("phone 390px: no horizontal scroll", await noHScroll(page));
  await page.screenshot({ path: `${OUT}admin-phone-light.png`, fullPage: true });

  // Reload keeps the session (sessionStorage), no sign-in needed.
  await page.reload();
  await page.waitForSelector("#dash:not([hidden])");
  check("reload: still signed in (same tab)", await page.locator("#dash").isVisible());

  // CSV download with the bearer header.
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('button[data-csv="users"]')]);
  check("users.csv downloads", /^campuspass-users-\d{4}-\d{2}-\d{2}\.csv$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  const csvPath = await dl.path();
  const { readFileSync } = await import("node:fs");
  check("users.csv contains the test user", readFileSync(csvPath, "utf8").includes("admin-test@ntu.edu.tw"));

  // Shop link: search, pick, create.
  await page.fill("#keyLabel", "測試店家 Admin test");
  const firstName = await page.evaluate(async () => (await (await fetch("/api/deals")).json()).deals[0].name);
  await page.fill("#dealSearch", firstName.slice(0, 2));
  await page.waitForSelector("#dealResults button");
  await page.click("#dealResults button >> nth=0");
  check("deal picked as a chip", (await page.locator("#picked .pick").count()) === 1);
  await page.click("#keySubmit");
  await page.waitForSelector("#keyOut:not([hidden])");
  const url = await page.inputValue("#keyUrl");
  check("shop link shown", /\/m\/[A-Za-z0-9_-]{20,}$/.test(url), url);
  const qr = await page.waitForSelector("#keyQr svg", { timeout: 5000 }).catch(() => null);
  check("shop link QR rendered", !!qr, await page.innerHTML("#keyQr"));
  const key = url.split("/m/")[1];
  const mk = await page.evaluate(async (k) => (await fetch(`/api/merchant/${k}`)).status, key);
  check("shop link works (/api/merchant/<key> 200)", mk === 200, String(mk));

  // Cleanup.
  page.once("dialog", (d) => d.accept());
  await page.click("#cleanup");
  await page.waitForFunction(() => document.getElementById("cleanupMsg").textContent.includes("Deleted"));
  check("cleanup runs and reports counts", (await page.textContent("#cleanupMsg")).includes("sessions"));

  // Sign out wipes the token.
  await page.click("#signout");
  check("sign out: sign-in form back", await page.locator("#signin").isVisible());
  check("sign out: token removed", (await page.evaluate(() => sessionStorage.getItem("cp_admin_token"))) === null);
  check("phone: no console errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// ---------- screenshots: phone dark, desktop light + dark ----------
for (const [name, opts] of [
  ["phone-dark", { ...PHONE, colorScheme: "dark" }],
  ["desktop-light", { ...DESKTOP, colorScheme: "light" }],
  ["desktop-dark", { ...DESKTOP, colorScheme: "dark" }],
]) {
  const { ctx, page, errors } = await newPage(opts);
  await page.goto(`${B}/admin.html`);
  await page.evaluate((t) => sessionStorage.setItem("cp_admin_token", t), TOKEN);
  await page.reload();
  await page.waitForSelector("#dash:not([hidden])");
  if (name.endsWith("dark")) {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(`${name}: dark background`, bg === "rgb(23, 23, 27)", bg);
  }
  check(`${name}: no horizontal scroll`, await noHScroll(page));
  await page.screenshot({ path: `${OUT}admin-${name}.png`, fullPage: true });
  check(`${name}: no console errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// The admin API itself stays closed without the token.
{
  const r = await fetch(`${B}/admin/stats`);
  check("/admin/stats 401 without token", r.status === 401, String(r.status));
}

await browser.close();
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
