# Coverage survey: every Taiwanese university and college, plus nationwide company perks (2026-10-23)

> **This is a report only; it contains no deal records.** It answers one question: what official partner-discount lists exist that CampusPass hasn't covered yet?
>
> - **School list:** the 教育部 directory, open data `https://stats.moe.gov.tw/files/opendata/u1_new.json` (fetched 2026-10-23). Its latest school year, 115, has **139 institutions**.
> - **Already covered:** 21 schools are already extracted or surveyed (NTU, NTNU, NTUST, NCU, NCKU, NCHU, NCCU, NTHU, NYCU, NSYSU, CCU, NTPU, Taipei Tech, TMU, FJU, TKU, SCU, PCCU, KSU, CMU, TCU; see the other files in `data/sources/`).
> - **This survey:** covers the other **118**, plus nationwide student perks that brands offer directly.
>
> **Method:**
> - Four research agents each took about 30 schools, and a fifth took brand perks. They worked to the rules in `docs/worker.md`: only pages actually fetched with curl, no TLS bypass, no http downgrade, and downloaded content treated as untrusted.
> - I re-fetched the headline claims myself on 2026-10-23, and they matched:
>   - 東華: 200; about 135 table rows; 「學生證」 appears 124 times
>   - 屏科大 WP API: `X-WP-Total: 77`
>   - 中臺 人事室 table: about 50 rows
>   - 新生醫護, 中山醫, 高餐 學生會: all 200
>   - 臺鐵 大學生優惠: 「自乘車日115年8月17日起至116年8月16日止」, 5折/7折/8折
> - Counts marked `~` or `≥` are approximate, or lower bounds where a list is paginated or loaded by JS.
>
> **Limits:**
> - The shared WebSearch budget ran out partway through each agent's run. About 10 small schools got only one search and were then crawled from their unit homepages.
> - **Not verifiable:** about 20 schools could not be reached at all — TLS errors, connection resets or 403s through this environment's proxy. Nothing is reported for them from search snippets. They should be retried from another network.

## Coverage at a glance

| | Schools |
|---|---|
| In the 教育部 directory (115) | 139 |
| Already in CampusPass (extracted or surveyed) | 21 |
| Surveyed here | 118 |
| … official list found and fetched | about 60 (some staff-only, alumni-only or stale) |
| … not verifiable (TLS, reset, 403/503) | about 20, for example 海大, 北藝大, 宜大, 虎科, 高醫 (403), 長榮, 戲曲學院, 正修, 開南, 亞洲, 僑光, 中信, 華夏, 崇右, 仁德, 馬偕護專, 聖母 |
| … nothing official found | about 35 |

**Brand-direct perks:** 36 were checked on official pages (35 live, 1 expired). Many more remain unverified leads; see the brand section.

## Best next extractions (value = listings × student eligibility × ease)

| Rank | School | Source (verified URL) | Publisher | Listings | Students | Difficulty |
|---|---|---|---|---|---|---|
| 1 | 國立東華大學 | https://ga.ndhu.edu.tw/p/412-1006-13996.php?Lang=zh-tw | 總務處事務組 | ~125–135 | Yes, 「出示教職員證或學生證」 | 1 (HTML table) |
| 2 | 中山醫學大學 | https://personnel.csmu.edu.tw/p/403-1012-387.php?Lang=zh-tw (+ linked tables) | 人力資源室 | ~90 | Per-row 教職員/學生/校友 columns | 1–2 |
| 3 | 南臺科技大學 | Google Site `sites.google.com/stust.edu.tw/appointed-store` | 校友中心 | ~82 counted in 3 of 8 categories (likely 120+) | Many 「學生/教職員/校友」 | 2 |
| 4 | 國立屏東科技大學 | https://npustalumni.npust.edu.tw/easycard/special-store/ (WP API `/wp-json/wp/v2/firm-list`, 77) | 校友服務中心 | 77 | Mainly 校友證; some 教職員生 | 2 |
| 5 | 國立高雄餐旅大學 | https://sta.nkuht.edu.tw/store.htm | 學生會 (student_org) | ~52 | Yes, 「憑學生證及教師識別證」 | 2 |
| 6 | 中臺科技大學 | https://personnel.ctust.edu.tw/p/412-1026-1671.php | 人事室 | ~38 | Yes, 「本校教職員、學生、校友」 | 2 |
| 7 | 中原大學 | 校友證-特約商家 page (see details) | 校友服務 | 99 | ~20 also take 學生證 | 3 |
| 8 | 東海大學 | thupr.thu.edu.tw/play.php | 校友 / 公共事務 | ~43 | Several take 學生證 | 2 |
| 9 | 台鋼科技大學 | https://ord.tsust.edu.tw/var/file/10/1010/img/242/605095100.pdf (115.01.16) | 研發處 | ~55 | Per-row 優惠對象, many students | 3 |
| 10 | 新生醫護管理專科學校 | https://www.hsc.edu.tw/p/404-1000-35585.php?Lang=zh-tw | school | 13 | Yes | 1 |
| 11 | 大仁科技大學 | 總務處 HTML table (see details) | 總務處 | ~12 | Yes, terms to 117/12/31 | 1 |
| 12 | 國立臺東大學 | 人事室 XLSX (115.09.17) | 人事室 | ~29 | Mixed | 2 |

**Also large:**
- 國立高雄科技大學 (~150, mostly staff)
- 國立臺灣體育運動大學 (~130 names, but the terms are in a Google Sheet that needs sign-in)
- 台南應用科技大學 (~250 rows in a 2024 PDF, mostly expired; current data moved into an app)
- 實踐大學 (~112, few for students)
- 靜宜大學 (116, staff only)
- 國立屏東大學 (97 from the 學生會, but the PDF is from 2021)

**Mostly staff-only:** 高雄大學 (≥98), 元智 (81), 弘光 (87; xlsx dated 2026-07-20, ~12 rows for students), 雲科大 (~50) and 體育大學 (~45).

## Summary table: all 118 schools surveyed

Columns as reported by the survey agents. "not verifiable" means every fetch failed; nothing was taken from search snippets.

| School | Best source | Publisher (level) | Format | Listings | Last updated | Students? | Difficulty |
|---|---|---|---|---|---|---|---|
| 國立臺灣海洋大學 | alumni.ntou.edu.tw (unreachable) | 校友服務中心 (school) | HTML (per search) | not verifiable | n/a | n/a | n/a |
| 國立高雄師範大學 | sso.nknu.edu.tw 員工福利資訊 | 人事室 (school) | HTML index → per-store contract PDFs | ~31 | contracts to 1160131; Sept 2026 PDF | Yes, the contract template says 服務證(或學生證) | 4 |
| 國立彰化師範大學 | alumni.ncue.edu.tw 校友特約商店 | 校友服務中心 (school) | HTML (4 category pages) | 3 in 美食 (others not counted) | 2026-09-02 | No, 校友證 | 2 |
| 國立嘉義大學 | website.ncyu.edu.tw 員工生活服務 | 人事室 (school) | news-post list (mixed topics) | 18 pages × 10 posts, mixed | 2026/05/15 | Not stated | 5 |
| 國立高雄大學 | personnel.nuk.edu.tw 高大特約商店 | 人事室 (school) | HTML per-store pages + PDF | ≥98 | 2026 (lodging updated 1150831) | No, 憑教職員證 | 3 |
| 國立東華大學 | ga.ndhu.edu.tw 校外特約商店 | 總務處事務組 (school) | HTML table + contract PDFs | ~125 | end dates to 117年 | Yes, 出示教職員證或學生證 | 1 |
| 國立暨南國際大學 | b003.ncnu.edu.tw 特約商店公告名單 | 人事室 (school) | DOCX | 15 | docx modified 2024-04-17 | Mostly 本校服務證; one entry for 學生 | 3 |
| 國立雲林科技大學 | aex.yuntech.edu.tw 特約商店 | 人事室 (school) | HTML names + per-store contract PDFs | ~50 | contracts to 1171231 | No, 出示員工證 | 4 |
| 國立屏東科技大學 | npustalumni.npust.edu.tw 校友證優惠列表 | 校友服務中心 (school) | WordPress HTML (+REST JSON) | 77 | latest post 2025-01-02 | Mostly 校友證; some 教職員生 | 2 |
| 國立臺北藝術大學 | w3.tnua.edu.tw | n/a | n/a | not verifiable (TLS error) | n/a | n/a | n/a |
| 國立臺灣藝術大學 | alu.ntua.edu.tw/Home/Store 商家優惠 | 校友聯絡中心 (school) | HTML cards (JS paging) | ≥17 | not shown | Mixed: 校友證 / 學生證 | 2 |
| 國立臺東大學 | psn.nttu.edu.tw 特約商店一覽表 | 人事室 (school) | XLSX (7 sheets) | ~29 | 115.09.17 | Mixed: 職員證 / 學生證 | 2 |
| 國立宜蘭大學 | alumni.niu.edu.tw (unreachable) | 校友服務中心 | n/a | not verifiable | n/a | n/a | n/a |
| 國立聯合大學 | personnel.nuu.edu.tw 115年度特約商店 | 人事室 (school) | PDF table | 36 | 2026-09-09 | Mostly 教職員; a few name 學生 | 3 |
| 國立虎尾科技大學 | personnel.nfu.edu.tw (unreachable) | 人事室 | n/a | not verifiable | n/a | n/a | n/a |
| 國立臺南藝術大學 | secretariat.tnnua.edu.tw 特約商店 | 秘書室 (school) | HTML lists + contract PDFs | ~30 | dates to 2027 | Mixed: 教職員工生 / 教職員工 | 3 |
| 國立臺南大學 | personnel.nutn.edu.tw 特約廠商 | 人事室 (school) | HTML table | 18 | 2026/10/12 | Not stated | 4 |
| 國立臺北教育大學 | nothing found | n/a | n/a | n/a | n/a | n/a | n/a |
| 國立臺中教育大學 | person.ntcu.edu.tw 特約商店名單 | 人事室 (school) | PDF (67 pp, contracts) | 12 | 115.8.12 | Mostly staff | 4 |
| 國立澎湖科技大學 | ee.npu.edu.tw 特約商店 | 電機系 (department) | news posts | 5 | 2026-10-02 | Yes, 學生證 | 3 |
| 國立勤益科技大學 | nothing found | n/a | n/a | n/a | n/a | n/a | n/a |
| 國立體育大學 | person.ntsu.edu.tw 人事好康網專區 | 人事室 (school) | HTML names → PDFs/images | ~45 | not shown | No, 僅供同仁 | 4 |
| 國立臺北護理健康大學 | nothing found | n/a | n/a | n/a | n/a | n/a | n/a |
| 國立高雄餐旅大學 | sta.nkuht.edu.tw/store.htm | 學生會 (student_org) | HTML cards, 7 pages | ~52 | 115/01/18 | Yes, 憑學生證及教師識別證 | 2 |
| 國立金門大學 | ecasc.nqu.edu.tw 校友證特約商店 | 就業輔導暨校友服務中心 (school) | HTML table | ~20 | end dates to 119年 | Mixed (some 在學學生) | 2 |
| 國立臺灣體育運動大學 | sites.google.com/gm.ntus.edu.tw/alumnicard | 學務處校友暨就業服務組 (school) | Google Site names + Google Sheet (login-gated) | ~130 | 2026/05/06 | Partly: 校友證、教職員證或學生證(部分特約限定對象) | 4 |
| 國立臺中科技大學 | secretary.nutc.edu.tw PDF | 秘書室 (school) | PDF table | ~20 | PDF 2025-05-26 | Yes, 學生、教職員、校友 | 3 |
| 國立臺北商業大學 | nothing found | n/a | n/a | n/a | n/a | n/a | n/a |
| 國立屏東大學 | pers.nptu.edu.tw 特約廠商一覽表.pdf | 人事室, list negotiated by 學生會 (school) | PDF | 97 | PDF 2021-05-11 (110學年) | Students (憑卡) | 3 |
| 國立高雄科技大學 | personnel.nkust.edu.tw 特約商店 | 人事室 (school) | HTML list + PDFs | ~150 | dates to 1161231 | Mostly staff; 44 marked 校友適用; some 學生會簽約 適用教職員工生 | 3 |
| 國立臺灣戲曲學院 | none (TLS fail) | n/a | n/a | n/a | n/a | n/a | not verifiable |
| 國立臺南護理專科學校 | nothing found | n/a | n/a | 0 | n/a | n/a | n/a |
| 國立臺東專科學校 | personnel.ntc.edu.tw 特約商店 | 人事室 (school) | HTML index of scanned-contract PDFs | 6 | contracts 115/1/1–115/12/31 | No (員工 服務證); 學生自治會 page says 「持續籌備中」 | 4 |
| 東海大學 | thupr.thu.edu.tw/play.php | 公共事務暨校友服務處 (school) | HTML | ~43 | contract end dates up to 2027/3/27 | Partly (學生證、職員證、校友證 on several) | 2 |
| 中原大學 | alumni.cycu.edu.tw 校友證-特約商家 | 校友服務暨資源發展處 (school) | HTML (name list + modal detail) | 99 | expiry dates seen up to 115年12月 | Partly (校友證 mainly; some 學生證) | 3 |
| 逢甲大學 | ga.fcu.edu.tw/ctrtst/ | 總務處 (school) | HTML page; no list in fetched HTML | 0 visible | n/a | Yes in policy (教職員工服務證或學生證) | 5 |
| 靜宜大學 | psn.pu.edu.tw 特約商店 | 人事室 (school) | HTML directory linking to contracts | 116 | n/a | No (本校教職員證) | 3 |
| 長庚大學 | cgu.edu.tw/cgubenefit 特約廠商清單 | 教職員工福利委員會 (school) | HTML | ~30 | 114年11月9日更新 | Mostly staff; a few 職員證、學生證（含校友證） | 2 |
| 元智大學 | web2.yzu.edu.tw/profit-2024 特約商店 | 福利委員會 (school) | HTML | 81 | end dates up to 116.12.31 | Mostly staff; a few student rates | 2 |
| 中華大學 | personnel.chu.edu.tw 特約商店優惠資訊 PDF | 人事室/福委會 (school) | PDF (17 pp, partly images) | 15 | PDF 2025-07-31 | Partly (員工識別證或學生證 on some) | 3 |
| 大葉大學 | bulletin.dyu.edu.tw 福委會特約商店 PDF | 福委會 (school) | PDF | ~34 | 更新日期 104/12/08 (stale) | Partly (教職員、學生) | 3 (stale) |
| 華梵大學 | nothing found | n/a | n/a | 0 | n/a | n/a | n/a |
| 義守大學 | sa1.isu.edu.tw 集團-學生優惠 (single perk) | 學務處 (school) | HTML | 1 (group hospitals) | n/a | Yes (學生證) | 5 (no merchant list) |
| 世新大學 | po.web.shu.edu.tw 福利/特約商店 | 人事室 (school) | HTML | ~28 | 特約期 to 115/116年12月 | Mostly staff; medical entries 教職員工生 | 2 |
| 銘傳大學 | nothing current | n/a | n/a | 0 | n/a | n/a | n/a |
| 實踐大學 | welfare.usc.edu.tw 特約商店一覽表 | 教職員工福利互助委員會 (school) | HTML tables (4 categories) | ~112 | end dates to 119/12/31 | Mostly staff (先出示教職員證); ~9 rows include 學生 | 2 |
| 朝陽科技大學 | hr.cyut.edu.tw 特約商店 / 優惠廠商相關訊息 | 人資處 (school) | HTML posts | 12 | n/a | Staff (專任教職員工) | 4 |
| 高雄醫學大學 | personnel.kmu.edu.tw 本校特約商店一覽表 | 人力資源室 (school) | 403 Access Denied | n/a | n/a | n/a | not verifiable |
| 南華大學 | welfare2.nhu.edu.tw 特約商店 | 福利互助委員會 (school) | HTML (2 visible) + images | 2 visible | 優惠效期 2021-12-31 (stale) | Yes (教職員工證或學生證) | 4 (stale) |
| 真理大學 | alumni.au.edu.tw 特約商店總攬 | 校友與公共關係組 (school) | HTML posts | 11 | n/a | Mostly staff; 高鐵 全校教職員工生 | 3 |
| 大同大學 | nothing found | n/a | n/a | 0 | n/a | n/a | n/a |
| 南臺科技大學 | sites.google.com/stust.edu.tw/appointed-store | 校友中心 (school) | Google Sites (8 categories) | 82 in 3 of 8 categories (est. 120+) | 截止日期 mostly 永久有效 | Yes (優惠對象：學生/教職員/校友/之友 on ~35 of 82) | 2 |
| 嘉南藥理大學 | nothing found | n/a | n/a | 0 | n/a | n/a | n/a |
| 樹德科技大學 | nothing found (202 empty bodies) | n/a | n/a | 0 | n/a | n/a | n/a |
| 中山醫學大學 | personnel.csmu.edu.tw 特約商店 (飲食&育樂 / 住宿&租車) | 人力資源室 (school) | HTML tables with eligibility columns | ~90 | 資料更新 2026/12/30 & 2025/12/30; index 2026-10-20 | Yes (columns 教職員/學生/校友/附醫) | 1–2 |
| 龍華科技大學 | nothing (only single-vendor 駕訓班 posts) | 校友服務中心 | HTML posts | n/a | n/a | n/a | n/a |
| 輔英科技大學 | fyasc.fy.edu.tw 校友卡特約廠商 | 職發與校友中心 (school) | HTML | 21 | n/a | No (校友卡; 教職員工 員工證) | 3 |
| 明新科技大學 | admin.must.edu.tw 特約資訊 | 總務處事務組 (school) | HTML (9 categories) | 22 in 4 of 9 categories (est. 30–45) | end dates up to 115年12月31日 | Partly (學生攜帶學生證 on several) | 2 |
| 長榮大學 | www TLS fail; dweb health page (clinics only) | 衛生保健組 (school) | HTML | clinics only | 114/1/1–115/12/31 | Yes (學生證) for clinics | not verifiable (merchant list) |
| 弘光科技大學 | ewc.hk.edu.tw 特約商店清單 xlsx | 員工福利委員會 (school) | XLSX + HTML posts | 87 | xlsx modified 2026-07-20 (「115.07.20更新」) | Mostly staff; some 學生證 | 2 |
| 健行科技大學 | none on own site (only listed as a member of the 桃園區大專院校福利聯盟, per VNU's page) | – | – | – | – | – | – |
| 正修科技大學 | sa.csu.edu.tw/shop_vip.php (search lead; unreachable) | 學務處/學生會? (unverified) | HTML? | ? | ? | not verifiable | – |
| 萬能科技大學 | administration.vnu.edu.tw/oga/2407 + 8-school XLS/ODS | 總務處 (school) | XLS/ODS | not parsed (8-school alliance file) | file saved 2016-11-22; page footer 2026-10-07 | "讓本校全體師生一起享受優惠" (出示識別證) | 4 |
| 玄奘大學 | 人事室 福利天地 › 特約店家資訊 (DOCX) | 人事室 (school) | DOCX table | ~24 | page 2025-12-16; terms to 116.12.31 | No: "攜帶教職員識別證" | 2 |
| 建國科技大學 | 在學學生 page links "學校特約商店" (link dead, 404) | 總務處? (school) | – | 0 reachable | link file from 2019 | – | – |
| 明志科技大學 | cfw.mcut.edu.tw 明志科大特約廠商 | 教職員工福利委員會 (school) | HTML | 3 | terms to 115/12/31 | No: "憑職員證" | 2 |
| 台鋼科技大學 | ord.tsust.edu.tw 特約商店列表 PDF | 研究發展處 (school) | PDF (11 pp) | ~55 | 製表日期 115.01.16 (2026-01-16) | Partly: 優惠對象 column (教職員/學生/校友) | 3 |
| 大仁科技大學 | a06.tajen.edu.tw 學校特約商店 | 總務處 (school) | HTML table | ~12 | latest terms start 115/9/9; ends to 117/12/31 | Yes: "請主動出示教職員證或學生證" | 1 |
| 聖約翰科技大學 | pr.sju.edu.tw 校友專屬優惠方案 | 校友總會 (alumni assoc.) | HTML index + per-deal pages | ~35 | Last-Modified 2026-03-16 | No: 校友 only | 3 |
| 嶺東科技大學 | www.ltu.edu.tw 特約績優商店 (食/醫/住/行/其他) | main site, unit not stated (school) | HTML, one page per store | ~18 in 食 alone | sample posted 2019-05-28, term ended 108/12/31 | Sample says "優惠限教職員工使用" | 3 |
| 中國科技大學 | 總務處 校園資訊 › 學生會特約商店 (Google Doc) | 學生會 via 總務處 page (student_org) | Google Doc table | ~11 | no date | Yes: "全校師生憑本校證件…" | 2 |
| 中臺科技大學 | personnel.ctust.edu.tw 特約商店 | 人力資源處/人事 (school) | HTML table | ~38 | terms to 115/12/31 | Yes: "優惠身份：本校教職員、學生、校友" | 2 |
| 亞洲大學 | nothing found | – | – | – | – | – | TLS not verifiable |
| 開南大學 | general.knu.edu.tw notice (search lead; unreachable) | 總務處 (unverified) | – | ? | ? | not verifiable | – |
| 佛光大學 | nothing found | – | – | – | – | – | – |
| 台南應用科技大學 | secret.tut.edu.tw 特約廠商 PDF + 特約活動訊息 posts; renewals now in app | 秘書室 公共事務暨校友服務組 (school) | PDF (49 pp) + HTML posts + app | ~250 rows in the PDF | PDF 2024-05-03 (terms to 114/12/31); 2026 notice dated 2026-04-21 | Yes: per-row columns 教職員工證/學生證/校友學思卡 | 3 (PDF) / 5 (app) |
| 中信科技大學 | alumni.ctbctech.edu.tw "特約商店" (contract template only) | 校友發展中心 (school) | PDF template | 0 | 2026-01-08 template | Template says "教職員、學生和校友" | – |
| 元培醫事科技大學 | nothing found | – | – | – | – | – | – |
| 景文科技大學 | nothing found | – | – | – | – | – | – |
| 中華醫事科技大學 | secretary.hwai.edu.tw 特別商店 (特約商店一覽表) | 主任秘書室 (school) | HTML table | ~17 | no date on page | Partly: "出示證件"; some rows "華醫學生及職員" | 2 |
| 東南科技大學 | nothing found | – | – | – | – | – | – |
| 德明財經科技大學 | nothing found | – | – | – | – | – | – |
| 南開科技大學 | nothing found | – | – | – | – | – | – |
| 中華科技大學 | nothing found (career.cust.edu.tw 503) | – | – | – | – | – | – |
| 僑光科技大學 | alumni.ocu.edu.tw 新增特約商店 posts (search lead; TLS fail) | 校友會 (unverified) | – | ? | ? | not verifiable | – |
| 育達科技大學 | nothing found (site unreachable) | – | – | – | – | – | – |
| 美和科技大學 | gad.meiho.edu.tw 特約商店 (5 categories) | 總務處 (school) | HTML, one page per store | ~31 | no page dates; one sample term 109–110 | Mostly: "(適用教職員工證、學生證、校友證)" | 3 |
| 吳鳳科技大學 | 人事室 "2025教職員生福利" XLSX | 人事室 (school) | XLSX (6 sheets) | ~25 | posted 2026-05-19 (公告期限 to 2026-12-31) | Mixed: some rows "教職員證、學生證", 2 sheets 教職員-only | 2 |
| 修平科技大學 | 學生自治會 特約列表 (Google Sheet) + 特約地圖 | 學生自治會 (student_org) | Google Sheet + Google My Map | ~27 | latest news 2024-10-08 | Yes: "出示學生證即可享有優惠" | 2 |
| 長庚科技大學 | cguaa.cgust.edu.tw 特約廠商 | 校友會 (alumni assoc.) | HTML, one post per store (2 pages) | ~11–20 | latest post: contract from 115/3/15 | Mostly alumni ("出示校友會會員卡"); latest post adds "學校師生憑教職員證/學生證" | 3 |
| 臺北城市科技大學 | per.tpcu.edu.tw (telecom notices only) | 人事室 (school) | HTML notices | 0 real partner list | notice says 115.07.31止 (expired) | No (staff and family) | n/a |
| 敏實科技大學 | nothing found | – | – | 0 | – | – | n/a |
| 醒吾科技大學 | b002.hwu.edu.tw 校友特約商店 | 學務處 校友服務中心 (school) | HTML (AJAX) | 0 (empty placeholder) | – | Not stated (aimed at alumni) | n/a |
| 文藻外語大學 | nothing found | – | – | 0 | – | – | n/a |
| 華夏科技大學 | not verifiable (connection reset) | – | – | ? | – | – | – |
| 致理科技大學 | welfare.chihlee.edu.tw 特約廠商 | 福利委員會 (school) | HTML list plus PDF attachments | about 5 on page 1 of "共 2 頁" | not seen | No (staff welfare committee) | 3 |
| 康寧大學 | ga.ukn.edu.tw notice (one bedding vendor) | 總務處 (school) | HTML notice | 1 | 2026 (from the title) | Probably dorm students; not verified | 4 |
| 宏國德霖科技大學 | alumnus.hdut.edu.tw 校友優惠方案 | 校友會 (school) | "Under construction" image | 0 | site shows 2026-07-30 | – | n/a |
| 崇右影藝科技大學 | not verifiable (connection reset) | – | – | ? | – | – | – |
| 台北海洋科技大學 | nothing found | – | – | 0 | – | – | n/a |
| 亞東科技大學 | nothing found | – | – | 0 | – | – | n/a |
| 馬偕醫學大學 | nothing found | – | – | 0 | – | – | n/a |
| 中信金融管理學院 | sa.ctbc.edu.tw 特約商店 (lead) | 學務處 (school) | ? | ? | ? | Snippet says 學生證 (unverified) | not verifiable (TLS) |
| 南亞技術學院 | nothing found | – | – | 0 | – | – | n/a |
| 黎明技術學院 | nothing found (only 國旅卡 and 公教 forwards) | – | – | 0 | – | – | n/a |
| 德育護理健康學院 | nothing found (contract template only) | – | – | 0 | – | – | n/a |
| 法鼓文理學院 | nothing found | – | – | 0 | – | – | n/a |
| 馬偕醫護管理專科學校 | not verifiable (timeout) | – | – | ? | – | – | – |
| 仁德醫護管理專科學校 | oga.jente.edu.tw 特約廠商 (lead) | 總務處 (school) | ? | ? | snippet: 112 contracts | Snippet says 員工識別證 (unverified) | not verifiable (reset) |
| 樹人醫護管理專科學校 | nothing found | – | – | 0 | – | – | n/a |
| 慈惠醫護管理專科學校 | nothing found | – | – | 0 | – | – | n/a |
| 耕莘健康管理專科學校 | orphaned legacy 人事室 福利快訊 page | 人事室 (school) | static HTML | 1 page seen | not dated (legacy) | No (員工識別證) | 4 |
| 敏惠醫護管理專科學校 | b009.mhchcm.edu.tw 特約商店 (lead) | 學務處 (school) | ? | ? | snippet: 107年 | Snippet says 教職員工或學生證 (unverified) | not verifiable (reset) |
| 育英醫護管理專科學校 | nothing found | – | – | 0 | – | – | n/a |
| 聖母醫護管理專科學校 | not verifiable (TLS) | – | – | ? | – | – | – |
| 新生醫護管理專科學校 | www.hsc.edu.tw 特約廠商一覽表 | school main site (unit not named) | HTML table | 13 | one expiry 112.12.31; the rest 無期限 | **Yes**: 學生證 | 1 |
| 崇仁醫護管理專科學校 | cjc.edu.tw 人事室 特約商店 | 人事室 (school) | HTML index plus scanned-image PDFs | 18 (2 pages) | PDFs dated 2023 to 2024; site footer 2026/10/22 | Not stated in the index | 4 |
| 臺北市立大學 | sec.utaipei.edu.tw 特約服務商店 | 秘書室 (school) | HTML posts plus PDF contracts | ≥19 currently shown | end dates up to 116/12/31 | **Some**: 教職員工及在學學生 (義美); others staff-only | 3 |

## Brand-direct student perks (nationwide)

Research date: 2026-10-23. Every perk in the "Verified" sections comes from an official page fetched with `curl -sS -L --max-time 30`. Raw HTML is saved under `(session scratchpad)/wide/brands/raw/` and the fetch log (id, URL, HTTP status, final URL, bytes) is in `raw/status.tsv`. Quoted terms are copied from the fetched page. I did not use search snippets as facts.

Notes on method:
- The WebSearch budget ran out partway through. After that I only reached official sites whose URLs I already had or could find by following links from their homepages. Banks, food chains, airlines, lodging and the big cinemas stay mostly in "unverified leads".
- Some pages blocked the fetch (Cloudflare or Akamai 403) or the connection was reset. I did not try to work around any of these. They are listed as leads.
- Pages whose content loads with JavaScript (YouTube, KKBOX's main site, NTCH, the UNiDAYS offer list) gave little or no text. I report only what the static HTML says.

### Summary table

| # | Company / perk | Category | Scope | Who qualifies (short) | Price / discount (short) | Validity / end date | HTTP |
|---|---|---|---|---|---|---|---|
| 1 | 台灣高鐵 大學生優惠 | transport | Taiwan | ROC college/university students (excludes open university) | 50% / 75% / 88% of full fare on designated trains | None stated; THSR may change or end it | 200 |
| 2 | 臺鐵 大學生優惠措施 | transport | Taiwan | ROC college/university students | 50% / 70% / 80% of full fare, reserved trains, 50 km or more | Travel dates 2026-08-17 to 2027-08-16 | 200 |
| 3 | Apple 教育商店 (education pricing) | shopping | Global, TW store | Current and incoming college students, plus staff | Education pricing (amounts load with JS) | None stated | 200 |
| 4 | Lenovo 教育商店 | shopping | Global, TW store | Verified students and educators | Extra discount all year; NT$3,300 off NT$46,700 welcome code; up to 50% off selected items | Year-end and 11.11 promos; no date given | 200 |
| 5 | GitHub Student Developer Pack | education | Global | Enrolled in a degree or diploma program, age 13 or older | Free partner offers | None stated | 200 |
| 6 | GitHub Copilot Student | education | Global | Verified GitHub Education students | Free Copilot features | None stated | 200 |
| 7 | JetBrains Student Pack | education | Global | Full-time students, or vocational program of 1 year or more | Free | None stated | 200 |
| 8 | Notion Education Plan | education | Global | Students with a school email (WHED-listed school) | Free | Re-verify yearly | 200 |
| 9 | Figma for Education | education | Global | Verified students and educators | Free | None stated | 200 |
| 10 | Microsoft Office 365 A1 | education | Global | Students with an eligible school email | Free | While enrolled | 200 |
| 11 | Microsoft 365 進階版 for students | education | Global, TW page | College students with a school email | 12 months free | "限時優惠期間內" (limited time), no date | 200 |
| 12 | Azure for Students | education | Global | Students with a school email | Free, no credit card; renew yearly | Yearly renewal | 200 |
| 13 | Unity Student | education | Global | Degree-program students; secondary students aged 16 or older | Free Unity Pro and bundled assets | None stated | 200 |
| 14 | Ableton Live EDU | education | Global | Full-time students aged 18 or older (and others, see block) | 50% off Live | None stated | 200 |
| 15 | Miro Education (Student) | education | Global | Students (application required) | Free plan, 10 members, 2 years | 2 years | 200 |
| 16 | Spotify Premium Student | entertainment | Global, TW price | Students at accredited higher-ed schools, age 18 or older | 1 month free, then NT$88/month | Up to 4 years | 200 |
| 17 | Apple Music 學生方案 | entertainment | Global, TW price | Verified college students | NT$90/month or NT$900/year, plus Apple TV | "優惠限時提供", no date | 200 |
| 18 | KKBOX 學生方案 | entertainment | Taiwan | MOE-recognised college or senior-high students, age 25 or under | NT$480 for 180 days / NT$960 for 360 days | None stated | 200 |
| 19 | 國立自然科學博物館 (Taichung) | entertainment | Taiwan (central) | Students aged 12 or older | Exhibits NT$90 (vs NT$120) | None stated | 200 |
| 20 | 國立臺灣博物館 (Taipei) | entertainment | Taiwan (north) | Students | Half price NT$15 (vs NT$30); 4-venue pass NT$65 | None stated | 200 |
| 21 | 臺北市立美術館 | entertainment | Taiwan (north) | Students aged 12 or older | NT$15 (vs NT$30) | None stated | 200 |
| 22 | 臺北市立天文科學教育館 | entertainment | Taiwan (north) | Domestic students or ISIC holders | Exhibits NT$20 (vs 40); dome theater NT$50 (vs 100) | Fee table revised 2022-07-13 | 200 |
| 23 | 臺北市立動物園 | entertainment | Taiwan (north) | Students with a valid student ID or ISIC | NT$50 (vs NT$100) | None stated | 200 |
| 24 | 國立海洋生物博物館 (Pingtung) | entertainment | Taiwan (south) | University students and above with a valid ID | NT$250 (vs NT$450) | None stated | 200 |
| 25 | 國立臺灣歷史博物館 (Tainan) | entertainment | Taiwan (south) | Students | NT$50 (vs NT$100) | None stated | 200 |
| 26 | 國立臺灣科學教育館 (Taipei) | entertainment | Taiwan (north) | Students with proof | NT$90 (vs NT$120), 2026 rates | Fees revised from 2026-01-01 | 200 |
| 27 | 國立臺灣史前文化博物館 (Taitung) | entertainment | Taiwan (east) | Students at MOE-registered schools | NT$60 (vs NT$100); free on Wednesdays | Wednesday free: 2026-01-01 to 2026-12-31 | 200 |
| 28 | 國立科學工藝博物館 (Kaohsiung) | entertainment | Taiwan (south) | Individuals with a student ID | NT$90 (vs NT$120) | None stated | 200 |
| 29 | 台北當代藝術館 MOCA | entertainment | Taiwan (north) | Students from junior high up | NT$50 (vs NT$100) | None stated | 200 |
| 30 | 臺北市立兒童新樂園 | entertainment | Taiwan (north) | Students with a valid student ID | Entry NT$15 (vs NT$30) | None stated | 200 |
| 31 | 臺中國家歌劇院 中臺灣超級學生方案 | entertainment | Taiwan (central only) | Students in central counties who are U23 members | Low-price seats (amount not stated) | None stated | 200 |
| 32 | 奇美博物館 (Tainan) | entertainment | Taiwan (south) | Students at Tainan schools free; ages 7-22 discounted | Free / NT$150 (vs NT$200) | None stated | 200 |
| 33 | 遠傳電信 學生限定方案 | services | Taiwan | Students (proof not stated on page) | NT$288/month or NT$588/month plans | None stated | 200 |
| 34 | ISIC 國際學生證 (issued in TW by 中華民國國際青年旅舍協會) | services | Global card, TW issuer | Students aged 12 or older | NT$400 per card; valid 1 year | 1 year from issue | 200 |
| 35 | UNiDAYS Taiwan | services | Global, TW region | Students | Free sign-up; brand offers load with JS | None stated | 200 |
| 36 | Google AI Pro 學生方案 (Taiwan) | education | Taiwan | ROC college students aged 18 or older | 1 year free | **Expired**: apply-by date was 2025-12-09 | 200 |

That is 36 perks checked on official pages (35 live, 1 expired), below the target of 40. The gap is in the categories listed under "unverified leads".

---

### Transport

#### 1. 台灣高鐵 (THSR): 大學生優惠
- **Category:** transport. **Scope:** Taiwan-specific.
- **URL:** https://www.thsrc.com.tw/ArticleContent/530e869c-479d-441a-a4b4-61a8166827e9 (HTTP 200)
- **Discount:** "中華民國大專院校在學學生可享高鐵指定車次標準車廂對號座全額票價 5 折、75 折或 88 折優惠。"
- **Who qualifies:** "中華民國大專院校包含大專、專科、軍警學校、宗教院校，但不包含空中大學、空中學院及大專院校附設之進修補習班。學制包含二專、五專、二技、四技、大學、碩士、博士。部別包含日間部、夜間部、進修部（需為上述學制）、在職專班（需為上述學制）。"
- **Proof:** "乘車時應攜帶本人實體學生證正本以備查驗，未持本人實體學生證正本者應照章補票，本公司並得加收票價差額之 50% 違約金。學生證必須蓋有當學期註冊章方為有效，若無當學期註冊章、註冊章模糊無法辨識或免蓋註冊章之學生證，須合併出示當學期「在學證明」正本作為輔助證明。前述「在學證明」得為紙本或事先下載之電子版格式。"
- **Other terms:** "本專案不得與其他優惠（如優待票、團體票、兌換券及早鳥優惠等促銷方案）合併使用。" The proof of enrolment counts until 3/31 for semester 1 and until 10/31 for semester 2.
- **Validity:** no end date given. "台灣高鐵公司保有調整或終止本專案之權利。"
- **Regions:** THSR runs Nangang to Zuoying only, so north, central and south, not east.

#### 2. 臺鐵 (Taiwan Railway Corp.): 大學生優惠措施
- **Category:** transport. **Scope:** Taiwan-specific.
- **URL:** https://www.railway.gov.tw/tra-tip-web/tip/tip00C/tipC21/view?proCode=8ae4cac29f6728ef019f6a9b514f0ceb&subCode=8ae4cac29f6728ef019f6a9e06f70cf0&lang=zh_TW (HTTP 200; page says "最後更新時間：2026/09/30")
- **Who qualifies:** "凡具中華民國大專院校在學學生身分者，得於本公司指定車次購買 對號列車 車票，並依本措施享有差別折扣優惠。適用學校包含經教育主管機關核准設立之大學、專科學校、技術學院、軍警院校及宗教院校等(含教育實習學生)；不適用社區大學、空中大學、空中學院及各校附設進修補習班學生。適用學制包含二專、五專、二技、四技、大學、碩士班及博士班；日間部、夜間部、進修部及在職專班學生均得適用。"
- **Discount:** "凡具適用資格者，可享指定對號車次全票票價5折、7折或8折優惠。本優惠依各車次及乘車日所屬星期提供不同折扣，同一車次於不同星期可能適用不同折扣，售完為止。" Applies only to "乘車區間里程50公里以上之對號列車車票".
- **Proof:** "旅客乘車時應攜帶本人有效學生證正本（或其他足資證明在學身分之文件）". If the student ID is missing, a government photo ID plus one of: 在學證明, 錄取／入學通知, 入學證明, 註冊單據, 繳費證明, 就學貸款證明文件, 實習學生證. Items 2 to 6 are accepted only in summer (6/19–10/31) and winter (1/10–3/31).
- **Penalty:** "以原價補票，並加收百分之五十票款".
- **Excluded:** "團體票、騰雲座艙、自由座、無座票及鐵公路聯運票(含加價聯運票)不適用".
- **Validity:** "本優惠措施實施期間，自乘車日115年8月17日起至116年8月16日止。" So **expires_on 2027-08-16**.

### Shopping (hardware education stores)

#### 3. Apple: 教育商店 (education pricing)
- **Category:** shopping. **Scope:** global program, TW store.
- **URL:** https://www.apple.com/tw-edu/store (HTTP 200)
- **Who qualifies:** "① 適用於在校及新入學大專院校學生以及各年級的教職員工。 請參閱 條款 ，了解更多相關資訊。"
- **Price:** product prices load with JavaScript and are not in the HTML I fetched.
- **Validity:** none stated.

#### 4. Lenovo: 教育商店 (student benefits)
- **Category:** shopping. **Scope:** global program, TW store.
- **URL:** https://www.lenovo.com/tw/zh/education/ redirected to https://www.lenovo.com/tw/zh/lenovo-edu/student/benefits/ (HTTP 200)
- **Terms:** "加入全球超過一百萬名已驗證的學生及教育工作者行列", "所有產品均可全年額外折扣。", "註冊成功後，優惠碼將透過電子郵件發送。 顧客使用所提供的優惠碼，消費滿 NT$46,700 即可享 NT$3,300 迎新優惠。", "限時優惠！ 於 Lenovo 教育商店購買指定平板電腦、螢幕及配件產品，最高可享 50% 折扣。"
- **Proof:** verification is required, but the page does not name the method.
- **Validity:** the 11.11 and year-end promos have no dates. The all-year extra discount has no end date.

### Education (software and AI)

#### 5. GitHub Student Developer Pack
- **Category:** education. **Scope:** global.
- **URLs:** https://education.github.com/pack (HTTP 200) and https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student (HTTP 200)
- **Who qualifies:** "You qualify for GitHub Education if you: Are enrolled in a degree- or diploma-granting program, such as a high school, college, university, or homeschool. Provide documents that prove your current student status. … Own a GitHub personal account. Are at least 13 years old."
- **Proof:** "A picture of your school ID with current enrollment date / Your class schedule / Your transcript / An affiliation or enrollment verification letter". Some schools also require an academic email.
- **Sample partner offers on the pack page:** "Free access to 25+ Microsoft Azure cloud services plus $100 in Azure credit. For students aged 18+."; Namecheap "1 year domain name registration on the .me TLD." and "1 SSL certificate free for 1 year."
- **Validity:** none stated for the pack. Individual partner offers have their own terms.

#### 6. GitHub Copilot Student
- **Category:** education. **Scope:** global.
- **URL:** https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students (HTTP 200)
- **Terms:** "Get free access to Copilot's premium features as a verified student." "Verified students on GitHub Education get free access to Copilot's features." "To become a verified student, see Apply to GitHub Education as a student."
- **Validity:** none stated.

#### 7. JetBrains: Student Pack
- **Category:** education. **Scope:** global.
- **URLs:** https://www.jetbrains.com/community/education/ redirected to https://www.jetbrains.com/academy/student-pack/ (HTTP 200; page title "Free JetBrains Student Pack"), and https://www.jetbrains.com/legal/docs/toolbox/license_educational/ (HTTP 200)
- **Who qualifies (from the agreement, "Version 4.2, effective as of May 01, 2024"):** "“student” is an individual who studies full-time at a recognized educational institution (university, college, high school) or is enrolled full-time or part-time in a vocational educational program that lasts no less than 1 year, and upon request from JetBrains is able to provide proof of their ac[ademic status]…"
- **Price:** free (page title). The rest of the landing page loads with JavaScript.
- **Validity:** none stated.

#### 8. Notion: Education Plan
- **Category:** education. **Scope:** global.
- **URL:** https://www.notion.com/help/notion-for-education (HTTP 200)
- **Terms:** "The Education Plan for individual students and teachers: a free plan for a one-member workspace. It’s available for students or teachers signed in with their education institution's email per the WHED." "Individual students and teachers at accredited colleges and universities can upgrade to the Education Plan for free at any time."
- **Proof:** the school email must be the account's main email. "To stay on the plan, verify your student status once a year with your school email." "Each school email can claim the student offer just once, for one workspace."
- **Validity:** ongoing, with yearly re-verification.

#### 9. Figma for Education
- **Category:** education. **Scope:** global.
- **URL:** https://www.figma.com/education/ (HTTP 200)
- **Terms:** "Figma’s design tools, free for education". "Verified students and educators get free access to Figma." "Eligible education users get full access to Figma’s AI toolkit, including Figma Make…"
- **Validity:** none stated.

#### 10. Microsoft: Office 365 A1 (教育版)
- **Category:** education. **Scope:** global, TW page.
- **URL:** https://www.microsoft.com/zh-tw/education/products/office (HTTP 200)
- **Terms:** "擁有符合資格教育機構電子郵件地址的教育工作者和學生可以 免費取得 Office 365 A1 。" The page says the plan lasts as long as you work at or are enrolled in an eligible institution.
- **Validity:** while enrolled.

#### 11. Microsoft: Microsoft 365 進階版, free for college students
- **Category:** education. **Scope:** global offer on the TW page.
- **URL:** same page as #10 (HTTP 200), section "大專院校生專屬優惠"
- **Terms:** "學生免費：AI 與生產力訂閱服務的終極方案 / 限時優惠期間內，使用您的大專院校電子郵件，即可免費取得 12 個月 Microsoft 365 進階版。 2". Footnote [2] reads only "適用相關條款".
- **Validity:** "限時優惠期間內" (limited time). No end date on the page. The dedicated page https://www.microsoft.com/zh-tw/microsoft-365/college-student-pricing returned a "Your request has been blocked" body, so I could not read the full terms.

#### 12. Microsoft: Azure for Students
- **Category:** education. **Scope:** global.
- **URL:** https://azure.microsoft.com/en-us/free/students/ (HTTP 200)
- **Terms:** "Build in the cloud with Azure for Students for free". "Use your school email to sign up and renew yearly while you’re a student." "No credit card required". The GitHub pack listing adds "$100 in Azure credit. For students aged 18+."
- **Validity:** renews yearly.

#### 13. Unity Student
- **Category:** education. **Scope:** global.
- **URL:** https://unity.com/products/unity-student redirected to https://unity.com/cn/products/unity-student (HTTP 200; machine-translated Simplified Chinese page)
- **Terms:** "通过免费的 Unity Student 计划，您将获得：最新版本的 Unity Pro 编辑器 / 免费的 Odin Inspector 和 Validator 教育许可证 / Premium Synty 资源包 / 访问 Unity Cloud 生态系统"
- **Who qualifies:** "大专院校学生 正规学位授予机构的学生。" For secondary students: "资格要求：年满 16 岁、就读于官方认可的教育机构…"
- **Validity:** none stated.

#### 14. Ableton: Live for students
- **Category:** education. **Scope:** global.
- **URL:** https://www.ableton.com/en/shop/education/ (HTTP 200)
- **Discount:** "Students and teachers: save 50% on Live … you can save 50% on a new Ableton Live Intro, Standard or Suite license."
- **Who qualifies:** "a student who is 18 or over and enrolled in full-time education, up to advanced degree programs."; "a parent or guardian buying on behalf of a student who is under 18."; "a student in a part-time program that consists of 20 or more hours of study per week, or one that runs for 12 months or more."
- **Proof:** "upload a copy of your student or teacher ID."
- **Validity:** the licence stays valid after graduation. The offer has no end date.

#### 15. Miro: Education (Student plan)
- **Category:** education. **Scope:** global.
- **URL:** https://miro.com/education/ redirected to https://miro.com/education-whiteboard/ (HTTP 200)
- **Terms:** "If you're a student, an educator, or a school, you can apply for a Miro account." Student plan: "Free … 10 team members / 2 years / Unlimited boards / 1 workspace, unlimited projects …"
- **Validity:** 2 years per the plan card.

#### 36. Google: AI Pro student offer (Taiwan), EXPIRED
- **Category:** education. **Scope:** Taiwan.
- **URL:** https://blog.google/intl/zh-tw/products/explore-get-answers/ai-pro-student-offer/ (HTTP 200)
- **Terms:** "本方案的適用對象為台灣境內年滿 18 歲、持有有效學生證的大專院校學生；申請期間為即日起至 2025 年 12 月 9 日止，有效期為開通後的 12 個月。"
- **Status:** the application window closed on 2025-12-09. The current global page https://gemini.google/students/ (HTTP 200, as served to this fetcher) says: "The free Google AI Pro student offer is available to eligible U.S. college students ages 18+." **Do not list.**

### Entertainment

#### 16. Spotify: Premium Student
- **Category:** entertainment. **Scope:** global program, TW pricing.
- **URL:** https://www.spotify.com/tw/student/ (HTTP 200)
- **Price:** "學生可免費使用 Premium 1 個月 … 之後每月只要 $88。可隨時取消。"
- **Who qualifies:** "只要是在獲認證的大專院校註冊就讀，同時年滿 18 歲，就符合資格。你可以享受 Premium Student 最多四年。"
- **Proof:** "我們透過第三方服務 SheerID 來確認你是否註冊在學。"
- **Validity:** up to 4 years. Re-verify every 12 months. After graduation the plan becomes Individual at "月費 $168".

#### 17. Apple Music: 學生方案 (includes Apple TV)
- **Category:** entertainment. **Scope:** global program, TW pricing.
- **URL:** https://www.apple.com/tw-edu/store (HTTP 200), footnote ②
- **Terms:** "僅適用於新訂戶。訂閱方案將根據所選方案自動續訂，每月 NT$90 或每年 NT$900，直到取消為止。僅限大專院校學生與教育工作者。須通過驗證。…優惠限時提供；優惠可能隨時終止。" "免費收看 Apple TV 的學生優惠將於用戶不再符合資格，或不再續訂 Apple Music 學生方案後終止。"
- **Validity:** "優惠限時提供", no date given.

#### 18. KKBOX: 學生方案
- **Category:** entertainment. **Scope:** Taiwan-specific.
- **URL:** https://ssl.kkbox.com/tw/billing/index.php (HTTP 200; linked from https://www.kkbox.com/tw/tc/)
- **Price:** "學生優惠 / 每月平均只要 80 元 / 支援無損音質 … 聽半年 買 90 天驗證後再送 90 天 $480 /單次 180 天 / 聽整年 買 180 天驗證後再送 180 天 $960 /單次 360 天"
- **Who qualifies:** "只要你是教育部承認之大專院校及高中職在學學生（ 查詢網址 ），且年齡為 25 歲（含）以下者，都可以申請學生方案". Documents are required, but the page does not list them.
- **Validity:** none stated.

#### 19. 國立自然科學博物館 (National Museum of Natural Science, Taichung)
- **URL:** https://www.nmns.edu.tw/ch/visit/ticket/ (HTTP 200; "2026/09/24 更新")
- **Terms:** "12 歲以上學生 … 展示場 NT $90 | 太空劇場 NT $100 | 必可飛劇場 NT $70 | 植物園溫室 NT $20 | 科學中心 NT $20". General public pays "展示場 NT $120". "享優惠票價請憑證購買".
- **Scope:** Taiwan, venue in Taichung (central). **Validity:** none stated.

#### 20. 國立臺灣博物館 (National Taiwan Museum, Taipei)
- **URL:** https://www.ntm.gov.tw/cp.aspx?n=5444 (HTTP 200)
- **Terms:** "全票：每張 30元｜半票：每張 15元 / 四館聯票 全票：130元 ｜半票：65元". "＊半票優待：學生、6至12歲兒童…". "持優待或免費票券，請備妥有效證件，方得享有優惠。"
- **Scope:** Taipei (north). **Validity:** none stated.

#### 21. 臺北市立美術館 (Taipei Fine Arts Museum)
- **URL:** https://www.tfam.museum/Common/editor.aspx?id=230&ddlLang=zh-tw (HTTP 200)
- **Terms:** "普通票:30 (一般民眾。)". "優待票:15 (六歲以上未滿十二歲之兒童、十二歲以上學生（不含社區大學或學分班等短期進修）、持教育或文化機構義（志）工證者。)"
- **Scope:** Taipei (north). **Validity:** none stated.

#### 22. 臺北市立天文科學教育館 (Taipei Astronomical Museum)
- **URL:** https://tam.gov.taipei/cp.aspx?n=4193F69A8290441E (HTTP 200)
- **Terms ("收費基準表 （111年7月13日修訂）"):** exhibit "普通票 40", "優待票 20 … 二、國內各級學校或持有國際學生證之在校學生。". Theater "普通票 100", "優待票 50 … 二、國內各級學校或持有國際學生證之在校學生。"
- **Scope:** Taipei (north). **Validity:** none stated.

#### 23. 臺北市立動物園 (Taipei Zoo)
- **URLs:** https://www.zoo.gov.taipei/cp.aspx?n=763493FD7ECCAA11 (HTTP 200) for prices, and https://www.zoo.gov.taipei/cp.aspx?n=763493FD7ECCAA11&s=F3BC09EC36168CB6 (HTTP 200) for ticket types
- **Price:** "普通 臺北市民 優待 團體 / 100 60 50 70".
- **Who qualifies:** "在校學生出示有效期間學生證或ISIC國際學生證（不含社區大學、語言中心或學分班等短期進修）". Students are exempt from the nationality or residence limit that applies to other discount groups.
- **Proof:** "凡符合優惠條件者，請於入場時主動出示有效證件，未攜帶者恕不享有優惠！"
- **Scope:** Taipei (north). **Validity:** none stated.

#### 24. 國立海洋生物博物館 (NMMBA, Pingtung)
- **URL:** https://www.nmmba.gov.tw/cp.aspx?n=A6476B49BA86BBD5 (HTTP 200)
- **Terms:** "全票 450 元 一般民眾。" "優待票 250 元 a. 6歲(含)以上之學童(身高達115公分以上)、大學(含)以上持有效學生證者、… b. 應屆畢業生請持當年度准考證或當年度入學通知並連同身分證件購買優待票；空中大學請持學生證及該年度之選課卡購買優待票". "未攜帶者一律依全票計。(票價若有更動，以現場公告為準)"
- **Scope:** Pingtung (south). **Validity:** none stated.

#### 25. 國立臺灣歷史博物館 (NMTH, Tainan)
- **URL:** https://www.nmth.gov.tw/cp.aspx?n=4089 (HTTP 200)
- **Terms:** "全票 NT$100 一般觀眾 / 優待票 NT$50 學生、6歲以上未滿12歲兒童、…"
- **Scope:** Tainan (south). **Validity:** none stated.

#### 26. 國立臺灣科學教育館 (NTSEC, Taipei)
- **URL:** https://www.ntsec.gov.tw/article/detail.aspx?a=23 (HTTP 200)
- **Terms:** "本館各類票券自115年1月1日起調整收費標準". "常設展門票（3-6樓） 全票 ：120元 / 優待票 ：90元 / ✨ 優待票適用對象及說明： 學生憑證: 90元/人".
- **Scope:** Taipei (north). **Validity:** the 2026 fee schedule; no end date.

#### 27. 國立臺灣史前文化博物館 (NMP, Taitung)
- **URL:** https://www.nmp.gov.tw/cp.aspx?n=1973 (HTTP 200)
- **Terms:** "全票 NT$ 100 一般民眾 … 優待票 NT$ 60 … 2.持教育部立案學校有效學生證者". "● 教師及學生優惠 ：每週三憑相關證件，可免費參觀。（優惠期間 115/01/01~115/12/31）"
- **Scope:** Taitung (east). **Validity:** the Wednesday free entry ends **2026-12-31**. The standing NT$60 student ticket has no end date.

#### 28. 國立科學工藝博物館 (NSTM, Kaohsiung)
- **URL:** https://www.nstm.gov.tw/Reference/VisitorInformation/Price.htm (HTTP 200)
- **Terms:** "全票(一般觀眾) 120 元 / 優待票 1. 持有學生證個人。 2. 20人以上一般團體。 90 元". "凡購優待票及符合免費條件者，敬請出示有關證件，未攜帶者一律以原票價計。"
- **Scope:** Kaohsiung (south). **Validity:** none stated.

#### 29. 台北當代藝術館 (MOCA Taipei)
- **URL:** https://www.mocataipei.org.tw/tw/Visit/時間與票價 (HTTP 200)
- **Terms:** "一般票 一般民眾 NT$ 100 / 優待票 持下列有效證件者 NT$ 50 … 國中以上在校學生證"
- **Scope:** Taipei (north). **Validity:** none stated.

#### 30. 臺北市立兒童新樂園 (Taipei Children's Amusement Park)
- **URL:** https://www.tcap.taipei/cp.aspx?n=EE083F2DED91AB99 (HTTP 200)
- **Terms:** "門票（入園後，設施額外付費） 全票 30元 … 優待票 （購票時，應主動出示身分證明文件） 15元 … 持有效學生證之在學學生(外國在學學生須持有效期之國際數位學生證) 。"
- **Scope:** Taipei (north). **Validity:** none stated.

#### 31. 臺中國家歌劇院 (NTT): 中臺灣超級學生方案
- **URL:** https://www.npac-ntt.org/membership/service (HTTP 200)
- **Terms:** "中臺灣超級學生方案：歌劇院主辦節目開放大劇院20個座位、中劇院10個座位，供學生以低價購票觀賞". "凡設籍於苗栗、彰化、臺中、南投、雲林縣市或在前述縣市之教育部立案公私立各級學校，具U23會員身份者即可購買。每場限購1張。入場須出示學生證，未出示證件者請於現場補足全價差額，並加收100元補票手續費。" U23 membership: "申辦資格： 23歲(含)以下民眾。"
- **Price:** "低價" only. The page gives no amount.
- **Scope:** central Taiwan only, not nationwide. **Validity:** none stated.

#### 32. 奇美博物館 (Chimei Museum, Tainan)
- **URL:** https://www.chimeimuseum.org/visit (HTTP 200)
- **Terms:** "全票 NT$200 一般民眾 / 優惠票 NT$150 7-22 歲 * 限持附有照片及出生日期之有效證件". Free entry: "於臺南市就讀之學生 * 限持政府立案之臺南學校有效學生證者；不適用於空中大學、在職進修、社區大學、學習/語言中心"
- **Note:** the discount nationwide is age-based (7–22), not student-based. The student perk (free entry) covers Tainan schools only.
- **Scope:** Tainan (south). **Validity:** none stated.

### Services

#### 33. 遠傳電信 (FET): 學生限定方案
- **Category:** services. **Scope:** Taiwan-specific.
- **URL:** https://fetnet.tw/e16ElQ0SEM redirected to https://www.fetnet.net/estore/exclusive/neweighteen/index.html (HTTP 200)
- **Terms:** "學生方案吃到飽 單門號 288 起". "學生限定方案 月付 $288 … 上網：4GB 網內：每月送 30分鐘 網外：每月送 30分鐘 市話：每月送 40分鐘". "月付 $588 學生限定方案 上網：4G吃到飽不限速 網內：每月送 40分鐘 網外：每月送 40分鐘 市話：每月送 60分鐘".
- **Gaps:** the page states no eligibility rule, proof or contract length for the student plans. The page also shows promos ending 2026-10-31, but those belong to other plans.
- **Validity:** none stated for the student plans.

#### 34. ISIC 國際學生證 (issued in Taiwan by 社團法人中華民國國際青年旅舍協會)
- **Category:** services (verification card). **Scope:** global card, Taiwan issuer.
- **URLs:** https://www.yh.org.tw/page/about/index.aspx?kind=10 (HTTP 200), with https://www.isic.org/ (HTTP 200) for the global programme
- **Who qualifies:** "年滿 12 歲（含）之中華民國教育部公佈認可學校在校學生（以辦卡當日為基準日）。" Also non-MOE schools and students heading abroad. "「在校學生」係指 全年上課時間達 12 周及每周達 15 小時以上". "每 年 9月1日 起需以 新學年上學期 在學證明辦理。"
- **Price:** "ISIC國際學生證卡證費 新台幣400元" (from 2024/06/05). Mail handling costs extra.
- **Proof:** "含有註冊章或貼紙 的學生證影本(雙面)", or 在學證明 / 繳費證明 and similar.
- **Validity:** "效期為發卡日起一年有效". The Taipei Zoo (#23), the Taipei Astronomical Museum (#22) and the Children's Amusement Park (#30, for foreign students) all name ISIC as accepted proof. isic.org: "thousands of discounts worldwide".
- **Note:** https://www.isic.tw/ failed through the proxy (CONNECT 502).

#### 35. UNiDAYS: Taiwan region
- **Category:** services (verification platform). **Scope:** global, with a TW region.
- **URL:** https://www.myunidays.com/TW/zh-TW (HTTP 200)
- **Terms:** page title "UNiDAYS - 為學生提供快速、免費、獨家的折扣". The footer shows region "台灣". The brand offers load with JavaScript, so I could not see which brands are live in Taiwan.
- **Validity:** n/a.
- Student Beans (https://www.studentbeans.com/, HTTP 200): the country picker shows no Taiwan. Treat it as not available.

---

### Unverified leads (official page not fetched, blocked, or terms missing)

| Lead | What blocked it | Where to look |
|---|---|---|
| 國立故宮博物院 student ticket | npm.gov.tw returned 403 (Cloudflare "Attention Required") on both the zh and en pages | npm.gov.tw ticket page |
| 國家兩廳院 (NTCH) student discounts | npac-ntch.org loads with JS; HTML has no content | NTCH / OPENTIX ticket rules |
| 衛武營 student discounts | npac-weiwuying.org returned 403 | Weiwuying ticketing |
| 威秀影城 student/優待票 | vscinemas.com.tw returned 403 | VieShow price page |
| 國賓影城 | pages fetched (HTTP 200) but no student or price terms found | ambassador.com.tw cinema pages |
| 美麗華影城 優待票 | https://www.miramarcinemas.tw/Home/dazhiprice (HTTP 200) lists "優待 Concession Ticket" (e.g. 標準2D NT$320 vs 全票 NT$350) and "請出示每一位購買優待票者之有效證件", **but does not say students qualify** | ask Miramar |
| 秀泰影城, 新光影城 | showtimes.com.tw returned 403; skcinemas.com connection reset | |
| 國光客運 student fares | kingbus.com.tw connection reset (3 tries) | |
| 統聯客運 | ubus.com.tw fare pages (HTTP 200) show no student fare; I found none | |
| 高雄捷運 student card | krtc.com.tw connection reset | |
| 中華電信 學生方案 | official student URLs I tried returned 404; homepage has no student link | cht.com.tw |
| 台灣大哥大 學生方案 | taiwanmobile.com pages returned 404 or reset | |
| YouTube Premium 學生方案 (TW) | youtube.com/premium/student is JS-only; the support URL returned 404 | |
| Adobe Creative Cloud student pricing | adobe.com and helpx.adobe.com returned 403 | |
| Autodesk education (free for students) | autodesk.com returned 403 | |
| Canva, Tableau for Students | 403 | |
| Samsung education store TW | the URLs I guessed returned 404 | |
| ASUS 教育優惠方案 | asus.com/tw/store/education (HTTP 200) shows only "學生/教師/教職人員，立即加入享華碩教育優惠方案！"; the program page special-offers.asus.com/tw returned 403 | |
| Dell student discount TW | the URL redirected to the homepage; no terms | |
| Microsoft 365 student pricing page | returned a "request has been blocked" body | |
| Banks (student accounts or cards) | no official bank page reached. Search results were third-party blogs (e.g. the rule for full-time students: up to 3 card issuers and NT$20,000 limit each). That is a regulatory rule, not a perk | each bank's site |
| Food chains (王品 brands, 海底撈, 品田牧場 student-ID promos) | third-party news only, mostly old or seasonal | brand sites |
| Airlines student fares | no official page reached; the search budget ran out | |
| 救國團 青年活動中心 lodging | cyh.org.tw connection reset; the search budget ran out | |
| YH 青年旅舍卡 | https://www.yh.org.tw/page/about/index.aspx?kind=9 (HTTP 200): NT$600 per year card, **not student-specific** | |
| 國立海洋科技博物館, 國立歷史博物館, 國立傳統藝術中心, 新竹市立動物園, 台北101觀景台, 阿里山林業鐵路, 森林遊樂區 | connection reset, 502, 522 or 400 | |
| Cursor for students | cursor.com/students (HTTP 200) says only that offers come via campus events, with no standing student discount. Not a perk | |
| AWS Educate | aws.amazon.com (HTTP 200): "AWS Educate 對任何個人開放", so not student-specific | |

---

### Fit with CampusPass's record shape

The record shape is: a nationwide deal with `regions` set to all four, a `source_url`, `eligibility.student: true`, and an `expires_on`.

**Fit fully** (nationwide, official URL, student-only, and an explicit end date):
- **臺鐵 大學生優惠** (#2): `expires_on: 2027-08-16`.

**Fit except `expires_on`** (nationwide or online, so all four regions, with `student: true`, but the page gives no end date; you would need a null `expires_on` or a review date):
- Online or national: Spotify Premium Student (#16), Apple Music Student (#17), KKBOX (#18), Apple Edu (#3), Lenovo Edu (#4), GitHub Pack (#5), Copilot Student (#6), JetBrains (#7), Notion (#8), Figma (#9), Office 365 A1 (#10), Azure for Students (#12), Unity Student (#13), Ableton (#14), Miro (#15), ISIC card (#34), FET student plans (#33, eligibility proof unconfirmed).
- Microsoft 365 進階版 12 months free (#11) is labelled limited time with no date. Set a short review date.
- Apple Music's page also says "優惠可能隨時終止".

**Do not fit "all four regions"** (venue-bound; set `regions` to the venue's region):
- North: NTM (#20), TFAM (#21), TAM (#22), Taipei Zoo (#23), NTSEC (#26), MOCA (#29), Children's Amusement Park (#30).
- Central: NMNS (#19). NTT super-student (#31) is also limited by school county.
- South: NMMBA (#24), NMTH (#25), NSTM (#28), Chimei (#32, the student perk is Tainan schools only).
- East: NMP (#27). Its Wednesday free entry has `expires_on: 2026-12-31`.
- **THSR (#1)** covers north, central and south, not east, and has no end date.

**Exclude:** Google AI Pro TW (#36, expired 2025-12-09), Cursor and AWS Educate (not student perks), and the YH card (not student-specific).

Eligibility nuance worth storing: THSR and TRA cover only ROC college-level students (no 空中大學). KKBOX also takes senior-high students up to age 25. Spotify requires age 18 or older. Most museum discounts also accept other groups (children, seniors), so the record should note that the discount is not exclusive to students.

## Per-school details (URLs fetched, HTTP status, quotes)

### 1. 國立臺灣海洋大學 — ntou.edu.tw
- **URLs fetched**:
  - http://www.ntou.edu.tw → 200 (redirected to https://www.ntou.edu.tw/). The links include 校友服務中心 https://alumni.ntou.edu.tw/.
  - https://alumni.ntou.edu.tw/ → connection reset (curl 35, 4 tries).
  - https://alumni.ntou.edu.tw/p/405-1101-93947,c11821.php → connection reset. A WebFetch retry got 503.
  - https://alumni.ntou.edu.tw/p/406-1101-71581,r1034.php → connection reset.
  - https://r084.ntou.edu.tw/index.php → connection reset.
  - https://w3.alumni.ntou.edu.tw/w3/homeweb/catalog_detail.php?ifid=772&infoscatid=8 → connection reset.
  - https://olife.ntou.edu.tw/?p=n&c=1 → 200. This is the campus dining news site, not a partner list.
- **Best list**: not verifiable. Search leads point to per-store pages on the alumni-centre site (e.g. 【基隆】恆昌商旅, 【基隆】伯爵眼鏡行), but I could not fetch any of them.
- **Format / listings / last updated / students**: not verifiable.
- **Difficulty**: n/a. Retry later from another network.

### 2. 國立高雄師範大學 — nknu.edu.tw
- **URLs fetched**:
  - http://www.nknu.edu.tw → 503 from the proxy; https://www.nknu.edu.tw/ → 200 (→ w3.nknu.edu.tw).
  - https://sso.nknu.edu.tw/Services/Web/Default.aspx?webIdx=3&menuId=230 → 200 (人事室 員工福利資訊).
  - 高師大特約商店合約 PDF (ajaxDownloadFileCourse.aspx link on that page) → 200.
- **Best list**: https://sso.nknu.edu.tw/Services/Web/Default.aspx?webIdx=3&menuId=230, published by 人事室 (school).
- **Format**: an HTML index of section headings (醫療院所, 托兒機構, 住宿, 生活服務, 其他優惠專區). Each store links to its own contract PDF.
- **Approx. listings**: ~31 named contracts (9 住宿, ~21 生活服務, 1 托兒), plus the 健康99 clinic list and a 夢時代 counter list.
- **Last-updated signal**: contract periods such as 1150201至1160131 and 1150501-1201231. Latest promo PDF: 1150801-1150930中秋節特約優惠.
- **Students eligible?**: The template contract says 「甲方員工前往乙方購物消費，憑國立高雄師範大學(含附中)服務證(或學生證)，即可享…」, so yes for template contracts. The page itself is framed as staff welfare.
- **Difficulty**: 4. The terms are only in the per-store PDFs.

### 3. 國立彰化師範大學 — ncue.edu.tw
- **URLs fetched**:
  - https://www.ncue.edu.tw/ → 200.
  - https://ncuesa.ncue.edu.tw/files/11-1037-3116.php → 404.
  - https://ncuesa.ncue.edu.tw/ → 200. The 學生會 menu links a 「特約商家地圖」 Google Maps (https://maps.app.goo.gl/RSWv4LSaKZk4Znmw8), which I did not fetch.
  - https://alumni.ncue.edu.tw/p/412-1017-1909.php → 200.
  - https://alumni.ncue.edu.tw/p/412-1017-4559.php → 200 (校友特約商店).
  - https://alumni.ncue.edu.tw/p/412-1017-4561.php → 200 (美食 category).
- **Best list**: https://alumni.ncue.edu.tw/p/412-1017-4559.php, published by 校友服務中心 (school). It has 4 categories: 住宿, 餐飲美食, 休閒娛樂, 醫療保健.
- **Format**: HTML lists, one detail page per store.
- **Approx. listings**: 美食 has 3 (養鍋石頭涮涮鍋-和美店, Miss小姐食藝空間, 藝鍋物-和美店). I did not fetch the other three categories.
- **Last-updated signal**: posts dated 2026-09-02 and 2026-07-17.
- **Students eligible?**: 「使用特約商店優惠時，請主動出示校友證」. This is 校友證 only. The 學生會 Google Maps may be the student-facing list.
- **Difficulty**: 2.

### 4. 國立嘉義大學 — ncyu.edu.tw
- **URLs fetched**:
  - http://www.ncyu.edu.tw → 200 (a JS/meta redirect stub).
  - https://website.ncyu.edu.tw/personnel/ → 200.
  - https://www.ncyu.edu.tw/personnel/ → 200.
  - https://website.ncyu.edu.tw/personnel/Node/Nodes?nodeId=38270 → 200 (員工協助方案專區).
  - https://website.ncyu.edu.tw/personnel/Subject?nodeId=44238 → 200 (員工生活服務(特約商店、福利措施)).
  - https://website.ncyu.edu.tw/personnel/Subject/Detail/223797?nodeId=44238 → 200 (本校與打貓廚房簽訂特約商店). The body text did not render; it is probably in an attachment or JS.
- **Best list**: https://website.ncyu.edu.tw/personnel/Subject?nodeId=44238, published by 人事室 (school).
- **Format**: a news-style post list that mixes 特約商店 signings with insurance and hotel promos. It has 18 pages (page=18).
- **Approx. listings**: page 1 has 10 posts, 5 of them 「本校與…簽訂特約商店」. There is no consolidated table.
- **Last-updated signal**: newest post 2026/05/15.
- **Students eligible?**: not stated on what I fetched.
- **Difficulty**: 5.

### 5. 國立高雄大學 — nuk.edu.tw
- **URLs fetched**:
  - https://www.nuk.edu.tw/ → 200.
  - https://personnel.nuk.edu.tw/p/405-1013-18831,c2508.php → 200.
  - https://www2.nuk.edu.tw/person/storelist.htm → 200 (an old static list).
  - https://personnel.nuk.edu.tw/p/412-1013-2021.php → 200 (高大特約商店 index).
  - https://personnel.nuk.edu.tw/p/412-1013-2508.php → 200 (美味的店).
  - https://personnel.nuk.edu.tw/p/412-1013-2509.php → 200 (優質住宿).
  - https://personnel.nuk.edu.tw/p/412-1013-2512.php → 200 (其它優惠).
  - https://personnel.nuk.edu.tw/p/412-1013-2510.php → 200 (便捷交通).
- **Best list**: https://personnel.nuk.edu.tw/p/412-1013-2021.php, published by 人事室 (school). It has 6 categories: 美味的店, 優質住宿, 便捷交通, 特約醫院, 幼兒托育, 其它優惠.
- **Format**: an HTML category list leading to one page per store (店名/電話/地址/優惠/網址). Some terms are only in a PDF attachment.
- **Approx. listings**: ≥98. 美味的店 has 29, 優質住宿 has 30 per page over 2 pages, 其它優惠 has 2 pages, 便捷交通 has 8. I did not count 醫院 or 托育.
- **Last-updated signal**: 「義大…【1150831新增皇家酒店優惠】」.
- **Students eligible?**: 「憑教職員證可享優惠」 / 「憑教職員證一律 9 折」. Staff only.
- **Difficulty**: 3.

### 6. 國立東華大學 — ndhu.edu.tw
- **URLs fetched**:
  - https://www.ndhu.edu.tw/ → 200.
  - https://ga.ndhu.edu.tw/p/412-1006-13996.php → 200 (校外特約商店).
  - https://dhsa.ndhu.edu.tw/p/16-1110-188997.php → 200 (學生自治會 東華黑卡特約店家; a JS shell).
  - https://api.dhsa.ndhu.edu.tw/card/store → TLS error (curl 60, certificate expired), so not verifiable.
- **Best list**: https://ga.ndhu.edu.tw/p/412-1006-13996.php, published by 總務處事務組 (school).
- **Format**: an HTML table (特約商店 / 優惠措施 / 電話及住址 / 合約期限 / 備註 / 特約契約) with contract PDFs.
- **Approx. listings**: ~125 (127 「出示…」 eligibility cells).
- **Last-updated signal**: end dates up to 117年7月1日. Most say 合約期限至 115 年12月31日 or 116年12月31日.
- **Students eligible?**: 「出示教職員證或學生證」 appears 123 times. Yes.
- **Secondary**: the 學生會 東華黑卡 list (student_org). Its data API has an expired certificate, so it is not verifiable.
- **Difficulty**: 1.

### 7. 國立暨南國際大學 — ncnu.edu.tw
- **URLs fetched**:
  - https://www.ncnu.edu.tw/ → 200.
  - https://b003.ncnu.edu.tw/p/406-1007-600,r43.php → 200.
  - https://b003.ncnu.edu.tw/var/file/7/1007/img/194/514237118.docx → 200.
- **Best list**: the DOCX, published by 人事室 (school) under 「特約商店公告名單」.
- **Format**: a DOCX table (序號/特約商店/類別/特約內容/聯絡方式).
- **Approx. listings**: 15.
- **Last-updated signal**: docx modified 2024-04-17. The latest period seen is 114年4月30日止, so the list is mostly expired.
- **Students eligible?**: mostly 「憑證」 / 「出示本校服務證」. One entry says 「本校教職員工及學生享有優惠」.
- **Difficulty**: 3.

### 8. 國立雲林科技大學 — yuntech.edu.tw
- **URLs fetched**:
  - https://www.yuntech.edu.tw/ → 200.
  - https://aex.yuntech.edu.tw/index.php?id=908&option=com_content&task=view → 200 (empty legacy page).
  - https://aex.yuntech.edu.tw/index.php/en/all-list/item/394-2022-12-03-03-58-19 → 200.
- **Best list**: the item/394 page, 「善用民間資源之福利服務措施(含員工特約商店/子女托育)」, published by 人事室 (school).
- **Format**: HTML store names grouped 食/衣/住/行/育/樂/其他. Each links to a contract PDF whose filename carries the end date.
- **Approx. listings**: ~50.
- **Last-updated signal**: the page was created 2022-12-03. Contract filenames run to 1171231.
- **Students eligible?**: 「消費時請出示 員工證」. Staff only.
- **Difficulty**: 4.

### 9. 國立屏東科技大學 — npust.edu.tw
- **URLs fetched**:
  - http://www.npust.edu.tw → 503; https://www.npust.edu.tw/ → 200 (→ wp.npust.edu.tw).
  - https://sa.npust.edu.tw/files/90-1075-1.php → 404 (學生會 食, old link).
  - https://sa.npust.edu.tw/files/90-1075-20.php → 404.
  - https://npustalumni.npust.edu.tw/easycard/special-store/ → 200.
  - https://npustalumni.npust.edu.tw/wp-json/wp/v2/firm-list?per_page=1 → 200 (X-WP-Total: 77).
- **Best list**: https://npustalumni.npust.edu.tw/easycard/special-store/, published by 職涯發展處校友服務中心 (school).
- **Format**: WordPress HTML cards (旅宿/生活/餐飲 × 北中南東). The same records are available as JSON from the WP REST endpoint `/wp-json/wp/v2/firm-list`.
- **Approx. listings**: 77 (from X-WP-Total).
- **Last-updated signal**: newest firm-list post 2025-01-02.
- **Students eligible?**: this is a 校友證 benefit list. Some entries are flagged 「(僅限屏科大教職員生)」 or 「(限屏科大教職員)」.
- **Difficulty**: 2. The data is structured JSON, but the eligibility is alumni-centric.

### 10. 國立臺北藝術大學 — tnua.edu.tw
- **URLs fetched**:
  - http://www.tnua.edu.tw → 503 (proxy upstream timeout).
  - https://www.tnua.edu.tw/ → redirected to https://w3.tnua.edu.tw/, then TLS error (curl 60: unable to get local issuer certificate).
- **Best list**: **not verifiable**. Per the hard rules I did not bypass TLS. A search lead points to a w3.tnua.edu.tw page 「最新~各餐廳(含超商)營業資訊及優惠情形」, which covers on-campus vendors only. I did not fetch it.
- **Difficulty**: n/a.

### 11. 國立臺灣藝術大學 — ntua.edu.tw
- **URLs fetched**:
  - https://www.ntua.edu.tw/ → 200 (Nuxt SPA shell).
  - https://alu.ntua.edu.tw/Home/Store → 200.
- **Best list**: https://alu.ntua.edu.tw/Home/Store 「商家優惠」, published by 校友聯絡中心 (school).
- **Format**: HTML cards (電話/地址/營業時間/營業項目/優惠內容), with a StoreDetail page per store. Pagination is JS (「下一頁」 href="#!").
- **Approx. listings**: ≥17 on page 1 (16 unique StoreDetail IDs).
- **Last-updated signal**: none shown.
- **Students eligible?**: mixed. Examples: 「現場點餐憑校友證享9折」; 「憑校友證、學生證、教師證、學校工作證…9折」; 「學校教職員、學生及校友…97折」; 「憑有效員工識別證、學生證」.
- **Difficulty**: 2.

### 12. 國立臺東大學 — nttu.edu.tw
- **URLs fetched**:
  - https://www.nttu.edu.tw/ → 200.
  - https://psn.nttu.edu.tw/p/412-1047-4886.php → 200.
  - https://psn.nttu.edu.tw/p/405-1047-117596,c4886.php → 200.
  - The xlsx download link on that post → 200.
- **Best list**: 「國立臺東大學特約商店一覽表(115.09.17更新).xlsx」, published by 人事室 (school).
- **Format**: an XLSX with 7 sheets (食/住/行/育/樂/其他/醫療), columns 商店名稱/電話/地址/優惠項目/合約期限/備註. Some entries also have contract PDFs.
- **Approx. listings**: ~29 (食 ~12, 住 6, 行 2, 育 2, 樂 3, 其他 3, 醫療 1).
- **Last-updated signal**: 115.09.17 (file modified 2026-09-17).
- **Students eligible?**: mixed. Examples: 「出示職員證」; 「憑服務證/學生證即可享優惠」; 「在校學生溫泉票價優惠」.
- **Difficulty**: 2.

### 13. 國立宜蘭大學 — niu.edu.tw
- **URLs fetched**:
  - https://www.niu.edu.tw/ → 200. The link grep found only 畢業校友.
  - https://www.alumni.niu.edu.tw/Service11.html → CONNECT tunnel failed (502).
  - https://alumni.niu.edu.tw/Service11.html → reset, then 「Received HTTP/0.9」 errors.
- **Best list**: **not verifiable**. The search snippet for the alumni page mentions 校友信用卡 特約商店 (宜蘭民宿、飯店…). That is a co-branded credit card, not a school ID list.
- **Searched**: domain searches for 「特約商店 優惠」 and 「特約廠商 優惠 教職員」. These found only bank payroll offers (property-r.niu.edu.tw) and the 人事室 健檢 page.
- **Difficulty**: n/a.

### 14. 國立聯合大學 — nuu.edu.tw
- **URLs fetched**:
  - https://www.nuu.edu.tw/ → 200.
  - https://personnel.nuu.edu.tw/p/405-1014-60238,c5796.php → 200.
  - https://personnel.nuu.edu.tw/p/412-1014-1188.php → 200.
  - https://personnel.nuu.edu.tw/p/405-1014-80811,c1188.php → 200 (115年度特約商店).
  - 115年國立聯合大學特約商店.pdf → 200.
- **Best list**: the 115年度特約商店 post and its PDF, published by 人事室 (school).
- **Format**: a PDF table (序/商店名稱/地址/電話/優惠資訊), 5 pages.
- **Approx. listings**: 36.
- **Last-updated signal**: post 最後更新日期 2026-09-09; PDF dated 2026-07-28.
- **Students eligible?**: the welfare page says 「凡出示教職員證，皆可享有不同折扣之優惠」. A few rows say otherwise, e.g. 「本校教職員工、學生、校友，憑「識別證」、「學生證」、「校友證」」. 「學生」 appears 5 times in the PDF.
- **Difficulty**: 3.

### 15. 國立虎尾科技大學 — nfu.edu.tw
- **URLs fetched**:
  - https://www.nfu.edu.tw/ → 200.
  - https://personnel.nfu.edu.tw/files/11-1008-6944.php → connection reset ×2. A WebFetch retry got 503.
  - https://alumni.nfu.edu.tw/index.php/zh/ → 200. No 特約/優惠 links.
- **Best list**: **not verifiable**. A search lead says this 人事室 page is 「教育部暨所屬機關（構）學校特約商店一覽表」, which would be a ministry-wide list. I could not fetch it.
- **Difficulty**: n/a.

### 16. 國立臺南藝術大學 — tnnua.edu.tw
- **URLs fetched**:
  - https://www.tnnua.edu.tw/ → 200.
  - https://secretariat.tnnua.edu.tw/p/412-1002-1105.php → 200 (特約商店 tabs, loaded by ajax).
  - https://secretariat.tnnua.edu.tw/p/403-1002-938-1.php → 200 (餐飲).
  - https://secretariat.tnnua.edu.tw/p/403-1002-939-1.php → 200 (飯店住宿).
  - https://secretariat.tnnua.edu.tw/p/403-1002-940-1.php → 200 (交通旅遊).
  - https://secretariat.tnnua.edu.tw/p/403-1002-944-1.php → 200 (其他).
- **Best list**: https://secretariat.tnnua.edu.tw/p/412-1002-1105.php, published by 秘書室 (school).
- **Format**: HTML numbered lists per category (name/address/phone/terms), each with a 【合約書】 PDF.
- **Approx. listings**: ~30 (餐飲 6, 住宿 12, 交通 1, 其他 12).
- **Last-updated signal**: dates up to 2027 in the text; one 「2026合約書」.
- **Students eligible?**: mixed. Examples: 「教職員工生憑證9折(永久特約)」; 「※教職員工憑證95折優惠」; 「憑職員證或學生證即享優惠」.
- **Difficulty**: 3.

### 17. 國立臺南大學 — nutn.edu.tw
- **URLs fetched**:
  - https://web.nutn.edu.tw/ → 200.
  - https://www.nutn.edu.tw/personnel/mode02.asp?m=20151223171151936&t=list → 200, but the body is a 404 「網頁不存在」 page.
  - https://personnel.nutn.edu.tw/ → 200.
  - https://personnel.nutn.edu.tw/mode02.asp?m=20151223171151936&t=list → 200 (特約廠商).
- **Best list**: https://personnel.nutn.edu.tw/mode02.asp?m=20151223171151936&t=list, published by 人事室 (school).
- **Format**: an HTML table (編號/特約廠商/優惠內容/優惠期間). The terms are very terse (e.g. 「住房優惠」 「各類優惠」).
- **Approx. listings**: 18.
- **Last-updated signal**: 「資料更新時間：2026/10/12」.
- **Students eligible?**: not stated.
- **Difficulty**: 4. The names are clean but the terms are thin.

### 18. 國立臺北教育大學 — ntue.edu.tw
- **URLs fetched**:
  - https://www.ntue.edu.tw/ → 200.
  - https://www.ntue.edu.tw/p/412-1000-2403.php (校友) → 200. No 特約/優惠/福利 links.
- **Best list**: **nothing found**.
- **Searched**: homepage and alumni link grep; domain searches for 「特約商店 優惠」, 「特約廠商 優惠 教職員」 and 「特約商店 人事室 校友 學生會」. These found only 衛保組 特約診所 (dsa.ntue.edu.tw/health/affair/138, not fetched) and bank payroll PDFs.

### 19. 國立臺中教育大學 — ntcu.edu.tw
- **URLs fetched**:
  - http://www.ntcu.edu.tw → 503; https://www.ntcu.edu.tw/ → 200.
  - https://person.ntcu.edu.tw/data/7/43 → 200.
  - 特約廠商一覽表115.8.12.pdf (person.ntcu.edu.tw/storage/media/4reuukgeppFy39fpKOnJCZfHkkj3L7dP03xoej9Y.pdf) → 200.
- **Best list**: 「特約廠商一覽表115.8.12.pdf」, published by 人事室 (school).
- **Format**: a PDF (67 pages). It has a 12-row summary table (類別/公司/優惠內容/有效期限) with mostly 「詳附件」, then scanned or attached contracts.
- **Approx. listings**: 12.
- **Last-updated signal**: 「更新日期:115年8月12日」; periods run to 118年12月31日.
- **Students eligible?**: mostly staff. The 救國團 attachment says 「教職員、學生參與本團終身學習中心研習課程優惠」.
- **Difficulty**: 4.

### 20. 國立澎湖科技大學 — npu.edu.tw
- **URLs fetched**:
  - https://www.npu.edu.tw/ → 200.
  - https://www.npu.edu.tw/form/Public_List.aspx?Parser=20,12,87,,,,,,,,,3 (校友) → 200. No relevant links.
  - https://ee.npu.edu.tw/latestevent/index?Parser=9,3,73 → 200.
- **Best list**: https://ee.npu.edu.tw/latestevent/index?Parser=9,3,73, published by the 電機工程系 department office. This is department level, not school-wide.
- **Format**: news posts, one per store.
- **Approx. listings**: 5 (晨光蝸牛早午餐, 望安CAFÉ, 蓁品紅茶, 金日發炒飯專賣店, 弗洛伊德 音樂 餐酒).
- **Last-updated signal**: newest post 2026-10-02.
- **Students eligible?**: yes, per the search lead on the Mr.大雞 post: 「本系(科)學生出示學生證者…」. I did not fetch that individual post.
- **School-level**: nothing found.
- **Difficulty**: 3.

### 21. 國立勤益科技大學 — ncut.edu.tw
- **URLs fetched**:
  - https://www.ncut.edu.tw/ → 200.
  - https://www.ncut.edu.tw/p/412-1000-406.html (校友) → 200. No relevant links.
- **Best list**: **nothing found**.
- **Searched**: three domain searches (「特約商店 優惠」, 「特約廠商 優惠 教職員」, 「特約商店 校友 優惠 學生會」). The only hit was a 學生會 election PDF that pledges to 「擴大校園周邊特約商店版圖」.

### 22. 國立體育大學 — ntsu.edu.tw
- **URLs fetched**:
  - http://www.ntsu.edu.tw → 503; https://www.ntsu.edu.tw/ → 200.
  - https://person.ntsu.edu.tw/p/412-1006-79.php → 200 (人事好康網專區).
- **Best list**: https://person.ntsu.edu.tw/p/412-1006-79.php 「福利與特約廠商專區」, published by 人事室 (school).
- **Format**: HTML name links (住宿特約廠商專區, 福利專區, 托育) to PDFs or JPGs.
- **Approx. listings**: ~45 (18 lodging, ~20 other, 7 childcare).
- **Last-updated signal**: none on the page.
- **Students eligible?**: 「以下特約廠商僅供同仁消費時參考」. Staff only.
- **Difficulty**: 4.

### 23. 國立臺北護理健康大學 — ntunhs.edu.tw
- **URLs fetched**:
  - http://www.ntunhs.edu.tw → 503; https://www.ntunhs.edu.tw/ → 200.
  - https://www.ntunhs.edu.tw/p/412-1000-121.php (校友) → 200. No relevant links.
- **Best list**: **nothing found**.
- **Searched**: two domain searches. They found only 國旅卡 material and a one-off restaurant promo on property-ga.ntunhs.edu.tw.

### 24. 國立高雄餐旅大學 — nkuht.edu.tw
- **URLs fetched**:
  - https://www.nkuht.edu.tw/p/403-1000-18.php → 200.
  - https://psla.nkuht.edu.tw/p/404-1015-32269.php → 200 (人事室 list, 「(113.8.26更新)」; post dated 2024-04-19).
  - https://psla.nkuht.edu.tw/var/file/15/1015/img/808/861886261.pdf → 200 (115年特約廠商一覽表, 10 pp, 2026-06-05).
  - https://psla.nkuht.edu.tw/var/file/15/1015/img/212596080.pdf → 200 (an earlier 115年 version, 22 pp, 2026-01-29).
  - https://sta.nkuht.edu.tw/store.htm → 200.
  - https://sta.nkuht.edu.tw/store/all/7.htm → 200.
- **Best list (students)**: https://sta.nkuht.edu.tw/store.htm, published by 學生會 (student_org).
  - **Format**: HTML cards (category / 特約期間 / 電話 / 特約優惠 / link), 8 per page over 7 pages.
  - **Approx. listings**: ~52 (8 × 6 + 4).
  - **Last-updated signal**: 特約期間 115/01/18~116/01/18. Older pages show 「109年10月13日-迄今」.
  - **Students eligible?**: 「憑學生證及教師識別證…可享有以下優惠」. Yes.
  - **Difficulty**: 2.
- **Also (school)**: the 人事室 115年 PDF (808/861886261.pdf) has 77 rows (序號/分類/優惠廠商/優惠內容/合約有效期限). Its wording is mostly 教職員工/識別證: 「教職員工」 appears ×24 and 「教職員工生」 ×2. Difficulty 3. Note that the HTML page still links the older Google Drive folder.

### 25. 國立金門大學 — nqu.edu.tw
- **URLs fetched**:
  - https://www.nqu.edu.tw/app/home.php?Lang=zh-tw → 200.
  - https://www.nqu.edu.tw/cht/index.php?code=list&flag=detail&ids=3312&article_id=66237 (金門大學特約商店, a search lead) → 403. Not verifiable.
  - https://ecasc.nqu.edu.tw/ → 200.
  - https://ecasc.nqu.edu.tw/p/404-1017-5738.php → 200.
- **Best list**: https://ecasc.nqu.edu.tw/p/404-1017-5738.php 「國立金門大校友證特約商店優惠一覽表」, published by 就業輔導暨校友服務中心 (school).
- **Format**: an HTML table (商家/優惠方案/優惠期限/備註).
- **Approx. listings**: ~20 (21 `<tr>` including the header).
- **Last-updated signal**: periods run to 119年12月31日. Several rows have expired (110年, 111年, 112年).
- **Students eligible?**: mixed. Examples: 「教職員單件即享8折優惠；在學學生單件即享85折優惠；畢業校友單件即享9折」; 「本校教職員工生及畢業校友」.
- **Difficulty**: 2.

### 26. 國立臺灣體育運動大學 — ntus.edu.tw
- **URLs fetched**:
  - https://www.ntus.edu.tw/cht/index.php → 200.
  - https://person.ntus.edu.tw/ → 200.
  - https://student.ntus.edu.tw/index.php?code=list&ids=1586 → 200 (校友證專區, 最後更新日期 113-11-07).
  - https://sites.google.com/gm.ntus.edu.tw/alumnicard/特約商店 → 200.
  - https://docs.google.com/spreadsheets/d/1f5TSN5H8ujvnoFHAv-C6MoCfNZOc1IgspOeIjIQAGKk/export?format=csv → 401 (sign-in required).
- **Best list**: the Google Site 「校友證 特約商店」, published by 學務處 校友暨就業服務組 (school).
- **Format**: Google Site store names. The details are in the 「優惠內容 一覽表」 Google Sheet, which requires sign-in.
- **Approx. listings**: ~130 (136 non-empty lines after 「特約商家」, minus a few headings).
- **Last-updated signal**: 「特約更新日期：2026/05/06」.
- **Students eligible?**: 「須主動出示校友證、教職員證或學生證(部分特約限定對象)」. The contract lets the store opt in to cover 教職員證 and 學生證.
- **Difficulty**: 4. The names are public but the terms are gated.

### 27. 國立臺中科技大學 — nutc.edu.tw
- **URLs fetched**:
  - http://www.nutc.edu.tw/bin/home.php → 503; https://www.nutc.edu.tw/bin/home.php → 200.
  - https://www.nutc.edu.tw/files/14-1000-43257,r15-1.php (本校特約商店公告, a search lead) → 404.
  - https://secretary.nutc.edu.tw/var/file/14/1014/img/153086979.pdf → 200.
  - https://alumni.nutc.edu.tw → 200. No 特約 links on the homepage.
- **Best list**: secretary.nutc.edu.tw/var/file/14/1014/img/153086979.pdf, published by 秘書室 (school). I could not confirm which page links to it, because the announcement URL is 404.
- **Format**: a PDF table, 6 pages (編號/特約商家名稱/電話/網站/優惠對象/特約時間/自動續約/優惠內容/備註).
- **Approx. listings**: ~20 (the 優惠對象 column lists 學生 21×; the row numbering is inconsistent in the text extraction).
- **Last-updated signal**: PDF created 2025-05-26. The latest date seen is 2025.12.31; many rows are 自動續約.
- **Students eligible?**: 優惠對象 values such as 「學生、教職員、校友」 and 「教職員、學生、校友」. Yes.
- **Difficulty**: 3.

### 28. 國立臺北商業大學 — ntub.edu.tw
- **URLs fetched**:
  - https://www.ntub.edu.tw/ → 200.
  - https://po.ntub.edu.tw/ (人事室) → 200. It has only 特約托育 and 公務福利e化平台 links.
  - https://www.ntub.edu.tw/p/412-1000-6563.php (校友) → 200. No relevant links.
- **Best list**: **nothing found**. The only lead is 人事室 「教職員工子女特約托育服務合作機構」 (childcare, staff only).
- **Searched**: two domain searches. They found only job-board pages and a 台灣大哥大 公教 promo.

### 29. 國立屏東大學 — nptu.edu.tw
- **URLs fetched**:
  - https://www.nptu.edu.tw/ → 200.
  - https://pers.nptu.edu.tw/p/406-1017-131460,r3119.php → 200.
  - 特約廠商一覽表.pdf (pers.nptu.edu.tw downloadfile) → 200.
  - https://nptuaa.nptu.edu.tw/p/412-1033-12053.php → 200 (校友總會).
- **Best list**: the 人事室 「特約商店一覽」 PDF. The page says 「屏東大學特約商店為本校學生會洽談並爭取優惠之特約商家」, so 學生會 negotiated the list and 人事室 hosts it (school). The page also links the 學生會公關部 IG and a Google My Maps 特約商店地圖.
- **Format**: a PDF table, 8 pages (商店名稱/優惠內容/住址/電話/優惠年限(學年)).
- **Approx. listings**: 97.
- **Last-updated signal**: PDF dated 2021-05-11 with 優惠年限 110 學年, so it is likely stale. The current list is probably on the IG.
- **Students eligible?**: rows say 「憑卡…」, which refers to the 學生會 card. The page asks 教職員工 to use it too. The 校友總會 list (9 rows) covers 「校友會會員…教職員工生」.
- **Difficulty**: 3.

### 30. 國立高雄科技大學 — nkust.edu.tw
- **URLs fetched**:
  - https://www.nkust.edu.tw/ → 200.
  - https://personnel.nkust.edu.tw/p/406-1019-55307,r351.php → 200 (特約商店).
  - https://ascdc.nkust.edu.tw/ → 200.
  - https://ascdc.nkust.edu.tw/p/412-1022-6565.php → 200 (校友 本校特約商店; category subpages).
- **Best list**: https://personnel.nkust.edu.tw/p/406-1019-55307,r351.php, published by 人事室 (school).
- **Format**: one long HTML page of numbered lists by category (企業會員, 住宿 by region, 餐飲, 生活…), with many PDF attachments.
- **Approx. listings**: ~150 (157 numbered lines, some of which are sub-items).
- **Last-updated signal**: periods such as 1150101-1151231 and 即日起至1161231.
- **Students eligible?**: mostly staff (「入住時請出示教職員證」). 44 rows say 「(校友適用)」. Some rows say 「(學生會簽約) 適用教職員工生」.
- **Also**: the alumni centre keeps separate per-store pages, such as 【科技】傑昇通信 (a search lead says 「優惠對象是本校教職員、學生與校友」; I did not fetch that post).
- **Difficulty**: 3.

### 1. 國立臺灣戲曲學院 — tcpa.edu.tw
- **URLs fetched**:
  - http://www.tcpa.edu.tw/ → redirected to https, **TLS fail (curl 60)**
  - https://www.tcpa.edu.tw/ → **TLS fail**
  - https://rb006.tcpa.edu.tw/var/file/9/1009/img/136/238666247.pdf (search lead: 國民旅遊卡 doc) → **TLS fail**
- **Searches**: site:tcpa.edu.tw 「特約商店 優惠」 and 「人事室 特約商店」. Hits were only a 國民旅遊卡 PDF and HR job notices.
- **Result**: **not verifiable**. The TLS chain did not verify, and no candidate list showed up in search.

### 2. 國立臺南護理專科學校 — ntin.edu.tw
- **URLs fetched**:
  - http://www.ntin.edu.tw → 200 (https://www.ntin.edu.tw/?cat=2)
  - https://rd.ntin.edu.tw/AlumniAssociation/AlumniAssociation.aspx?id=C1yATByPbz4= → 200 (no discount links)
- **Searches**: 「特約商店 優惠」 and 「特約 優惠 教職員 學生證」. Hits were course-fee discounts (BLS/ACLS) and the staff 員工協助方案 PDF (snippet says the school 「與民間業者簽訂優惠措施」). I did not fetch the PDF, and the hits showed no list.
- **Result**: **nothing found**.

### 3. 國立臺東專科學校 — ntc.edu.tw
- **URLs fetched**:
  - https://www.ntc.edu.tw/ → 200
  - https://personnel.ntc.edu.tw/ → 200
  - https://personnel.ntc.edu.tw/p/404-1007-8411.php?Lang=zh-tw (特約商店) → 200
  - one contract PDF from that page (來來牛排館/湯蒸火鍋) → 200
  - https://std.ntc.edu.tw/p/412-1002-1015.php?Lang=zh-tw (學生自治會) → 200
  - https://std.ntc.edu.tw/p/405-1002-3697,c1015.php?Lang=zh-tw (【學生自治會】特約商店) → 200
  - https://b007.ntc.edu.tw/var/file/7/1007/img/328/370414845.pdf (114 員工協助方案) → 200
- **Best list**: https://personnel.ntc.edu.tw/p/404-1007-8411.php?Lang=zh-tw. Publisher: 人事室. Level: school.
- **Format**: HTML page that links to 6 PDF contract copies (2 childcare, 2026台北旅店集團, 捷絲旅台南虎山館, 來來牛排館/湯蒸火鍋).
- **Approx. listings**: 6.
- **Last-updated signal**: the sampled contract runs 民國115年1月1日–115年12月31日 (PDF created 2025-12-29).
- **Students eligible?**: No. The contract says 「提供…供甲方之員工持卡人優惠使用」 and 「出示甲方識別證…國立臺東專科學校 服務證」. The student union's 特約商店 page reads only 「~目前持續籌備中~請大家耐心等候~」 (2024-10-14).
- **Difficulty**: 4 (one PDF per vendor; scanned contracts).

### 4. 東海大學 — thu.edu.tw
- **URLs fetched**:
  - https://www.thu.edu.tw/ → 400 (THU Error Page)
  - https://www.thu.edu.tw/web/index.php → 400
  - https://thupr.thu.edu.tw/play.php → 200
  - https://staff.site.thu.edu.tw/ (職員會) → 200
  - https://thotel.thu.edu.tw/東海校友會館特約商店/ → 200 (2020-02-20, image only)
- **Best list**: https://thupr.thu.edu.tw/play.php (校友服務 › 特約商店). Publisher: 公共事務暨校友服務處. Level: school.
- **Format**: HTML, grouped into 美食 / 住宿 / 交通 / 購物 / 育樂. Each entry has a 優惠內容 block.
- **Approx. listings**: ~43 (44 優惠內容 blocks, one of them a LINE note).
- **Last-updated signal**: 合約期限 values run from 2024/12/31 to 2027/3/27 (six end 2026/12/31). A Foodpanda code ended 2025/6/30.
- **Students eligible?**: Partly. Several entries say 「有效證件：學生證、職員證、校友證」 and 「優惠對象：東海大學教職員工、在學學生及校友」. Others are 校友證 or staff only, e.g. 屋馬 「教職員證、校友證」.
- **Secondary**: 東海大學職員會 (staff.site.thu.edu.tw) posts staff-only 福利訊息, with posts dated to 2026-10-01.
- **Difficulty**: 2.

### 5. 中原大學 — cycu.edu.tw
- **URLs fetched**:
  - http://www.cycu.edu.tw → 200 (https)
  - https://alumni.cycu.edu.tw/校友證-特約商家/ → first attempt 200 after redirect to a Google Sites "暫時無法提供服務" maintenance page
  - https://alumni.cycu.edu.tw/ → 200
  - https://alumni.cycu.edu.tw/校友證-特約商家/ (retry) → 200 with the real list
- **Best list**: https://alumni.cycu.edu.tw/%e6%a0%a1%e5%8f%8b%e8%ad%89-%e7%89%b9%e7%b4%84%e5%95%86%e5%ae%b6/. Publisher: 校友服務暨資源發展處. Level: school.
- **Format**: HTML. A list of store names, each with a modal ("X") holding the full terms in the same HTML.
- **Approx. listings**: 99 store names.
- **Last-updated signal**: expiry dates such as 「有效期限:即日起~115年12月29日止」; latest seen is 115年12月.
- **Students eligible?**: Partly. It is primarily a 校友證 programme (「中原大學校友至乙方消費時，出示校友證」). About 20 mentions of 學生證, e.g. 六福村 「持學生證或教職員識別證(校友證)」.
- **Note**: the site sometimes fails into a maintenance page.
- **Difficulty**: 3 (terms are free text in modals).

### 6. 逢甲大學 — fcu.edu.tw
- **URLs fetched**:
  - http://www.fcu.edu.tw → 200
  - https://ga.fcu.edu.tw/ctrtst/ → 200
  - https://purchasing.fcu.edu.tw/wSite/ct?ctNode=13036&… (old 採購保管組 site) → proxy 502 (unreachable)
- **Best list**: https://ga.fcu.edu.tw/ctrtst/. Publisher: 總務處. Level: school.
- **Format**: HTML. The fetched page has only the policy text and a 「【加入】逢甲特約商店」 vendor sign-up form (service202-sds.fcu.edu.tw). It contains **no store list**, and I found no embedded iframe, sheet or JSON in the HTML.
- **Approx. listings**: 0 visible.
- **Students eligible?**: per the page, 「須出示教職員工服務證或學生證(部分特約限定對象)，方可享有特約優惠」.
- **Difficulty**: 5 as fetched. A list may exist elsewhere, but I found none.

### 7. 靜宜大學 — pu.edu.tw
- **URLs fetched**:
  - http://www.pu.edu.tw → 503 (proxy upstream timeout)
  - https://www.pu.edu.tw/ → 200
  - https://psn.pu.edu.tw/p/412-1009-2873.php (search lead) → 404
  - https://psn.pu.edu.tw/ → 200
  - https://psn.pu.edu.tw/p/412-1009-5689.php?Lang=zh-tw → 200
- **Best list**: https://psn.pu.edu.tw/p/412-1009-5689.php?Lang=zh-tw (特約商店名錄). Publisher: 人事室. Level: school.
- **Format**: HTML directory in 4 categories (美食餐飲 29, 醫療・美容 16, 住宿旅遊 40, 交通・… 31). Each store name links to its offer or contract document.
- **Approx. listings**: 116.
- **Last-updated signal**: none on the page.
- **Students eligible?**: No. 「教職員工專屬優惠」 and 「消費前請出示本校教職員證」.
- **Difficulty**: 3 (terms sit behind per-store links or contracts).

### 8. 長庚大學 — cgu.edu.tw
- **URLs fetched**:
  - http://www.cgu.edu.tw → 200
  - https://cgubenefit.cgu.edu.tw/p/412-1052-87.php → proxy 502
  - https://www.cgu.edu.tw/cgubenefit/Contents/?nodeId=10905 → 200
  - https://www.cgu.edu.tw/cgusga/Subject?nodeId=17420 (學生會 學生特約 › 玩樂類) → 200
- **Best list**: https://www.cgu.edu.tw/cgubenefit/Contents/?nodeId=10905 (特約廠商清單 / 一般優惠廠商一覽表). Publisher: 教職員工福利委員會. Level: school.
- **Format**: HTML numbered list. The site also has category pages (食衣/住行/育樂/其他) and a 台塑企業特約廠商查詢 page, none of which I fetched.
- **Approx. listings**: ~30 (numbered items).
- **Last-updated signal**: 「114年11月9日更新」. Publish date 2024/03/28.
- **Students eligible?**: Mostly 「持職員證或眷屬證」. A few say 「持職員證、學生證（含校友證）」.
- **Student-org list**: 學生會 「學生特約」 (餐飲類/玩樂類/生活類). The 玩樂類 page has 2 items (2025-10-22, 2025-02-25), both for 學生證.
- **Difficulty**: 2.

### 9. 元智大學 — yzu.edu.tw
- **URLs fetched**:
  - http://www.yzu.edu.tw → 200
  - http://web2.yzu.edu.tw/profit-2024/index.php/zh/special-store → 200 (served over plain http, no https redirect)
- **Best list**: http://web2.yzu.edu.tw/profit-2024/index.php/zh/special-store. Publisher: 福利委員會. Level: school.
- **Format**: HTML in categories (飯店, 醫療診所, 餐廳, 烘培坊, 休閒遊玩, 教育, 其他). Each entry lists 電話, 地址, 優惠內容 and 合約終止.
- **Approx. listings**: 81.
- **Last-updated signal**: 64 entries are 「永久有效」. The rest end 115.12.31 / 2026-12-31 / 116.12.31. The latest date string on the page is 2026-10-06.
- **Students eligible?**: Mostly staff (持識別證/教師證). A few give student terms, e.g. 「教職員工及眷屬享有9折，學生85折優惠」 and 「訂購前先出示學生證」.
- **Difficulty**: 2.

### 10. 中華大學 — chu.edu.tw
- **URLs fetched**:
  - http://www.chu.edu.tw → 403
  - https://www.chu.edu.tw/ → 200
  - https://personnel.chu.edu.tw/p/412-1056-2141.php?Lang=zh-tw → 200
  - https://personnel.chu.edu.tw/var/file/56/1056/img/656/896939603.pdf → 200
- **Best list**: the PDF 特約商店優惠資訊 (https://personnel.chu.edu.tw/var/file/56/1056/img/656/896939603.pdf). Publisher: 人事室 (福委會特約廠商). Level: school.
- **Format**: PDF, 17 pages, with a table of contents. The first vendors (hotels) appear to be images.
- **Approx. listings**: 15.
- **Last-updated signal**: PDF created and modified 2025-07-31.
- **Students eligible?**: Partly. E.g. 「須於結帳時出示員工識別證或學生證」, while others say 「出示教職員工證」 or 「員工識別證」 only.
- **Difficulty**: 3.

### 11. 大葉大學 — dyu.edu.tw
- **URLs fetched**:
  - http://www.dyu.edu.tw → 200
  - https://bulletin.dyu.edu.tw/file/A0041/35093.pdf → 200
- **Searches**: 「特約商店 優惠」 and 「福委會 特約商店 115年」. No newer list surfaced.
- **Best list**: 大葉大學福委會特約商店 PDF. Publisher: 福委會. Level: school.
- **Format**: PDF, 14 pages (餐飲/住宿/其他).
- **Approx. listings**: ~34 (by 對象 fields).
- **Last-updated signal**: 「更新日期:104/12/08」. PDF dated 2015-12-09. Latest term end seen 105/12. **Stale.**
- **Students eligible?**: Partly. E.g. 「對象：教職員、學生【憑證結帳才享優惠】」.
- **Difficulty**: 3, but the content is ~10 years old.

### 12. 華梵大學 — hfu.edu.tw
- **URLs fetched**:
  - http://www.hfu.edu.tw → 503
  - https://www.hfu.edu.tw/ → 200
  - http://sa.hfu.edu.tw/3dt7/super_pages.php?ID=3dt702 (search lead 「校友證申請暨特約商店」) → 404
  - https://www.hfu.edu.tw/Front/Student-Affairs-System/Student-Affairs-System-03/Page.aspx?id=b6Y%2B2FNv500= (校友) → 200, with no 特約/優惠 links
- **Searches**: 「特約商店 優惠」 and 「校友證 特約商店」. Hits were a 104 meeting-minutes PDF (a planned 校友證特約商店) and the 114 新生手冊 (on-campus 9折 at campus eateries). I fetched neither.
- **Result**: **nothing found** (no current list).

### 13. 義守大學 — isu.edu.tw
- **URLs fetched**:
  - http://www.isu.edu.tw → 200
  - https://sa1.isu.edu.tw/page/集團-學生優惠-EIqT4kiRhhEK → 200
  - https://sa1.isu.edu.tw/storage/files/bbFi8O3kMPDDtjH6pgBjFjvfCQYR1JEa2J0QdGym.pdf (校友證校內服務及優惠一覽表) → 200
  - https://hr.isu.edu.tw/page/福利專區-QLmsr0d52Jbc → 200
- **Best source**: 學務處 「義大集團-學生優惠」. Publisher: 學務處. Level: school. It covers a single perk: 「義守大學學生於在學期間憑學生證，可享義大醫療體系四大醫院免掛號費服務」.
- **Other**: the alumni PDF (113/10/28 修訂) lists only on-campus services (parking, library, course fees). HR 福利專區 links to SharePoint PDFs and to a login-only group employee platform (empsale.e-united.com.tw). The only partner named there is 「交通類特約廠商－台灣高鐵」.
- **Approx. listings**: no merchant list found.
- **Difficulty**: 5.

### 14. 世新大學 — shu.edu.tw
- **URLs fetched**:
  - http://www.shu.edu.tw → 200 (homepage links directly to 特約商店)
  - https://alumni.web.shu.edu.tw/校友服務/特約商店/ → 200
  - https://po.web.shu.edu.tw/福利/特約商店/ → 200
- **Best list**: https://po.web.shu.edu.tw/%E7%A6%8F%E5%88%A9/%E7%89%B9%E7%B4%84%E5%95%86%E5%BA%97/. Publisher: 人事室. Level: school.
- **Format**: HTML, grouped into 餐飲食品 / 住宿飯店 / 休閒娛樂 / medical. Each entry has 《name》 好康資料 links, 據點 and 特約期.
- **Approx. listings**: ~28 (26 《》 entries plus 2 medical lines).
- **Last-updated signal**: 特約期 mostly 115年01月01日–115年12月31日 (one to 116年12月31日). The latest page date is 2026/06/17.
- **Students eligible?**: Mostly staff. The medical entries say 「本校教職員工生出示教師證、員工證、學生證者」.
- **Secondary (alumni)**: 校友服務 › 特約商店 says 「凡持有世新大學實體校友證及數位校友證者」. It has ~14 entries, and its contract terms end 2023/12/31 (stale).
- **Difficulty**: 2.

### 15. 銘傳大學 — mcu.edu.tw
- **URLs fetched**:
  - http://www.mcu.edu.tw → 200 (web2.mcu.edu.tw)
  - https://alumnus.mcu.edu.tw/ → 200 (only 「校友推廣課程優惠」)
  - http://club.mcu.edu.tw/bme/zh-hant/node/26 (醫工系學會 贊助商家) → 200, headings only (「銘傳區 特約商店、贊助廠商 / 後街 特約商店、贊助廠商」), no entries
  - http://club.mcu.edu.tw/sgatpe/zh-hant (台北校區學生會) → 200
  - http://club.mcu.edu.tw/sgatpe/zh-hant/node/147 (學生會特約商店) → 200, a 「工商專區」 recruitment notice by the 第十四屆學生會 with no store list (site content dates to 110學年)
- **Searches**: news articles (week.mcu.edu.tw) describe a past 學生會 「ＭＣＵ．特約商店」 sticker programme. They are not lists, and I did not fetch them.
- **Result**: **nothing current found**.

### 16. 實踐大學 — usc.edu.tw
- **URLs fetched**:
  - https://www.usc.edu.tw/ → 200
  - https://welfare.usc.edu.tw/p/412-1068-2341.php?Lang=zh-tw → 200
  - https://welfare.usc.edu.tw/p/405-1068-14153,c2341.php (交通住宿旅遊) → 200
  - https://welfare.usc.edu.tw/p/405-1068-14152,c2341.php (生活娛樂運動) → 200
  - https://welfare.usc.edu.tw/p/405-1068-14156,c2341.php (購物餐飲服務) → 200
  - https://welfare.usc.edu.tw/p/405-1068-14155,c2341.php (醫療) → 200
- **Best list**: 特約商店一覽表｜VENDORS, 4 category pages. Publisher: 教職員工福利互助委員會. Level: school.
- **Format**: HTML tables (商店名稱 | 合約期間 | 備註), with regions and links to 特惠合約.
- **Approx. listings**: ~112 (52 + 10 + 45 + 5 rows).
- **Last-updated signal**: 合約期間 values like 「簽約日-115/12/31」, with some up to 119/12/31.
- **Students eligible?**: Mostly staff: 「使用特約商店優惠時，請記得先出示教職員證」 and 「優惠對象:本校教職員」. About 9 rows add students, e.g. 「優惠對象:本校教職員及學生」.
- **Difficulty**: 2.

### 17. 朝陽科技大學 — cyut.edu.tw
- **URLs fetched**:
  - http://www.cyut.edu.tw → 200
  - https://hr.cyut.edu.tw/p/412-1072-5237.php?Lang=zh-tw → 200
  - https://hr.cyut.edu.tw/p/403-1072-1148-1.php?Lang=zh-tw (優惠廠商相關訊息) → 200
  - https://news.cyut.edu.tw/p/406-1078-53338,r1633.php (校園簡訊 福委會簽約廠商) → 200
- **Best list**: 人資處 「優惠廠商相關訊息」. Publisher: 人資處. Level: school.
- **Format**: HTML, one post per vendor.
- **Approx. listings**: 12.
- **Last-updated signal**: none on the list.
- **Students eligible?**: Staff. The search snippet for the 台灣虎航 post says 「本校專任教職員工」, but I did not fetch that post.
- **Note**: the 校園簡訊 list is ~30 vendors with expiry dates in 民國92–96 (very stale).
- **Difficulty**: 4.

### 18. 高雄醫學大學 — kmu.edu.tw
- **URLs fetched**:
  - http://www2.kmu.edu.tw → 503
  - https://www.kmu.edu.tw/ → redirected to olis.kmu.edu.tw/error.html (connection resets)
  - https://personnel.kmu.edu.tw/…/24-特約商店一覽表 → **403 "Access Denied"** (3 attempts, including a later retry)
  - https://alumni.kmu.edu.tw/index.php/services/5 → 403
  - https://fu.kmu.edu.tw/…(教師會) → 403
- **Search lead (unverified)**: 人力資源室 「本校特約商店一覽表」. Snippets say it covers 「教職員工生、校友」 with student examples, but I could not fetch it.
- **Result**: **not verifiable** (WAF 403). This is a likely good source if access works from another network.

### 19. 南華大學 — nhu.edu.tw
- **URLs fetched**:
  - http://www.nhu.edu.tw → redirect error (curl 3, host-less redirect)
  - https://www.nhu.edu.tw/ → **TLS fail** (twice)
  - https://welfare2.nhu.edu.tw/Web/Pages?mid=1422 (飲食) → 200
  - https://welfare2.nhu.edu.tw/Web/Pages?mid=8266 (餐廳) → 200, image only
  - https://welfare2.nhu.edu.tw/Web/Pages?mid=8268 (住宿) → 200, image only
- **Best list**: welfare2.nhu.edu.tw 「108-109年度南華大學「特約商店」及「特約醫療院所」」. Publisher: 教職員工福利互助委員會. Level: school.
- **Format**: HTML (2 text entries) plus category pages that hold only images.
- **Approx. listings**: 2 visible as text.
- **Last-updated signal**: 「優惠效期：2021年12月31日止」 (**stale**).
- **Students eligible?**: Yes, in the visible entries: 「適用對象：機關教職員工、在學學生(含同行親友)」 and 「須持機關教職員工證或學生證」.
- **Difficulty**: 4 (stale; images).

### 20. 真理大學 — au.edu.tw
- **URLs fetched**:
  - http://www.au.edu.tw → 503
  - https://www.au.edu.tw/ → 200
  - https://alumni.au.edu.tw/p/406-1020-30422,r108704.php (台灣高鐵VIP企業會員) → 200
  - https://alumni.au.edu.tw/p/426-1020-1.php?Lang=zh-tw (特約商店總攬) → 200
  - https://alumni.au.edu.tw/p/406-1020-73426,r111159.php (漁夫先生) → 200
- **Best list**: 特約商店總攬. Publisher: 校友與公共關係組. Level: school.
- **Format**: HTML index (住宿/交通/餐飲/生活/文教) with one post per vendor.
- **Approx. listings**: 11.
- **Last-updated signal**: none.
- **Students eligible?**: Mostly staff, e.g. 「請本校教職員前往…記得帶服務證件」. 高鐵 says 「為便利全校教職員工生搭乘高鐵」.
- **Difficulty**: 3.

### 21. 大同大學 — ttu.edu.tw
- **URLs fetched**:
  - http://www.ttu.edu.tw → 200 (connection reset during transfer)
  - https://www.ttu.edu.tw/p/412-1000-103.php?Lang=zh-tw (畢業校友) → 200, no 特約/優惠 terms
- **Searches**: 「特約商店 優惠」, 「特約廠商 教職員 學生 優惠」, 「福利委員會 特約商店」 and 「校友 優惠 特約 商家 學生會」. The only hit was an old 遠傳 staff mobile plan on cc.ttu.edu.tw.
- **Result**: **nothing found**.

### 22. 南臺科技大學 — stust.edu.tw
- **URLs fetched**:
  - http://www.stust.edu.tw → 200
  - https://alumni.stust.edu.tw/tc/node/alumnicard → 200 (links to 特約商店)
  - https://cda.stust.edu.tw/tc/node/AlumniiPass → proxy 502
  - https://sites.google.com/stust.edu.tw/appointed-store/首頁 → 200
  - …/appointed-store/食 → 200
  - …/appointed-store/住 → 200
  - …/appointed-store/樂 → 200
- **Best list**: https://sites.google.com/stust.edu.tw/appointed-store/. Publisher: 校友中心. Level: school.
- **Format**: Google Sites, 8 category pages (食衣住行育樂醫其他). Entries have consistent fields (電話/地址/折扣內容/注意事項/優惠對象/截止日期), and some link to attachments on Google Drive.
- **Approx. listings**: 82 across 3 of 8 categories (食 38, 住 30, 樂 14). Estimated 120+ in total.
- **Last-updated signal**: 截止日期 values are mostly 「永久有效」. The Google Sites "Page updated" date was not in the static HTML.
- **Students eligible?**: Yes for many. 「優惠對象：學生/教職員/校友/之友」 appears on 32 entries and 「學生/教職員」 on 3. 45 entries are 「教職員」 only. The 一卡通 student card gives access to 「校友中心洽談合作之特約商店優惠」.
- **Difficulty**: 2.

### 23. 嘉南藥理大學 — cnu.edu.tw
- **URLs fetched**:
  - http://www.cnu.edu.tw → 200
  - https://alumnicenter.cnu.edu.tw/ → 200, no 特約/優惠 terms
- **Searches**: 「特約商店 優惠」 (no results), 「特約商店 福利 優惠」 and 「校友 特約 合作廠商 優惠 校友證」. Hits were campus-restaurant and industry-MOU news only.
- **Result**: **nothing found**.

### 24. 樹德科技大學 — stu.edu.tw
- **URLs fetched**:
  - http://www.stu.edu.tw → 202 with an empty body (likely a bot challenge)
  - https://gad.stu.edu.tw/ (總務處) → 202 with an empty body
- **Searches**: 「特約商店 優惠」, 「特約廠商 福利 優惠」 and 「特約商店 教職員工 學生證 九折」. No list surfaced.
- **Result**: **nothing found**. The pages could not be read (202, empty).

### 25. 中山醫學大學 — csmu.edu.tw
- **URLs fetched**:
  - http://www.csmu.edu.tw → 200
  - https://personnel.csmu.edu.tw/p/403-1012-387.php?Lang=zh-tw → 200
  - https://personnel.csmu.edu.tw/p/406-1012-70698,r387.php (飲食&育樂) → 200
  - https://personnel.csmu.edu.tw/p/406-1012-70684,r387.php (住宿&租車) → 200
- **Best list**: the two pages above. Publisher: 人力資源室. Level: school.
- **Format**: HTML tables with **eligibility columns 教職員 / 學生 / 校友 / 附醫 (√/–)**. Sections: 飲食&購物, 運動健身, 手機&網路, 旅遊, 外送, 醫療, 幼兒園, 住宿, 租車/旅遊.
- **Approx. listings**: ~90 (about 46 and 50 numbered rows).
- **Last-updated signal**: 「資料更新：2026/12/30」 on the food page (as published) and 「2025/12/30」 on the lodging page. The index says 最後更新日期 2026-10-20.
- **Students eligible?**: Yes, row by row. E.g. lodging rows say 「教職員、學生、校友、附醫」. The page says 「使用各項優惠時請務必出示本校相關識別證」.
- **Difficulty**: 1–2 (the cleanest structure in the batch).

### 26. 龍華科技大學 — lhu.edu.tw
- **URLs fetched**:
  - http://www.lhu.edu.tw/ → 200
  - https://alumni.lhu.edu.tw/ → 200
  - https://alumni.lhu.edu.tw/p/412-1055-2154.php?Lang=zh-tw (校友權益) → 200, no discount list
- **Searches**: 「特約商店 優惠」, 「特約廠商 福利委員會 優惠」, site personnel.lhu.edu.tw 「特約商店 人事室」 and 「特約商店 校友 優惠 識別證」. No list found.
- **Result**: **nothing found**. The only offers are recurring single-vendor posts (「龍華人汽車駕訓班…優惠資訊」) on the alumni site.

### 27. 輔英科技大學 — fy.edu.tw
- **URLs fetched**:
  - https://www.fy.edu.tw/ → 200
  - https://fyasc.fy.edu.tw/ → 200
  - https://fyasc.fy.edu.tw/p/412-1069-6760.php?Lang=zh-tw (校友卡特約廠商) → 200
- **Best list**: 校友卡特約廠商. Publisher: 職發與校友中心. Level: school.
- **Format**: HTML (name, 📍 address, ☎️ phone, short offer).
- **Approx. listings**: 21.
- **Last-updated signal**: none.
- **Students eligible?**: No: 「畢業校友請出示校友卡、教職員工請出示員工證」.
- **Difficulty**: 3 (many entries lack offer terms).

### 28. 明新科技大學 — must.edu.tw
- **URLs fetched**:
  - http://www.must.edu.tw → 200
  - http://webc1.must.edu.tw/jtmust073/… (old 特約商店總覽_20211013) → DNS fail (host gone)
  - https://admin.must.edu.tw/view/list.aspx?UnitID=96&id=2803 (特約資訊) → 200
  - content.aspx?UnitID=96&id=3770 (食品餐飲) → 200
  - id=3768 (飯店住宿) → 200
  - id=3764 (醫療護理) → 200
  - id=3769 (休閒娛樂) → 200
- **Best list**: https://admin.must.edu.tw/view/list.aspx?UnitID=96&id=2803. Publisher: 總務處事務組. Level: school.
- **Format**: HTML, 9 category pages with labelled fields (■地址 ■電話 ■網址 ■合約期限 ■優惠內容).
- **Approx. listings**: 22 in the 4 categories fetched (3 + 10 + 6 + 3). Estimated 30–45 in total.
- **Last-updated signal**: e.g. 「自114年11月1日-115年12月31日止」. Some say 113年12月31日止 or 永久.
- **Students eligible?**: Partly: 「憑員工識別證…」 with 「學生攜帶學生證，即享相同優惠」 on several entries (9 student mentions in 22 entries).
- **Difficulty**: 2.

### 29. 長榮大學 — cjcu.edu.tw
- **URLs fetched**:
  - http://www.cjcu.edu.tw → 503
  - https://www.cjcu.edu.tw/ → **TLS fail** (twice)
  - https://dweb.cjcu.edu.tw/agad/news/18854 → 200 (vending machine notice)
  - https://dweb.cjcu.edu.tw/benefits and /benefits/ (福委會) → 200, but redirected to 「Oops! Site Not Found」 (Error 998)
  - https://dweb.cjcu.edu.tw/health/article/1669 (衛保組 就診就醫資訊) → 200
- **Best source**: 衛生保健組 特約診所/醫院 list (medical only). Publisher: 衛生保健組. Level: school.
- **Students eligible?**: Yes for clinics. Students need 「學生證」 plus 「當學期在學證明」 and 特約醫院證明單.
- **Merchant list**: none reachable. The 福委會 site is gone, and the search lead is only the contract template (識別證, members only).
- **Result**: **not verifiable** (TLS) and nothing found for merchants.

### 30. 弘光科技大學 — hk.edu.tw
- **URLs fetched**:
  - https://www.hk.edu.tw/ → 200
  - https://ewc.hk.edu.tw/category/特約活動訊息/ → 200
  - https://ewc.hk.edu.tw/wp-content/uploads/2026/07/114學年特約商店115.07.20更新.xlsx → 200
- **Best list**: 「114學年度弘光科技大學員工福利委員會 特約商店清單」 (xlsx). Publisher: 員工福利委員會. Level: school.
- **Format**: XLSX. Sheet 1 has columns 序號 | 店家名稱 | 縣市 | 服務內容 | 優惠說明 | 合約期限 | 聯絡人 | 連絡方式, plus batch labels such as 「112學年新增」. Sheet 2 holds attachments (附件). There are also HTML posts per new vendor.
- **Approx. listings**: 87.
- **Last-updated signal**: file name 「115.07.20更新」, xlsx modified 2026-07-20 (title says 截至114年6月30日).
- **Students eligible?**: Mostly staff (「憑員工識別證」). About 12 rows include students, e.g. 「出示員工識別證、學生證可享有…」 and 「教職員工及學生就診時」.
- **Difficulty**: 2.

### 1. 健行科技大學 (uch.edu.tw)
- **URLs fetched**:
  - http://www.uch.edu.tw → https://www.uch.edu.tw/: 200, but a truncated 6.5 KB page (connection reset during retries). A second fetch of https://www.uch.edu.tw/ was also 200 and truncated.
  - https://personnel.uch.edu.tw/zh_tw/form6: 200 (a welfare-application form page with no 特約 content).
- **Best list**: nothing found on uch.edu.tw. The homepage had no 特約/優惠/福利 links. The site-restricted WebSearch for 「特約商店 優惠」 and 「特約廠商 教職員工 學生證」 returned only job-fair PDFs, umart.uch.edu.tw student shop pages and personnel forms.
- **Note**: 萬能's 總務處 page (fetched, see #3) says 健行 is one of the schools in the 『桃園區大專院校教職員工福利聯盟』. Its shared list is published by 中央大學 and 中原大學 and was not looked at here.

### 2. 正修科技大學 (csu.edu.tw)
- **URLs fetched**:
  - https://www.csu.edu.tw/: 000 (reset) on the first try, then 200 on retry. Links found were for 校友 only.
  - https://sa.csu.edu.tw/shop_vip.php: 000. Connection reset by peer on 4 attempts, across 3 rounds.
  - https://sa.csu.edu.tw/shop_vip.php?id=210: 000 (proxy 502 / reset).
- **Best list**: search found a lead at `sa.csu.edu.tw/shop_vip.php` (a "學生會特約廠商"-style page under 學務處). It could not be reached, so it is **not verifiable**. Nothing is reported from the snippet.

### 3. 萬能科技大學 (vnu.edu.tw)
- **URLs fetched**:
  - http://www.vnu.edu.tw/ → https: 200 (small splash page)
  - https://administration.vnu.edu.tw/oga/2407: 200
  - https://www.vnu.edu.tw/files/17648/特約商店-八校聯盟店家201611.xls: 200
- **Best list**: 總務處 › 特約商店 (school level). The page explains that the 桃園區大專院校教職員工福利聯盟 (中央, 中原, 元智, 開南, 桃創, 健行, 龍華, 萬能) shares one store list. It links the alliance file (`.xls` and `.ods`) and a contract template (`.odt`).
- **Format**: XLS/ODS spreadsheet (not parsed, because no xls reader was available offline). A rough heuristic found ~165 phone-number strings, which suggests a list of 100 or more rows. Treat that figure as unconfirmed.
- **Last-updated signal**: the file name says 201611 and the XLS metadata says last saved 2016-11-22. The page footer shows "更新日期 2026-10-07", but the list itself is 10 years old.
- **Students eligible?**: "讓本校全體師生一起享受優惠" and "出示識別證，消費享優惠". The list was originally a staff-welfare (教職員工福利委員會) list.
- **Extraction difficulty**: 4 (stale legacy XLS, multi-school).

### 4. 玄奘大學 (hcu.edu.tw)
- **URLs fetched**:
  - https://www.hcu.edu.tw/hcu/zh-tw: 200 (no 特約 links)
  - https://hcu.edu.tw/person/zh-tw/?sh=: 000 (proxy 502)
  - https://www.hcu.edu.tw/person/zh-tw/: 200
  - https://www.hcu.edu.tw/person/person/zh-tw/6617225C228C42EAB4A3E4786573EFC1/9476D029CECE43248F43E3CD05F44ACA: 200 (福利天地 › 特約店家資訊)
  - https://www.hcu.edu.tw/person/Download.aspx?aid=6A8407FB714F4DD2A28CB0A2D20C6CC6: 200 (DOCX)
- **Best list**: 人事室 › 福利天地 › 特約店家資訊, with the attachment "特約店家" (school level).
- **Format**: Word DOCX with one table. The columns are 店家名稱 | 優惠內容 | 聯絡方式 | 簽約年度 | 備註.
- **Approx. listings**: ~24 (26 table rows, minus the note and header rows).
- **Last-updated signal**: the page says "最後更新日期: 2025-12-16". 簽約年度 values run from 101 to 114, and 效期 values reach 116.12.31.
- **Students eligible?**: No. The table note says "＊消費時請攜帶教職員識別證以為憑証。"
- **Extraction difficulty**: 2 (a clean table, but in a DOCX download).

### 5. 建國科技大學 (ctu.edu.tw)
- **URLs fetched**:
  - http://www.ctu.edu.tw → https: 200
  - https://www.ctu.edu.tw/p/412-1000-5873.php?Lang=zh-tw (在學學生): 200. It contains the link "學校特約商店" → http://gen.ctu.edu.tw/web/upload/files/files_191226164115_1.12
  - http://gen.ctu.edu.tw/web/upload/files/files_191226164115_1.12: redirected to https, **404**
- **Best list**: none reachable. The official link exists but points to a dead file. Its name suggests an upload from 2019-12-26. Treat this school as nothing found.

### 6. 明志科技大學 (mcut.edu.tw)
- **URLs fetched**:
  - http://www.mcut.edu.tw/ → https: 200 (links 教職員工福利委員會 at cfw.mcut.edu.tw)
  - https://cfw.mcut.edu.tw/: 200
  - https://cfw.mcut.edu.tw/p/412-1050-10969.php (特約廠商 menu): 200
  - https://cfw.mcut.edu.tw/p/412-1050-11584.php (明志科大特約廠商): 200
  - https://cfw.mcut.edu.tw/p/412-1050-10980.php (台塑企業特約廠商): 200. It only says to log in to the internal NOTES system.
- **Best list**: 教職員工福利委員會 › 明志科大特約廠商 (school level).
- **Format**: HTML text.
- **Approx. listings**: 3 (享鴨, 旅市旅行社, 棋勝汽車). The larger 台塑企業 list is internal-only.
- **Last-updated signal**: "優惠期限至115年12月31日" on the 享鴨 entry.
- **Students eligible?**: No. "憑職員證…".
- **Extraction difficulty**: 2 (but very small and staff-only).

### 7. 台鋼科技大學, formerly 高苑 (kyu.edu.tw → tsust.edu.tw)
- **URLs fetched**:
  - http://www.kyu.edu.tw → https://www.tsust.edu.tw/: 200
  - https://ord.tsust.edu.tw/: 200
  - https://ord.tsust.edu.tw/var/file/10/1010/img/242/605095100.pdf: 200 (11 pages)
- **Best list**: 【台鋼科技大學特約商店列表】 PDF, hosted on the 研究發展處 site (school level).
- **Format**: PDF table. The columns are 類別 | 特約店名稱 | 地址 | 電話 | 特約內容 | 優惠對象, and rows marked ■ are new.
- **Approx. listings**: ~55 (category cells counted: 住宿 ~21, 飲食 ~17, 家居生活 6, 醫療衛生 5, 休閒娛樂 5, 維修保養 2, and a few others).
- **Last-updated signal**: "製表日期:115.01.16". PDF CreationDate is 2026-01-16. Example term: "兌換期限：115/01/01~116/12/31".
- **Students eligible?**: Partly. The 優惠對象 column varies by row. In the text the word 教職員 appears 64 times, 學生 53 times and 校友 52 times, so many rows include students. Some rows say "憑員工識別證" and are 教職員-only.
- **Extraction difficulty**: 3 (structured PDF, but the 特約內容 cells wrap across many lines).

### 8. 大仁科技大學 (tajen.edu.tw)
- **URLs fetched**:
  - http://www.tajen.edu.tw → https: 200
  - https://a06.tajen.edu.tw/p/404-1006-94061.php?Lang=zh-tw: 200
- **Best list**: 總務處 › 學校特約商店 (school level). It reads: "為提供本校教職員工及學生更多元服務消費優惠福利，本校與校外合法登記商店簽訂折扣特約".
- **Format**: HTML table. The columns are 特約商店 | 優惠措施 | 電話及地址 | 特約期間 | 備註. One hotel's rates are in an attached PDF.
- **Approx. listings**: ~12 (12 特約期間 ranges).
- **Last-updated signal**: the newest ranges are "115/9/9~117/12/31" and "114/10/23~115/12/31". Several are "~永久".
- **Students eligible?**: Yes. "請主動出示教職員證或學生證" appears in 10 rows. Some rows add "優惠對象：教職員工、校友、學生".
- **Extraction difficulty**: 1.

### 9. 聖約翰科技大學 (sju.edu.tw)
- **URLs fetched**:
  - https://www.sju.edu.tw/: 200 (畢業校友 → sjsmitaa.org)
  - https://pr.sju.edu.tw/campusnews/alu/discount.html: 000 (reset ×4)
  - http://pr.sju.edu.tw/campusnews/alu/discount.html (the URL as published/indexed): 200
- **Best list**: 聖約翰科技大學校友總會校友專屬優惠方案（持續更新中）. This is alumni-association level, published on the school's pr subdomain.
- **Format**: an HTML index of headlines. Each headline links to a per-deal news page.
- **Approx. listings**: ~35 headlines (for example 「黑沐咖啡」校友88折優惠 and 「大碗公小吃店」校友9折優惠). A few are seasonal promotions.
- **Last-updated signal**: HTTP Last-Modified is 2026-03-16. The page contains date strings up to 202603.
- **Students eligible?**: No. Alumni only ("校友專屬優惠").
- **Extraction difficulty**: 3 (the terms are in headlines and per-page text).

### 10. 嶺東科技大學 (ltu.edu.tw)
- **URLs fetched**:
  - http://www.ltu.edu.tw → https: 200
  - https://www.ltu.edu.tw/p/404-1000-2515.php (特約績優商店 hub): 200
  - https://www.ltu.edu.tw/p/403-1000-51-1.php (特約績優商店-食): 200
  - https://www.ltu.edu.tw/p/406-1000-2551,r51.php (陶板屋 sample): 200
- **Best list**: 特約績優商店, split into 食/醫/住/行/其他 categories. It is on the main school site and no publishing unit is shown.
- **Format**: HTML, one page per store.
- **Approx. listings**: ~18 in 食 (district sub-pages included). The 醫/住/行/其他 categories were not fetched.
- **Last-updated signal**: the sample was posted 2019-05-28, with "合約期限：108年6月1日起至108年12月31日止". It looks stale.
- **Students eligible?**: The sample says "優惠限教職員工使用".
- **Extraction difficulty**: 3 (per-page, stale).

### 11. 中國科技大學 (cute.edu.tw)
- **URLs fetched**:
  - http://www.cute.edu.tw/ → https: 200
  - https://gene.gm.cute.edu.tw/校園資訊: 200 (links "學生會特約商店" and 特約飯店)
  - Google Doc export 1lmDwxAmyY2znSKlTzmt8QMKkvqcyArhi (txt): 200
  - Google Sheet export 1ng_VPDNjU11NDJ2lDOR8hM-a2DNwuDm_ (csv): 200. This is a phone directory and not relevant.
- **Best list**: the 學生會特約商店 Google Doc, linked from the 總務處 校園資訊 page (student_org level).
- **Format**: Google Doc table. The columns are 類別 | 商店名稱 | 連絡人 | 電話 | 地址 | 優惠方案.
- **Approx. listings**: ~11 (mostly around the 台北 興隆路 campus).
- **Last-updated signal**: none found in the document.
- **Students eligible?**: Yes. For example "全校師生憑本校證件一律9折" and "本校學生購買教科書…".
- **Extraction difficulty**: 2.

### 12. 中臺科技大學 (ctust.edu.tw)
- **URLs fetched**:
  - http://www.ctust.edu.tw → https: 200
  - https://personnel.ctust.edu.tw/p/412-1026-1671.php?Lang=zh-tw: 200
- **Best list**: 人力資源處 (personnel.ctust) › 特約商店, school level. It is split into categories such as 1.餐廳、日常用品 and 2.旅館飯店.
- **Format**: HTML table (53 `<tr>`). The columns are 特約商店 | 地址 | 電話 | 優惠內容. Some entries link PDF attachments.
- **Approx. listings**: ~38 (eligibility lines counted: 27 × "優惠身份：本校教職員、學生、校友", 6 × "優惠對象：教職員工、校友、學生", and 5 other variants).
- **Last-updated signal**: contract notes mention "至115/12/31". There is no page date.
- **Students eligible?**: Yes for most rows ("本校教職員、學生、校友", "教職員工、校友及學生出示服務證(學生證)"). A few rows, such as Uber Eats, are 教職員工-only.
- **Extraction difficulty**: 2.

### 13. 亞洲大學 (asia.edu.tw)
- **URLs fetched**: https://www.asia.edu.tw/: 000. "SSL certificate problem: unable to get local issuer certificate" means it is **not verifiable**. It was not bypassed.
- **Best list**: nothing found. WebSearch (allowed_domains asia.edu.tw) for 「特約商店 優惠」 returned no results, and 「特約廠商 優惠」 returned only 產學 and 技轉 pages.

### 14. 開南大學 (knu.edu.tw)
- **URLs fetched**:
  - http://www.knu.edu.tw: 503 (upstream timeout)
  - https://www.knu.edu.tw/: 000 (reset)
  - https://general.knu.edu.tw/p/16-1006-47156.php: 000 (reset on 3 separate rounds)
- **Best list**: not verifiable. Search found a 總務處 notice lead about a new 特約商店 (大友量販), but the page could not be fetched, so no facts are reported. 開南 is also listed (in VNU's page) as a member of the 桃園區 welfare alliance.

### 15. 佛光大學 (fgu.edu.tw)
- **URLs fetched**:
  - http://www.fgu.edu.tw → https://website.fgu.edu.tw/?locale=zh_tw: 200 (only "公路客運優惠" news; no 特約 links)
  - https://secretary.fgu.edu.tw/zh_tw/fgualumni: 200 (校友會 news and a membership form only)
- **Best list**: nothing found. WebSearch for 「特約商店 優惠」 and 「特約廠商 福利 優惠」 returned only a library Gemini-Pro notice.

### 16. 台南應用科技大學 (tut.edu.tw)
- **URLs fetched**:
  - http://www.tut.edu.tw/ → https: 200
  - https://secret.tut.edu.tw/var/file/1/1001/img/349/302908950.pdf: 200 (49 pages)
  - https://secret.tut.edu.tw/p/403-1001-545-1.php (特約活動訊息 list): 200
  - https://secret.tut.edu.tw/p/406-1001-58889,r545.php (一底夯 post): 200
  - https://secret.tut.edu.tw/p/406-1001-58589,r545.php (2026 notice): 200
- **Best list**: 秘書室 公共事務暨校友服務組 (TUT校友服務組), school level, in three parts:
  - (a) the 特約廠商 master PDF;
  - (b) 特約活動訊息 posts for new contracts;
  - (c) the 「南應大行動校園 App」. The 2026 notice says "續約廠商相關資訊將統一收錄於「南應大行動校園 App」中…網頁不另行逐一公告".
- **Format**: PDF table. The columns are 分類 | 區域 | 公司名稱/店名 | 網址 | 電話 | 地址 | 優惠內容 | 合約起 | 合約訖, plus eligibility flags 教職員工證 / 學生證 / 校友學思卡. The parts are 住宿類 (23 pp), 生活類 (18 pp) and 餐廳類 (8 pp). There are also HTML posts, and the app.
- **Approx. listings**: ~250 rows in the PDF (category-cell counts: 住宿 ~105, 生活 ~93, 餐飲 ~62). There are 16 posts on the list page.
- **Last-updated signal**: the PDF footer says 2024/5/3 and its latest 合約訖 is 114/12/31, so most PDF terms have probably expired. The 2026 notice says "本公告更新日期：2026 年 04 月 21 日". The 一底夯 post says "優惠期限 : ~2027/12/31".
- **Students eligible?**: Yes, flagged per row. Posts say "適用對象：教職員工、學生、校友(學思卡)".
- **Extraction difficulty**: 3 for the PDF (wide, wrapped table). Current renewals are app-only, which is 5.

### 17. 中信科技大學, formerly 遠東 (feu.edu.tw → ctbctech.edu.tw)
- **URLs fetched**:
  - http://www.feu.edu.tw → https://www.ctbctech.edu.tw/: 200 (links 校友發展中心)
  - https://alumni.ctbctech.edu.tw/: 200 (menu item "特約商店")
  - https://alumni.ctbctech.edu.tw/var/file/15/1015/img/238/319511573.pdf: 200 (1-page 特約商店契約書 template, created 2026-01-08)
  - https://www.feu.edu.tw/adms/sdc/IDC/IAD/FeuFranchiseStore_01.html (old 遠東 list, from search): 000. "SSL: no alternative certificate subject name matches target host name" means it is **not verifiable**.
- **Best list**: nothing usable. The alumni 特約商店 menu item opens a blank contract template, not a list. The template says "甲方教職員、學生和校友等至乙方營業場所消費時，於結帳時出示機關識別證", which suggests a student-eligible program is being rebuilt.

### 18. 元培醫事科技大學 (ypu.edu.tw)
- **URLs fetched**:
  - http://www.ypu.edu.tw/: 503
  - https://www.ypu.edu.tw/: 200 (video splash page with no 特約/福利/校友 links)
- **Best list**: nothing found. WebSearch for 「特約商店 優惠」 and 「特約廠商 福利 優惠」 returned only job postings.

### 19. 景文科技大學 (just.edu.tw)
- **URLs fetched**:
  - http://www.just.edu.tw/ → https: 200 (admissions splash)
  - https://www.just.edu.tw/app/home.php: 200 (no 特約/福利/優惠 links)
- **Best list**: nothing found. WebSearch for 「特約商店 優惠」 and 「特約廠商 福利 優惠」 returned only 觀光餐旅學院 employer-benefit pages.

### 20. 中華醫事科技大學 (hwai.edu.tw)
- **URLs fetched**:
  - http://www.hwai.edu.tw → https: 200
  - https://secretary.hwai.edu.tw/p/412-1010-277.php (特約商店, from search): **404**
  - https://secretary.hwai.edu.tw/p/412-1010-3071.php (特別商店): 200
- **Best list**: 主任秘書室 › 特別商店, headed "中華醫事科技大學特約商店一覽表" (school level).
- **Format**: HTML table. The columns are 商店名稱 | 地址 | 優惠項目 | 備註.
- **Approx. listings**: ~17 ("出示證件" appears 17 times).
- **Last-updated signal**: none on the page.
- **Students eligible?**: Partly. Most rows only say "出示證件". The clinic rows say "華醫學生及職員…". One hotel row says "憑員工證".
- **Extraction difficulty**: 2.

### 21. 東南科技大學 (tnu.edu.tw)
- **URLs fetched**: https://www.tnu.edu.tw/: 200 (JavaScript single-page app; no links in the static HTML)
- **Best list**: nothing found. WebSearch for 「特約商店 優惠」 and 「特約廠商 福利 優惠」 returned only 學務處 forwards of government cards (志願服務榮譽卡, 僑胞卡), recruiting PDFs and a 推廣教育 tuition discount.

### 22. 德明財經科技大學 (takming.edu.tw)
- **URLs fetched**:
  - http://www.takming.edu.tw → https: 200 (meta refresh)
  - https://www.takming.edu.tw/schtm/default.asp: 200 (only 畢業校友 → alumni.takming.edu.tw; no 特約 links)
- **Best list**: nothing found. WebSearch for 「特約商店 優惠」 and 「學生會 特約商店」 returned only meeting-minute PDFs that mention 學生會 trying to sign stores. Those were not fetched.

### 23. 南開科技大學 (nkut.edu.tw)
- **URLs fetched**:
  - http://www.nkut.edu.tw → https: 200
  - https://nkpre.nkut.edu.tw/front/Alumni_Associat/pages.php?ID=…: 200 (校友總會: albums, donations and membership; no 特約)
- **Best list**: nothing found. WebSearch for 「特約商店 優惠」 returned no results, and 「特約商店 特約廠商」 returned only a library catalogue.

### 24. 中華科技大學 (cust.edu.tw)
- **URLs fetched**:
  - http://www.cust.edu.tw/www/cust.html: 200 (redirect stub)
  - http://www.cust.edu.tw/www/index.html: 200 (no 特約/福利/優惠 links)
  - http://career.cust.edu.tw/: **503**
- **Best list**: nothing found. A search snippet says the 就業暨校友服務組 site has a "特約廠商" menu, but that site returned 503, so it is not verifiable.

### 25. 僑光科技大學 (ocu.edu.tw)
- **URLs fetched**:
  - http://www.ocu.edu.tw → https://www.ocu.edu.tw/: 000. "unable to get local issuer certificate" means it is **not verifiable**.
  - https://alumni.ocu.edu.tw/p/406-1035-66025,r11.php: 000 (same TLS error)
- **Best list**: not verifiable. Search shows a 校友會 site with many "新增特約商店~…" posts (a lead only). It could not be fetched without bypassing TLS.

### 26. 育達科技大學 (ydu.edu.tw)
- **URLs fetched**:
  - http://www.ydu.edu.tw: 503
  - https://www.ydu.edu.tw/: 000 (reset, 2 rounds)
  - https://www1.ydu.edu.tw/: 000 (reset)
- **Best list**: nothing found and the site was unreachable. WebSearch for 「特約商店 優惠」 and 「特約廠商 優惠 教職員」 returned only an 總務處 forward of a 遠傳 staff plan and a 僑胞卡 notice.

### 27. 美和科技大學 (meiho.edu.tw)
- **URLs fetched**:
  - https://www.meiho.edu.tw/: 200
  - https://gad.meiho.edu.tw/?Lang=zh-tw: 200
  - https://gad.meiho.edu.tw/p/412-1005-1088.php (特約商店 hub): 200
  - Category lists, all 200: https://gad.meiho.edu.tw/p/403-1005-{148,149,175,176,179}-1.php
  - Sample page https://gad.meiho.edu.tw/p/406-1005-21769,r149.php: 200
  - The ajax tab loaders /app/index.php?Action=mobileloadmod…: empty or 404 responses
- **Best list**: 總務處 › 特約商店, school level. It is governed by 「洽定特約商店作業要點」 and the stated purpose is "為提供本校教職員工及學生更多元的消費優惠福利措施". The categories are 旅遊, 美食, 住宿, 服飾 and 其他.
- **Format**: HTML category lists, with one page per store.
- **Approx. listings**: ~31 tagged entries (美食 8, 服飾 6, 住宿 2, 旅遊/休閒 10, 其他 5). A few untagged entries were not counted.
- **Last-updated signal**: no list dates. Search snippets show old terms (for example 台北旅店 109–110), but those are leads only.
- **Students eligible?**: Mostly yes. Titles state eligibility, for example "(適用教職員工證、學生證、校友證)". Some entries are "(適用教職員工證)" only.
- **Extraction difficulty**: 3 (one page per store; eligibility is in the titles).

### 28. 吳鳳科技大學 (wfu.edu.tw)
- **URLs fetched**:
  - http://www.wfu.edu.tw/ → https: 200 (link "教職員生福利")
  - https://adm.wfu.edu.tw/personnel/?page_id=263: 200 (the content is in an iframe)
  - https://campus.wfu.edu.tw/CampusNews/IISystem/MsgManager/showNews/NewsRC3_CC.jsp?layoutID=60: 200 (5 welfare posts)
  - https://campus.wfu.edu.tw/CampusNews/IISystem/MsgManager/showNews/NewsV1/newsUnit.jspf?News_ID=93743&Layout_ID=60: 200 ("2025教職員生福利")
  - POST https://campus.wfu.edu.tw/CampusNews/Object/download.jspf (attachment 202641910224.xlsx): 200
- **Best list**: 人事室 "2025教職員生福利" XLSX (school level).
- **Format**: XLSX with 6 sheets: 餐飲, 生活, 休閒, 交通, (教職員)住宿 and (教職員)托育機構.
- **Approx. listings**: ~25 (24 "地址：" cells, plus brands without an address such as 台灣中油 and foodpanda).
- **Last-updated signal**: posted 2026-05-19 10:21, with 公告期限 2026-05-19 ~ 2026-12-31. The latest post on the welfare feed is 耐斯王子大飯店 for 2026 Oct–Dec.
- **Students eligible?**: Mixed. For example "結帳時出示教職員證、學生證識別證…" and "甲方教職員工生及持有甲方之友卡及校友卡之人員". The 住宿 and 托育 sheets are 教職員-only, and some rows say "限教職員工".
- **Extraction difficulty**: 2 (a structured spreadsheet behind a POST download).

### 29. 修平科技大學 (hust.edu.tw)
- **URLs fetched**:
  - http://www.hust.edu.tw/ → https: 200 (link "特約廠商" → ohrs)
  - https://ohrs.hust.edu.tw/?item=12&custom=3176&type=detail&isEn=0: 200 (人力資源室: a few staff-only items, for example 陶源茗 "對象：本校教職員工", plus 楊梅會館)
  - https://ohrs.hust.edu.tw/shareFile/file/44/88/5eqfplsgu.pdf: 200 (1-page image PDF from 2012)
  - https://student.hust.edu.tw/sa: 200 (學生自治會: 特約列表, 特約地圖)
  - Google Sheet export 1qIqk4jsMXyEIAhxgWXBLyngf-_KfpnxA (csv): 200
- **Best list**: 學生自治會 "修平科技大學學生自治會特約廠商" Google Sheet, plus a Google My Map (student_org level).
- **Format**: Google Sheet with the columns 名稱 | 特約優惠, plus a Google My Map.
- **Approx. listings**: ~27.
- **Last-updated signal**: the newest 自治會 news item about stores is 2024-06-26 (日上鍋物), and a foodpanda item is 2024-10-08. The sheet has no dates.
- **Students eligible?**: Yes. "出示學生證即可享有優惠". Some rows give detailed terms (for example "全館飲品享九折"), and others say only that phrase.
- **Extraction difficulty**: 2 (clean sheet, but some rows are names-only with generic terms).

### 30. 長庚科技大學 (cgust.edu.tw)
- **URLs fetched**:
  - http://www.cgust.edu.tw → https: 200
  - https://cguaa.cgust.edu.tw/p/412-1011-577.php (校友會 特約廠商): 200
  - https://cguaa.cgust.edu.tw/p/405-1011-82687,c577.php (傑昇通信): 200
- **Best list**: 校友會 › 特約廠商 (alumni association, on a school subdomain).
- **Format**: an HTML list of posts (10 per page, 2 pages). Each post has its own page.
- **Approx. listings**: ~11–20 (page 1 shows 10, page 2 not fetched).
- **Last-updated signal**: the newest post, 傑昇通信, says "自115年3月15日起…簽約為特約商店". A 鏡化美學 "2026新優惠合約" post is also listed.
- **Students eligible?**: Mainly alumni: "校友可憑藉會員卡到特約商店享受折扣優惠…請出示校友會會員卡". The 傑昇 post adds "學校師生憑教職員證/學生證可享…".
- **Extraction difficulty**: 3.

### 臺北城市科技大學 — tpcu.edu.tw
- **URLs fetched**: https://www.tpcu.edu.tw/ (200); https://per.tpcu.edu.tw/ (200); https://per.tpcu.edu.tw/p/406-1007-88200,r694.php?Lang=zh-tw (200); https://sao.tpcu.edu.tw/ (200)
- **Best list**: none. The 人事室 site carries one-off forwards of telecom offers made under 「全國公教員工優惠商店合作同意書」, such as the 台灣大哥大 notice above, whose title says 「活動115.07.31止」. There is no standing partner-store list.
- **Format**: HTML notices
- **Approx. listings**: 0 (telecom forwards only)
- **Last-updated signal**: notice titles read 115.07.31止, which has expired
- **Students eligible?**: No. The offers are aimed at 教職員工 and 眷屬. Search leads said the same; I fetched only the 台灣大哥大 notice.
- **Extraction difficulty**: n/a
- **Searched**: the homepage links (only an alumni video matched), the sao home (no keyword links), the per home (no 特約, 福利 or 優惠 links), and two WebSearches.

### 敏實科技大學 — mitust.edu.tw
- **URLs fetched**: https://www.mitust.edu.tw/ (200); https://osa.mitust.edu.tw/ (200)
- **Best list**: nothing found
- **Searched**: the homepage and 學務處 home (no 特約, 優惠, 福利 or 合作廠商 links). One WebSearch returned only employer brochures from job fairs. The second search could not run because the budget was used up.

### 醒吾科技大學 — hwu.edu.tw
- **URLs fetched**: https://www.hwu.edu.tw/ (200); https://b002.hwu.edu.tw/Category?CId=4829 (200); POST https://b002.hwu.edu.tw/_PostList with CId=4829 (200, the AJAX list); https://b002.hwu.edu.tw/Post?PId=51429 (200)
- **Best list**: a 「校友特約商店」 section under 學務處 → 校友服務中心 (school level). It holds a single post, 「商家合作資訊」, whose whole body is 「廠商如有特約需求，可洽校友服務組」. No merchants are listed.
- **Format**: HTML, with the list loaded by AJAX POST
- **Approx. listings**: 0
- **Last-updated signal**: none
- **Students eligible?**: not stated. The section is for alumni.
- **Extraction difficulty**: n/a (empty)

### 文藻外語大學 — wzu.edu.tw
- **URLs fetched**: https://www.wzu.edu.tw (200; an 8.5 KB shell, with the menu rendered by JS); https://www.wzu.edu.tw/front (200; it redirects to https://b002.wzu.edu.tw/front/ and returns 114 bytes)
- **Best list**: nothing found
- **Searched**: two WebSearches. They found only job-fair brochures and a 推廣部 tuition discount for 「特約公司」 employees, which is the reverse direction. The homepage is JS-rendered, so I could not grep its links.

### 華夏科技大學 — hwh.edu.tw
- **URLs fetched**: https://www.hwh.edu.tw/ (000, curl 35 connection reset; the proxy logged `ws_closed_mid_exchange`); https://ga.hwh.edu.tw/ (000, same). Plain http also returned 503 from the proxy, and I did not use it.
- **Best list**: **not verifiable**. Two WebSearches returned nothing relevant, only one 總務處 tender notice.

### 致理科技大學 — chihlee.edu.tw
- **URLs fetched**: https://www.chihlee.edu.tw (200); https://www.chihlee.edu.tw/p/404-1000-21979.php?Lang=zh-tw (200, the alumni page); https://welfare.chihlee.edu.tw/p/412-1018-1013.php?Lang=zh-tw (200); https://welfare.chihlee.edu.tw/p/403-1018-1013-2.php?Lang=zh-tw (404, my guess at the page-2 URL); https://welfare.chihlee.edu.tw/p/405-1018-114783,c1013.php?Lang=zh-tw (200)
- **Best list**: https://welfare.chihlee.edu.tw/p/412-1018-1013.php?Lang=zh-tw, the 「特約廠商」 category of the 福利委員會 site (school level, staff welfare)
- **Format**: an HTML list of posts. Each post carries a PDF attachment; for example, the 明成手作 post body is only 「附件、明成手作訂單.pdf」.
- **Approx. listings**: 5 on page 1 (板橋農會年貨市場, 明成手作, ABV Bar&Kitchen 全品項95折, 川蜀麻辣食堂, 和風時尚會館). The pager says 「共 2 頁」, so the total is about 10. I could not reach page 2 at the URL I tried.
- **Last-updated signal**: no date visible on the list or the item page
- **Students eligible?**: not stated. The publisher is the staff 福利委員會, so assume staff only.
- **Extraction difficulty**: 3 (clean titles, but the terms are in PDFs)

### 康寧大學 — ukn.edu.tw
- **URLs fetched**: https://www.ukn.edu.tw/ (200); https://www.ukn.edu.tw/p/412-1000-2069.php?Lang=zh-tw (200, alumni); https://ga.ukn.edu.tw/ (200); https://www.ukn.edu.tw/p/412-1000-377.php?Lang=zh-tw (200, admin units); https://sa.ukn.edu.tw/ (200); https://person.ukn.edu.tw (200); https://person.ukn.edu.tw/p/412-1008-1132.php?Lang=zh-tw (200, the 人事室 「福利」 category, which had no posts)
- **Best list**: no list. The 總務處 home links to one notice, 「2026康寧大學特約寢具廠商-愛菲斯」 (https://ga.ukn.edu.tw/p/406-1022-42879,r11.php?Lang=zh-tw, not fetched).
- **Format**: an HTML notice
- **Approx. listings**: 1 (a dorm bedding vendor)
- **Last-updated signal**: the title says 2026
- **Students eligible?**: not verified
- **Extraction difficulty**: 4

### 宏國德霖科技大學 — hdut.edu.tw
- **URLs fetched**: https://www.hdut.edu.tw/ (200); https://alumnus.hdut.edu.tw/bin/home.php (200); https://alumnus.hdut.edu.tw/files/15-1002-285,c101-1.php (200)
- **Best list**: the 校友會 page 「校友優惠方案」 exists, but its only content is an image, `UNDERCONSTRUCTION.jpg`.
- **Approx. listings**: 0
- **Last-updated signal**: the site header shows 2026-07-30
- **Students eligible?**: n/a
- **Extraction difficulty**: n/a

### 崇右影藝科技大學 — cufa.edu.tw
- **URLs fetched**: https://www.cufa.edu.tw/ (000, curl 35 connection reset; the proxy logged `ws_closed_mid_exchange`); https://ao.cufa.edu.tw/ (000, same)
- **Best list**: **not verifiable**. Two WebSearches returned only budget documents from the 會計室.

### 台北海洋科技大學 — tumt.edu.tw
- **URLs fetched**: https://www.tumt.edu.tw/app/home.php (200); https://www.tumt.edu.tw/p/412-1000-86.php (200, admin units); https://safr.tumt.edu.tw/ (200, 學務處)
- **Best list**: nothing found
- **Searched**: the homepage, admin-unit and 學務處 links (no keyword hits), plus one WebSearch, which returned job posts and an old 國民旅遊卡 news link. A second search was blocked by the budget.

### 亞東科技大學 — aeust.edu.tw
- **URLs fetched**: https://www.aeust.edu.tw/ (200); https://oaa.aeust.edu.tw/ (200, alumni); https://www.aeust.edu.tw/p/412-1000-389.php?Lang=zh-tw (200); https://sa.aeust.edu.tw (200); https://hr.aeust.edu.tw (200)
- **Best list**: nothing found
- **Searched**: no keyword links on any of the five pages. Two WebSearches returned only employer job posts.

### 馬偕醫學大學 — mmc.edu.tw (also mmu.edu.tw)
- **URLs fetched**: https://www.mmc.edu.tw (200); https://alumni.mmu.edu.tw/ (200); https://www.mmc.edu.tw/xmdoc?xsmsid=0O268672798421593308 (200, admin units); https://studentaffairs.mmu.edu.tw/ (200); https://general.mmu.edu.tw/ (200)
- **Best list**: nothing found. The 學務處 page only forwards public-transport holiday offers.
- **Searched**: the pages above and one WebSearch on mmc.edu.tw and mmu.edu.tw, which returned an accounting rule.

### 中信金融管理學院 — ctbc.edu.tw
- **URLs fetched**: https://www.ctbc.edu.tw/ (000, curl 60 "SSL certificate problem: unable to get local issuer certificate"); https://sa.ctbc.edu.tw/p/412-1003-2035.php?Lang=zh-tw (000, same TLS error)
- **Best list**: **not verifiable (TLS)**. This is the strongest lead in the batch. WebSearch returned 「學校特約商店名單 - 學生事務處」 (https://sa.ctbc.edu.tw/p/16-1003-8670.php) and a 「特約商店」 category (https://sa.ctbc.edu.tw/p/412-1003-2035.php). The snippets mention restaurants, KTV, gyms and hair salons, with 「出示…教職員證或學生證」. **This comes from search snippets only and has not been verified.** It needs a re-check from an environment with a complete certificate chain.

### 南亞技術學院 — nanya.edu.tw
- **URLs fetched**: https://www.nanya.edu.tw/home.aspx (200); https://www.nanya.edu.tw/alumni.aspx (200)
- **Best list**: nothing found
- **Searched**: homepage and alumni links (news items only) and one WebSearch (job-post PDFs and a 2014 news item about a campus beauty-store practicum that gave a 9折 discount). A second search was blocked by the budget.

### 黎明技術學院 — lit.edu.tw
- **URLs fetched**: https://www.lit.edu.tw (200); https://www.lit.edu.tw/general/58391/ (200); https://www.lit.edu.tw/student/ (200); https://www.lit.edu.tw/personnel/ (200); https://alumni.lit.edu.tw/ (000, curl 35 connection reset)
- **Best list**: nothing found. The 總務處 page forwards the 國民旅遊卡特約商店聯盟 「國民旅遊卡福利網」 notice, dated 2025/11/25. The 人事室 page forwards 「115年10月教育部所屬機關同仁…員眷親友專屬優惠方案」. Neither is a school partner list.
- **Students eligible?**: n/a. The 公教 forward is for staff.
- **Note**: the alumni site could not be verified.

### 德育護理健康學院 — dyhu.edu.tw
- **URLs fetched**: https://www.dyhu.edu.tw/ (200); https://rd.dyhu.edu.tw/p/16-1023-41849.php (200); https://dsa.dyhu.edu.tw/ (200); https://per.dyhu.edu.tw/ (200); https://ga.dyhu.edu.tw/ (200)
- **Best list**: nothing found. The 「校友會特約商店合約」 page offers only blank contract templates (特約廠商合約書.doc, .odt and .pdf). It shows that the 校友會 signs partner stores, but no list is published.
- **Searched**: 學務處, 人事室 and 總務處 home pages (no keyword links) and one WebSearch.

### 法鼓文理學院 — dila.edu.tw
- **URLs fetched**: https://www.dila.edu.tw/ (200); https://www.dila.edu.tw/alumni (200)
- **Best list**: nothing found
- **Searched**: homepage and alumni links (only 「校友與學生急難救助」 matched) and one WebSearch, which returned an unrelated article.

### 馬偕醫護管理專科學校 — mkc.edu.tw
- **URLs fetched**: https://www.mkc.edu.tw/ (000, curl 28 timeout after 30 s); https://web.mkc.edu.tw/ (000)
- **Best list**: **not verifiable**. Two WebSearches returned only a laundry-concession tender and a 學務週報.

### 仁德醫護管理專科學校 — jente.edu.tw
- **URLs fetched**: https://www.jente.edu.tw/ (000, curl 35 connection reset; the proxy logged `ws_closed_mid_exchange`); https://oga.jente.edu.tw/ (000, same)
- **Best list**: **not verifiable**. Lead from WebSearch: the 總務處 site has a 「特約廠商」 category (https://oga.jente.edu.tw/特約廠商/...). One snippet describes 皮爾卡登皮件 with 「出示員工識別證…95折」 and code “JENTE”, valid 112/02/20 to 112/12/31. **These details come from a snippet only and have not been verified.**

### 樹人醫護管理專科學校 — szmc.edu.tw
- **URLs fetched**: https://www.szmc.edu.tw (200); https://www.szmc.edu.tw/Academic (200); https://web.szmc.edu.tw/Adm/Deptper (200, a 1.5 KB JS shell); https://web.szmc.edu.tw/Adm/Train/sa/ (200, a 1.6 KB JS shell)
- **Best list**: nothing found. The unit sites are JS-rendered, so I could not grep their links.
- **Searched**: one WebSearch (unrelated PDFs). A second search was blocked by the budget.

### 慈惠醫護管理專科學校 — tzuhui.edu.tw
- **URLs fetched**: https://www.tzuhui.edu.tw/home (200); https://www.tzuhui.edu.tw/ischool/publish_page/4 (200, 學務處); https://www.tzuhui.edu.tw/ischool/publish_page/9 (200, 人事室); https://www.tzuhui.edu.tw/ischool/publish_page/9?cid=1897 (200; 「15福利」 is a regulations category with an empty notice table)
- **Best list**: nothing found
- **Searched**: the pages above and two WebSearches (unrelated).

### 耕莘健康管理專科學校 — ctcn.edu.tw
- **URLs fetched**: https://www.ctcn.edu.tw (200); https://alumni.ctcn.edu.tw/ (200); https://www.ctcn.edu.tw/~personnel/ (200, Big5); https://www.ctcn.edu.tw/~personnel/html/福利快訊/綠世界.htm (200)
- **Best list**: no current list. A legacy, orphaned 人事室 「福利快訊」 page (綠世界) is still online: 「本人憑員工識別證…半票優惠」 and 「園區各商店出示識別證享九折」. The current 人事室 menu does not link to it.
- **Format**: static HTML (Big5)
- **Approx. listings**: 1 page seen; the size of the folder is unknown
- **Last-updated signal**: none (legacy)
- **Students eligible?**: No (員工識別證)
- **Extraction difficulty**: 4

### 敏惠醫護管理專科學校 — mhchcm.edu.tw
- **URLs fetched**: https://www.mhchcm.edu.tw/ (200); https://www.mhchcm.edu.tw/p/426-1000-2.php?Lang=zh-tw (200); https://b009.mhchcm.edu.tw/files/14-1009-9325,r516-1.php?Lang=zh-tw (000, curl 35 reset); https://b009.mhchcm.edu.tw/ (000, reset)
- **Best list**: **not verifiable**. Lead from WebSearch: the 學務處 site (b009) has 特約商店 posts. One example is 極鮮火鍋-新營店 (107年), with 「憑教職員工或學生證 刷卡95折 現金9折」. **This comes from a snippet only.** The b009 host reset every connection.

### 育英醫護管理專科學校 — yuhing.edu.tw
- **URLs fetched**: https://www.yuhing.edu.tw/ischool/publish_page/0/ (200); https://www.yuhing.edu.tw/ischool/publish_page/5 (200, 學務處); https://www.yuhing.edu.tw/ischool/publish_page/7 (200, 人事室)
- **Best list**: nothing found
- **Searched**: the pages above and one WebSearch (an environmental PDF). A second search was blocked by the budget.

### 聖母醫護管理專科學校 — smc.edu.tw
- **URLs fetched**: https://www.smc.edu.tw/ (000, curl 60 "unable to get local issuer certificate")
- **Best list**: **not verifiable (TLS)**. One WebSearch returned only a theatre ticket PDF and a budget list.

### 新生醫護管理專科學校 — hsc.edu.tw
- **URLs fetched**: https://www.hsc.edu.tw/ (200); https://www.hsc.edu.tw/p/404-1000-35585.php?Lang=zh-tw (200)
- **Best list**: https://www.hsc.edu.tw/p/404-1000-35585.php?Lang=zh-tw, 「特約廠商一覽表」 on the school main site (school level; the page does not name a unit)
- **Format**: an HTML table with the columns 特約廠商 | 地址及電話 | 優惠內容 | 期限
- **Approx. listings**: 13, including 小樹苗診所, 福利購 (哈根達斯), 會來尖石溫泉渡假村, 韓味煮藝 (2 branches), 醇品咖啡素食坊, 當代牙科, 鑫聚成醫療聯盟, 明漾眼鏡, 美的適藥, 十八寶羊肉爐, 小豪包膜屋 and 西堤龍潭店.
- **Last-updated signal**: no page date. One entry expires 112.12.31 (already past); all the others are 「無期限」.
- **Students eligible?**: **Yes**. The table says 「掛號時本人出示學生證」, 「持學生證或員工識別證『95折』」 and 「學生:6折、老師:5折」.
- **Extraction difficulty**: 1 (a clean HTML table with terms and validity)

### 崇仁醫護管理專科學校 — cjc.edu.tw
- **URLs fetched**: https://www.cjc.edu.tw/ (200); https://www.cjc.edu.tw/Front/AdministrativeUnit/PersonnelRoom/SpecialStore/Archive.aspx?id=hXYARXuydzw%3D&page=1 (200); the same URL with page=2 (200); one attachment, Download.aspx?…玉津咖啡-嘉義溪口分店特約商店 (200, PDF)
- **Best list**: the 人事室 → 特約商店 archive (school level)
- **Format**: an HTML index of titles. Most items link to a PDF contract. The PDF I sampled was a 1-page scan (Producer 「Scanner System Image Conversion」) with no text layer.
- **Approx. listings**: 18 across 2 pages: 愛菲斯 bedding, 棒棒積木飯店, 敦謙國際集團, 玉津咖啡, 公教人員特約休閒活動中心, 寬悅花園酒店, 大榮駕訓班, 蜻亮點旅店, 法羅米手感麵包, 嘉祐耳鼻喉科, 慈濟大林分院, 聖馬爾定醫院 (2 entries), 三兩茶, 昇學幼兒園, 行藝文旅, 圓石優格飲, and one entry titled 「最新特約商店」.
- **Last-updated signal**: titles show 2024 contracts. The sampled PDF is dated 2023-06-15. The site footer reads 「更新日期 : 2026/10/22」, but that is a site-wide date.
- **Students eligible?**: not stated in the index. The publisher is 人事室, and one item is a staff childcare contract, so staff are the main audience.
- **Extraction difficulty**: 4 (names only in HTML; the terms are in scanned PDFs that need OCR)

### 臺北市立大學 — utaipei.edu.tw
- **URLs fetched**: https://www.utaipei.edu.tw (200); https://sec.utaipei.edu.tw/p/412-1009-34.php?Lang=zh-tw (200); the category pages …/412-1009-35.php (住宿, 200), …-36.php (餐飲, 200), …-9907.php (交通, 200) and …-37.php (其他, 200); the item pages …/405-1009-135222,c34.php (200) and …/406-1009-129462,r5.php (200); …/403-1009-34-1.php (404, my guess at a full-list URL)
- **Best list**: https://sec.utaipei.edu.tw/p/412-1009-34.php?Lang=zh-tw, 「特約服務商店」, published by 秘書室 (school level) and split into 住宿, 餐飲, 交通 and 其他.
- **Format**: one HTML post per merchant. Each title carries the validity, for example 「(-116/12/31)」, and the full terms are in PDF contracts.
- **Approx. listings**: 19 unique titles across the visible category pages, such as 真杏坊, 饗賓, 饗犇, 雲雀國際, 懷寧復健科, 客美多咖啡, 中華航空, 長榮航空, 台灣高鐵, 和運租車 and 易遊網. Each page shows only its latest 5 posts. Older posts exist beyond these, for example 義美, which is dated 115/1/1 to 115/12/31.
- **Last-updated signal**: end dates run to 116/12/31 and 116/9/23, so the list is current.
- **Students eligible?**: **Some.** The 義美 post says 「優惠對象包含本校教職員工及在學學生，憑教職員工識別證、學生證即可享有專屬優惠」. The 饗賓 post says 「憑教職員工識別證」, which means staff only.
- **Extraction difficulty**: 3 (clean titles and dates, but each post has to be opened and the terms are in PDFs)
