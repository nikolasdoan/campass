# CMU 中國醫藥大學 partner-discount source (verified 2026-10-15)

> **Status: extracted.** Every page below was fetched with curl on 2026-10-15, and every record in
> `cmu.json` comes from a store post fetched that day. This replaces the CMU row of the survey table
> in `other-schools.md`, which said 「the index links 24 `/store/<name>/` posts」. That count was
> page 1 only. The index has **9 pages** and **209** store posts.

## Extraction summary (`cmu.json`, 197 records)

| School | Source (level) | URLs fetched | Format | Listed | Kept | Expired (skipped) | Other skips | Last updated (visible) |
|---|---|---|---|---|---|---|---|---|
| CMU 中國醫 | 中國醫藥大學學生會 特約商店 (student_org) | Index https://www.twcmusa.org/discount/ and `/discount/page/2/` … `/page/9/`. WP REST `https://www.twcmusa.org/wp-json/wp/v2/avada_portfolio?per_page=100&page=1..3` (X-WP-Total 209). All 209 store posts `https://www.twcmusa.org/store/<slug>/` (all 200) | WordPress (Avada) portfolio posts. Each post has a heading, a 「特約內容」 text block, then 「聯絡(方式)資訊」 (phone) and 「商家地址」 (address), plus a map iframe. Terms are HTML text in every post; the one image per post is a decorative banner with empty alt. | 209 posts | **197** (196 posts; 1 post split into 2) | 0 | 13 older duplicate posts for the same shop | Index page dateModified **2026-01-06**. Newest store post **2026-06-02**. No 學年度 or 有效期限 on any post. |

Records by category: food 151, services 16, entertainment 8, health 7, shopping 5, transport 5, education 4, lodging 1.

Records by region:

| Region | Single-region records | Including multi-region records |
|---|---|---|
| central | 190 | 194 |
| east | 2 | 6 |
| north | 0 | 4 |
| south | 0 | 4 |

4 records cover all four regions (傑昇通信 全台門市, Sistyle Studio 網路商店, 森川丼丼 全台分店,
老四川巴蜀麻辣燙 全省直營店). 1 record is on an outlying island (澎湖) and has `regions: []`.
All 197 records are student-eligible. 17 also name staff (教職員/教師證/職員/師生/員工), 2 name alumni
(SCOTT.C 運動按摩, 樂活眼鏡), and 1 names family (佳銳牙醫 掛號費 「含一等親」).

Posts kept, by post date: 2020: 53, 2021: 47, 2022: 44, 2024: 8, 2026: 45 (posted 2026-01-06 to 2026-06-02).
More than half the list (144 records) comes from posts dated 2020–2022 that were never updated.

### Skips

- **Expired:** 0. No post states an end date, 學年度 or 有效期限, so nothing could be dated as expired.
- **Image-only terms:** 0. Every post has its terms as HTML text.
- **Duplicates (13):** an older post for the same shop (same address and/or phone) was dropped and the newer post kept:
  - 玖饌集 (2024) → 玖饌集 長安店 (2026)
  - 三明主義 (2021) → 三明主義 (2024)
  - 海底撈 中友店 (2020) → 海底撈中友店 (2024)
  - 珍一波-台中漢口店 (2021) → 珍一波（漢口店） (2022)
  - 甜藤家鬆餅專賣店 (2021-02) → 甜藤家鬆餅店 (2021-12)
  - 水湳清豐冰菓室 (2021-02) → 清豐冰菓室 (2021-12)
  - 大埔鐵板燒中清店 (2020) → 大埔鐵板燒 中清店 (2021)
  - 滿福鍋燒麵 (2020) → 滿福鍋燒店 (2022)
  - 科嵐專業影印企業社 (2021) → 科嵐專業影印企業社 (2022)
  - 俏 義式冰淇淋 Ciao Gelato (2022) → 俏義式冰淇淋 (2024)
  - 85度C 水湳店 (2021-02) → 85度C家樂福水湳店 (2021-10)
  - 晨出早餐餐車 (2020) → 晨出早午餐 (2021). Same address (中平路258號); the phone numbers differ by two digits. Treated as the same business renamed.
  - 水湳王爺魚翅肉羹 (2020) → 王爺王肉羹 (2022). Same address and phone.

### Field mapping and judgement calls

- **Name** is the WordPress post title. For a few posts the on-page heading adds detail, which is quoted in `notes`: 灰熊機車行 「（即 灰熊Motor機車出租-花蓮店）」, 黑熊機車行 「（即 阿里巴巴機車出租-花蓮店）」, and 森川丼丼 「（全台分店）」.
- **Split post:** the 義崎丼 post covers two shops, each with its own offer, phone and address. It became two records: 義崎丼PLUS和牛燒肉X鍋物 (健行店) and 義崎丼勇者丼飯X鍋物 (美德鋪).
- **Subtitle** is the city and district taken from the address (臺中 is normalised to 台中市, and a postal-code prefix is dropped). Exceptions: 傑昇通信 「全台門市」, Sistyle Studio 「網路商店（蝦皮）」, and 82mm cafe 「台中市」 (its address has no district).
- **Regions** come from the address. Online and nationwide offers get all four regions. Two Hualien scooter-rental shops (灰熊/黑熊機車行) are `east`. The 澎湖 民宿 has `regions: []` with a note, as in `other-schools.md`.
- **Phone** is the visible text under 聯絡資訊. 「無」, 「需至臉書聯絡」 and 「依照各門市官網資訊」 map to "". In 5 posts the `tel:` link differs from the visible text: 漂蔦, 85度C家樂福水湳店, 出雲鍋物, 一中豐仁冰, and the second 義崎丼 number. The visible text was used. 科嵐 lists two numbers plus 「歡迎用LINE通訊」 (moved to `notes`).
- **Offer** is the 特約內容 block, one line per item. Bullets, emoji and divider lines were removed, and 「🈵」 became 「滿」. The wording is otherwise unchanged.
- **Eligibility:** `student` is always true, because the source is the student-union list and its index says 「請主動出示學生證，或配合店家確認在校生身份」. `staff`, `alumni` and `family` are true only when the post text names those groups. The posts never mention 學生會費 (student-union dues). Two Hualien posts ask for a 「學生會專屬特約卡（如無，則出示學生證）」, and this is noted.
- **Expiry:** every record has `expires_on: null` and `auto_renew: false`, and `notes` gives the post date (plus the modified date when it differs). The 民宿 post also has an 「8-10 月限定」 package. No year is given, the post date is 2026-05-14, and 2026-10-15 falls inside the window, so the package stays in `offer` and is flagged in `notes`.
- **Highlight** is the best 折 rate, with 「起」 when several rates apply. Otherwise it is 折$N, 買X送Y, 免服務費, 專屬優惠價 (a fixed price) or 消費贈品 (a free item). Rates that apply only to a second person or second cup are excluded from the best-rate calculation. Hand-set badges:
  - 優握握 「第二杯85折」
  - three clinics 「掛號費優惠」 (as in `other-schools.md`)
  - 鬪次元 「免費體驗」
  - 寯灃冷氣 「免車馬費」
  - scaling 「滿N折M」 offers use the smallest step plus 「起」 (for example 大合屋 「折$10起」)
- **Category:** food is the default. The others were assigned by hand from the shop type: hair, nail, lash, photo, print, laundry, shoe-care, phone/iPhone repair and A/C → services; clinics, massage, optical and yoga → health; 巨匠美語, 探戈學院 and 裏。語研所 → education; board games, escape room, HADO, darts bar, swimming/dive shop and GO票網 → entertainment; scooter rental/repair, car rental and 輪便所 → transport.
- **Links:** posts contain only `tel:` links. The one store URL in post text (傑昇通信 門市列表 https://www.jyes.com.tw/store.php) is kept as a link.

## Caveats

- **Staleness.** Only 45 of 197 records come from 2026 posts. 144 come from posts dated 2020–2022 with no later edit. The index still lists them, so they were kept, but many may no longer be honoured. The index itself warns 「店家保有更改等值優惠項目的權利」 and 「優惠訊息如有更動，請以店家公告及學生會粉絲專頁為優先」, and it points to an Instagram page 「(即時更新)」 that was not fetched.
- **Address oddities, kept as published.** 清豐冰菓室 and 早安有喜 太原店 share 長安路二段312號. 寯灃冷氣空調 shares 甜藤家's address. 炭烤嘉BBQ and 王爺王肉羹 share 中平路570號. 有森燒肉 and 有森烤肉飯 share 育德路26號 and a phone number, but they have different offers, so both were kept.
- The two Hualien scooter shops (灰熊/黑熊機車行) look out of place on a Taichung list and refer to a 「學生會專屬特約卡」. They were kept as published.
- 傑昇通信's terms say 「凡甲方出示合約提供之相關識別憑證」 rather than 學生證.
- The 特約商家地圖 link on the index was not followed. Store data came only from the posts.

## Sources worth monitoring

- WP REST `wp/v2/avada_portfolio` is the cheapest refresh: 3 requests give every post's `date` and `modified`, and `X-WP-Total` reveals new posts. New posts get the highest IDs (currently 9075).
