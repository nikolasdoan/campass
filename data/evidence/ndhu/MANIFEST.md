# Evidence: NDHU 東華 contract scans (2026-10-24)

> The images themselves are kept in private storage, not in this public repository (founder decision, 2026-10-24). This file lists what was read, with each source URL and its sha256.

These are the page images I read when the source was a scanned PDF (no text layer) or an image, kept for audit. Each image is exactly what was viewed: PDFs were rendered with `pdftoppm` at the stated resolution, and images are stored as downloaded.
The sha256 values identify the source file as fetched, so a re-download can be checked against it.

| Image | Source URL | Source sha256 | Page | Used for | Note |
|---|---|---|---|---|---|
| `405583596-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/405583596.pdf | `e50130e0f024543a…` | 1 (60 dpi) | 饗泰多/饗賓集團 rows (skipped: ended 2025/12/31) |  |
| `513170094-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/513170094.pdf | `a10e5f185fe2098b…` | 1 (60 dpi) | 三寶爸工作室 (skipped: handwriting illegible) |  |
| `275809026-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/275809026.pdf | `aa1a3e4fef8b0ce0…` | 1 (60 dpi) | 醉酒香陳窖 |  |
| `131308322-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/131308322.pdf | `e98e95cd95bd7416…` | 1 (60 dpi) | 二毛旅行社 |  |
| `331704113-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/331704113.pdf | `c925a09b946516e5…` | 1 (60 dpi) | 大地假期旅行社 |  |
| `539154958-1.png` | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/539154958.pdf | `6033080dd15f4735…` | 1 (60 dpi) | 雄獅旅行社花蓮分公司 |  |
| `126618188-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/126618188.pdf | `f236c5bc33b0ce33…` | 1 (60 dpi) | 凱尼斯旅行社 (skipped: illegible) |  |
| `564979241-1.png` | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/564979241.pdf | `2432ec36d68c3e53…` | 1 (60 dpi) | 愛菲斯居家美學 |  |
| `438290957-1.png` | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/438290957.pdf | `ae2396784c378525…` | 1 (60 dpi) | 威比寢飾 |  |
| `184202798-1.png` | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/184202798.pdf | `a4501345e1490260…` | 1 (60 dpi) | 合興傢俱行 |  |
| `780597763-1.png` | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/780597763.pdf | `49fb7e79a281bb55…` | 1 (60 dpi) | 華聯遊覽車 (skipped: institutional) |  |

## Transcription of the 17 held hotel contracts (2026-10-24, issue #29)

Each PDF was re-fetched with curl, rendered with `pdftoppm -r 100` (two pages re-rendered at 200 dpi where digits were unclear), and read visually.

| Record | Source URL | Source sha256 | Pages read | Outcome |
|---|---|---|---|---|
| 花蓮富野渡假酒店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/913669891.pdf | `cfbcaa51ce838f43d494158094a49d43ff3e813edf4b9d8e249ce47539a3156c` | 1-2 (100 dpi) | transcribed |
| 知樂智慧酒店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/913669891.pdf | `cfbcaa51ce838f43d494158094a49d43ff3e813edf4b9d8e249ce47539a3156c` | 1-2 (100 dpi) | transcribed |
| 知樂智慧酒店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/257262949.pdf | `9bd9aec101a03b64f34efd11de93e6555725afcbf4b66adc47889007d63874e0` | 1 (100 dpi) | transcribed |
| 家美瑞品飯店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/150725804.pdf | `8a4f6921654788de30bf45bb531ffbbd4710ea59679cb77cd73c09efca5bb05e` | 1 (100 dpi) | transcribed |
| 非凡飯店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/804905303.pdf | `7887bfaa0792d3d514865c004cb0d17253835aafa9d94118559ae51d3bf72f2b` | 1 (200 dpi) | transcribed |
| 洄瀾窩青年旅舍 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/123749320.pdf | `24c69ebfe09432904c12c11e3415f89d8ee41771a9b0233d2ba2679ff022e439` | 1 (200 dpi) | transcribed |
| 喜樂旅店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/652488584.pdf | `7b74329fb590233c2305fe5d8ef80e3eed857accd904baf8bac6092b2bc2ba9e` | 1 (100 dpi) | dropped (contract ended 2025-12-31, no auto-renew) |
| 福容大飯店(花蓮) | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/468521178.pdf | `84dcfcd652707af9245f9a6ee8df74b67dc65b0f65fe6867f330886fdae49389` | 1-2 (100 dpi) | transcribed |
| 花蓮理想大地渡假飯店 | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/530065714.pdf | `3a45cfc4084f9b49459188639bbc164b7bca9aa73ac2738fe0beb87adcd5b604` | 1-2 (100 dpi) | transcribed |
| 花蓮藍天麗池飯店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/120942869.pdf | `9be41c1cb37aa0f88ef672adf7d2128950c44babb42bc2396af1113d5a40ec80` | 1 (100 dpi) | transcribed |
| 旅居文旅 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/125052523.pdf | `a83af0d6f094a60975da8fb0af6a54424930ff62afa092e72711bd9cf70d185a` | 1-3 (100 dpi) | transcribed |
| 兄弟大飯店 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/155723458.pdf | `b07817f030fe5d27e5d0bb624827144b7ab91c6db3e41d1d9bdfbe38a32fea57` | 1 (100 dpi) | transcribed |
| 月見溪行館 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/978285367.pdf | `4fdd1e63c82e7d375f789810be92582e97fe0c603c8ddd5012520faa3c6f0790` | 1-2 (100 dpi) | transcribed |
| 安居台北 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/341837421.pdf | `022194f2d3aa9b92caae61d9afda37f9f1b5dcfeb6a239a90349f87b8e9141b3` | 1-2 (100 dpi) | transcribed |
| 浯島文旅 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/343505721.pdf | `c8386ffba7c49c6ca158d3a3df30322148256364e84dfc738a7a3b02aaef7224` | 1-3 (100 dpi) | transcribed |
| 海岸小旅民宿 | https://ga.ndhu.edu.tw/var/file/6/1006/img/2120/212725858.pdf | `e365128933cb2a3734cb0d159c0c20b7fd29911a78a391bca7490d1a0c2ac264` | 1-2 (100 (p1 also 200) dpi) | transcribed |
| 依山午民宿 | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/266981957.pdf | `a24b811deea95d552b720e7aa4686bcbef805b368b7c054283d8231243e3ef08` | 1 (100 dpi) | transcribed |
| 山琳文旅民宿 | https://rb006.ndhu.edu.tw/var/file/6/1006/img/2120/618227928.pdf | `6c0f49da0505c3467802dfd0573eb9ce521c6fd069142e29aa7016622c6fe491` | 1 (200 dpi) | transcribed |
