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

// ---------- partner leads (tests/fixtures/partner_leads.sql: fictional BANs 00000001-00000003) ----------
{
  // Start every fixture lead from "new": tests/api.mjs runs first in CI and marks 00000001 do-not-contact,
  // and a rerun against the same local D1 must test the change, not a leftover.
  for (const ban of ["00000001", "00000002", "00000003"]) {
    await fetch(`${B}/admin/leads/${ban}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "new", note: "" }),
    });
  }

  for (const [name, opts] of [["desktop", DESKTOP], ["phone", PHONE]]) {
    const { ctx, page, errors } = await newPage(opts);
    await page.goto(`${B}/admin.html`);
    await page.evaluate((t) => sessionStorage.setItem("cp_admin_token", t), TOKEN);
    await page.reload();
    await page.waitForSelector("#leadsTable tbody tr");
    const rows = () => page.locator("#leadsTable tbody tr[data-ban]");
    const bans = async () => rows().evaluateAll((trs) => trs.map((t) => t.dataset.ban).filter((b) => b.startsWith("0000000")));
    const tag = `leads ${name}`;

    if (name === "desktop") {
      // Ordered by campus, then nearest first: NTNU's lead, then NTU's two by distance.
      check(`${tag}: fixture leads listed, nearest first per campus`, (await bans()).join() === "00000003,00000001,00000002", (await bans()).join());
      const text = await page.textContent("#leads");
      check(`${tag}: fixture names shown`, text.includes("測試餐飲股份有限公司公館分公司") && text.includes("測試書局有限公司"));
      check(`${tag}: source line names data.gov.tw and the licence`,
        /data\.gov\.tw\/dataset\/9400/.test(await page.textContent("#leadsSource")) &&
        (await page.textContent("#leadsSource")).includes("政府資料開放授權條款") &&
        (await page.textContent("#leadsSource")).includes("2026-10-23"));
      check(`${tag}: opt-out notice shown`, (await page.textContent("#leads .notice")).includes("opt-out"));
      check(`${tag}: total count shown`, /共 3 家/.test(await page.textContent("#leadsTotal")), await page.textContent("#leadsTotal"));
      check(`${tag}: no load-more when everything fits`, await page.locator("#leadsMore").isHidden());

      // Sole proprietors/partnerships: one count row per area, never a name.
      const sole = page.locator('#leadsSummary tr[data-group="sole_or_partnership"][data-campus="NTU"][data-category="food"]');
      check(`${tag}: sole/partnership count row, NTU food = 42`, (await sole.count()) === 1 && (await sole.locator("td.n").textContent()) === "42");
      check(`${tag}: that row is labelled counted, never named`, (await sole.textContent()).includes("僅統計，不列名") && (await sole.textContent()).includes("never named"));
      check(`${tag}: NTU cafe sole/partnership = 17`,
        (await page.locator('#leadsSummary tr[data-group="sole_or_partnership"][data-campus="NTU"][data-category="cafe"] td.n').textContent()) === "17");
      const leadOrgs = await rows().evaluateAll((trs) => trs.map((t) => t.cells[5].textContent));
      check(`${tag}: no sole proprietor or partnership among the listed rows`, leadOrgs.every((o) => !/獨資|合夥/.test(o)), leadOrgs.join());
      check(`${tag}: no lead row for counted-only groups`, (await page.locator("#leadsTable tr.counted, #leadsTable [data-group]").count()) === 0);

      // Filter by campus.
      const shows = (list) => page.waitForFunction((want) =>
        [...document.querySelectorAll("#leadsTable tbody tr[data-ban]")].map((t) => t.dataset.ban).join() === want, list);
      await page.selectOption("#leadCampus", "NTNU");
      await shows("00000003");
      check(`${tag}: campus filter NTNU shows only the NTNU lead`, (await bans()).join() === "00000003", (await bans()).join());
      check(`${tag}: campus filter narrows the summary`, (await page.locator('#leadsSummary tr[data-campus="NTU"]').count()) === 0);
      await page.selectOption("#leadCampus", "");
      await page.fill("#leadQ", "咖啡");
      await shows("00000002").catch(() => {});
      check(`${tag}: search finds the cafe`, (await bans()).join() === "00000002", (await bans()).join());
      await page.fill("#leadQ", "");
      await shows("00000003,00000001,00000002");

      // A refused save shows an inline error and puts the old status back (the 400 is forced here).
      await page.route("**/admin/leads/00000001", (r) =>
        r.request().method() === "PATCH" ? r.fulfill({ status: 400, contentType: "application/json", body: '{"error":"bad_status"}' }) : r.continue());
      const before = errors.length;
      const first = page.locator('#leadsTable tr[data-ban="00000001"]');
      await first.locator("select").selectOption("contacted");
      await first.locator(".row-msg.err").waitFor();
      check(`${tag}: refused save: inline error`, (await first.locator(".row-msg").textContent()).includes("400"));
      check(`${tag}: refused save: status reverted`, (await first.locator("select").inputValue()) === "new");
      errors.splice(before); // the forced 400 is logged by Chromium as a failed resource
      await page.unroute("**/admin/leads/00000001");

      // Status and note save, and survive a reload.
      const row = page.locator('#leadsTable tr[data-ban="00000002"]');
      await row.locator("select").selectOption("do_not_contact");
      await row.locator(".row-msg.ok").waitFor();
      check(`${tag}: status change confirmed inline`, (await row.locator(".row-msg").textContent()).includes("Saved"));
      check(`${tag}: do-not-contact row styled`, await row.evaluate((tr) => tr.classList.contains("dnc") &&
        getComputedStyle(tr.querySelector(".lead-name")).textDecorationLine.includes("line-through")));
      await row.locator("input").fill("店長週三在 Test note");
      await row.locator("input").press("Enter");
      await page.waitForFunction(() => /Saved/.test(document.querySelector('#leadsTable tr[data-ban="00000002"] .row-msg').textContent));

      await page.reload();
      await page.waitForSelector('#leadsTable tr[data-ban="00000002"]');
      const again = page.locator('#leadsTable tr[data-ban="00000002"]');
      check(`${tag}: status persists after reload`, (await again.locator("select").inputValue()) === "do_not_contact");
      check(`${tag}: note persists after reload`, (await again.locator("input").inputValue()) === "店長週三在 Test note");
      check(`${tag}: do-not-contact still styled after reload`, await again.evaluate((tr) => tr.classList.contains("dnc")));
      await page.selectOption("#leadStatus", "do_not_contact");
      await shows("00000002").catch(() => {});
      check(`${tag}: status filter`, (await bans()).join() === "00000002", (await bans()).join());

      // CSV with the current filters.
      const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#leadsCsv")]);
      const { readFileSync } = await import("node:fs");
      const csv = readFileSync(await dl.path(), "utf8");
      check(`${tag}: CSV downloads with the filters`, /^campuspass-leads-\d{4}-\d{2}-\d{2}\.csv$/.test(dl.suggestedFilename()) &&
        csv.includes("00000002") && !csv.includes("00000001"), csv.slice(0, 200));

      await page.selectOption("#leadStatus", "");
      await shows("00000003,00000001,00000002");
      const bad = (await fetch(`${B}/admin/leads/00000001`, {
        method: "PATCH", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: '{"status":"nope"}',
      })).status;
      check(`${tag}: API refuses an unknown status (400)`, bad === 400, String(bad));
    } else {
      check(`${tag}: rows render as cards with labels`, await rows().first().evaluate((tr) =>
        getComputedStyle(tr).display === "block" && getComputedStyle(tr.cells[0], "::before").content.includes("Name")));
    }

    // Nothing cut off: no page scroll, and no cell or summary text wider than its box.
    check(`${tag}: no horizontal scroll`, await noHScroll(page));
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll("#leads .tablewrap, #leads td, #leads th, #leads .btn, #leads .lbl, #leads p, #leads select")]
        .filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1)
        .map((e) => `${e.tagName}.${e.className}: ${e.textContent.slice(0, 30)}`));
    check(`${tag}: no clipped text`, clipped.length === 0, clipped.join(" | "));
    // Selects and placeholders never report overflow, so measure their longest text against the inner width.
    const tight = await page.evaluate(() => {
      const out = [];
      for (const c of document.querySelectorAll("#leads select, #leads input[placeholder]")) {
        if (!c.offsetParent) continue;
        const cs = getComputedStyle(c);
        const avail = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const texts = c.tagName === "SELECT" ? [...c.options].map((o) => o.text) : [c.placeholder];
        for (const t of texts) {
          const probe = document.createElement("span");
          probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
          probe.style.font = cs.font;
          probe.textContent = t;
          document.body.append(probe);
          const w = probe.getBoundingClientRect().width;
          probe.remove();
          // A select's arrow and a search box's clear button sit partly over the padding: leave 12px more.
          if (w > avail - 12) out.push(`${t} (${Math.round(w)} > ${Math.round(avail)})`);
        }
      }
      return [...new Set(out)];
    });
    check(`${tag}: select options and placeholders fit`, tight.length === 0, tight.join(" | "));
    const wraps = await page.evaluate(() => [...document.querySelectorAll("#leads .btn")]
      .filter((b) => b.offsetParent && b.getBoundingClientRect().height > 50).map((b) => b.textContent.trim()));
    check(`${tag}: buttons stay on one line`, wraps.length === 0, wraps.join(" | "));
    await page.evaluate(() => document.querySelector(".top").style.setProperty("position", "static")); // keep the sticky bar out of the shot
    await page.locator("#leads").screenshot({ path: `${OUT}admin-leads-${name}.png` });
    check(`${tag}: no console errors`, errors.length === 0, errors.join(" | "));
    await ctx.close();
  }

  // Leave the fixture as it was for the other suites.
  await fetch(`${B}/admin/leads/00000002`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "new", note: "" }),
  });
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
