# Other-school partner-discount sources (survey, 2026-10-15)

> **Status: survey only. No deals were extracted.** In this research session no page could be fetched.
> `WebFetch` failed DNS for every host, google.com included, and direct HTTPS through the egress
> proxy returned 403 (policy denial) for `*.edu.tw`, `unimarket.tw` and others. The only working
> tool was the search index (WebSearch), which returns URLs, titles and model-written summaries.
> Under the rule "every record needs a source_url you actually fetched", I left
> `other-schools.json` as `[]`. Everything below comes from search-index evidence: the URLs and
> titles are real search hits, but the merchant counts and dates are estimates from those
> summaries and still need checking on a real fetch.
> To unblock this, allow the hosts listed in "Extraction targets" (or broader network access) in
> the environment's network settings, then rerun the extraction step.

## Survey table

Eligibility abbreviations: S = students, F = faculty/staff, A = alumni.

| School | Publisher (level) | URL | Format | Approx. # merchants | Last updated (visible) | Student-applicable? | Scrape ease |
|---|---|---|---|---|---|---|---|
| NCCU 政大 | 校友服務中心 (school) "特約廠商" | https://www.alumni.nccu.edu.tw/benefit_vendor | HTML list, one card per vendor, categorized (餐飲/住宿/醫療/購物) | dozens (est. 50+) | not seen | **Yes, mostly**: per the summary, most vendors accept 校友/教職員工/學生 | Easy (single HTML page) |
| NCCU 政大 | 總務處事務組 (school) "優惠飯店" | https://aff.nccu.edu.tw/PageDoc?fid=8618 | HTML | ~10–20 hotels | — | Unclear (likely staff-oriented) | Easy |
| NCCU 政大 | 總務處 on-campus shop list | https://aff.nccu.edu.tw/upload/63/doc/4974/114學年度第一學期本校餐廳、商家營業資訊一覽表.pdf | PDF | campus shops (hours/phone, not discounts) | 114-1 (Fall 2025) | n/a | Medium |
| NCCU 政大 | 政大學生會 (student_org) | facebook.com/NCCUSA4U | FB posts | unknown | — | Yes | Hard (FB only) |
| NTHU 清大 | 人事室 (school), by industry | https://person.site.nthu.edu.tw/p/403-1066-898.php | HTML (RPage CMS), category sub-pages e.g. 特約-餐飲食品 https://person.site.nthu.edu.tw/p/403-1066-903-1.php | large (est. 100+; many categories plus a "全省適用" tier) | ongoing ("近期新簽特約商店" page) | **Yes**: 說明 page says present 服務證、校友證或學生證 | Medium (paginated RPage lists, detail posts) |
| NTHU 清大 | 人事室, by county | https://person.site.nthu.edu.tw/p/403-1066-4312.php | HTML | same set | — | Yes | Medium |
| NTHU 清大 | 南大校區人事室 | https://ndper.site.nthu.edu.tw/p/412-1138-493.php | HTML | small | — | Yes | Medium |
| NTHU 清大 | 校友中心 | https://alumni.site.nthu.edu.tw/p/412-1346-11831.php?Lang=zh-tw | HTML | links into 人事室 list | — | Alumni-focused | Easy |
| NYCU 陽明交大 | 人事室 (school) | https://hr.nycu.edu.tw/hr/ch/app/artwebsite/view?module=artwebsite&id=348&serno=9dbb428d-8729-4aaa-b4a4-086508f0d38f | HTML page plus **ODS spreadsheet** (本校特約商店明細表) | unknown (spreadsheet) | **115-09-17 (2026-09-17)** | **Yes**: 結帳前出示教職員服務證、校友證、學生證 | Easy once the ODS is downloaded (structured) |
| NYCU 陽明交大 | 總務處 陽明校區廠商資訊表 | https://ga.nycu.edu.tw/userfiles/gach/files/20240314111601377.pdf | PDF | campus vendors with discounts | 2024-03 | Yes | Medium |
| NCKU 成大 | 校友聯絡中心 (school) "VIP卡及校友卡特約商店名單" | https://alumni.ncku.edu.tw/p/412-1004-19459.php?Lang=zh-tw → PDFs e.g. https://alumni.ncku.edu.tw/var/file/4/1004/img/958731090.pdf, .../216756629.pdf, .../723484358.pdf | PDF tables (編號/商店/折扣內容/電話/傳真/地址) | est. 100+ (hotels, food, medical) | 113-07-15 and 114-01-07 versions | **Partly**: mostly 校友卡/職員證; some shops also accept 學生證 | Medium (clean text PDF tables) |
| NCKU 成大 | 人事室 優惠專區 | http://pers.ncku.edu.tw/p/412-1029-20048.php?Lang=zh-tw | HTML (RPage) | dozens | — | Staff-oriented | Medium |
| NCKU 成大 | 成大醫院員工消費合作社 | https://nckuhscc.hosp.ncku.edu.tw/p/426-1065-1.php?Lang=zh-tw | HTML | dozens | ongoing | No (hospital staff only) | n/a |
| NCU 中央 | 校友服務中心 (school) "中大校友證福利" | https://in.ncu.edu.tw/alumni/web/benefits.php (also https://ncu.edu.tw/asc/benefits.php); filters `?type=snack`, `?type=school`, `?area=` | HTML, paginated, category and area filters, keyword search | **large**: pagination reaches page=240 in the index (likely 200+ entries incl. history) | some entries dated, e.g. 欣葉 until 2025-12-31 (expired) | **Partly**: mostly 校友證; some also 教職員證; a few (e.g. 立橙茶飲) also 學生證 | Easy–Medium (structured HTML, query params) |
| NCHU 中興 | 校友中心 / 總務處 (school) 特約商店 | https://alumni.nchu.edu.tw/vstore.php?page=4 ; https://alumniapp.nchu.edu.tw/web/vstore.php | HTML paginated list with 優惠對象 and 期限 fields | est. 100+ (≥9 pages) | entries show 期限 such as 2025-12-31 and 2026-09-14 | **Yes, mostly**: many marked 教職員工生及校友; some 教職員工 only | **Easy** (structured, includes expiry and eligibility) |
| NCHU 中興 | 總務處 "【特約商店】" news posts | e.g. https://oga.nchu.edu.tw/news-detail/id/1293 (台灣虎航 9折, 2025-06-01–12-31) | HTML posts, one per merchant | dozens of posts 2025–2026 | 2025–2026 | Yes, often 教職員工、學生及眷屬 | Medium |
| NCHU 中興 | 總務處 category PDF (住宿交通) | https://oga.nchu.edu.tw/upfile/file/5d3a12b98a66cc99b8cc9d2d40e73dedb4cf8390.pdf | PDF table (商店/優惠內容/優惠對象/地址電話/合約期限) | — | — | Yes | Medium |
| NCHU 中興 | 人事室 old list | https://person.nchu.edu.tw/admin/upload/國立中興大學特約商店一覽表(107.01.17).pdf | PDF | — | 2018-01-17 (stale) | Yes | skip |
| NTNU 師大 | 校友中心 (school) "特約優惠" | https://alumni.ntnu.edu.tw/Welfare?itemid=14&mid=16 | HTML, one detail page per merchant, grouped (生活 etc.) | dozens | ongoing | **Partly**: alumni-first; some (神威影印、桌弄) list 教職員/學生/校友 | Medium (list → detail pages) |
| NTNU 師大 | 總務處 師大生活便利通 | http://www.ga.ntnu.edu.tw/service/int_shop/a02.html | HTML | campus shops | — | Yes | Easy |
| NTUST 臺科大 | 秘書室 (school) 校內轄下提供優惠商店一覽表 | https://www.secretariat.ntust.edu.tw/var/file/63/1063/img/367/400107869.pdf | PDF table (地點/廠商/營業時間/折扣/商品類型/電話) | ~15–25 on-campus shops | 2024-05-21 | **Yes** (學生證/教師證) | Medium |
| NTUST 臺科大 | 秘書室 校友福利 (校外優惠商店) | https://www.secretariat.ntust.edu.tw/p/412-1063-6931.php?Lang=zh-tw | HTML | unknown | — | Alumni-focused | Medium |
| TMU 北醫 | 人力資源處 (staff benefits) | http://tmu-hr.tmu.edu.tw/zh_tw/b2019/b3 | HTML | ~10 hotels plus airline/HSR | ~2021 (stale) | No (staff) | skip |
| TMU 北醫 | 學生會 | not found in index (likely IG/FB only) | — | — | — | — | Hard |
| TCU 慈濟 | 醫學系系學會 (department student assoc.) | https://medclub.tcu.edu.tw/特約商店/ (= https://medclub.tcu.edu.tw/?page_id=1241) | HTML (WordPress) | **~10 currently valid** (幽靈餐車, 旭屋和風洋食, 瓦克茶飲中山店, 大好き丼物, 八方悅鍋物, legendezo傳說咖啡甜點屋, 海豚遇見貓, 火鍋世家花蓮國聯店, Country Mothers, 瑞樂絲早午餐) | not visible | Yes, but **only for members who paid 系學會費**; mostly 95折 | Easy (single page), but small |
| TCU 慈濟 | 人事室 (staff) | https://personnel.tcu.edu.tw/wp-content/uploads/2017/09/unnamed-file-56.pdf | PDF | — | 103-01-15 (stale) | No | skip |
| *(bonus)* CMU 中國醫大 | 中國醫藥大學學生會 (student_org) | https://www.twcmusa.org/discount/ and /store/<name>/ pages | HTML (WordPress, one post per store, structured) | dozens (Taichung 北區/西屯) | posts 2020–2024 | **Yes**: 學生證 | **Easy**, and a good model for a student-org source |
| *(bonus)* KSU 崑山科大 | 學校 特約商店 | https://bir.ksu.edu.tw/cr/public/application/ksulife/store | HTML app list | dozens (Tainan) | — | Yes (學生證/教職員證/校友證) | Easy |
| *(skip)* NTU/NTNU/NTUST | 臺大系統學生會 特約平台 | https://sites.google.com/gapps.ntnu.edu.tw/system | Google Site | — | — | Yes | covered by the other agent |

**Pattern:** at most schools the canonical list sits with the **人事室 (staff welfare)** or the **校友中心 (alumni card benefits)**, not a student office. Students usually qualify because these lists say "出示服務證、校友證或學生證". Student-association lists (政大, 成大, 清大, 中央, 北醫) are mostly on Facebook/Instagram and are not indexed.

## Extraction targets, in priority order

1. **NCHU 中興 vstore list**: https://alumni.nchu.edu.tw/vstore.php?page=1..N. Richest structured HTML; it has 優惠對象 (eligibility) and 期限 (expiry), which map straight to our schema. Region: central.
2. **NCU 中央 benefits.php**: https://in.ncu.edu.tw/alumni/web/benefits.php?page=N. Structured HTML with category/area filters. Filter for entries that mention 學生證 or 教職員證 and drop expired ones. Region: north (Taoyuan).
3. **NCCU 政大 benefit_vendor**: https://www.alumni.nccu.edu.tw/benefit_vendor. Single HTML page; most entries are student-eligible. Region: north.
4. Also worth doing: NYCU's ODS 明細表 (structured and recently updated, 2026-09-17), the NTHU 人事室 category pages, the NCKU alumni PDFs (south), and TCU medclub (east, ~10 rows).

Hosts to allow: `alumni.nchu.edu.tw`, `alumniapp.nchu.edu.tw`, `oga.nchu.edu.tw`, `in.ncu.edu.tw`, `www.alumni.nccu.edu.tw`, `hr.nycu.edu.tw`, `person.site.nthu.edu.tw`, `alumni.ncku.edu.tw`, `medclub.tcu.edu.tw`, `www.secretariat.ntust.edu.tw`, `alumni.ntnu.edu.tw`, `www.twcmusa.org`, `unimarket.tw`.

## Competitors and aggregators

| Platform | What it offers | Student verification | Taiwan relevance |
|---|---|---|---|
| **UniMarket 大學市集** (unimarket.tw) | Campus second-hand marketplace (per-school pages, e.g. /university/ntu), student housing, and a **merchant back-office for posting student deals** (商家註冊/商家 App). Blog "台灣大學生優惠懶人包" (/blog/taiwan-student-discounts). | Same-school verification through **student ID number or campus email** | Direct competitor for the merchant side. Its deals are merchant-posted, not school-sourced. Marketing claims (5% fee, "0 詐騙") were not independently verified. |
| **UNiDAYS** | Global student-deal app with a zh-TW site (myunidays.com/TW/zh-TW); in Taiwan used mainly as the **verifier for Apple Education Store and Apple Music student pricing** | School email, school portal SSO, or student-ID upload (must show name, school, expiry); re-verify yearly | Mostly global brands; no local merchants |
| **Student Beans** | Global student-deal app with a digital student ID shown at checkout | Mostly .edu-style email | No Taiwan local merchants found (Bubble CiTea / Milksha listings are under the UK) |
| **ISIC 國際學生證** | Paid card with travel/global discounts; issuable in Taiwan | Proof of enrollment at issuance | Travel-oriented, few local deals |
| Brand-direct student programs | e.g. 台鐵大學生優惠票 (2026-08-17 to 2027-08-16), 小米台灣學生優惠 | Show student ID, or send documents to support | One-off deals that could be indexed as national entries |
| **北部大學學生會聯盟 NUSAL** (historic) | Joint student-union discount card across ~16 northern universities (reported in 淡江時報) | Membership card | Appears defunct; shows demand for cross-school pooling |

**CampusPass gap:** none of these index the **official school/student-association lists**, which hold hundreds of hyper-local, campus-adjacent deals with explicit eligibility. UniMarket is the closest local rival on merchants, but it is merchant-self-serve.

## Recommended expansion order

1. **NCHU 中興** (central): best structure, with eligibility and expiry fields; adds a new region.
2. **NCCU 政大** (north): one clean HTML page, mostly student-eligible, near the NTU user base.
3. **NTHU 清大 + NYCU 陽明交大** (Hsinchu, north): large 人事室 lists that accept 學生證. NYCU's ODS was updated 2026-09-17. Both can be done in one Hsinchu push.
4. **NCU 中央** (Taoyuan): large list, but mostly alumni-card offers; filter it.
5. **NCKU 成大** (south): PDF tables; adds the south region. Pair with KSU's HTML list for Tainan density.
6. **TCU 慈濟 medclub** (east): small (~10) and needs dues membership, but it is the only east-region source. CMU 學生會 (Taichung) is a strong optional central add.
7. **NTUST / NTNU own lists**: mostly campus shops or alumni-first; low priority since the 臺大系統學生會 platform already covers their students.
8. **TMU 北醫**: no current public list found; reach out to 學生會 directly.
