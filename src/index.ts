import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { googleAuthUrl, exchangeCode, newPkce } from "./google";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_TOKEN?: string;
  /** Local development only: enables /auth/dev-login without Google. Never set in production. */
  DEV_LOGIN?: string;
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
    })
  );
});

app.get("/auth/google/callback", async (c) => {
  const raw = getCookie(c, OAUTH_COOKIE);
  deleteCookie(c, OAUTH_COOKIE, { path: "/auth" });
  const fail = (reason: string) => c.redirect(`/?login_error=${encodeURIComponent(reason)}`);

  if (c.req.query("error")) return fail(c.req.query("error")!);
  if (!raw) return fail("expired");
  let saved: { state: string; verifier: string; next: string };
  try {
    saved = JSON.parse(raw);
  } catch {
    return fail("expired");
  }
  const code = c.req.query("code");
  if (!code || c.req.query("state") !== saved.state) return fail("state_mismatch");

  try {
    const profile = await exchangeCode({
      code,
      verifier: saved.verifier,
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${new URL(c.req.url).origin}/auth/google/callback`,
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

// ---------- API ----------

app.get("/api/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ user: null, favorites: [] });
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

app.get("/admin/stats", async (c) => {
  const db = c.env.DB;
  const [users, ntu, views, topDeals] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM users WHERE email_domain IN ('ntu.edu.tw','g.ntu.edu.tw')").first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM deal_views").first<{ n: number }>(),
    db
      .prepare(
        `SELECT d.name, COUNT(*) AS views FROM deal_views v JOIN deals d ON d.id = v.deal_id
          GROUP BY v.deal_id ORDER BY views DESC LIMIT 10`
      )
      .all(),
  ]);
  return c.json({ users: users?.n, ntu_users: ntu?.n, deal_views: views?.n, top_deals: topDeals.results });
});

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));

export default app;
