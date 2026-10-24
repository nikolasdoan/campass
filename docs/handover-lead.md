# Handover: the lead session (campass-1)

For a new session taking over campass-1's role, for example after a move to another Claude account. Read this
file first, then [coordination.md](coordination.md) (roles, file ownership, the deploy flow) and
[status-2026-10-16.md](status-2026-10-16.md) (what the product does). The ops side has its own checklist in
[ops.md](ops.md) under "Handover to a new account".

## Your role

You lead product, code, data and design, and you own the integration branch. campass-2 (ops) owns Cloudflare:
deploys, production D1, secrets and CI. You never deploy. You name an integration commit, and campass-2 deploys
only commits you named.

## State to check first

1. `git log --oneline -5` on the integration branch. Merge the ops branch into it after reviewing.
2. What production runs: the "Current deploy" row in docs/ops.md, or `curl -s https://pass.tecxmate.com/ | grep -o 'app.js?v=[0-9]*'`.
3. Open work: the "Open items" section below. Ask the founder or campass-2 if it is out of date.

## Branches and sessions

- Integration branch: `claude/jolly-maxwell-e43rxf`. Ops branch: `claude/youthful-hopper-3gqd9h`. A new account
  may use new branch names. If so, record them in coordination.md.
- Sessions talk with `send_message` (claude-code-remote MCP). If a session id changes, update the table in
  coordination.md. If messaging fails, use commit messages on the branches and tell the founder.

## Local setup (cloud container)

```bash
npm install
cp .dev.vars.example .dev.vars   # then uncomment GOOGLE_CLIENT_ID=mock-client-id and GOOGLE_MOCK_URL
npm run db:migrate:local && npm run db:seed:local
npm run dev            # :8787 (keep it running)
npm run mock-google    # :9876, needed by the API and UI suites
npm test               # api, ui, pwa (needs PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1), admin
```

Stop servers with `pkill -f "[w]rangler dev"`. The bracket stops pkill from killing its own shell.

## How a change ships

1. Change, then add or adjust a test and prove it fails without the fix.
2. Bump `?v=N` in `public/index.html`, `public/app.js` and `public/js/*.js` whenever anything under `public/`
   changes. The service worker and browsers key on it.
3. Run all four local suites green, commit (small, self-contained) and push to the integration branch.
4. Message campass-2: the commit, what changed, any migration (applied to production *before* the code), and
   "deploy when CI is green".

## Product rules worth knowing

- Sign-in is Google only. Test login (`DEV_LOGIN`) is for local and CI only. The founder turned it on in
  production once, for testing, and it is off now.
- Identity cards are branded "CampusPass card / 校園卡", never "NTU membership". Google sign-in proves the email,
  not enrolment, so the shop still checks the student ID.
- Only shop-confirmed passes count as verified redemptions. Test (`dev:`) accounts are excluded from the
  dashboard numbers.
- Every deal keeps its source and date. Data comes from `data/ntu-partners.xlsx` plus `data/sources/*.json` through
  `npm run import`. Never hand-edit `seed/deals.sql`.
- The UI is bilingual, zh first, through `t()` in `public/js/i18n.js`. English mode shows no untranslated UI
  Chinese, and labels, pills and buttons never wrap.

## Open items (2026-10-22)

- **Demo QA round** (2026-10-22): done. What was fixed and what is still open, ranked, is in
  [qa-2026-10-22.md](qa-2026-10-22.md). Start from its "Open" list.
- **Live (2026-10-24):** 88239f7, ?v=20, 1,563 deals from 21 schools. Records whose terms were never transcribed
  (notes 「未轉錄」, 164 so far) are held back by `HOLD_UNTRANSCRIBED` in scripts/import_deals.py, pending the
  founder's confirmation; transcription could be worker tasks (STUST Drive files, NKUHT contracts, NDHU rate scans).
- **Worker loop** (docs/worker.md): campass-2 files `worker` issues; review the PRs, merge, run the import, add any
  new school code (SCHOOL_DOMAINS, i18n SCHOOLS, CARD_TONE) and give every new badge text an English rule.
  Evidence is a MANIFEST only (images in the founder's private storage).
- **Founder actions**: Google OAuth client (in progress). Turn off Cloudflare JavaScript Detections for
  tecxmate.com (Security → Bots): the zone injects an inline script that our CSP blocks (1 console error per
  page, no user impact). Web Analytics exclusion: done.
- **Not started, founder decisions**: an exclusive-deal pilot near 公館 (docs/business-review.md); a lawyer's
  read of the privacy and terms drafts; an email provider for verifying school cards by code.
