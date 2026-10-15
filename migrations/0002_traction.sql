-- Traction signals for the go/no-go gate (docs/business-review.md):
--   "30 students use it twice in a month and five shops say they'd pay".

-- One row per signed-in user per active day (Asia/Taipei), for weekly/monthly
-- active and repeat-use counts.
CREATE TABLE visits (
  user_id INTEGER NOT NULL,
  day     TEXT NOT NULL, -- YYYY-MM-DD, Asia/Taipei
  PRIMARY KEY (user_id, day)
);

-- A student opened the in-store pass for a deal. This is evidence, not proof:
-- existing deals are redeemed by showing a student card, so CampusPass is not in
-- the transaction. confirmed_by_merchant is only possible when a shop checks the code.
CREATE TABLE redemptions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,  -- short one-time code shown on the pass
  user_id       INTEGER NOT NULL,
  deal_id       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  outcome       TEXT,                  -- NULL | used | refused | not_used (student's answer)
  outcome_at    TEXT,
  confirmed_at  TEXT,                  -- set when the merchant confirms the code
  confirmed_via TEXT                   -- merchant (shop page or paired phone)
);
CREATE INDEX redemptions_deal ON redemptions(deal_id);
CREATE INDEX redemptions_user ON redemptions(user_id);

-- Shops that want to be listed or would pay for featured placement.
CREATE TABLE merchant_leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_name    TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  area         TEXT NOT NULL DEFAULT '', -- e.g. 公館, 師大, 台中
  offer        TEXT NOT NULL DEFAULT '', -- discount they offer or would offer students
  interest     TEXT NOT NULL DEFAULT '', -- list_free | featured_paid | exclusive_deal | unsure
  budget       TEXT NOT NULL DEFAULT '', -- monthly budget they mention, free text
  message      TEXT NOT NULL DEFAULT '',
  user_id      INTEGER,                  -- if submitted while signed in
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A private confirmation link for one shop (and the deal(s) it honours). The cashier
-- opens /m/<key> and types the code from a student's pass; only these confirmations
-- count as verified redemptions. Keys are stored hashed.
CREATE TABLE merchant_keys (
  key_hash   TEXT PRIMARY KEY,
  label      TEXT NOT NULL,          -- shop name shown on the confirm page
  deal_ids   TEXT NOT NULL,          -- comma list of deal ids this shop may confirm
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);
