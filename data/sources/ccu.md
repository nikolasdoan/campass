# CCU 中正 partner-discount source (verified 2026-10-23)

> **Status: extracted.** Every record in `ccu.json` comes from the Google Sheet export fetched with curl on 2026-10-23.

## Extraction summary (`ccu.json`, 31 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| CCU 中正 | 國立中正大學 校友園地 「校友特約廠商優惠」 (school) | Link page https://www-alumni.ccu.edu.tw/ (200). Its 「校友服務相關連結 → 校友特約廠商優惠」 link points to https://docs.google.com/spreadsheets/d/1DvpRN2eQIZDv5pg8qKQtI5cn7SEP_Vhwd9S5RICSlJA/edit#gid=209689429. I fetched the `/edit` URL (200) and exported the sheet with `…/export?format=xlsx` (200) and `…/export?format=csv` (200). | Google Sheet, one tab (工作表1), titled 「國立中正大學特約廠商一覽表」. Columns: 類別 / 商店名稱 / 主要優惠內容 / 聯絡人及地址. The 優惠期間 is the last line of the 主要優惠內容 cell. No cell has a hyperlink. | 37 merchant rows | **31** | 1 | 5 (see below) | No sheet date. Most periods run to 1151229–1151231 (end of 2026). 墾丁福華 runs to 1161231. |

`alumni.ccu.edu.tw` reset the connection on 2026-10-22, so the link was read from `www-alumni.ccu.edu.tw`.

**Rows.** 43 rows are non-empty:
- 2 header rows
- 3 category-only rows (衣, 保險 and 金融 are empty sections)
- 1 醫療 pointer, 「請參閱本校衛生保健組網頁資訊：https://health.ccu.edu.tw/p/404-1036-11465.php?Lang=zh-tw」. That page returned **404** on 2026-10-23.
- 37 merchant rows

**Skips (6 rows):**
- **1 expired:** 聖保羅企業股份有限公司-民雄門市, 「1140520-1150531」 (2026-05-31).
- **1 duplicate:** 薰衣草森林股份有限公司 appears twice (rows 26 and 37) with identical text, phone and period. The two rows were merged.
- **4 with no terms.** These rows say only that a discount exists:
  - 大地假期旅行社有限公司嘉義分公司: 「持本校證件享優惠 1051128-1061127自動展延」
  - 寶崴光學股份有限公司_文雄眼鏡事業部: 「消費優惠 1100220自動展延」
  - 臺中榮民總醫院嘉義分院附設住宿型機構清健庇護工場: 「持本校證件享優惠 1120417-1121231_自動展延」
  - 中國青年救國團: 「憑本校教職員工生識別證、中正之友卡或校友卡可獲相關優惠，優惠內容請逕洽救國團各單位 1130601-1180601」

  救國團 is valid to 2029-06-01 and names students, but it states no discount, so it was skipped like the others. campass-1 can add it back if a pointer-only record is wanted.

Category counts: lodging 14, food 8, education 3, shopping 3, transport 1, services 1, entertainment 1.

Regions (single-region records unless stated):
- south 20
- north 4, plus 1 north + central
- central 2
- east 1
- all four 3 (foodpanda, WUWOW, 阿瘦 online)

**Eligibility counts:** 31 staff, **8 student**, 4 alumni, 0 family. 21 records are staff-only by default (see below).

## Field mapping and judgement calls

- **Eligibility** comes from each cell's wording. The sheet has no general rule. The alumni site's link label 「校友特約廠商優惠」 is the only sign that alumni may qualify; it is not a rule, so it was not applied.
  - 「教職員工生識別證」 / 「教職員生識別證」 → student and staff (埔里四季蒸宴, 大頭雞, 初八拉麵).
  - Rows that also name 校友卡, 中正之友卡 or 退休人員證 → student, staff and alumni (阿潘肉包, 打貓, 徐氏父女, 捷比童裝). 中正之友卡 is noted in `info` but not mapped to a field.
  - 「限教職員工」 (法羅米) and 「本校教職員工」 (墾丁福華) → staff only.
  - **Plain 「憑識別證」 / 「憑本校識別證」 / 「本校識別證正本及統編」 → staff only.** Per the issue, `student` is false, and each record carries the note 「條款只寫「憑識別證」，未寫明適用對象；依工作規則歸類為教職員工適用，學生、校友未列入」. This covers the hotels, 薰衣草森林, 林肯 ×2 and 航典.
  - Rows that say nothing about who qualifies (耐斯 餐廳團購, foodpanda 企業帳號, 台北旅店集團 「住房輸入統編」, 比雅久, WUWOW 「甲方核發之有效識別證明」, 義大遊樂世界 特約代碼, 阿瘦) → staff only, with a note.
  - **台南桂田酒店** is split by its own text: 「憑識別證或名片訂房」 for rooms and 「憑教職員工生識別證或名片用餐可享九折」 for dining. It is marked student and staff, and the note says students qualify for dining only.
- **Periods** are ROC ranges on the last line of each cell (115 = 2026). The end of the range is used as `expires_on`.
  - **自動展延 rows whose stated range has ended** → `expires_on: null`, `auto_renew: true`, with the range quoted in `notes`. There are 9: 法羅米 (1060524自動展延), foodpanda (1121116-1131231), 葛瑪蘭 (1090420-1100419), 蘭桂坊 (1130606-自動展延), 比雅久 (1090623-1100622), 林肯幼兒園 and 林肯補習班 (1120401-1140331), 阿瘦 (1091005-1101004) and 徐氏父女 (1130410-1140410).
  - **自動展延 rows still inside their range** keep the end date and get `auto_renew: true`: WUWOW (→ 2027-03-31) and 航典 (→ 2026-12-31).
  - 墾丁福華 lists two ranges, 「1150101-1151231」 and 「1160101-1161231」, so it uses the later end, 2027-12-31.
  - 耐斯王子 's 餐廳 row has no period → `null`, noted.
- **耐斯王子大飯店** has two rows (餐廳團體餐劵團購 and 住宿). Both were kept, with subtitles 「餐廳團體餐券」 and 「住宿」.
- **Regions** come from the address. 義大天悅's address is only 「高雄市」 → south.
  - 薰衣草森林 has no address. Its 04 phone gives central, as noted.
  - 台北旅店集團 lists a 台中車站店 → north + central.
  - foodpanda, WUWOW (online courses) and 阿瘦's online shop → all four.
  - 航典 is a 嘉義 agency with online sign-up → south.
- **Phones** are copied exactly as published, including the odd ones (埔里四季蒸宴, 知本金聯 and 蜜月世紀 all list 07-2621158, a 高雄 number). Contact names are in `notes`.
- **Highlight:** the 折 rate where one is given. Otherwise 專屬優惠價 (hotels), 消費贈品, 折$1000 (航典), 7折起 (義大遊樂世界), 企業帳號 (foodpanda), 團購優惠 (耐斯 餐廳) or 特約優惠.
- **Names:** 「富胖達股份有限公司」 is recorded as 「foodpanda 企業帳號」 with the company as subtitle. 「阿瘦實業股份有限公司」 becomes 「阿瘦皮鞋 線上購物網」. 「比雅久電動車業有限公司嘉電營業所」 becomes 「比雅久電動車業 嘉電營業所」 (the 「PGO」 subtitle is the brand). 「六書堂數位學習股份有限公司」 becomes 「六書堂數位學習 WUWOW」. 「民雄阿潘肉包股份有限公司」 drops 股份有限公司 (kept in notes).
- `source_url` is the sheet's `/edit` URL for every record, as the issue asks.

## Caveats

- **Few student deals.** Only 8 of 31 records explicitly name students. Most hotel rows say only 「憑識別證」. At CCU the 識別證 may include the 學生證; the sheet doesn't say, so they were left staff-only.
- 11 records rely on 自動展延 for contracts first signed between 2017 and 2025. The merchants may no longer honour them.
- Several offers are vague (「憑識別證事先訂房可享優惠」, 「保養、購車及配件優惠」, 「線上購物網優惠」). They are kept with the badges 專屬優惠價 and 特約優惠.
- The sheet's 醫療 pointer (health.ccu.edu.tw) is a 404, so no medical deals are included.
