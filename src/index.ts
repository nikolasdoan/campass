import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { googleAuthUrl, exchangeCode, newPkce, type GoogleEndpoints } from "./google";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_TOKEN?: string;
  /** Local development only: enables /auth/dev-login without Google. Never set in production. */
  DEV_LOGIN?: string;
  /** Local testing only (needs DEV_LOGIN): base URL of a mock Google OAuth server (tests/mock-google.mjs). */
  GOOGLE_MOCK_URL?: string;
}

/** Real Google endpoints, or the local mock when testing the OAuth flow end to end. */
function googleEndpoints(env: Env): GoogleEndpoints | undefined {
  if (env.DEV_LOGIN !== "true" || !env.GOOGLE_MOCK_URL) return undefined;
  return { auth: `${env.GOOGLE_MOCK_URL}/auth`, token: `${env.GOOGLE_MOCK_URL}/token` };
}

type User = {
  id: number;
  email: string;
  name: string;
  picture: string;
  email_domain: string;
};

type Vars = { user: User | null };

const SESSION_COOKIE = "cp_session";
const OAUTH_COOKIE = "cp_oauth";
const SESSION_DAYS = 30;

const app = new Hono<{ Bindings: Env; Variables: Vars }>();

// ---------- helpers ----------

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 32): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function isSecure(url: string) {
  return new URL(url).protocol === "https:";
}

/** Only allow same-site relative paths as post-login redirect targets. */
function safeNext(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

async function createSession(c: any, userId: number) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await c.env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), userId, expires.toISOString())
    .run();
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure(c.req.url),
    sameSite: "Lax",
    path: "/",
    expires,
  });
}

type GoogleProfile = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string };

async function upsertUser(db: D1Database, p: GoogleProfile): Promise<number> {
  const domain = p.email.split("@")[1]?.toLowerCase() ?? "";
  const row = await db
    .prepare(
      `INSERT INTO users (google_sub, email, email_verified, email_domain, name, picture)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET
         email = excluded.email,
         email_verified = excluded.email_verified,
         email_domain = excluded.email_domain,
         name = excluded.name,
         picture = excluded.picture,
         last_login_at = datetime('now'),
         login_count = users.login_count + 1
       RETURNING id`
    )
    .bind(p.sub, p.email.toLowerCase(), p.email_verified ? 1 : 0, domain, p.name ?? "", p.picture ?? "")
    .first<{ id: number }>();
  return row!.id;
}

const PUBLIC_FIELDS =
  "id, name, subtitle, category, regions, highlight, expires_on, auto_renew, eligibility, schools, source_level, source_org, source_url, retrieved_on, sort_order";

function parseDeal(row: Record<string, any>) {
  return {
    ...row,
    regions: row.regions ? String(row.regions).split(",") : [],
    schools: row.schools ? String(row.schools).split(",") : [],
    eligibility: JSON.parse(row.eligibility ?? "{}"),
    auto_renew: !!row.auto_renew,
    ...(row.links !== undefined ? { links: JSON.parse(row.links) } : {}),
  };
}

// ---------- middleware ----------

// Same security headers as public/_headers, for responses the Worker builds itself.
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Frame-Options", "DENY");
});

// Resolve the session cookie to a user for every API/auth request.
app.use("*", async (c, next) => {
  c.set("user", null);
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const user = await c.env.DB.prepare(
      `SELECT u.id, u.email, u.name, u.picture, u.email_domain
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`
    )
      .bind(await sha256(token), new Date().toISOString())
      .first<User>();
    c.set("user", user ?? null);
  }
  await next();
});

// CSRF: state-changing API calls must come from our own origin.
app.use("/api/*", async (c, next) => {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    const origin = c.req.header("Origin");
    if (!origin || origin !== new URL(c.req.url).origin) {
      return c.json({ error: "bad_origin" }, 403);
    }
  }
  await next();
});

const requireUser = async (c: any, next: any) => {
  if (!c.get("user")) return c.json({ error: "login_required" }, 401);
  await next();
};

// ---------- auth ----------

app.get("/auth/google/start", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.text("Google login is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).", 500);
  }
  const origin = new URL(c.req.url).origin;
  const state = randomToken(16);
  const { verifier, challenge } = await newPkce();
  const next = safeNext(c.req.query("next"));
  setCookie(c, OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true,
    secure: isSecure(c.req.url),
    sameSite: "Lax",
    path: "/auth",
    maxAge: 600,
  });
  return c.redirect(
    googleAuthUrl({
      clientId: c.env.GOOGLE_CLIENT_ID,
      redirectUri: `${origin}/auth/google/callback`,
      state,
      challenge,
      endpoints: googleEndpoints(c.env),
    })
  );
});

app.get("/auth/google/callback", async (c) => {
  const raw = getCookie(c, OAUTH_COOKIE);
  deleteCookie(c, OAUTH_COOKIE, { path: "/auth" });
  let saved: { state: string; verifier: string; next: string } | null = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {
    saved = null;
  }
  // A cancelled or failed sign-in returns to the page it started from, with the reason.
  const fail = (reason: string) => {
    const back = new URL(safeNext(saved?.next), "https://x");
    back.searchParams.set("login_error", reason);
    return c.redirect(back.pathname + back.search);
  };

  if (c.req.query("error")) return fail(c.req.query("error")!);
  if (!saved) return fail("expired");
  const code = c.req.query("code");
  if (!code || c.req.query("state") !== saved.state) return fail("state_mismatch");

  try {
    const profile = await exchangeCode({
      code,
      verifier: saved.verifier,
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${new URL(c.req.url).origin}/auth/google/callback`,
      endpoints: googleEndpoints(c.env),
    });
    if (!profile.email_verified) return fail("email_unverified");
    const userId = await upsertUser(c.env.DB, profile);
    await createSession(c, userId);
    return c.redirect(safeNext(saved.next));
  } catch (e) {
    console.error("google callback failed", e);
    return fail("google_error");
  }
});

// Local testing without Google. Only active when DEV_LOGIN="true" (set in .dev.vars, never in production).
app.get("/auth/dev-login", async (c) => {
  if (c.env.DEV_LOGIN !== "true") return c.notFound();
  const email = (c.req.query("email") || "dev@example.com").toLowerCase();
  const userId = await upsertUser(c.env.DB, { sub: `dev:${email}`, email, email_verified: true, name: email.split("@")[0] });
  await createSession(c, userId);
  return c.redirect(safeNext(c.req.query("next")));
});

app.post("/api/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

// Delete the signed-in account and everything tied to it (個資法 §3 right to deletion).
// Shop leads the user submitted keep the shop's own contact data but lose the link to them.
app.delete("/api/me", requireUser, async (c) => {
  const id = c.get("user")!.id;
  const db = c.env.DB;
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM favorites WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM visits WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM deal_views WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM redemptions WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM reports WHERE user_id = ?").bind(id),
    db.prepare("UPDATE merchant_leads SET user_id = NULL WHERE user_id = ?").bind(id),
    db.prepare("DELETE FROM users WHERE id = ?").bind(id),
  ]);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

// ---------- API ----------

/** Today's date in Taiwan (YYYY-MM-DD); visits and gates are counted in local days. */
function taipeiDay(offsetDays = 0): string {
  return new Date(Date.now() + 8 * 3600e3 + offsetDays * 864e5).toISOString().slice(0, 10);
}

app.get("/api/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ user: null, favorites: [] });
  // One row per user per active day: feeds weekly/monthly active and repeat-use stats.
  c.executionCtx.waitUntil(
    c.env.DB.prepare("INSERT OR IGNORE INTO visits (user_id, day) VALUES (?, ?)").bind(user.id, taipeiDay()).run()
  );
  const favs = await c.env.DB.prepare("SELECT deal_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC")
    .bind(user.id)
    .all<{ deal_id: string }>();
  return c.json({
    user: { email: user.email, name: user.name, picture: user.picture },
    favorites: favs.results.map((r) => r.deal_id),
  });
});

// Public list: names, categories and the discount badge. Terms need login.
app.get("/api/deals", async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT ${PUBLIC_FIELDS} FROM deals ORDER BY sort_order`).all();
  c.header("Cache-Control", "public, max-age=300");
  return c.json({ deals: results.map(parseDeal) });
});

app.get("/api/deals/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  if (!user) {
    const row = await c.env.DB.prepare(`SELECT ${PUBLIC_FIELDS} FROM deals WHERE id = ?`).bind(id).first();
    if (!row) return c.json({ error: "not_found" }, 404);
    return c.json({ deal: parseDeal(row), locked: true });
  }
  const row = await c.env.DB.prepare("SELECT * FROM deals WHERE id = ?").bind(id).first();
  if (!row) return c.json({ error: "not_found" }, 404);
  c.executionCtx.waitUntil(
    c.env.DB.prepare("INSERT INTO deal_views (user_id, deal_id) VALUES (?, ?)").bind(user.id, id).run()
  );
  return c.json({ deal: parseDeal(row), locked: false });
});

app.put("/api/favorites/:id", requireUser, async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const exists = await c.env.DB.prepare("SELECT 1 FROM deals WHERE id = ?").bind(id).first();
  if (!exists) return c.json({ error: "not_found" }, 404);
  await c.env.DB.prepare("INSERT OR IGNORE INTO favorites (user_id, deal_id) VALUES (?, ?)").bind(user.id, id).run();
  return c.json({ ok: true });
});

app.delete("/api/favorites/:id", requireUser, async (c) => {
  const user = c.get("user")!;
  await c.env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND deal_id = ?")
    .bind(user.id, c.req.param("id"))
    .run();
  return c.json({ ok: true });
});

app.post("/api/deals/:id/report", requireUser, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json<{ message?: string }>().catch(() => ({ message: "" }));
  const message = (body.message ?? "").trim().slice(0, 1000);
  if (!message) return c.json({ error: "message_required" }, 400);
  await c.env.DB.prepare("INSERT INTO reports (user_id, deal_id, message) VALUES (?, ?, ?)")
    .bind(user.id, c.req.param("id"), message)
    .run();
  return c.json({ ok: true });
});

// ---------- redemption evidence ----------
//
// Existing deals are redeemed by showing a student card, so CampusPass cannot see the
// sale. We record evidence in tiers instead: the pass was opened (intent), the student
// says it worked (self-report), and a shop typed the pass code on its private link
// (merchant-confirmed, the only verified tier).

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const PASS_MINUTES = 15; // the pass shows a countdown
// A shop may confirm a little after the pass's countdown ends (a busy counter), but not much later.
const CONFIRM_MINUTES = 30;

function newCode(len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

app.post("/api/deals/:id/redeem", requireUser, async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const deal = await c.env.DB.prepare("SELECT id FROM deals WHERE id = ?").bind(id).first();
  if (!deal) return c.json({ error: "not_found" }, 404);
  // Reuse a pass opened in the last few minutes so re-opening doesn't inflate counts.
  const recent = await c.env.DB.prepare(
    `SELECT code, created_at FROM redemptions
      WHERE user_id = ? AND deal_id = ? AND created_at > datetime('now', ?) AND confirmed_at IS NULL AND outcome IS NULL
      ORDER BY created_at DESC LIMIT 1`
  )
    .bind(user.id, id, `-${PASS_MINUTES} minutes`)
    .first<{ code: string; created_at: string }>();
  if (recent) return c.json({ ...recent, valid_minutes: PASS_MINUTES });
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const row = await c.env.DB.prepare(
      "INSERT OR IGNORE INTO redemptions (code, user_id, deal_id) VALUES (?, ?, ?) RETURNING code, created_at"
    )
      .bind(code, user.id, id)
      .first<{ code: string; created_at: string }>();
    if (row) return c.json({ ...row, valid_minutes: PASS_MINUTES });
  }
  return c.json({ error: "try_again" }, 503);
});

app.get("/api/redemptions/:code", requireUser, async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT code, deal_id, created_at, outcome, confirmed_at FROM redemptions WHERE code = ? AND user_id = ?"
  )
    .bind(c.req.param("code").toUpperCase(), c.get("user")!.id)
    .first();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(row);
});

app.post("/api/redemptions/:code/outcome", requireUser, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json<{ outcome?: string }>().catch(() => ({ outcome: "" }));
  if (!["used", "refused", "not_used"].includes(body.outcome ?? "")) return c.json({ error: "bad_outcome" }, 400);
  const code = c.req.param("code").toUpperCase();
  const row = await c.env.DB.prepare("SELECT confirmed_at FROM redemptions WHERE code = ? AND user_id = ?")
    .bind(code, user.id)
    .first<{ confirmed_at: string | null }>();
  if (!row) return c.json({ error: "not_found" }, 404);
  // A shop confirmation is the stronger evidence: the student can't record the opposite.
  if (row.confirmed_at && body.outcome !== "used") return c.json({ error: "already_confirmed" }, 409);
  await c.env.DB.prepare("UPDATE redemptions SET outcome = ?, outcome_at = datetime('now') WHERE code = ? AND user_id = ?")
    .bind(body.outcome, code, user.id)
    .run();
  return c.json({ ok: true });
});

// Shops that want to be listed or would pay for featured placement. Public form.
app.post("/api/merchant-leads", async (c) => {
  const b = await c.req.json<Record<string, string>>().catch(() => ({}) as Record<string, string>);
  if (b.website) return c.json({ ok: true }); // honeypot: bots fill every field
  const f = (k: string, max = 200) => String(b[k] ?? "").trim().slice(0, max);
  const shop = f("shop_name");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f("email"));
  const phoneOk = (f("phone", 40).match(/\d/g) ?? []).length >= 7;
  if (!shop || !(emailOk || phoneOk)) return c.json({ error: "shop_and_contact_required" }, 400);
  const interest = ["list_free", "featured_paid", "exclusive_deal", "unsure"].includes(f("interest")) ? f("interest") : "unsure";
  await c.env.DB.prepare(
    `INSERT INTO merchant_leads (shop_name, contact_name, email, phone, area, offer, interest, budget, message, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(shop, f("contact_name"), f("email"), f("phone", 40), f("area", 80), f("offer", 500), interest, f("budget", 80), f("message", 1000), c.get("user")?.id ?? null)
    .run();
  return c.json({ ok: true });
});

type MerchantKey = { label: string; deal_ids: string };

// A shop pairs its counter phone by opening its private link once; the key is then kept
// in this cookie, so scanning a student's pass QR with the phone's own camera opens
// /r/<code> and confirms with one tap. No shop-side app.
const MERCHANT_COOKIE = "cp_merchant";

async function merchantKey(db: D1Database, key: string | undefined): Promise<MerchantKey | null> {
  if (!key) return null;
  return db
    .prepare("SELECT label, deal_ids FROM merchant_keys WHERE key_hash = ? AND revoked_at IS NULL")
    .bind(await sha256(key))
    .first<MerchantKey>();
}

// The shop's private page reads this to show its name and recent confirmations, and
// pairs this device with the shop.
app.get("/api/merchant/:key", async (c) => {
  const key = c.req.param("key");
  const mk = await merchantKey(c.env.DB, key);
  if (!mk) return c.json({ error: "not_found" }, 404);
  setCookie(c, MERCHANT_COOKIE, key, {
    httpOnly: true,
    secure: isSecure(c.req.url),
    sameSite: "Lax",
    path: "/",
    maxAge: 365 * 864e2,
  });
  const ids = mk.deal_ids.split(",");
  const marks = ids.map(() => "?").join(",");
  const deals = await c.env.DB.prepare(`SELECT id, name, subtitle, highlight FROM deals WHERE id IN (${marks})`).bind(...ids).all();
  const stats = await c.env.DB.prepare(
    `SELECT COUNT(*) AS confirmed_30d FROM redemptions
      WHERE confirmed_key = ? AND confirmed_at > datetime('now', '-30 days')`
  )
    .bind(await sha256(key))
    .first<{ confirmed_30d: number }>();
  return c.json({ label: mk.label, deals: deals.results, confirmed_30d: stats?.confirmed_30d ?? 0 });
});

type PassRow = { id: number; deal_id: string; confirmed_at: string | null; fresh: number; name: string };

/** Look up a pass for a shop. Unknown codes and other shops' codes give the same answer. */
async function passForShop(db: D1Database, mk: MerchantKey, rawCode: string): Promise<PassRow | null> {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const r = await db.prepare(
    `SELECT r.id, r.deal_id, r.confirmed_at, r.created_at > datetime('now', ?) AS fresh, d.name
       FROM redemptions r JOIN deals d ON d.id = r.deal_id WHERE r.code = ?`
  )
    .bind(`-${CONFIRM_MINUTES} minutes`, code)
    .first<PassRow>();
  return r && mk.deal_ids.split(",").includes(r.deal_id) ? r : null;
}

// Paired shop phone opened /r/<code> (by scanning the pass QR): show what it would confirm.
app.get("/api/merchant/pass/:code", async (c) => {
  const mk = await merchantKey(c.env.DB, getCookie(c, MERCHANT_COOKIE));
  if (!mk) return c.json({ error: "not_merchant" }, 403);
  const r = await passForShop(c.env.DB, mk, c.req.param("code"));
  if (!r) return c.json({ error: "invalid_code", shop: mk.label }, 404);
  const status = r.confirmed_at ? "already_confirmed" : r.fresh ? "ok" : "expired_code";
  return c.json({ shop: mk.label, deal: r.name, status });
});

// Confirm a pass: from the shop page (key in the URL) or a paired phone (key in the cookie).
app.post("/api/merchant/confirm", (c) => confirmPass(c, getCookie(c, MERCHANT_COOKIE)));
app.post("/api/merchant/:key/confirm", (c) => confirmPass(c, c.req.param("key")));

// The shop page links this manifest instead of the app's, so a home-screen icon added
// from /m/<key> opens the shop page rather than Explore.
app.get("/api/merchant/:key/manifest.webmanifest", async (c) => {
  const key = c.req.param("key");
  const mk = await merchantKey(c.env.DB, key);
  if (!mk) return c.json({ error: "not_found" }, 404);
  const res = await c.env.ASSETS.fetch(new URL("/manifest.webmanifest", c.req.url));
  const base = (await res.json()) as Record<string, unknown>;
  const start = `/m/${key}`;
  const manifest = {
    ...base,
    id: start,
    start_url: start,
    scope: "/",
    name: `${mk.label} · CampusPass 店家`,
    short_name: "CP 店家",
    shortcuts: undefined,
  };
  return c.body(JSON.stringify(manifest), 200, {
    "Content-Type": "application/manifest+json",
    "Cache-Control": "no-store",
  });
});

async function confirmPass(c: any, key: string | undefined) {
  const mk = await merchantKey(c.env.DB, key);
  if (!mk) return c.json({ error: "not_merchant" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const r = await passForShop(c.env.DB, mk, String(body.code ?? ""));
  if (!r) return c.json({ error: "invalid_code" }, 404);
  if (r.confirmed_at) return c.json({ error: "already_confirmed", deal: r.name }, 409);
  if (!r.fresh) return c.json({ error: "expired_code", deal: r.name }, 410);
  // The `confirmed_at IS NULL` guard makes a double tap (or two cashiers) count once.
  const done = await c.env.DB.prepare(
    "UPDATE redemptions SET confirmed_at = datetime('now'), confirmed_via = 'merchant', confirmed_key = ? WHERE id = ? AND confirmed_at IS NULL"
  )
    .bind(await sha256(key!), r.id)
    .run();
  if (!done.meta.changes) return c.json({ error: "already_confirmed", deal: r.name }, 409);
  return c.json({ ok: true, deal: r.name });
}

// ---------- admin (Bearer ADMIN_TOKEN) ----------

app.use("/admin/*", async (c, next) => {
  const auth = c.req.header("Authorization") ?? "";
  if (!c.env.ADMIN_TOKEN || auth !== `Bearer ${c.env.ADMIN_TOKEN}`) return c.text("Unauthorized", 401);
  await next();
});

function csv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((k) => esc(r[k])).join(","))].join("\n") + "\n";
}

app.get("/admin/users.csv", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, email, name, email_domain, created_at, last_login_at, login_count FROM users ORDER BY created_at"
  ).all();
  return c.body(csv(results), 200, { "Content-Type": "text/csv; charset=utf-8" });
});

app.get("/admin/reports.csv", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.id, r.created_at, r.status, d.name AS deal, u.email, r.message
       FROM reports r LEFT JOIN deals d ON d.id = r.deal_id LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC`
  ).all();
  return c.body(csv(results), 200, { "Content-Type": "text/csv; charset=utf-8" });
});

app.get("/admin/redemptions.csv", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.code, r.created_at, d.name AS deal, u.email, r.outcome, r.outcome_at, r.confirmed_at, r.confirmed_via
       FROM redemptions r LEFT JOIN deals d ON d.id = r.deal_id LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC`
  ).all();
  return c.body(csv(results), 200, { "Content-Type": "text/csv; charset=utf-8" });
});

app.get("/admin/merchants.csv", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM merchant_leads ORDER BY created_at DESC").all();
  return c.body(csv(results), 200, { "Content-Type": "text/csv; charset=utf-8" });
});

// Issue a shop's private confirm link. Body: {label, deal_ids:[...]}. The key is shown once.
app.post("/admin/merchant-keys", async (c) => {
  const b = await c.req.json<{ label?: string; deal_ids?: string[] }>().catch(() => ({}) as { label?: string; deal_ids?: string[] });
  const ids = (b.deal_ids ?? []).filter(Boolean);
  if (!b.label || !ids.length) return c.json({ error: "label_and_deal_ids_required" }, 400);
  const marks = ids.map(() => "?").join(",");
  const found = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM deals WHERE id IN (${marks})`).bind(...ids).first<{ n: number }>();
  if (found?.n !== ids.length) return c.json({ error: "unknown_deal_id" }, 400);
  const key = randomToken(18);
  await c.env.DB.prepare("INSERT INTO merchant_keys (key_hash, label, deal_ids) VALUES (?, ?, ?)")
    .bind(await sha256(key), b.label, ids.join(","))
    .run();
  return c.json({ url: `${new URL(c.req.url).origin}/m/${key}` });
});

app.get("/admin/stats", async (c) => {
  const db = c.env.DB;
  const d7 = taipeiDay(-6);
  const d30 = taipeiDay(-29);
  const n = (sql: string, ...args: unknown[]) =>
    db.prepare(sql).bind(...args).first<{ n: number }>().then((r) => r?.n ?? 0);
  const [users, ntu, active7, active30, repeat30, views30, passes30, used30, refused30, confirmed30, redeemTwice30, leads, payLeads, topViewed, topRedeemed] =
    await Promise.all([
      n("SELECT COUNT(*) AS n FROM users"),
      n("SELECT COUNT(*) AS n FROM users WHERE email_domain IN ('ntu.edu.tw','g.ntu.edu.tw')"),
      n("SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day >= ?", d7),
      n("SELECT COUNT(DISTINCT user_id) AS n FROM visits WHERE day >= ?", d30),
      n("SELECT COUNT(*) AS n FROM (SELECT user_id FROM visits WHERE day >= ? GROUP BY user_id HAVING COUNT(*) >= 2)", d30),
      n("SELECT COUNT(*) AS n FROM deal_views WHERE created_at > datetime('now','-30 days')"),
      n("SELECT COUNT(*) AS n FROM redemptions WHERE created_at > datetime('now','-30 days')"),
      n("SELECT COUNT(*) AS n FROM redemptions WHERE outcome = 'used' AND created_at > datetime('now','-30 days')"),
      n("SELECT COUNT(*) AS n FROM redemptions WHERE outcome = 'refused' AND created_at > datetime('now','-30 days')"),
      n("SELECT COUNT(*) AS n FROM redemptions WHERE confirmed_at IS NOT NULL AND created_at > datetime('now','-30 days')"),
      n(`SELECT COUNT(*) AS n FROM (SELECT user_id FROM redemptions
          WHERE created_at > datetime('now','-30 days') AND (outcome = 'used' OR confirmed_at IS NOT NULL)
          GROUP BY user_id HAVING COUNT(*) >= 2)`),
      n("SELECT COUNT(*) AS n FROM merchant_leads"),
      n("SELECT COUNT(*) AS n FROM merchant_leads WHERE interest IN ('featured_paid','exclusive_deal')"),
      db.prepare(
        `SELECT d.name, COUNT(*) AS views FROM deal_views v JOIN deals d ON d.id = v.deal_id
          WHERE v.created_at > datetime('now','-30 days') GROUP BY v.deal_id ORDER BY views DESC LIMIT 10`
      ).all(),
      db.prepare(
        `SELECT d.name, COUNT(*) AS passes, SUM(r.outcome = 'used') AS self_reported, SUM(r.confirmed_at IS NOT NULL) AS confirmed
           FROM redemptions r JOIN deals d ON d.id = r.deal_id
          WHERE r.created_at > datetime('now','-30 days') GROUP BY r.deal_id ORDER BY passes DESC LIMIT 10`
      ).all(),
    ]);
  return c.json({
    // The go/no-go gate from docs/business-review.md, over the last 30 days.
    gate: {
      students_using_twice: { value: redeemTwice30, target: 30, note: "users with >=2 self-reported or confirmed uses" },
      shops_would_pay: { value: payLeads, target: 5, note: "merchant leads choosing featured_paid or exclusive_deal" },
    },
    users: { total: users, ntu_domain: ntu, active_7d: active7, active_30d: active30, returning_30d: repeat30 },
    usage_30d: { deal_views: views30, passes_opened: passes30, self_reported_used: used30, refused_at_shop: refused30, merchant_confirmed: confirmed30 },
    merchants: { leads: leads, would_pay: payLeads },
    top_viewed_30d: topViewed.results,
    top_redeemed_30d: topRedeemed.results,
  });
});

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));

/**
 * Daily housekeeping (Cron Trigger in wrangler.jsonc). Retention periods follow the proposals in
 * docs/privacy-policy.md: sessions go when they expire; activity rows after two years.
 */
export async function cleanup(db: D1Database) {
  const res = await db.batch([
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(new Date().toISOString()),
    db.prepare("DELETE FROM visits WHERE day < ?").bind(taipeiDay(-730)),
    db.prepare("DELETE FROM deal_views WHERE created_at < datetime('now', '-730 days')"),
    db.prepare("DELETE FROM redemptions WHERE created_at < datetime('now', '-730 days')"),
  ]);
  return res.map((r) => r.meta.changes);
}

// Lets tests and operators run the cleanup on demand.
app.post("/admin/cleanup", async (c) => c.json({ deleted: await cleanup(c.env.DB) }));

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanup(env.DB));
  },
} satisfies ExportedHandler<Env>;
