# NCKU 成大 partner-discount source (verified 2026-10-15)

> **Status: extracted.** Both URLs below were fetched with curl on 2026-10-15. Every record in
> `ncku.json` comes from the PDF fetched that day. The PDF's table cells were read with pdfplumber and
> checked against `pdftotext -layout` and `pdftotext -raw`.

## Extraction summary (`ncku.json`, 56 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| NCKU 成大 | 校友聯絡中心 VIP卡及校友卡特約商店名單 (school) | Page https://alumni.ncku.edu.tw/p/412-1004-19459.php?Lang=zh-tw → its only PDF link, https://alumni.ncku.edu.tw/var/file/4/1004/img/772889412.pdf | 15-page PDF exported from Excel. Columns: 編號 / 商店 / 折扣內容 / 電話 / 傳真 / 地址. Sections: 飯店類 37, 美食餐飲類 32, 交通類 3, 醫藥類 1, 其他類 9, 旅遊業 1 | 83 | **56** | 27 | none | Each PDF page header says **更新日期：114年1月7日 (2025-01-07)**, and the PDF metadata says it was created 2025-01-07. The HTML page itself shows no date. |

Kept by section: 飯店類 24, 美食餐飲類 21, 交通類 3, 醫藥類 1, 其他類 6, 旅遊業 1.
Kept by category: lodging 24, food 20, shopping 4, transport 3, health 2, entertainment 1, education 1, services 1.

**Expired, 27 skipped.** Each of these rows has an explicit contract or offer end date before 2026-10-15:

- 113-12-31 (2024-12-31), 17 rows:
  - Hotels: 台糖長榮酒店(台南) (hotel), 蓮潭國際文教會館, 捷喬商務旅館, 福容大飯店連鎖集團, 新驛旅店 (5 branches in one row), 台中港酒店, 台北漢來大飯店, 桂田酒店, 知本金聯世紀酒店, 蜜月世紀大飯店
  - Restaurants: 台糖長榮酒店(台南) (restaurants), 台南大飯店-翡翠廳 (優惠期限 113-01-08–113-12-31), 肉次方, 聚鍋, 西堤牛排, 桂田酒店-台南館 (restaurants), 蜜月四季-埔里四季蒸宴
- 114-12-29 / 114-12-31 (2025), 8 rows: 禧榕軒大飯店, 星漾商務會館, 高雄漢來大飯店, 涮乃葉, 橫濱牛排, 古拉爵, 晶盛科技 (Straight A), and 王品-和牛涮. 和牛涮's contract says 即日起~, but every listed benefit is under 優惠期限 113-01-08–114-12-31, so nothing valid is left.
- 114-06-30, 1 row: 愛菲斯居家美學.
- Stale promotion only, 1 row: 美麗華皮件. Its only discount was the 「113年專案檔期 113/09/01–113/09/30 全品項39折」. The rest of the row is ordering logistics.

**Kept, 56 rows.** None of these rows has an end date, or the end date is open (「本合約有效期限:即日起~」, or 夏慕尼's 「優惠期限：自113年1月1日起」). There is one exception, 朵法婭, described below.

**Deduplication:** no row in the PDF repeats the same merchant and branch. 台糖長榮酒店 and 台南大飯店 each appear twice, but the two rows are a hotel deal and a restaurant deal. The 台糖長榮 rows are both expired; the 台南大飯店 hotel row is kept and its restaurant row (翡翠廳) is expired. The PDF numbers two restaurant rows 26 (聚鍋 and 夏慕尼). Both are counted.

**Older PDFs:** the page now links only `772889412.pdf`. Older PDFs were not used.

Records by region:

| Region | Single-region records | Including multi-region records |
|---|---|---|
| south | 45 | 51 |
| east | 3 | 9 |
| central | 2 | 8 |
| north | 0 | 6 |

Six records cover all four regions (online or 全台): 中華航空, 長榮航空, 中國東方航空, Magi Planet 星球工坊, 采豐數位 (紀念品網站) and 朵法婭. No record is on an outlying island. **13 records are student-eligible**, 37 are staff-eligible, and all 56 are alumni-eligible.

### Field mapping and judgement calls

- **Eligibility** follows each row's own wording:
  - 校友卡 / 校友VIP卡 → alumni.
  - 成功大學職員證, 識別證, 教職員 or 教職人員 → staff.
  - 學生證 or 教職員工生 → student.
  - No row mentions 眷屬, so `family` is false everywhere.
  - Rows that name no audience use the list's own general rule, its title 「國立成功大學VIP卡及校友卡特約商店名單」, and are marked alumni only, with a note. These rows are 中華航空, 長榮航空, 中國東方航空 and 喜鴻餐飲 (「憑證件享有優惠」).
  - 天下大飯店-圓頂西餐廳 says 「凡成大人(含成大教職員工、學生、校友、成大醫院員工)」, so student, staff and alumni are all true. The 成大醫院 staff are mentioned in `notes`.
- **Expiry:**
  - Every kept record has `expires_on: null`.
  - ROC dates were converted (113 = 2024, 114 = 2025, 115 = 2026).
  - 朵法婭's contract runs 「自114年1月1日起至115年1月1日止」 and adds 「(雙方同意若無變更合約將自動展期)」. 自動展期 means automatic extension, so this was treated as 自動續約: the record is kept with `auto_renew: true` and `expires_on: null`, and the reason is in `notes`.
  - No other row says 自動續約.
- **Regions** come from the address. 義大皇家酒店 and 義大天悅酒店 have no address in the PDF, so their region (south) comes from the 07 phone area code, as stated in `notes`. Magi Planet says 「全台門市」, so it gets all four regions even though only two Taipei stores are listed.
- **Category:**
  - Section 飯店類 → lodging, and 美食餐飲類 → food, with one exception: Magi Planet 星球工坊 (a board-game shop listed under 美食餐飲類) → entertainment, as noted.
  - 交通類 → transport.
  - 醫藥類 → health, and 宏恩眼鏡 → health, following the other-schools convention for optical shops.
  - The other 其他類 rows: 博士韋爾, 蘭卉生技, 采豐 and 朵法婭 → shopping, and 外語中心 → education.
  - 旅遊業 (喜鴻旅行社) → services, following the other-schools convention for travel agencies.
- **Highlight:** the best 折 rate is used (九折 → 9折, 95折, 8折, 85折), and 蘭卉 gets 「7折起」 (8折, or 7折 with a VIP card). Gift-with-purchase rows (決哥 點數, 五鮮級 送海鮮拼盤, 夏慕尼 主廚私房菜, 采豐 御守) get 消費贈品. Hotels whose text says 「優惠價」 (娜路彎, 義大×2, 台南大飯店) and 長榮航空 (「享優惠票價」) get 專屬優惠價. Everything else, including the 康橋 「享有住宿優惠」 rows and 宏恩眼鏡 「另享折扣優惠」, gets 特約優惠.
- **Merchant names:**
  - Merchants filed under a corporate parent use the brand name, with the company in `info`: the 王品 restaurant 夏慕尼, 虎山雷, and 星奕 → Magi Planet.
  - Branch names go in `subtitle`. Examples: 康橋 「高雄五甲館」, and 多那之 「東寧門市」.
  - The 18 康橋商旅/康橋大飯店 branches are kept as separate records, because each has its own address and phone.
- **Phones and addresses** were copied from the cells. When a cell had several numbers, the first is in `phone` and the others are in `info`. Fax numbers are in `info`.
- **Credentials withheld:** the 長榮航空 row publishes an EVA corporate-booking **account and password**. These were deliberately not copied into the JSON. The offer text says the credentials are in the school's PDF, and the record links to the PDF and to the EVA booking page. The promo codes (華航 TW023670, 東航 NCKUMU, 朵法婭 SVIP2401) are ordinary discount codes and were kept.
- **Cleaning:** line breaks inside cells were joined. URLs split across lines (the 香格里拉, 華航, 長榮 and 東航 links) were rejoined. 朵法婭's 「https：//」 was normalised.

## Caveats

- **Staleness risk:** the list was last updated on 2025-01-07, more than 21 months before retrieval. 27 of 83 rows had already expired by their own dates. Kept rows have no end date but may no longer be honoured, so every record's `notes` includes 「名單更新日期 2025-01-07…消費前請先向店家確認」.
- Many kept hotel rows (康橋 ×18, 太子文旅, 香格里拉) say only 「享有住宿優惠」 and give no rate. 宏恩眼鏡 and 喜鴻餐飲 also give no discount size.
- The PDF cuts off the 喜鴻旅行社 row mid-sentence (「…不適用上述特惠範」). The same text appears in layout, raw and pdfplumber output, so the truncation is in the source. This is noted in the record.
- The 東航 「成大專屬購票優惠」 link is a 2020 campaign URL and may be dead. The airline rows give office addresses, but the deals themselves are online.
- Most rows require a 校友卡 or 校友VIP卡. Only 13 kept rows explicitly accept a 學生證 or say 教職員工生.
- The 人事室 優惠專區 (http://pers.ncku.edu.tw/p/412-1029-20048.php) is still dead and was not re-checked for this file. See `other-schools.md`.
