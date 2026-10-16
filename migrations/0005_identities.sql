-- One account can hold several school identities ("CampusPass cards"), each verified on its own:
-- the email domain proves the school; the role is declared by the user. Cards expire and are
-- re-verified (expires_at); re-verifying the same school email updates the row.
CREATE TABLE user_identities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school      TEXT NOT NULL,             -- school code, e.g. NTU
  role        TEXT NOT NULL DEFAULT 'student', -- student | staff | alumni (self-declared)
  email       TEXT NOT NULL,             -- the school address that was verified
  email_domain TEXT NOT NULL,
  method      TEXT NOT NULL,             -- google | dev (test login) | email_code (future)
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  UNIQUE (user_id, school, email)
);
CREATE INDEX user_identities_user ON user_identities(user_id);
