# STUST 南臺科技大學 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `stust.json` comes from the 8 Google Sites category pages, fetched with curl on 2026-10-24. The site is linked from https://alumni.stust.edu.tw/tc/node/alumnicard.

## Extraction summary (`stust.json`, 110 records)

| Category page | URL fetched | Listed | Kept | Expired | Other skips |
|---|---|---|---|---|---|
| 食 | https://sites.google.com/stust.edu.tw/appointed-store/食 | **38** | 32 | 5 | 1 duplicate |
| 衣 | …/appointed-store/衣 | **10** | 8 | 2 | 0 |
| 住 | …/appointed-store/住 | **30** | 29 | 1 | 0 |
| 行 | …/appointed-store/行 | **3** | 3 | 0 | 0 |
| 育 | …/appointed-store/育 | **3** | 3 | 0 | 0 |
| 樂 | …/appointed-store/樂 | **14** | 14 | 0 | 0 |
| 醫 | …/appointed-store/醫 | **12** | 12 | 0 | 0 |
| 其他 | …/appointed-store/其他 | **9** | 9 | 0 | 0 |
| **Total** | | **119** | **110** | **8** | **1** |

This settles the survey's open question: the site lists 119 entries, not about 82.

**Format.** The static HTML of each Google Sites page carries the full text, so no JavaScript was needed.
- Each entry is a layout column with a name and labelled lines: 電話 / 地址 (or 分店資訊 / 分館資訊 / 會館資訊 / 分院資訊) / 折扣內容 / 注意事項 / 優惠對象 / 截止日期 / 網址.
- An entry is one Sites column whose text contains exactly one 「優惠對象」. 119 columns were found, which matches the 119 「優惠對象」 and 119 「截止日期」 labels on the pages.
- Attachments are Google Drive links on the 「請見附件」 text.

**Last-updated signal.** No page date. The 截止日期 values run from 114/12/31 to 117/03/17, and the newest Google Maps links carry 2025-12 timestamps.

**Skips:**
- **Expired (8):**
  - subway 台南開元店 115/06/30
  - 燒肉眾 台南永康 115/03/03
  - 鮮自然 郡安 115/06/11
  - Bite 2 Eat 薄多義 115/04/30
  - 伊甸風味館 114/12/31
  - 樂活眼鏡 114/12/31
  - 朵法婭 115/02/01
  - 浯島文旅 115/03/19
- **Duplicate (1):** 台南大飯店 is listed on both 食 and 住 with identical text and the same Drive attachment. It is kept once, as lodging.

**Counts:**
- Categories: food 32, lodging 29, health 16, shopping 15, services 10, entertainment 5, transport 2, education 1.
- Regions:
  - 87 south-only (Tainan/Kaohsiung/Pingtung), 5 north-only, 1 central-only and 1 east-only (娜路彎).
  - 8 nationwide: foodpanda, 愛菲斯, 米蘭髮型, 直航租車, 英倫牙醫, Q哥3C, 傑昇通信 and 晁瑩 (百貨專櫃).
  - 7 multi-region, from their branch lists: Magi Planet, 小吳傢俱, 旅居文旅, 塔木德, 富驛, 新驛 and 航典.
  - 1 outlying island: 醉酒香陳窖 (金門), with `regions: []`.
- Eligibility: **58 student**, 110 staff, 53 alumni, 2 family. 49 records are 教職員-only (`student: false`). 51 records also name 「之友」.

## Field mapping and judgement calls

- **Eligibility** comes from 優惠對象:
  - 學生 → `student`, 教職員 → `staff`, 校友 → `alumni`.
  - 「(及眷屬)」 / 「及其家屬」 → `family`; this applies to 遠東牙醫 and 英倫牙醫.
  - 「之友」 is not a field. It is mentioned in `notes` (「優惠對象另含「之友」」).
  - The values found were: 學生/教職員/校友/之友, 學生/教職員/校友, 學生/教職員, 教職員/校友/之友, 教職員/校友, 教職員(及眷屬)/校友(及眷屬)/之友, 學生/教職員/校友/之友 及其家屬, and 教職員.
- **End dates:**
  - 「永久有效」 → `null`.
  - 「自動展延，永久有效」 → `null` with `auto_renew: true` (4 records: foodpanda, 醉酒香, 劍橋, 璟馨/詠馨).
  - ROC dates such as 「115年12月31日止」 → 2026-12-31.
  - The original 截止日期 text is kept in `notes` and `info`.
- **Attachment-only entries (73 kept).** Their 折扣內容 is only 「請見附件」 / 「附件」, or a list of Drive-link labels such as 福爾摩沙 「遊艇酒店、花園酒店」.
  - They are kept with highlight 「專屬優惠價」 (lodging) or 「特約優惠」, every Drive file in `links`, and the note 「優惠內容在 Google Drive 附件，未轉錄」.
  - **The Drive files were not downloaded or read**, so no terms were taken from them. There are 80+ files; transcribing them would be a separate task.
  - 24 of the 73 are student-eligible.
  - Entries that state terms in the page text and *also* link an attachment were transcribed from the page text: 日拓商行 and 愛菲斯.
- **Regions:**
  - From the 地址 line and any branch lines (分店/分館/會館/分院資訊).
  - Nationwide: online sellers and chains whose page gives 全台 / 官網查詢 / 各百貨 or no city.
  - 金門 → [].
  - BENEFIT健康餐盒 has no address, so it gets the campus city (south), with a note.
- **Category:**
  - 食 → food. 衣 → shopping, except the laundry and hair salon → services. 住 → lodging. 行 → transport, except the car wash → services. 育 → education, except the two computer-repair shops → services.
  - 樂 → entertainment, except: the two department stores → shopping; massage → services; gyms → health.
  - 醫 → health. 其他 → shopping, except the photo studio and the beauty salon → services.
- **Names:** a trailing 「（…）」 goes to `subtitle` (e.g. 日十。早午餐 / 台南中華店). 桂田酒店 has separate 食 and 住 entries with different attachments, so they are kept as 桂田酒店 / 餐飲 and 桂田酒店 / 住宿.
- **Links:**
  - The Drive attachments (labelled 「附件」 or 「附件：<link text>」) and the 網址/官網 links are kept.
  - Google Maps and Bing Maps pin links are left out.
  - Branch lists are copied into `info`, and `address` is set only for a single-address entry.

## Validation

- JSON parses: 110 records, all with the `ncu.json` key set and valid categories.
- No `expires_on` is before 2026-10-24, and there are no duplicate (name, subtitle) pairs.
- `python3 scripts/import_deals.py` in a throwaway copy imported all 110 STUST records with 0 skips.

## Transcription (2026-10-24, issue #28)

The 73 records held with 「未轉錄」 were transcribed from their Google Drive attachments. All 76 unique files were fetched with `curl` (`drive.google.com/uc?export=download&id=…`); every one is listed with its sha256 in `data/evidence/stust/MANIFEST.md`.
- Format: 63 scanned PDFs (rendered at 100 dpi and read visually), 9 PDFs with a text layer and 3 JPEGs.
- 1 file returned HTTP 404: 南紡購物中心's second attachment, 「3月」. Its main attachment was read.

**Results:**
- **Transcribed: 64.** Each record now has the concrete terms in `offer` (discounts, room rates, conditions, exclusions, booking method) and a matching `highlight`, such as 9折 or 住宿$2,650+10%起.
  - `notes` now starts with 「條款取自附件（Google Drive，2026-10-24 讀取）」, followed by the attachment's own period and eligible groups and any difference from the page.
- **Still held: 9.** These keep 「未轉錄」, with the reason added to `notes`:
  - **4 attachments state no concrete terms.**
    - 塔木德酒店集團: book via the 「特約會員專區」, no rates.
    - 貳鍋三 and 賓士KTV: group contracts that say 「優惠內容以官網公布」.
    - 直航租車: conditions only; prices 「以直航租車官網公告特約廠商專案為準」.
  - **5 attachments are expired contracts that do not renew automatically,** while the page gives a later 截止日期. The current terms cannot be confirmed from the file, so they were not taken.
    - 新驛旅店, 丹迪旅店 and 喜瑞飯店 (one Taipei Inn contract, 2024-10-29 to 2025-12-31).
    - 168inn旅館集團 (114/01/01–114/12/29, 「本合約無自動續約」).
    - 宅 夏都 (2025 rate sheet).
- **Expired and dropped: 0.**

**Eligibility changes (6).** Where the attachment names fewer groups than the page, the attachment wins:
- **和牛涮 台南中華西店 and 航典國際旅行社:** the page lists 學生/教職員/校友/之友, but the contracts cover only 員工 and their family. They are now staff + family, with `student: false` and `alumni: false`.
- **義大遊樂世界, 王品聚鍋, 品田牧場 and 璟馨/詠馨:** these were already staff-only. The contracts include 眷屬 (or 眷屬或親朋 / 配偶), so `family` is now true.

Student-eligible records: 58 → 56.

**Dates:**
- **No `expires_on` changed.** Where the file states no end date, the page's is kept.
- **Auto-renewing contracts kept with the page's date.** Some contracts printed an end date that has passed but say they renew automatically (自動續約/自動展延/視同續約), for example 劍橋 (2016, handwritten 「自動展延」), IF Motel, HUB HOTEL, foodpanda, 同和農科, 醉酒香 and Q哥3C. Those keep the page's 截止日期, with the note 「附件期限…已過但載明自動續約，期限沿用頁面」.
- **`auto_renew`** is now true on 22 records, up from 4.

**Transcription notes:**
- **Handwritten terms:** 一家攝影 (a crossed-out word after 九折優待 is left out) and VK銀櫃.
- **Partly obscured:** a stamp covers parts of 同和農科 clauses 3, 4 and 6; only the legible parts were taken.
- **Closed branches excluded:** 劍橋's file marks 3 of its 5 hotels 已停業, so only 台南館 and 永康館 rates are given. 168inn's 平鎮館 closed on 114/3/3.
- **Branch-specific deals:** 牛角燒肉 (台南愛買店 only) and 橫濱牛排 (台南三井 only), noted.
- **Address differences between page and file are noted but not changed:** 58筋讚, 心動力, 倍力 and 沐荳.
- **Spot check:** 台南老爺行旅 and 一家攝影 were checked against the scans by a second reader.
