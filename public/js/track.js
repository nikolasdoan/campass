/* Anonymous usage counts for the admin dashboard: what readers search for, which searches find
   nothing, which filters and deals they open. Batched here and sent to /api/events when the page is
   hidden; the server keeps daily totals only (no user id, IP or cookie). Readers who ask browsers not
   to be tracked (Do Not Track, Global Privacy Control) send nothing. */

const OFF = navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true;
const SEARCH_SETTLE_MS = 1500; // a search counts once the reader stops typing
const MAX_BATCH = 30;

const queue = new Map(); // "kind\tkey" → n

function add(kind, key) {
  if (OFF || !key) return;
  const id = `${kind}\t${key}`;
  queue.set(id, (queue.get(id) || 0) + 1);
  if (queue.size >= MAX_BATCH) flush();
}

function flush() {
  settleSearch();
  if (!queue.size) return;
  const body = JSON.stringify({ e: [...queue].map(([id, n]) => [...id.split("\t"), n]) });
  queue.clear();
  // keepalive lets the request finish while the page goes away.
  fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
}

document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
addEventListener("pagehide", flush);

/** A deal's detail was opened. */
export const trackOpen = (id) => add("open", id);

let pending = null; // { q, n } waiting to settle
let pendingTimer = 0;
let lastSearch = "";

function settleSearch() {
  clearTimeout(pendingTimer);
  if (!pending) return;
  const { q, n } = pending;
  pending = null;
  if (q === lastSearch) return;
  lastSearch = q;
  add("search", q);
  if (!n) add("search_zero", q);
}

/** The list was drawn for search text q with n results; counted once the text settles. */
export function noteSearch(q, n) {
  q = (q || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 40);
  if (q.length < 2) {
    pending = null;
    clearTimeout(pendingTimer);
    if (!q) lastSearch = "";
    return;
  }
  pending = { q, n };
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(settleSearch, SEARCH_SETTLE_MS);
}

let lastFilters = null;

/** The list was drawn with these filters; counts each category, region, school or 學生適用 change the reader makes. */
export function noteFilters(f) {
  const now = { cat: f.cat, region: f.region, school: f.school, students: f.students ? "on" : "off" };
  if (lastFilters) {
    for (const k of Object.keys(now)) if (now[k] !== lastFilters[k] && now[k] !== "all") add("filter", `${k}:${now[k]}`);
  }
  lastFilters = now;
}
