# NTU college & department (系學會) student deals — search report (2026-10-24, issue #32)

> **Status: searched, 0 deals found.** `ntu-units-deals.json` is an empty list: nothing was found that could be verified from a page fetched with curl. 47 of the 175 units could not be reached from this (non-Taiwan) network, so this is **not** a proof that none exist.

## Method

- Every college and every department / institute / program in `data/schools/ntu-units.json` (17 colleges + 158 units = 175) was searched on 2026-10-24 by five parallel search passes, each covering a group of colleges.
- Per unit: the official site (domains taken from NTU's 學術單位一覽 and the college sites) was fetched with curl, and its menus and links were scanned for 系學會 / 學生會 / 福利 / 特約 / 優惠 / 合作廠商, Google Sites and social links; the 系學會 or 院學生會 site was fetched where one exists; and targeted web searches were used only as leads (e.g. 「臺大<系名>系學會 特約」, 「site:ntu.edu.tw <系名> 特約商店」).
- 學務處's list of student-run associations (osa_activity.ntu.edu.tw/club/list/type/7) was used to find the official 系學會 links for 醫學院 units.
- No logins, no TLS bypass (hosts with certificate errors were not fetched over http), polite retries. Downloads were kept outside the repository.

## Counts by college

| College | Units searched | Deals found | Kept | Expired | Student-eligible | Nothing found | Unreachable |
|---|---|---|---|---|---|---|---|
| 文學院 (`lib`) | 15 | 0 | 0 | 0 | 0 | 14 | 1 |
| 理學院 (`sci`) | 15 | 0 | 0 | 0 | 0 | 12 | 3 |
| 社會科學院 (`soc`) | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| 醫學院 (`med`) | 32 | 0 | 0 | 0 | 0 | 6 | 26 |
| 工學院 (`eng`) | 16 | 0 | 0 | 0 | 0 | 14 | 2 |
| 生物資源暨農學院 (`bioagri`) | 19 | 0 | 0 | 0 | 0 | 17 | 2 |
| 管理學院 (`mgmt`) | 10 | 0 | 0 | 0 | 0 | 0 | 10 |
| 公共衛生學院 (`ph`) | 10 | 0 | 0 | 0 | 0 | 9 | 1 |
| 電機資訊學院 (`eecs`) | 11 | 0 | 0 | 0 | 0 | 10 | 1 |
| 法律學院 (`law`) | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| 生命科學院 (`life`) | 11 | 0 | 0 | 0 | 0 | 10 | 1 |
| 國際政經學院 (`spe`) | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| 國際學院 (`intl`) | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| 創新設計學院 (`dschool`) | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| 重點科技研究學院 (`gsat`) | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| 共同教育中心 (`cge`) | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| 進修推廣學院 (`specs`) | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| **Total** | **175** | **0** | **0** | **0** | **0** | **128** | **47** |

## What was found instead

- **No unit-level shop deals on any reachable page.** The 系學會 pages that could be read (e.g. 歷史, 哲學, 圖資, 臺文所, 社會, 經濟 ntu-econ.github.io, 法律, 機械 ntumesa.com, 農藝 Google Site, 昆蟲, 園藝, 醫學系 ntumedsa.org, 牙醫 ntudentsa.org) describe the association, fees and events, not partner shops.
- **Association-only perks, not shop deals (not imported):** 機械系學會 members get a discount on books ordered through the association; 數學系學會's 113學年 新生手冊 lists 系櫃, NT$50 off each textbook and NT$20 off 系服; 牙醫系學會's benefits page mentions 「合作廠商折扣」 with no shop or terms. 公衛碩士學位學程 had only a 2024 textbook pre-sale.
- **Most 系學會 publish only on Facebook / Instagram** (e.g. 外文, 歷史, 人類, 日文, 社會, 社工, 經濟, 心理, 數學, 醫工, 城鄉, 獸醫, 森林, 農經, 醫學院學生會, 物治, 職治, 學士後護理, 醫學院研究生協會). curl gets only the login wall, so these could not be checked.
- **No school-wide deal reposts** were seen on any unit page, so nothing was deduplicated against `ntu-research.json`.

## Unreachable units (retry from a Taiwan network)

- **管理學院, all 10 units:** management.ntu.edu.tw (which hosts every 管院 department page) returned HTTP 500 with an empty body on every try, including a retry at the end of the run; gmba.ntu.edu.tw also 500; www.management and the eimba hosts fail TLS (name mismatch). Web search shows 資管系 has a 大學部系學會 menu, which is the best lead.
- **醫學院, 26 of 32 units:** www.mc.ntu.edu.tw and most department hosts (nursing.mc, pt.mc, tox.mc, clinmed.mc, brain.mc, pathology.mc, forensic.mc, genome.mc) reset the connection; microbiology.mc timed out; rx.mc.ntu.edu.tw (藥學系, including the 藥學系學生會 page /nturxsa/) answered 429 Too Many Requests every time.
- **Others (11):** 語言所 `1420` (linguistics.ntu.edu.tw: resets/502); 地質系 `2040` (TLS wrong version number); 地理系 `2080` (certificate failure); 天文所 `2440` (proxy 502); 植科所 `B420` (no reachable host); 環工所 `5410` and 高分子所 `5490` (502); 電機系 `9010` (web.ee.ntu.edu.tw incomplete certificate chain; www.ee and ntuee.org reset); 生技所 `6420`, 植醫學程 `6450` and 健康數據拓析所 `8550` (no reachable host).

## Per-unit log

| Unit | Name | College | Result | Main URL fetched (HTTP status) | Note |
|---|---|---|---|---|---|
| `lib` | 文學院 | lib | nothing | https://liberal.ntu.edu.tw/ (200); https://www.ntu.edu.tw/academics/academics_list.html (200) | 院網站無特約/優惠或院學生會福利頁；WebSearch 亦無文學院學生會特約資訊 |
| `1010` | 中國文學系 | lib | nothing | https://www.cl.ntu.edu.tw/ (200); https://www.cl.ntu.edu.tw/home.jsp (200) | 系網站(home.jsp)無系學會/特約連結 |
| `1020` | 外國語文學系 | lib | nothing | https://www.forex.ntu.edu.tw/ (200); https://www.facebook.com/ntudfllsa (200) | 系網站僅連結系學會 Facebook (ntudfllsa)；FB 頁 curl 取回為登入牆，無法讀取內容 |
| `1030` | 歷史學系 | lib | nothing | https://history.ntu.edu.tw (200); https://history.ntu.edu.tw/web/study/study.jsp?lang=tw&dm_id=DM1765356422231 (200) | 系學會介紹頁僅列 FB/IG/Medium 連結，無特約資訊；FB/IG 不可公開讀取 |
| `1040` | 哲學系 | lib | nothing | https://philo.ntu.edu.tw (200); https://philo.ntu.edu.tw/web/student/student.jsp?np_id=NP1687274241633 (200) | 大學部/研究所學生會頁無特約資訊 |
| `1050` | 人類學系 | lib | nothing | https://anthro.ntu.edu.tw/ (200) | 系網站僅連結系學會 FB (ntuanthro)，FB 不可公開讀取 |
| `1060` | 圖書資訊學系 | lib | nothing | https://www.lis.ntu.edu.tw/ (200); https://www.lis.ntu.edu.tw/?page_id=410 (200) | 系學生會頁僅有章程與 FB 連結，無特約 |
| `1070` | 日本語文學系 | lib | nothing | https://japan.ntu.edu.tw/ (200) | 系網站僅連結日文系學會 FB/IG，不可公開讀取 |
| `1090` | 戲劇學系 | lib | nothing | https://theatre.ntu.edu.tw/ (200) | 系網站無系學會特約資訊，僅 FB 連結 |
| `1410` | 藝術史研究所 | lib | nothing | https://arthistory.ntu.edu.tw/ (200) | 所網站無學生會/特約資訊 |
| `1420` | 語言學研究所 | lib | unreachable | https://linguistics.ntu.edu.tw/ (0); https://www.ling.ntu.edu.tw/ (0) | linguistics.ntu.edu.tw 連線被重設(connection reset)，重試 3 次失敗 |
| `1440` | 音樂學研究所 | lib | nothing | https://gim.ntu.edu.tw/ (200) | 所網站無特約資訊，僅 FB/IG |
| `1450` | 臺灣文學研究所 | lib | nothing | https://www.tl.ntu.edu.tw/ (200); https://gitl.ntu.edu.tw/ (200) | 學生會頁無特約資訊 |
| `1460` | 華語教學碩士學位學程 | lib | nothing | https://www.tcsl.ntu.edu.tw/ (200) | 學程網站無特約資訊 |
| `1470` | 翻譯碩士學位學程 | lib | nothing | https://gpti.ntu.edu.tw/ (200) | 學程網站無特約資訊，僅 FB/IG |
| `sci` | 理學院 | sci | nothing | https://www.science.ntu.edu.tw/ (200); https://www.science.ntu.edu.tw/student-affairs/ (200) | 院網站學生事務頁只有獎學金/交換資訊，無特約；WebSearch 找不到理學院學生會特約頁 |
| `2010` | 數學系 | sci | nothing | https://www.math.ntu.edu.tw/ (200); https://www.math.ntu.edu.tw/students (200) | 系學會舊站 403；新生手冊(113學年)只列系學會費內部福利(系櫃、課本折$50、系服折$20)，無校外特約店；FB 粉專 curl 只得登入牆 |
| `2020` | 物理學系 | sci | nothing | https://www.phys.ntu.edu.tw/Default.html (200); https://www.phys.ntu.edu.tw/StudentAffairs.html (200) | 學生事務頁無特約/系學會優惠 |
| `2030` | 化學系 | sci | nothing | https://www.ch.ntu.edu.tw/Default.html (200); https://www.ch.ntu.edu.tw/financial-aids-and-cholarship.html (200) | 系網學生事務無特約；WebSearch 無化學系學會特約 |
| `2040` | 地質科學系 | sci | unreachable | https://www.gl.ntu.edu.tw/ (0) | TLS 錯誤 wrong version number（不降級 http） |
| `2070` | 心理學系 | sci | nothing | https://www.psy.ntu.edu.tw/ (200); https://www.psy.ntu.edu.tw/index.php/activity/student-association (200) | 系學會活動頁只連到 FB 粉專；FB curl 只得登入牆，無法取得內容 |
| `2080` | 地理環境資源學系 | sci | unreachable | https://www.geog.ntu.edu.tw/ (0); https://geog.ntu.edu.tw/ (0) | 憑證驗證失敗/連線被重置（不繞過 TLS） |
| `2090` | 大氣科學系 | sci | nothing | https://www.as.ntu.edu.tw/ (200) | 系網首頁無系學會/特約連結 |
| `2410` | 海洋研究所 | sci | nothing | https://www.oc.ntu.edu.tw/ (200); https://www.oc.ntu.edu.tw/students/ (200) | 學生專區無特約 |
| `2440` | 天文物理研究所 | sci | unreachable | https://www.astro.ntu.edu.tw/ (0); https://astro.ntu.edu.tw/ (0) | proxy CONNECT 502 |
| `2450` | 應用物理研究所 | sci | nothing | https://www.phys.ntu.edu.tw/gipa/ (404) | 猜測網址 404；與物理系共用系網，物理系網站無特約 |
| `2460` | 應用數學科學研究所 | sci | nothing | https://www.math.ntu.edu.tw/~iams/ (200) | 所網無特約 |
| `2500` | 統計與數據科學研究所 | sci | nothing |  () | 未找到獨立網站；WebSearch 無特約線索 |
| `2470` | 氣候變遷與永續發展國際學位學程 | sci | nothing |  () | 未找到網站；WebSearch 無特約線索 |
| `2490` | 地球系統科學國際研究生博士學位學程 | sci | nothing |  () | 國際博士學程，未找到網站；無特約線索 |
| `soc` | 社會科學院 | soc | nothing | https://coss.ntu.edu.tw/departments.html (200); https://coss.ntu.edu.tw/Default.html (200) | 院網站無院學生會特約/優惠頁；WebSearch 亦無社科院學生會特約資訊 |
| `3020` | 政治學系 | soc | nothing | https://politics.ntu.edu.tw/ (200) | 系網站無系學會特約資訊 |
| `3030` | 經濟學系 | soc | nothing | https://econ.ntu.edu.tw/ (200); https://econ.ntu.edu.tw/archives/5236 (200) | 系學會官網 ntu-econ.github.io（首頁/關於/支持/連結頁）無特約店家；IG 不可公開讀取 |
| `3050` | 社會學系 | soc | nothing | https://sociology.ntu.edu.tw/ (200); https://sociology.ntu.edu.tw/links/l01/ (200) | 系/所學生會頁僅列 FB 連結，無特約 |
| `3100` | 社會工作學系 | soc | nothing | https://ntusw.ntu.edu.tw/ (200) | 系網站有系學會演講消息，無特約資訊；FB/IG 不可公開讀取 |
| `3410` | 國家發展研究所 | soc | nothing | https://www.nd.ntu.edu.tw/ (200) | 所網站無特約資訊 |
| `3420` | 新聞研究所 | soc | nothing | https://journalism.ntu.edu.tw/ (200) | 所網站無特約資訊 |
| `3430` | 公共事務研究所 | soc | nothing | https://pa.ntu.edu.tw/Default.html (200) | 所網站無特約資訊 |
| `med` | 醫學院 | med | unreachable | https://osa_activity.ntu.edu.tw/club/list/type/7 (200); https://www.facebook.com/ntucmsa2024 (200) | 醫學院官網 www.mc.ntu.edu.tw 連線被重置(TLS reset，重試3次)；醫學院學生會僅有 Facebook 粉專(學務處社團名單連結)，curl 取得為登入牆，無法讀取貼文；WebSearch 亦無院層級特約資訊 |
| `4010` | 醫學系 | med | nothing | https://ntumedsa.org/ (200); https://sites.google.com/view/51medsa (200) | 醫學系學生會官網 ntumedsa.org 與 MedWiki Google Site 無特約/優惠內容；FB 粉專未抓取(登入牆) |
| `4020` | 牙醫學系 | med | nothing | https://dent.mc.ntu.edu.tw/ (200); https://dent.mc.ntu.edu.tw/Dod/student/association_01 (200) | 牙醫系學會會員權益頁僅泛稱「合作廠商折扣」，未列任何店家或條件；廠商合作頁為廣告招商方案(價格待定)，非學生優惠 |
| `4220` | 臨床牙醫學研究所 | med | nothing | https://gicd.mc.ntu.edu.tw/ (200) | 所網首頁無學會/特約連結 |
| `4500` | 口腔生物科學研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立網站；醫學院網站(www.mc.ntu.edu.tw)連線被重置 |
| `4030` | 藥學系 | med | unreachable | https://rx.mc.ntu.edu.tw/ (429); https://rx.mc.ntu.edu.tw/nturxsa/ (429) | 藥學系及藥學系學生會網站(rx.mc.ntu.edu.tw/nturxsa/，學務處社團名單所列)多次回 429 Too Many Requests；WebSearch 無特約資訊 |
| `4510` | 臨床藥學研究所 | med | unreachable | https://rx.mc.ntu.edu.tw/ (429) | 藥學專業學院網站 rx.mc.ntu.edu.tw 回 429；臨床藥學研究所學生會在學務處名單無網站連結 |
| `4130` | 生技製藥學士學位學程 | med | unreachable | https://rx.mc.ntu.edu.tw/ (429) | 藥學專業學院網站回 429 |
| `4600` | 醫藥法規科學碩士學位學程 | med | unreachable | https://rx.mc.ntu.edu.tw/ (429) | 藥學專業學院網站回 429 |
| `4060` | 護理學系 | med | unreachable | https://www.mc.ntu.edu.tw/nursing/ (0); https://nursing.mc.ntu.edu.tw/ (0) | 護理系網站 TLS 連線失敗/重置；護理學系學生會在學務處名單無網站連結 |
| `4120` | 學士後護理學系 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 學士後護理學系學生會僅 Instagram(ntucmbsn)，curl 無法公開讀取；系網在 mc 網站，連線被重置 |
| `4040` | 醫學檢驗暨生物技術學系 | med | unreachable | https://www.mc.ntu.edu.tw/clsmb/Index.action (0) | 醫技系學生會連結指向系網 www.mc.ntu.edu.tw/clsmb，連線被重置 |
| `4080` | 物理治療學系 | med | unreachable | https://pt.mc.ntu.edu.tw/ (0) | 物治系網連線被重置；物治系學生會僅 Facebook(NTUPTSA)，登入牆 |
| `4090` | 職能治療學系 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 職治系網在 mc 網站，連線被重置；職治系學生會僅 Facebook(NTUOTSA)，登入牆 |
| `4210` | 臨床醫學研究所 | med | unreachable | https://clinmed.mc.ntu.edu.tw/ (0) | 所網連線被重置 |
| `4470` | 毒理學研究所 | med | unreachable | https://tox.mc.ntu.edu.tw/ (0) | 所網連線被重置 |
| `4480` | 分子醫學研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4490` | 免疫學研究所 | med | nothing | https://immunology.mc.ntu.edu.tw/ (200) | 所網首頁無學會/特約連結；免疫所學生會在學務處名單無網站 |
| `4530` | 腫瘤醫學研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4550` | 基因體暨蛋白體醫學研究所 | med | unreachable | https://genome.mc.ntu.edu.tw/ (0) | 查無可連線網站(猜測主機連線被重置) |
| `4540` | 腦與心智科學研究所 | med | unreachable | https://brain.mc.ntu.edu.tw/ (0) | 所網連線被重置 |
| `4580` | 醫療器材與醫學影像研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4460` | 解剖學暨細胞生物學研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4420` | 生物化學暨分子生物學研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4410` | 生理學研究所 | med | nothing | https://physiology.mc.ntu.edu.tw/ (200) | 所網首頁無學會/特約連結 |
| `4450` | 微生物學研究所 | med | unreachable | https://microbiology.mc.ntu.edu.tw/ (0) | 所網連線逾時；微生物所所學會在學務處名單無網站 |
| `4430` | 藥理學研究所 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4570` | 醫學教育暨生醫倫理研究所 | med | nothing | https://mebe.mc.ntu.edu.tw/ (200) | 所網首頁無學會/特約連結 |
| `4440` | 病理學研究所 | med | unreachable | https://pathology.mc.ntu.edu.tw/ (0) | 所網連線被重置 |
| `4520` | 法醫學研究所 | med | unreachable | https://forensic.mc.ntu.edu.tw/ (0) | 所網連線被重置 |
| `4560` | 轉譯醫學博士學位學程 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `4590` | 國際三校農業生技與健康醫療碩士學位學程 | med | unreachable | https://www.mc.ntu.edu.tw/ (0) | 查無獨立可連線網站；醫學院網站 www.mc.ntu.edu.tw 連線被重置；WebSearch 無該單位特約資訊 |
| `eng` | 工學院 | eng | nothing | https://www.eng.ntu.edu.tw/ (200); https://www.eng.ntu.edu.tw/tc/index.aspx (200) | college site/sitemap has no 院學生會/特約 page; no 工學院學生會 site found via search |
| `5010` | 土木工程學系 | eng | nothing | https://www.ce.ntu.edu.tw/ (200) | homepage has no 系學會/特約 links; no 土木系學會 site found via search |
| `5020` | 機械工程學系 | eng | nothing | https://www.me.ntu.edu.tw/home.jsp?lang=tw (200); https://www.me.ntu.edu.tw/web/facilities/studentassociation.jsp (200) | 系學會網站 ntumesa.com 無特約商店；僅提到繳系學會費者系學會訂書有折扣(非商店優惠)；系學會FB需登入 |
| `5040` | 化學工程學系 | eng | nothing | https://che.ntu.edu.tw/che/Default.html (200) | homepage has no 系學會/特約 links; search found nothing |
| `5050` | 工程科學及海洋工程學系 | eng | nothing | https://homepage.ntu.edu.tw/~ntuesoe/tw/Default.html (200); https://homepage.ntu.edu.tw/~ntuesoe/tw/development.html (200) | no 系學會/特約 page; only dept FB link |
| `5070` | 材料科學與工程學系 | eng | nothing | https://mse.ntu.edu.tw/home.jsp?lang=tw (200); https://mse.ntu.edu.tw/web/student/student.jsp (200) | homepage shows「新系學會規劃案-規劃中」; no deals |
| `5080` | 醫學工程學系 | eng | nothing | https://bme.ntu.edu.tw/Default.html (200); https://www.facebook.com/%E5%8F%B0%E5%A4%A7%E9%86%AB%E5%B7%A5%E7%B3%BB%E5%AD%B8%E6%9C%83-248307886080675/ (200) | 系學會 FB/IG linked from dept site but redirect to login (not fetchable); no deals on dept site |
| `5410` | 環境工程學研究所 | eng | unreachable | https://www.ev.ntu.edu.tw/ (0); https://ev.ntu.edu.tw/ (0) | proxy CONNECT 502 for guessed hosts; correct site not found |
| `5430` | 應用力學研究所 | eng | nothing | https://www.iam.ntu.edu.tw/zh/ (200) | 學生事務 menu only; no 所學會/特約 |
| `5440` | 建築與城鄉研究所 | eng | nothing | https://bp.ntu.edu.tw/Default.html (200); https://bp.ntu.edu.tw/cl_n_100309.html (200) | 學生會 pages (組織/公文/法規/經費) have no deals; 學生會FB requires login |
| `5460` | 工業工程學研究所 | eng | nothing | https://ie.ntu.edu.tw/Default.html (200) | no 所學會/特約 links |
| `5490` | 高分子科學與工程學研究所 | eng | unreachable | https://www.ipse.ntu.edu.tw/ (0); https://ipse.ntu.edu.tw/ (0) | proxy CONNECT 502 |
| `5500` | 綠色永續材料與精密元件博士學位學程 | eng | nothing |  () | PhD program; no separate student org site found |
| `5510` | 分子科學與技術國際研究生博士學位學程 | eng | nothing | https://tigp.sinica.edu.tw/ (200) | TIGP site has no deals |
| `5520` | 永續化學科技國際研究生博士學位學程 | eng | nothing | https://tigp.sinica.edu.tw/ (200) | TIGP site has no deals |
| `5090` | 智慧工程科技全英語學士學位學程 | eng | nothing | https://ietp.ntu.edu.tw/ (0) | guessed host unreachable; no program site/student org found via search |
| `bioagri` | 生物資源暨農學院 | bioagri | nothing | https://www.bioagri.ntu.edu.tw/ (200) | College homepage is a JS app with no 學生會/特約 content; WebSearch found no 生農學院學生會 deal page |
| `6090` | 獸醫學系 | bioagri | nothing | https://www.vm.ntu.edu.tw/ (200); https://www.facebook.com/ntuvmsa (200) | Homepage has 獸醫系學會 FB/IG links; both redirect to the login page (not publicly fetchable); no deals on official site |
| `6430` | 臨床動物醫學研究所 | bioagri | nothing | https://www.vm.ntu.edu.tw/ (200) | Institute is under the 獸醫專業學院 site (www.vm.ntu.edu.tw); no deals |
| `6440` | 分子暨比較病理生物學研究所 | bioagri | nothing | https://www.vm.ntu.edu.tw/ (200) | Institute is under the 獸醫專業學院 site (www.vm.ntu.edu.tw); no deals |
| `6010` | 農藝學系 | bioagri | nothing | https://agron.ntu.edu.tw/Default.html (200); https://sites.google.com/view/ntuagronstudentassociation/%E9%A6%96%E9%A0%81 (200) | www host fails TLS (cert name mismatch); the bare host works. 系學會 Google Site (首頁, 高中生專區, 活動紀錄, 營隊) has no 特約 section |
| `6020` | 生物環境系統工程學系 | bioagri | nothing | https://www.bse.ntu.edu.tw/ (200) | No 系學會 or 特約 links on homepage |
| `6030` | 農業化學系 | bioagri | nothing | https://ac.ntu.edu.tw/Default.html (200) | Homepage has a 學生事務 menu but no 系學會 or 特約 content |
| `6050` | 森林環境暨資源學系 | bioagri | nothing | https://www.fo.ntu.edu.tw/ (200) | 系學會專區 links only to FB (NTUFSA) and IG (ntutrees_), which need login; no deals on official site |
| `6060` | 動物科學技術學系 | bioagri | nothing | https://webpageprodvm.ntu.edu.tw/main/Default.aspx (200) | Could not locate the department's Chinese site (several candidate hosts failed with a proxy 502); the shared CMS page fetched has no relevant content; WebSearch |
| `6070` | 農業經濟學系 | bioagri | nothing | https://www.agec.ntu.edu.tw/ (200) | Homepage links only to FB pages (department and 系友會); no 系學會 deals |
| `6080` | 園藝暨景觀學系 | bioagri | nothing | https://www.hort.ntu.edu.tw/web/index/index.jsp?lang=tw (200); https://www.hort.ntu.edu.tw/web/activity/activity.jsp?lang=tw (200) | The 系學會 menu page (activities) has no 特約/優惠 |
| `6100` | 生物產業傳播暨發展學系 | bioagri | nothing | https://bicd.ntu.edu.tw/ (200) | No 系學會 or 特約 content on homepage |
| `6110` | 生物機電工程學系 | bioagri | nothing | https://www.bime.ntu.edu.tw/Default.html (200) | No 系學會 or 特約 content |
| `6120` | 昆蟲學系 | bioagri | nothing | https://entomol.ntu.edu.tw/Default.html (200); https://entomol.ntu.edu.tw/cp_n_208107.html (200) | The 昆蟲系系學會 page lists only officers; no deals |
| `6130` | 植物病理與微生物學系 | bioagri | nothing | https://ppm.ntu.edu.tw/Default.html (200) | Only a news item on awards won by the 植微系學生會; no deals |
| `6410` | 食品科技研究所 | bioagri | nothing | https://www.fst.ntu.edu.tw/ (200) | No 學會 or 特約 content |
| `6420` | 生物科技研究所 | bioagri | unreachable | https://www.ibt.ntu.edu.tw/ (0); https://ibt.ntu.edu.tw/ (0) | Both candidate hosts failed (www: TLS cert mismatch on first try, then CONNECT 502); official URL not confirmed |
| `6450` | 植物醫學碩士學位學程 | bioagri | unreachable | https://www.dpm.ntu.edu.tw/ (0); https://pm.ntu.edu.tw/ (0) | Official site not identified; candidate hosts failed with CONNECT 502 |
| `6150` | 生物科技與食品營養學士學位學程 | bioagri | nothing | https://bfn.ntu.edu.tw/ (200) | Program homepage has no 學會 or 特約 content |
| `mgmt` | 管理學院 | mgmt | unreachable | https://management.ntu.edu.tw/ (500) | management.ntu.edu.tw (hosts all 管院 departments) returned HTTP 500 with an empty body on repeated tries (also one timeout); www.management.ntu.edu.tw fails TLS  |
| `7010` | 工商管理學系 | mgmt | unreachable | https://management.ntu.edu.tw/ (500); https://ba.ntu.edu.tw/ (0) | Department pages live on management.ntu.edu.tw, which returns 500 |
| `7020` | 會計學系 | mgmt | unreachable | https://management.ntu.edu.tw/ (500); https://acc.ntu.edu.tw/ (0) | Department pages live on management.ntu.edu.tw, which returns 500 |
| `7030` | 財務金融學系 | mgmt | unreachable | https://www.fin.ntu.edu.tw/ (200) | fin.ntu.edu.tw only redirects to management.ntu.edu.tw/Fin, which returns 500 |
| `7040` | 國際企業學系 | mgmt | unreachable | https://management.ntu.edu.tw/ (500); https://ib.ntu.edu.tw/ (0) | Department pages live on management.ntu.edu.tw, which returns 500 |
| `7050` | 資訊管理學系 | mgmt | unreachable | https://im.ntu.edu.tw/ (500); https://management.ntu.edu.tw/IM/board/detail/sn/20222 (500) | Redirects to management.ntu.edu.tw/IM, which returns 500 (search shows a 大學部系學會 menu there, but it could not be fetched) |
| `7410` | 商學研究所 | mgmt | unreachable | https://management.ntu.edu.tw/ (500) | Hosted on management.ntu.edu.tw, which returns 500 |
| `7400` | 管理學院碩士在職專班(EMBA) | mgmt | unreachable | https://emba.ntu.edu.tw/ (200) | Redirects to management.ntu.edu.tw/EMBA, which returns 500 |
| `7490` | 管理學院企業管理專班(Global MBA) | mgmt | unreachable | https://gmba.ntu.edu.tw/ (500) | Returns HTTP 500 |
| `7510` | 創業創新管理碩士在職專班(EiMBA) | mgmt | unreachable | https://eimba.ntu.edu.tw/ (0); https://www.eimba.ntu.edu.tw/ (0) | Hosts failed (TLS cert mismatch or connection failure) |
| `ph` | 公共衛生學院 | ph | nothing | https://coph.ntu.edu.tw/home.jsp (200) | Only FB/IG links; no 學生會/特約 content |
| `8010` | 公共衛生學系 | ph | nothing | https://dph.ntu.edu.tw/web/index/index.jsp?lang=tw (200) | No 系學會 or 特約 content; WebSearch found no 公衛系學會 deals |
| `8480` | 健康政策與管理研究所 | ph | nothing | https://ntuhpm.ntu.edu.tw/home.jsp (200) | No 學會 or 特約 content |
| `8520` | 環境與職業健康科學研究所 | ph | nothing | https://eohs.ntu.edu.tw/web/index/index.jsp?lang=tw (200) | No 學會 or 特約 content |
| `8490` | 流行病學與預防醫學研究所 | ph | nothing | https://epm.ntu.edu.tw/web/index/index.jsp?lang=tw (200) | Only an alumni FB link; no deals |
| `8500` | 健康行為與社區科學研究所 | ph | nothing | https://hbcs.ntu.edu.tw/web/index/index.jsp?lang=tw (200) | No 學會 or 特約 content |
| `8510` | 食品安全與健康研究所 | ph | nothing | https://ifsh.ntu.edu.tw/web/index/index.jsp?lang=tw (200) | No 學會 or 特約 content |
| `8550` | 健康數據拓析統計研究所 | ph | unreachable | https://ihdas.ntu.edu.tw/ (0); https://www.ihdas.ntu.edu.tw/ (0) | Official site not identified; candidate hosts failed with CONNECT 502 |
| `8530` | 全球衛生碩士/博士學位學程 | ph | nothing | https://ghp.ntu.edu.tw/ (200) | Only FB/IG links; no deals |
| `8470` | 公共衛生碩士學位學程 | ph | nothing | https://mph.ntu.edu.tw/home.jsp?lang=tw (200) | Only 優惠 is a 2024 textbook pre-sale event (expired, not a shop deal) |
| `eecs` | 電機資訊學院 | eecs | nothing | https://eecs.ntu.edu.tw/ (200); https://eecs.ntu.edu.tw/zh_tw/Studentinformation/stu1 (200) | 學生資訊 pages are scholarships/forms; no 電資院學生會 site found |
| `9010` | 電機工程學系 | eecs | unreachable | https://web.ee.ntu.edu.tw/ (0); https://www.ee.ntu.edu.tw/ (0) | web.ee.ntu.edu.tw fails TLS verification (incomplete chain); www.ee/ntuee.org connection reset; no 電機系學會 page found via search |
| `9020` | 資訊工程學系 | eecs | nothing | https://www.csie.ntu.edu.tw/ (200); https://www.csie.ntu.edu.tw/zh_tw/Education/University (200) | dept site has no 系學會/特約 links; 資工系學會 site not found via search |
| `9410` | 光電工程學研究所 | eecs | nothing | https://gipo.ntu.edu.tw/ (200) | no 所學會/特約 |
| `9420` | 電信工程學研究所 | eecs | nothing | https://gice.ntu.edu.tw/ (200); https://gice.ntu.edu.tw/Student.php (200) | 學生事務 page has no deals |
| `9430` | 電子工程學研究所 | eecs | nothing | https://giee.ntu.edu.tw/tw/home/ (200) | 學生專區 has no deals |
| `9440` | 資訊網路與多媒體研究所 | eecs | nothing | https://www.inm.ntu.edu.tw/ (200) | no 所學會/特約 |
| `9450` | 生醫電子與資訊學研究所 | eecs | nothing | https://www.bebi.ntu.edu.tw/ (200); https://www.bebi.ntu.edu.tw/?page_id=305 (200) | 所學會 page lists 章程/任期/email only; no deals |
| `9460` | 資料科學學位學程 | eecs | nothing | https://ds.ntu.edu.tw/tw/home/ (200) | no deals |
| `9470` | 生物資訊學國際研究生博士學位學程 | eecs | nothing | https://tigp.sinica.edu.tw/ (200) | TIGP site has no deals |
| `9490` | 智慧聯網國際研究生博士學位學程 | eecs | nothing | https://tigp.sinica.edu.tw/ (200) | TIGP site has no deals |
| `law` | 法律學院 | law | nothing | https://www.law.ntu.edu.tw/ (200) | 院網站無學生會特約資訊；WebSearch 無結果 |
| `A010` | 法律學系 | law | nothing | https://www.law.ntu.edu.tw/index.php/news/item/2703-2022-11-28-04-12-03 (200); https://www.law.ntu.edu.tw/ (200) | 法律系學會介紹頁（院網站）無特約資訊 |
| `A410` | 科際整合法律學研究所 | law | nothing | https://www.law.ntu.edu.tw/center/index.php/giilslaw (200) | 所網站僅連結所學會 FB，無特約資訊 |
| `life` | 生命科學院 | life | nothing | https://cols.ntu.edu.tw/ (200); https://cols.ntu.edu.tw/Default.html (200) | 院網站(cols.ntu.edu.tw)無特約/學生會優惠 |
| `B010` | 生命科學系 | life | nothing | https://homepage.ntu.edu.tw/~deptlifesci/ (200) | 系網選單無系學會/特約 |
| `B020` | 生化科技學系 | life | nothing | https://bst.ntu.edu.tw/Default.html (200) | 系網無特約（只有助學金） |
| `B420` | 植物科學研究所 | life | unreachable | https://www.ipb.ntu.edu.tw/ (0) | 猜測網址 CONNECT 502；院網未列連結 |
| `B430` | 分子與細胞生物學研究所 | life | nothing | https://ntuclsimcb.ntu.edu.tw/Default.html (200) | 所網無特約 |
| `B440` | 生態學與演化生物學研究所 | life | nothing | https://ecology.lifescience.ntu.edu.tw/ (200) | 所網無特約 |
| `B450` | 漁業科學研究所 | life | nothing | https://fisheryscience.ntu.edu.tw/Default.html (200) | 所網無特約 |
| `B460` | 生化科學研究所 | life | nothing | https://ibs.ntu.edu.tw/ (200) | 所網無特約 |
| `B480` | 基因體與系統生物學學位學程 | life | nothing | https://ntugsb.ntu.edu.tw/Default.html (200) | 學程網無特約 |
| `B490` | 跨領域神經科學國際研究生博士學位學程 | life | nothing |  () | 國際博士學程，未找到網站；無特約線索 |
| `B500` | 植物生物科技產學研發博士學位學程 | life | nothing |  () | 未找到網站；無特約線索 |
| `spe` | 國際政經學院 | spe | nothing | https://spe.ntu.edu.tw/ (200) | 院網站無特約資訊（各學程頁均在 spe.ntu.edu.tw 下） |
| `C410` | 政治經濟碩士學位學程 | spe | nothing | https://spe.ntu.edu.tw/ (200) | 學程頁屬 spe.ntu.edu.tw，院網站無特約資訊 |
| `C420` | 財金碩士學位學程 | spe | nothing | https://spe.ntu.edu.tw/ (200) | 學程頁屬 spe.ntu.edu.tw，院網站無特約資訊 |
| `C430` | 領導與管理碩士學位學程 | spe | nothing | https://spe.ntu.edu.tw/ (200) | 學程頁屬 spe.ntu.edu.tw，院網站無特約資訊 |
| `intl` | 國際學院 | intl | nothing | https://intl.ntu.edu.tw/ (200) | 院網站無特約資訊，僅 FB/IG |
| `H430` | 全球農業科技與基因體科學碩士學位學程 | intl | nothing | https://atgs.ntu.edu.tw (200) | 學程網站無特約資訊 |
| `H440` | 生物多樣性國際碩士學位學程 | intl | nothing | https://mpb.ntu.edu.tw (200) | 學程網站無特約資訊 |
| `H450` | 智慧醫療與健康資訊碩士學位學程 | intl | nothing | https://smartmhi.ntu.edu.tw (200) | 學程網站無特約資訊 |
| `H460` | 防災減害與韌性碩士學位學程 | intl | nothing | https://mdr3.ntu.edu.tw/ (200) | 學程網站無特約資訊 |
| `H060` | 國際半導體學士學位學程 | intl | nothing | https://gups.ntu.edu.tw/ (200) | 學程網站無特約資訊 |
| `dschool` | 創新設計學院 | dschool | nothing | https://dschool.ntu.edu.tw/ (200); https://dschool.ntu.edu.tw/students (200) | 網站無特約 |
| `Z010` | 創新領域學士學位學程 | dschool | nothing |  () | 與 D-School 共用網站，無特約 |
| `gsat` | 重點科技研究學院 | gsat | nothing | https://gsat.ntu.edu.tw/tw/home/ (200) | no 學生會/特約 page |
| `K410` | 積體電路設計與自動化學位學程 | gsat | nothing | https://gsat.ntu.edu.tw/tw/home/ (200) | program under GSAT; no separate site/deals |
| `K430` | 元件材料與異質整合學位學程 | gsat | nothing | https://gsat.ntu.edu.tw/tw/home/ (200) | program under GSAT; no separate site/deals |
| `K450` | 奈米工程與科學學位學程 | gsat | nothing | https://gsat.ntu.edu.tw/tw/home/ (200) | program under GSAT; no separate site/deals |
| `K470` | 精準健康學位學程 | gsat | nothing | https://gsat.ntu.edu.tw/tw/home/ (200) | program under GSAT; no separate site/deals |
| `cge` | 共同教育中心 | cge | nothing | https://cge.ntu.edu.tw/Default.html (200) | 中心網站無特約 |
| `H410` | 統計碩士學位學程 | cge | nothing | https://www.stat.ntu.edu.tw/Default.html (200); https://www.stat.ntu.edu.tw/cl_n_194054.html (200) | stat.ntu.edu.tw 為統計碩士學位學程網站；學生事務無特約 |
| `H420` | 運動設施與健康管理碩士學位學程 | cge | nothing | https://cge.ntu.edu.tw/cp_n_56978.html (200) | 學程網站 master.pe.ntu.edu.tw 憑證驗證失敗；共教中心介紹頁無特約 |
| `H040` | 國際體育運動事務學士學位學程 | cge | nothing | https://cge.ntu.edu.tw/cp_n_75807.html (200) | 介紹頁無特約 |
| `specs` | 進修推廣學院 | specs | nothing | https://www.ntuspecs.ntu.edu.tw/ (200); https://www.ntuspecs.ntu.edu.tw/student.aspx (200) | 學員社團頁列「進修推廣學院學生會」，但該頁顯示「參數錯誤!!」無內容 |
| `E410` | 事業經營碩士在職學位學程(PMBA) | specs | nothing |  () | WebSearch 無 PMBA 學生會特約線索；隸屬進修推廣學院（見 specs） |
| `E420` | 事業經營法務碩士在職學位學程(PMLBA) | specs | nothing |  () | 同 E410 |
| `E430` | 生物科技管理碩士在職學位學程(PMBM) | specs | nothing |  () | 同 E410 |

## Validation

- `ntu-units-deals.json` is `[]` (valid JSON, no records, so no `units` codes to check). `python3 scripts/import_deals.py` in a throwaway copy runs with 0 skips.
