# CampusPass 校園優惠

One place for every existing student discount. CampusPass indexes partner deals that schools and
student organisations already publish — today ~1,100 deals from 12 schools, starting with NTU — so
students can search them, sign in with Google to see the full terms, save the ones they use, and show
a pass at the counter that partner shops can confirm with a QR scan.

> CampusPass is an independent index, not an official website of any school. Deals are subject to the
> merchant and the original publisher.

Live: <https://pass.tecxmate.com> · Business review: [docs/business-review.md](docs/business-review.md)

## Stack

- **Cloudflare Workers** ([Hono](https://hono.dev)) serves the API and the static site (Workers static assets),
  with a daily Cron Trigger for cleanup and Workers Rate Limiting on public forms and shop scans.
- **Cloudflare D1** (SQLite): deals, users, sessions, favourites, visits, deal views, redemption passes,
  reports, merchant leads, shop links.
- **Google Sign-In** (OAuth 2.0 / OpenID Connect, code flow with PKCE). Every sign-in records the user's
  email, name, email domain, login days and count.
- **Frontend**: vanilla HTML/CSS/JS PWA in `public/` (installable, works offline after one visit), using the
  Tecxmate design system ([docs/design-system.md](docs/design-system.md)). No build step.

```
src/index.ts             Worker: auth, API, redemption, shops, admin, cleanup
src/google.ts            Google OAuth helpers
migrations/              D1 schema (apply in order)
scripts/import_deals.py  data/ntu-partners.xlsx + data/sources/*.json -> data/deals.json + seed/deals.sql
data/sources/            Researched sources per school (JSON + a .md report each)
seed/deals.sql           Generated seed (do not edit by hand)
public/                  The PWA (app.js, js/, styles.css, sw.js, pwa.js, boot.js, fonts/, icons/)
public/admin.html        Founder dashboard (go/no-go gate, CSVs, shop links)
tests/                   api.mjs, ui.mjs, pwa.mjs, admin.mjs, prod-smoke.mjs, mock-google.mjs
docs/                    design system, business review, coordination, ops runbook, privacy, terms
```

## What students and shops can do

| | Signed out | Signed in |
|---|---|---|
| Browse/search deals: name, category, region, school, discount badge, eligibility, expiry, source | ✅ | ✅ |
| Full terms, booking codes, phone, address, links | 🔒 | ✅ |
| Save deals, report a wrong deal, delete account | 🔒 | ✅ |
| 使用優惠: a 15-minute pass with QR + one-time code | 🔒 | ✅ |

The server enforces the gating: `GET /api/deals/:id` returns only public fields without a session.

**Redemption evidence** (see the business review): a pass opened → the student's own answer
("did it work?") → a **shop confirmation**, the only verified tier. Shops need no app: an admin creates a
private shop link (`/m/<key>`) on the dashboard; the cashier opens it once on the counter phone (this pairs
the phone), then scans a student's pass QR with the phone camera and taps 確認. Codes work once and expire.

**Merchant leads**: `/merchants` collects shops that want to be listed or would pay for featured placement.

## 1. Google Cloud setup (once)

1. Open <https://console.cloud.google.com> and select your project.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform): user type **External**; app name
   `CampusPass`; support email; scopes `openid`, `email`, `profile` (non-sensitive, no review). Click
   **Publish app** — while in *Testing*, only listed test users can sign in.
3. **Credentials → Create credentials → OAuth client ID**, type **Web application**:
   - Authorized JavaScript origins: `http://localhost:8787`, `https://pass.tecxmate.com`
   - Authorized redirect URIs: `http://localhost:8787/auth/google/callback`,
     `https://pass.tecxmate.com/auth/google/callback`
4. The **Client ID** goes in `wrangler.jsonc` (`vars.GOOGLE_CLIENT_ID`); the **Client secret** goes in a
   Cloudflare secret. Never commit the secret.

## 2. Cloudflare (deploys are owned by campass-2; see [docs/ops.md](docs/ops.md))

```bash
npm install
npx wrangler d1 migrations apply campuspass --remote   # before deploying code that needs them
npm run db:seed:remote                                 # replaces the deals table (~1,100 rows)
printf %s "$GOOGLE_CLIENT_SECRET" | npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ADMIN_TOKEN
npm run deploy
BASE=https://pass.tecxmate.com ADMIN_TOKEN=... node tests/prod-smoke.mjs
```

Everything fits in the Workers and D1 free tiers.

## Local development and tests

```bash
cp .dev.vars.example .dev.vars   # DEV_LOGIN=true; optional GOOGLE_MOCK_URL for the OAuth mock
npm run db:migrate:local && npm run db:seed:local
npm run dev                      # http://localhost:8787 (--local-upstream keeps the custom domain out of local URLs)
npm run mock-google              # optional: http://localhost:9876, exercises the real OAuth code path
npm test                         # api (115) + ui (198) + pwa (29) + admin (36)
```

- `/auth/dev-login?email=you@example.com` signs in without Google (only with `DEV_LOGIN=true`; **never
  in production** — it 404s there).
- The PWA suite needs `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1` so offline also reaches the
  service worker. CI (`.github/workflows/ci.yml`) runs all suites on every push to `claude/**`.
- Tests run in Chromium only; Safari/iOS behaviour (standalone, safe areas) is emulated, not tested on WebKit.

## Updating the deals

1. Replace `data/ntu-partners.xlsx` and/or add `data/sources/<school>.json` (same record shape as
   `data/deals.json`; every record needs `source_org` and `source_url` you actually fetched).
2. `npm run import` — regenerates `data/deals.json` and `seed/deals.sql` (corrections live in `OVERRIDES`
   in `scripts/import_deals.py`). CI fails if the committed seed is stale.
3. Deploy the seed (`npm run db:seed:remote`). Deal ids are stable hashes, so saved deals survive.

## Founder dashboard and data

Open `/admin.html` and paste the `ADMIN_TOKEN` (kept for the browser tab only). It shows the go/no-go gate
(students using deals twice in 30 days vs 30; shops that would pay vs 5), active and returning users,
redemption evidence by tier, top deals, CSV downloads (users, reports, redemptions, merchant leads), shop
link creation, and a manual cleanup. The same data is at `/admin/stats` and `/admin/*.csv` with
`Authorization: Bearer $ADMIN_TOKEN`.

## Privacy and security

- Stored: Google email, name, picture, email domain; login days; favourites; deal views; passes; reports;
  merchant leads. Session tokens and shop keys are stored as SHA-256 hashes. No student ID images.
- Users can delete their account (/me). A daily job deletes expired sessions and activity older than two
  years. Fonts are self-hosted; no third-party requests besides Google sign-in and avatars.
- Headers: CSP (`script-src 'self'` + hashes), HSTS, `X-Frame-Options: DENY`, nosniff; per-user responses
  are `private, no-store`; CSRF origin checks on every state-changing API call; per-IP rate limits.
- Drafts for lawyer review: [docs/privacy-policy.md](docs/privacy-policy.md), [docs/terms.md](docs/terms.md)
  (個人資料保護法).

## Working on this repo

Two Claude Code sessions build CampusPass: campass-1 (lead: product, code, data) and campass-2 (Cloudflare,
deploys, CI). Roles, file ownership and the deploy flow are in [docs/coordination.md](docs/coordination.md).
