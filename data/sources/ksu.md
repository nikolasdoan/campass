# KSU 崑山科技大學 partner-discount source (verified 2026-10-15)

> **Status: extracted.** Every record in `ksu.json` comes from the page and the per-store JSON
> that were fetched with curl on 2026-10-15. Nothing comes from search results or memory.

## Extraction summary (`ksu.json`, 112 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| KSU 崑山科大 | 崑山科技大學 特約商店 app (school) | https://bir.ksu.edu.tw/cr/public/application/ksulife/store, then one XHR per store: `https://bir.ksu.edu.tw/cr/public/application/ksulife/ajax?id=<合約ID>&action=StoreGetFirmData` | One server-rendered HTML page with **124** store cards (class tag, 證別 tags, name, address and a shortened offer). Each 「more…」 calls `Store_FirmData(id)`, which GETs the JSON endpoint above. The JSON has 廠商名稱, 地址, 電話, 合約起始日期, 合約終止日期, 類別ID, 優惠內容 (HTML), 優惠內容圖片, plus `dataR` (期間優惠 = time-limited promotions) | 124 | **112** | 0 | 10 with no usable terms (see below); 2 duplicate contracts merged | No page-level date. Per-store 合約起始/終止日期. The newest contract starts **2026-10-01** (咖樂V, id 279). The newest live 期間優惠 was added 2026-03-19 |

**(corrected)** The survey in `other-schools.md` said "131 「more…」 entries". Today's page has **124** cards and 124
unique `Store_FirmData(id)` ids (ids 2–279, with gaps). The page loads all of them at once: there is no
pagination, and the filters (類別, 證別, keyword) run client-side. All 124 detail calls returned `status: 0`.

Skips:

| Reason | Count | Store ids (合約ID) |
|---|---|---|
| Expired (合約終止日期 before 2026-10-15) | 0 | none. The page seems to show only live contracts; the earliest end date is 2026-11-22 |
| Terms only in an image/PDF attachment (優惠內容 says 詳見優惠內容圖片 or similar) | 7 | 93 泰安湯悅溫泉會館, 94 台灣油力特, 138 文雄眼鏡, 147 茉儷曼美妝企業, 155 帕莎蒂娜國際餐飲, 208 台新銀行 (限薪轉教職員; both 期間優惠 expired in 2022/2023), 269 台南老爺行旅 |
| No offer text at all (優惠內容 is `-`) | 2 | 257 夏都富朗酒店(Cama cafe台南夏都店), 261 里亞行旅 (only an image) |
| Headings only (「1.住宿優惠 2.餐飲資訊 ~~詳情請查閱優惠內容圖片~~」) and no image attached | 1 | 270 禧榕軒大飯店 |
| Duplicate contract, merged into one record | 2 | 259 → 260 航典國際旅行社 (same address and terms); 277 → 275 西谷子 (277's text equals 275's live 期間優惠) |

Records by region:

| Region | Single-region records | Including multi-region records |
|---|---|---|
| south | 103 | 110 |
| central | 2 | 9 |
| north | 0 | 5 |
| east | 0 | 5 |

5 records cover all four regions (online or nationwide). 2 cover central+south. No record has empty regions.
86 records are student-eligible. 91 are staff-eligible, 90 alumni-eligible, and 2 also cover family.
20 records are alumni-only (校友證 tag only), and 5 are staff-only.
Categories: food 60, shopping 16, health 13, services 12, entertainment 5, lodging 5, transport 1.

### Field mapping and judgement calls

- **Eligibility** comes from each card's 證別 tags: 學生證 → student, 教職員工證 → staff, 校友證 → alumni.
  `family` is true only when the offer text names 眷屬 (航典: 會員包含員工及其眷屬) or 家屬 (白巷子: 老師/學生/家屬).
  When the text and the tags disagree, the tags are kept and the text is quoted in `notes`. Examples: 吉也春 (text 「憑學生證」, tags 學生+教職員) and 阿明食堂 (text 「凡來店之校友」).
  For merged records, the tags of both contracts are combined.
- **Expiry.** 合約終止日期 values of 2099-12-31, 2100-12-31, 2110-01-01 and 9999-01-01 are system placeholders, so they map to `expires_on: null`.
  `notes` keeps the start date and the raw placeholder. Real end dates are kept as given: 20 records, from 2026-11-22 to 2060-03-15.
  No text says 自動續約, so `auto_renew` is false everywhere. 航典's contract says 「合約期滿後，甲乙雙方對合約書內容無異議時，得視同續約」, which is noted but not treated as auto-renew.
- **Expired sub-promotions removed.** The 期間優惠 (`dataR`) of 佳仕奇 (2019), 伍洋 (2021), 文雄 (2019–2020) and 台新 (2022–2023) are expired and were dropped.
  The Gogoro block in 昕叡創能 (即日起至2025/12/23) was removed. 中華航空's pre-107/12/31 card number was removed.
  The only live 期間優惠 (西谷子, 2026-03-01～2027-03-01) is included.
- **Credentials.** The 中華航空 entry publishes a corporate-booking account and password. These were left out of `offer` and replaced with 「帳號、密碼請見原頁面」.
  The JSON also exposes 代表人/聯絡人 names and a 合約紙本掃描 file name. These were not used.
- **Category** maps from the site's class (類別ID):
  - 風味美食 → food; 購物生活 → shopping; 健康醫療 → health; 飯店住房 → lodging; 體能運動 → entertainment (gyms and sports venues, as in `other-schools.json`); 銀行金融 and 3C數位 → services; 交通旅遊 → transport.
  - Overrides, following the `other-schools.json` convention:
    - vehicle repair (鑫峰車業行, 仁翔, 新天地動力, 瑞特, 瑞達, 佳新鈴木) → services
    - travel agencies (大億, 航典) → services
    - 昕叡創能 scooter purchase → shopping
    - 菜籃子果昔 and 白巷子 (drinks listed under 購物生活) → food
    - 歐克影印店 → services
- **Regions** come from the address city.
  - 永康區大灣路366號 (白巷子) and 中壢區領航南路… (西谷子) have no city, so the subtitle uses the district's only city (台南市, 桃園市) and this is noted.
  - All four regions: 中華航空 (online booking), 星球工坊 (全台門市), 創宇數位 (全國各門市 + online), 航典 (online booking), 西谷子 (hidden online shop).
  - 瑞特 and 佳新鈴木 list repair sites in 雲林/嘉義/台南, so they are central+south. 瑞達 (斗南/斗六) is central.
- **Subtitle** is 「city + district」 from the address. It is just the city when the address has no district, for example 台南市華平路152號. It is 全國各門市 for 創宇.
- **Highlight** is the best 折 rate in the text (Chinese numerals converted: 九五折 → 95折), with 「起」 when several rates appear.
  Otherwise it is 折$N, 免服務費, 專屬優惠價 (會員價/合約價/hotel contract rates), 掛號費優惠 or 消費贈品.
  Hand-set examples: 韋樂 「網路訂價60%」 → 6折起; 佳仕奇 → 5折起 (5折 member price, plus a 3.9折 promotion twice a year); 航典 → 折$1000; 昕叡 → 折$1500; 中華航空 → 企業會員.
- **Offer text.** `<br>` is turned into newlines. Wrapped half-lines (indented continuations) are joined. Long space runs are split into lines.
  Three long texts were condensed to their terms: 航典's full contract, 白巷子's proposal letter and 西谷子's pitch letter. 煙波's text was retyped where the source had OCR-like typos (服務賣, 免蕢 and similar).
- **Links:** URLs given in the offer text (華航 corporate booking, 大億, 星球工坊 bit.ly, 創宇, 航典, 西谷子). For the 3 kept stores that also have one, the 優惠內容圖片 attachment is linked as `https://bir.ksu.edu.tw/cr/public/upload/firm/offer/<id>/<file>` (each returned 200).
- **source_url** is the per-store JSON endpoint, the exact URL fetched that holds the record.
  **source_org** is 「崑山科技大學 特約商店」 (page title 「崑山科技大學 - 特約商店」; the footer says 崑山科技大學電子計算機中心 © 版權所有).
- **Deduplication:** two pairs of contracts were merged (see the skips table). XM麻辣鍋 (湖美店 contract, which also lists 永康店) and 呈康火鍋店（XM麻辣鍋） (永康店's own contract, staff-only, ends 2026-12-31) stay as two records with different subtitles, and this is noted. The 東悅坊 group's restaurants (ids 103–110) share one phone number but are separate stores.

## Caveats

- 92 of the 112 records have placeholder end dates (2099 and later), so `expires_on` is null for them. Many contracts date from 2009–2012 and may no longer be honoured, so confirm with the store first.
- Some 優惠內容 texts were cut off at the source, apparently by a length limit: 晶盈親旅 ends at 「不適用於農曆春」 and 白巷子's fan-page URL is cut. They are kept as published and noted.
- 瑞達汽車's text names 乙方 as 「瑞特汽車有限公司」, an error in the source copy.
- The 10 skipped attachment-only or empty stores (mostly hotels: 泰安湯悅, 老爺行旅, 禧榕軒, 里亞行旅, Cama cafe) could be added by reading their images at `/cr/public/upload/firm/offer/<id>/<file>`. Those images were not transcribed.
- 20 alumni-only stores (mostly ids 119–134 and 168–176) are tagged only 校友證, so they are not student-eligible in CampusPass.

## Monitoring

- The store ids rise with each new contract (highest today: **279**). Re-fetch the page and watch for ids above 279.
  Then call `ajax?id=<id>&action=StoreGetFirmData` for each new or changed id.
- 8 contracts end on 2026-12-31 (航典, 晶盈, 悠躍, 昕叡, 創宇, 煙波, 呈康, 咖樂V), and Holiday&art ends on 2026-11-22. Re-check in January 2027.
