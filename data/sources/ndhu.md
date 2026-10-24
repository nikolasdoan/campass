# NDHU 東華 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `ndhu.json` comes from the list page and contract PDFs fetched with curl on 2026-10-24.

## Extraction summary (`ndhu.json`, 116 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| NDHU 東華 | 國立東華大學 總務處事務組 「校外特約商店」 (school) | https://ga.ndhu.edu.tw/p/412-1006-13996.php?Lang=zh-tw (200; two connection resets before it succeeded). The page has no pagination: the whole list is one HTML table. I also downloaded the 31 contract PDFs for rows whose 優惠措施 only points to the contract (all 200). | One HTML table with 135 rows. Columns: 特約商店 / 優惠措施 / 電話及住址 / 合約期限 / 備註 / 特約契約 (PDF links). Section header rows: 住宿, 餐飲, 車輛, 生活休閒. **Only 2 of the 31 downloaded PDFs have a text layer**, so the rest were read as scans. | 129 merchant rows | **116** | 3 (stale terms only) | 10 (see below) | No page date. The latest 合約期限 are 117年10月9日 (潘師傅) and 117年12月31日 (貳輪嶼). 61 rows say 「合約到期自動展延」. |

**Skips (13 rows):**
- **Terms only stale (3):**
  - 東元電機: the cell is 「114年5-6月優惠方案」, although its 合約期限 is 119年.
  - 饗泰多泰式風格餐廳: its only attachment is 「饗泰多花蓮店合作專案」, whose own text says 「以上活動從即日起到 2025/12/31 截止」.
  - 饗食天堂: points to the same 饗賓 attachment, which holds only the 饗泰多 project.
- **No current terms (4):** 果然匯蔬食宴, 小福利麻辣鍋, 開飯川食堂 and 珍珠台灣佳味. All say 「詳如饗賓集團合約書」, but the only attachment is the 2025 饗泰多 project.
- **Unreadable (2):** 三寶爸工作室's terms are handwritten in the contract and not legible. 凱尼斯旅行社's attachment is a scanned brochure with type too small to read reliably.
- **Not a personal discount (4):**
  - 華聯遊覽車: a 特約遊覽車合約書 for the school's own 總務處事務組 charters.
  - 長榮航空, 立榮航空, 中華航空: entering the school's corporate code accrues ticket value, 「回饋本校免費機票與升等」. The benefit goes to the school.

Category counts: food 44, lodging 42, shopping 12, transport 10, services 4, entertainment 3, health 1.

Regions:
- east 73 (花蓮/台東)
- north 20
- south 7
- central 3
- all four 7 (雀客, 阿瘦, 朵法婭, U2電影館, 太一旅行社, 愛菲斯, 威比)
- north + south 1 (福容連鎖)
- north + east 1 (千田運動廣場, 宜花東)
- `[]` 4: 金門 outlying-island merchants (浯島文旅, 醉酒香陳窖, 永成小客車租賃行, 二毛旅行社)

**Eligibility counts:** 116 staff, **112 student**, 0 alumni, 0 family.

## Field mapping and judgement calls

- **Eligibility** comes from the 備註 column.
  - 124 rows say 「出示教職員證或學生證」 → student and staff. Alumni are not mentioned anywhere on the page.
  - 亮潔洗車's 備註 repeats the 合約期限 instead of an audience. It follows the table's standard wording, which is noted.
  - **The contract wins where it restricts the audience.** 4 records are staff-only:
    - 醉酒香陳窖 and 二毛旅行社: 「僅限乙方所屬會員/員工」
    - 大地假期: 「公司員工（含退休人員）憑識別證」
    - 聯登物業(停車場): 「半年提供1次異業結盟廠商優惠卷給教職員工」; the 折扣卡 is collected at 事務組.
  - Per the founder decision of 2026-10-23, staff-only rows stay in with `student: false`.
- **End dates** come from 合約期限 (ROC → ISO, using the last date in the cell).
  - 「合約到期自動展延」 → `expires_on: null`, `auto_renew: true` (59 rows).
  - 凱尼斯's 「合約永久有效」 would have been `null`, but the row was skipped.
  - None of the kept rows has ended.
- **Contract PDFs.** Per the issue, I opened a contract only when 優惠措施 pointed to it (31 PDFs).
  - **Lodging rows that say only 「(詳如契約文件)」** are kept with highlight 專屬優惠價 and offer 「優惠房價詳見契約文件；契約書為掃描檔，房價未轉錄」 (17 records). The rates sit in scanned rate sheets and were not transcribed.
  - **Non-lodging contracts** were read from the rendered scans. The clauses used are quoted in each record's `notes`:
    - 醉酒香陳窖 (金門高粱 case prices)
    - 二毛旅行社 (金門 tour 15500/人; 包車 7000/天)
    - 大地假期 (護照 1450, 台胞證 1500, 外國行程 折$2000–4000)
    - 雄獅旅行社花蓮分公司 (團體旅遊每人優惠 400/900 元, 簽證 100 元)
    - 愛菲斯 (官網 8折; renewed to 115/11/30)
    - 威比寢飾 (官網 7折, free sheet set for low-income students; to 117/8/31, then renews indefinitely)
    - 合興傢俱行 (免費運送安裝; to 116/5/17). Its second clause is blanked out in the scan.
  - 雀客國際酒店's contract has text: 「2025 特約廠商合約書…有效期間至民國 115 年 12 月 31 日…僅供甲方現職員工及經甲方正式邀請之特定貴賓適用」, with 「特約房浮動報價」.
    - **Flag:** the record is still marked student-eligible per the table's 備註 「出示教職員證或學生證」, although the contract says staff only. campass-1 may want to switch it to staff-only.
- **Stale sub-promotion removed:** 路易斯皮件's 「115年6月專屬優惠39折」 line.
- **Names.**
  - Multi-line names are split into `name` and `subtitle`, for example 「F HOTEL」 with 花蓮站前館 / 台南館 / 嘉義館 / 三義館, and 鮮九鼎餐廳 with subtitle 九號溫泉旅店.
  - 花蓮富野渡假酒店 appears in both 住宿 and 餐飲, so the two records get the subtitles 住宿 and 餐飲.
  - 「品台餐飲股份有限(醉酒香陳窖)公司」 is recorded as 醉酒香陳窖 / 品台餐飲股份有限公司.
- **Category.** The section headers map as: 住宿 → lodging, 餐飲 → food, 車輛 → transport, 生活休閒 → shopping. Exceptions: U2電影館, 六福村 and 溯溪傳奇 → entertainment; 肌肉工廠 → health; the travel agencies (太一, 二毛, 大地, 雄獅) → services.
- **Highlight:** the best 折 rate (起 when several rates apply), or 專屬優惠價 for hotel rate tables, 免服務費, 消費贈品, or a fixed amount: 愛買 「滿額折$100」, 大地假期 「折$2000起」, 鍋家 「折$50」.
- `source_url` is the list page for every record; each contract PDF is in `links` as 特約契約書.

## Out of scope

The 學生自治會 東華黑卡 list (`dhsa.ndhu.edu.tw`, data at `api.dhsa.ndhu.edu.tw/card/store`) has an expired TLS certificate. I did not bypass it, and it also returned 503 by a second route on 2026-10-23.

## Caveats

- **Scanned contracts.** 17 hotel records point to scanned rate sheets whose rates were not transcribed, and 7 more records depend on terms I read from scans (quoted in `notes`).
- **Old auto-renewing contracts.** 59 records rely on 「合約到期自動展延」; some date from 2019–2021 and may no longer be honoured.
- **Outlying islands.** 4 金門 merchants have `regions: []`, as with the other outlying-island records.

## Evidence

The 11 contract pages I read from scans are kept in private storage (not in this public repo); `data/evidence/ndhu/MANIFEST.md` lists them, one per contract (page 1 at 60 dpi), with `MANIFEST.md` giving each image's source URL, the source PDF's sha256 and the records it decided.
