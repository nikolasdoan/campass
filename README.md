# CampusPass 校園優惠

One place for every existing student discount. CampusPass indexes partner deals that schools and
student organisations already publish (starting with the NTU Finance Office list), so students can
search them, sign in with Google to see the full terms, and save the ones they use.

> CampusPass is an independent index, not an official NTU website. Deals are subject to the merchant
> and the original publisher.

## Stack

- **Cloudflare Workers** ([Hono](https://hono.dev)) serves the API and the static site (Workers static assets).
- **Cloudflare D1** (SQLite) holds the deals, users, sessions, favourites, deal views and reports.
- **Google Sign-In** (OAuth 2.0 / OpenID Connect, authorization-code flow with PKCE). Every sign-in records
  the user's email, name, email domain, first and last login time and login count.
- **Frontend**: vanilla HTML/CSS/JS PWA in `public/`, using the Tecxmate design system
  ([docs/design-system.md](docs/design-system.md)). No build step.

```
src/index.ts           Worker: auth, API, admin endpoints
src/google.ts          Google OAuth helpers
migrations/            D1 schema
scripts/import_deals.py  Spreadsheet + data/sources/*.json  ->  data/deals.json + seed/deals.sql
data/ntu-partners.xlsx NTU Finance Office partner list (source)
data/sources/          Additional researched sources (JSON + notes)
seed/deals.sql         Generated seed (do not edit by hand)
public/                The website / PWA
```

## What is public and what needs sign-in

| | Signed out | Signed in |
|---|---|---|
| Partner names, category, region, discount badge, eligibility, expiry, source | ✅ | ✅ |
| Full terms, booking codes, phone, address, links | 🔒 | ✅ |
| Save deals, report a wrong deal | 🔒 | ✅ |

The server enforces this: `GET /api/deals/:id` returns only public fields unless the session is valid.

## 1. Google Cloud setup (once)

1. Open <https://console.cloud.google.com> and select your project.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform):
   user type **External**; app name `CampusPass`; support email; scopes `openid`, `email`, `profile`
   (non-sensitive, no Google review needed). Click **Publish app** — while it is in *Testing*, only listed
   test users can sign in.
3. **Credentials → Create credentials → OAuth client ID**, type **Web application**:
   - Authorized JavaScript origins: `http://localhost:8787`, `https://campuspass.<your-subdomain>.workers.dev`
   - Authorized redirect URIs: `http://localhost:8787/auth/google/callback`,
     `https://campuspass.<your-subdomain>.workers.dev/auth/google/callback`
4. Keep the **Client ID** (goes in `wrangler.jsonc`) and the **Client secret** (goes in a Cloudflare secret).
   Never commit the secret.

## 2. Cloudflare setup (once)

```bash
npm install
npx wrangler login
npx wrangler d1 create campuspass          # copy the database_id into wrangler.jsonc
# put your Google Client ID into wrangler.jsonc -> vars.GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put ADMIN_TOKEN        # any long random string, for the admin CSV endpoints
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy                             # prints https://campuspass.<subdomain>.workers.dev
```

Everything above fits in the Workers and D1 free tiers.

## Local development

```bash
cp .dev.vars.example .dev.vars     # set GOOGLE_CLIENT_SECRET; DEV_LOGIN=true enables a local test login
npm run db:migrate:local
npm run db:seed:local
npm run dev                        # http://localhost:8787
```

With `DEV_LOGIN=true` you can sign in without Google at
`http://localhost:8787/auth/dev-login?email=you@example.com`. **Never set `DEV_LOGIN` in production.**

## Updating the deals

1. Replace `data/ntu-partners.xlsx` with the newer export, and/or add a researched source as
   `data/sources/<name>.json` (same record shape as `data/deals.json`; every record needs `source_org`
   and `source_url`).
2. `npm run import` — regenerates `data/deals.json` and `seed/deals.sql`. Manual corrections
   (eligibility, display names, discount badges) live in `OVERRIDES` in `scripts/import_deals.py`.
3. `npm run db:seed:remote` — replaces the `deals` table (≈70 row writes).

Deal ids are stable hashes of the merchant name, so saved deals survive re-imports.

## Collected emails and stats

All admin endpoints need `Authorization: Bearer $ADMIN_TOKEN`.

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<host>/admin/users.csv    # every signed-in user
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<host>/admin/reports.csv  # "this deal is wrong" reports
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<host>/admin/stats        # users, NTU users, views, top deals
```

Or query D1 directly: `npx wrangler d1 execute campuspass --remote --command "SELECT email, created_at FROM users"`.

## Privacy

CampusPass stores only what Google returns for the `openid email profile` scopes (email, name, picture),
the login times, favourites, deal views and reports. Session tokens are stored as SHA-256 hashes.
Nothing is sold or shared. No student ID images are stored (per the business plan). Have the privacy
notice reviewed under Taiwan's Personal Data Protection Act (個人資料保護法) before scaling.
