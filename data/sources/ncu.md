# NCU 中央大學 partner-discount source (verified 2026-10-15)

> **Status: extracted.** Every record in `ncu.json` comes from pages fetched with curl on 2026-10-15.
> The old URL https://in.ncu.edu.tw/alumni/web/benefits.php is a 「網站已搬遷」 page that points to the new one below.

## Extraction summary (`ncu.json`, 147 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| NCU 中央 | 秘書室校友服務中心 「校友證福利」 (school) | https://ncu.edu.tw/asc/benefits.php?area=&keyword=&type=&page=N with N = 0, 10, …, 180 (the `page` value is an **offset**, 10 cards per page). Each `type=` filter (restaurant, transportation, grocery, amusement, snack, school, hotel, life, education) was also fetched to get the category. 4 attachment PDFs were read (`/asc/doc/<ts>_att.pdf`). | Server-rendered HTML cards. Each card has a name, 地區, 連絡電話, 地址, 優惠內容 (free text), 優惠期限, 網站連結 and an optional 附件 PDF. There are no detail pages or modals; the card holds the full text. The image on each card is the store logo. | 183 cards (19 list pages; the last page has 3) | **147** | 27 | 9 (see below) | No page-level date. Per-card 優惠期限 runs to 2029-12-31. The newest uploads are dated 2026-10-01 (承億文旅/承億酒店 logo and PDF timestamps) and 2026-09-03 |

The type filters cover 171 of the 183 cards. The other 12 have no type: the clinics, 地政士, 物業, CPA, 法律事務所, 藥局, 坐月子 and the empty card. I categorised those 12 by hand.

**Skips (36):**
- **27 expired.** The end date in 優惠期限 is before 2026-10-15. Examples: 古華花園飯店 2025-12-31; 兄弟大飯店 2025-12-30; 朵法亞 2026-02-01; 鷹萬游泳學校 2026-05-20; the 古拉爵 branches 中壢大江, 平鎮 and 南港 (2026-03/04); 王品和牛涮 中壢元化; 村却 2024; 喜鴻; ai3C; 寶視; MTSK; 三商美福 (single date 2024/12/9); and the 捷尼, 美麗華 and 佳仕奇 one-month 39折 campaigns from 2024–2025.
- **1 stale-promo-only.** The 美麗華皮件工業 card (期限 2015-無期限) contains only the 2024/01/01–2024/02/15 「好箱揪你」 campaign.
- **1 duplicate.** 達美樂新屋雙連二段店 is listed twice with identical text; one copy was kept.
- **3 with no terms.** 康橋商旅 彰化員林館 and 康橋商旅 高雄 11館 say only 「請電洽」 and have no attachment. 頭城休閒農場旅館 has only the heading 「一、標準二日套裝行程」.
- **1 attachment-only.** For 禾馨醫療 the card lists services but no discount, and the PDF is an image with no extractable text.
- **1 not an offer.** 東方航空 is a 2024 new-route announcement.
- **1 empty card.** One card on page offset 150 has no name and no content.
- **1 stale group-buy.** 立碁購 護眼罩 has a blank 期限. Its PDF says 「即日起至售完為止」; it is a 2024-11 福委會 group-buy.

**Records by region:**

| Region | Single-region records | Including multi-region records |
|---|---|---|
| north | 79 | 102 |
| central | 23 | 44 |
| south | 15 | 35 |
| east | 5 | 22 |

17 records cover all four regions, and 2 are on outlying islands (澎湖福朋喜來登, 愛之旅旅行社) with `regions: []`.

Category counts: food 68, lodging 28, shopping 17, entertainment 11, health 8, services 7, transport 5, education 3.

**Eligibility counts:** 128 alumni, 38 staff, **13 student**, 5 family. 16 records are staff-only. 21 records use the publisher-rule default (see below).

## Field mapping and judgement calls

- **Eligibility** is read from each card's own wording:
  - 校友證 → `alumni`.
  - 學生證/學生 → `student`.
  - 教職員證, 員工識別證, 服務識別證, 名片, 工作證 or a bare 「識別證」 → `staff`.
  - 眷屬/親友/家長/直系子女 → `family`.
  - **Publisher rule:** the page is titled 「校友證福利」 (nav: 「校友證福利 Benefits」), and every card ends 「使用優惠前請電洽 〈店家〉確認」. Some cards name nobody: 達美樂, 承億文旅, 康橋 花蓮/台東, 東方航空 promo code, 歐德, 青園藥局, 凡森睿勝 and others, 21 in all. Those cards, and 朝鼎 「憑證件」, are marked **alumni only**, with the note 「條款未寫明適用對象；依校友服務中心「校友證福利」頁面歸類為校友適用」. `info` then says 「使用對象：校友（依頁面通則）」.
  - **Staff-only cards are kept as staff-only even though they sit on the alumni page.** Many cards are copies of 福委會/員工 contracts. Examples: 貳樓 「凡甲方在職員工」; 承億酒店 「憑員工識別憑證」; 王品和牛涮 ×3; 藝奇; 台中金典 「僅適用貴公司客人與員工」; 清新溫泉 「員工證」; 友竹居 「憑教職員證 (不含校友證)」; 綠世界; 救國團運動中心; 棉花田; 好婆婆; 迷客夏 「公司證件」; 綠邦/萬益 「全體員工」; Costco 「於國立中央大學任職之名片」. The wording is quoted in `notes`.
  - Special cases:
    - 國泰航空 is **student only**: it is for study-abroad tickets with ISIC, a student visa or an admission letter.
    - 全民大劇團 「校友總會員工及校友」 → alumni only. The 員工 there are the alumni association's own staff.
    - 校內停車 「校友證、博士班、碩專班有效學生證及家長」 → alumni, student and family. The note says students must be PhD or 碩專班.
    - 牛町 accepts 學生證 at the 新竹 and 竹北 branches only (noted).
- **Expiry:** the last date in 優惠期限 is used. 無期限/無限期/永久/無限制/無終止日期 and 「全年度…」 map to `null`. ROC dates such as 115.10.01-116.12.31 are converted (116 → 2027). 「自動續約」 sets `auto_renew` (1 record: 威尼斯溫水SPA). Several contracts **start in the future**, and their notes say so:
  - 貳樓: 2026-11-01
  - 享沐時光, 古拉爵林口三井 and 清新溫泉: 2027-01-01, with 2027 rates
- **Stale parts removed from valid entries:**
  - 佳仕奇: the 113/06 39折 campaign and its order-form PDF link
  - 王品牛排: the 台南健康店 block (ended 2025-12-31). The 桃園同德店 has its own card, so the record keeps only 台北中山北店 (`name` 王品牛排, `subtitle` 台北中山北店).
  - 南方莊園: the 「農曆春節：114.01.28~114.02.02」 line
  - 品田牧場: kept (三峽 and 楠梓 are permanent; 中壢 runs to 2026-12-31). The per-branch dates are in `notes`.
- **Attachments:** 康橋商旅 花蓮站前館 and 台東館 publish their rates only in the PDF. The PDFs had extractable text, so the rate tables were appended to `offer` under 【附件簽約價格表】. Other attachments are linked as `{"label":"附件"}` but were not parsed. Most of them are rate sheets for hotels whose card already has the terms.
- **Regions** come from the address. Cards whose 地區 is 「全區」 use the addresses and branch lists in the text:
  - All four regions only when the text says 全台/全省/全國/官網/宅配/online. Examples: 涓豆腐 「全台」, 伊莎貝爾 「全省直營門市」, Homebox and 特力屋 「全國」, 東森購物, 肉桂捲 官網宅配, Moori 宅配, Cookie Queens 免運, the flights, 五福 網站 and the Alumni 信箱.
  - All four regions, with a note, when 地區=全區 and no address is given (迷客夏, 萬益, 眠床大師, THE LAI CPA).
  - Otherwise the HQ or branch address. For example, 貳樓 is north even though it says 「各分店均可適用」.
  - 救國團運動中心 is north + central, inferred from the listed center names (朝馬 is in Taichung). This is noted.
- **Highlight:** the best 折 rate is used, with 起 added when several rates apply (for example 大板根 65折起, 品格子 8折起, 唐人街 9折起, 救國團 85折起). Hotels with contract-rate tables get 專屬優惠價. Gift deals get 消費贈品. Other badges: 掛號費優惠 (dental and clinics), 折$N (綠的 2,500, 好婆婆 1,000, 大興 2,000, 盛軒 400, 泛舟 and 愛之旅 200, 特力屋 300, 五福 「折$500起」), 免服務費 (天母盛鑫, 名人堂), 免運費, 買大送大 (達美樂) and 半票優惠 (綠世界). 佳仕奇 and Moori use 5折 rather than their once-a-year 39折 campaign.
- **Category:** `type=` maps as follows: restaurant/snack → food, hotel → lodging, transportation → transport, grocery → shopping, amusement → entertainment, education → education. Exceptions:
  - 台中清新溫泉 and 台中金典酒店 are typed restaurant but are mostly room rates → lodging.
  - Costco → shopping.
  - SUM鴻城汽車保修 → services.
  - The `school` type is split: 小木屋鬆餅 → food, 敦煌書局 → shopping, 停車/Alumni信箱 → services, 圖書館/學分費 → education, 體育設施 → health.
  - `life`: 綠的/棉花田 → shopping, 救國團運動中心 → health.
- **Cleaning:** long runs of spaces inside 優惠內容 (the site's line separator) became newlines. 綠的's PDF-style broken lines were rejoined. Full-width digits in phone and address were normalised with NFKC. Multi-branch phone and address fields were reformatted as 「分店 電話；…」. Phones are kept as published; 凡森睿勝 「1037287-7030」 looks mistyped and is noted.
- `source_url` is the list page (with its `page` offset) that holds the card, because there are no detail pages.

## Caveats

- **Few student deals.** This is an alumni-card benefits page, so only 13 of 147 records name students. Most "alumni" records from the page-rule default (21) may in practice also accept staff badges.
- Many permanent entries (2013–2016 contracts marked 無期限) may no longer be honoured. The site itself says to phone ahead.
- Some cards copy a corporate contract verbatim (甲方/乙方, 「貴公司」), and the eligible group may differ from what the alumni page implies. The wording is preserved in `offer` and `notes`.
- Hotel rate tables were flattened from HTML or PDF tables. Column alignment can be imperfect (for example 清新溫泉 and 金典); check against the linked attachment or website.
- 永豐棧 publishes the room-rate inclusions but no prices. 現代物業 offers 「優先通知」, not a discount. Both are kept with 專屬優惠價 and 特約優惠 badges.

## Changes

- **2026-10-23 (worker, issue #10):** 涮乃葉 was re-fetched from `page=0`.
  - The card title is now 「涮乃葉 (統一市府店/信義遠百/台中大遠百店/福科店/文心秀泰店/豐原萬家福店)」. The record's `name` and `subtitle` were updated to match.
  - `phone` is now 「02-2723-0646/02-2763-0298/ 04-2254-7131」.
  - `offer` now includes the new 台北統一時代市府店 block (訂位專線 02-2723-0646) and the 台北信義遠百店 block.
  - The new branch address is published as 「台北市信義區五段8號3樓」, with no road name. It was copied as published and noted on the record, not completed.
  - The card's 地址 field is unchanged, and so is the 優惠期限 (115.10.01-116.12.31).
