-- City + district from the merchant's address (e.g. 臺北市大安區), public so students can search by place.
ALTER TABLE deals ADD COLUMN area TEXT NOT NULL DEFAULT '';
