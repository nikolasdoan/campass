-- Which shop link confirmed a pass, so each shop sees its own count even when two
-- shops honour the same deal (e.g. a chain's branches).
ALTER TABLE redemptions ADD COLUMN confirmed_key TEXT; -- merchant_keys.key_hash
