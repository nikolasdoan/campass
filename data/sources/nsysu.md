# NSYSU 中山 partner-discount source (verified 2026-10-23)

> **Status: extracted.** Every record in `nsysu.json` comes from pages and contract PDFs fetched with curl on 2026-10-23.

## Extraction summary (`nsysu.json`, 17 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| NSYSU 中山 | 國立中山大學 校友服務暨社會責任中心 「特約商店優惠」 (school) | Index https://asc.nsysu.edu.tw/p/412-1010-15654.php?Lang=zh-tw and the five category lists `https://asc.nsysu.edu.tw/p/412-1010-<id>.php?Lang=zh-tw` (15856 餐廳飲食, 15857 居家生活, 21056 觀光娛樂, 15881 教育學習, 16221 醫療保健), all 200. All 25 detail pages `/p/405-1010-<n>,c<cat>.php`, all 200. 26 contract PDFs and 9 images from `/static/file/10/1010/…` (all 200 except one PDF that is 404, see below). | RPage CMS. Short HTML detail pages, each linking to a 特約合作書/契約書 PDF. **24 of the 26 PDFs are scans with no text layer**: `pdftotext` returns nothing. Only 特力家居's contract has text; 英倫牙醫's has 4 characters. | 25 | **17** | 2 | 6 (scan-only terms) | Titles carry the contract year (17 × 2026, 7 × 2025, 1 none). The newest contract is 善禾選 (2026-08-01 to 2027-07-31). |

**How the scans were handled.** The issue says to skip a record when its terms exist only in a scanned PDF. I followed that.
- **Terms** come from the detail page's HTML wherever the page states them.
- **Period and eligibility** come from the contract. Where the contract is a scan, I rendered its pages to images with `pdftoppm` (OCR isn't available) and **read the period and eligibility clauses directly from the scan**. Each such record has the note 「契約書為掃描檔（無文字層），期間與適用對象係直接閱讀掃描影像取得」, and its `notes` quote the clause.
- Room-rate tables inside scanned contracts were **not** transcribed. Those records say 「住宿優惠項目請參考…合約…」 and link the PDF.

**Skips (8):**
- **2 expired:**
  - 【高雄/台北】城市商旅 (id 227649): the attached rate table is titled 「城市商旅2024年商務公司優惠價格表 2024年01月01日至2024年12月31日」. No newer contract is attached.
  - 特力家居-2026 (id 351031): its contract (text PDF) says 「適用期間：2025/01/01-2025/12/31(2026年度特約優惠待2025年底提供)」, and the 適用企業 list doesn't name 國立中山大學. The page says only 「優惠詳細內容請參閱特約合作書」.
- **6 with terms only in a scanned PDF.** Each page says only 「優惠項目請參考《…合約…》內容」:
  - 【全台】承億文旅-2026 (227662)
  - 【高雄】義大天悅飯店-2026 (252623)
  - 【台東】娜路彎大酒店-2026 (333269). Its only other content is an image headed 「2026年3-4月份最新優惠」, which has also ended.
  - 【台北】家美瑞品 Hotel-2026 (358456)
  - 【宜蘭】村却國際溫泉酒店-2026 (368305)
  - 【屏東】小墾丁渡假村-2026 (376602)

  These could be added if campass-1 accepts transcription from scanned rate sheets.

The second link on the 馨蕙馨醫院 page (`/static/file/10/1010/img/3364/905798607.pdf`) returns **404**. The record uses the other contract (915958211.pdf), which loads.

Category counts: health 4, shopping 4, lodging 3, food 2, services 2, entertainment 1, transport 1.

Regions:
- south 11
- all four 4 (online: 愛菲斯, Xpure, 善禾選, Wordvice)
- north + central + south 1 (英倫牙醫)
- central 1 (劍湖山, 雲林)

**Eligibility counts:** 17 staff, **9 student**, 8 alumni, 3 family.

## Field mapping and judgement calls

- **Eligibility.**
  - The page-wide rule is 「注意：使用特約商店優惠時，請記得先出示職員證、學生證、校友證或退休人員證。」 On many hotel pages it is restated as 「凡持有下列證件者可適用以上優惠: (1)校友證。(2)中山大學認同卡。(3)本校之教職員工(含退休教職員工)及學生則分別以教職員工證及學生證供辨識。」
  - **When the contract names fewer groups, the contract wins**, as the issue says:
    - **Staff only, because the contract names only 員工 or 同仁:** 文雄眼鏡 (「乙方員工持特約識別證」), H2O (「甲方員工/商務客人」), 翰品 港都茶樓 (「甲方之所屬員工」), 劍湖山 (「所屬員工」), 享溫馨KTV (「甲方持工作識別證」; the page offers member cards to 「教職員工生」), 真便宜 (「乙方所屬員工」), 南科贊美 (「乙方所有同仁」).
    - 善禾選: 「教職員工、校友及其親友」 → staff, alumni and family, **not** students.
    - 馨蕙馨: 「甲方員工(會員)及其配偶/父母/子女、甲方學生」 → student, staff and family, **not** alumni.
  - **Contracts that name students:**
    - 碧港良居: 教職員、校友或學生.
    - ART101 / 紐奇肌 / 汗蒸坊: the school's standard 「國立中山大學特約優惠商店契約書」, 「所屬教職員工(含退休教職員工)、校友、學生」.
    - 愛菲斯: 「校友及教職員工生」.
    - Xpure: 「教職員工、學生、校友」. The page itself says 「實體門市請出示校友證件」, but the contract lists all three groups.
    - 英倫牙醫: 「教職員工生、校友及其配偶或親屬」.
  - **Wordvice** has no contract PDF. Its page says 「優惠對象：全校師生」 → student and staff.
  - **No record relied on the page-wide rule alone.** Every kept record has a contract clause or explicit page wording.
- **Periods** are taken from the contract:
  - 2026-12-30: 劍湖山, 南科贊美
  - 2026-12-31: 文雄, 碧港良居, H2O, 翰品, 愛菲斯, Xpure, 馨蕙馨
  - 2027-02-18: 真便宜
  - 2027-02-28: 英倫牙醫
  - 2027-07-31: 善禾選
  - 2027-12-31: 享溫馨
  - **ART101, 紐奇肌, 汗蒸坊** ended 114年12月31日, but the contract says 「期滿後若未經甲乙雙方任何一方面以書面提出終止契約，視為以同一條件續約，無須重新締約」. They are `expires_on: null`, `auto_renew: true`.
  - `auto_renew: true` is also set where the contract renews automatically: 文雄, 碧港良居, 愛菲斯, 英倫牙醫 and 善禾選.
  - 真便宜 renews only if a spending threshold is met, so `auto_renew` is false.
  - Wordvice: 「優惠期間：不限時間 (2025年7月起)」 → `null`.
- **Regions.**
  - Addresses come from the page or, where the page has none, from the contract (翰品: 高雄市鹽埕區大仁路43號).
  - Several merchants have no store address. 文雄眼鏡, ART101, 紐奇肌, 汗蒸坊, 享溫馨KTV and 真便宜 are set to south; each note gives the reason (head office or contract address in 高雄, or the contract's 高雄 court or arbitration seat).
  - Online shops and services (愛菲斯 code SSVIP85, Xpure code NSYSU2025, 善禾選 code e001, Wordvice code NSYSU20) → all four.
  - 英倫牙醫 lists clinics in 北/中/南 → north + central + south.
  - 雲林 → central, as in the other source files.
- **Category.** The page's categories map as: 觀光娛樂 hotels → lodging; 翰品 港都茶樓 and 南科贊美 (dining terms only) → food; 享溫馨KTV → entertainment. 居家生活 is split: eyewear (文雄), sauna (汗蒸坊), hospital and dentist → health; salon and editing → services; retail → shopping; car service (真便宜) → transport.
- **Highlight:** the best stated rate (4折起 for 文雄's sunglasses, 9折起 for 南科贊美's dining). 汗蒸坊 uses 優惠價$499. Hotels with rate tables in the PDF use 專屬優惠價. Clinics use 掛號費7折 and 掛號費優惠.
- `source_url` is each detail page. The contract PDF is in `links` as `{"label": "特約契約書"}`.

## Out of scope

The 「人事室特約內容」 link (https://ope.nsysu.edu.tw/p/412-1011-19408.php, 200) is a 人事室 「特約聯盟專區」 with about 5 posts. It was not extracted.

## Caveats

- **Read from scans.** Periods and eligibility for 16 of the 17 records were read from scanned contracts. Wordvice is the exception; its terms are on the page. Each clause is quoted in `notes` so it can be checked against the PDF.
- **Staff-only hotels.** Most hotel contracts are corporate 商務 agreements for staff. Their pages quote the general 「校友證/學生證」 rule, but the contracts don't extend to those groups, so they are marked staff-only.
- **Missing rate tables.** Room-rate tables (H2O, 碧港良居, 劍湖山, 南科贊美) are linked, not transcribed.
