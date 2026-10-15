# Two-session coordination: campass-1 and campass-2

CampusPass is built by two Claude Code cloud sessions working in parallel.

| | campass-1 (lead) | campass-2 (ops + worker) |
|---|---|---|
| Session | `session_01AA5mMxnjoRazi9GzHcw1Jx` | `session_018CfGki3hLwAyQhaDipxXcv` |
| Authority | Product, code, data and design decisions; merges all work | Everything on Cloudflare: deploys, production D1, Worker secrets. Nothing reaches production except through campass-2 |
| Branch | `claude/jolly-maxwell-e43rxf` (the integration branch) | `claude/youthful-hopper-3gqd9h` (started from the integration branch) |

## Who owns which files

No two sessions edit the same file. If you need a change in a file you don't own, message the owner.

| campass-1 | campass-2 |
|---|---|
| `public/**`, `src/**`, `scripts/**`, `migrations/**`, `tests/**` except `tests/prod-smoke.mjs` | `wrangler.jsonc` (database id, Google client id, routes), `tests/prod-smoke.mjs` |
| `data/deals.json`, `seed/deals.sql`, `data/sources/ntu-research.*`, `data/sources/other-schools.*` | new source files `data/sources/<school>.json` + `.md` (one pair per school) |
| `README.md`, `docs/**` | `.github/**` (CI/deploy workflows), `docs/ops.md`, `docs/privacy-policy.md`, `docs/terms.md` |

## Flow

1. campass-2 commits on its own branch and pushes, then messages campass-1 with the branch name and what changed.
2. campass-1 reviews, merges into `claude/jolly-maxwell-e43rxf`, regenerates `seed/deals.sql` if sources changed, runs the checks, pushes, and tells campass-2 the commit to deploy.
3. campass-2 deploys **only commits on the integration branch** that campass-1 has named, and reports the URL and its checks.
4. Schema changes (`migrations/`) are applied to production by campass-2 **before** the code that needs them is deployed.

## Messaging

- Use the `send_message` tool (claude-code-remote MCP) with the other session's id.
- Keep messages short: what was done, branch/commit, what is needed next, blockers.
- If messaging fails, write the update to the PR or commit message and tell the user.

## Checks before any push

- `npx tsc --noEmit`
- `python3 scripts/import_deals.py` when data changed (then `seed/deals.sql` must be committed)
- `npm run dev` + `npm run test:ui` for anything under `public/` or `src/` (must stay 100% passing)

## Production rules

- Never set `DEV_LOGIN` in production. Never print or commit secrets (`GOOGLE_CLIENT_SECRET`, `ADMIN_TOKEN`,
  `CLOUDFLARE_API_TOKEN`).
- `npm run db:seed:remote` replaces the `deals` table (~600 row writes); favourites survive because deal ids are stable.
- The Cloudflare token in use is scoped to the CampusPass account permissions (Workers Scripts, D1, Account Settings).
  Do not touch other Workers or D1 databases on the account (e.g. bizmap's).
