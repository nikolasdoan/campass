# CSMU 中山醫學大學 partner-discount source (verified 2026-10-24)

> **Status: extracted.** Every record in `csmu.json` comes from pages fetched with curl on 2026-10-24.

## Extraction summary (`csmu.json`, 96 records)

| School | Source (level) | URL fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| CSMU 中山醫 | 人力資源室 「特約商店」 (school) | Index https://personnel.csmu.edu.tw/p/403-1012-387.php?Lang=zh-tw. Lists: 飲食&育樂 https://personnel.csmu.edu.tw/p/406-1012-70698,r387.php and 住宿&租車 https://personnel.csmu.edu.tw/p/406-1012-70684,r387.php. The other index entries were also fetched: 406-1012-41595, 406-1012-37647 and 406-1012-41594. | Server-rendered HTML tables. On the food page, the 飲食&購物 table has columns 教職員 / 學生 / 校友 / 附醫 (√ or –). The other food-page sections (運動健身, 手機&網路, 旅遊, 外送, 醫療, 幼兒園) have no eligibility columns. The lodging table has name, 聯絡方式 and an 適用對象 text column, and **no offer column**. No row links a PDF or image for its terms. | **96 rows**: 46 on the food page (34 飲食&購物, 2 運動健身, 3 手機&網路, 2 旅遊, 2 外送, 2 醫療, 1 幼兒園) and 50 on the lodging page (45 住宿, 5 租車/旅遊) | **96** | 0 | 0 rows (3 other index entries not imported, see below) | Index 最後更新日期 2026-10-20. Food page 「資料更新：2026/12/30」 (see below); lodging page 「資料更新：2025/12/30」 |

`source_url` is the list page each row came from: 46 records point to the food page and 50 to the lodging page.

**Index entries not imported (they are not rows in the two lists):**
- **406-1012-41595 「★113年度特約商店一覽表★(僅供參考)」.** This is the 2024 list, marked reference-only and superseded by the two current pages.
- **406-1012-37647 台灣高鐵企業會員 (code 52000403).** It is a corporate membership whose benefit accrues to the school, not a discount for individuals.
- **406-1012-41594 台灣大哥大企業客戶 員工眷優惠專案.** The page states no discount. The 台灣大哥大 row in the 手機&網路 table *is* imported (see below).

**Records by region:**

| Region | Single-region records | Including multi-region records |
|---|---|---|
| central | 49 | 59 |
| north | 24 | 34 |
| south | 8 | 18 |
| east | 1 | 11 |

10 records cover all four regions. These are online shops, delivery platforms, nationwide chains and phone-order sellers: 施巴, 沐內, 愛菲斯, 朵法婭, 豐晨, 台灣大哥大, 創宇, 永勁旅遊, 富胖達 and 菜霸子. 4 records are in 金門 with `regions: []`: 醉酒香陳窖, 浯島文旅, 二毛旅行社 and 永成小客車.

Category counts: lodging 45, food 26, shopping 9, health 4, services 4, transport 4, entertainment 3, education 1.

**Eligibility counts:** 95 staff, **83 student**, 49 alumni, 0 family. 13 records have no 學生 and are kept with `student: false`. They are staff-only, and the staff-only records are: 匠屋燒肉, 徐氏父女皮件, 豐晨, LALAport, 麗寶, 享得道, 文華道, 星享道, 台中商旅, 旗津道, 中興租車, 崴暘 and 和泰/yoxi. All other records include students. 成旅晶贊 台北蘆洲館 is 學生、校友、附醫 with no 教職員, so it has `staff: false`.

## Field mapping and judgement calls

- **Eligibility, 飲食&購物 table:** √ in 學生 → `student`, 教職員 → `staff`, 校友 → `alumni`. A cell with –, - or nothing is false. 附醫 (hospital staff) is not a field; when ticked, it is listed in `info` 「適用對象（表格勾選）」. No row has 附醫 as its only tick, so no 「只有附醫」 note was needed.
- **Eligibility, rows with blank cells:** eight 飲食&購物 rows have all four cells empty. They are 桂田酒店台南館, 麻葉, 朵法婭, 蕃茄村, 豐晨, 岩漿火鍋, 尚億 and 膳馨.
  - Where the offer text names the groups, that wording is used and quoted in `notes`:
    - 朵法婭: 「中山醫大校友及教職員工生」 → student, staff and alumni.
    - 蕃茄村: 「學校教職員證、學生證;附設醫院員工證」 → student and staff.
    - 豐晨: 「中山醫大及其附屬機構之同仁」 → staff only.
  - The rest, and every row in the sections without eligibility columns (運動健身 through 幼兒園, 13 rows), follow the page rule 「※使用各項優惠時請務必出示本校相關識別證」. They are marked **student + staff**, with alumni false: 朵法婭's wording 「校友證或教職員工生識別證」 shows that 識別證 means the staff and student cards, and the 校友證 is separate. There are 17 such records, each with a note saying so.
- **Eligibility, lodging and 租車/旅遊:** read from the 適用對象 text 「教職員、學生、校友、附醫」 by the same mapping. When 附醫 is included, `notes` says 「適用對象含附醫」.
- **Lodging offers are not stated on the page.** The page lists the hotel, phone and email, and 適用對象. The terms are in contracts in 人力資源室檔案櫃, which needs a 校務資訊系統 login. The 50 rows are kept, because the page itself states that each one is a 特約 hotel, rental company or travel agent for these groups.
  - `highlight` is 「特約價」.
  - `offer` says that the special rate needs the school ID and that the rate must be asked for.
  - `notes` says the contract was not transcribed.
  - No figures were invented.
- **The 「資料更新：2026/12/30」 label on the food page** is in the future as published. It is treated as the page's own label (probably a typo for 2025/12/30, which the lodging page shows), **not** an end date. No `expires_on` was taken from it.
- **End dates:**
  - Only 青花驕麻辣鍋 and 原燒 carry their own date, 「至115/12/31止」 → `expires_on: 2026-12-31`.
  - 「(永久)」 rows get `null`, noted as 表格標示「(永久)」.
  - All other rows get `null`.
  - Nothing is expired, and `auto_renew` is false everywhere.
- **Regions:**
  - From the address in 聯絡方式: 台中/南投 → central; 台北/新北/桃園/新竹/宜蘭 → north; 台南/高雄/嘉義 → south; 花蓮 → east; 金門 → [].
  - Rows with no city (Uccello and Bee Coffee on campus, 元手壽司, 匠屋, 信福 and 7AM, which list Taichung districts only) → central.
  - Lodging uses the section header (台中區 → central; 大台北, 桃竹苗 → north; 南部 → south; 東部 → east, except 龍潭湖居民宿 宜蘭礁溪 → north; 離島 → []).
- **Category:**
  - 飲食&購物 rows are `food`, except the retail ones (施巴, 金典綠園道, 沐內, 醉酒香, 徐氏皮件, 愛菲斯, 朵法婭, 豐晨, LALAport) → `shopping`, and 妮娜巧克力 → `entertainment`.
  - Sections map as follows: 運動健身/醫療 → health; 手機&網路 → services; 旅遊 → entertainment; 外送 → food; 幼兒園 → education.
  - In 租車/旅遊: 二毛旅行社 → services and the rest → transport.
- **Names:**
  - The (分店) part of a name goes to `subtitle`.
  - The four-branch 膳馨/馨苑 row is one record, 「膳馨民間創作料理 / 馨苑小料理」, with all four branches in the subtitle.
  - 「原    燒」 is normalised to 原燒.
  - 桂田酒店 has both a food row (restaurants 9折) and a lodging row. The two are kept as separate records.
- **`highlight`** is the first concrete discount in the offer text, set by hand where the text has none or where the first match would mislead (for example 長春 「課程9折」, 永勁 「團費折500元起」, 金典 「專櫃折扣」).
- **Pointer-only rows kept, with notes:**
  - 台灣大哥大: 「方案內容請參考DM與專案同意書」. The DM is not on the page.
  - LALAport: the store list is on 人事室 福利消息.
  - 昭安泌尿科: it lists treatment types 「優惠」 with no amounts.
- **Links:** the websites written into offer text (darphia.com, s3.com.tw) and the 台北旅店集團 branch-list link.

## Validation

- JSON parses: 96 records, all with the `ncu.json` key set and valid categories.
- No `expires_on` is before 2026-10-24, and there are no duplicate (name, subtitle) pairs.
- `python3 scripts/import_deals.py` in a throwaway copy imported all 96 CSMU records with 0 skips. `deals.json` and `seed/` were not committed.
