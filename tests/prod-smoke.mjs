// Read-only production smoke test. No dependencies, no writes to production.
//
//   BASE=https://pass.tecxmate.com ADMIN_TOKEN=... node tests/prod-smoke.mjs
//
// Prints PASS / WARN / FAIL lines and a summary; exits 1 if anything FAILs.
// ADMIN_TOKEN is optional: without it the authorised /admin/stats check is a WARN.

const BASE = (process.env.BASE || "https://pass.tecxmate.com").replace(/\/+$/, "");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const MIN_DEALS = Number(process.env.MIN_DEALS || 1000);
const LOCKED_KEYS = ["offer", "info", "phone", "links", "address"];

const counts = { PASS: 0, WARN: 0, FAIL: 0 };
function report(level, name, detail = "") {
  counts[level]++;
  console.log(`${level.padEnd(4)}  ${name}${detail ? `  (${detail})` : ""}`);
}
function check(name, ok, detail) {
  report(ok ? "PASS" : "FAIL", name, detail);
  return ok;
}

async function get(path, init = {}) {
  return fetch(BASE + path, { redirect: "manual", ...init });
}

function ctype(res) {
  return (res.headers.get("content-type") || "").toLowerCase();
}

function checkSecurityHeaders(label, res) {
  const xfo = res.headers.get("x-frame-options");
  const xcto = res.headers.get("x-content-type-options");
  check(`${label} X-Frame-Options: DENY`, (xfo || "").toUpperCase() === "DENY", `got ${xfo ?? "none"}`);
  check(`${label} X-Content-Type-Options: nosniff`, (xcto || "").toLowerCase() === "nosniff", `got ${xcto ?? "none"}`);
}

function checkPageHeaders(label, res) {
  const csp = res.headers.get("content-security-policy") || "";
  check(`${label} Content-Security-Policy present`, /default-src 'self'/.test(csp) && /script-src 'self'/.test(csp), csp ? `got ${csp.slice(0, 60)}…` : "none");
  check(`${label} CSP blocks framing and inline scripts`, /frame-ancestors 'none'/.test(csp) && !/script-src[^;]*'unsafe-inline'/.test(csp));
  const hsts = res.headers.get("strict-transport-security") || "";
  check(`${label} Strict-Transport-Security`, /max-age=\d{7,}/.test(hsts), `got ${hsts || "none"}`);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (err) {
    report("FAIL", name, `error: ${err.message}`);
  }
}

console.log(`Smoke test against ${BASE}\n`);

let dealId = null;

await step("GET /api/deals", async () => {
  const res = await get("/api/deals");
  if (!check("GET /api/deals 200 JSON", res.status === 200 && ctype(res).includes("application/json"), `${res.status} ${ctype(res)}`)) return;
  const body = await res.json();
  const deals = Array.isArray(body.deals) ? body.deals : [];
  check(`GET /api/deals count > ${MIN_DEALS}`, deals.length > MIN_DEALS, `${deals.length} deals`);
  const leaks = deals.filter((d) => LOCKED_KEYS.some((k) => k in d));
  check(
    `GET /api/deals has no ${LOCKED_KEYS.join("/")} keys`,
    leaks.length === 0,
    leaks.length ? `${leaks.length} deals leak, e.g. ${leaks[0].id}` : `${deals.length} checked`
  );
  checkSecurityHeaders("/api/deals", res);
  dealId = deals[0]?.id ?? null;
});

await step("GET /", async () => {
  const res = await get("/");
  check("GET / 200 HTML", res.status === 200 && ctype(res).includes("text/html"), `${res.status} ${ctype(res)}`);
  checkSecurityHeaders("/", res);
  checkPageHeaders("/", res);
});

await step("GET /deal/<id>", async () => {
  if (!dealId) return report("FAIL", "GET /deal/<id>", "no deal id from /api/deals");
  const res = await get(`/deal/${dealId}`);
  check(`GET /deal/${dealId} 200 HTML (SPA fallback)`, res.status === 200 && ctype(res).includes("text/html"), `${res.status} ${ctype(res)}`);
});

await step("GET /api/deals/<id> signed out", async () => {
  if (!dealId) return report("FAIL", "GET /api/deals/<id>", "no deal id from /api/deals");
  const res = await get(`/api/deals/${dealId}`);
  if (!check(`GET /api/deals/${dealId} 200`, res.status === 200, `${res.status}`)) return;
  const body = await res.json();
  check("GET /api/deals/<id> locked=true signed out", body.locked === true, `locked=${body.locked}`);
  const leaked = LOCKED_KEYS.filter((k) => body.deal && k in body.deal);
  check("GET /api/deals/<id> hides locked fields signed out", leaked.length === 0, leaked.length ? `leaks ${leaked.join(",")}` : "");
});

await step("GET /manifest.webmanifest", async () => {
  const res = await get("/manifest.webmanifest");
  check(
    "GET /manifest.webmanifest application/manifest+json",
    res.status === 200 && ctype(res).includes("application/manifest+json"),
    `${res.status} ${ctype(res)}`
  );
});

await step("GET /sw.js", async () => {
  const res = await get("/sw.js");
  check("GET /sw.js 200 JavaScript", res.status === 200 && ctype(res).includes("javascript"), `${res.status} ${ctype(res)}`);
});

await step("GET /offline", async () => {
  const res = await get("/offline");
  check("GET /offline 200 HTML", res.status === 200 && ctype(res).includes("text/html"), `${res.status} ${ctype(res)}`);
  checkPageHeaders("/offline", res);
});

await step("GET /admin.html", async () => {
  const res = await fetch(BASE + "/admin.html"); // follows the /admin.html -> /admin redirect
  const html = res.ok ? await res.text() : "";
  check("GET /admin.html 200 HTML, noindex", res.status === 200 && /name="robots" content="noindex/.test(html), `${res.status}`);
});

await step("http -> https", async () => {
  if (!BASE.startsWith("https://")) return report("WARN", "http -> https redirect", "BASE is not https, skipped");
  const res = await fetch(BASE.replace(/^https:/, "http:") + "/", { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  check("http:// redirects to https://", [301, 302, 307, 308].includes(res.status) && loc.startsWith("https://"), `${res.status} ${loc}`);
});

await step("GET /auth/dev-login", async () => {
  const res = await get("/auth/dev-login?email=smoke@example.com");
  check("GET /auth/dev-login 404 (DEV_LOGIN off)", res.status === 404, `${res.status}`);
});

await step("GET /auth/google/start", async () => {
  const res = await get("/auth/google/start");
  const loc = res.headers.get("location") || "";
  if (res.status === 302 && loc.startsWith("https://accounts.google.com/")) {
    report("PASS", "GET /auth/google/start 302 to accounts.google.com");
  } else if (res.status === 500 && /not configured/i.test(await res.text())) {
    report("WARN", "GET /auth/google/start", "500 not configured: Google client id/secret pending");
  } else {
    report("FAIL", "GET /auth/google/start 302 to accounts.google.com", `${res.status} ${loc}`);
  }
});

await step("GET /admin/stats", async () => {
  const anon = await get("/admin/stats");
  check("GET /admin/stats 401 without token", anon.status === 401, `${anon.status}`);
  if (!ADMIN_TOKEN) return report("WARN", "GET /admin/stats with token", "ADMIN_TOKEN not set, skipped");
  const res = await get("/admin/stats", { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } });
  let ok = res.status === 200 && ctype(res).includes("application/json");
  if (ok) ok = typeof (await res.json()).users === "object";
  check("GET /admin/stats 200 JSON with token", ok, `${res.status}`);
});

await step("GET /api/merchant/<bad key>", async () => {
  const res = await get("/api/merchant/not-a-key");
  check("GET /api/merchant/not-a-key 404", res.status === 404, `${res.status}`);
});

await step("PUT /api/favorites/x signed out", async () => {
  // Same-origin request, so the CSRF check passes and the auth check is what answers.
  const res = await get("/api/favorites/x", { method: "PUT", headers: { Origin: BASE } });
  check("PUT /api/favorites/x signed out 401/403", res.status === 401 || res.status === 403, `${res.status}`);
  // Cross-origin request must be refused by the CSRF check.
  const xorigin = await get("/api/favorites/x", { method: "PUT", headers: { Origin: "https://evil.example" } });
  check("PUT /api/favorites/x cross-origin 401/403", xorigin.status === 401 || xorigin.status === 403, `${xorigin.status}`);
});

console.log(`\n${counts.PASS} passed, ${counts.WARN} warnings, ${counts.FAIL} failed`);
process.exit(counts.FAIL ? 1 : 0);
