-- Test fixture for /admin/leads (tests/api.mjs). Fictional businesses and BANs only; the real
-- data is loaded by a private script and never committed. Re-runnable.
INSERT OR REPLACE INTO partner_leads (ban, campus, category, name, address, industry, org_type, founded, distance_m, source_date, last_seen) VALUES
  ('00000001', 'NTU', 'food', '測試餐飲股份有限公司公館分公司', '臺北市中正區汀州路三段1號', '561101 餐館', '股份有限公司', '2020-01-01', 210, '2026-10-23', '2026-10-23'),
  ('00000002', 'NTU', 'cafe', '測試咖啡有限公司', '臺北市大安區羅斯福路四段2號', '562111 咖啡館', '有限公司', '2019-05-01', 480, '2026-10-23', '2026-10-23'),
  ('00000003', 'NTNU', 'books', '測試書局有限公司', '臺北市大安區師大路3號', '476111 書籍零售', '有限公司', '2015-03-01', 150, '2026-10-23', '2026-10-23');
INSERT OR REPLACE INTO partner_lead_counts (campus, category, org_group, n, source_date) VALUES
  ('NTU', 'food', 'sole_or_partnership', 42, '2026-10-23'),
  ('NTU', 'cafe', 'sole_or_partnership', 17, '2026-10-23');
DELETE FROM partner_lead_status WHERE ban IN ('00000001', '00000002', '00000003');
