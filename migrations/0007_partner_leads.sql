-- Partner leads (founder decision 2026-10-24): shops near each campus that are not CampusPass
-- partners yet, for the team to approach. Admin-only; never shown in the app or a public API.
--
-- Source: 財政部 全國營業(稅籍)登記資料集 (data.gov.tw/dataset/9400, 政府資料開放授權條款), loaded
-- by a private script that is kept out of this public repo; this file is only the schema.
-- 獨資 and 合夥 are natural persons: they are never stored by name, only counted
-- (partner_lead_counts). Companies and their branches are listed by name.

CREATE TABLE partner_leads (
  ban          TEXT PRIMARY KEY,       -- 統一編號 of the business (a branch has its own)
  campus       TEXT NOT NULL,          -- school code the shop is near, e.g. NTU
  category     TEXT NOT NULL,          -- food | cafe | retail | books | fitness | beauty | fun | services
  name         TEXT NOT NULL,          -- 營業人名稱 as registered
  address      TEXT NOT NULL,
  industry     TEXT NOT NULL DEFAULT '', -- 行業代號 + 名稱, e.g. "561101 餐館"
  org_type     TEXT NOT NULL DEFAULT '', -- 股份有限公司, 有限公司, ... (never 獨資/合夥)
  founded      TEXT NOT NULL DEFAULT '', -- YYYY-MM-DD
  distance_m   INTEGER,                -- straight-line metres from the campus anchor
  source_date  TEXT NOT NULL,          -- the registry file's date
  last_seen    TEXT NOT NULL           -- last load that still listed it
);
CREATE INDEX partner_leads_campus ON partner_leads(campus, category);

-- The team's own notes survive every reload: kept apart from the registry rows.
CREATE TABLE partner_lead_status (
  ban        TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'new', -- new | contacted | interested | partner | not_interested | do_not_contact
  note       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sole proprietors and partnerships near each campus: counts only, never names.
CREATE TABLE partner_lead_counts (
  campus      TEXT NOT NULL,
  category    TEXT NOT NULL,
  org_group   TEXT NOT NULL,             -- sole_or_partnership
  n           INTEGER NOT NULL,
  source_date TEXT NOT NULL,
  PRIMARY KEY (campus, category, org_group)
);
