/* CampusPass front end. Plain ES modules, no framework, no build step.
   Routes: /  (Explore) · /saved · /me · /deal/:id (deep-linkable; a side panel on a desktop,
   a pushed full-screen page on a phone) · /merchants (商家合作) · /m/:key (a shop's private
   confirm page) · /r/:code (what a scanned pass QR opens). History API routing over the
   Workers SPA fallback. */
import { icon } from "./js/icons.js?v=7";
import { t, getLang, setLang, applyLang, schoolName } from "./js/i18n.js?v=7";
import { esc, linkify, safeUrl, storage, todayTW, daysBetween, fmtDate, norm, debounce, isPhone } from "./js/util.js?v=7";
import { toast, openDialog, closeDialog, dialogOpen } from "./js/ui.js?v=7";
import { qrSVG } from "./js/qr.js?v=7";

/* ---------- constants ---------- */

const CATEGORIES = ["food", "lodging", "transport", "shopping", "services", "entertainment", "health", "education"];
const CAT_ICON = {
  food: "utensils", lodging: "bed-double", transport: "bus", shopping: "shopping-bag",
  services: "wrench", entertainment: "ticket", health: "heart-pulse", education: "graduation-cap",
};
const REGIONS = ["north", "central", "south", "east"];
const ELIG = ["student", "staff", "alumni", "family"];
const THEME_KEY = "cp_theme";
const PENDING_FAV = "cp_pending_fav";
// CampusPass starts with NTU: Explore shows deals NTU students can use, and a
// visitor from another school picks theirs once (remembered in localStorage).
const DEFAULT_SCHOOL = "NTU";
const SCHOOL_KEY = "cp_school";
const SOON_DAYS = 30;
const TODAY = todayTW();

const GOOGLE_G =
  '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const MARK = '<svg aria-hidden="true" focusable="false"><use href="#cp-mark"/></svg>';

/* ---------- state ---------- */

const state = {
  deals: [],
  byId: new Map(),
  dealsStatus: "loading", // loading | ready | error
  user: null,
  favs: new Set(),
  favOrder: [], // newest first, as /api/me returns them
  meStatus: "loading", // loading | ready
  filters: { q: "", cat: "all", region: "all", school: storage.get(SCHOOL_KEY) || DEFAULT_SCHOOL, students: true },
  route: { name: "explore", id: null },
  base: "explore", // the list view under an open detail
  detail: new Map(), // id → { deal, locked }
  detailSeq: 0,
};
const VIEWS = ["explore", "saved", "me", "merchants", "shop", "scan"];
// Shop-facing pages run on a counter phone: no tabs, no account chrome.
const MINIMAL = new Set(["shop", "scan"]);
const scrollPos = Object.fromEntries(VIEWS.map((v) => [v, 0]));

const $ = (id) => document.getElementById(id);
const els = {
  shell: $("shell"), main: $("main"), appbar: $("appbar"), appbarTitle: $("appbarTitle"), appbarActions: $("appbarActions"),
  railFoot: $("railFoot"), q: $("q"), qclear: $("qclear"), cats: $("cats"), catWrap: $("catWrap"), filterRow: $("filterRow"),
  list: $("list"), exploreFoot: $("exploreFoot"), savedBody: $("savedBody"), meBody: $("meBody"),
  detail: $("detail"), dhead: $("dhead"), detailBody: $("detailBody"), detailUse: $("detailUse"), appbarBack: $("appbarBack"),
  merchantsBody: $("merchantsBody"), shopBody: $("shopBody"), scanBody: $("scanBody"),
};

/* ---------- data helpers ---------- */

function expiry(d) {
  if (d.auto_renew) return { kind: "renew", date: d.expires_on || "" };
  if (!d.expires_on) return null;
  const left = daysBetween(TODAY, d.expires_on);
  if (left < 0) return { kind: "expired", date: d.expires_on };
  if (left <= SOON_DAYS) return { kind: "soon", date: d.expires_on, left };
  return { kind: "until", date: d.expires_on };
}
const isExpired = (d) => expiry(d)?.kind === "expired";

function expiryChip(d) {
  const e = expiry(d);
  if (!e) return "";
  if (e.kind === "renew") return `<span class="chip">${icon("refresh-cw")}${esc(t("exp.renew"))}</span>`;
  if (e.kind === "expired") return `<span class="chip expired">${esc(t("exp.expired"))}</span>`;
  if (e.kind === "soon")
    return `<span class="chip soon" title="${esc(t("exp.soonLong", { d: fmtDate(e.date), n: e.left }))}">${icon("clock")}${esc(t("exp.soon", { d: fmtDate(e.date).slice(5) }))}</span>`;
  return `<span class="chip">${esc(t("exp.until", { d: fmtDate(e.date) }))}</span>`;
}

function expiryLong(d) {
  const e = expiry(d);
  if (!e) return t("exp.none");
  if (e.kind === "renew") return e.date ? t("exp.renewUntil", { d: fmtDate(e.date) }) : t("exp.renewLong");
  if (e.kind === "expired") return t("exp.expiredLong", { d: fmtDate(e.date) });
  if (e.kind === "soon") return t("exp.soonLong", { d: fmtDate(e.date), n: e.left });
  return t("exp.untilLong", { d: fmtDate(e.date) });
}

function regionsLabel(regions) {
  if (!regions?.length) return "";
  if (REGIONS.every((r) => regions.includes(r))) return t("region.national");
  return regions.map((r) => t(`region.${r}`)).join(getLang() === "en" ? ", " : "、");
}

const catLabel = (c) => t(`cat.${c}`);

function metaLine(d) {
  return [catLabel(d.category), regionsLabel(d.regions), d.source_org].filter(Boolean).join(" · ");
}

function prepare(deals) {
  for (const d of deals) {
    d.regions ||= [];
    d.schools ||= [];
    d.eligibility ||= {};
    d._hay = norm([d.name, d.subtitle, d.highlight, d.source_org].join(" "));
  }
  return deals.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/* ---------- API ---------- */

async function api(method, url, body) {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      // Per-person and live answers are never served from the HTTP cache.
      cache: method === "GET" && /^\/api\/(me|redemptions|merchant)\b/.test(url) ? "no-store" : "default",
      headers: method === "GET" ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {}
    // The server's clock (Date header), so the pass countdown survives a wrong phone clock.
    return { ok: res.ok, status: res.status, data, date: res.headers.get("Date") };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

async function loadDeals({ quiet = false } = {}) {
  if (!quiet) {
    state.dealsStatus = "loading";
    renderExplore();
  }
  const r = await api("GET", "/api/deals");
  if (r.ok && Array.isArray(r.data?.deals)) {
    state.deals = prepare(r.data.deals);
    state.byId = new Map(state.deals.map((d) => [d.id, d]));
    state.dealsStatus = "ready";
    rowCache.clear();
    buildFilterControls();
  } else if (!quiet || !state.deals.length) {
    state.dealsStatus = "error";
  }
  renderExplore();
  renderSaved();
  if (state.route.name === "me") renderMe();
  if (state.route.name === "deal" && !state.detail.has(state.route.id)) renderDetail(state.route.id);
}

async function loadMe() {
  const r = await api("GET", "/api/me");
  if (r.ok && r.data) {
    state.user = r.data.user || null;
    state.favOrder = Array.isArray(r.data.favorites) ? r.data.favorites.slice() : [];
    state.favs = new Set(state.favOrder);
  }
  state.meStatus = "ready";
  renderAccountChrome();
  syncStars();
  renderSaved();
  if (state.route.name === "me") renderMe();
  if (state.route.name === "deal") {
    // Signed in after the detail was first shown locked: fetch the full deal.
    const cached = state.detail.get(state.route.id);
    if (state.user && cached?.locked) {
      state.detail.delete(state.route.id);
      renderDetail(state.route.id);
    } else renderDetailHead();
  }
  // The star tapped before signing in, saved now that we're back.
  const pending = storage.get(PENDING_FAV, "session");
  if (pending) {
    storage.set(PENDING_FAV, null, "session");
    if (state.user && !state.favs.has(pending)) toggleFav(pending);
  }
}

/* ---------- filtering ---------- */

function queryTerms() {
  return norm(state.filters.q).split(/\s+/).filter(Boolean);
}

function matches(d, terms, skip = "") {
  const f = state.filters;
  if (isExpired(d)) return false;
  if (f.students && !d.eligibility.student) return false;
  if (skip !== "cat" && f.cat !== "all" && d.category !== f.cat) return false;
  if (skip !== "region" && f.region !== "all" && !d.regions.includes(f.region)) return false;
  if (skip !== "school" && f.school !== "all" && !d.schools.includes(f.school)) return false;
  for (const term of terms) if (!d._hay.includes(term)) return false;
  return true;
}

function facetCounts(facet, keyOf) {
  const terms = queryTerms();
  const counts = new Map();
  let all = 0;
  for (const d of state.deals) {
    if (!matches(d, terms, facet)) continue;
    all++;
    for (const k of keyOf(d)) counts.set(k, (counts.get(k) || 0) + 1);
  }
  return { all, counts };
}

const filtersActive = () => {
  const f = state.filters;
  return f.q.trim() !== "" || f.cat !== "all" || f.region !== "all" || f.school !== DEFAULT_SCHOOL || !f.students;
};

/* ---------- rows ---------- */

const rowCache = new Map();

// Rows stay one line: the full eligibility breakdown lives in the detail view;
// a row only warns when students can't use the deal.
function badgesHTML(d) {
  const warn = d.eligibility.student ? "" : `<span class="mini warn">${esc(t("elig.noStudent"))}</span>`;
  return `${d.highlight ? `<span class="badge">${esc(d.highlight)}</span>` : ""}${expiryChip(d)}${warn}`;
}

function starHTML(d) {
  const on = state.favs.has(d.id);
  return `<button class="star" type="button" data-star="${esc(d.id)}" aria-pressed="${on}" aria-label="${esc(
    t(on ? "row.unsaveName" : "row.saveName", { name: d.name })
  )}">${icon("star")}</button>`;
}

function rowEl(d) {
  let li = rowCache.get(d.id);
  if (li) return li;
  li = document.createElement("li");
  li.className = `item${isExpired(d) ? " expired" : ""}`;
  li.dataset.id = d.id;
  li.innerHTML = `<a class="pick" href="/deal/${encodeURIComponent(d.id)}" data-deal="${esc(d.id)}">
    <span class="cattile" aria-hidden="true">${icon(CAT_ICON[d.category] || "ticket")}</span>
    <span class="itxt">
      <span class="nm">${esc(d.name)}</span>
      ${d.subtitle ? `<span class="sub">${esc(d.subtitle)}</span>` : ""}
      <span class="meta">${esc(metaLine(d))}</span>
      <span class="badges">${badgesHTML(d)}</span>
    </span></a>${starHTML(d)}`;
  rowCache.set(d.id, li);
  return li;
}

/** Saved rows are separate nodes (a row cannot sit in two lists at once). */
function savedRowEl(d) {
  const li = rowEl(d).cloneNode(true);
  return li;
}

function skeletonRows(n = 7) {
  return Array.from({ length: n }, () => '<li class="skel" aria-hidden="true"><i class="t"></i><span class="l"><i></i><i></i><i></i></span></li>').join("");
}

function emptyHTML({ ic, title, body, action = "" }) {
  return `<div class="empty"><span class="eic">${icon(ic)}</span><b>${esc(title)}</b>${body ? `<p>${esc(body)}</p>` : ""}${action}</div>`;
}

function syncStars() {
  for (const b of document.querySelectorAll("[data-star]")) {
    const id = b.dataset.star;
    const on = state.favs.has(id);
    b.setAttribute("aria-pressed", String(on));
    const d = state.byId.get(id) || state.detail.get(id)?.deal;
    const name = d?.name || "";
    if (b.classList.contains("star")) b.setAttribute("aria-label", t(on ? "row.unsaveName" : "row.saveName", { name }));
    else {
      b.classList.toggle("saved", on);
      b.setAttribute("aria-label", t(on ? "row.unsave" : "row.save"));
    }
  }
  const n = state.user ? state.favs.size : 0;
  for (const el of document.querySelectorAll("[data-saved-count]")) {
    el.textContent = n > 99 ? "99+" : String(n);
    el.hidden = n === 0;
  }
}

/* ---------- Explore ---------- */

function buildFilterControls() {
  // Category pills: built once per data/language, then updated in place so focus survives.
  const present = new Set(state.deals.filter((d) => !isExpired(d)).map((d) => d.category));
  const cats = ["all", ...CATEGORIES.filter((c) => present.has(c))];
  els.cats.innerHTML = cats
    .map(
      (c) =>
        `<button class="pill" type="button" data-cat="${c}" aria-pressed="false">${c === "all" ? "" : icon(CAT_ICON[c])}<span>${esc(
          c === "all" ? t("cat.all") : catLabel(c)
        )}</span><span class="n"></span></button>`
    )
    .join("");
  els.filterRow.innerHTML = `
    <button class="pill fpill" type="button" data-toggle="students" aria-pressed="true">${icon("check")}<span>${esc(t("filter.students"))}</span></button>
    <button class="pill fpill" type="button" data-pick="region" aria-haspopup="dialog"><span data-label></span>${icon("chevron-down", "chev")}</button>
    <button class="pill fpill" type="button" data-pick="school" aria-haspopup="dialog"><span data-label></span>${icon("chevron-down", "chev")}</button>
    <button class="linkbtn" type="button" data-reset hidden>${esc(t("filter.reset"))}</button>
    <span class="fcount" id="fcount" aria-live="polite"></span>`;
  updatePillMask();
}

function renderExplore() {
  const busy = state.dealsStatus === "loading";
  els.list.setAttribute("aria-busy", String(busy));
  if (busy) {
    els.list.innerHTML = skeletonRows();
    els.exploreFoot.innerHTML = "";
    return;
  }
  if (state.dealsStatus === "error") {
    els.list.innerHTML = "";
    els.list.append(
      Object.assign(document.createElement("li"), {
        innerHTML: emptyHTML({
          ic: "circle-alert",
          title: t("empty.loadFailed"),
          body: t("empty.loadFailedHint"),
          action: `<button class="btn btn-outline btn-sm" type="button" data-retry>${esc(t("retry"))}</button>`,
        }),
      })
    );
    return;
  }
  const f = state.filters;
  const terms = queryTerms();

  // Pills
  const catCounts = facetCounts("cat", (d) => [d.category]);
  for (const b of els.cats.querySelectorAll("[data-cat]")) {
    const c = b.dataset.cat;
    b.setAttribute("aria-pressed", String(f.cat === c));
    b.querySelector(".n").textContent = c === "all" ? catCounts.all : catCounts.counts.get(c) || 0;
  }
  const stu = els.filterRow.querySelector('[data-toggle="students"]');
  if (stu) {
    stu.setAttribute("aria-pressed", String(f.students));
    stu.classList.toggle("on", f.students);
    stu.querySelector(".ic").style.display = f.students ? "" : "none";
  }
  const reg = els.filterRow.querySelector('[data-pick="region"]');
  if (reg) {
    reg.querySelector("[data-label]").textContent = f.region === "all" ? t("filter.region") : t(`region.${f.region}`);
    reg.classList.toggle("on", f.region !== "all");
    reg.setAttribute("aria-label", `${t("filter.region")}: ${f.region === "all" ? t("filter.regionAll") : t(`region.${f.region}`)}`);
  }
  const sch = els.filterRow.querySelector('[data-pick="school"]');
  if (sch) {
    sch.querySelector("[data-label]").textContent = f.school === "all" ? t("filter.school") : schoolName(f.school);
    sch.classList.toggle("on", f.school !== "all");
    sch.setAttribute("aria-label", `${t("filter.school")}: ${f.school === "all" ? t("filter.schoolAll") : schoolName(f.school, true)}`);
  }
  const reset = els.filterRow.querySelector("[data-reset]");
  if (reset) reset.hidden = !filtersActive();

  // List
  const shown = state.deals.filter((d) => matches(d, terms));
  const fc = $("fcount");
  if (fc) fc.textContent = t("count", { n: shown.length });
  if (shown.length) fillList(shown);
  else {
    cancelAnimationFrame(fillRaf);
    els.list.innerHTML = "";
    const li = document.createElement("li");
    li.innerHTML = emptyHTML({
      ic: "search-x",
      title: t("empty.noResults"),
      body: t("empty.noResultsHint"),
      action: filtersActive() ? `<button class="btn btn-outline btn-sm" type="button" data-reset>${esc(t("filter.reset"))}</button>` : "",
    });
    els.list.append(li);
  }
  markSelected();

  const expired = state.deals.filter(isExpired).length;
  els.exploreFoot.innerHTML = `${expired ? `<p>${esc(t("list.expiredHidden", { n: expired }))}</p>` : ""}<p>${esc(t("disclaimer"))}</p>
    <p>${merchantsLinkHTML()}</p>`;
}

/** 「店家想登錄優惠或洽談合作？商家合作」: the list footer and the About card. */
const merchantsLinkHTML = () => `${esc(t("foot.merchants"))} <a href="/merchants" data-nav>${esc(t("foot.merchantsLink"))}</a>`;

/* With every school selected the list is ~1,100 rows. The first screenful goes in at once;
   the rest follows in chunks on the next frames, so a tap on a filter paints immediately.
   A newer render cancels the chunks still pending. */
const FIRST_ROWS = 40;
const CHUNK_ROWS = 250;
let fillRaf = 0;

function fillList(deals) {
  cancelAnimationFrame(fillRaf);
  els.list.replaceChildren(...deals.slice(0, FIRST_ROWS).map(rowEl));
  let i = FIRST_ROWS;
  const more = () => {
    if (i >= deals.length) return;
    els.list.append(...deals.slice(i, i + CHUNK_ROWS).map(rowEl));
    i += CHUNK_ROWS;
    markSelected();
    if (i < deals.length) fillRaf = requestAnimationFrame(more);
  };
  if (deals.length > FIRST_ROWS) fillRaf = requestAnimationFrame(more);
}

function markSelected() {
  const id = state.route.name === "deal" ? state.route.id : null;
  for (const li of document.querySelectorAll(".item.sel")) li.classList.remove("sel");
  if (id) for (const li of document.querySelectorAll(`.item[data-id="${CSS.escape(id)}"]`)) li.classList.add("sel");
}

function openPicker(kind, anchor) {
  const f = state.filters;
  const isRegion = kind === "region";
  const { all, counts } = isRegion ? facetCounts("region", (d) => d.regions) : facetCounts("school", (d) => d.schools);
  const values = isRegion ? REGIONS : [...new Set(state.deals.flatMap((d) => d.schools))].sort();
  const cur = isRegion ? f.region : f.school;
  const label = (v) => (v === "all" ? t(isRegion ? "filter.regionAll" : "filter.schoolAll") : isRegion ? t(`region.${v}`) : schoolName(v, true));
  const opts = ["all", ...values]
    .map(
      (v) =>
        `<li><button class="opt" type="button" role="menuitemradio" data-value="${esc(v)}" aria-checked="${v === cur}">${icon("check")}<span>${esc(
          label(v)
        )}</span><span class="n">${v === "all" ? all : counts.get(v) || 0}</span></button></li>`
    )
    .join("");
  const title = t(isRegion ? "filter.region" : "filter.school");
  const dlg = openDialog({
    cls: "picker",
    label: t("dialog.pick", { what: title }),
    anchor,
    html: `<div class="dlg-head pick-head"><h2>${esc(title)}</h2><button class="iconbtn dlg-x" type="button" data-close aria-label="${esc(t("close"))}">${icon("x")}</button></div>
      <ul class="opts" role="menu">${opts}</ul>`,
  });
  dlg.querySelector('[aria-checked="true"]')?.focus();
  dlg.addEventListener("click", (e) => {
    const b = e.target.closest("[data-value]");
    if (!b) return;
    if (isRegion) f.region = b.dataset.value;
    else {
      f.school = b.dataset.value;
      storage.set(SCHOOL_KEY, f.school === DEFAULT_SCHOOL ? null : f.school);
    }
    closeDialog();
    renderExplore();
  });
}

function resetFilters() {
  Object.assign(state.filters, { q: "", cat: "all", region: "all", school: DEFAULT_SCHOOL, students: true });
  storage.set(SCHOOL_KEY, null);
  els.q.value = "";
  els.qclear.hidden = true;
  renderExplore();
}

function updatePillMask() {
  const p = els.cats;
  const w = els.catWrap;
  w.classList.toggle("more-l", p.scrollLeft > 2);
  w.classList.toggle("more-r", p.scrollLeft + p.clientWidth < p.scrollWidth - 2);
}

/* ---------- Saved ---------- */

function renderSaved() {
  const body = els.savedBody;
  if (state.meStatus === "loading" || (state.user && state.dealsStatus === "loading")) {
    body.innerHTML = `<ul class="list" aria-busy="true">${skeletonRows(4)}</ul>`;
    return;
  }
  if (!state.user) {
    body.innerHTML = emptyHTML({
      ic: "star",
      title: t("saved.signedOutTitle"),
      body: t("saved.signedOutBody"),
      action: `${googleButton()}<p class="dlg-fine" style="max-width:340px">${esc(t("privacy.note"))}</p>`,
    });
    return;
  }
  const deals = state.favOrder.map((id) => state.byId.get(id)).filter(Boolean);
  if (!deals.length) {
    body.innerHTML = emptyHTML({
      ic: "star",
      title: t("saved.emptyTitle"),
      body: t("saved.emptyBody"),
      action: `<a class="btn btn-outline btn-sm" href="/" data-nav>${icon("compass")}${esc(t("saved.browse"))}</a>`,
    });
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "list";
  ul.setAttribute("aria-labelledby", "savedTitle");
  ul.append(...deals.map(savedRowEl));
  body.replaceChildren(ul);
  syncStars();
  markSelected();
}

/* ---------- Me ---------- */

function avatarHTML(user, cls = "") {
  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  const pic = safeUrl(user.picture || "");
  return `<span class="avatar ${cls}">${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}${pic ? "" : esc(initial)}</span>`;
}

function segHTML(name, current, options) {
  return `<div class="seg" role="radiogroup" aria-label="${esc(t(name === "lang" ? "me.language" : "me.theme"))}">${options
    .map(
      ([v, label, ic]) =>
        `<button type="button" role="radio" data-${name}="${v}" aria-checked="${v === current}" tabindex="${v === current ? 0 : -1}">${ic ? icon(ic) : ""}<span>${esc(label)}</span></button>`
    )
    .join("")}</div>`;
}

const langSeg = () => segHTML("lang", getLang(), [["zh", "中文"], ["en", "English"]]);
const themeSeg = () =>
  segHTML("theme", currentTheme(), [
    ["light", t("theme.light"), "sun"],
    ["dark", t("theme.dark"), "moon"],
    ["system", t("theme.system"), "monitor"],
  ]);

function installAvailable() {
  const p = window.cpPWA;
  try {
    return !!p && !p.isStandalone() && (p.canInstall() || p.isIOS);
  } catch {
    return false;
  }
}

function renderMe() {
  const u = state.user;
  let account;
  if (state.meStatus === "loading") account = `<section class="card"><div class="dskel"><i style="width:40%"></i><i style="width:70%"></i></div></section>`;
  else if (u)
    account = `<section class="card" aria-label="${esc(t("account.settings"))}"><div class="profile">${avatarHTML(u, "lg")}
      <div class="who"><b>${esc(u.name || u.email)}</b><span>${esc(u.email)}</span></div>
      <button class="btn btn-outline btn-sm" type="button" data-signout>${icon("log-out")}${esc(t("me.signout"))}</button></div></section>`;
  else
    account = `<section class="card signincard"><h2>${esc(t("me.signedOutTitle"))}</h2><p>${esc(t("me.signedOutBody"))}</p>${googleButton()}
      <p class="fine">${esc(t("privacy.note"))}</p></section>`;

  let install = "";
  if (installAvailable()) {
    const ios = !window.cpPWA.canInstall() && window.cpPWA.isIOS;
    install = `<section class="card"><h2>${esc(t("me.app"))}</h2><div class="installrow">
      <span class="installtxt"><b>${esc(t("me.install"))}</b><span>${esc(t(ios ? "me.installIOS" : "me.installHint"))}</span></span>
      ${ios ? "" : `<button class="btn btn-primary btn-sm" type="button" data-install>${esc(t("me.installBtn"))}</button>`}</div></section>`;
  }

  const sources = new Map();
  for (const d of state.deals) sources.set(d.source_org, (sources.get(d.source_org) || 0) + 1);
  const srcList = [...sources]
    .sort((a, b) => b[1] - a[1])
    .map(([org, n]) => `<li><span>${esc(org)}</span><span>${esc(t("count", { n }))}</span></li>`)
    .join("");

  els.meBody.innerHTML = `${account}
    <section class="card"><h2>${esc(t("me.settings"))}</h2>
      <div class="setrow"><span>${esc(t("me.language"))}</span>${langSeg()}</div>
      <div class="setrow"><span>${esc(t("me.theme"))}</span>${themeSeg()}</div>
    </section>
    ${install}
    <section class="card card-links"><a class="row" href="/merchants" data-nav>${icon("store")}<span class="rtxt"><b>${esc(t("me.merchants"))}</b><small>${esc(
      t("me.merchantsHint")
    )}</small></span>${icon("chevron-right", "go")}</a></section>
    <section class="card"><h2>${esc(t("me.about"))}</h2>
      <p>${esc(t("me.aboutBody"))}</p>
      <p>${merchantsLinkHTML()}</p>
      <p class="disclaimer">${esc(t("disclaimer"))}</p>
      ${srcList ? `<h2 style="margin-top:16px">${esc(t("me.sources"))}</h2><ul class="srclist">${srcList}</ul>` : ""}
      <p class="fine" style="margin-top:12px">${esc(t("me.contact"))}</p>
    </section>
    <section class="card"><h2>${esc(t("me.privacy"))}</h2><p>${esc(t("privacy.note"))}</p></section>
    <p class="mefoot">CampusPass · ${esc(t("app.tagline"))}</p>`;
}

/* ---------- account chrome (rail foot, app bar) ---------- */

function renderAccountChrome() {
  const u = state.user;
  if (state.meStatus === "loading") {
    els.railFoot.innerHTML = "";
    els.appbarActions.innerHTML = "";
    return;
  }
  els.railFoot.innerHTML = u
    ? `<button class="avatarbtn" type="button" id="railAvatar" aria-haspopup="dialog" aria-label="${esc(t("account.menu"))}">${avatarHTML(u)}</button>`
    : `<button class="railsignin" type="button" data-signin><span class="railic">${icon("log-in")}</span><span>${esc(t("signin.short"))}</span></button>`;
  els.appbarActions.innerHTML = u
    ? `<a class="avatarbtn" href="/me" data-nav aria-label="${esc(t("account.settings"))}">${avatarHTML(u)}</a>`
    : `<button class="signinpill" type="button" data-signin>${esc(t("signin.short"))}</button>`;
}

function openAccountMenu(anchor) {
  const u = state.user;
  if (!u) return openSignin();
  openDialog({
    cls: "acct",
    label: t("account.menu"),
    anchor,
    placement: "right",
    html: `<div class="me">${avatarHTML(u)}<div class="who"><b>${esc(u.name || u.email)}</b><small>${esc(u.email)}</small></div></div>
      <div class="lbl">${esc(t("me.language"))}</div>${langSeg()}
      <div class="lbl">${esc(t("me.theme"))}</div>${themeSeg()}
      <div class="sep"></div>
      <a class="item-btn" href="/me" data-nav data-close>${icon("user-round")}${esc(t("account.settings"))}</a>
      <button class="item-btn" type="button" data-signout data-close>${icon("log-out")}${esc(t("me.signout"))}</button>`,
  });
}

/* ---------- sign in ---------- */

function loginHref() {
  const next = location.pathname + location.search;
  return `/auth/google/start?next=${encodeURIComponent(next)}`;
}

function googleButton() {
  return `<a class="gbtn" href="${esc(loginHref())}" data-login>${GOOGLE_G}<span>${esc(t("google.signin"))}</span></a>`;
}

function openSignin(reason = "", onClose = null) {
  openDialog({
    onClose,
    cls: "signin",
    labelledBy: "signinTitle",
    html: `<button class="iconbtn dlg-x" type="button" data-close aria-label="${esc(t("close"))}">${icon("x")}</button>
      <div class="dlg-center"><span class="lic">${MARK}</span>
      <h2 id="signinTitle">${esc(t("signin.title"))}</h2>
      <p class="dlg-body">${esc(reason === "save" ? t("signin.saveReason") : t("signin.body"))}</p>
      ${googleButton()}
      <p class="dlg-fine">${esc(t("privacy.note"))}</p></div>`,
  });
}

async function signOut() {
  const r = await api("POST", "/api/logout");
  if (!r.ok) return toast(t("toast.signoutFailed"), { error: true });
  state.user = null;
  state.favs = new Set();
  state.favOrder = [];
  state.detail.clear();
  renderAccountChrome();
  syncStars();
  renderSaved();
  if (state.route.name === "me") renderMe();
  if (state.route.name === "deal") renderDetail(state.route.id);
  toast(t("toast.signedOut"));
}

/* ---------- favourites (optimistic) ---------- */

function setFav(id, on) {
  if (on) {
    state.favs.add(id);
    state.favOrder = [id, ...state.favOrder.filter((x) => x !== id)];
  } else {
    state.favs.delete(id);
    state.favOrder = state.favOrder.filter((x) => x !== id);
  }
  syncStars();
  if (state.route.name === "saved" || state.base === "saved") renderSaved();
}

async function toggleFav(id, btn) {
  if (!state.user) {
    storage.set(PENDING_FAV, id, "session");
    openSignin("save", () => storage.set(PENDING_FAV, null, "session"));
    return;
  }
  const on = !state.favs.has(id);
  setFav(id, on);
  if (btn && on) {
    btn.classList.remove("pop");
    void btn.offsetWidth;
    btn.classList.add("pop");
  }
  const r = await api(on ? "PUT" : "DELETE", `/api/favorites/${encodeURIComponent(id)}`);
  if (r.ok) {
    toast(t(on ? "toast.saved" : "toast.unsaved"));
    return;
  }
  setFav(id, !on);
  if (r.status === 401) {
    state.user = null;
    state.favs = new Set();
    state.favOrder = [];
    renderAccountChrome();
    syncStars();
    toast(t("toast.sessionExpired"), { error: true });
  } else toast(t("toast.saveFailed"), { error: true });
}

/* ---------- detail ---------- */

function renderDetailHead() {
  const id = state.route.id;
  const d = state.detail.get(id)?.deal || state.byId.get(id);
  const phone = isPhone();
  const on = state.favs.has(id);
  els.dhead.innerHTML = `
    <button class="iconbtn" type="button" data-close-detail aria-label="${esc(t(phone ? "detail.back" : "detail.close"))}">${icon("chevron-left", "back-ic")}${icon("x", "close-ic")}</button>
    <p class="dhead-title" aria-hidden="true">${esc(d?.name || "")}</p>
    ${d ? `<button class="iconbtn" type="button" data-share aria-label="${esc(t("detail.share"))}">${icon("share")}</button>
    <button class="iconbtn${on ? " saved" : ""}" type="button" data-star="${esc(id)}" aria-pressed="${on}" aria-label="${esc(t(on ? "row.unsave" : "row.save"))}">${icon("star")}</button>` : ""}`;
  renderUseBar();
}

/** 「使用優惠」, the one signature CTA of the detail: only once the full deal is shown to a
 *  signed-in reader (signed out, the sign-in card stands in its place). Expired: disabled,
 *  with the reason. */
function renderUseBar() {
  const c = state.route.name === "deal" ? state.detail.get(state.route.id) : null;
  const show = !!(state.user && c && !c.locked);
  els.detail.classList.toggle("has-use", show);
  els.detailUse.hidden = !show;
  if (!show) {
    els.detailUse.innerHTML = "";
    return;
  }
  const expired = isExpired(c.deal);
  els.detailUse.classList.toggle("is-expired", expired);
  els.detailUse.innerHTML = `<button class="btn btn-cta" type="button" data-redeem${expired ? ' disabled aria-describedby="useWhy"' : ""}>${icon(
    "qr-code"
  )}<span>${esc(t("use.cta"))}</span></button>
    <p class="usehint" id="useWhy">${esc(t(expired ? "use.expired" : "use.hint"))}</p>`;
}

function eligHTML(d) {
  return `<div class="elig">${ELIG.map((k) =>
    d.eligibility[k]
      ? `<span class="e">${icon("check")}${esc(t(`elig.${k}`))}</span>`
      : `<span class="e no"><span class="sr-only">${esc(getLang() === "en" ? "Not for" : "不適用")} </span>${esc(t(`elig.${k}`))}</span>`
  ).join("")}</div>`;
}

function telHref(phone) {
  const head = String(phone).normalize("NFKC").split(/[㐀-鿿,，/、]/)[0];
  const digits = head.replace(/[^\d+]/g, "");
  return digits.length >= 6 ? `tel:${digits}` : "";
}

function phoneRows(phone) {
  return String(phone)
    .split(/[、,，;；/]|\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const href = telHref(p);
      const inner = `${icon("phone")}<span class="rtxt"><b>${esc(p)}</b><small>${esc(t("detail.phone"))}</small></span>`;
      return href ? `<a class="row" href="${esc(href)}">${inner}</a>` : `<div class="row">${inner}</div>`;
    })
    .join("");
}

function detailHTML(d, { locked, loading, error }) {
  const exp = expiry(d);
  const schools = d.schools.map((s) => schoolName(s, true)).join(getLang() === "en" ? ", " : "、");
  let content = "";
  if (loading) content = `<div class="dsec"><div class="dskel"><i style="width:30%"></i><i></i><i style="width:85%"></i><i style="width:60%"></i></div></div>`;
  else if (error) content = `<div class="note">${icon("circle-alert")}<span>${esc(t("detail.loadFailed"))}</span></div>`;
  else if (locked)
    content = `<section class="lockcard" aria-labelledby="lockTitle">
      <span class="lic">${icon("lock")}</span>
      <h3 id="lockTitle">${esc(t("lock.title"))}</h3>
      <p>${esc(t("lock.body"))}</p>
      ${googleButton()}
      <p class="fine">${esc(t("privacy.note"))}</p></section>`;
  else {
    const contact = [
      d.phone ? phoneRows(d.phone) : "",
      d.address
        ? `<a class="row" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}" target="_blank" rel="noopener noreferrer">${icon("map-pin")}<span class="rtxt"><b>${esc(d.address)}</b><small>${esc(t("detail.openMap"))}</small></span>${icon("external-link", "go")}</a>`
        : "",
    ].join("");
    const links = (Array.isArray(d.links) ? d.links : [])
      .map((l) => ({ label: l?.label || l?.url, url: safeUrl(l?.url || "") }))
      .filter((l) => l.url)
      .map((l) => {
        let host = "";
        try {
          host = new URL(l.url).hostname.replace(/^www\./, "");
        } catch {}
        const sub = host && host !== String(l.label).replace(/^www\./, "") ? `<small>${esc(host)}</small>` : "";
        return `<a class="row" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${icon("link")}<span class="rtxt"><b>${esc(l.label)}</b>${sub}</span>${icon("external-link", "go")}</a>`;
      })
      .join("");
    content = `
      ${d.offer ? `<section class="dsec"><h3>${esc(t("detail.offer"))}</h3><p class="prose">${linkify(d.offer)}</p></section>` : ""}
      ${contact ? `<section class="dsec"><h3>${esc(t("detail.contact"))}</h3><div class="rows">${contact}</div></section>` : ""}
      ${links ? `<section class="dsec"><h3>${esc(t("detail.links"))}</h3><div class="rows">${links}</div></section>` : ""}
      ${d.notes ? `<section class="dsec"><h3>${esc(t("detail.notes"))}</h3><p class="prose">${linkify(d.notes)}</p></section>` : ""}
      ${d.info ? `<details class="info"><summary>${esc(t("detail.info"))}${icon("chevron-down")}</summary><p class="prose">${linkify(d.info)}</p></details>` : ""}`;
  }
  const srcUrl = safeUrl(d.source_url || "");
  const source = `<section class="dsec"><h3>${esc(t("detail.source"))}</h3><div class="srccard">
      <b>${esc(d.source_org || "")}</b>
      ${d.source_level ? `<span>${esc(t("detail.sourceLevel", { l: t(`level.${d.source_level}`) }))}</span>` : ""}
      ${srcUrl ? `<a href="${esc(srcUrl)}" target="_blank" rel="noopener noreferrer">${esc(t("detail.sourceLink"))}${icon("external-link")}</a>` : ""}
      ${d.retrieved_on ? `<span class="when">${esc(t("detail.retrieved", { d: fmtDate(d.retrieved_on) }))}</span>` : ""}
    </div></section>`;
  const actions =
    !locked && !loading && !error
      ? `<div class="dactions"><button class="btn btn-outline btn-sm" type="button" data-report>${icon("flag")}${esc(t("detail.report"))}</button>
         <button class="btn btn-ghost btn-sm" type="button" data-share>${icon("share")}${esc(t("detail.share"))}</button></div>`
      : "";
  return `
    <div class="dhero">
      <div class="eyebrow">${icon(CAT_ICON[d.category] || "ticket")}<span>${esc([catLabel(d.category), regionsLabel(d.regions)].filter(Boolean).join(" · "))}</span></div>
      <h2 class="dname" id="detailName" tabindex="-1">${esc(d.name)}</h2>
      ${d.subtitle ? `<p class="dsub">${esc(d.subtitle)}</p>` : ""}
      <div class="badges">${d.highlight ? `<span class="badge">${esc(d.highlight)}</span>` : ""}${expiryChip(d)}</div>
    </div>
    ${exp?.kind === "expired" ? `<div class="note">${icon("triangle-alert")}<span>${esc(t("detail.expiredNote"))}</span></div>` : ""}
    <section class="dsec"><h3>${esc(t("detail.eligibility"))}</h3>${eligHTML(d)}</section>
    <section class="dsec"><dl class="facts">
      <dt>${esc(t("detail.validity"))}</dt><dd>${esc(expiryLong(d))}</dd>
      ${d.regions.length ? `<dt>${esc(t("detail.regions"))}</dt><dd>${esc(regionsLabel(d.regions))}</dd>` : ""}
      ${schools ? `<dt>${esc(t("detail.schools"))}</dt><dd>${esc(schools)}</dd>` : ""}
    </dl></section>
    ${content}
    ${source}
    ${actions}
    <p class="dfine">${esc(t("detail.verify"))}<br>${esc(t("disclaimer"))}</p>`;
}

async function renderDetail(id, { focus = false } = {}) {
  const seq = ++state.detailSeq;
  const cached = state.detail.get(id);
  const base = cached?.deal || state.byId.get(id);
  if (cached) {
    els.detailBody.innerHTML = detailHTML(prepare([cached.deal])[0], { locked: cached.locked });
  } else if (base) {
    els.detailBody.innerHTML = detailHTML(base, { loading: true });
  } else {
    els.detailBody.innerHTML = `<div class="dskel" style="padding-top:20px"><i style="width:30%"></i><i style="width:70%;height:22px"></i><i></i><i style="width:80%"></i></div>`;
  }
  renderDetailHead();
  if (focus) focusDetail();
  if (cached) return;

  const r = await api("GET", `/api/deals/${encodeURIComponent(id)}`);
  if (seq !== state.detailSeq || state.route.id !== id) return;
  if (r.ok && r.data?.deal) {
    const deal = prepare([r.data.deal])[0];
    state.detail.set(id, { deal, locked: !!r.data.locked });
    els.detailBody.innerHTML = detailHTML(deal, { locked: !!r.data.locked });
    setTitle();
  } else if (r.status === 404) {
    els.detailBody.innerHTML = emptyHTML({
      ic: "search-x",
      title: t("detail.notFound"),
      body: t("detail.notFoundHint"),
      action: `<a class="btn btn-outline btn-sm" href="/" data-nav>${esc(t("detail.backToExplore"))}</a>`,
    });
  } else if (base) {
    els.detailBody.innerHTML = detailHTML(base, { error: true });
  } else {
    els.detailBody.innerHTML = emptyHTML({
      ic: "circle-alert",
      title: t("detail.loadFailed"),
      action: `<button class="btn btn-outline btn-sm" type="button" data-retry-detail>${esc(t("retry"))}</button>`,
    });
  }
  renderDetailHead();
  syncStars();
  if (focus) focusDetail();
}

function focusDetail() {
  const target = els.detailBody.querySelector("#detailName") || els.dhead.querySelector("[data-close-detail]");
  target?.focus({ preventScroll: true });
}

function setDetailOpen(open) {
  const was = els.detail.classList.contains("open");
  els.detail.classList.toggle("open", open);
  els.shell.classList.toggle("has-detail", open);
  els.detail.setAttribute("aria-hidden", String(!open));
  els.detail.inert = !open;
  applyInert();
  if (open && !was) els.detailBody.scrollTop = 0;
  if (!open) els.detail.classList.remove("scrolled");
}

/** On a phone the detail covers the list: take the covered chrome out of the tab order. */
function applyInert() {
  const cover = els.detail.classList.contains("open") && isPhone();
  els.main.inert = cover;
  els.appbar.inert = cover;
  document.body.classList.toggle("has-overlay", cover || dialogOpen());
}

function closeDetail() {
  const baseUrl = state.base === "saved" ? "/saved" : "/";
  if (history.state?.inApp) history.back();
  else navigate(baseUrl, { replace: true });
}

async function share() {
  const d = state.detail.get(state.route.id)?.deal || state.byId.get(state.route.id);
  const url = location.origin + location.pathname;
  const title = d ? `${d.name}${d.highlight ? ` · ${d.highlight}` : ""} | CampusPass` : "CampusPass";
  if (navigator.share && isPhone()) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (e) {
      if (e?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(t("toast.linkCopied"));
  } catch {
    toast(t("toast.copyFailed"), { error: true });
  }
}

function openReport({ id = state.route.id, prefill = "" } = {}) {
  const d = state.detail.get(id)?.deal || state.byId.get(id);
  if (!state.user) return openSignin();
  const dlg = openDialog({
    cls: "report",
    labelledBy: "reportTitle",
    html: `<div class="dlg-head"><h2 id="reportTitle">${esc(t("report.title"))}</h2><button class="iconbtn dlg-x" type="button" data-close aria-label="${esc(t("close"))}">${icon("x")}</button></div>
      <p class="dlg-body">${esc(t("report.body", { name: d?.name || "" }))}</p>
      <form id="reportForm" novalidate>
        <label class="fieldlbl" for="reportMsg">${esc(t("report.label"))}</label>
        <textarea class="field" id="reportMsg" maxlength="1000" required placeholder="${esc(t("report.placeholder"))}" autofocus></textarea>
        <div class="counter" aria-hidden="true"><span id="reportN">0</span>/1000</div>
        <div class="dlg-actions"><button class="btn btn-ghost" type="button" data-close>${esc(t("cancel"))}</button>
        <button class="btn btn-primary" type="submit" disabled>${esc(t("report.submit"))}</button></div>
      </form>`,
  });
  const ta = dlg.querySelector("textarea");
  const submit = dlg.querySelector('[type="submit"]');
  const sync = () => {
    dlg.querySelector("#reportN").textContent = ta.value.length;
    submit.disabled = !ta.value.trim();
  };
  ta.addEventListener("input", sync);
  if (prefill) {
    // From 「店家不接受」: start the report for them, cursor at the end to add details.
    ta.value = `${prefill}\n`;
    sync();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  dlg.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = ta.value.trim();
    if (!message) return;
    submit.disabled = true;
    submit.textContent = t("report.sending");
    const r = await api("POST", `/api/deals/${encodeURIComponent(id)}/report`, { message });
    if (r.ok) {
      closeDialog();
      toast(t("toast.reportSent"));
    } else if (r.status === 401) {
      closeDialog({ instant: true });
      state.user = null;
      renderAccountChrome();
      toast(t("toast.sessionExpired"), { error: true });
    } else {
      submit.disabled = false;
      submit.textContent = t("report.submit");
      toast(t("toast.reportFailed"), { error: true });
    }
  });
}

/** A 401 in the middle of something: back to signed-out, and say so. */
function dropSession() {
  state.user = null;
  state.favs = new Set();
  state.favOrder = [];
  renderAccountChrome();
  syncStars();
  renderUseBar();
  toast(t("toast.sessionExpired"), { error: true });
}

/* ---------- in-store pass ----------
   CampusPass is not in the sale, so redemption is recorded as evidence in tiers
   (src/index.ts): opening the pass is intent, the student's answer afterwards is a
   self-report, and a shop confirming the code (QR scan or typed) is the only verified tier.
   The pass proves it is live with a ticking Taipei clock, a countdown and a moving shimmer,
   so a screenshot is easy to tell apart. */

const PASS_POLL_MS = 4000;
const ASKED_KEY = "cp_outcome_asked"; // codes already asked 「優惠有用成功嗎？」 (ask once)
const TPE_TIME = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const TPE_HM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

let pass = null; // the open pass: { code, dealId, deal, expiresAt, skew, confirmedAt, outcome, expired, dlg, tick, poll, qr }
let wakeLock = null;

/** SQLite's datetime('now') is UTC "YYYY-MM-DD HH:MM:SS". */
const utcMs = (s) => Date.parse(`${String(s).replace(" ", "T")}Z`);
/** T97C5B → "T97C 5B": easier to read out and to type. */
const groupCode = (c) => `${c.slice(0, 4)} ${c.slice(4)}`;
const normCode = (v) => String(v).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
const nowMs = () => Date.now() + (pass?.skew || 0);

/** s***@ntu.edu.tw: enough for the cashier to see a school address, nothing more. */
function maskEmail(email) {
  const [user, domain] = String(email || "").split("@");
  return domain ? `${user.charAt(0)}***@${domain}` : "";
}

const askedList = () => (storage.get(ASKED_KEY) || "").split(",").filter(Boolean);
const wasAsked = (code) => askedList().includes(code);
const markAsked = (code) => storage.set(ASKED_KEY, [code, ...askedList().filter((c) => c !== code)].slice(0, 30).join(","));

async function openPass(btn) {
  const id = state.route.id;
  const c = state.detail.get(id);
  if (!state.user) return openSignin();
  if (!c || c.locked || isExpired(c.deal) || btn.disabled) return;
  const label = btn.querySelector("span");
  btn.disabled = true;
  label.textContent = t("use.opening");
  const r = await api("POST", `/api/deals/${encodeURIComponent(id)}/redeem`);
  btn.disabled = false;
  label.textContent = t("use.cta");
  if (r.status === 401) return dropSession();
  if (!r.ok || !r.data?.code) return toast(t("use.failed"), { error: true });
  if (state.route.name !== "deal" || state.route.id !== id) return; // navigated away meanwhile

  pass = { dealId: id, deal: c.deal };
  setPassData(r.data, r.date);
  // A history entry of its own, so Back (and Android's back gesture) closes the pass.
  history.pushState({ ...(history.state || {}), pass: pass.code }, "", location.pathname + location.search);
  pass.dlg = openDialog({ cls: "pass", labelledBy: "passTitle", html: passHTML(), onClose: onPassClosed });
  drawPass();
  startPassTimers();
  keepAwake(true);
}

function setPassData(data, date) {
  const server = date ? Date.parse(date) : NaN;
  // Trust the server clock only when it clearly differs: the Date header has 1s resolution.
  const skew = Number.isFinite(server) && Math.abs(server - Date.now()) > 3000 ? server - Date.now() : 0;
  Object.assign(pass, {
    code: data.code,
    skew,
    expiresAt: utcMs(data.created_at) + (data.valid_minutes || 15) * 60e3,
    confirmedAt: null,
    outcome: null,
    expired: false,
    askInline: false,
  });
}

function passHTML() {
  const d = pass.deal;
  return `<div class="pass-live" aria-hidden="true"><i></i></div>
    <button class="iconbtn dlg-x" type="button" data-close aria-label="${esc(t("pass.close"))}">${icon("x")}</button>
    <div class="pass-head">
      <p class="pass-eyebrow">${MARK}<span>${esc(t("pass.title"))}</span></p>
      <h2 id="passTitle" class="pass-name">${esc(d.name)}</h2>
      ${d.highlight ? `<span class="badge">${esc(d.highlight)}</span>` : ""}
    </div>
    <div class="pass-stage" id="passStage"></div>
    <div class="pass-code"><span>${esc(t("pass.code"))}</span><b id="passCode" translate="no"></b></div>
    <dl class="pass-meta">
      <div><dt>${esc(t("pass.now"))}</dt><dd class="num" id="passClock"></dd></div>
      <div><dt>${esc(t("pass.left"))}</dt><dd class="num" id="passLeft"></dd></div>
    </dl>
    <p class="pass-who">${esc(maskEmail(state.user?.email))}</p>
    <p class="pass-instr">${esc(t("pass.instr"))}</p>`;
}

function askButtonsHTML(code, dealId) {
  return `<div class="askbtns" data-ask="${esc(code)}" data-deal="${esc(dealId)}">
    <button class="btn btn-outline" type="button" data-outcome="used">${icon("circle-check")}${esc(t("ask.used"))}</button>
    <button class="btn btn-outline" type="button" data-outcome="refused">${icon("circle-alert")}${esc(t("ask.refused"))}</button>
    <button class="btn btn-ghost" type="button" data-outcome="not_used">${esc(t("ask.notUsed"))}</button></div>`;
}

/** The part of the pass that changes with its state: live QR · confirmed ✓ · expired. */
function drawPass() {
  const p = pass;
  if (!p?.dlg) return;
  const stage = p.dlg.querySelector("#passStage");
  p.dlg.classList.toggle("is-confirmed", !!p.confirmedAt);
  p.dlg.classList.toggle("is-expired", p.expired && !p.confirmedAt);
  p.dlg.querySelector("#passCode").textContent = groupCode(p.code);
  if (p.confirmedAt) {
    stage.innerHTML = `<div class="pass-done" role="status"><span class="okmark">${icon("check")}</span><b>${esc(t("pass.confirmed"))}</b>
      <span class="when num">${esc(t("pass.confirmedAt", { t: TPE_HM.format(p.confirmedAt) }))}</span></div>`;
  } else if (p.expired) {
    const ask = p.askInline && !p.outcome ? `<div class="pass-ask"><b>${esc(t("ask.title"))}</b>${askButtonsHTML(p.code, p.dealId)}</div>` : "";
    stage.innerHTML = `<div class="pass-expired"><span class="eic">${icon("clock")}</span><b>${esc(t("pass.expired"))}</b>
      <p>${esc(t("pass.expiredBody"))}</p>${ask}
      <button class="btn btn-primary" type="button" data-pass-renew>${icon("refresh-cw")}${esc(t("pass.renew"))}</button></div>`;
  } else {
    const ready = p.qrFor === p.code;
    stage.innerHTML = `<div class="pass-qr${ready ? "" : " wait"}" id="passQr">${ready ? p.qr : ""}</div>
      <p class="pass-state"><i aria-hidden="true"></i>${esc(t("pass.live"))}</p>`;
    if (!ready) renderPassQR(p.code);
  }
}

async function renderPassQR(code) {
  let svg = "";
  try {
    svg = await qrSVG(`${location.origin}/r/${code}`, { label: t("pass.qr", { code: groupCode(code) }) });
  } catch {}
  if (!pass || pass.code !== code) return;
  const box = pass.dlg.querySelector("#passQr");
  if (svg) {
    pass.qr = svg;
    pass.qrFor = code;
    if (box) {
      box.classList.remove("wait");
      box.innerHTML = svg;
    }
  } else if (box) {
    box.className = "pass-qr failed";
    box.innerHTML = `<p>${esc(t("pass.qrFailed"))}</p>`;
  }
}

/** Every second: the Taipei clock, the countdown, and expiry when it reaches zero. */
function tickPass() {
  const p = pass;
  if (!p?.dlg) return;
  const now = nowMs();
  const s = Math.ceil(Math.max(0, p.expiresAt - now) / 1000);
  p.dlg.querySelector("#passClock").textContent = TPE_TIME.format(now);
  const left = p.dlg.querySelector("#passLeft");
  left.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  left.classList.toggle("low", s <= 60 && !p.confirmedAt);
  if (!s && !p.expired) {
    p.expired = true;
    // Ask 「優惠有用成功嗎？」 right here, once, unless the shop already confirmed it.
    if (!p.confirmedAt && !p.outcome && !wasAsked(p.code)) {
      p.askInline = true;
      markAsked(p.code);
    }
    drawPass();
  }
}

/** Has the shop confirmed? Only while the pass is open and the page is visible. */
async function pollPass() {
  const p = pass;
  if (!p || document.hidden || p.polling || p.confirmedAt) return;
  const code = p.code;
  p.polling = true;
  const r = await api("GET", `/api/redemptions/${encodeURIComponent(code)}`);
  p.polling = false;
  if (pass !== p || p.code !== code || !r.ok || !r.data) return;
  if (r.data.outcome) p.outcome = r.data.outcome;
  if (r.data.confirmed_at) {
    p.confirmedAt = utcMs(r.data.confirmed_at);
    clearInterval(p.poll);
    p.poll = 0;
    drawPass();
    tickPass();
    try {
      navigator.vibrate?.(40);
    } catch {}
  }
}

function startPassTimers() {
  stopPassTimers();
  const p = pass;
  const tick = () => {
    if (pass !== p) return;
    tickPass();
    p.tick = setTimeout(tick, 1000 - (Date.now() % 1000) + 5); // on the second, like a watch
  };
  tick();
  pollPass();
  p.poll = setInterval(pollPass, PASS_POLL_MS);
}

function stopPassTimers() {
  if (!pass) return;
  clearTimeout(pass.tick);
  clearInterval(pass.poll);
  pass.poll = 0;
}

/** Keep the screen on while the pass is shown (the cashier may take a while). */
async function keepAwake(on) {
  try {
    if (on && !wakeLock && "wakeLock" in navigator && document.visibilityState === "visible") {
      const lock = await navigator.wakeLock.request("screen");
      if (!pass) return void lock.release();
      wakeLock = lock;
      lock.addEventListener("release", () => wakeLock === lock && (wakeLock = null));
    } else if (!on && wakeLock) {
      const lock = wakeLock;
      wakeLock = null;
      await lock.release();
    }
  } catch {
    /* not allowed (battery saver, iframe, old browser): the pass still works */
  }
}

function onPassVisibility() {
  if (!pass) return;
  if (document.hidden) {
    clearInterval(pass.poll); // no polling from a pocket
    pass.poll = 0;
  } else {
    if (!pass.poll && !pass.confirmedAt) {
      pollPass();
      pass.poll = setInterval(pollPass, PASS_POLL_MS);
    }
    keepAwake(true); // the browser drops the lock whenever the page is hidden
  }
}

async function renewPass(btn) {
  const p = pass;
  btn.disabled = true;
  const r = await api("POST", `/api/deals/${encodeURIComponent(p.dealId)}/redeem`);
  if (pass !== p) return;
  if (!r.ok || !r.data?.code) {
    btn.disabled = false;
    if (r.status === 401) {
      closeDialog();
      return dropSession();
    }
    return toast(t("use.failed"), { error: true });
  }
  setPassData(r.data, r.date);
  history.replaceState({ ...(history.state || {}), pass: p.code }, "");
  drawPass();
  startPassTimers();
  keepAwake(true);
}

/** The pass closed (✕, Esc, Back): stop everything, then ask once how it went. */
function onPassClosed() {
  const p = pass;
  if (!p) return;
  stopPassTimers();
  pass = null;
  keepAwake(false);
  // Closed with ✕ or Esc: drop the pass's history entry too (Back already has).
  if (history.state?.pass) history.back();
  if (p.confirmedAt || p.outcome || wasAsked(p.code)) return;
  markAsked(p.code);
  // After the close animation, and never over a dialog the reader opened since.
  setTimeout(() => !dialogOpen() && askOutcome(p.code, p.dealId), 340);
}

function askOutcome(code, dealId) {
  openDialog({
    cls: "ask",
    labelledBy: "askTitle",
    html: `<div class="dlg-head"><h2 id="askTitle">${esc(t("ask.title"))}</h2><button class="iconbtn dlg-x" type="button" data-close aria-label="${esc(t("close"))}">${icon("x")}</button></div>
      <p class="dlg-body">${esc(t("ask.body"))}</p>${askButtonsHTML(code, dealId)}`,
  });
}

async function answerOutcome(btn) {
  const box = btn.closest("[data-ask]");
  const { ask: code, deal: dealId } = box.dataset;
  const outcome = btn.dataset.outcome;
  const btns = [...box.querySelectorAll("button")];
  for (const b of btns) b.disabled = true;
  const r = await api("POST", `/api/redemptions/${encodeURIComponent(code)}/outcome`, { outcome });
  if (!r.ok) {
    for (const b of btns) b.disabled = false;
    if (r.status === 401) {
      closeDialog();
      return dropSession();
    }
    return toast(t("ask.failed"), { error: true });
  }
  if (pass?.code === code) pass.outcome = outcome;
  toast(t("ask.thanks"));
  if (outcome === "refused") {
    // Offer the report, already started: a refusal is exactly what the report is for.
    closeDialog({ instant: true, restoreFocus: false });
    openReport({ id: dealId, prefill: t("ask.refusedReport", { d: `${fmtDate(todayTW())} ${TPE_HM.format(Date.now())}` }) });
  } else if (box.closest("dialog.pass")) {
    box.closest(".pass-ask").innerHTML = `<p class="ask-done">${icon("check")}${esc(t("ask.thanks"))}</p>`;
  } else closeDialog();
}

/* ---------- shop pages: /m/:key and /r/:code ----------
   Shops need no app and no Google account: opening /m/<key> once pairs the counter phone
   (an HttpOnly cookie set by the API), after which the phone's own camera opens /r/<code>
   from a pass QR and one tap confirms it. */

const shop = { key: null, status: "idle", data: null, result: null, code: "" };
const scan = { code: null, status: "idle", data: null, at: 0 };
const PASS_ERRORS = ["invalid_code", "already_confirmed", "expired_code", "not_merchant"];

/** The wordmark on the shop pages' desktop layout (a phone shows it in the app bar). */
const minibrand = () => `<a class="minibrand" href="/" data-nav aria-label="${esc(t("home"))}">${MARK}<span class="wordmark">campuspass</span></a>`;
const loadingCard = () => `<section class="card"><div class="dskel"><i style="width:30%"></i><i style="width:60%;height:22px"></i><i></i><i style="width:80%"></i></div></section>`;

async function loadShop(key) {
  Object.assign(shop, { key, status: "loading", data: null, result: null, code: "" });
  renderShop();
  const r = await api("GET", `/api/merchant/${encodeURIComponent(key)}`);
  if (shop.key !== key) return;
  shop.status = r.ok && r.data?.label ? "ready" : r.status === 404 ? "invalid" : "error";
  shop.data = r.data;
  if (state.route.name === "shop") {
    renderShop();
    setTitle();
  }
}

function shopCountHTML() {
  const n = shop.data?.confirmed_30d ?? 0;
  return esc(t("shop.count", { n: "\u0001" })).replace("\u0001", `<b class="num">${esc(n)}</b>`);
}

function shopResultHTML() {
  const res = shop.result;
  if (!res) return "";
  if (res.ok)
    return `<div class="result ok">${icon("circle-check")}<div><b>${esc(t("shop.ok"))}</b><span>${esc(
      [res.deal, TPE_HM.format(res.at), t("scan.codeLine", { code: groupCode(res.code) })].filter(Boolean).join(" · ")
    )}</span></div></div>`;
  return `<div class="result err">${icon("circle-alert")}<div><b>${esc(t(res.key))}</b>${res.deal ? `<span>${esc(res.deal)}</span>` : ""}</div></div>`;
}

function renderShop() {
  const b = els.shopBody;
  if (shop.status === "loading" || shop.status === "idle") {
    b.innerHTML = `${minibrand()}${loadingCard()}`;
    return;
  }
  if (shop.status !== "ready") {
    const invalid = shop.status === "invalid";
    b.innerHTML = `${minibrand()}<section class="card">${emptyHTML({
      ic: invalid ? "store" : "circle-alert",
      title: t(invalid ? "shop.invalidTitle" : "shop.loadFailed"),
      body: invalid ? t("shop.invalidBody") : "",
      action: invalid
        ? `<a class="btn btn-outline btn-sm" href="/merchants" data-nav>${esc(t("scan.forMerchants"))}</a>`
        : `<button class="btn btn-outline btn-sm" type="button" data-retry-shop>${esc(t("retry"))}</button>`,
    })}</section>`;
    return;
  }
  const d = shop.data;
  const deals = (Array.isArray(d.deals) ? d.deals : [])
    .map(
      (x) => `<li><b>${esc(x.name)}</b>${x.subtitle ? `<span>${esc(x.subtitle)}</span>` : ""}${x.highlight ? `<span class="badge">${esc(x.highlight)}</span>` : ""}</li>`
    )
    .join("");
  b.innerHTML = `${minibrand()}
    <header class="minihead">
      <p class="eyebrow">${icon("store")}<span>${esc(t("shop.eyebrow"))}</span></p>
      <h1 class="pagetitle" id="shopTitle">${esc(d.label)}</h1>
      <p class="shopcount" id="shopCount">${shopCountHTML()}</p>
    </header>
    <section class="card confirmcard" aria-labelledby="shopCodeLbl">
      <form id="shopForm" novalidate>
        <label class="fieldlbl" id="shopCodeLbl" for="shopCode">${esc(t("shop.codeLabel"))}</label>
        <div class="coderow">
          <input class="field codefield" id="shopCode" name="code" type="text" inputmode="text" autocomplete="off" autocapitalize="characters"
            autocorrect="off" spellcheck="false" maxlength="8" enterkeyhint="done" aria-describedby="shopCodeHint" value="${esc(shop.code)}">
          <button class="btn btn-primary btn-lg" type="submit">${esc(t("shop.confirm"))}</button>
        </div>
        <p class="fieldhint" id="shopCodeHint">${esc(t("shop.codeHint"))}</p>
      </form>
      <div id="shopResult" role="status" aria-live="polite">${shopResultHTML()}</div>
    </section>
    ${deals ? `<section class="card"><h2>${esc(t("shop.deals"))}</h2><ul class="shopdeals">${deals}</ul></section>` : ""}
    <section class="card"><h2>${esc(t("shop.howTitle"))}</h2>
      <div class="howrow">${icon("scan-line")}<p>${esc(t("shop.how"))}</p></div>
      <p class="fine paired">${icon("shield-check")}<span>${esc(t("shop.paired"))} ${esc(t("shop.private"))}</span></p>
    </section>`;
  const form = b.querySelector("#shopForm");
  const input = form.querySelector("#shopCode");
  input.addEventListener("input", () => {
    // Auto-uppercase, drop spaces and dashes (a code read out as 「T97C 5B」 still works).
    const v = normCode(input.value);
    if (v !== input.value) input.value = v;
    shop.code = v;
    if (shop.result && !shop.result.ok) {
      shop.result = null;
      b.querySelector("#shopResult").innerHTML = "";
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitShop(form);
  });
}

async function submitShop(form) {
  const input = form.querySelector("#shopCode");
  const btn = form.querySelector('[type="submit"]');
  const code = normCode(input.value);
  const show = () => (els.shopBody.querySelector("#shopResult").innerHTML = shopResultHTML());
  if (code.length !== 6) {
    shop.result = { ok: false, key: "shop.codeShort" };
    show();
    input.focus();
    return;
  }
  btn.disabled = true;
  btn.textContent = t("shop.confirming");
  const r = await api("POST", `/api/merchant/${encodeURIComponent(shop.key)}/confirm`, { code });
  btn.disabled = false;
  btn.textContent = t("shop.confirm");
  if (r.ok) {
    shop.result = { ok: true, deal: r.data?.deal || "", code, at: Date.now() };
    shop.data.confirmed_30d = (shop.data.confirmed_30d || 0) + 1;
    els.shopBody.querySelector("#shopCount").innerHTML = shopCountHTML();
    shop.code = "";
    input.value = "";
  } else {
    const err = r.data?.error;
    shop.result = { ok: false, key: r.status === 0 ? "err.network" : PASS_ERRORS.includes(err) ? `err.${err}` : "err.generic", deal: r.data?.deal || "" };
  }
  show();
  input.focus({ preventScroll: true });
}

async function loadScan(code) {
  Object.assign(scan, { code, status: "loading", data: null, at: 0 });
  renderScan();
  const r = await api("GET", `/api/merchant/pass/${encodeURIComponent(code)}`);
  if (scan.code !== code) return;
  scan.data = r.data;
  if (r.status === 403) scan.status = "not_merchant";
  else if (r.status === 404) scan.status = "invalid_code";
  else if (r.ok && ["ok", "already_confirmed", "expired_code"].includes(r.data?.status)) scan.status = r.data.status;
  else scan.status = "error";
  if (state.route.name === "scan") renderScan();
}

function scanStateHTML(ic, title, body, tone = "") {
  return `<div class="scanstate ${tone}"><span class="bigic">${icon(ic)}</span><h1 class="pagetitle" id="scanTitle" tabindex="-1">${esc(title)}</h1>${
    body ? `<p>${esc(body)}</p>` : ""
  }</div>`;
}

function renderScan() {
  const b = els.scanBody;
  const s = scan.status;
  const d = scan.data || {};
  if (s === "loading" || s === "idle") {
    b.innerHTML = `${minibrand()}${loadingCard()}`;
    return;
  }
  if (s === "not_merchant") {
    // Anyone may scan a pass QR. Explain what it is; never show anything about the student.
    b.innerHTML = `${minibrand()}<section class="card scancard">
      ${scanStateHTML("qr-code", t("scan.passTitle"), t("scan.notMerchant"))}
      <p class="scanhint">${esc(t("scan.notMerchantHint"))}</p>
      <div class="scanactions"><a class="btn btn-outline" href="/merchants" data-nav>${icon("store")}${esc(t("scan.forMerchants"))}</a>
        <a class="btn btn-ghost" href="/" data-nav>${icon("compass")}${esc(t("scan.explore"))}</a></div></section>`;
    return;
  }
  if (s === "error") {
    b.innerHTML = `${minibrand()}<section class="card">${emptyHTML({
      ic: "circle-alert",
      title: t("err.network"),
      action: `<button class="btn btn-outline btn-sm" type="button" data-retry-scan>${esc(t("retry"))}</button>`,
    })}</section>`;
    return;
  }
  const shopLine = d.shop ? `<p class="eyebrow">${icon("store")}<span>${esc(d.shop)}</span></p>` : "";
  const codeLine = `<p class="scancode" translate="no">${esc(t("scan.codeLine", { code: groupCode(scan.code) }))}</p>`;
  let inner;
  if (s === "ok")
    inner = `<div class="scanstate"><span class="bigic">${icon("ticket")}</span><h1 class="pagetitle" id="scanTitle" tabindex="-1">${esc(d.deal || "")}</h1></div>
      ${codeLine}<p class="scanhint">${esc(t("scan.checkHint"))}</p>
      <button class="btn btn-cta btn-block" type="button" data-scan-confirm>${icon("check")}<span>${esc(t("scan.confirm"))}</span></button>`;
  else if (s === "done")
    inner = `<div class="scanstate ok" role="status"><span class="okmark big">${icon("check")}</span><h1 class="pagetitle" id="scanTitle" tabindex="-1">${esc(
      t("scan.done")
    )}</h1><p><b>${esc(d.deal || "")}</b></p><p class="num">${esc(t("scan.doneAt", { t: TPE_HM.format(scan.at) }))}</p></div>${codeLine}`;
  else if (s === "already_confirmed") inner = scanStateHTML("circle-check", t("scan.already"), t("scan.alreadyBody"), "muted") + codeLine;
  else if (s === "expired_code") inner = scanStateHTML("clock", t("scan.expired"), t("scan.expiredBody"), "muted") + codeLine;
  else inner = scanStateHTML("search-x", t("scan.invalid"), t("scan.invalidBody"), "muted") + codeLine;
  b.innerHTML = `${minibrand()}<section class="card scancard">${shopLine}${inner}</section>`;
}

async function confirmScan(btn) {
  btn.disabled = true;
  btn.querySelector("span").textContent = t("scan.confirming");
  const r = await api("POST", "/api/merchant/confirm", { code: scan.code });
  if (r.ok) {
    scan.status = "done";
    scan.at = Date.now();
    scan.data = { ...scan.data, deal: r.data?.deal || scan.data?.deal };
  } else if (PASS_ERRORS.includes(r.data?.error)) {
    scan.status = r.data.error;
  } else {
    btn.disabled = false;
    btn.querySelector("span").textContent = t("scan.confirm");
    return toast(t(r.status === 0 ? "err.network" : "err.generic"), { error: true });
  }
  renderScan();
  els.scanBody.querySelector("#scanTitle")?.focus({ preventScroll: true });
}

/* ---------- /merchants: pitch + lead form ---------- */

const LEAD_FIELDS = ["shop_name", "contact_name", "email", "phone", "area", "offer", "budget", "message"];
const INTERESTS = ["list_free", "featured_paid", "exclusive_deal", "unsure"];
let leadDone = false;

function leadField({ name, label, type = "text", req = null, ph = "", auto = "off", mode = "", area = false, max = 200 }) {
  const id = `lead_${name}`;
  const tag = req === null ? "" : `<span class="req">${esc(t(req ? "lead.required" : "lead.optional"))}</span>`;
  const attrs = `class="field" id="${id}" name="${name}" maxlength="${max}" autocomplete="${auto}"${ph ? ` placeholder="${esc(ph)}"` : ""}${
    req ? " required" : ""
  } aria-describedby="${id}_err"`;
  const input = area ? `<textarea ${attrs} rows="3"></textarea>` : `<input ${attrs} type="${type}"${mode ? ` inputmode="${mode}"` : ""}>`;
  return `<div class="fld"><label class="fieldlbl" for="${id}">${esc(label)}${tag}</label>${input}<p class="fielderr" id="${id}_err" hidden></p></div>`;
}

function renderMerchants() {
  // Keep what was typed across a re-render (the language can change from the account menu).
  const form = els.merchantsBody.querySelector("#leadForm");
  const kept = form ? Object.fromEntries(new FormData(form)) : {};
  const pitch = [
    ["file-text", "p1"],
    ["star", "p2"],
    ["scan-line", "p3"],
  ]
    .map(([ic, k]) => `<li><span class="pic">${icon(ic)}</span><div><b>${esc(t(`merchants.${k}t`))}</b><p>${esc(t(`merchants.${k}`))}</p></div></li>`)
    .join("");
  const head = `<section class="card"><p class="pitchlede">${esc(t("merchants.lede"))}</p><ul class="pitch">${pitch}</ul></section>`;
  if (leadDone) {
    els.merchantsBody.innerHTML = `${head}<section class="card leaddone" role="status">${emptyHTML({
      ic: "circle-check",
      title: t("lead.doneTitle"),
      body: t("lead.doneBody"),
      action: `<div class="scanactions"><button class="btn btn-outline btn-sm" type="button" data-lead-again>${esc(t("lead.again"))}</button>
        <a class="btn btn-ghost btn-sm" href="/" data-nav>${icon("compass")}${esc(t("scan.explore"))}</a></div>`,
    })}</section>`;
    return;
  }
  const radios = INTERESTS.map(
    (v) => `<label class="radio"><input type="radio" name="interest" value="${v}"><span>${esc(t(`lead.i.${v}`))}</span></label>`
  ).join("");
  els.merchantsBody.innerHTML = `${head}
    <section class="card leadcard" aria-labelledby="leadTitle"><h2 id="leadTitle" class="cardtitle">${esc(t("lead.title"))}</h2>
      <p>${esc(t("lead.body"))}</p>
      <form id="leadForm" novalidate>
        ${leadField({ name: "shop_name", label: t("lead.shop"), req: true, auto: "organization" })}
        ${leadField({ name: "contact_name", label: t("lead.contact"), req: false, auto: "name" })}
        <div class="fldpair" role="group" aria-describedby="leadContactHint">
          ${leadField({ name: "email", label: t("lead.email"), type: "email", auto: "email", mode: "email" })}
          ${leadField({ name: "phone", label: t("lead.phone"), type: "tel", auto: "tel", mode: "tel", max: 40 })}
        </div>
        <p class="fieldhint" id="leadContactHint">${esc(t("lead.contactHint"))}</p>
        ${leadField({ name: "area", label: t("lead.area"), req: false, ph: t("lead.areaPh"), max: 80 })}
        ${leadField({ name: "offer", label: t("lead.offer"), req: false, ph: t("lead.offerPh"), area: true, max: 500 })}
        <fieldset class="fld radios"><legend class="fieldlbl">${esc(t("lead.interest"))}</legend>${radios}</fieldset>
        ${leadField({ name: "budget", label: t("lead.budget"), req: false, max: 80 })}
        ${leadField({ name: "message", label: t("lead.message"), req: false, area: true, max: 1000 })}
        <div class="hp" aria-hidden="true"><label for="lead_website">${esc(t("lead.website"))}</label>
          <input id="lead_website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <p class="formerr" id="leadErr" role="alert"></p>
        <button class="btn btn-primary btn-lg btn-block" type="submit">${esc(t("lead.submit"))}</button>
        <p class="fine">${esc(t("lead.privacy"))}</p>
      </form>
    </section>`;
  const f = els.merchantsBody.querySelector("#leadForm");
  for (const [k, v] of Object.entries(kept)) {
    if (k === "interest") {
      const r = f.querySelector(`input[name="interest"][value="${CSS.escape(v)}"]`);
      if (r) r.checked = true;
    } else if (f.elements[k]) f.elements[k].value = v;
  }
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    submitLead(f);
  });
  f.addEventListener("input", (e) => {
    const fld = e.target.closest(".fld");
    if (fld) setFieldError(f, e.target.name, "");
    if (e.target.name === "email" || e.target.name === "phone") {
      setFieldError(f, "email", "");
      setFieldError(f, "phone", "");
    }
  });
}

function setFieldError(form, name, msg) {
  const el = form.elements[name];
  const err = form.querySelector(`#lead_${name}_err`);
  if (!el || !err) return;
  el.setAttribute("aria-invalid", String(!!msg));
  err.textContent = msg;
  err.hidden = !msg;
}

async function submitLead(form) {
  const v = Object.fromEntries(new FormData(form));
  for (const k of LEAD_FIELDS) v[k] = String(v[k] || "").trim();
  const errs = {};
  if (!v.shop_name) errs.shop_name = t("lead.errShop");
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errs.email = t("lead.errEmail");
  else if (!v.email && !v.phone) errs.email = t("lead.errContact");
  for (const k of ["shop_name", "email", "phone"]) setFieldError(form, k, errs[k] || "");
  const errBox = form.querySelector("#leadErr");
  errBox.textContent = "";
  const first = Object.keys(errs)[0];
  if (first) {
    form.elements[first].focus();
    return;
  }
  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  btn.textContent = t("lead.sending");
  const r = await api("POST", "/api/merchant-leads", { ...v, interest: v.interest || "", website: v.website || "" });
  btn.disabled = false;
  btn.textContent = t("lead.submit");
  if (r.ok) {
    leadDone = true;
    renderMerchants();
    const done = els.merchantsBody.querySelector(".leaddone");
    done?.scrollIntoView({ block: "center" });
    done?.querySelector("b")?.setAttribute("tabindex", "-1");
    done?.querySelector("b")?.focus({ preventScroll: true });
  } else if (r.data?.error === "shop_and_contact_required") {
    setFieldError(form, v.shop_name ? "email" : "shop_name", t(v.shop_name ? "lead.errContact" : "lead.errShop"));
  } else errBox.textContent = t("lead.failed");
}

/* ---------- router ---------- */

function parse(path) {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return { name: "explore" };
  if (p === "/saved") return { name: "saved" };
  if (p === "/me") return { name: "me" };
  if (p === "/merchants") return { name: "merchants" };
  let m = p.match(/^\/deal\/([A-Za-z0-9_-]{1,64})$/);
  if (m) return { name: "deal", id: m[1] };
  m = p.match(/^\/m\/([A-Za-z0-9_-]{8,64})$/);
  if (m) return { name: "shop", key: m[1] };
  m = p.match(/^\/r\/([A-Za-z0-9]{4,12})$/);
  if (m) return { name: "scan", code: m[1].toUpperCase() };
  return null;
}

function navigate(path, { replace = false, state: st = {} } = {}) {
  if (!replace && path === location.pathname + location.search) return route();
  history[replace ? "replaceState" : "pushState"](st, "", path);
  route();
}

let currentView = null;

function showView(name) {
  if (currentView && currentView !== name) scrollPos[currentView] = scrollY;
  const changed = currentView !== name;
  currentView = name;
  for (const v of VIEWS) $(`view-${v}`).hidden = v !== name;
  document.body.dataset.route = name;
  // Shop pages: no tabs or account chrome, and kept out of search engines (the URL is a key).
  const minimal = MINIMAL.has(name);
  document.documentElement.classList.toggle("chrome-min", minimal);
  setNoIndex(minimal);
  for (const a of document.querySelectorAll("[data-tab]")) {
    if (a.dataset.tab === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  els.appbarTitle.textContent = name === "saved" ? t("saved.title") : name === "me" ? t("me.title") : name === "merchants" ? t("merchants.title") : "";
  els.appbarBack.hidden = name !== "merchants";
  if (name === "saved") renderSaved();
  if (name === "me") renderMe();
  if (name === "merchants") renderMerchants();
  if (name === "shop") renderShop();
  if (name === "scan") renderScan();
  if (changed) {
    scrollTo(0, scrollPos[name] || 0);
    onScroll();
  }
}

function setNoIndex(on) {
  let m = document.querySelector('meta[name="robots"]');
  if (on && !m) {
    m = Object.assign(document.createElement("meta"), { name: "robots", content: "noindex, nofollow" });
    document.head.append(m);
  } else if (!on && m) m.remove();
}

function setManifest(href) {
  const link = document.querySelector('link[rel="manifest"]');
  if (link && link.getAttribute("href") !== href) link.setAttribute("href", href);
}

function route() {
  // The pass has a history entry of its own: Back closes it and changes nothing else.
  if (pass && !history.state?.pass) closeDialog();
  else if (!pass && history.state?.pass) {
    const { pass: _stale, ...rest } = history.state; // Forward onto a closed pass: drop it
    history.replaceState(rest, "");
  }
  let r = parse(location.pathname);
  if (!r) {
    history.replaceState(null, "", "/");
    r = { name: "explore" };
  }
  const prev = state.route;
  state.route = r;
  // A shop page offers its own manifest, so "Add to Home Screen" there opens the shop page.
  setManifest(r.name === "shop" ? `/api/merchant/${encodeURIComponent(r.key)}/manifest.webmanifest` : "/manifest.webmanifest");
  if (r.name === "deal") {
    // The list under the detail: the one it was opened from (kept in history.state, so Back and
    // Forward restore it), else the tab we're on; a cold deep link sits on Explore.
    if (history.state?.base) state.base = history.state.base === "saved" ? "saved" : "explore";
    else if (prev.name === "saved" || prev.name === "explore") state.base = prev.name;
    else if (prev.name !== "deal") state.base = "explore";
    showView(state.base);
    const opening = !els.detail.classList.contains("open") || prev.id !== r.id;
    setDetailOpen(true);
    if (opening) renderDetail(r.id, { focus: prev.name !== "deal" || prev.id !== r.id });
    setTitle();
  } else {
    const wasDetail = els.detail.classList.contains("open");
    state.base = r.name;
    if (r.name === "shop" && (shop.key !== r.key || shop.status === "error")) loadShop(r.key);
    if (r.name === "scan" && (scan.code !== r.code || prev.name !== "scan")) loadScan(r.code);
    setDetailOpen(false);
    showView(r.name);
    setTitle();
    if (wasDetail && prev.id) {
      // Back from a detail: return focus to the row that opened it.
      const row = document.querySelector(`.view:not([hidden]) .item[data-id="${CSS.escape(prev.id)}"] .pick`);
      row?.focus({ preventScroll: true });
    }
  }
  markSelected();
}

function setTitle() {
  const r = state.route;
  if (r.name === "deal") {
    const d = state.detail.get(r.id)?.deal || state.byId.get(r.id);
    document.title = `${d?.name || t("detail.label")} · CampusPass`;
  } else if (r.name === "explore") document.title = getLang() === "en" ? "CampusPass — campus deals" : "CampusPass 校園優惠";
  else if (r.name === "shop") document.title = `${shop.data?.label ? `${shop.data.label} · ` : ""}${t("shop.title")} · CampusPass`;
  else {
    const key = { saved: "saved.title", me: "me.title", merchants: "merchants.title", scan: "scan.title" }[r.name];
    document.title = `${t(key)} · CampusPass`;
  }
}

/* ---------- theme & language ---------- */

function currentTheme() {
  const v = document.documentElement.getAttribute("data-theme");
  return v === "light" || v === "dark" ? v : "system";
}

function setTheme(v) {
  const root = document.documentElement;
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  if (v === "light" || v === "dark") {
    root.setAttribute("data-theme", v);
    storage.set(THEME_KEY, v);
    for (const m of metas) m.setAttribute("content", v === "dark" ? "#202026" : "#FFFFFF");
  } else {
    root.removeAttribute("data-theme");
    storage.set(THEME_KEY, null);
    for (const m of metas) m.setAttribute("content", /dark/.test(m.media) ? "#202026" : "#FFFFFF");
  }
  for (const b of document.querySelectorAll("[data-theme]:is(button)")) {
    const on = b.dataset.theme === currentTheme();
    b.setAttribute("aria-checked", String(on));
    b.tabIndex = on ? 0 : -1;
  }
}

function changeLang(v) {
  if (v === getLang()) return;
  setLang(v);
  rowCache.clear();
  if (state.dealsStatus === "ready") buildFilterControls();
  renderExplore();
  renderAccountChrome();
  renderSaved();
  const reopenMenu = document.querySelector("dialog.acct");
  if (state.route.name === "me") renderMe();
  if (state.route.name === "deal") {
    const c = state.detail.get(state.route.id);
    if (c) els.detailBody.innerHTML = detailHTML(c.deal, { locked: c.locked });
    renderDetailHead();
  }
  showView(currentView);
  setTitle();
  syncStars();
  if (reopenMenu) {
    closeDialog({ instant: true, restoreFocus: false });
    const a = $("railAvatar");
    if (a) openAccountMenu(a);
    document.querySelector('dialog.acct [data-lang][aria-checked="true"]')?.focus();
  }
}

/* ---------- events ---------- */

function onClick(e) {
  if (e.defaultPrevented || e.button !== 0) return;
  const t0 = e.target;

  const star = t0.closest("[data-star]");
  if (star) {
    e.preventDefault();
    toggleFav(star.dataset.star, star);
    return;
  }

  const cat = t0.closest("[data-cat]");
  if (cat) {
    state.filters.cat = cat.dataset.cat;
    renderExplore();
    cat.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    if (scrollY > 0) scrollTo({ top: 0 });
    return;
  }
  if (t0.closest('[data-toggle="students"]')) {
    state.filters.students = !state.filters.students;
    renderExplore();
    return;
  }
  const pick = t0.closest("[data-pick]");
  if (pick) return openPicker(pick.dataset.pick, pick);
  if (t0.closest("[data-reset]")) return resetFilters();
  if (t0.closest("[data-retry]")) return loadDeals();
  if (t0.closest("[data-retry-detail]")) return renderDetail(state.route.id);

  if (t0.closest("[data-signin]")) return openSignin();
  if (t0.closest("#railAvatar")) return openAccountMenu($("railAvatar"));
  if (t0.closest("[data-signout]")) return signOut();
  if (t0.closest("[data-close-detail]")) return closeDetail();
  if (t0.closest("[data-share]")) return share();
  if (t0.closest("[data-report]")) return openReport();
  if (t0.closest("[data-redeem]")) return openPass(t0.closest("[data-redeem]"));
  if (t0.closest("[data-outcome]")) return answerOutcome(t0.closest("[data-outcome]"));
  if (t0.closest("[data-pass-renew]")) return renewPass(t0.closest("[data-pass-renew]"));
  if (t0.closest("[data-scan-confirm]")) return confirmScan(t0.closest("[data-scan-confirm]"));
  if (t0.closest("[data-retry-shop]")) return loadShop(state.route.key);
  if (t0.closest("[data-retry-scan]")) return loadScan(state.route.code);
  if (t0.closest("[data-lead-again]")) {
    leadDone = false;
    renderMerchants();
    els.merchantsBody.querySelector("#lead_shop_name")?.focus();
    return;
  }
  if (t0.closest("[data-back]")) {
    if (history.state?.inApp) history.back();
    else navigate("/me");
    return;
  }
  if (t0.closest("[data-install]")) {
    Promise.resolve(window.cpPWA?.install?.())
      .catch(() => {})
      .then(() => state.route.name === "me" && renderMe());
    return;
  }
  const lang = t0.closest("button[data-lang]");
  if (lang) return changeLang(lang.dataset.lang);
  const theme = t0.closest("button[data-theme]");
  if (theme) return setTheme(theme.dataset.theme);
  if (t0.closest("[data-login]")) {
    // Leaving for Google: let the link navigate (full page), just refresh `next` first.
    t0.closest("[data-login]").href = loginHref();
    return;
  }

  // In-app links: deals and tabs.
  const a = t0.closest("a[href]");
  if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  const r = parse(url.pathname);
  if (!r) return;
  e.preventDefault();
  if (a.closest("dialog")) closeDialog({ instant: true, restoreFocus: false });
  if (r.name === "deal") {
    const inDetail = state.route.name === "deal";
    const base = inDetail ? state.base : state.route.name === "saved" ? "saved" : "explore";
    // Switching between deals in the desktop panel replaces the entry, so Back closes the panel.
    navigate(url.pathname, { replace: inDetail && !isPhone(), state: { inApp: true, base } });
    return;
  }
  if (state.route.name === "deal" && r.name === state.base) {
    // Tapping the tab under an open detail pops back to that list (like a native tab bar).
    closeDetail();
    return;
  }
  const same = state.route.name === r.name && url.pathname === location.pathname;
  if (same) {
    scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  navigate(url.pathname, { state: { inApp: true } });
}

function onKey(e) {
  const tag = e.target.tagName;
  const typing = tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !dialogOpen() && !MINIMAL.has(state.route.name)) {
    e.preventDefault();
    if (state.route.name !== "explore") navigate("/");
    els.q.focus();
    return;
  }
  if (e.key === "Escape" && !dialogOpen()) {
    if (e.target === els.q && els.q.value) {
      els.q.value = "";
      onSearch();
      return;
    }
    if (state.route.name === "deal") closeDetail();
  }
  // Arrow keys move within a segmented control (radiogroup).
  if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target.closest?.(".seg")) {
    const btns = [...e.target.closest(".seg").querySelectorAll("button")];
    const i = btns.indexOf(e.target);
    const next = btns[(i + (e.key === "ArrowRight" ? 1 : btns.length - 1)) % btns.length];
    next.focus();
    next.click();
    e.preventDefault();
  }
}

const onSearch = debounce(() => {
  state.filters.q = els.q.value;
  els.qclear.hidden = !els.q.value;
  renderExplore();
}, 90);

let scrollRaf = 0;
function onScroll() {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;
    document.documentElement.classList.toggle("is-scrolled", scrollY > 2);
  });
}

function onDetailScroll() {
  const name = els.detailBody.querySelector("#detailName");
  const past = name ? els.detailBody.scrollTop > name.offsetTop + name.offsetHeight - 12 : els.detailBody.scrollTop > 40;
  els.detail.classList.toggle("scrolled", past);
}

function loginErrorToast() {
  const params = new URLSearchParams(location.search);
  const reason = params.get("login_error");
  if (!reason) return;
  params.delete("login_error");
  const qs = params.toString();
  history.replaceState(history.state, "", location.pathname + (qs ? `?${qs}` : ""));
  const key = `login.${reason}`;
  const msg = t(key);
  toast(msg === key ? t("login.generic") : msg, { error: true, ms: 4500 });
  storage.set(PENDING_FAV, null, "session");
}

function init() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  applyLang();
  els.qclear.innerHTML = icon("x");
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  addEventListener("popstate", route);
  addEventListener("scroll", onScroll, { passive: true });
  els.detailBody.addEventListener("scroll", onDetailScroll, { passive: true });
  els.q.addEventListener("input", onSearch);
  els.q.addEventListener("search", onSearch);
  els.q.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isPhone()) els.q.blur(); // dismiss the keyboard to reveal the results
    }
  });
  els.qclear.addEventListener("click", () => {
    els.q.value = "";
    onSearch();
    els.q.focus();
  });
  els.cats.addEventListener("scroll", updatePillMask, { passive: true });
  addEventListener("resize", debounce(updatePillMask, 100));
  matchMedia("(max-width: 820px)").addEventListener("change", () => {
    applyInert();
    if (state.route.name === "deal") renderDetailHead();
  });
  // Keep body.has-overlay (read by /pwa.js's install card) in step with any open dialog.
  new MutationObserver(applyInert).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  addEventListener("cp:deals-updated", () => loadDeals({ quiet: true }));
  addEventListener("cp:installable", () => state.route.name === "me" && renderMe());
  document.addEventListener("visibilitychange", onPassVisibility);
  addEventListener("pageshow", (e) => {
    if (e.persisted) loadMe(); // back from Google via bfcache
  });

  renderExplore();
  renderAccountChrome();
  route();
  loginErrorToast();
  loadDeals();
  loadMe();
}

init();
