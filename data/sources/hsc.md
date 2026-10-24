# HSC 新生醫護管理專科學校 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `hsc.json` comes from the page below, fetched with curl on 2026-10-24.

## Extraction summary (`hsc.json`, 12 records)

| Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|
| 「特約廠商一覽表」 on the main school site (school; the page names no unit, so `source_org` is 「新生醫護管理專科學校」) | https://www.hsc.edu.tw/p/404-1000-35585.php?Lang=zh-tw | One HTML table: 特約廠商 / 地址及電話 / 優惠內容 / 期限. No attachments. | **13** | **12** | 1 | 0 | No page date. Every remaining 期限 is 「無期限」 |

**Skip (1, expired):** 小樹苗診所 (中壢). 「掛號時本人出示學生證，掛號費折價50元」 had 期限 112.12.31.

**Counts:**
- Categories: food 6, health 3, lodging 1, shopping 1, services 1.
- Regions: 10 north-only (桃園/新竹/新北); 1 north + central (鑫聚成, which has 中壢 and 苗栗/竹南 clinics); 1 nationwide (福利購, a LINE@ group-buy channel).
- Eligibility: **12 student**, 12 staff.

## Field mapping and judgement calls

- **Eligibility.** Only 醇品咖啡 (「持學生證或員工識別證」) and 明漾眼鏡 (「學生:6折、老師:5折」) name the groups; both → student + staff. The other 10 rows name nobody. The page is the school's own list on its main site, and the skipped row was a 學生證 deal, so those rows are marked student + staff with the note 「條款未寫明適用對象；學校特約廠商一覽表，依頁面歸為學生及教職員工」.
- **End dates.** 「無期限」 → `null`. The original 期限 is kept in `notes`.
- **西堤龍潭店** says only 「詳見店內特優訊息」. It is kept as 特約優惠, with a note that the terms are not listed.
- **Typo.** 美的適藥: 「特價商品怒不再打折」 is corrected to 「恕不再打折」, with a note.
- **Names.** 福利購(和達健生技事業)-哈根達斯冰淇淋特殊通路代理商 → name 福利購, subtitle 和達健生技事業-哈根達斯冰淇淋特殊通路代理商.
- **Multi-clinic rows** (當代牙科, 鑫聚成) leave `address` empty and keep the clinic list in `info`. `phone` is the first number listed.

## Validation

- JSON parses: 12 records, with the `ncu.json` key set and valid categories.
- No past `expires_on`, and no duplicates.
- `python3 scripts/import_deals.py` in a throwaway copy imported all 12 records with 0 skips.
