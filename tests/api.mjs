// CampusPass API + auth tests. Needs `npm run dev` on :8787 (DEV_LOGIN=true, ADMIN_TOKEN=change-me)
// and `node tests/mock-google.mjs` on :9876 for the OAuth checks (GOOGLE_MOCK_URL in .dev.vars).
// Run: npm run test:api
const B = process.env.BASE || "http://localhost:8787";
const ADMIN = { Authorization: `Bearer ${process.env.ADMIN_TOKEN || "change-me"}` };
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  — ${detail}`}`);
};

/** A cookie jar per simulated browser. */
function browser() {
  const jar = new Map();
  async function req(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    if (opts.json !== undefined) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.json);
    }
    if (opts.method && opts.method !== "GET" && opts.origin !== false) headers.Origin = opts.origin || new URL(B).origin;
    const url = path.startsWith("http") ? path : B + path;
    const res = await fetch(url, { method: opts.method || "GET", headers, body: opts.body, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i).trim();
      const v = pair.slice(i + 1).trim();
      const expired = attrs.some((a) => /max-age=0/i.test(a) || /expires=Thu, 01 Jan 1970/i.test(a));
      if (!v || expired) jar.delete(k);
      else jar.set(k, v);
    }
    return res;
  }
  const json = async (path, opts) => {
    const r = await req(path, opts);
    let body = null;
    try {
      body = await r.json();
    } catch {}
    return { status: r.status, body };
  };
  return { req, json, jar };
}

async function devLogin(email) {
  const b = browser();
  await b.req(`/auth/dev-login?email=${encodeURIComponent(email)}`);
  return b;
}

// ---------- public data ----------
const anon = browser();
const list = await anon.json("/api/deals");
const deals = list.body?.deals || [];
check("public list returns deals", list.status === 200 && deals.length > 100, `${deals.length}`);
const leaked = deals.filter((d) => "offer" in d || "info" in d || "phone" in d || "links" in d || "address" in d);
check("public list never includes offer/info/phone/address/links", leaked.length === 0, `${leaked.length} leaked`);
check("public list includes source_url + retrieved_on", deals.every((d) => d.source_url && d.retrieved_on));
const full = deals.find((d) => d.name === "台北福華大飯店") || deals[0];
const other = deals.find((d) => d.id !== full.id);
const locked = await anon.json(`/api/deals/${full.id}`);
check("signed-out detail is locked", locked.body?.locked === true && !("offer" in locked.body.deal) && !("links" in locked.body.deal));
check("unknown deal 404", (await anon.json("/api/deals/nope")).status === 404);
check("unknown /api route 404 json", (await anon.json("/api/nope")).body?.error === "not_found");
const spa = await anon.req("/deal/whatever");
check("SPA fallback serves HTML for app routes", spa.status === 200 && (spa.headers.get("content-type") || "").includes("text/html"));
const man = await anon.req("/manifest.webmanifest");
check("manifest content type", (man.headers.get("content-type") || "").includes("manifest+json"));
check("service worker served as JS", ((await anon.req("/sw.js")).headers.get("content-type") || "").includes("javascript"));
const idx = await anon.req("/");
check("security headers on pages", idx.headers.get("x-content-type-options") === "nosniff" && !!idx.headers.get("x-frame-options"));
check("security headers on API", (await anon.req("/api/deals")).headers.get("x-frame-options") === "DENY");

// ---------- session + favourites ----------
const me0 = await anon.json("/api/me");
check("signed-out /api/me", me0.body?.user === null && Array.isArray(me0.body?.favorites));
check("favourite needs login", (await anon.json(`/api/favorites/${full.id}`, { method: "PUT" })).status === 401);
const stu = await devLogin(`api-${Date.now()}@ntu.edu.tw`);
const me = await stu.json("/api/me");
check("dev login creates a session", !!me.body?.user?.email);
check("session cookie is HttpOnly + SameSite=Lax", true); // asserted below via raw header
const raw = await fetch(`${B}/auth/dev-login?email=hdr@example.com`, { redirect: "manual" });
const sc = raw.headers.getSetCookie().find((c) => c.startsWith("cp_session=")) || "";
check("cp_session flags", /HttpOnly/i.test(sc) && /SameSite=Lax/i.test(sc) && /Path=\//i.test(sc), sc);
const unlocked = await stu.json(`/api/deals/${full.id}`);
check("signed-in detail unlocked with offer + links", unlocked.body?.locked === false && typeof unlocked.body.deal.offer === "string" && Array.isArray(unlocked.body.deal.links));
check("favourite add", (await stu.json(`/api/favorites/${full.id}`, { method: "PUT" })).body?.ok === true);
check("favourite add is idempotent", (await stu.json(`/api/favorites/${full.id}`, { method: "PUT" })).body?.ok === true);
check("favourite shows in /api/me", (await stu.json("/api/me")).body?.favorites?.includes(full.id));
check("favourite unknown deal 404", (await stu.json("/api/favorites/nope", { method: "PUT" })).status === 404);
check("favourite remove", (await stu.json(`/api/favorites/${full.id}`, { method: "DELETE" })).body?.ok === true);
check("CSRF: cross-site origin rejected", (await stu.json(`/api/favorites/${full.id}`, { method: "PUT", origin: "https://evil.example" })).status === 403);
check("CSRF: missing origin rejected", (await stu.json(`/api/favorites/${full.id}`, { method: "PUT", origin: false })).status === 403);

// ---------- reports ----------
check("report needs a message", (await stu.json(`/api/deals/${full.id}/report`, { method: "POST", json: { message: "  " } })).status === 400);
check("report saved", (await stu.json(`/api/deals/${full.id}/report`, { method: "POST", json: { message: "API test — ignore" } })).body?.ok === true);
check("report with bad JSON is a 400 not a 500", (await stu.json(`/api/deals/${full.id}/report`, { method: "POST", body: "{", headers: { "Content-Type": "application/json" } })).status === 400);

// ---------- redemption ----------
check("redeem needs login", (await anon.json(`/api/deals/${full.id}/redeem`, { method: "POST" })).status === 401);
check("redeem unknown deal 404", (await stu.json(`/api/deals/nope/redeem`, { method: "POST" })).status === 404);
const pass = (await stu.json(`/api/deals/${full.id}/redeem`, { method: "POST" })).body;
check("redeem returns a 6-char code", /^[A-HJ-NP-Z2-9]{6}$/.test(pass?.code || ""), JSON.stringify(pass));
check("re-opening within 15 min reuses the code", (await stu.json(`/api/deals/${full.id}/redeem`, { method: "POST" })).body?.code === pass.code);
check("own pass readable", (await stu.json(`/api/redemptions/${pass.code}`)).body?.code === pass.code);
const stu2 = await devLogin(`api2-${Date.now()}@ntu.edu.tw`);
check("someone else's pass is 404", (await stu2.json(`/api/redemptions/${pass.code}`)).status === 404);
const answered = (await stu2.json(`/api/deals/${other.id}/redeem`, { method: "POST" })).body;
await stu2.json(`/api/redemptions/${answered.code}/outcome`, { method: "POST", json: { outcome: "not_used" } });
check("an answered pass is not reused", (await stu2.json(`/api/deals/${other.id}/redeem`, { method: "POST" })).body?.code !== answered.code);
check("bad outcome 400", (await stu.json(`/api/redemptions/${pass.code}/outcome`, { method: "POST", json: { outcome: "maybe" } })).status === 400);
check("outcome on someone else's pass 404", (await stu2.json(`/api/redemptions/${pass.code}/outcome`, { method: "POST", json: { outcome: "used" } })).status === 404);

// ---------- shops ----------
check("admin needs token", (await anon.json("/admin/stats")).status === 401);
check("admin rejects wrong token", (await anon.json("/admin/stats", { headers: { Authorization: "Bearer nope" } })).status === 401);
check("merchant key rejects unknown deal", (await anon.json("/admin/merchant-keys", { method: "POST", headers: ADMIN, json: { label: "x", deal_ids: ["nope"] } })).status === 400);
const mk = (await anon.json("/admin/merchant-keys", { method: "POST", headers: ADMIN, json: { label: "測試店", deal_ids: [full.id] } })).body;
const key = mk?.url?.split("/m/")[1];
check("merchant key issued", !!key, JSON.stringify(mk));
const mk2 = (await anon.json("/admin/merchant-keys", { method: "POST", headers: ADMIN, json: { label: "別家", deal_ids: [other.id] } })).body;
const key2 = mk2.url.split("/m/")[1];
check("unpaired phone can't see a pass", (await anon.json(`/api/merchant/pass/${pass.code}`)).status === 403);
const shop = browser();
const page = await shop.json(`/api/merchant/${key}`);
check("shop page loads and pairs the phone", page.body?.label === "測試店" && shop.jar.has("cp_merchant"));
check("invalid shop key 404", (await anon.json("/api/merchant/not-a-key")).status === 404);
check("paired phone sees the pass", (await shop.json(`/api/merchant/pass/${pass.code}`)).body?.status === "ok");
check("paired phone, lowercase code", (await shop.json(`/api/merchant/pass/${pass.code.toLowerCase()}`)).body?.status === "ok");
check("other shop can't confirm this deal's pass", (await anon.json(`/api/merchant/${key2}/confirm`, { method: "POST", json: { code: pass.code } })).status === 404);
check("unknown code 404", (await shop.json("/api/merchant/confirm", { method: "POST", json: { code: "ZZZZZZ" } })).status === 404);
check("shop confirms", (await shop.json("/api/merchant/confirm", { method: "POST", json: { code: pass.code } })).body?.ok === true);
check("second confirm is 409", (await shop.json(`/api/merchant/${key}/confirm`, { method: "POST", json: { code: ` ${pass.code.slice(0, 3)}-${pass.code.slice(3)} ` } })).status === 409);
check("student pass shows confirmed", !!(await stu.json(`/api/redemptions/${pass.code}`)).body?.confirmed_at);
check("a confirmed pass is not reused: re-opening gives a new code", (await stu.json(`/api/deals/${full.id}/redeem`, { method: "POST" })).body?.code !== pass.code);
check("shop count is per shop link", (await shop.json(`/api/merchant/${key}`)).body?.confirmed_30d === 1);
const sameDeal = (await anon.json("/admin/merchant-keys", { method: "POST", headers: ADMIN, json: { label: "同品牌分店", deal_ids: [full.id] } })).body.url.split("/m/")[1];
check("another branch of the same deal starts at 0", (await browser().json(`/api/merchant/${sameDeal}`)).body?.confirmed_30d === 0);
const sm = await anon.json(`/api/merchant/${key}/manifest.webmanifest`);
check("shop manifest opens the shop page", sm.body?.start_url === `/m/${key}` && sm.body?.id === `/m/${key}`);
check("shop manifest 404 for bad key", (await anon.json("/api/merchant/nope/manifest.webmanifest")).status === 404);
check("a shop-confirmed pass can't be marked refused", (await stu.json(`/api/redemptions/${pass.code}/outcome`, { method: "POST", json: { outcome: "refused" } })).status === 409);
check("outcome saved", (await stu.json(`/api/redemptions/${pass.code}/outcome`, { method: "POST", json: { outcome: "used" } })).body?.ok === true);
check("shop confirm needs same origin", (await shop.json("/api/merchant/confirm", { method: "POST", origin: "https://evil.example", json: { code: pass.code } })).status === 403);

// ---------- merchant leads ----------
const before = (await anon.json("/admin/stats", { headers: ADMIN })).body;
check("lead needs shop + contact", (await anon.json("/api/merchant-leads", { method: "POST", json: { shop_name: "x" } })).status === 400);
check("lead rejects a junk phone as the only contact", (await anon.json("/api/merchant-leads", { method: "POST", json: { shop_name: "x", phone: "abc" } })).status === 400);
check("lead accepts a real phone", (await anon.json("/api/merchant-leads", { method: "POST", json: { shop_name: "電話店", phone: "02-2363-1234" } })).body?.ok === true);
check("lead saved", (await anon.json("/api/merchant-leads", { method: "POST", json: { shop_name: "API 測試咖啡", email: "shop@example.com", interest: "featured_paid" } })).body?.ok === true);
check("honeypot lead accepted silently", (await anon.json("/api/merchant-leads", { method: "POST", json: { shop_name: "bot", email: "b@b.b", website: "http://spam" } })).body?.ok === true);
const after = (await anon.json("/admin/stats", { headers: ADMIN })).body;
check("only the real leads were stored", after.merchants.leads === before.merchants.leads + 2, `${before.merchants.leads} -> ${after.merchants.leads}`);
check("stats has the go/no-go gate", after.gate?.students_using_twice?.target === 30 && after.gate?.shops_would_pay?.target === 5);
check("admin CSVs", (await Promise.all(["users", "reports", "redemptions", "merchants"].map((n) => anon.req(`/admin/${n}.csv`, { headers: ADMIN })))).every((r) => r.status === 200));

// ---------- logout ----------
check("logout", (await stu.json("/api/logout", { method: "POST" })).body?.ok === true);
check("session gone after logout", (await stu.json("/api/me")).body?.user === null);

// ---------- account deletion + cleanup ----------
const gone = await devLogin(`delete-${Date.now()}@ntu.edu.tw`);
await gone.json(`/api/favorites/${full.id}`, { method: "PUT" });
const gonePass = (await gone.json(`/api/deals/${full.id}/redeem`, { method: "POST" })).body;
await gone.json(`/api/deals/${full.id}/report`, { method: "POST", json: { message: "delete test" } });
check("account deletion needs login", (await anon.json("/api/me", { method: "DELETE" })).status === 401);
check("account deletion", (await gone.json("/api/me", { method: "DELETE" })).body?.ok === true);
check("deleted account is signed out", (await gone.json("/api/me")).body?.user === null);
check("deleted account's passes are gone", !(await (await anon.req("/admin/redemptions.csv", { headers: ADMIN })).text()).includes(gonePass.code));
check("admin cleanup runs", Array.isArray((await anon.json("/admin/cleanup", { method: "POST", headers: ADMIN })).body?.deleted));

// ---------- Google OAuth via tests/mock-google.mjs ----------
async function oauth(email, { next = "/saved", tamperState = false, crossBrowser = false } = {}) {
  const b = browser();
  const start = await b.req(`/auth/google/start?next=${encodeURIComponent(next)}`);
  const authUrl = start.headers.get("location") || "";
  if (!authUrl.startsWith("http://localhost:9876")) return { error: `start -> ${start.status} ${authUrl}` };
  const g = await fetch(`${authUrl}&login_hint=${encodeURIComponent(email)}`, { redirect: "manual" });
  let cb = g.headers.get("location");
  if (tamperState) cb = cb.replace("state=", "state=X");
  const cbBrowser = crossBrowser ? browser() : b;
  const done = await cbBrowser.req(cb);
  return { b: cbBrowser, location: done.headers.get("location"), cb };
}
const mockUp = await fetch("http://localhost:9876/auth").then((r) => r.ok).catch(() => false);
if (!mockUp) {
  check("mock Google running on :9876 (node tests/mock-google.mjs)", false);
} else {
  const ok = await oauth(`oauth-${Date.now()}@ntu.edu.tw`);
  check("Google sign-in returns to `next`", new URL(ok.location, B).pathname === "/saved", ok.location || ok.error);
  check("Google sign-in creates a session", !!(await ok.b.json("/api/me")).body?.user);
  check("callback replay rejected", ((await browser().req(ok.cb)).headers.get("location") || "").includes("login_error"));
  const denied = await oauth("deny@example.com", { next: `/deal/${full.id}` });
  check("cancel -> access_denied, back on the page it started from", (denied.location || "").startsWith(`/deal/${full.id}?login_error=access_denied`), denied.location);
  check("unverified email rejected", ((await oauth("unverified@example.com")).location || "").includes("login_error=email_unverified"));
  check("tampered state rejected", ((await oauth("a@example.com", { tamperState: true })).location || "").includes("login_error=state_mismatch"));
  check("callback in another browser rejected", ((await oauth("a@example.com", { crossBrowser: true })).location || "").includes("login_error=expired"));
  const evil = await oauth("a@example.com", { next: "https://evil.example" });
  check("open redirect blocked", new URL(evil.location, B).origin === new URL(B).origin, evil.location);
  const evil2 = await oauth("a@example.com", { next: "//evil.example" });
  check("protocol-relative redirect blocked", new URL(evil2.location, B).origin === new URL(B).origin, evil2.location);
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
