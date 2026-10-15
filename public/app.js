/* CampusPass front end. Plain ES modules, no framework, no build step.
   Routes: /  (Explore) · /saved · /me · /deal/:id (deep-linkable; a side panel on a desktop,
   a pushed full-screen page on a phone). History API routing over the Workers SPA fallback. */
import { icon } from "./js/icons.js?v=2";
import { t, getLang, setLang, applyLang, schoolName } from "./js/i18n.js?v=2";
import { esc, linkify, safeUrl, storage, todayTW, daysBetween, fmtDate, norm, debounce, isPhone } from "./js/util.js?v=2";
import { toast, openDialog, closeDialog, dialogOpen } from "./js/ui.js?v=2";

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
  filters: { q: "", cat: "all", region: "all", school: "all", students: true },
  route: { name: "explore", id: null },
  base: "explore", // the list view under an open detail
  detail: new Map(), // id → { deal, locked }
  detailSeq: 0,
};
const scrollPos = { explore: 0, saved: 0, me: 0 };

const $ = (id) => document.getElementById(id);
const els = {
  shell: $("shell"), main: $("main"), appbar: $("appbar"), appbarTitle: $("appbarTitle"), appbarActions: $("appbarActions"),
  railFoot: $("railFoot"), q: $("q"), qclear: $("qclear"), cats: $("cats"), catWrap: $("catWrap"), filterRow: $("filterRow"),
  list: $("list"), exploreFoot: $("exploreFoot"), savedBody: $("savedBody"), meBody: $("meBody"),
  detail: $("detail"), dhead: $("dhead"), detailBody: $("detailBody"),
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
      cache: method === "GET" && url.startsWith("/api/me") ? "no-store" : "default",
      headers: method === "GET" ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, data };
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
  return f.q.trim() !== "" || f.cat !== "all" || f.region !== "all" || f.school !== "all" || !f.students;
};

/* ---------- rows ---------- */

const rowCache = new Map();

function badgesHTML(d) {
  const elig = ELIG.filter((k) => d.eligibility[k]).map((k) => `<span class="mini">${esc(t(`elig.${k}`))}</span>`).join("");
  return `${d.highlight ? `<span class="badge">${esc(d.highlight)}</span>` : ""}${expiryChip(d)}${elig}`;
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
  if (shown.length) els.list.replaceChildren(...shown.map(rowEl));
  else {
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
  els.exploreFoot.innerHTML = `${expired ? `<p>${esc(t("list.expiredHidden", { n: expired }))}</p>` : ""}<p>${esc(t("disclaimer"))}</p>`;
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
    else f.school = b.dataset.value;
    closeDialog();
    renderExplore();
  });
}

function resetFilters() {
  Object.assign(state.filters, { q: "", cat: "all", region: "all", school: "all", students: true });
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
    <section class="card"><h2>${esc(t("me.about"))}</h2>
      <p>${esc(t("me.aboutBody"))}</p>
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

function openReport() {
  const id = state.route.id;
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
  ta.addEventListener("input", () => {
    dlg.querySelector("#reportN").textContent = ta.value.length;
    submit.disabled = !ta.value.trim();
  });
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

/* ---------- router ---------- */

function parse(path) {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return { name: "explore" };
  if (p === "/saved") return { name: "saved" };
  if (p === "/me") return { name: "me" };
  const m = p.match(/^\/deal\/([A-Za-z0-9_-]{1,64})$/);
  if (m) return { name: "deal", id: m[1] };
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
  for (const v of ["explore", "saved", "me"]) $(`view-${v}`).hidden = v !== name;
  document.body.dataset.route = name;
  for (const a of document.querySelectorAll("[data-tab]")) {
    if (a.dataset.tab === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  els.appbarTitle.textContent = name === "saved" ? t("saved.title") : name === "me" ? t("me.title") : "";
  if (name === "saved") renderSaved();
  if (name === "me") renderMe();
  if (changed) {
    scrollTo(0, scrollPos[name] || 0);
    onScroll();
  }
}

function route() {
  let r = parse(location.pathname);
  if (!r) {
    history.replaceState(null, "", "/");
    r = { name: "explore" };
  }
  const prev = state.route;
  state.route = r;
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
  else document.title = `${t(r.name === "saved" ? "saved.title" : "me.title")} · CampusPass`;
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
  const same = state.route.name === r.name;
  if (same) {
    scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  navigate(url.pathname);
}

function onKey(e) {
  const tag = e.target.tagName;
  const typing = tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;
  if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !dialogOpen()) {
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
