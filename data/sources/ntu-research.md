# NTU discount sources: research report (retrieved 2026-10-15)

`ntu-research.json` has **129 records**. Each one was taken from a page or PDF fetched on 2026-10-15, and its `source_url` points to the page that names the merchant. Merchants already in `deals.json` were left out (matched by name). The table under "Changes vs deals.json" below lists the differences found for them.

Raw downloads are in the session scratchpad (`research-ntu/`); they are not part of the repo.

## Sources checked

| # | Source | Publisher | URL | Format | Records | Last updated shown |
|---|---|---|---|---|---|---|
| 1a | 優惠專區 (benefit.html) | 臺大財務管理處 | https://homepage.ntu.edu.tw/~ntufinance/benefit.html | HTML. The 特約商店 categories are not sub-pages: they are tabs of a linked Google Sheet. | 6 (教職員薪轉/貸款 banks: 玉山、華南、中華郵政、元大、遠東商銀、王道) | none |
| 1b | 特約商店 Google Sheet linked from benefit.html (tabs: 短期優惠訊息, 住旅 北/中/南/東/交通, 美食, 購物, 便利生活) | 臺大財務管理處 | https://docs.google.com/spreadsheets/d/1BOBgKkVHY6Ie11-hMEFpwnSnHroVuRm3uL_IdYu7Zyg (exported as xlsx) | Google Sheet | 0 new. All merchants are already in deals.json. | none |
| 2 | 臺大系統學生會 特約平台, 17 pages (首頁; 臺大: 飲食/公館溫州街/118巷/其他地區/生活-娛樂; 臺師大: 飲食/美妝衣著/車輛/旅宿/其他; 臺科大: 飲食/交通/其他) | 臺大系統學生會 | https://sites.google.com/gapps.ntnu.edu.tw/system/ | Google Sites HTML | 45 | Footer says ©2022. Timestamps embedded in the pages are 2020-12 to 2022-05. 臺師大 美妝衣著/車輛/旅宿 are empty. |
| 3 | 台大生活便利通: 快來找好食 (12 locations), 逛逛放輕鬆, 玩耍懶人包, 便利小幫手, 珍藏好記憶, 生活新鮮事 | 臺大總務處經營管理組 | https://life.ntu.edu.tw/ (~95 detail pages crawled) | HTML | 58 | Footer: 最後更新日期 2026/06/02 (news items up to 2026-10-14) |
| 3b | 台大生活便利通 「校外特約商店(由財務處提供)」 and 「住宿／旅遊交通(財務處提供)」 | 臺大財務管理處, via 生活便利通 | https://life.ntu.edu.tw/web/shopping/shopping.jsp?dm_id=DM1780383703129 and the accommodation.jsp pages | HTML mirror of 1b | 0 (mirror) | 2026/06/02 |
| 4 | 國立臺灣大學系統 「優惠訊息」 → 臺師大 「校內轄下提供臺大系統優惠商家一覽表」 | 國立臺灣師範大學, posted on triangle.ntu.edu.tw | https://triangle.ntu.edu.tw/discount.html → https://triangle.ntu.edu.tw/001/Upload/1571/ckfile/4c61f706-ae6a-4e13-b389-e5fb2803d4e1.pdf | PDF (table, extracted with pdfplumber) | 20. Only rows whose 優惠對象 includes 國立臺灣大學系統 or 三校聯盟 were kept. | 2025.9.22 |
| 5 | 臺大校友中心 商家優惠 | 臺大校友中心 | https://www.alumni.ntu.edu.tw/Store/StoreList (POST with page size 300, 74 cards) | HTML | 0. It is a stale mirror of 1b; see below. | none |
| 6 | 臺大校友中心 校內商家優惠總覽 | 臺大校友中心 | https://www.alumni.ntu.edu.tw/News/NewsDetail/NN00000251 | HTML | 0. It only points to life.ntu.edu.tw. | 2023.09.05 |
| 7 | 臺大學生會 official site (首頁, 關於我們, 公告, 相關連結, 公開資料) | 臺大學生會 | https://ntusa.ntu.edu.tw/ | HTML | 0. There is no partner list. 「關於我們」 says the 公關部 洽談特約廠商, but the deals are posted only on FB/IG. | announcements to 2026-10-05 |
| 8 | 臺大機械系系學會 | NTUMESA | https://ntumesa.com/ | HTML | 0. There is no partner list. | none |

Per-source counts in the JSON: 財務管理處 6 · 臺大系統學生會 45 · 總務處經營管理組 (生活便利通) 58 · 臺師大 via 臺大系統 20.

### Notes on each source

**臺大系統學生會**
- The platform looks abandoned since 2022. Every 臺師大/臺科大 entry has a 優惠期限 in 2021–2022, and those dates are copied into `expires_on`, so those records show as expired.
- The 臺大 pages give no expiry, so `expires_on` is null. Each record's `notes` flags the 2022 staleness.
- The Agoda code expired on 2022-12-31. It is kept with that date.
- **威比大廚** is limited to 「台科大學生證」, so its `schools` is ["NTUST"]. NTU students can't use it.
- 13_Burger's page has a second line that was copied from the shop above it by mistake. I left it out and said so in `notes`.
- **潮味決** also appears here, with different terms: 滿130元 兌換時蔬或王子麵. It was left out because deals.json already has the 財務處 version, which is current.

**生活便利通**
- Most entries say 「國立臺灣大學系統之教職員工生、臺大校友及退休人員憑證9折」. These are coded as `schools` ["NTU","NTNU","NTUST"] with student, staff and alumni all true.
- Some entries narrow the audience:
  - **輝室:** 限在職教職員, so student is false.
  - **無二會所:** the page says 「在職教職員生」, so student is true and `notes` flags it.
  - **京倫會所:** 8折 for 教職員工 only.
  - **太子文旅修齊館:** applies to 教職員工、眷屬及校友, so student is false.
  - **品軒樓:** the page says 「臺大聯盟」, so `schools` is NTU only and `notes` flags it.
- Entries left out:
  - 野草居食屋 (「相關優惠資訊請洽」)
  - 大草原設計 and GraceGift (「依網站優惠活動」)
  - 男八宿舍福利社 (「現場標示價格皆為校內優惠價」)
  - the bank branches (already covered by source 1a)
  - dorm restaurants with no discount
  - 捷絲旅臺大尊賢館 and 梧邸 (already in deals.json)
- CAMA CAFE 台大新生南店 comes from a 生活新鮮事 news post (2026-09-07).

**臺師大 PDF**
- I left out rows limited to 臺師大 (小旺號, 參食健康餐盒, GOGORO, 卡摩花園, 林口 shops) and rows marked 「不限定對象（不需憑證）」 (德食快餐, 阿翔咖哩, 植德素食, 陳敏小吃, 師大健康餐, 師大美髮部, 師大美而美, SMILE早餐吧, 吃飯囉媽媽, 紅廚). The second group is open to everyone, so it isn't a partner discount.
- 優惠期間 dates in 民國 years were converted to `expires_on` (for example 119/06/30 becomes 2030-06-30).
- 銅樂鍋物's date (114/12/31) has already passed.

## Changes vs deals.json (Finance Office merchants)

- **No changes to terms or expiry dates.** The live Google Sheet export is cell-for-cell identical to `data/ntu-partners.xlsx`: a dump of all nine tabs gives the same text. Every merchant in the sheet is in deals.json.
- **SOS Repair維修中心 has not been renewed.** It is still listed with 合約期限 2026/8/31 in the sheet and on life.ntu.edu.tw. It has passed its expiry but nobody has taken it down, so treat it as expired until the 財務處 posts a new date.
- **康橋商旅:** the sheet says 「期滿自動續約」. This matches deals.json (`auto_renew: true`, `expires_on: null`), so the open question in the old notes is resolved.
- **臺大徐州路文教會館 / 梧邸酒店台北杭州:** life.ntu.edu.tw restates the same 2026 專屬房價 (標準 2,500 / 豪華 3,200 平日). It adds a 2026-07-22 news post saying the offer runs until 2026/12/31, which matches deals.json.
  - The 梧邸 detail page headline says 「國立臺灣大學系統之教職員工生、臺大校友及退休人員憑證9折」. The body text limits the 專屬房價 to current staff and students, with 9折 off the base rate for retirees and alumni.
  - This is the only hint that NTNU and NTUST people may qualify. deals.json lists `schools` ["NTU"] only.
- **Mirrors lag behind the sheet:**
  - **life.ntu.edu.tw** (updated 2026/06/02) is missing Hanns House 瀚寓酒店 and 承億酒店.
  - **Alumni center list:**
    - 娜路彎大酒店 shows 2026/3/31; the sheet and deals.json say 2026-12-31.
    - It is missing 兄弟大飯店, 承億酒店, 高雄萬豪, 臺大癌醫美食街, 于記杏仁, 樂田麵包屋, 永和耕莘托嬰中心 and 美國聯合航空.
    - It still lists two contracts that have ended and were dropped from the sheet (not imported):
      - **呆水溫泉** (宜蘭礁溪, ended 2026/3/31)
      - **阿爾發證券投資顧問** (「臺灣大學投資方案 6折」, ended 2026/2/28)
- **benefit.html's own text** covers 中華航空 (TW003802, 97折), 長榮航空 (TPE2088, 目前無優惠折扣) and 高鐵 (統編累計, 無折扣). It matches deals.json.

## Sources not extractable, or only partly

- **光一肆號** (life.ntu news, 2026-07-22, https://life.ntu.edu.tw/web/news/news_in.jsp?np_id=NP1784698390026): the 「臺大優惠內容」 is only an image. The teaser says it is for 臺大教職員. It is not in the JSON; check it by hand.
- **臺科大 「校內轄下提供優惠商店一覽表」** (https://triangle.ntu.edu.tw/001/Upload/1571/ckfile/8aa7e6cc-97aa-41f0-8a82-e0915a0d8761.pdf, dated 2025.09.15) has 7 on-campus shops: 統一超商, 摩斯漢堡, 全家, 萊爾富 and 路易莎 at 9折; 花意空間花苑 at 8折 with a 學生證; 維康 at 9折. The PDF doesn't say whether NTU or NTNU IDs are accepted, so it was not imported. If confirmed, import it with `schools` ["NTU","NTNU","NTUST"].
- **Finance Office details:**
  - The full terms of each merchant (and of the six staff bank offers) are in Google Drive PDFs or folders. I didn't parse them.
  - The 臺大薪轉 PDF for 華南 was updated on 115/9/29: https://life.ntu.edu.tw/uploads/root/華銀/115年9月台大薪轉優惠中文.pdf.
- **Department and college associations:** WebSearch found no HTML, Google Sites or Notion partner lists for any NTU 系學會 or 院學生會. Searches covered 系學會, 管院, 醫學院, 研究生協會 and Notion. These groups post 特約 on Facebook and Instagram only, which were skipped.
- **Dcard thread** (https://www.dcard.tw/f/ntu/p/259831668): a student post, not an official source. Not imported.

## Sources to monitor (in priority order)

1. **The Finance Office Google Sheet** (linked from benefit.html): the authoritative school list.
   - Diff the xlsx export against `data/ntu-partners.xlsx`.
   - Most contracts end on 2026-12-30/31, so re-check in late December and January.
   - Watch for an SOS Repair renewal.
2. **life.ntu.edu.tw:**
   - 快來找好食, 逛逛放輕鬆, 便利小幫手 and 珍藏好記憶 give on-campus vendor discounts; 生活新鮮事 has short promos.
   - This is the largest current source of student discounts. Re-crawl monthly; new vendors appear as `*_in.jsp?np_id=` pages.
3. **triangle.ntu.edu.tw/discount.html:** updated PDFs from 臺師大 and 臺科大, roughly once per academic year.
4. **臺大系統學生會 platform:** check each semester in case it is revived. It has not been updated since 2022.
5. **臺大學生會 (ntusa.ntu.edu.tw, plus FB/IG @ntusa.taiwan):** the 公關部 negotiates 特約 but publishes on social media only. Needs manual entry or OCR.
6. **Alumni center StoreList:** low priority, because it is a lagging mirror of #1.

## Data-quality pass 2026-10-15

All 66 distinct source URLs in `ntu-research.json` were re-fetched on 2026-10-15. The record count is unchanged at 129.

- **臺大系統學生會 (45 records):** The footer still shows ©2022 and there are no newer page timestamps. Every record's notes now read 「資料來源最後更新於 2022 年，請以店家現場為準。」 in place of the earlier wording; this covers the 28 records that have no expiry date. The 臺師大/臺科大 entries keep their 2021–22 expiry dates, so they show as expired. 池先生 Kopitiam appears twice, but these are different branches (公館店 and 大安店), so both were kept.
- **Eligibility:** No defaulted records here. 校總區書店 and 水源校區書店 now say 「適用對象未載明」 in notes. Their page and the list page give no audience, but on the same page 校史館書店 distinguishes 校內/校外 for souvenirs. Their student=true flag was left unchanged; see the report.
- **Highlights:** 校史館書店 changed from 8折 to 紀念品88折. The page lists 「書籍8折」 without restricting it to school members (souvenirs are 校外9折 and 校內88折), so the members-only price is now the badge. All other badges were checked and are 8 characters or fewer.
- **Spot check** (random.seed(15), drawn across both files; 7 of the 40 sampled records came from this file): 臺大系統學生會 0/3, 生活便利通 0/3 and 臺師大 PDF 0/1 had no errors. 財務管理處 was not sampled.
- **Regions:** No empty regions.
- **Duplicates:** The file was compared with the 財務處 deals and across sources (學生會, 生活便利通 and 臺師大 PDF), by name and school. The only overlaps are different branches: SUBWAY/全家 at NTU (二活, dorms) against the NTNU campus stores, and CoCo都可 against CoCo壹番屋, which are different brands. Nothing was dropped.
- **Validation:** The JSON loads and all required fields are present. The importer ran cleanly, and the generated files were restored.

## Re-check 2026-10-22

Re-checked by the worker (data/sources/recheck-2026-10.md). The 19 records past their end date were confirmed not renewed (17 臺大系統學生會 Google Sites entries, 2 from the 臺師大 PDF on triangle.ntu.edu.tw) and were removed.
