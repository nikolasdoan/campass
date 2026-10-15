# Business review: the critique, checked against the app

On 2026-10-13 an earlier review of E's plan (CampusPass v0.2) concluded: *a good free service for
students and a weak business; the revenue share is the weakest part.* This note checks each point
against what CampusPass now is (the code in this repo and the 605 deals in `data/deals.json`,
counted 2026-10-15) and says what the app does about it.

## Verdict

The critique holds. Building the MVP made two of its points sharper and changed one:

- **Sharper:** every one of the 585 active deals already exists and was published by a school or
  student group. CampusPass created none of them, so there is still nothing to charge a shop for.
- **Sharper:** a sale made by showing a student card cannot be seen by any app. That is a property
  of how these deals work, not a missing feature.
- **Changed:** "one campus is a small market" is weaker now. The same pipeline indexed eight
  schools' lists in a day, so multi-school reach is cheap. Reach is not revenue, though.

## Point by point

| Claim (2026-10-13) | Checked against | Result |
|---|---|---|
| The plan is disciplined: $0 for three months, gates at each stage | PDF ch. 7–8; this MVP runs on Cloudflare and Google free tiers | **Holds.** Running cost so far is $0. |
| Base case earns NT$87,960 in year one against NT$390,000 spent; best case NT$299,850 | PDF ch. 8 | **Holds** (figures match the plan). |
| The discounts already exist and cost the shop nothing to list | `data/deals.json`: 585 active deals, all from published lists (516 school-level, 69 student-org). 0 CampusPass-exclusive deals | **Holds.** The most common badges are 9折 (99), 專屬優惠價 (92) and 95折 (70), all of which shops already give. |
| A sale at the counter can't be traced | How the deals are redeemed: "憑臺大證件", "出示學生證" | **Holds.** See *Redemption* below for what the app can and cannot prove. |
| The plan itself says existing student-card offers pay no commission | PDF ch. 6: 「既有學生證優惠不抽成」 | **Holds.** |
| The payers are small; a paying shop is assumed to stay 2–3 months | PDF ch. 8 (20 shops × NT$699 × 2 months); NTU data: 72 of 157 student deals are food | **Mostly holds.** Lodging (39 NTU deals, 87 across schools) are larger chains, but they sign corporate rates with the school, not with an app. |
| One campus is a small market; students leave after four years | Data now covers NTU, NTNU, NTUST, NCCU, NCHU, NTHU, NYCU, TCU | **Weaker.** Indexing more schools is cheap. Each new school still needs its own users. |
| Brand campaigns need many universities and verified students; competitors verify already (UniMarket) | App signs users in with Google and records the email domain; no student verification | **Holds.** The app can count .edu.tw sign-ins, a proxy, not verification. UniMarket verifies by student ID or school email. |
| Employee benefits may be the real business | Data: many lists are HR (人事室) staff-benefit lists; 100 active deals are staff-only (NTHU 36, NCHU 33, NTU 19) | **Supported by the data**, not yet researched as a market. The `eligibility` and `schools` fields already model "staff of X". |
| The NTU name is a risk | The app says 「CampusPass 為獨立整理之索引，非臺大官方網站」 and links each deal to its publisher; no NTU logo | **Reduced, not removed.** Needs a lawyer's read before a public launch. |
| Student identity data brings personal-data duties | The app stores Google email, name, picture, login days, saved deals, views, passes. No student ID images or numbers | **Holds, and kept small.** A 個資法 privacy notice review is still needed. |

## Redemption: what the app can and cannot prove

For the existing deals the student shows a student card and pays, so CampusPass is not in the
transaction. The app therefore records **evidence in tiers** and reports each tier separately in
`/admin/stats`:

| Tier | How it's recorded | Strength | Main way to game it |
|---|---|---|---|
| 1. Pass opened | Student taps 「使用優惠」; a 15-minute pass with a one-time code and QR | Intent only | Opening passes without going to the shop |
| 2. Self-reported | After the pass, 「優惠有用成功嗎？」 used / refused / not used | Weak | Answering "used" without buying |
| 3. Shop-confirmed | The shop scans the pass QR with its own paired phone (or types the code) | **Verified** | A shop confirming passes it never served (a shop has no reason to inflate its own count unless it is paid per redemption) |

How shop confirmation works without a shop-side app:

1. CampusPass issues the shop a private link (`/m/<key>`). The cashier opens it once on the counter
   phone; that pairs the phone (a cookie). The link can be revoked.
2. The student's pass shows a QR for `/r/<code>`. The cashier scans it with the phone's normal camera
   and taps 確認. If anyone else scans it, they see an explanation and no student data.
3. Each code works once, expires (pass 15 minutes, confirmation within 2 hours), and the pass shows a
   live clock and countdown so a screenshot is easy to spot.

The limit: **tier 3 only exists where a shop chooses to scan.** For the 585 existing deals the shop
already accepts a student card, so it has no reason to scan. Verified redemption becomes realistic
only for **CampusPass-exclusive deals** (plan months 7–12), where the shop makes the code a
condition of the discount. That is also the only place a per-redemption fee could be billed.

## The go/no-go gate

The earlier review proposed reopening the business question when **30 students use it twice in a
month and 5 shops say they'd pay**. The app now measures both:

- `GET /admin/stats` → `gate.students_using_twice` (users with ≥2 self-reported or shop-confirmed uses
  in 30 days, target 30) and `gate.shops_would_pay` (merchant-form leads choosing paid featured
  placement or an exclusive deal, target 5).
- Supporting numbers: weekly/monthly active and returning users, deal views, passes opened, refusals
  (a data-quality signal: the listed deal may be wrong), top deals.
- Shops sign up at `/merchants`; leads export at `/admin/merchants.csv`.

Read "students using twice" with tier 2 in mind: until shops scan, most of those uses are
self-reported.

## Decisions for the founders

1. **Positioning:** keep CampusPass as a free index (true to the data) and treat revenue as a
   months 7–12 experiment with exclusive deals, as the plan already says.
2. **First exclusive-deal pilot:** pick 3–5 shops near 公館 that would make the code a condition of
   a small extra perk, and pair their phones. This is the first point where verified redemptions,
   and anything billable, can exist.
3. **Employee benefits:** worth a separate market scan before any build; the data model is ready.
4. **Legal:** a lawyer's read of the NTU-name wording and the privacy notice before public launch.
