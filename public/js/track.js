/* Anonymous usage counts: [kind, key] pairs, batched to POST /api/events by sendBeacon. No user id and
   no cookie of its own; the server keeps only daily totals and normalises and scrubs every key again.
   Nothing is sent when the browser asks not to be tracked (Global Privacy Control or Do Not Track).
   Kinds: search · search_zero (a term that found nothing) · filter ("cat:food") · open (a deal id).
   Sends only once the server says it takes them (/api/me features.events → enableTracking). */

const MAX = 20; // pairs per request
const KEY_MAX = 40;
let queue = [];
let enabled = false;
const seen = new Set(); // each pair once per page view

const optedOut = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1";

export function track(kind, key) {
  if (!key || optedOut()) return;
  const k = String(key).slice(0, KEY_MAX);
  const id = `${kind}\u0000${k}`;
  if (seen.has(id)) return;
  seen.add(id);
  queue.push([kind, k]);
  if (queue.length > 200) queue.shift(); // never sent (server without events): bounded
  if (queue.length >= MAX) flush();
}

/** The server takes events (features.events): send what was queued, and from now on. Off drops the queue. */
export function enableTracking(on) {
  enabled = !!on;
  if (!enabled) queue = [];
  else flush();
}

export function flush() {
  while (enabled && queue.length) {
    // text/plain: a CORS-safelisted type, so the beacon needs no preflight; the server parses the JSON.
    const body = JSON.stringify({ e: queue.splice(0, MAX) });
    try {
      if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "text/plain;charset=UTF-8" }))) {
        fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain;charset=UTF-8" } }).catch(() => {});
      }
    } catch {
      /* counts are best effort */
    }
  }
}

setInterval(flush, 30e3);
addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
