# CampusPass 隱私權政策 / Privacy Policy

> **草稿 DRAFT — 尚未經律師審閱 / not yet reviewed by a lawyer.**
> 本文件依程式碼實際蒐集與處理的資料撰寫（`src/index.ts`、`migrations/*.sql`、`public/`，2026-10-15）。
> 標示 **【待律師確認】/ [LAWYER]** 的段落需由熟悉《個人資料保護法》的律師確認後才能發布。
> 標示 **【提案】/ [PROPOSAL]** 的保存期間是建議值，程式尚未全部實作（見文末「實作備註」）。
> `[營運者名稱]`、`[聯絡信箱]` 等方括號內容為待填欄位。

---

## 繁體中文

最後更新：[發布日期]

CampusPass（「本服務」）是一個整理各校與學生組織已公開之特約優惠的獨立索引網站，網址為
`https://campuspass.niko-tecx.workers.dev`（未來可能變更網域）。本政策依《個人資料保護法》（下稱「個資法」）第 8 條
說明本服務如何蒐集、處理及利用您的個人資料。

### 1. 蒐集者

- 名稱：`[營運者名稱]` **【待填】**
- 聯絡方式：`[聯絡信箱]` **【待填】**
- 本服務非國立臺灣大學或任何學校之官方網站，各校亦非本服務之個人資料蒐集者。

### 2. 蒐集目的 **【待律師確認：特定目的代號】**

依「個人資料保護法之特定目的及個人資料之類別」，本服務的蒐集目的為：

| 代號 | 特定目的 | 本服務中的用途 |
|---|---|---|
| 〇九〇 | 消費者、客戶管理與服務 | 登入帳號、收藏優惠、顯示完整優惠條款、回報錯誤優惠 |
| 一三五 | 資（通）訊服務 | 提供網站與 PWA、維持登入狀態 |
| 一三六 | 資（通）訊與資料庫管理 | 帳號與工作階段（session）管理、資訊安全 |
| 一五七 | 調查、統計與研究分析 | 統計使用天數、瀏覽與使用優惠次數，以評估服務是否值得繼續經營 |
| 〇四〇 | 行銷 | 僅限商家主動填寫的合作意願表單，用於與商家聯繫合作事宜 |

本服務**不會**出售、出租您的個人資料，也不會用於上述目的以外的用途。本服務**不蒐集、不儲存學生證影像**。

### 3. 個人資料類別

**【待律師確認：類別代號】** 主要屬 C001 辨識個人者；以下列出實際儲存的欄位：

**(a) 使用 Google 帳號登入時**（Google OAuth，範圍僅 `openid email profile`）

| 資料 | 說明 |
|---|---|
| Google 帳號識別碼（`sub`） | 用來辨識同一個帳號 |
| 電子郵件地址、是否已驗證 | Google 提供 |
| 電子郵件網域（例如 `ntu.edu.tw`） | 由電子郵件推得，用於統計學校使用者 |
| 姓名、大頭貼網址 | Google 提供；大頭貼圖片由 Google 伺服器直接載入，本服務不儲存圖片本身 |
| 首次登入時間、最近登入時間、登入次數 | |

本服務**不會**取得您的 Google 密碼、通訊錄、信件或其他 Google 資料。

**(b) 使用本服務時**

| 資料 | 說明 |
|---|---|
| 使用日 | 您登入後使用本服務的日期（臺灣時間，每天最多一筆），用於計算活躍與回訪人數 |
| 收藏 | 您收藏的優惠及收藏時間 |
| 優惠瀏覽紀錄 | 登入後開啟哪一則優惠的完整內容及時間 |
| 優惠通行證（pass） | 您開啟店內出示用的通行證時產生：一組 6 碼代碼、優惠、建立時間；若您回答「優惠是否成功使用」，記錄您的回答（已使用／被拒絕／未使用）與時間；若商家輸入或掃描代碼確認，記錄確認時間與確認的商家連結 |
| 錯誤回報 | 您回報優惠有誤時填寫的文字（最多 1,000 字）與時間 |

**(c) 商家合作表單**（任何人皆可填寫，主要為商家）：店名、聯絡人姓名、電子郵件、電話、地區、願意提供的優惠、
合作意願、預算、留言；若填寫時已登入，另記錄帳號編號。

**(d) Cookie 與瀏覽器儲存**

| 名稱 | 類型 | 用途 | 期間 |
|---|---|---|---|
| `cp_session` | Cookie（HttpOnly、Secure） | 維持登入狀態；伺服器只儲存其 SHA-256 雜湊值 | 30 天或登出時刪除 |
| `cp_oauth` | Cookie（HttpOnly） | Google 登入過程的防偽驗證（state、PKCE） | 10 分鐘，登入完成即刪除 |
| `cp_merchant` | Cookie（HttpOnly） | 僅商家裝置：記住該商家的專屬確認連結 | 365 天 |
| `cp_theme`、`cp_lang`、`cp_school` | localStorage | 您選擇的深淺色主題、語言、學校篩選 | 直到您清除瀏覽器資料 |
| `cp_outcome_asked` | localStorage | 已詢問過「優惠是否成功」的通行證代碼（最多 30 筆），避免重複詢問 | 同上 |
| `cp_install_asks`、`cp_install_off`、`cp_first_visit` | localStorage | 「加入主畫面」提示的次數、是否關閉、首次造訪時間 | 同上 |
| `cp_pending_fav` | sessionStorage | 登入前點選的收藏，登入後自動完成 | 關閉分頁即刪除 |

localStorage 與 sessionStorage 的資料只存在您的裝置上，不會傳送至本服務伺服器。本服務不使用廣告或第三方追蹤 Cookie。

**(e) 技術紀錄** **【待律師確認】**：本服務託管於 Cloudflare。Cloudflare 為提供服務、防護攻擊及錯誤紀錄（Workers
Observability），會處理您的 IP 位址、瀏覽器資訊與請求紀錄。本服務本身的資料庫不儲存 IP 位址。

### 4. 利用期間、地區、對象及方式

**期間 【提案】**

| 資料 | 保存期間（提案） |
|---|---|
| 登入工作階段 | 30 天後失效並刪除 |
| 帳號資料、收藏 | 至您要求刪除帳號為止；連續 [3] 年未登入者刪除 |
| 使用日、優惠瀏覽紀錄 | 2 年，之後僅保留去識別化的統計數字 |
| 優惠通行證紀錄 | 2 年 |
| 錯誤回報 | 處理完畢後 1 年 |
| 商家合作表單 | 至商家撤回或要求刪除為止 |
| Cloudflare 技術紀錄 | 依 Cloudflare 設定，通常數日 **【待確認】** |

**地區 【待律師確認：個資法第 21 條國際傳輸】**：資料儲存於 Cloudflare D1 資料庫（位於美國東部地區），網站由
Cloudflare 全球節點提供。登入由 Google 處理。網頁字型由 Google Fonts 載入，您的瀏覽器會因此連線至 Google 伺服器。

**對象**：
- 本服務營運者（`[營運者名稱]`），僅限需要時存取。
- 受託處理者：Cloudflare, Inc.（主機與資料庫）；Google LLC（登入驗證、字型、大頭貼圖片）。
- 商家：商家確認通行證時，只會看到優惠名稱與代碼是否有效，**看不到您的姓名、電子郵件或任何帳號資料**。
- 除法律要求外，不提供給其他第三人；本服務不提供個人資料給學校。

**方式**：以自動化方式於網站中處理；營運者可匯出統計與名單（例如使用者名單、回報、通行證紀錄）供內部分析，
匯出檔案不對外公開。

### 5. 您的權利（個資法第 3 條）

您可以就您的個人資料：

1. 查詢或請求閱覽；
2. 請求製給複製本；
3. 請求補充或更正；
4. 請求停止蒐集、處理或利用；
5. 請求刪除。

**行使方式**：請以您登入使用的電子郵件寄信至 `[聯絡信箱]`，說明您的請求。本服務將於 [15] 日內回覆（必要時得延長
[15] 日並通知理由）**【待律師確認期限與費用】**。登出可隨時在網站上操作；收藏可隨時自行取消。

### 6. 不提供個人資料的影響

您可以不登入使用本服務，仍可瀏覽優惠名稱、類別、地區、折扣標示、適用對象與來源。若您不提供 Google 帳號資料，
將無法查看完整優惠條款與聯絡資訊、收藏優惠、使用通行證或回報錯誤。商家若不提供聯絡方式，本服務將無法回覆合作詢問。

### 7. 資料安全

- 全站使用 HTTPS；登入 Cookie 為 HttpOnly，伺服器只保存工作階段權杖與商家連結的雜湊值。
- 修改資料的請求需來自本網站（同源檢查），以防跨站請求偽造。
- 管理介面需持有管理權杖。

### 8. 未成年人 **【待律師確認】**

本服務以大專院校學生為對象。未滿 18 歲者請在法定代理人同意後使用。

### 9. 政策變更

本政策若有修改，將公告於本網站並更新「最後更新」日期；重大變更將於網站上明顯處提示。

---

## English

Last updated: [publication date]

CampusPass (the "Service") is an independent index of partner discounts that schools and student organisations
have already published, at `https://campuspass.niko-tecx.workers.dev` (the domain may change). This policy is
the notice required by Article 8 of Taiwan's Personal Data Protection Act (PDPA). It describes what the Service
collects and how it is used. If the two language versions differ, the Chinese version prevails **[LAWYER]**.

### 1. Who collects the data

- Name: `[Operator name]` **[TO FILL]**
- Contact: `[contact email]` **[TO FILL]**
- The Service is not an official website of National Taiwan University or any other school, and no school is
  the collector of your data here.

### 2. Purposes **[LAWYER: confirm the specified-purpose codes]**

| Code | Specified purpose (PDPA catalogue) | Use in the Service |
|---|---|---|
| 090 | Consumer and customer management and services | Your account, saved deals, full deal terms, reporting wrong deals |
| 135 | Information and communication services | Running the website and PWA, keeping you signed in |
| 136 | Information and database management | Account and session management, security |
| 157 | Surveys, statistics and research analysis | Counting active days, deal views and passes used, to judge whether the Service is worth running |
| 040 | Marketing | Only for the shop partnership form that a shop fills in itself, to contact that shop |

The Service does **not** sell or rent personal data and does not use it for other purposes. It does **not**
collect or store images of student ID cards.

### 3. What we collect

**[LAWYER: confirm category codes]** Mainly C001 (data identifying an individual). The stored fields are:

**(a) When you sign in with Google** (OAuth scopes `openid email profile` only): your Google account identifier
(`sub`); email address and whether Google has verified it; the email domain (e.g. `ntu.edu.tw`), used to count
users per school; your name and profile-picture URL (the picture is loaded from Google's servers and the image
itself is not stored); first and last sign-in time and the number of sign-ins. The Service never receives your
Google password, contacts, mail or other Google data.

**(b) When you use the Service**: the days you use it while signed in (one row per Taiwan-time day), to count
active and returning users; deals you save and when; which deals' full terms you open and when; in-store passes
you open (a 6-character code, the deal, the time; your answer to "did the discount work?" — used / refused /
not used — and when; and, if a shop types or scans the code, when it confirmed and which shop link confirmed it);
and the text of any "this deal is wrong" report (up to 1,000 characters) and its time.

**(c) Shop partnership form** (open to anyone, meant for shops): shop name, contact name, email, phone, area,
the discount offered, type of interest, budget, message, and your account number if you were signed in.

**(d) Cookies and browser storage**

| Name | Type | Purpose | Duration |
|---|---|---|---|
| `cp_session` | Cookie (HttpOnly, Secure) | Keeps you signed in; the server stores only its SHA-256 hash | 30 days, or until sign-out |
| `cp_oauth` | Cookie (HttpOnly) | Anti-forgery check during Google sign-in (state, PKCE) | 10 minutes, deleted after sign-in |
| `cp_merchant` | Cookie (HttpOnly) | Shop devices only: remembers the shop's private confirmation link | 365 days |
| `cp_theme`, `cp_lang`, `cp_school` | localStorage | Your theme, language and school filter | Until you clear browser data |
| `cp_outcome_asked` | localStorage | Pass codes already asked "did it work?" (max 30), so you are asked once | Same |
| `cp_install_asks`, `cp_install_off`, `cp_first_visit` | localStorage | How often the "add to home screen" tip was shown, whether you closed it, first visit time | Same |
| `cp_pending_fav` | sessionStorage | A deal you tried to save before signing in, saved after sign-in | Until the tab is closed |

localStorage and sessionStorage stay on your device and are not sent to the Service. No advertising or
third-party tracking cookies are used.

**(e) Technical logs [LAWYER]**: the Service runs on Cloudflare, which processes IP addresses, browser
information and request logs to deliver the Service, block attacks and record errors (Workers Observability).
The Service's own database does not store IP addresses.

### 4. Period, region, recipients and method of use

**Retention [PROPOSAL]**: sessions expire and are deleted after 30 days; the account and saved deals are kept
until you ask for deletion, or deleted after [3] years without sign-in; active days and deal views are kept for
2 years, after which only de-identified totals remain; pass records 2 years; reports 1 year after they are
handled; shop partnership leads until the shop withdraws or asks for deletion; Cloudflare technical logs per
Cloudflare's settings, typically a few days **[TO CONFIRM]**.

**Region [LAWYER: PDPA Art. 21 cross-border transfer]**: data is stored in a Cloudflare D1 database in the
Eastern North America region (United States) and served from Cloudflare's global network. Sign-in is handled
by Google. Web fonts are loaded from Google Fonts, so your browser connects to Google's servers.

**Recipients**: the operator, on a need-to-know basis; processors Cloudflare, Inc. (hosting, database) and
Google LLC (sign-in, fonts, profile pictures). When a shop confirms a pass it sees only the deal name and
whether the code is valid — **never your name, email or any account data**. No data is given to schools or to
other third parties except where the law requires.

**Method**: automated processing in the Service. The operator can export lists and statistics (users, reports,
pass records) for internal analysis; exports are not published.

### 5. Your rights (PDPA Article 3)

You may ask to (1) inquire about or review your data, (2) get a copy, (3) supplement or correct it,
(4) stop its collection, processing or use, and (5) delete it.

**How**: email `[contact email]` from the address you sign in with and say what you want. We reply within [15]
days (extendable once by [15] days with reasons) **[LAWYER: deadlines and any fee]**. You can sign out and
remove saved deals yourself at any time.

### 6. If you do not provide data

You can use the Service without signing in and still see deal names, categories, regions, discount badges,
eligibility and sources. Without Google sign-in you cannot see full terms and contact details, save deals, open
passes or report errors. Without contact details, we cannot answer a shop's partnership request.

### 7. Security

HTTPS everywhere; HttpOnly session cookies; the server stores only hashes of session tokens and shop links;
state-changing requests must come from the Service's own origin (CSRF check); the admin interface needs an admin
token.

### 8. Minors [LAWYER]

The Service is meant for university and college students. If you are under 18, use it with your legal
representative's consent.

### 9. Changes

Changes are posted on the Service with a new "last updated" date; significant changes are highlighted on the site.

---

## 實作備註 Implementation notes (for the team, remove before publishing)

These are gaps between the proposed policy and the current code (2026-10-15), for campass-1 to decide on:

1. **Expired sessions are not deleted**: `sessions` rows stay after `expires_at`. A scheduled cleanup (Cron
   Trigger) is needed for "deleted after 30 days".
2. **No retention jobs** for `visits`, `deal_views`, `redemptions`, `reports`, `merchant_leads`, or inactive users.
3. **No self-service account deletion**: deletion requests are manual (`DELETE FROM users` cascades only to
   `sessions` and `favorites`; `visits`, `deal_views`, `redemptions`, `reports` have no foreign key and must be
   deleted by `user_id` explicitly; `merchant_leads.user_id` should be set to NULL).
4. **Google Fonts** is loaded from `fonts.googleapis.com`, which shares visitors' IPs with Google. Self-hosting
   the two fonts would remove a recipient and simplify the cross-border section.
5. **Workers Observability** is enabled in `wrangler.jsonc`; confirm its log retention for the plan in use.
6. The `cp_merchant` cookie lasts 365 days; the policy states that.
