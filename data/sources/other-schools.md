# Other-school partner-discount sources (verified 2026-10-15)

> **Status: extracted.** Network access was open in this session. Each source below was fetched
> directly with curl on 2026-10-15, and every record in `other-schools.json` comes from a page or
> sheet fetched that day. Earlier versions of this file were built from search results only.
> Those URLs, counts and dates have now been checked, and corrections are marked **(corrected)**.
> NTU and the 臺大系統學生會 platform are covered by a separate file (`ntu-research.*`).

## Extraction summary (`other-schools.json`, 409 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| NCHU 中興 | 校友中心 特約商店 (school) | https://alumni.nchu.edu.tw/vstore.php?page=1..14 | HTML cards (12/page, 14 pages); a modal holds the full terms, 期限 and 使用對象 | 159 | **128** | 22 | 9 with terms only behind a link (請見連結) | Per-entry 期限 (永久 / dates up to 2028-12-31) |
| NCCU 政大 | 校友服務中心 特約廠商 (school) | https://www.alumni.nccu.edu.tw/benefit_vendor | One HTML page with 5 tabs (美食/住宿/交通/購物/生活); each vendor block has period, area, phone, address, terms and PDF/JPG attachments | 131 | **115** | 1 (NISSAN, 2026-09-22) | 13 attachment-only; 高鐵 (no fare discount); 時藝多媒體 (all exhibition codes ended by 2026-10-12) | Per-entry 即日起～YYYY-MM-DD; several marked NEW/更新 |
| NTHU 清大 | 人事室 特約商店行業別 (school) | https://person.site.nthu.edu.tw/p/403-1066-{903,904,929–935,937–939}-N.php → detail pages `406-1066-<id>,r<cat>.php` | RPage CMS; 12 category lists, then one detail page per merchant with 地址/連絡電話/合約到期日/備註 and a contract PDF | 112 unique | **76** | 15 | 19 with terms only in 合約書/附件; 2 高鐵 procedure pages | Per-entry 合約到期日 (ROC dates, 永久, 自動續約) |
| NYCU 陽明交大 | 人事室 特約商店明細表 (school) | HR page https://hr.nycu.edu.tw/hr/ch/app/artwebsite/view?module=artwebsite&id=348&serno=9dbb428d-8729-4aaa-b4a4-086508f0d38f → "(ODS)" link is a 1-page PDF that points to Google Sheet `1h1jEMiH6LPjdO3I_mWMUxBF0v9SOgx6aOuP2UdVI4ok` (8 tabs, exported via `/export?format=csv&gid=…` and `format=xlsx`) | Google Sheet: 旅店, 觀光旅遊, 餐飲 (tab name 餐廳 in CSV), 醫療健康保健, 文化教育托嬰, 婚紗美容護膚, 車輛修護租賃, 商圈及其他類 | 163 | **49** | 7 | **99 rows have an empty 項目 column** (terms only in an un-linked 「優惠項目」 cell); 7 stale-promo-only rows; 1 「洽談中」 | HR page 更新日期 **115-09-17 (2026-09-17)**; per-row 備註 dates or 每年自動續約 |
| TCU 慈濟 | 醫學系系學會 特約商店 (student_org) | https://medclub.tcu.edu.tw/%E7%89%B9%E7%B4%84%E5%95%86%E5%BA%97/ | WordPress page with two numbered lists | 31 + 10 | **41** | 0 | none | dateModified **2026-03-19** |

Per-school record counts: NCHU 128, NCCU 115, NTHU 76, NYCU 49, TCU 41.

NCHU 2026-10-23 (worker, issue #10): added a253 彩碗 ColorBowl Poke 大里大明店. The source card is on `vstore.php` page 1: 期限 2027-10-20; 使用對象 教職員、在校學生; offer 「消費$135以上…送「金鮮蛋一顆」」 plus the no-combining clause. Its highlight is 消費贈品, as for the other NCHU free-item records. NCHU now has 129 records.

Records by region:

| Region | Single-region records | Including multi-region records |
|---|---|---|
| north | 167 | 235 |
| central | 119 | 184 |
| east | 43 | 103 |
| south | 9 | 72 |

59 records cover all four regions, and 3 are on outlying islands. 328 records are student-eligible.

**(corrected)** The TCU page lists **31** currently valid 系學會 stores (the earlier estimate was ~10), plus **10**
慈濟大學學生會 stores that the same page re-posts. The page notes 「只有已交系學會費的有效」 for the
系學會 list; that caveat is stored in `notes`.

### Field mapping and judgement calls

- **Eligibility** follows each source's own wording:
  - NCHU uses the 使用對象 field. If that field is empty (32 older entries, mostly IDs a1–a65), the offer text is used instead. If neither says anything, the record is marked staff-only and noted.
  - NCCU parses the 「憑效期內校友證及政大教職員工、學生」 sentence for each vendor. Exceptions include 阿默 and 東森購物 (no students) and 萬芳健檢 (alumni only).
  - NTHU uses the per-page 備註 field. If 備註 is blank, the record is marked staff-only and noted, quoting the 說明 page: 「消費前請出示服務證、校友證或學生證，若資料不符以合約書為準」.
  - NYCU uses the 適用對象 column. The sheet header also says 「校友及學生依各商家意願提供，請先行確認」, which is copied into `notes`.
- **Expiry:** 「永久」 maps to `expires_on: null`. 「每年自動續約」 / 「自動續約」 maps to `auto_renew: true`. ROC dates such as 1151231 are converted to 2026-12-31. Anything earlier than 2026-10-15 is dropped. Stale sub-promotions inside otherwise valid entries are removed from the offer text:
  - 和苑三井 summer plan
  - 將捷 父親節
  - 兄弟大飯店 4/1–9/30
  - Homebox 9/10–9/14
  - 路易斯 39折 until 115/07/15
- **Regions** come from the merchant address or the NCCU 地區 field. Online or nationwide deals (官網下單, 全台/全省, 企業代碼) get all four regions. Three NCCU records are on outlying islands (澎湖 and 金門) and have `regions: []` with a note.
- **Highlight** is derived from the text: the best 折 rate, with 「起」 added when several rates apply. Other derived badges: 折$N, 掛號費優惠, 買X送Y, 免服務費, 專屬優惠價, 消費贈品, or a 特約優惠 fallback. A few highlights were set by hand, for example 宏碁 「教育方案優惠」 and 玉山 「手續費5折」.
- **Deduplication** is within each school only. The same brand can appear under several schools (森森燒肉, 朵法婭, 英倫牙醫, 力麗, 古拉爵 and others). Each appearance is kept as a separate record because eligibility and terms differ.

## Survey table (re-verified 2026-10-15)

| School | Publisher (level) | URL | Status on 2026-10-15 | Format / size | Last updated | Student-applicable? |
|---|---|---|---|---|---|---|
| NCHU 中興 | 校友中心 (school) | https://alumni.nchu.edu.tw/vstore.php | **200, extracted** | 14 pages, 159 entries | per-entry 期限 | Mostly yes (教職員、在校學生、校友) |
| NCHU 中興 | 總務處 news post | https://oga.nchu.edu.tw/news-detail/id/1293 | **(corrected)** It now just redirects to /news (the post is gone) | — | — | — |
| NCHU 中興 | 總務處 住宿交通 PDF | https://oga.nchu.edu.tw/upfile/file/5d3a12b98a66cc99b8cc9d2d40e73dedb4cf8390.pdf | 200 but **stale** (合約期限 2019) | PDF table | 2019 | skip |
| NCCU 政大 | 校友服務中心 (school) | https://www.alumni.nccu.edu.tw/benefit_vendor | **200, extracted** (one TLS reset; retry worked) | 131 vendors | per-entry periods to 2029 | **Yes**: almost all say 校友證及政大教職員工、學生 |
| NCCU 政大 | 總務處 優惠飯店 | https://aff.nccu.edu.tw/PageDoc?fid=8618 | **Not verifiable**: TLS chain error (the server sends an incomplete certificate chain; verification was not bypassed) | — | — | — |
| NTHU 清大 | 人事室 by industry (school) | https://person.site.nthu.edu.tw/p/403-1066-898.php | **200, extracted** | 12 categories, 112 merchant pages | per-entry | Yes, per 備註 |
| NTHU 清大 | 人事室 by county | https://person.site.nthu.edu.tw/p/403-1066-4312.php | 200 | Same set grouped by county, plus a 「特約-全省適用」 group that lists **菁英國際文教** and **台鋼燦星旅行社**, which were not in the industry crawl. They were not extracted (follow-up). | — | Yes |
| NTHU 清大 | 南大校區人事室 | https://ndper.site.nthu.edu.tw/p/412-1138-493.php | 200 | Plain-text name list of ~120 merchants 「原簽訂特約商店，辦理換約程序」 (re-contracting), with no terms. Not extracted. | — | Staff-oriented |
| NTHU 清大 | 校友中心 | https://alumni.site.nthu.edu.tw/p/412-1346-11831.php?Lang=zh-tw | 200 | Category links into the 人事室 list (same data) | — | Alumni (校友證) |
| NYCU 陽明交大 | 人事室 (school) | HR page above → Google Sheet | **200, extracted** | 163 rows / 8 tabs | **2026-09-17** | Per row (教職員工/學生/校友) |
| NYCU 陽明交大 | 總務處 陽明校區廠商資訊表 | https://ga.nycu.edu.tw/userfiles/gach/files/20240314111601377.pdf | 200 | PDF of on-campus vendors (hours, small discounts such as 自備環保杯折1元) | 2024-03 | Yes. Not extracted (campus vendors) |
| NCU 中央 | 校友服務中心 | **(corrected)** https://in.ncu.edu.tw/alumni/web/benefits.php is now a 「網站已搬遷」 page that redirects to **https://ncu.edu.tw/asc/benefits.php** | 200 at the new URL | HTML with `type=` filters (restaurant, hotel, transportation, …) and pagination `?area=&keyword=&type=&page=N` up to about page 180 (several stores per page; includes history) | entries dated 2026-09/10 | Mostly 校友證. Not extracted this round (cap reached) |
| NCKU 成大 | 校友聯絡中心 VIP卡/校友卡名單 | https://alumni.ncku.edu.tw/p/412-1004-19459.php?Lang=zh-tw | 200 | **(corrected)** The page now links one PDF, https://alumni.ncku.edu.tw/var/file/4/1004/img/772889412.pdf (pdftotext gives about 80 numbered rows; hotels, food, medical). The three older PDFs still load. | **更新日期 114年1月7日 (2025-01-07)** | Mostly 校友卡/職員證; some hotels also 學生證. Not extracted (time/cap) |
| NCKU 成大 | 人事室 優惠專區 | http://pers.ncku.edu.tw/p/412-1029-20048.php | **Dead**: http does not resolve; https returns 404 | — | — | — |
| CMU 中國醫 | 學生會 (student_org) | https://www.twcmusa.org/discount/ | 200 | WordPress; the index links **24** `/store/<name>/` posts | — | Yes. Not extracted (cap) |
| NTNU 師大 | 校友中心 特約優惠 | https://alumni.ntnu.edu.tw/Welfare?itemid=14&mid=16 | 200 | Entity-encoded HTML; first page lists 18 `MessageView?itemid=` detail pages (住宿/美食/旅遊/生活, including a 「國立台灣大學系統」 category) | — | Partly |
| NTNU 師大 | 總務處 便利通 | http://www.ga.ntnu.edu.tw/service/int_shop/a02.html | **Dead** (404 on https; no response on http) | — | — | — |
| NTUST 臺科大 | 秘書室 PDF / 校友福利 | https://www.secretariat.ntust.edu.tw/… | **Not verifiable**: TLS chain error, as for aff.nccu | — | — | — |
| TMU 北醫 | 人力資源處 | http://tmu-hr.tmu.edu.tw/zh_tw/b2019/b3 | **Dead**: DNS does not resolve | — | — | — |
| TCU 慈濟 | 醫學系系學會 | medclub (above) | **200, extracted** | 41 | 2026-03-19 | Yes (系學會 list needs dues paid) |
| TCU 慈濟 | 人事室 PDF | https://personnel.tcu.edu.tw/wp-content/uploads/2017/09/unnamed-file-56.pdf | 200 but **stale** (103.01.15, 慈濟志業體同仁 only) | PDF | 2014 | No |
| KSU 崑山科大 | 特約商店 app | https://bir.ksu.edu.tw/cr/public/application/ksulife/store | 200 | HTML cards with 證別 tags (學生證/教職員工證/校友證); 131 「more…」 entries on the first load (Tainan) | — | **Yes**, tagged per store. Good next south source |

## Sources worth monitoring

1. **NYCU Google Sheet** has the best update signal: the HR page shows 更新日期 and the sheet is edited in place. Re-export the CSV for each tab. The 99 rows without terms could be filled by asking 人事室, or from the linked infonews posts where they exist.
2. **NCCU benefit_vendor** is one page, has per-vendor periods, carries NEW/更新 badges, and nearly everything is open to students.
3. **NCHU vstore.php** is structured and has explicit 期限 and 使用對象. New entries get the highest `a<id>`, so watch for a252 and above.
4. **NTHU 人事室** has per-merchant pages with 合約到期日. The list pages are sorted newest first.
5. **TCU medclub** is the only east-region source. It is small and changes at most once per semester.

## Caveats

- The NCHU and NTHU lists include old entries (contract 「永久」) that may no longer be honoured. The schools themselves say to confirm with the merchant first.
- For NCHU entries with no stated audience, and NTHU entries without 備註, eligibility is set to staff only, which may be too strict. The 說明 page suggests students usually qualify.
- NCCU hotel entries say only 「憑證享優惠價」; the actual prices are in PDF attachments, which are linked from each record but were not parsed.
- In TCU records `info` and `address` are empty because the page gives no addresses. All TCU stores are in Hualien, so the region is east.

## Competitors and aggregators (from the earlier search-only survey; not re-verified)

| Platform | What it offers | Taiwan relevance |
|---|---|---|
| UniMarket 大學市集 (unimarket.tw) | Campus marketplace plus a merchant back-office for student deals | Direct rival on the merchant side; its deals are posted by merchants, not taken from school lists |
| UNiDAYS / Student Beans / ISIC | Global student-verification and deal apps | Mostly global brands; few local merchants |
| Brand-direct programs (台鐵大學生優惠票, 小米 etc.) | One-off national student pricing | Could be indexed as national entries |

**CampusPass gap (unchanged):** none of these index the official school lists above. The lists hold hundreds of local deals with explicit eligibility.

## Data-quality pass 2026-10-15

Every change below was checked against the live source page re-fetched on 2026-10-15 (NCHU vstore.php pages 1–14, all 76 NTHU detail pages plus the 人事室 「特約商店說明」 page, the NCCU benefit_vendor page, the 7 NYCU sheet tabs as CSV, and the TCU medclub page). The record count is unchanged at 409. 347 records are now student-eligible (up from 328).

**1. Eligibility defaults**
- **NCHU (34 records with student=false re-read):**
  - The list page has no audience statement for the whole list. Its only header line is the merchant-application contact.
  - 26 records have an empty 使用對象 field, and their offer text names no audience either. They stay student=false. Their notes now say 「適用對象未載明…消費前請向商家確認」. The records are 元成車業, 德川, 鮮活農產, 歐客佬, 肉鮮生, 王品文心, 3393, 有心食堂, 陳允寶泉, 礽豐, 美麗華皮件, 龍興機車, 愛林幼兒園, 親貝兒托嬰, 六法資訊, 歐舒嫚, 明祐耳鼻喉科, 永盛體育, 路易斯皮件, 法藍瓷, 小林眼鏡, 慎安堂, 樂扣樂扣 (whose offer adds 「優惠適用退休人員」), 玉山銀行, 飛夢力 and 24-17.
  - 興大附農實習旅館 and 附農員工子女幼兒園 have an empty field, but their offer text limits the deal to 本校(現職)教職員工. Their notes now say so.
  - 麗喆國民中小學 (offer for 教職員之子女) now has family=true.
  - Amo, 銀櫃, 華航 and 綠世界 state the audience explicitly. They are unchanged.
- **NTHU (36 records with student=false re-read):**
  - The 人事室 「特約商店說明」 page (https://person.site.nthu.edu.tw/p/406-1066-7628,r898.php) applies to the whole list. It says 「若資料不符，則以合約書內容為準，消費前請出示服務證、校友證或學生證」.
  - 19 records whose pages say nothing about who qualifies (only 「憑證」, 「識別證」 or nothing at all) now have **student=true and alumni=true**, and their notes cite the 說明 page. The records are 宏常, Backhaus, 元世祖, 藝奇竹北, 夏慕尼桃園, 邀月茶坊, 太陽堂, 城堡花園, 享住旅店, 會來尖石, 梅林親水岸, 貝格, 蓓萌, 莎拉公主, 喜馬帝, 美日牙醫, 廖健仲/梅約, 紐約國際幼兒園 and 中華汽車幼兒園.
  - 11 records stay staff-only because their own page text says 員工/教職員. The old note 「頁面未另註適用對象」 on them was wrong and now quotes the restricting text instead. The records are 客美多, 辛麻辣, 古拉爵迎曦, 楓樺台一, 宜泰, 太一, 三久, 永康中醫, 城市綠洲, 橙智 and 研田.
  - 6 records with an explicit 備註 are unchanged.
- **NCCU:** 長榮航空's notes now say 「適用對象未載明」. The NCCU page has no list-wide audience statement, so student stays false.

**2. Field fixes from full-field checks**
- Every NCHU 期限 (128), NCCU period (115), NYCU 適用對象/備註 (49) and NTHU 備註/合約到期日 (76) was compared with the source. Only these four were wrong:
  - NTHU 森森燒肉: regions changed from all four to north and central, since only 中區 and 北區 stores are listed.
  - NTHU 元手壽司: north added to regions for the 竹北 branch.
  - NTHU Backhaus: auto_renew set to true (1100630 自動續約).
  - NTHU 辛麻辣: expires_on set to 2024-06-12, because the page says 「優惠至113-06-12」. The record now shows as expired.
- NCCU 高雄日航酒店: the mooncake pre-order block, which had ended (2026-09-25), was removed from the offer.

**3. Spot check (random.seed(15), 40 records across both files)**

| Source | Sampled | Errors | Rate |
|---|---|---|---|
| 中興大學校友中心 | 9 | 0 | 0% |
| 政治大學校友服務中心 | 10 | 0 | 0% |
| 清華大學人事室 | 5 | 2 | 40% |
| 陽明交通大學人事室 | 5 | 0 | 0% |
| 慈濟醫學系系學會 (incl. 轉載) | 4 | 1 | 25% |

The NTHU errors were 城堡花園 (staff-only default; fixed under item 1) and 元手壽司 (missing region). The TCU error was 來來牛排, which had the badge 「特約優惠」 although the source gives 9折/95折. Sampled NTU-file rows are reported in ntu-research.md. The overall rate was 3/40 (7.5%).

**4. Highlight badges (26 changed in this file)**
- 高雄日航: 85折 became 專屬優惠價. The 85折 was the expired mooncake early-bird price.
- 長榮航空 (政大): 92折 became 企業會員. 92折 is a time-limited code; ticketing must happen by the end of 10/2026.
- O′right: 75折 became 限定月75折 (January, May and September only).
- 奧黛莉: 回饋優惠 became 折$50.
- Badges now show the rate a single cardholder gets rather than the group-only rate:
  - 饗賓: 96折起 became 98折 (96折 needs 20 or more people).
  - 舞動陽光 and 北區國民運動中心: 85折起 became 9折.
  - 駿發: 85折起 became 9折.
- 寶島53行館: 9折 became 專屬優惠價. The 9折 applies only during Lunar New Year.
- 玉山: 5折 became 手續費5折.
- 山海樓, 農人餐桌 and Green&Safe: 回饋優惠 became 5%回饋.
- 聯合航空 (政大): 特約優惠 became 95折.
- 荃能: 消費贈品 became 專屬優惠價.
- MORE: 特約優惠 became 專屬優惠價.
- 太一: 早鳥每人折$5000 (10 characters, and the early-bird price is open to everyone) became 每人折$1000, the partner-only amount.
- 吉品: 7折 became 5折起.
- 優品: 6折 became 4折起.
- 莎拉公主: 8折起 (the 8折 is for nails only) became 包套贈品.
- 國泰人壽: 77折 became 旅平險77折.
- TCU: 幽靈餐車, TOP手感烘焙 and 懶惰狗 became 95折; 將門 and 一筷燒肉 became 9折; 來來牛排 became 9折起; 肚咖喱 (折$20) became 折$10起.

All badges are now 8 characters or fewer.

**5. Regions:** Only 澎澄飯店 (澎湖), 金湖飯店 and 永成租車 (金門) have empty regions. Our scheme has no island region, so they stay empty and their notes say so.

**6. Duplicates:** The same school's records were compared across sources by normalised name, including TCU 系學會 against 學生會轉載. No same-merchant, same-offer duplicates were found, and nothing was dropped.

**Other:** CJK compatibility ideographs copied from the NCHU source (for example 林 U+F9F4 in 高佳林, and ⽛ in 沐芯⽛醫) were normalised to standard characters in 13 records, so that name search works.

**Validation:** Both JSON files load. Every record has name, a valid category, source_url, source_org, schools, regions and 4 boolean eligibility flags. `scripts/import_deals.py` ran without errors (605 deals, no skips), and `data/deals.json` and `seed/deals.sql` were then restored with git checkout.


## Update 2026-10-15 (campass-2)

NCU, NCKU, CMU and KSU were extracted by campass-2 into their own files (`ncu.json`, `ncku.json`, `cmu.json`, `ksu.json`, each with a `.md` report). The CMU row above (≈24 posts) is stale: the index has 9 pages / 209 posts, 197 kept.

## Re-check 2026-10-22

Re-checked by the worker (data/sources/recheck-2026-10.md). Removed 辛麻辣鍋物餐廳 (NTHU; offer ended 113-06-12, not renewed). End dates updated from the pages: 棋建壂 (NCCU) → 2027-10-29; 喜瑞飯店 (NYCU) → 2026-12-31; 救國團新竹團委會 (NYCU) → 2027-12-31; 菁英 → 精英汽車駕駛人訓練班 (NYCU, renamed) → 2027-12-31. Nine NCHU records moved to the next `?page=` after new cards were added at the top; their `source_url`s were updated. Not yet extracted: NCHU a253 彩碗 ColorBowl and 48 NYCU sheet rows that now have terms.
