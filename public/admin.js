// CampusPass admin dashboard. Reads /admin/* with the ADMIN_TOKEN as a Bearer header.
// The token lives in sessionStorage only (falls back to memory if storage is blocked).
// All data is rendered with textContent; nothing from the API is parsed as HTML.

const TOKEN_KEY = "cp_admin_token";
const $ = (id) => document.getElementById(id);
let memToken = "";

const store = {
  get() {
    try { return sessionStorage.getItem(TOKEN_KEY) || memToken; } catch { return memToken; }
  },
  set(v) {
    memToken = v || "";
    try { v ? sessionStorage.setItem(TOKEN_KEY, v) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* memory only */ }
  },
};

class AuthError extends Error {}

async function admin(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${store.get()}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new AuthError("unauthorized");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/** An element with optional class, text and children. */
function el(tag, cls, text, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = String(text);
  for (const k of kids) if (k) e.append(k);
  return e;
}
/** "中文 English" label: zh text plus a muted English span. */
function label(zh, en, cls) {
  const e = el("span", cls, zh + " ");
  e.append(el("span", "en", en));
  return e;
}
const fmt = (n) => Number(n || 0).toLocaleString("zh-TW");

function setMsg(id, text, kind = "err") {
  const m = $(id);
  m.textContent = text || "";
  m.className = `msg ${text ? kind : ""}`;
}

// ---------- sign-in ----------

function showSignin(message = "") {
  $("dash").hidden = true;
  $("topActions").hidden = true;
  $("signin").hidden = false;
  setMsg("signinMsg", message);
  $("token").value = "";
  $("token").focus();
}

function signOut() {
  store.set("");
  $("keyOut").hidden = true;
  $("keyUrl").value = "";
  showSignin();
}

$("signinForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = $("token").value.trim();
  if (!t) return;
  store.set(t);
  load();
});
$("signout").addEventListener("click", signOut);
$("refresh").addEventListener("click", () => load());

function handleError(err, msgId) {
  if (err instanceof AuthError) {
    store.set("");
    showSignin("權杖錯誤或已更換，請重新輸入。 Token rejected (401): enter the current ADMIN_TOKEN.");
    return;
  }
  setMsg(msgId, `發生錯誤，請稍後再試。 Something went wrong (${err.message}).`);
}

// ---------- dashboard ----------

async function load() {
  if (!store.get()) return showSignin();
  $("refresh").disabled = true;
  try {
    const stats = await (await admin("/admin/stats")).json();
    render(stats);
    $("signin").hidden = true;
    $("dash").hidden = false;
    $("topActions").hidden = false;
    setMsg("dashMsg", "");
    $("updated").textContent = `更新於 ${new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (err) {
    if (!(err instanceof AuthError) && $("dash").hidden) {
      setMsg("signinMsg", `無法載入：${err.message}。 Could not load the stats.`);
    } else {
      handleError(err, "dashMsg");
    }
  } finally {
    $("refresh").disabled = false;
  }
}

function meter(zh, en, g, note) {
  const met = g.value >= g.target;
  const m = el("div", `meter${met ? " met" : ""}`);
  const head = el("div", "meter-head", null, label(zh, en, "meter-name"));
  head.append(el("span", `chip${met ? " met" : ""}`, met ? "達標 Met" : "未達標 Not yet"));
  const num = el("div", "meter-num", fmt(g.value));
  num.append(el("small", null, ` / ${fmt(g.target)}`));
  const bar = el("div", "bar", null, el("i"));
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", String(g.target));
  bar.setAttribute("aria-valuenow", String(g.value));
  bar.setAttribute("aria-label", `${zh} ${en}`);
  bar.style.setProperty("--p", String(Math.min(1, g.target ? g.value / g.target : 0)));
  m.append(head, num, bar, el("p", "meter-note", note));
  return m;
}

function tile(zh, en, value, tier) {
  const t = el("div", "tile");
  const name = el("div", "tile-name", zh);
  name.append(el("span", "en", en));
  t.append(name, el("div", "tile-num", fmt(value)));
  if (tier) t.append(el("div", "tile-tier", null, el("span", `chip ${tier.cls || ""}`, tier.text)));
  return t;
}

function table(rows, cols) {
  if (!rows || !rows.length) return el("p", "empty", "近 30 天沒有資料。 No data in the last 30 days.");
  const t = el("table");
  const head = el("tr");
  for (const c of cols) {
    const th = el("th", c.num ? "n" : "", c.label);
    th.scope = "col";
    head.append(th);
  }
  t.append(el("thead", null, null, head));
  const body = el("tbody");
  for (const r of rows) {
    const tr = el("tr");
    for (const c of cols) tr.append(el("td", c.num ? "n" : "", c.num ? fmt(r[c.key]) : r[c.key] ?? ""));
    body.append(tr);
  }
  t.append(body);
  return el("div", "tablewrap", null, t);
}

function render(s) {
  $("gate").replaceChildren(
    meter("學生使用兩次以上", "Students using twice", s.gate.students_using_twice,
      "近 30 天至少 2 次自述已使用或店家確認的使用者。 Users with ≥2 self-reported or shop-confirmed uses."),
    meter("願意付費的店家", "Shops that would pay", s.gate.shops_would_pay,
      "商家表單選擇付費曝光或獨家優惠。 Shop leads choosing paid featured placement or an exclusive deal."),
  );

  const u = s.users;
  $("users").replaceChildren(
    tile("全部使用者", "All users", u.total),
    tile("臺大信箱", "NTU email", u.ntu_domain),
    tile("近 7 天活躍", "Active, 7 days", u.active_7d),
    tile("近 30 天活躍", "Active, 30 days", u.active_30d),
    tile("回訪（30 天內 ≥2 天）", "Returning, 2+ days", u.returning_30d),
  );

  const g = s.usage_30d;
  $("usage").replaceChildren(
    tile("優惠瀏覽", "Deal views", g.deal_views),
    tile("開啟通行證", "Passes opened", g.passes_opened, { text: "第 1 級 · 僅意圖 Tier 1" }),
    tile("自述已使用", "Self-reported used", g.self_reported_used, { text: "第 2 級 · 弱 Tier 2" }),
    tile("店家確認", "Shop-confirmed", g.merchant_confirmed, { text: "第 3 級 · 已驗證 Tier 3", cls: "met" }),
    tile("被店家拒絕", "Refused at shop", g.refused_at_shop, { text: "資料品質 Data quality", cls: "tint" }),
  );

  $("merchants").replaceChildren(
    tile("合作表單", "Shop leads", s.merchants.leads),
    tile("願意付費", "Would pay", s.merchants.would_pay),
  );

  $("topViewed").replaceChildren(table(s.top_viewed_30d, [
    { key: "name", label: "優惠 Deal" },
    { key: "views", label: "瀏覽 Views", num: true },
  ]));
  $("topRedeemed").replaceChildren(table(s.top_redeemed_30d, [
    { key: "name", label: "優惠 Deal" },
    { key: "passes", label: "通行證 Passes", num: true },
    { key: "self_reported", label: "自述 Self", num: true },
    { key: "confirmed", label: "確認 Shop", num: true },
  ]));
}

// ---------- CSV exports ----------

$("csvButtons").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-csv]");
  if (!btn) return;
  const name = btn.dataset.csv;
  btn.disabled = true;
  setMsg("exportMsg", "");
  try {
    const blob = await (await admin(`/admin/${name}.csv`)).blob();
    const a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = `campuspass-${name}-${new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" })}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMsg("exportMsg", blob.size ? `已下載 ${a.download}。 Downloaded.` : `${a.download}：目前沒有資料。 No rows yet.`, "ok");
  } catch (err) {
    handleError(err, "exportMsg");
  } finally {
    btn.disabled = false;
  }
});

// ---------- shop links ----------

let deals = null;
const picked = new Map(); // id -> deal

async function loadDeals() {
  if (deals) return deals;
  const res = await fetch("/api/deals");
  deals = (await res.json()).deals || [];
  return deals;
}

function renderPicked() {
  const box = $("picked");
  box.replaceChildren(...[...picked.values()].map((d) => {
    const chip = el("span", "pick", null, el("span", null, d.subtitle ? `${d.name} · ${d.subtitle}` : d.name));
    const x = el("button", null, "×");
    x.type = "button";
    x.setAttribute("aria-label", `移除 Remove ${d.name}`);
    x.addEventListener("click", () => { picked.delete(d.id); renderPicked(); });
    chip.append(x);
    return chip;
  }));
}

let searchSeq = 0;
$("dealSearch").addEventListener("input", async (e) => {
  const q = e.target.value.trim().toLowerCase();
  const seq = ++searchSeq;
  const list = $("dealResults");
  if (!q) return list.replaceChildren();
  let all;
  try { all = await loadDeals(); } catch { return setMsg("keyMsg", "無法載入優惠清單。 Could not load deals."); }
  if (seq !== searchSeq) return;
  const hits = all
    .filter((d) => !picked.has(d.id) && `${d.name} ${d.subtitle || ""}`.toLowerCase().includes(q))
    .slice(0, 8);
  list.replaceChildren(...hits.map((d) => {
    const b = el("button", null, d.name);
    b.type = "button";
    const sub = [d.subtitle, (d.schools || []).join(", "), d.id].filter(Boolean).join(" · ");
    b.append(el("div", "sub", sub));
    b.addEventListener("click", () => {
      picked.set(d.id, d);
      renderPicked();
      $("dealSearch").value = "";
      list.replaceChildren();
      $("dealSearch").focus();
    });
    return el("li", null, null, b);
  }));
  if (!hits.length) list.replaceChildren(el("li", "empty", "找不到符合的優惠。 No matching deals."));
});

$("keyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const labelText = $("keyLabel").value.trim();
  if (!labelText) return;
  if (!picked.size) return setMsg("keyMsg", "請至少選一則優惠。 Pick at least one deal.");
  $("keySubmit").disabled = true;
  setMsg("keyMsg", "");
  try {
    const res = await admin("/admin/merchant-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: labelText, deal_ids: [...picked.keys()] }),
    });
    const { url } = await res.json();
    $("keyUrl").value = url;
    $("printLabel").textContent = labelText;
    try {
      const { qrSVG } = await import("/js/qr.js?v=7");
      $("keyQr").innerHTML = await qrSVG(url, { label: "Shop link QR" }); // SVG built locally from the URL
    } catch {
      $("keyQr").replaceChildren(el("p", "empty", "QR 無法產生，請使用連結。 QR unavailable; use the link."));
    }
    $("keyOut").hidden = false;
    picked.clear();
    renderPicked();
    $("keyLabel").value = "";
    setMsg("keyMsg", "已建立。 Link created.", "ok");
  } catch (err) {
    handleError(err, "keyMsg");
  } finally {
    $("keySubmit").disabled = false;
  }
});

$("keyCopy").addEventListener("click", async () => {
  const url = $("keyUrl").value;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    $("keyUrl").select();
    document.execCommand?.("copy");
  }
  setMsg("keyMsg", "已複製。 Copied.", "ok");
});
$("keyPrint").addEventListener("click", () => window.print());

// ---------- maintenance ----------

$("cleanup").addEventListener("click", async () => {
  if (!confirm("刪除過期登入及超過 2 年的紀錄？\nDelete expired sessions and records older than 2 years?")) return;
  $("cleanup").disabled = true;
  setMsg("cleanupMsg", "");
  try {
    const { deleted = [] } = await (await admin("/admin/cleanup", { method: "POST" })).json();
    const names = ["登入 sessions", "使用日 visits", "瀏覽 views", "通行證 passes"];
    const parts = deleted.map((n, i) => `${names[i] || `#${i + 1}`} ${fmt(n)}`);
    setMsg("cleanupMsg", `完成。已刪除 Deleted: ${parts.join("、")}`, "ok");
  } catch (err) {
    handleError(err, "cleanupMsg");
  } finally {
    $("cleanup").disabled = false;
  }
});

load();
