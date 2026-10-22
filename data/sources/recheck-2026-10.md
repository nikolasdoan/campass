# Re-check of existing sources (2026-10-22)

> Report only; the source files were not edited. Every page below was re-fetched with curl on **2026-10-22**.
> "Record" means an entry in `data/sources/*.json` as of branch `claude/jolly-maxwell-e43rxf`. Quoted text
> is copied from the page as fetched today.

## 1. Expired records (`expires_on` before 2026-10-22)

20 records have passed. Each `source_url` was re-fetched (all HTTP 200), and **none of the 20 deals was renewed**: the page still shows the same end date. campass-1 can drop all 20.

### `ntu-research.json` (19)

17 records come from the 臺大系統學生會 Google Sites pages. The pages still say ©2022 and still show the old 【優惠期限】:

| Record (name / subtitle) | `source_url` (page) | `expires_on` | Text on the page today | Status |
|---|---|---|---|---|
| Agoda 訂房網 | …/system/臺大/生活-娛樂 | 2022-12-31 | 「（優惠碼使用期限至2022/12/31，適用入住日期至2023/03/31）」 | gone (not renewed) |
| 貳號基地Cafe | …/system/臺師大/飲食 | 2021-11-01 | 「【優惠期限】2021/11/01」 | gone |
| JOHN DOE CAFÉ 無名氏咖啡 | …/system/臺師大/飲食 | 2021-12-17 | 「【優惠期限】2021/12/17」 | gone |
| 2D Cafe / 師大旗艦店 | …/system/臺師大/飲食 | 2022-01-01 | 「【優惠期限】2022/01/01」 | gone |
| 旺禾港式燒臘 | …/system/臺師大/飲食 | 2021-12-15 | 「【優惠期限】2021/12/15」 | gone |
| 13_Burger / 13 Burger | …/system/臺師大/飲食 | 2021-12-16 | 「【優惠期限】2021/12/16」 | gone |
| 怪獸小雞排 / 師大店 | …/system/臺師大/飲食 | 2021-12-20 | 「【優惠期限】2021/12/20」 | gone |
| 騎士碁ChessChicken-雞排專賣店 | …/system/臺師大/飲食 | 2022-01-17 | 「【優惠期限】2022/01/17」 | gone |
| 老茶人 / 師大店 | …/system/臺師大/飲食 | 2021-12-17 | 「【優惠期限】2021/12/17」 | gone |
| 藍鵲 / 師大店 | …/system/臺師大/飲食 | 2022-01-27 | 「【優惠期限】2022/01/27」 | gone |
| 男子漢早餐店 | …/system/臺師大/飲食 | 2022-01-19 | 「【優惠期限】2022/01/19」 | gone |
| 芳鄰健身事業有限公司 | …/system/臺師大/其他 | 2022-03-08 | 「【優惠期限】2022/03/08」 | gone |
| 玉欣珍 / 台式小吃和平店／異國料理店 | …/system/臺科大/飲食 | 2022-04-07 | 「【優惠期限】2022/4/07」 | gone |
| 上賀海南雞腿飯 | …/system/臺科大/飲食 | 2022-06-30 | 「【優惠期限】2022/6/30」 | gone |
| 眯糊茶 | …/system/臺科大/飲食 | 2022-06-30 | 「【優惠期限】2022/6/30」 | gone |
| 油力特機油認證店 | …/system/臺科大/交通 | 2022-04-09 | 「【優惠期限】2022/4/09」 | gone |
| 威比大廚 | …/system/臺科大/其他 | 2022-06-30 | 「【優惠期限】2022/6/30」 | gone |

The full URLs are `https://sites.google.com/gapps.ntnu.edu.tw/system/<path>` (URL-encoded in the records).

The other 2 records come from the 臺師大 PDF on triangle.ntu.edu.tw: https://triangle.ntu.edu.tw/001/Upload/1571/ckfile/4c61f706-ae6a-4e13-b389-e5fb2803d4e1.pdf. The PDF is unchanged: 「更新日期： 2025.9.22」, created 2025-09-22. https://triangle.ntu.edu.tw/discount.html still links the same file.

| Record | `expires_on` | Row in the PDF today | Status |
|---|---|---|---|
| 椒麻雞大王 / 臺師大和平校區Ⅰ | 2026-06-30 | 「和平校區Ⅰ 10 學一舍地下1樓 椒麻雞大王 … 憑證享會員價之優惠 … 即日起~115/06/30」 | gone (no newer list) |
| 銅樂鍋物 / 臺師大其他 | 2025-12-31 | 「其他 29 師大路39巷1號 銅樂鍋物 … 憑證享9折優惠。 … 即日起~114/12/31」 | gone |

### `other-schools.json` (1)

| Record | `source_url` | `expires_on` | Text on the page today | Status |
|---|---|---|---|---|
| 辛麻辣鍋物餐廳 / 新竹縣竹北市 | https://person.site.nthu.edu.tw/p/406-1066-230638,r903.php?Lang=zh-tw | 2024-06-12 | 「(二) 內用雙重優惠：(1)點三鍋赠送一鍋 (2)點單鍋8.5折 / 優惠至113-06-12」, with 「合約到期日: 永久」 | gone. The offer text still ends 113-06-12. Only the contract is 永久, and there is no new offer. |

## 2. New and removed entries, changed end dates

### `ncu.json` — NCU 校友服務中心 「校友證福利」
- **Fetched:** `https://ncu.edu.tw/asc/benefits.php?area=&keyword=&type=&page=N` for N = 0…180 (19 pages, all 200). N = 190 and 200 are empty.
- **Cards:** 183, the same as on 2026-10-15. All 147 records still match a card. The cards without a record are the ones skipped on 2026-10-15: expired cards, 康橋 ×2 and 頭城 (no terms), 禾馨, the empty card, 立碁購 and the 美麗華 campaign cards.
- **New:** none. **Removed:** none. **Changed end dates:** none.
- **Changed text:**
  - **涮乃葉 (信義遠百/台中大遠百店/福科店/文心秀泰店/豐原萬家福店)**, page=0. The card title is now 「涮乃葉 (統一市府店/信義遠百/台中大遠百店/福科店/文心秀泰店/豐原萬家福店)」.
  - 連絡電話 now reads 「02-2723-0646/02-2763-0298/ 04-2254-7131」.
  - The offer text adds a branch block: 「台北統一時代市府店 / 訂位專線 02-2723-0646 / 店家地址 台北市信義區五段8號3樓 / 營業時間 平日11:00-23:30 假日11:00-00：00(週五-周六)」, and a 「台北信義遠百店 / 訂位專線 02-2763-0298 / 店家地址 台北市信義區松仁路58號7樓」 block.
  - The 優惠期限 is unchanged: 「115.10.01-116.12.31」. The new address text is incomplete as published (no road name).

### `ncku.json` — NCKU 校友聯絡中心 VIP卡及校友卡特約商店名單
- **Fetched:** https://alumni.ncku.edu.tw/p/412-1004-19459.php?Lang=zh-tw (200). It still has one PDF link, https://alumni.ncku.edu.tw/var/file/4/1004/img/772889412.pdf (200, 15 pages).
- The PDF is still created 2025-01-07, and every page header says 「更新日期：114年1月7日」. It is the same file as on 2026-10-15.
- **No changes.**

### `cmu.json` — 中國醫藥大學學生會 特約商店
- **Fetched:** WP REST `https://www.twcmusa.org/wp-json/wp/v2/avada_portfolio?per_page=100&page=1..3` (200). The total is still `X-WP-Total: 209`.
- Every record's `source_url` is still a published post. The 13 posts without a record are the 13 older duplicates noted in `cmu.md`.
- No post was created or modified after 2026-10-15; the newest `modified` is 2026-06-02.
- **No changes.**

### `ksu.json` — 崑山科大 特約商店
- **Fetched:** https://bir.ksu.edu.tw/cr/public/application/ksulife/store (200). It still has 124 `Store_FirmData(id)` cards with the same id set.
- All 124 `ajax?id=<id>&action=StoreGetFirmData` calls returned `status: 0`.
- All 112 record ids are present. The 12 skipped ids are unchanged. Every `合約終止日期` matches the record's `expires_on` (2099-12-31 → null).
- **New:** none. **Removed:** none. **Changed end dates:** none.
- Several offers differ from the page only because of cleaning at extraction time (typo fixes, removed expired blocks), as documented in `ksu.md`.

### `other-schools.json`

#### NCHU 中興 校友中心 特約商店 (`alumni.nchu.edu.tw/vstore.php`)
- **Fetched:** `vstore.php` and `?page=2…14` (all 200). There are **160 cards** (159 on 2026-10-15). Card ids run a1–a253.
- All 128 records are still listed, and no 期限 changed.
- **New entries**, from the page's modals:
  - **a253 彩碗 ColorBowl Poke 大里大明店:**
    - 期限：2027-10-20
    - 「1. 至彩碗台中大里大明店門市消費$135以上（適用於內用、外帶及自取，不限平日與假日），即可享有送「金鮮蛋一顆」之優惠。2. 本特約優惠不得與門市其他任何行銷優惠活動或外送平台訂單重複累計或合併使用。」
    - 地址：台中市大里區大明路278-1號1樓
    - 電話：04-24823493
    - 使用對象：教職員、在校學生
  - **a252 台中大毅老爺行旅:**
    - 期限：2026-12-31
    - Terms are only 「請見連結」, so it should be skipped like the other link-only cards.
    - 地址：台中市西區英才路601號
    - 電話：04-23766732
    - 使用對象：教職員、在校學生、校友
- **Removed:** two new cards but a net change of +1 means one card that had no record is gone. I can't name it because the 2026-10-15 skip list wasn't itemised. No recorded merchant is gone.
- **Page drift:** the new cards at the top pushed the list down, so **9 records' `source_url` page no longer shows the merchant**:

  | Record | `source_url` page | Page now |
  |---|---|---|
  | 元里診所 | 2 | 3 |
  | 西谷子養生元氣堂 | 3 | 4 |
  | 禹太健康事業股份有限公司 | 6 | 7 |
  | foodpanda(富胖達股份有限公司) | 8 | 9 |
  | 興大汽車租賃有限公司 | 9 | 10 |
  | 進萬汽車維修廠 | 10 | 11 |
  | 有心食堂 | 11 | 12 |
  | 明祐耳鼻喉科診所 | 12 | 13 |
  | 玉山銀行 台中分行(北台中消金中心) | 13 | 14 |

  This will keep happening. Consider `https://alumni.nchu.edu.tw/vstore.php#a<id>` or a note with the card id.

#### NCCU 政大 校友服務中心 特約廠商 (`www.alumni.nccu.edu.tw/benefit_vendor`)
- **Fetched:** 200. There are **130 vendor blocks** (131 on 2026-10-15).
- **Removed:** the vendor that is gone is **NISSAN**, which was already skipped as expired (2026-09-22). No recorded vendor is gone. (沐芯牙醫 is still there; the page writes it 「沐芯⽛醫」 with a Kangxi-radical character.)
- **New:** none. The 16 blocks without a record are the 13 attachment-only blocks, 台灣高鐵, 時藝多媒體, and 沐芯 (the character mismatch).
- **Changed end date:**
  - **棋建壂** (`expires_on` 2026-10-29). The page now says 「即日起～2027-10-29」.
  - The terms are unchanged: 「擁有政大校友證的校友及教職員工和學生，在結帳時憑出示相關證件, 可享下列優惠: … TEYUE9090-單筆消費8000(含)元以下享9折優惠 …」.
- **Minor:**
  - **Dike 生活家電** now reads 「…並於指定網頁( https://reurl.cc/bm1v73 )下單，可享企業員工福利價格優惠措施」 (the record says 「始享」).
  - Its period is 「即日起～2026-10-31」, so it expires in 9 days.
- 18 vendors carry an 「更新」 badge today: SPORTS NATION, 中華航空, 享沐時光莊園渡假酒店, 力麗觀光, 和苑三井花園飯店, 將捷金鬱金香酒店, 山富旅遊, 時藝多媒體, 晶華捷絲旅, 朵法亞生活美學館, 涮乃葉(信義遠百店), 王品牛排, 自己做烘焙＆吳寶春自己做, 臺鹽生技, 萬芳醫院健康管理中心, 金色三麥, 阿默蛋糕 and 高雄日航酒店.
  - Their periods match the records, and the record offer text is still found in each block.

#### NTHU 清大 人事室 特約商店 (`person.site.nthu.edu.tw`)
- **Fetched:**
  - The 12 category lists `p/403-1066-{903,904,929–935,937–939}-N.php`: 903 has 4 pages; 904, 931 and 932 have 2; all 200.
  - All 76 record detail pages (all 200).
  - The 37 listed detail pages that have no record (all 200).
- **Listed detail pages:** 113 unique (112 on 2026-10-15). All 76 record ids are still listed.
- **Changed end dates:** none. Every 合約到期日 matches the record. 楓樺台一 「114.12.31(合約到期自動展延1年)」 and 三久太陽能 「1140101-1151231」 are read as before (2026-12-31).
- **Entries without a record (37):**
  - **15 are past their 合約到期日:**
    - 牛小排 1051231
    - 石上湯屋 1141231
    - 格哆莉奶酪優禮 1141231
    - 光復高中附設實驗幼兒園 115.01.31
    - 壯嬴磁鐵 1100219
    - 銘新汽車工坊 2023/12/31
    - foodpanda 114.12.31
    - **VVG好樣餐飲 115.07.31**
    - 朵法婭 114.02.01
    - 晶盈親旅 1141231
    - 晶悅精品旅館 1141231
    - 日勝加賀屋 1141231
    - 美平方 1150531
    - 角樂園農場 1150715
    - 風澤中醫 1150228
  - **2 are 高鐵 procedure pages** (39728, 86756).
  - **20 are current:**
    - 華富爾珠寶 永久
    - 新竹旅行社 永久續約
    - 綕馥企業社 永久
    - 一六八旅館 永久
    - Fanier費尼 永久
    - 泓揚精緻商旅 永久
    - 鮪魚家族 永久
    - 凱尼斯旅行社 永久
    - 和杏中醫 1151231
    - 蔬謙食代 永久
    - 愛的寵物天堂 (no date)
    - 雪之湖咖啡 (a 450 link to a 人事室 page)
    - 江美麗婦產科 1161231
    - 儀軒地政士 永久
    - 儀軒會計師 永久
    - 佳仕奇皮箱 永久
    - 橘寶科技 116.6.30
    - 喜鴻旅行社 1170116
    - 岩漿火鍋 永久
    - 古拉爵特定店鋪 1170702

    On 2026-10-15, 19 entries were skipped as terms-only-in-PDF, so the net change is **+1**. I can't tell which one is new because that list wasn't itemised.
  - No recorded merchant is gone.

#### NYCU 陽明交大 人事室 特約商店明細表 (Google Sheet `1h1jEMiH6LPjdO3I_mWMUxBF0v9SOgx6aOuP2UdVI4ok`)
- **Fetched:**
  - The HR page (200). It still shows 「更新日期：115-09-17」.
  - `export?format=xlsx` (200, 8 tabs).
  - The 7 CSV gids used in the records (all 200).
- **Rows:** 161 store rows today (163 counted on 2026-10-15).
- All 49 records are still in the sheet. One was renamed: 「新竹市私立菁英汽車駕駛人訓練班」 is now 「新竹市私立**精**英汽車駕駛人訓練班」.
- **Changed end dates (3):**
  - **台北旅店集團 喜瑞飯店** (`expires_on` null, `auto_renew` true): 備註 is now **2026-12-31**.
  - **救國團新竹團委會「終身學習中心」** (`expires_on` 2026-12-31): 備註 is now **2027-12-31**.
  - **新竹市私立菁英汽車駕駛人訓練班** (`expires_on` null, `auto_renew` true): 備註 is now **2027-12-31** (and the name is now 精英).
- **Many more rows now have terms.**
  - On 2026-10-15, 99 of 163 rows had an empty 項目 cell. Today, **101 rows** have a non-empty 項目 (the cell right of 「優惠項目」).
  - 53 of those rows have no record:
    - **48 are current** (listed below).
    - **4** have a 備註 date that has passed: Ten 旅宿 & 13Villa 2026-07-01, 帕莎蒂娜國際餐飲 2026-06-30, 新竹.適采牙醫診所 2026-08-30, 愛菲斯居家美學 2026-06-30.
    - **1** is 「洽談中」: 晶華國際酒店集團｜三燔北投晶泉丰旅 / 大直泰市場海鮮餐廳 / 泉源閣.

  The 2026-10-15 skip list wasn't itemised. Some of the 48 may have been skipped then as stale-promo-only (7 rows), but most look newly filled. Several hold only a code or 「電洽」, and some contain past sub-promotions (for example 娜路灣 「購買日:8/1~8/14」 and 132官舍 「即日起至8/31前」). Judge them before extracting.

  The 48 current rows without a record are below. The text is copied from the sheet; ` / ` marks a line break inside a cell.

| Tab | 店名 | 適用對象 | 項目 (quoted) | 地址 | 電話 | 備註 |
|---|---|---|---|---|---|---|
| 旅宿 | 圓山大飯店 | 教職員工 / 學生 / 校友 | 電洽 | 台北市中山區中山北路4段1 號 | 02-2886-8888 #1507 | 2026-12-30 |
| 旅宿 | 台中裕元花園酒店 | 教職員工 | 合約號碼：87557573 | 台中市西屯區台灣大道四段610號 | 04-2465-5660#5503 | 2026-12-30 |
| 旅宿 | 墾丁福華渡假大飯店 | 教職員工 | 每張員工證限優惠2間客房 / 麗香苑用餐免收一成服務費，限優惠4位 | 屏東縣恆春鎮墾丁路 2 號 | 08-886-2323 | 2027-12-31 |
| 旅宿 | 新竹福華大飯店 | 教職員工 / 學生 / 校友 | 合約代號：2K790 | 新竹市中正路178號 | 03-528-2323 | 2026-12-31 |
| 旅宿 | 168inn 愛時租旅館 | 教職員工 / 學生 / 校友 | 潮旅館：(03)301-2220 / 六星桃園館：(03)346-7668 | 桃園市桃園區 | 03-301-8081 | 2026-12-31 |
| 旅宿 | 新竹安捷國際酒店 | 教職員工 | 限定使用校方信箱預約+專案代碼：AJHCCG訂房 | 竹北市復興三路二段168號 | 03-6209777 | 2026-12-31 |
| 旅宿 | 太子文旅(成大館) | 教職員工 / 學生 / 校友 | 合約代碼：：87557573 | 台南市東區大學路2號 | 06-275-8999 | 2026-12-31 |
| 旅宿 | 台南大飯店 | 教職員工 / 學生 / 校友 | 商店代號:87557573 / 1130前免10%服務費｜台南大飯店《駿勢飛羊》尾牙春酒 | 台南市中西區成功路1號 | 06-2289101 / 林筱容Kay Lin 0978-301900 | 2026-12-31 |
| 旅宿 | 台中港酒店 | 教職員工 / 學生 / 校友 | 訂房代號：87557573 | 台中市梧棲區大智路二段388號 | 04-3705-5888 #6210 | 2026-12-31 |
| 旅宿 | 承億文旅股份有限公司 | 教職員工 / 學生(商務專案不適用) / 校友(商務專案不適用) | 訂房代號：87557574 | 嘉義市東區啟明路146號3樓 | 05-2756911 | 2027-12-31 |
| 旅宿 | 逗點DOUDIAN(逗點旅店) | 教職員工 / 學生 / 校友 | 房價屬浮動價格，並以現場報價為最終標準 | 台中市東區大公街29號 | 04-22210567 | 2026-12-31 |
| 旅宿 | 耐斯王子大飯店 | 教職員工 / 學生 | 特惠代號：NPH2201578 / 單人優惠平日精緻客房$3,200/房 / 雙人優惠平日精緻客房$3,500/房 / 旺日加價$550(間) / 假日加價$1,100(間) | 嘉義市東區忠孝路600號 | 05-2771999 / 翁郁博 05-3109898 #6639 | 2026-12-31 |
| 旅宿 | 將捷金鬱金香酒店 | 教職員工 / 學生 / 校友 | 促銷代碼:87557573 / 入住用餐:需出示員工識別證及身分證明文件 | 新北市淡水區中正路一段2號 | 02-2536-2666 | 2026-12-30 |
| 旅宿 | 捷絲旅 / 晶泉丰旅 | 教職員工 / 學生 / 校友 | 專案代碼：corpsm03 / 臺大館、礁溪館、西門館、礁溪晶泉丰旅 |  | 散客訂房：02-7735-5005 / 團體訂房：02-7735-5008 | 2026-12-20 |
| 旅宿 | 高雄鮪魚家族飯店 | 教職員工 / 學生 / 校友 | 高雄館、鹽埕館、 台東館為特殊報價，需事先訂房。 | 高雄市新興區八德二路10號 | 07-2850555 | 2026-12-30 |
| 旅宿 | 名人堂花園大飯店 | 教職員工 / 學生 | 訂房時請出示相關識別證或校方之邀請函。 | 桃園市龍潭區民生路141巷150號 | 03-433-9191 | 2026-12-30 |
| 旅宿 | 台糖長榮酒店 | 教職員工 / 學生 / 校友 | 契約代碼：SI00039 | 台南市東區中華東路三段336巷1號 | 06-337-3888#2301 | 2026-12-31 |
| 旅宿 | 高雄漢來大飯店 | 教職員工 / 學生 | 商務客戶:平日$8800(贈兩客早餐)至6/30止 / 訂房專線:07-2135766 | (801)高雄市前金區成功一路266號 | 07-213-5788 | 2026-12-31 |
| 旅宿 | 天閣酒店 The Tango | 教職員工 / 學生 | 自 2026 年 7 月 1 日起,天閣集團訂房服務調整通知,相關需求,敬請直接聯繫各入住館別。 | 台北市中山區中山北路一段83巷15號 | 886-2-2523-5959 | 2026-12-31 |
| 旅宿 | 悠活渡假村 / 牡丹灣民宿 | 教職員工 / 學生 / 校友 | 合約編號：M260017 | 屏東縣恆春鎮萬里路27之8號 / 屏東縣牡丹鄉旭海村旭海路85-1號 | 08-8869999 / 08-8830888 | 2026-12-31 |
| 旅宿 | 娜路灣大酒店 | 教職員工 / 學生 / 校友 | 會館四人房每晚$2,999元/間起 / 大酒店雙人房每晚$3,888元/間起 / 購買日:8/1~8/14 入住日:9/1~12/30 | 台東市連航路66號 | 089-239666 | 2026-12-31 |
| 旅宿 | 新北新莊凱悅嘉軒酒店 | 教職員工 / 學生 / 校友 | 合約代碼(CR#1004591)進行預訂 | 新北市新莊區新北大道三段 79 號 | 02-8522 9980 | 2026-12-31 |
| 旅宿 | 水木商旅 | 教職員工 / 學生 / 校友 | 合約代碼: 87557573 | 高雄市左營區重惠街111號 | 07-3501080 | 2026-12-30 |
| 旅宿 | 徠歸仁飯店 | 教職員工 / 學生 / 校友 | 合約代碼: 87557574 / 適用:商務住房、餐飲 | 台南市歸仁區中山路3段455號 | 06-7007999 #6211 | 2026-12-31 |
| 旅宿 | H2O 水京棧國際酒店 | 教職員工 / 學生 / 校友 | 合約編號：C008755 / 電洽 | 高雄市鼓山區明華路366號 | 07-553-7001 | 2026-12-31 |
| 觀光旅遊 | 中華航空 | 教職員工 / 學生 / 校友 | *中華航空企業會員編碼：TW012780，即可同時累積學校及您個人飛行里程數(需同為中華航空會員)。 | 新竹市科學園區工業東二路1號4樓406室 | 03-668-7676 #16 賴柏宇 | 新竹營業所 ：星期一 ~ 星期五 08:30 ~ 12:30 / 13:30 ~ 17:30 |
| 觀光旅遊 | 長榮航空 | 教職員工 / 學生 / 校友 | 五月好康報 -企業會員專屬購票上線 | 300新竹市科學園區工業東2路1號6樓601室 | 客服電話: (02)25011999 | 每年自動續約 |
| 觀光旅遊 | 星宇航空 | 教職員工 / 學生 / 校友 | 透過指定合作旅行社訂位 / 並輸入企業會員編號：JXTW0551 | 台北市中山區南京東路三段168號 | 02-2791-1000 / 02-2791-1199 / 週一至週五 08:30-18:00 | 每年自動續約 |
| 餐飲 | 雲雀集團： / 藍屋日式料理、涮乃葉、義式屋 古拉爵 | 教職員工 / 學生 / 校友 | 雲雀集團優惠適用於"古拉爵" | 新竹縣竹北市莊敬北路18號7樓 | 03-5350723 | 2028-03-31 |
| 餐飲 | 132官舍(時藝多媒體傳播) | 教職員工 | 樂埔璀璨琉光典藏禮盒（預購價 NT$1,488） / 樂埔韶月經典禮盒（預購價 NT$888） / 即日起至8/31前完成訂購，即享限時預購優惠 | 新竹市東區中央路132號 | 03-535-0132 | 每年自動續約 |
| 餐飲 | 格哆莉奶酪優禮 | 教職員工 / 學生 / 校友 | 營業時間：星期二~日 AM.10:00~PM.6:00 (周一公休) | 台中市東區和平街34號 | 04-22203330 | 每年自動續約 |
| 餐飲 | 五鮮級國際餐飲集團 | 教職員工 / 學生 / 校友 | 電洽 | 高雄市大寮區鳳林二路860號 | 07-8419555 | 2027-12-31 |
| 餐飲 | 菜霸子股份有限公司 | 教職員工 / 學生 / 校友 | 推薦碼：NYCUVK | 新北市板橋區三民路二段37號23樓之2 | 0800-000-253 | 每年自動續約 |
| 醫療健康保健 | 心園心理治療所 (台北、桃園、新竹) | 教職員工 | 諮商費2200/次 / 專職人員/4次 / 教職員工/2次 | 桃園市桃園區忠一路15號 | 03-5506375 | 每年自動續約 |
| 醫療健康保健 | 樂活全齡綜合診所 | 教職員工 | 出示識別證及健保IC卡看診，享有免掛號費優待 | 台南市仁德區中正路二段1225號 | 06-2791515 | 每年自動續約 |
| 醫療健康保健 | 英倫牙醫體系 | 教職員工 / 學生 / 校友 | 契約代碼：A293 | 各區診所 | 各區診所 | 每年自動續約 |
| 文化教育托嬰 | 夏哲森幼兒園 (新竹校區) | 教職員工 | 出示員工本人識別證，得享企業會員專屬優惠。 | 新竹市東區光復路一段647號 | 03-5783937 | 2027-06-30 |
| 文化教育托嬰 | 全民大劇團 | 教職員工 / 學生 / 校友 | 《在哪裡跌倒，就在哪裡躺一下》、《你好，我是接體員》單戲85折，雙戲8折 / 竹北演藝廳｜4/10（五）19:30 / 訂購單：https://forms.gle/PZtjXizKVXFk99rd6 | 新北市新店區中正路540-1號5樓 | 02-7730-2028 | 每年自動續約 |
| 婚紗美容護膚 | FUN輕鬆指壓工作坊 | 教職員工 / 校友 / 學生 | 若價錢調整,特約價也會跟著變動(請電洽詢問詳情) | 新竹市光復路2段350號3樓 | 03-6686625 / 0910242046 李先生 | 每年自動續約 |
| 商圈及其他類 | Homebox好博家 | 教職員工 / 學生 / 校友 | 代碼：saf.tw/O5YN4 / 10/21~10/26買3000送300折價券 | 竹北市縣政二路186號全省門市 | 全省門市 / 03-5269966 | 2026-12-31 |
| 商圈及其他類 | 百漾企業社 | 教職員工 / 學生 / 校友 | 隨行扣扣傘、小眠羊冰冰被、手持風扇 | 桃園縣中壢市蘇州一街22號2樓 | 03-4561170 / 0917-618-199 / LINE : Selina.9420 | 每年自動續約 |
| 商圈及其他類 | 綕馥企業社 | 教職員工 / 學生 / 校友 | 活動日期:115年10月05 至 115年11月30日 / 荳荳被,石墨烯保暖被，健康竹炭被，中空抗菌被， / 輕羽絲絨被，枕頭優惠 | 桃園縣楊梅市萬福街77號 | 03-409-5536 / 手機:0936-990-903 / LINE:@zkl6980n | 每年自動續約 |
| 商圈及其他類 | 東森得易購股份有限公司 | 教職員工 / 學生 / 校友 | 企業代碼：87557573 | 新北市中和區景平路258號 | 02-2943-7888 | 每年自動續約 |
| 商圈及其他類 | MITSUI OUTLET PARK 台南 | 教職員工 / 學生 / 校友 | 內部員購活動:2026/11/6(五)-2026/11/15(日) / OUTLET商品全面4折起｜憑紙本邀請函享專屬員購優惠｜ / 手袋類商品 結帳再享7折、服飾類商品 結帳再享6折 | 台南市歸仁區歸仁大道101號 | 0965-303-719(林尚賢) | 每年自動續約 |
| 商圈及其他類 | 品得網絡數位股份有限公司 | 教職員工 / 學生 / 校友 | 預購日：2026/07/16(四)-2026/07/19(日) | 新竹縣竹北市復興三路二段168號 | 03-5678473 | 每年自動續約 |
| 商圈及其他類 | 二四高球股份有限公司 | 教職員工 / 學生 / 校友 | 提領日：2026/07/23(四)-2026/07/26(日) | 臺北市大同區承德路3段179號4樓 | (cell shows 9.61E+08, not a usable number) | 每年自動續約 |
| 商圈及其他類 | 我愛禪股份有限公司 | 教職員工 / 學生 / 校友 | 詳情請至台南三井OUTLET 3F Häagen-Dazs | 臺北市中正區杭州南路1段15之1號5樓 | 02-23916968 / 0939-913544 | 每年自動續約 |
| 商圈及其他類 | 快客股份有限公司 | 教職員工 / 學生 / 校友 | 或專線詢問 06-3033599 | 臺中市太平區太平里永豐路１０８巷３８號 | 0800-010203 | 每年自動續約 |

#### TCU 慈濟 醫學系系學會 特約商店
- **Fetched:** https://medclub.tcu.edu.tw/%E7%89%B9%E7%B4%84%E5%95%86%E5%BA%97/ (200).
- `dateModified` is still **2026-03-19T15:33:42**, and the page still has 41 numbered items (31 + 10). All 41 record names are present.
- **No changes.**

## 3. Dead links

Every distinct `source_url` in `data/sources/*.json` was fetched on 2026-10-22, with curl following redirects. There are **493 URLs**.
- 391 were fetched in a dedicated sweep.
- The other 102 were fetched in the per-source checks above: 74 KSU `ajax` ids, 19 NCU list pages, 7 NYCU CSV gids, the NCCU page and the TCU page.

**Result:** **493 / 493 returned HTTP 200**, with **0 404s** and **0 TLS errors**. Several hosts (alumni.nchu.edu.tw, bir.ksu.edu.tw, asc/person.site hosts) reset the connection or timed out at first and succeeded on retry. For every HTML `source_url` (PDFs and the KSU JSON excluded), the record's name still appears on the page, with two exceptions:

- **9 NCHU records**: the merchant has moved to the next `?page=`. See the table in the NCHU section.
- 4 NTHU records use `p/450-1066-<id>,c0.php` links. They redirect to `p/404-1066-<id>.php` (an RPage URL type, not an HTTP 404), and the page loads with the merchant:
  - 450-1066-7755
  - 450-1066-86529 (楓樺台一渡假村)
  - 450-1066-132008
  - 450-1066-251209

## Summary counts

| | Count |
|---|---|
| Expired records re-checked | 20 (ntu-research 19, other-schools 1) |
| … renewed | **0** |
| … changed | 0 |
| … gone / not renewed (safe to drop) | **20** |
| New entries with terms, no record | **50**: NCHU 1 (a253 彩碗), NYCU 48 (rows whose 項目 is now filled), NTHU net +1 (not identifiable) |
| New entries without usable terms | 1 (NCHU a252 台中大毅老爺行旅, 「請見連結」) |
| Recorded entries that disappeared | **0** |
| Unrecorded entries that disappeared | 2 (NCCU NISSAN, expired; NCHU one unnamed skipped card) |
| Changed end dates on recorded entries | **4**: NCCU 棋建壂 → 2027-10-29; NYCU 喜瑞飯店 → 2026-12-31; NYCU 救國團 → 2027-12-31; NYCU 精英駕訓班 → 2027-12-31 |
| Other text changes on recorded entries | 3: NCU 涮乃葉 adds the 統一時代市府店 branch; NYCU 菁英 renamed to 精英; NCCU Dike 始享 → 可享 (minor) |
| Sources with no change at all | NCKU, CMU, KSU, TCU (NCU only the 涮乃葉 card) |
| `source_url`s checked | 493 |
| … 404 / TLS error | **0 / 0** |
| … page drift (merchant now on another page) | 9 (NCHU) |

Expiring soon (not yet expired): NCCU Dike 生活家電 「即日起～2026-10-31」.
