# NKUHT 國立高雄餐旅大學 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `nkuht.json` comes from pages and a PDF fetched with curl on 2026-10-24.

## Extraction summary (`nkuht.json`, 123 records)

| Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|
| 學生會 「特約商家」 (student_org) | https://sta.nkuht.edu.tw/store.htm and https://sta.nkuht.edu.tw/store/all/N.htm, N = 1…7 (`store.htm` is page 1) | Server-rendered HTML cards: 分類, name, 特約期間, 商家電話, 特約優惠 (free text) and an outside link (FB/IG/website). There are no detail pages. | **52 cards** (8 per page, 4 on page 7) | **49** | 2 | 1 duplicate | The newest 特約期間 starts 115/01/18 (2026-01-18) |
| 人事室 「115年特約廠商一覽表」 (school) | https://psla.nkuht.edu.tw/var/file/15/1015/img/808/861886261.pdf | Excel-generated PDF (10 pp, created 2026-06-05) with a text layer. Columns 序號/分類/優惠廠商/優惠內容/合約有效期限; read with pdfplumber `extract_tables`. | **77 rows** | **74** | 2 | 1 merged into the 學生會 card | PDF dated 2026-06-05 |

The older 22-page 115年 version (212596080.pdf, 2026-01-29) was **not** used, as the issue instructs.

**Skips:**
- **Expired (4):**
  - 啾吉 韓式炸雞 小港總店 (學生會, 114/10/3~115/10/3)
  - 雙饗丼小港店 (學生會, 114/10/1~115/10/1)
  - 璞旅集團 (人事室, 115/1/1-115/6/30)
  - Amo阿默企業 (人事室, 114/4/18-115/6/30)
- **Duplicate (1):** 昊震車業 is on page 2 (115/01/05~116/01/05) and on page 3 (「112年3月31日-迄今」). The newer page-2 card is kept.
- **Merged (1):** 超級巨星自助式KTV is in both lists. Per the issue, the 學生會 card is kept, and its `info` adds the 人事室 terms (「包廂費85折優惠、打卡送一壺飲料」, 合約有效期限 114/3/7-116/3/6).

**Counts:**
- Categories: food 58, lodging 22, entertainment 16, services 9, shopping 7, transport 6, health 3, education 2.
- Regions: 73 south-only, 42 nationwide (all four), 3 north-only, 2 central-only and 1 east-only. 2 records span several regions: 東北酸白菜火鍋 (north, south) and 浮樂德 F HOTEL (central, south, east).
- Eligibility: **52 student**, 105 staff, 1 alumni (富胖達), 2 family (英倫牙醫, 台灣虎航).
  - All 49 學生會 records are student-eligible. 31 of them also include staff (教師/教職員識別證).
  - 3 人事室 records include students: 小港大雄診所 「本校同仁及學生」, 富胖達 「本校教職員工生、校友」 and 永貞新村 「本校教職員工生」. The other 71 人事室 records are staff-only (`student: false`).

## Field mapping and judgement calls

- **學生會 eligibility.** Cards that say 「憑學生證及教師識別證」, 「學生證或教職員識別證」, 「學生證及教職員證」 or 「師生」 → student + staff. 18 cards (the 110–112 era ones such as 洗鞋俠, 港都芭樂, 統聯) name nobody. They are marked **student only**, with the note 「卡片未寫明適用對象；學生會特約商店，依頁面歸為學生適用」.
- **人事室 eligibility** is read from the row text:
  - 教職員工生/學生 → student.
  - 校友 → alumni.
  - 眷 → family.
  - Staff is always true.
  - 38 rows name nobody, for example 85度C 「至門市消費享全館9折」 and the hotel rows. They are staff-only, with the note 「依頁面歸為教職員工」, because the list is the 人事室 staff list.
- **End dates:**
  - 學生會 cards: the last date of 特約期間 is used (115/01/18~116/01/18 → 2027-01-18). 「…-迄今」 / 「~迄今」 cards (36, from 2018–2023) get `null`, with the note 「特約期間「…迄今」，未標示結束日」. Some are years old, so the note tells users to phone first.
  - 人事室 rows: the last date of 合約有效期限 is used. 無期限 → `null`. The typo 「119-12/31」 (人杰老四川) is read as 119/12/31 → 2030-12-31. 東北酸白菜火鍋 ends 2026-10-28, which is still current on the retrieval date.
- **Pointer-only 人事室 rows are kept.** 22 rows say only 「優惠房價請詳見合約內容」 or 「優惠內容請見合約書」: 18 hotels, plus 中國東方航空, 金色三麥, 喜樂時代 and 寶島53. The contracts are not published.
  - These rows get the highlight 「專屬優惠價」 (hotels) or 「特約優惠」, plus the note 「合約未公開，優惠內容未轉錄」.
  - No prices were invented. Reviewers may prefer to drop them.
- **Regions:**
  - 學生會 shops are around the 小港 campus → `south`. 統聯客運 (tour-bus rental) → all four.
  - The PDF has no addresses. Where the name gives the place (高雄…, 墾丁…, 台北長榮桂冠, 新莊凱悅, 清境農場, 台中大毅老爺, 娜路彎 台東, 大板根 三峽), that region is used.
  - Branch lists in the text are used too: 東北酸白菜 鳳山/台南/桃園; F HOTEL 花蓮/台南/嘉義/三義/墾丁.
  - All other rows → all four, with the note 「一覽表未列地址，地區設為全台」 (38 rows). These are mostly chains, airlines, online sellers, and hotels whose city the list does not give.
- **Category:**
  - 學生會 分類: 美食/餐飲 → food; KTV/麻將/手作/旅遊 → entertainment; 機車/美甲/美髮/理髮/美容/清潔 → services; 安全帽/文具 → shopping; 機車出租 → transport.
  - PDF 分類: 宿 → lodging; 食 → food; 行 → transport; 醫 → health; 育 → education; 樂 → entertainment; 其他 → shopping.
  - By-hand fixes: travel agencies → entertainment; 萬國通路 (luggage) and 愛菲斯 (宿 in the PDF) → shopping; 聚鍋富民店 (行 in the PDF) → food; 台灣大哥大 → services.
- **Names:**
  - 「…合約書」 / 「…合約」 suffixes in 優惠廠商 are dropped (唯炘食品, 新莊凱悅嘉軒酒店).
  - Company names are otherwise kept as printed, for example 王品餐飲股份有限公司(聚鍋).
- **Source quirks, copied as published and flagged in `notes`:**
  - 旗山第一家鹽酥雞's card text says 「至《泰饗泰式極上便當》可享…」, probably a copy error on the site.
  - 龍泰's offer text ends in 「4....」 and 南和/統聯 end in 「...」. The site truncates them, and there is no detail page.
- **Row 63 (狸小路手作烘焙)** comes back empty from pdfplumber. Its text is copied from `pdftotext -layout` of the same page: 「憑本校教職員工識別證…均享有全部商品享結帳95折優惠價…」, 無期限.
- **Links:** the card's outside link (店家頁面), and any URL written in a PDF row (喜憨兒).

## Validation

- JSON parses: 123 records, all with the `ncu.json` key set and valid categories.
- No `expires_on` is before 2026-10-24, and there are no duplicate (name, subtitle) pairs.
- `python3 scripts/import_deals.py` in a throwaway copy imported all 123 NKUHT records with 0 skips.
