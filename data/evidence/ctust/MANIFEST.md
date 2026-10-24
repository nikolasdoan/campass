# Evidence: CTUST 中臺 attachment scans (2026-10-24)

> The images themselves are kept in private storage, not in this public repository (founder decision, 2026-10-24). This file lists what was read, with each source URL and its sha256.

These are the page images I read because the attachment has no text layer. PDFs were rendered with `pdftoppm` at the stated resolution. The sha256 identifies the source file as fetched.

| Image | Source URL | Source sha256 | Page | Used for |
|---|---|---|---|---|
| `water-1.png` | https://personnel.ctust.edu.tw/var/file/26/1026/img/1952/store_2020_water.pdf | `6aa707b8a646793d9c9513d2fae4813d86770d9da54b20982302031dc7689b38` | 1 (80 dpi) | 水舞系列精品旅館: kept. The agreement says 「特約商永久有效，惟商務價格有變動時會發mail通知」; room prices not transcribed |
| `hub-1.png` | https://personnel.ctust.edu.tw/var/file/26/1026/img/1952/store_202012_hubhotel.pdf | `b5b8cff5675435f88ce9ebe4155a29331506416aeedee09e0fd068a62b4e1699` | 1 (70 dpi) | 旅居文旅: kept. A 2020-12 price sheet (台北松山機場館 平日 NT 1,500 起) with no end date; prices not transcribed |
| `pharm-1.png` | https://personnel.ctust.edu.tw/var/file/26/1026/img/1952/store-2023_pharmacy.pdf | `78150343c97e8ab62effa7c0731df61d192244c5a05cfca3550972e94f0471a8` | 1 (80 dpi) | 金成記大藥局: kept. 附件一/二 are only the lists of excluded advertised products and the 特定保健品牌; the table states the offer |

Text-layer attachments that were read with `pdftotext`, so no image was kept:
- **store_202001brotherhotel.pdf** (`296ee90c7e31dbf295b7932650dcff48c9c2d125f0830366a30c89e40ed3bd8e`). 兄弟大飯店 was skipped: 特約優惠適用期限 2020-01-01 to 2020-12-31.
- **store_2020_fresh.pdf** (`b021526da2245f2fa31b36c100e9404f3e9aba13178fc03d77477ca0a28988c1`). The 台中清新溫泉會館 room contract ended 2020-12-31, so its room rates are not kept.
- **427374200.pdf** (`c409e66464e51a164269cafe247fa15523634c557a2348dcc0eebab267fa458b`). Uber Eats was skipped: every code must be entered by 2025-12-31.
- **store_202012_owlhotel.pdf** (`63c2f5721c9bfde5997b049d1308950c6458136b760a6ef3ea84d98cce3fc433`). This is a 2020 proposal. The 貓頭鷹旅店 offer (平日9折/假日95折) is from the table.
- **705917819.pdf** (`4794d18bc0cb8ac115b107811d21927814431aaf60074ae1807a60839c5489cf`). These are the foodpanda 企業帳號 upgrade steps.

## Re-read for transcription (2026-10-24, issue #29)

| Record | Source URL | Source sha256 | Pages read | Outcome |
|---|---|---|---|---|
| 水舞系列精品旅館 | https://personnel.ctust.edu.tw/var/file/26/1026/img/1952/store_2020_water.pdf | `6aa707b8a646793d9c9513d2fae4813d86770d9da54b20982302031dc7689b38` | 1-2 (100 dpi) | still held |
