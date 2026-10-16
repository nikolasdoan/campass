# CampusPass operations runbook

Owner: campass-2 (Cloudflare: deploys, production D1, Worker secrets). See [coordination.md](coordination.md).

## Production

| | |
|---|---|
| URL | **https://pass.tecxmate.com** (Workers Custom Domain, zone `tecxmate.com`); https://campuspass.niko-tecx.workers.dev also works |
| Worker | `campuspass` (custom domain `pass.tecxmate.com` + workers.dev) |
| D1 | `campuspass`, id `e2fd1b29-9117-44ef-9995-ac74f03e15b9`, region ENAM |
| Vars | `GOOGLE_CLIENT_ID` (public, in `wrangler.jsonc`) |
| Secrets | `ADMIN_TOKEN` (set), `GOOGLE_CLIENT_SECRET` (pending) |
| ⚠ TEMPORARY | `DEV_LOGIN=true` set 2026-10-16 ~03:55 UTC at the founder's request so they can test without Google. Remove with `npx wrangler secret delete DEV_LOGIN` when testing ends or Google creds arrive. While set: `/auth/dev-login?email=…` signs anyone in as a separate `dev:` account (real Google accounts are not reachable), and the http→https redirect on Worker paths is off. Delete test accounts on /me before re-enabling stats-based decisions. |
| First deploy | 2026-10-15, integration commit `d37e097`, 605 deals seeded |
| Current deploy | 2026-10-16 02:17 UTC, integration commit `8d1f33c`, version `edda4f4a`; custom domain pass.tecxmate.com; Worker paths redirect http→https (308); migrations 0001–0004; 1117 deals |
| Previous deploy | 2026-10-16 01:18 UTC, `9a2415d`, version `eab29c0a` (rollback target; `b49dfc1d` = same code + custom domain) |
| Test shop link | label `campass-2 smoke` (deal 58a27e58ee), created 2026-10-16 for the deploy check; counts in shop stats |

Only touch the `campuspass` Worker and D1. The account also holds other projects (bizmap, fishpond,
garage_catalog); never run commands against them.

## Auth for wrangler

Cloud sessions use env vars, no `wrangler login`:
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Check with `npx wrangler whoami`.

## First-time setup (what was actually run)

```bash
npm install
npx wrangler whoami
npx wrangler d1 list                          # confirm no campuspass DB yet
npx wrangler d1 create campuspass             # id copied into wrangler.jsonc -> d1_databases[0].database_id
npm run db:migrate:remote                     # 0001_init.sql, 0002_traction.sql
npm run db:seed:remote                        # 605 deals
npm run deploy                                # creates the Worker + workers.dev URL
openssl rand -hex 24 | tr -d '\n' | npx wrangler secret put ADMIN_TOKEN   # value handed to the owner once
```

A brand-new workers.dev subdomain returns `error code: 1042` / 404 for up to a minute after the first
deploy, and a new secret can take a few seconds to reach every edge (an early `401` on `/admin/*`).
Retry before debugging.

## Google sign-in

1. Google Cloud → Credentials → OAuth client (Web application), one entry per host users will sign in on:
   - Authorized JavaScript origins: `https://pass.tecxmate.com` (main), `https://campuspass.niko-tecx.workers.dev`
   - Authorized redirect URIs: `https://pass.tecxmate.com/auth/google/callback`,
     `https://campuspass.niko-tecx.workers.dev/auth/google/callback`
   The Worker builds the redirect URI from the host the request came in on.
2. Put the client id in `wrangler.jsonc` → `vars.GOOGLE_CLIENT_ID` (commit it; it is public).
3. Set the secret without echoing it:
   `printf %s "$GOOGLE_CLIENT_SECRET" | npx wrangler secret put GOOGLE_CLIENT_SECRET`
4. `npm run deploy`, then check `/auth/google/start` redirects (302) to `accounts.google.com`.
5. After a real sign-in, confirm the row: `/admin/users.csv`.

Until both are set, `/auth/google/start` returns 500 "Google login is not configured". **Never set
`DEV_LOGIN` in production.**

## Routine deploy

Deploy only commits on `claude/jolly-maxwell-e43rxf` that campass-1 has named.

```bash
git fetch origin claude/jolly-maxwell-e43rxf
git checkout --detach <commit>                # the named commit
npm install
npm run db:migrate:remote                     # first, if migrations/ changed (schema before code)
npm run db:seed:remote                        # if seed/deals.sql changed (replaces deals, ~600 rows)
npm run deploy
```

Then run the smoke checks below and report URL + version id + results to campass-1. Run them again if a
check fails in the first seconds after a deploy: edges can briefly serve the previous build (on 2026-10-15
`/admin.html` returned the old SPA shell for a few seconds). `/api/deals` is sent with `Cache-Control: public,
max-age=300`, so after a re-seed a client or proxy can show the previous list for up to 5 minutes; add a
cache-busting query (`?x=1`) when checking new fields.

## Smoke checks

```bash
U=https://pass.tecxmate.com   # also run against https://campuspass.niko-tecx.workers.dev
curl -s $U/api/deals | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["deals"]))'   # ~605
for p in / /deal/<id> /manifest.webmanifest /sw.js; do curl -s -o /dev/null -w "$p %{http_code} %{content_type}\n" $U$p; done
#   / and /deal/<id>: 200 text/html (SPA fallback); manifest: application/manifest+json; sw.js: 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" $U/auth/google/start   # 302 to accounts.google.com
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $U/admin/stats                    # JSON
curl -s -o /dev/null -w "%{http_code}\n" $U/admin/stats                            # 401 without token
```

Results of the first deploy (2026-10-15): all pass, except `/auth/google/start` which correctly reports
"not configured" until the Google client id/secret exist.

## How the founder tests on a phone

Live URL: https://pass.tecxmate.com. You need two phones: one is the **student**, the other the
**shop's counter phone**.

**0. Until Google sign-in is configured** (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, see "Google sign-in"),
登入 shows "Google login is not configured". You can still browse deals, filters, deal pages (locked terms), install
the app, open /merchants and /admin.html, and pair a shop phone (steps 1–3). Steps 4–6 need a signed-in student, so
they wait for the creds. There is no test login in production (`DEV_LOGIN` is never set there).

**1. Install the app (student phone)**
- iPhone: open the URL in **Safari** → Share → **加入主畫面** → 新增. (The /me page shows the same hint.)
- Android: open the URL in **Chrome** → ⋮ menu → **Install app** (or 加到主畫面), or tap 安裝 when the prompt appears.
- Open it from the home screen: it should start full screen, with the bottom tab bar above the home indicator.

**2. Create a shop link (any device)**: open `/admin.html`, enter the ADMIN_TOKEN, go to 建立商家確認連結, type
a shop name, search a deal (e.g. 福華), pick it, 建立連結. Copy the link or print the QR. It is shown only once.

**3. Pair the shop phone**: open the link once on the second phone **in its normal browser** (Safari on iPhone,
Chrome on Android). The page shows the shop name and its 30-day count; the phone is now paired (cookie, 365 days).
On iPhone, pair in Safari, not in a home-screen copy: the iPhone camera opens scanned links in Safari, and
home-screen apps on iOS keep their own cookies, so a pairing made there is not seen by the camera's Safari.
The shop page also has a box to type a 6-character code by hand.

**4. Sign in (student phone)**: 我的 → 使用 Google 登入. You come back to the same page, signed in.

**5. Use a deal**: open the deal from step 2 → **使用優惠**. A full-screen pass opens with a 6-character code, a QR, a
live clock and a 15-minute countdown.

**6. Shop confirms**: point the shop phone's normal camera at the QR → open the link → **確認使用** → big ✓. Within
about 5 seconds the student's pass flips to 店家已確認. (Or type the code on the shop page.) The shop can confirm
within 30 minutes of the pass opening, once per code.

**7. Check the numbers**: `/admin.html` → refresh. Expect: users +1, 開啟通行證 (tier 1) +1, 店家確認 (tier 3) +1,
the deal in 最多使用. If the student closes the pass and answers 優惠有用成功嗎？ with 有，用成功了, 自述已使用 (tier 2) goes up.
Two confirmed or self-reported uses by the same student in 30 days count towards the go/no-go gate.

**Clean up after testing**: the student can delete the test account on /me (刪除帳號). That removes its favourites, passes and
reports; shop-confirmed uses stay in the shop's count but are no longer linked to the account.

## Scheduled cleanup (Cron Trigger)

`wrangler.jsonc` → `"triggers": { "crons": ["17 19 * * *"] }` runs the Worker's `scheduled()` handler daily at
03:17 Asia/Taipei. It calls `cleanup()`: expired sessions, and visits / deal views / passes older than 730 days.
The trigger is registered by `npm run deploy` (the deploy output lists `schedule: 17 19 * * *`).

Run it on demand in production: `curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" $U/admin/cleanup`
(returns the rows deleted per table).

Test locally (wrangler 4.151; the old `/__scheduled` URL is caught by the SPA asset fallback):

```bash
npx wrangler dev --port 8788 --test-scheduled
curl -X POST -H "Content-Type: application/json" -d '{"cron":"17 19 * * *"}' \
  "http://localhost:8788/cdn-cgi/local/explorer/api/local/scheduled?worker=campuspass"
# -> {"success":true,...,"result":{"outcome":"ok"}}
```

## Rate limiting

`wrangler.jsonc` → `ratelimits`: `RL_FORMS` (10/min per IP and bucket, used by reports and shop leads) and
`RL_CONFIRM` (30/min per IP, shop pass confirmations). Missing bindings mean no limit. `namespace_id` is
shared across the whole Cloudflare account, so the ids are distinctive (`20261001`, `20261002`) and must not be
reused by other Workers. A burst of local test runs within one minute can hit these limits (429); wait a minute.

## Custom domain

`wrangler.jsonc` → `"routes": [{ "pattern": "pass.tecxmate.com", "custom_domain": true }]`, `workers_dev: true`.
On 2026-10-16 the first `wrangler deploy` with the route failed with API error 10013 (HTTP 500 on
`…/workers/scripts/campuspass/domains/records`); attaching it directly worked and later deploys are clean:

```bash
curl -X PUT -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains" \
  -d '{"hostname":"pass.tecxmate.com","zone_id":"<tecxmate.com zone id>","service":"campuspass","environment":"production"}'
```

**HTTPS:** on 2026-10-16 `http://pass.tecxmate.com` (and `http://…workers.dev`) served the app over plain HTTP
with no redirect: the zone's "Always Use HTTPS" is off. Over HTTP the HSTS header is ignored, the service worker
cannot register and cookies lose `Secure`. Fix in the dashboard (token has no zone-settings access): SSL/TLS →
Edge Certificates → Always Use HTTPS (whole zone), or Rules → Redirect Rules → "Redirect from HTTP to HTTPS"
limited to hostname `pass.tecxmate.com`. `prod-smoke` checks the redirect.

The `tecxmate.com` zone has Cloudflare Web Analytics with automatic injection. On browser page loads it inserts
`static.cloudflareinsights.com/beacon.min.js` plus an inline loader, which the CampusPass CSP blocks (console
errors, no functional impact). `curl` does not receive the injected script, so only a real-browser check shows it.
Decision (founder, 2026-10-16): exclude `pass.tecxmate.com` in Web Analytics → tecxmate.com site → Rules (Exclude,
host `pass.tecxmate.com`, path `*`); the token is read-only there. Rocket Loader / minify / email obfuscation inject
nothing (checked in a browser).

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback <version-id>
```

Rollback restores code only. D1 is not rolled back: for data, re-seed from a known-good
`seed/deals.sql`, or use D1 Time Travel (`npx wrangler d1 time-travel restore campuspass --timestamp=<ISO>`).

## Data and admin

```bash
npx wrangler d1 execute campuspass --remote --command "SELECT COUNT(*) FROM deals"
npx wrangler d1 execute campuspass --remote --command "SELECT email, created_at FROM users"
curl -H "Authorization: Bearer $ADMIN_TOKEN" $U/admin/users.csv
```

## Secrets rules

- Pipe secrets via stdin (`printf %s "$X" | npx wrangler secret put X`); never pass them as arguments,
  never print or commit them.
- Rotate `ADMIN_TOKEN` the same way; the old one stops working on the next request.
