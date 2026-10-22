# NTNU 師大 校友中心 特約優惠 source (verified 2026-10-22)

> **Status: extracted.** Every record in `ntnu.json` comes from pages fetched with curl on 2026-10-22.

## Extraction summary (`ntnu.json`, 59 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| NTNU 師大 | 國立臺灣師範大學校友中心 「特約優惠」 (school) | Index https://alumni.ntnu.edu.tw/Welfare?itemid=14&mid=16 (page 1, GET). Pages 2–4 are a form POST to `/Welfare` with `mid=16&itemid=14&nowpage=N`. Each 類別 filter (`group` = 16 美食, 17 住宿, 18 旅遊, 46 生活, 102 國立台灣大學系統) was also POSTed to cross-check. All 60 detail pages `https://alumni.ntnu.edu.tw/Welfare/MessageView?itemid=<id>&mid=16` were fetched (all 200). Attachments read: the 「師大相關證件」 PDF, 3 `FileDownLoad2` PDFs (itemid 55, 56, 3871), 10 rate-table images plus 4 photos checked for offer text, and the 2 Google Drive PDFs linked from 「國立臺灣師範大學優惠訊息」 (itemid 2466). | Entity-encoded server-rendered HTML. 18 items per list page; each detail page is free text, sometimes an HTML rate table, and often images. | 60 detail pages (「總筆數：60」; 美食 19, 住宿 13, 旅遊 5, 生活 20, 國立台灣大學系統 3) | **53 pages → 59 records** (捷絲旅 page split into 3 properties; 5 records from the linked 總務處 PDF) | 2 | 5 (see below) | No page date. Newest uploads are itemid 4514/4515 (瀚寓, 2026 contracts); image timestamps on 4479 大安視覺 are 2026-08. The oldest cards (itemid 52–730) date from 2020. |

The four list pages and the five category filters give the same 60 item ids, so nothing is hidden behind a filter.

**Skips (7 pages):**
- **2 expired.** 安居台北 The Corner House 「優惠期間：至2025年12月31日止」; 台北世聯商旅 「合約期間2025年1月1日至2025年12月31日」.
- **3 with no terms.** 小熊渡假村 says only 「提供專屬本校住房優惠服務」. 大安眼科診所 and 台北美日牙醫診所 list contact details only; their images are a storefront photo and a clinic banner with no offer. (The 2023 校外 PDF below gives terms for both, but they are not on the live page and have no date, so they were not imported.)
- **2 pointers to other schools.** 「國立臺灣大學優惠訊息」 (itemid 2464) and 「國立臺灣科技大學優惠訊息」 (itemid 2467) only link to NTU and NTUST store lists on Google Drive/Sheets. These are other schools' lists and were not fetched for this file. The NTUST links may be useful for the survey in issue #2: https://drive.google.com/file/d/1rTZ4HxjrFgf9SOj9SNKxa93ikn66GVmC/view and https://drive.google.com/file/d/1uU4XPW9ySffOOaOXFdB-UKebz5PgVvVt/view.

**Linked PDFs from 「國立臺灣師範大學優惠訊息」 (itemid 2466):**
- 校內優惠 (https://drive.google.com/file/d/1v0mCuj6_qPcV5JXNDrFV90iAyi3BxjCH/view): 「總務處轄下委外餐廳提供優惠意願調查一覽表(三校)」, marked 「1120323更新」 (PDF created 2023-03-24). It has 34 rows. Their 優惠時間 is 「即日起~」 112/06/30 (4), 112/12/31 (1), 113/06/30 (1), 113/12/31 (1), 114/06/30 (19), 114/12/31 (2), 115/06/30 (1) or 116/06/30 (5). **The 5 rows running to 116/06/30 were kept** (K5時尚趣, SMILE早餐吧, 覓食堂, 氹仔燒臘, 紅番茄自助美食餐廳, all in 公館校區); 29 rows are expired. `source_org` for these 5 is 國立臺灣師範大學總務處, `source_url` is the 2466 detail page (as the issue asks) and the PDF is in `links`.
- 校外優惠 (https://drive.google.com/file/d/1b26YNiCyuEhHXHoG-HogkJo61xVyTd_U/view): a 3-page table created 2023-03-14 with no per-row dates. Most rows are the same merchants as the live detail pages; the others (貳樓, 六福村, 阿聯酋航空, 微笑寶貝診所, 來禮皮件, 成大會館 and more) are no longer listed on the live page. It was **not imported**, because it is an undated 2023 snapshot that the live list supersedes.

**Sub-promotion removed:** 長榮航空 BizFam item 1, the 官網購票折扣碼 (「限2026/9月底前綁定，10月底前開票，2027/3月底前出發」): the binding deadline has passed. The other three BizFam benefits are kept.

**Records by region:**

| Region | Single-region records | Including multi-region records |
|---|---|---|
| north | 42 | 53 |
| central | 1 | 12 |
| south | 2 | 13 |
| east | 1 | 11 |

10 records cover all four regions (airlines, online shops, 台灣大哥大, Editage, 捷尼皮件). 台灣高鐵 is north + central + south. **2 records have `regions: []` because the page gives no location**, not because they are on an outlying island: 好野吧Drink SPORT and 華安大飯店. Please set these by hand or drop them.

Category counts: food 25, lodging 12, services 8, shopping 6, transport 5, health 2, entertainment 1.

**Eligibility counts:** 56 alumni, 57 staff, **55 student**, 2 family. 31 records use the publisher-rule default (see below). Not student-eligible: 台灣高鐵 (staff), 台灣大哥大 (staff + family), 手機急診室 and 良友精緻飯店 (alumni only). 華航 鳳凰城 is student + staff only.

## Field mapping and judgement calls

- **Eligibility** is read from each page's own wording:
  - 「教職員/學生/校友/退休人員」, 「校友、教職員工生」 and 「師大教職員、學生、校友、退休人士、師大悠遊認同卡卡友」 → student, staff and alumni. Retirees count as staff.
  - 大安視覺眼鏡 adds 「及其隨行眷屬」 → family as well.
  - 台灣大哥大 「優惠對象：師大教職員工、退休人員、員工之二等親內」 → staff and family only.
  - 手機急診室 「須出示校友證」 and 良友精緻飯店 「告知訂房人員為國立台灣師範大學校友，入住時請出示校友證」 → alumni only.
  - 中國東方航空 「僅適用於簽署合作之學校學生本人、教職員工或校友」 → student, staff and alumni.
  - 華航 台北-鳳凰城 「每位師生每月限領取一次」 with 「限輸入學校信箱」 → student and staff.
  - 台灣高鐵 is a 企業客戶 scheme keyed to the school's 統一編號. The rebate goes to the school, and the group 9折 example is 「師長國內出差」 → staff only, with a note.
  - **Publisher rule:** the index page says 「只要持師大校友證、及師大相關證件就可享有下列優惠與福利。」 The linked 「師大相關證件」 PDF (國立臺灣師範大學 校用識別證 2020) shows the 校友證, 學生證, 教職員工證 and the two 退休證. Pages that name nobody (only 「出示證件」, 「憑證」, 「識別證」 or nothing) are therefore marked **student, staff and alumni**. The note reads 「條款未寫明適用對象；依校友中心「特約優惠」頁通則…歸類為校友、學生、教職員適用」, and `info` says 「使用對象：校友、學生、教職員（依頁面通則）」. This applies to 31 records, including the 5 總務處 PDF rows.
- **Expiry:** the last date given is used. 中國東方航空 uses the end of the 購票期間 (2026-12-31). 台北福華 uses 「適用於2026年1月1日至12月29日」 → 2026-12-29. 大安視覺 「民國 115 年 8 月 1 日 至 116 年 7 月 31 日」 → 2027-07-31. The 總務處 rows 「即日起~116/06/30」 → 2027-06-30. **溪頭福華 is a judgement call:** its image is titled 「2026年客房合約書」 with no end date, so 2026-12-31 is used and noted. Pages without any date are `null`. No record has `auto_renew`.
- **Images:** 7 hotel pages publish their rates only as images (台北福華, 溪頭福華, 新竹福華, 華安, 高雄福華, 良友, 捷絲旅 臺大尊賢館). 瀚寓酒店 and 瀚寓夏天 use HTML tables, which were copied directly. The images are clear scans or typeset tables. The key rates and conditions were transcribed into `offer`, and each record has the note 「合約房價表在頁面上為圖片，已轉錄重點，請以頁面圖片為準」. Long booking or payment boilerplate in the images (bank account, shuttle prices, cancellation rules) was left out.
- **Conflicts kept visible in `notes`:**
  - The 溪頭福華 image says 「員工…出示員工工作證」, but the page text says 「本校教職員/學生/校友/退休人員之相關證件即可」. The page text is followed.
  - The 華安 table says 「入住時需出示員工證或名片正本」.
  - 捷絲旅 礁溪館 and 晶泉丰旅 list 師大教職員、學生、校友、退休人員, but also say 「入住時需於現場出示校友證」.
  - 7-11 臺師大公館校區門市 has no date on the alumni page, but the 2023 總務處 PDF lists it 「即日起~114/06/30」. It is kept with a note to check first.
- **捷絲旅 Just Sleep** (itemid 3086) has three properties with separate addresses and dates: 臺大尊賢館 (to 2026-12-20), 宜蘭礁溪館 and 礁溪晶泉丰旅 (to 2026-12-31). It was split into 3 records that share the same `source_url`.
- **Regions** come from the address. 宜蘭 → north and 嘉義 → south, as in the other source files. 能量先生 竹科店 → north from the store name; 雨都漫步 (基隆 tours) → north; 小木屋鬆餅 → north from its branch names (the 「永康店」 city isn't stated; noted). Online shops, airlines and the 台灣大哥大 scheme → all four. 捷尼皮件 gives no address (phone, Line and website only) → all four, noted. 台北福華, 新竹福華, 高雄福華 and 溪頭福華 have no street address on the page; their region comes from the city in the name, and `address` is left empty.
- **Highlight:** the best 折 rate is used (73折起, 85折起 and 76折起 where a range is given). Fixed amounts become 折$N (手機急診室 折$200, 能量先生 折$5). Hotel rate tables get 專屬優惠價. Other badges: 免服務費 (清邁城, Papa Rice), 買大送大 (達美樂), 消費贈品 (雨都漫步), 滿額贈 (SciKet), 3% OFF (長榮, 華航 企業帳號), 團體9折 (高鐵), 專案優惠 (台灣大哥大), 免費升級 (大安視覺). 哲思/捷尼 use 5折 rather than the once-a-year 39折 campaign. The 總務處 rows only say 「表定商品優惠價格」 and get 特約優惠.
- **Category:** 美食 → food, 住宿 → lodging, 旅遊 airlines/高鐵 → transport, 雨都漫步 → entertainment. 生活 is split: 行李箱, 金玉堂, SciKet, JJK and R&R HOME → shopping; salons, printing, phone repair, design, Editage and 台灣大哥大 → services; 風華御髮植髮診所 and 大安視覺眼鏡 → health; 7-11 → food.
- **Cleaning:** marketing paragraphs (store histories) were dropped from `offer`. Social-share and print links, the empty `tel:OOO` / `mailto:OOO` hrefs on 瀚寓夏天 (its visible phone and email text were used) and Google Ads tracking parameters on links were dropped.

## Caveats

- **Student coverage is high but rests on the page rule.** 24 records name students explicitly; 31 more are student-eligible only through the index-page rule, which lists 師大相關證件 (including the 學生證) next to the 校友證.
- Many cards date from 2020 (itemid 52–730) and have no end date. They may no longer be honoured; the page asks people to contact the 校友福利專線 with questions (the visible number is 02-7749-1195, but the `tel:` link points to 02-7749-1034).
- Hotel rates were transcribed from images. Check against the page image before quoting a price.
- 好野吧Drink SPORT and 華安大飯店 have `regions: []` and no address (see above).
- The 5 總務處 on-campus rows come from a 2023 survey PDF. Their contracts run to 2027-06-30, but the vendors may have changed since.
- `schools` is `["NTNU"]` for every record. The 總務處 PDF is titled 「(三校)」 (NTU system), so NTU and NTUST IDs may also be accepted on campus. This was not confirmed.
