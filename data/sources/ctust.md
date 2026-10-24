# CTUST 中臺科技大學 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `ctust.json` comes from the page below, fetched with curl on 2026-10-24. Its linked PDFs were also fetched and read.

## Extraction summary (`ctust.json`, 49 records)

| Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|
| 人力資源處 「特約商店」 (school) | https://personnel.ctust.edu.tw/p/412-1026-1671.php?Lang=zh-tw | Server-rendered HTML. Two tables under the headings 「1.餐廳、日常用品」 (45 rows) and 「2.旅館飯店」 (6 rows), with columns 特約商店 / 地址 / 電話 / 優惠內容. 8 rows link a PDF. Heading 「3.醫療院所」 has no table; it links to the 衛保組 page (see below). | **51 rows** | **49** | 2 | 0 | No page date. The newest attachment is from 2025-08 (Uber). One row says 「至115/12/31」 |

**Skips (2, both expired):**
- **兄弟大飯店.** The row offers the 「2020精英住房超值專案」, and its PDF says 「特約優惠適用期限：自 2020 年 1 月 1 日 至 2020 年 12 月 31 日止」.
- **Uber Eats 企業優惠專案** (教職員工). The row says only 「加入後即可享有獨家的優惠 詳見Uber 企業版公告」, and every code in that PDF (2025-08) had to be entered by 2025-12-31.

**Not extracted: 3.醫療院所.** It points to https://stuaff.ctust.edu.tw/p/412-1022-2262.php (衛保組 「特約醫院與診所」 → post 「115年合約醫院與診所」). That is a different office's page and not the source this issue names, so it could be a follow-up issue.

**Counts:**
- Categories: food 31, shopping 8, lodging 5, services 2, transport 1, health 1, entertainment 1.
- Regions: 41 central-only, 1 north-only (堅果樂園 桃園), 5 nationwide (樂活眼鏡, 寶島眼鏡, 中華航空, 朵法婭, foodpanda), and 2 multi-region (水舞 north + central; 旅居文旅 north + south).
- Eligibility: **42 student**, 49 staff, 40 alumni. 7 records are staff-only: 和牛涮, 歐客佬, 深紅汕頭, 汎德BMW, 茶自點, 阿官, 堅果樂園.

## Field mapping and judgement calls

- **Eligibility** comes from the start of each 優惠內容:
  - 「優惠對象：教職員工、校友、學生」, 「優惠身份：本校教職員、學生、校友」 or 「教職員工、校友及學生出示服務證(學生證)」 → student, staff and alumni.
  - 「教職員工及學生」 (大魯閣) and 「教職員工生」 (中華航空) → student and staff.
  - 「教職員工…」 alone → staff only.
  - Rows that name nobody but say 「出示服務證」 (茶自點, 堅果樂園) or ask for 「名片、服務證、在職證明」 (汎德) → staff only, since 服務證 is the staff card. 阿官國際餐飲 names nobody at all and is also staff only. All four carry a note.
  - 飛躍運動用品 is open to all three groups, but its third item (勝利 6折) is 教職員-only; that is noted.
- **End dates:**
  - 向陽房專業烘焙 → 2026-12-31, from 「(註：至115/12/31年度消費達需3萬才可續約…)」.
  - Every other row has no date, so `expires_on: null` with the note 「頁面未標示期限」.
- **Expired sub-promotions removed:** foodpanda's 「註：112年11月 限時限量優惠：企業帳號訂閱pro 半年享7折」.
- **Lodging attachments** (scans listed in `data/evidence/ctust/MANIFEST.md`):
  - 水舞系列: the offer is 「優惠內容請參閱附件」. The 2020 agreement says 「特約商永久有效，惟商務價格有變動時會發mail通知，訂房依現場公告商務價為準」. Kept as 專屬優惠價; the 2020 room prices are not transcribed.
  - 旅居文旅: the attachment is a 2020-12 price sheet with no end date. Kept as 專屬優惠價, with a note that prices may have changed.
  - 台中清新溫泉: the dining 9折 and meeting 8折 come from the table. The room attachment is a contract that ended 2020-12-31, so no room rate is kept, and the note says so.
  - 貓頭鷹旅店: 平日9折/假日95折 is in the table itself; the attachment is a 2020 proposal.
- **Regions:**
  - From the address (台中/彰化/南投 → central, 桃園 → north).
  - Multi-branch rows use every city listed. 水舞: 台中, 台北 → north + central. 旅居: 台北/土城/中壢/高雄 → north + south.
  - Online, app and 全省 rows → all four.
- **Category:**
  - 1.餐廳、日常用品 → food, except opticians, clothing, sports goods, garden and nuts → shopping; printing and BMW service → services; the pharmacy → health; the skating rink → entertainment; the airline → transport.
  - 2.旅館飯店 → lodging.
- **Address and phone:** only the first number of a multi-branch cell goes in `phone`. The full cell is copied to `info`. Multi-branch rows leave `address` empty, and the branches are in `info`.
- **Links:** website links in the row, plus every linked PDF with an absolute URL (樂活 VIP page, 金成記 附件, foodpanda form and PDF, 水舞/清新/旅居/貓頭鷹 附件, 華航, 朵法婭).

## Validation

- JSON parses: 49 records, all with the `ncu.json` key set and valid categories.
- No past `expires_on`, and there are no duplicate (name, subtitle) pairs.
- `python3 scripts/import_deals.py` in a throwaway copy imported all 49 CTUST records with 0 skips.
