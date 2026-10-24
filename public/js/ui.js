/* Shared chrome: the toast and the dialog (sheet on a phone, modal or popover on a desktop).
   One blocking dialog at a time, as the design system asks. */
import { isPhone } from "./util.js?v=19";

/* ---------- toast ---------- */

let toastTimer = 0;

/** A short message over everything (top layer, so it shows above an open dialog too),
 *  announced through the polite live region. A modal dialog makes everything outside it inert,
 *  live regions included, so while one is open the region moves into it. */
export function toast(message, { error = false, ms = 2800 } = {}) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("err", error);
  announce(message);
  try {
    if (el.matches(":popover-open")) el.hidePopover();
    el.showPopover();
  } catch {
    /* no Popover API: the .show class alone positions it */
  }
  el.classList.remove("show");
  void el.offsetWidth; // restart the entrance
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => {
      try {
        el.hidePopover();
      } catch {}
    }, 220);
  }, ms);
}

/** Say `message` through the polite live region (a toast, a page that changed). */
export function announce(message) {
  const live = document.getElementById("live");
  if (!live) return;
  const host = [...document.querySelectorAll("dialog[open]")].pop() || document.body;
  if (live.parentNode !== host) host.append(live);
  live.textContent = "";
  // A fresh text node after a tick, so a repeated message is announced again.
  setTimeout(() => (live.textContent = message), 30);
}

/* ---------- dialog ---------- */

let current = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapTab(e) {
  if (e.key !== "Tab") return;
  // Tab stops only: a radio group's unchosen options (tabindex=-1) are reached with the arrows.
  const items = [...e.currentTarget.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Open a modal dialog. `html` is trusted markup built by the caller (escape untrusted values
 * first). Elements with [data-close] close it. `anchor` (desktop only) turns it into a popover
 * placed next to that element; on a phone every dialog is a bottom sheet. `returnFocus` (an
 * element, or a function returning one when the dialog closes) is where focus goes afterwards
 * when the dialog was not opened from a control, e.g. after a timer.
 */
export function openDialog({ html, cls = "", label = "", labelledBy = "", anchor = null, placement = "below", onClose = null, returnFocus = null }) {
  closeDialog({ instant: true, restoreFocus: false });
  const opener = returnFocus || document.activeElement;
  const dlg = document.createElement("dialog");
  dlg.className = `dlg ${cls}`.trim();
  if (labelledBy) dlg.setAttribute("aria-labelledby", labelledBy);
  else if (label) dlg.setAttribute("aria-label", label);
  dlg.innerHTML = `<div class="dlg-card">${html}</div>`;
  document.body.append(dlg);

  dlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeDialog();
  });
  // A click whose target is the <dialog> itself landed on the backdrop: the card fills the box.
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) closeDialog();
    else if (e.target.closest("[data-close]")) closeDialog();
  });
  dlg.addEventListener("keydown", trapTab);

  const popover = anchor && !isPhone();
  if (popover) {
    dlg.classList.add("dlg-pop");
    dlg.showModal();
    placePopover(dlg, anchor, placement);
  } else {
    dlg.showModal();
  }
  current = { dlg, opener, onClose };
  document.documentElement.classList.add("has-dialog");
  const autofocus = dlg.querySelector("[autofocus]") || dlg.querySelector(FOCUSABLE);
  autofocus?.focus({ preventScroll: true });
  return dlg;
}

function placePopover(dlg, anchor, placement) {
  const r = anchor.getBoundingClientRect();
  const w = dlg.offsetWidth;
  const hgt = dlg.offsetHeight;
  let left;
  let top;
  if (placement === "right") {
    // Clear the rail's edge (the avatar sits inside it), never overlap it.
    const rail = anchor.closest(".rail");
    left = Math.max(r.right + 10, rail ? rail.getBoundingClientRect().right + 8 : 0);
    top = Math.min(r.bottom - hgt, innerHeight - hgt - 10);
  } else {
    left = Math.min(Math.max(10, r.left), innerWidth - w - 10);
    top = r.bottom + 8;
    if (top + hgt > innerHeight - 10) top = Math.max(10, r.top - hgt - 8);
  }
  dlg.style.left = `${Math.round(left)}px`;
  dlg.style.top = `${Math.round(Math.max(10, top))}px`;
}

export function closeDialog({ instant = false, restoreFocus = true } = {}) {
  if (!current) return;
  const { dlg, opener, onClose } = current;
  current = null;
  document.documentElement.classList.remove("has-dialog");
  const finish = () => {
    if (dlg.open) dlg.close();
    const live = document.getElementById("live");
    if (live && dlg.contains(live)) document.body.append(live);
    dlg.remove();
    // After close(): while a modal is open everything outside it is inert and refuses focus.
    const target = typeof opener === "function" ? opener() : opener;
    if (restoreFocus && target && document.contains(target)) target.focus({ preventScroll: true });
  };
  if (instant) finish();
  else {
    dlg.classList.add("closing");
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      finish();
    };
    dlg.addEventListener("animationend", end, { once: true });
    setTimeout(end, 320);
  }
  onClose?.();
}

export const dialogOpen = () => !!current;
