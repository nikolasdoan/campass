# NTU discount sources — research report (2026-10-15)

## Status: blocked, 0 records extracted

No page could be fetched in this session, so `ntu-research.json` is an empty array (`[]`). The output rules say every record needs a `source_url` that was fetched and checked.

- **WebFetch** failed with `getaddrinfo ENOTFOUND` on every host tried, including control hosts: homepage.ntu.edu.tw, sites.google.com, life.ntu.edu.tw, www.ntu.edu.tw and example.com. The tool itself has no DNS or network access.
- **curl** goes through the environment's egress proxy. The proxy returned `CONNECT tunnel failed, response 403` for homepage.ntu.edu.tw, sites.google.com and www.google.com. Only allowlisted package hosts (for example pypi.org) work.
- **WebSearch** works, but it only returns search-index snippets and model summaries, not the pages. Nothing from it was turned into a record.

**Fix:** under the cloud environment's Network access settings, allow `homepage.ntu.edu.tw`, `sites.google.com`, `life.ntu.edu.tw` and `www.alumni.ntu.edu.tw` (or use a broader access level). Then run this task again.

## Sources checked

| # | Source | Publisher | URL | Result |
|---|---|---|---|---|
| 1 | Finance Office benefits page (優惠專區) | 臺大財務管理處 | https://homepage.ntu.edu.tw/~ntufinance/benefit.html | Not fetched (blocked). No records. Can't confirm new merchants or changed terms against deals.json. |
| 2 | 臺大系統學生會 特約平台 (三校: NTU/NTNU/NTUST, since 109學年) | 臺大系統學生會 (臺大/臺師大/臺科大學生會) | https://sites.google.com/gapps.ntnu.edu.tw/system | Not fetched (blocked). No records. Google Sites HTML, organised by school, then category, then area. |
| 3 | NTU Student Association / college & department associations | various | none found | Searches did not find any published lists from 法律系, 管院, 電機系 or 醫學系 associations. The 機械系學會 site (https://ntumesa.com/) appeared in results, but no partner list showed up in the snippets. |

## Changes vs deals.json

None can be confirmed, because the Finance Office page was not readable. Two expiry dates in deals.json have already passed and should be checked by hand:

- **SOS Repair維修中心:** `expires_on` 2026-08-31
- **康橋商旅:** no expiry date

## Leads from search snippets (not checked, not in JSON)

These came from WebSearch snippets of the 系統學生會 「公館、溫州街」 sub-page: https://sites.google.com/gapps.ntnu.edu.tw/system/%E8%87%BA%E5%A4%A7/%E9%A3%B2%E9%A3%9F/%E5%85%AC%E9%A4%A8%E6%BA%AB%E5%B7%9E%E8%A1%97

Check each one on the page before importing it.

- **潮味決 台北公館分社** (already in deals.json from the Finance Office, with different terms): 消費滿130元，出示三校學生證，即可兌換當季時蔬或王子麵乙份，不得與其他優惠合併使用
- **池先生 Kopitiam 公館店:** 主餐加飲料可折抵30元
- **戰醬燒肉:** 消費95折優惠
- **GURU HOUSE 台大公館店:** 1.內用消費享免服務費 2.外帶消費享9折優惠
- **Lazy Pâtisserie 徠集手工法式甜點坊 公館店:** 六吋生日蛋糕享優惠價280（限同一口味）

Other search summaries also mentioned a craft beer bar, an art-supply store, a baseball/softball equipment store, eyewear at 9折, and Agoda booking codes on the 生活、娛樂 sub-page. They may be from earlier years.

## Sources found but not extractable this session

The first five are all blocked in this session.

- **系統學生會 公館、溫州街 (飲食):** see the URL above
- **系統學生會 生活、娛樂:** https://sites.google.com/gapps.ntnu.edu.tw/system/%E8%87%BA%E5%A4%A7/%E7%94%9F%E6%B4%BB-%E5%A8%9B%E6%A8%82
- **臺大生活便利通 校外特約:** https://life.ntu.edu.tw/zh_tw/Shopping/Contracted_Vendors_Shopping. The data is supplied by the Finance Office, so it is a likely mirror of source 1.
- **臺大校友中心 商家優惠:** https://www.alumni.ntu.edu.tw/Store/StoreList. Mostly for alumni.
- **臺大校友中心 校內商家優惠總覽:** https://www.alumni.ntu.edu.tw/News/NewsDetail/NN00000251
- **Dcard thread 臺大特約廠商折扣:** https://www.dcard.tw/f/ntu/p/259831668. Posted by students; not an official source, so don't import it.

## Sources to monitor (in priority order)

1. **Finance Office benefit.html:** the official school-level source. Expiry dates cluster around year-end, so re-check every December and January.
2. **系統學生會 特約平台:** check every semester; it covers all three schools and has the largest student-focused list. Crawl each 臺大 / 臺師大 / 臺科大 category sub-page.
3. **life.ntu.edu.tw 校外特約:** cross-check against the Finance Office list.
4. **Department association pages:** check Facebook and Instagram, where most 系學會 post 特約. No web-published lists were found. Instagram and Facebook posts are often images, so they need OCR or manual entry.
