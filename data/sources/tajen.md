# TAJEN 大仁科技大學 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `tajen.json` comes from the page below and its two linked files, fetched with curl on 2026-10-24.

## Extraction summary (`tajen.json`, 12 records)

| Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|
| 總務處 › 學校特約商店 (school) | https://a06.tajen.edu.tw/p/404-1006-94061.php?Lang=zh-tw | HTML table: 特約商店 / 優惠措施 / 電話及地址 / 特約期間 / 備註. One 優惠措施 cell is an image (原道). One row links a scanned hotel contract PDF (娜路彎). | **12** | **12** | 0 | 0 | No page date. The newest 特約期間 is 115/9/9~117/12/31 (曾競峰診所) |

The page intro says: 「為提供本校教職員工及學生更多元服務消費優惠福利，本校與校外合法登記商店簽訂折扣特約…」.

**Counts:**
- Categories: food 3, health 3, services 2, shopping 2, lodging 1, entertainment 1.
- Regions: 9 south-only (屏東/高雄); 1 east (娜路彎, 台東); 2 nationwide (朵法婭 online, APHROES online shop).
- Eligibility: **11 student**, 12 staff, 3 alumni (朵法婭, 娜路彎, APHROES). 1 record is staff-only (原道).

## Field mapping and judgement calls

- **Eligibility:**
  - 備註 「請主動出示教職員證或學生證」 → student + staff.
  - 「優惠對象：教職員工、校友、學生」 and 「教職員工生、校友」 → student, staff and alumni.
  - **原道日式燒肉** → **staff only**. Its 優惠措施 cell is an image addressed 「致【大仁科技大學】全體同仁」 with 「A: 持員工證件享現金95折」. That is narrower than the row's 備註, and the note explains it.
- **The 原道 image was read and transcribed** (offers A–D: 現金95折; 團體聚餐 611/599元; 包場; 特約停車場). It is listed in `data/evidence/tajen/MANIFEST.md`.
- **娜路彎 hotel PDF** (scanned, 4 pp; added to `links`):
  - Page 1 is the 優惠房價合約書, period 115/01/01–115/12/31.
  - Its 娜路彎大酒店 rates are transcribed into `offer`: 豪華客房 平日4,050–旺假日6,550; 豪華四人房 5,250–7,750; breakfast included; not valid at 農曆春節.
  - Pages 2–4 (the other properties) were not read; `notes` says so.
  - The row's phone/address is the 中南區業務處 in 高雄. The hotel is in 台東, so `regions` is east and `address` is empty.
- **End dates:** the last date in 特約期間; 「~永久」 → `null`. Nothing has ended.
- **Category:** 紅館/好食宅/原道 → food; clinics → health; 機車行 → services; 朵法婭/APHROES → shopping; 航典旅行社 → entertainment; 娜路彎 → lodging.

## Validation

- JSON parses: 12 records, with the `ncu.json` key set and valid categories.
- No past `expires_on`, and no duplicates.
- `python3 scripts/import_deals.py` in a throwaway copy imported all 12 records with 0 skips.
