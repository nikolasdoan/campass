/* Small helpers shared by every module. No DOM state lives here. */

/** HTML-escape any untrusted string before it goes near innerHTML. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* URLs inside Chinese text end at the first CJK punctuation or space, not at the next ASCII
   space, so 「網站：https://x.tw/，電話…」 links only the address. */
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'，。、；：！？（）「」【】『』《》〈〉]+/gi;

/** Escape `text`, then turn bare http(s)/www URLs into safe external links. Line breaks are
 *  preserved by the caller with `white-space: pre-line`. */
export function linkify(text) {
  const src = String(text ?? "");
  let out = "";
  let last = 0;
  for (const m of src.matchAll(URL_RE)) {
    let url = m[0];
    // Trailing ASCII punctuation belongs to the sentence, not the URL.
    const trail = url.match(/[.,;:!?)\]]+$/);
    if (trail) url = url.slice(0, -trail[0].length);
    const start = m.index;
    out += esc(src.slice(last, start));
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (safeUrl(href)) {
      out += `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`;
    } else {
      out += esc(url);
    }
    last = start + url.length;
  }
  return out + esc(src.slice(last));
}

/** Only http(s) URLs are ever rendered as links (no javascript:, data:, …). */
export function safeUrl(url) {
  try {
    const u = new URL(url, location.origin);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch {
    return "";
  }
}

/* Storage is optional: private windows, blocked cookies and quota errors all throw. */
export const storage = {
  get(key, area = "local") {
    try {
      return (area === "session" ? sessionStorage : localStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value, area = "local") {
    try {
      const s = area === "session" ? sessionStorage : localStorage;
      if (value == null) s.removeItem(key);
      else s.setItem(key, value);
    } catch {
      /* the setting simply is not remembered */
    }
  },
};

/** Today's date in Taiwan as YYYY-MM-DD — expiry dates in the data are Taiwan dates. */
export function todayTW() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
export function daysBetween(from, to) {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 864e5);
}

/** 2026-12-31 → 2026/12/31 */
export function fmtDate(iso) {
  return iso ? String(iso).slice(0, 10).replace(/-/g, "/") : "";
}

/** Search normalisation: full-width → half-width, case-folded, 臺 ≡ 台. */
export function norm(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/臺/g, "台")
    .trim();
}

export function debounce(fn, ms) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Build an element from an HTML string (the caller is responsible for escaping). */
export function h(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export const isPhone = () => matchMedia("(max-width: 820px)").matches;

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
