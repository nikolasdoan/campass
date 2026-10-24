-- Anonymous usage counts (founder decision 2026-10-24, Elian's meeting notes): what students search
-- for, which searches find nothing, which filters and deals they use. Daily totals only: no user id,
-- no IP, no cookie, so a row never says who did something. Kept 400 days (cleanup in src/index.ts).
CREATE TABLE event_counts (
  day  TEXT NOT NULL,    -- YYYY-MM-DD, Asia/Taipei
  kind TEXT NOT NULL,    -- search | search_zero | filter | open
  key  TEXT NOT NULL,    -- normalised search text, "cat:food", or a deal id
  n    INTEGER NOT NULL, -- how many times that day
  PRIMARY KEY (day, kind, key)
);
