# CampusPass operations runbook

Owner: campass-2 (Cloudflare: deploys, production D1, Worker secrets). See [coordination.md](coordination.md).

## Production

| | |
|---|---|
| URL | https://campuspass.niko-tecx.workers.dev |
| Worker | `campuspass` (workers.dev, no custom route yet) |
| D1 | `campuspass`, id `e2fd1b29-9117-44ef-9995-ac74f03e15b9`, region ENAM |
| Vars | `GOOGLE_CLIENT_ID` (public, in `wrangler.jsonc`) |
| Secrets | `ADMIN_TOKEN` (set), `GOOGLE_CLIENT_SECRET` (pending) |
| First deploy | 2026-10-15, integration commit `d37e097`, 605 deals seeded |
| Current deploy | 2026-10-15 19:55 UTC, integration commit `d92a1ef`, version `ee3a6e82`; migrations 0001–0003; 1117 deals; ratelimits + cron |

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

1. Google Cloud → Credentials → OAuth client (Web application):
   - Authorized JavaScript origin: `https://campuspass.niko-tecx.workers.dev`
   - Authorized redirect URI: `https://campuspass.niko-tecx.workers.dev/auth/google/callback`
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
`/admin.html` returned the old SPA shell for a few seconds).

## Smoke checks

```bash
U=https://campuspass.niko-tecx.workers.dev
curl -s $U/api/deals | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["deals"]))'   # ~605
for p in / /deal/<id> /manifest.webmanifest /sw.js; do curl -s -o /dev/null -w "$p %{http_code} %{content_type}\n" $U$p; done
#   / and /deal/<id>: 200 text/html (SPA fallback); manifest: application/manifest+json; sw.js: 200
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" $U/auth/google/start   # 302 to accounts.google.com
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" $U/admin/stats                    # JSON
curl -s -o /dev/null -w "%{http_code}\n" $U/admin/stats                            # 401 without token
```

Results of the first deploy (2026-10-15): all pass, except `/auth/google/start` which correctly reports
"not configured" until the Google client id/secret exist.

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
