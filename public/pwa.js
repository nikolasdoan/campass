/* CampusPass PWA glue: standalone class, service worker + update toast, install prompt.
 *
 * A classic script, loaded with `defer` from index.html. It depends on nothing else on the
 * page: its two pieces of UI (the install card and the update toast) bring their own <style>,
 * scoped to .install* / .cp-update, reading the design tokens when styles.css defines them and
 * falling back to the same values when it does not.
 *
 * The install prompt is bizmap's (web/static/pwa.js), which took its restraint from tecxwork's
 * install-prompt.tsx: phone only, never inside the installed app, a hard cap on how often it
 * asks, a delay so it does not compete with the page, and never on top of something the reader
 * opened. Those rules are the whole difference between a prompt and a nuisance.
 *
 * Globals (for the UI):
 *   window.cpPWA.isStandalone()   true inside the installed app
 *   window.cpPWA.canInstall()     true when Chrome has offered an install (beforeinstallprompt)
 *   window.cpPWA.install()        runs that install flow → Promise<'accepted'|'dismissed'|'unavailable'>
 *   window.cpPWA.isIOS            iOS / iPadOS (no install event; show Share → 加入主畫面 instead)
 *   window.__cpShowInstall(p)     testing: show the card now, p = 'ios' | 'android'
 * Events: 'cp:deals-updated' on window when the service worker fetched a changed /api/deals,
 *         'cp:installable' on window when an install becomes possible.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var mq = function (q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } };
  var read = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var write = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };
  var en = function () { return root.dataset.lang === 'en'; };
  var say = function (zh, english) { return en() ? english : zh; };
  var idle = window.requestIdleCallback
    ? function (fn) { window.requestIdleCallback(fn, { timeout: 2000 }); }
    : function (fn) { setTimeout(fn, 0); };

  /* ── Standalone ─────────────────────────────────────────────────────────────────── */
  var standaloneMQ = mq('(display-mode: standalone)');
  var minimalMQ = mq('(display-mode: minimal-ui)');
  function isStandalone() {
    return standaloneMQ.matches || minimalMQ.matches || navigator.standalone === true;
  }
  function markStandalone() { root.classList.toggle('is-standalone', isStandalone()); }
  markStandalone();
  [standaloneMQ, minimalMQ].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', markStandalone);
    else if (m.addListener) m.addListener(markStandalone);
  });

  /* ── Styles (injected once) ─────────────────────────────────────────────────────── */
  var TOKENS_LIGHT =
    '--_surface:var(--surface,#FFFFFF);--_ink:var(--ink,#1D1D1F);--_ink2:var(--ink-2,#48484A);' +
    '--_line:var(--line,#E5E5E7);--_chip:var(--chip,#F5F5F7);--_dot:var(--dot,#8C52FF);' +
    '--_fill:var(--accent-fill,#6B3FCC);--_on:var(--on-accent,#FFFFFF);';
  var TOKENS_DARK =
    '--_surface:var(--surface,#202026);--_ink:var(--ink,#FAFAFA);--_ink2:var(--ink-2,#C7C7CC);' +
    '--_line:var(--line,#35353D);--_chip:var(--chip,#2A2A31);--_dot:var(--dot,#A978FF);' +
    '--_fill:var(--accent-fill,#A978FF);--_on:var(--on-accent,#0A0A0A);';
  var SCOPE = '.install,.cp-update';
  var CSS =
    SCOPE + '{' + TOKENS_LIGHT +
      '--_dur:var(--dur-panel,300ms);--_ease:var(--ease-decel,cubic-bezier(0,0,.2,1));' +
      '--_tap:var(--dur-tap,120ms);--_std:var(--ease-standard,cubic-bezier(.4,0,.2,1));' +
      '--_bottom:calc(var(--nav-h,env(safe-area-inset-bottom,0px)) + 12px);' +
      'font-family:var(--sans,-apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,"PingFang TC","Noto Sans TC","Microsoft JhengHei",Arial,sans-serif);' +
      'letter-spacing:-0.01em;-webkit-tap-highlight-color:transparent}' +
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .install,:root:not([data-theme="light"]) .cp-update{' + TOKENS_DARK + '}}' +
    ':root[data-theme="dark"] .install,:root[data-theme="dark"] .cp-update{' + TOKENS_DARK + '}' +

    /* Centred on the content (right of the desktop rail), the same axis as the app's #toast. */
    '.install{position:fixed;z-index:70;left:calc(12px + var(--rail-w,0px));right:12px;bottom:var(--_bottom);max-width:480px;margin:0 auto;' +
      'box-sizing:border-box;display:flex;gap:12px;align-items:flex-start;padding:14px 40px 14px 14px;' +
      'background:var(--_surface);color:var(--_ink);border:1px solid var(--_line);border-radius:14px;' +
      'box-shadow:0 12px 38px rgb(0 0 0/.22);' +
      'transition:transform var(--_dur) var(--_ease),opacity var(--_dur) var(--_ease)}' +
    '.install[data-state="enter"],.install[data-state="leave"]{opacity:0;transform:translateY(14px)}' +
    '.install-icon{flex:0 0 auto;width:44px;height:44px;border-radius:10px;display:block}' +
    '.install-body{display:grid;gap:3px;min-width:0;flex:1 1 auto}' +
    '.install-title{margin:0;font-size:14px;font-weight:600;line-height:1.35;color:var(--_ink)}' +
    '.install-text{margin:0;font-size:12.5px;line-height:1.45;color:var(--_ink2)}' +
    '.install-share{display:inline-block;width:15px;height:15px;vertical-align:-2px;margin:0 2px;color:var(--_dot)}' +
    '.install-actions{display:flex;gap:8px;margin-top:8px}' +
    '.install-btn{appearance:none;font:inherit;font-size:13px;font-weight:600;min-height:36px;padding:0 18px;' +
      'border:0;border-radius:999px;cursor:pointer;background:var(--_fill);color:var(--_on);' +
      'transition:transform var(--_tap) var(--_std)}' +
    '.install-btn:active{transform:scale(.97)}' +
    '.install-x{position:absolute;top:4px;right:4px;width:36px;height:36px;display:grid;place-items:center;' +
      'appearance:none;border:0;border-radius:999px;background:none;color:var(--_ink2);cursor:pointer;padding:0;font:inherit}' +
    '.install-x:hover{background:var(--_chip);color:var(--_ink)}' +
    '.install-x svg{width:18px;height:18px}' +
    '.install-btn:focus-visible,.install-x:focus-visible,.cp-update:focus-visible{outline:2px solid var(--_dot);outline-offset:2px}' +
    /* Something the reader opened takes the screen: step out of its way until it closes. */
    'body.has-overlay .install,html:has(dialog[open],[role=dialog][open],.sheet.open,[data-sheet-open]) .install' +
      '{opacity:0;transform:translateY(14px);pointer-events:none}' +

    /* The app toast's recipe (styles.css .toast), read from --toast-* when styles.css defines them,
       so the two pills look alike. A taller invisible hit area keeps it a comfortable tap. */
    '.cp-update{position:fixed;z-index:80;left:calc(50% + var(--rail-w,0px) / 2);bottom:var(--_bottom);transform:translateX(-50%);' +
      'max-width:calc(100vw - 32px);margin:0;padding:var(--toast-pad,7px 14px);border:0;border-radius:999px;cursor:pointer;white-space:nowrap;' +
      'font:inherit;font-size:var(--toast-fs,12.5px);font-weight:500;line-height:1.4;' +
      'background:var(--toast-bg,color-mix(in srgb,var(--_ink) 88%,transparent));color:var(--_surface);' +
      'box-shadow:var(--toast-shadow,0 4px 16px rgba(0,0,0,.18));' +
      'transition:transform var(--_dur) var(--_ease),opacity var(--_dur) var(--_ease)}' +
    '.cp-update::before{content:"";position:absolute;left:0;right:0;top:-8px;bottom:-8px}' +
    '.cp-update[data-state="enter"]{opacity:0;transform:translate(-50%,10px)}' +
    '.cp-update:active{transform:translateX(-50%) scale(.97)}' +

    '@media (prefers-reduced-motion:reduce){.install,.cp-update,.install-btn{transition:none}}' +
    '@media (prefers-reduced-transparency:reduce){.cp-update{background:var(--_ink)}}' +
    '@media (forced-colors:active){.cp-update,.install{border:1px solid CanvasText}}' +

    /* The stacking contract's safety net (see layout()): while pwa.js has something up, the app
       toast sits above it, even if styles.css does not read --float-floor yet. */
    ':root[data-cp-float] #toast{bottom:var(--float-floor) !important}';

  function injectStyle() {
    if (document.getElementById('cp-pwa-style')) return;
    var s = document.createElement('style');
    s.id = 'cp-pwa-style';
    s.textContent = CSS;
    (document.head || root).appendChild(s);
  }

  var reduced = function () { return mq('(prefers-reduced-motion: reduce)').matches; };
  function enter(node) {
    node.dataset.state = 'enter';
    document.body.appendChild(node);
    // Two frames: the first lays out the start state, the second transitions from it.
    requestAnimationFrame(function () { requestAnimationFrame(function () { delete node.dataset.state; }); });
  }
  function leave(node) {
    if (!node || !node.parentNode) return;
    if (reduced()) { node.remove(); return; }
    node.dataset.state = 'leave';
    var done = function () { node.remove(); };
    node.addEventListener('transitionend', done, { once: true });
    setTimeout(done, 400);
  }

  /* ── Placement ──────────────────────────────────────────────────────────────────────
     One stack of floating UI, bottom of the screen up:
       1. fixed bars: the tab bar (--nav-h) and any action bar (the detail's 使用優惠 bar on a
          phone, .usebar or [data-usebar] elsewhere). Its top edge is measured, so any height works.
       2. the install card (#cpInstall)        12px above the highest bar
       3. the update toast (.cp-update)          8px above the card
       4. the app's toast (#toast, js/ui.js)     8px above whatever is up here
     The persistent pieces stay put and the short-lived app toast is the one that moves: while
     2 or 3 is up, <html> carries --float-floor (px from the viewport bottom, the top of the stack
     + 8px) and data-cp-float, and styles.css sits .toast on max(its own bottom, --float-floor).
     The injected rule above does the same for #toast, so the stack holds before it does.
     A 'cp:float' event on window ({ floor }) reports every change. Nothing covers a bar. */
  var BARS = '.usebar,[data-usebar],#detailUse,.duse';
  var GAP = 12;
  var STACK = 8;
  var probe = null;
  function navPx() {
    if (!probe || !probe.isConnected) {
      probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;visibility:hidden;pointer-events:none;' +
        'height:var(--nav-h,env(safe-area-inset-bottom,0px))';
      document.body.appendChild(probe);
    }
    return probe.getBoundingClientRect().height;
  }
  function shown(el) {
    if (!el || el.hidden) return null;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null;
    return r;
  }
  /* Distance from the bottom of the viewport that floating UI has to clear. */
  function floorPx() {
    var H = window.innerHeight, W = window.innerWidth, floor = navPx();
    var bars = document.querySelectorAll(BARS);
    for (var i = 0; i < bars.length; i++) {
      var r = shown(bars[i]);
      // Only a bar pinned to the screen (not one in the flow of a desktop panel, which scrolls),
      // on screen, in the lower part of it (on a desktop the bar may be a strip at the top).
      if (!r || r.top < H * 0.4 || r.top >= H || r.right <= 0 || r.left >= W) continue;
      var pos = getComputedStyle(bars[i]).position;
      if (pos === 'static' || pos === 'relative') continue;
      floor = Math.max(floor, H - r.top);
    }
    return floor;
  }
  /* Up = where it will be once its entrance ends (the entrance itself starts at opacity 0, so
     visibility is judged by state, not by what is painted this frame). */
  var cardUp = function (card) {
    return !!card && card.isConnected && card.dataset.state !== 'leave' && !busy() &&
      !root.classList.contains('chrome-min') && card.offsetHeight > 0;
  };
  var toastUp = function (t) {
    return !!t && t.isConnected && t.dataset.state !== 'leave' && t.offsetHeight > 0;
  };
  var lastFloor = -1;
  function publish(floor, what) {
    if (floor) {
      root.style.setProperty('--float-floor', floor + 'px');
      root.setAttribute('data-cp-float', what.join(' '));
    } else {
      root.style.removeProperty('--float-floor');
      root.removeAttribute('data-cp-float');
    }
    if (floor !== lastFloor) {
      lastFloor = floor;
      window.dispatchEvent(new CustomEvent('cp:float', { detail: { floor: floor } }));
    }
  }
  function layout() {
    var card = document.getElementById('cpInstall');
    var toast = document.querySelector('.cp-update');
    if (!card && !toast) { if (lastFloor > 0) publish(0, []); return; }
    var y = floorPx() + GAP, top = 0, what = [];
    if (card) {
      card.style.bottom = y + 'px';
      if (cardUp(card)) { y += card.offsetHeight + STACK; top = y; what.push('card'); }
    }
    if (toast) {
      toast.style.bottom = y + 'px';
      if (toastUp(toast)) { y += toast.offsetHeight + STACK; top = y; what.push('update'); }
    }
    publish(Math.round(top), what);
  }
  var queued = false;
  function relayout() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; layout(); });
  }
  var watching = false;
  function watchLayout() {
    if (watching) return;
    watching = true;
    // Whatever opens, closes or moves a bar: routes, the detail panel, dialogs, resizes.
    new MutationObserver(relayout).observe(document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden', 'open'],
    });
    window.addEventListener('resize', relayout);
    window.addEventListener('popstate', relayout);
    document.addEventListener('transitionend', relayout, true);
    document.addEventListener('animationend', relayout, true);
  }
  function place(node) {
    watchLayout();
    layout();
  }

  /* ── Service worker + update toast ──────────────────────────────────────────────── */
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  var swReady = null;

  if ('serviceWorker' in navigator && secure) {
    var refreshing = false;
    var userAskedRefresh = false;

    /* Only a reload the reader asked for. The first install also changes the controller
       (clients.claim) and must not reload the page under them. */
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!userAskedRefresh || refreshing) return;
      refreshing = true;
      location.reload();
    });

    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'cp:deals-updated') {
        window.dispatchEvent(new CustomEvent('cp:deals-updated', { detail: { url: e.data.url } }));
      }
    });

    var showUpdate = function (worker) {
      if (!worker || !navigator.serviceWorker.controller || document.querySelector('.cp-update')) return;
      injectStyle();
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'cp-update';
      var words = function () { t.textContent = say('有新版本 · 重新整理', 'New version · Refresh'); };
      words();
      new MutationObserver(words).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
      t.addEventListener('click', function () {
        userAskedRefresh = true;
        t.disabled = true;
        worker.postMessage({ type: 'SKIP_WAITING' });
        // If the worker had already taken over (another tab), no controllerchange will come.
        setTimeout(function () { if (!refreshing) { refreshing = true; location.reload(); } }, 3000);
      });
      enter(t);
      place(t);
    };

    var watch = function (reg) {
      if (reg.waiting) showUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(reg.waiting || nw);
        });
      });
      /* A long-lived tab (an installed app is one) checks for a new version when it comes back
         to the foreground, at most once an hour. */
      var last = Date.now();
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && Date.now() - last > 3600e3) {
          last = Date.now();
          reg.update().catch(function () {});
        }
      });
    };

    /* What this page already loaded went to the network before the worker was in control:
       the exact (versioned) URLs of its own <script>/<link> tags, what those imported (module
       imports, fonts, icons: the Performance API), and the public deal list. Give the list to
       the worker so an offline launch after a single visit has all of it. */
    var STATIC = /\.(?:css|js|mjs|svg|png|jpe?g|webp|avif|gif|ico|woff2?|webmanifest)$/i;
    var loadedUrls = function () {
      var seen = {}, out = [];
      var add = function (u) {
        try {
          var x = new URL(u, location.href);
          if (x.origin !== location.origin || x.pathname === '/sw.js') return;
          if (!STATIC.test(x.pathname) && !(x.pathname === '/api/deals' && !x.search)) return;
          if (!seen[x.href]) { seen[x.href] = 1; out.push(x.href); }
        } catch (e) { /* ignore */ }
      };
      var tags = document.querySelectorAll('script[src],link[href][rel~="stylesheet"],link[href][rel~="modulepreload"],' +
        'link[href][rel~="preload"],link[href][rel~="icon"],link[href][rel~="apple-touch-icon"]');
      for (var i = 0; i < tags.length; i++) add(tags[i].getAttribute('src') || tags[i].getAttribute('href'));
      try {
        performance.getEntriesByType('resource').forEach(function (e) { add(e.name); });
      } catch (e) { /* no Performance API */ }
      add('/api/deals');
      return out;
    };
    var handOverLoadedAssets = function () {
      navigator.serviceWorker.ready.then(function (reg) {
        if (!reg.active) return;
        var urls = loadedUrls();
        if (urls.length) reg.active.postMessage({ type: 'CACHE_URLS', urls: urls });
      }).catch(function () {});
    };

    var register = function () {
      swReady = navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
        watch(reg);
        handOverLoadedAssets();
        return reg;
      }).catch(function () {
        /* Silent on purpose: the site works without it (private windows refuse it), and there
           is nothing a reader could do about it. */
        return null;
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }

  /* ── Install prompt ─────────────────────────────────────────────────────────────── */
  var ASKS = 'cp_install_asks';
  var OFF = 'cp_install_off';
  var FIRST = 'cp_first_visit';
  var MAX_ASKS = 3;
  var SETTLE_MS = 4000;
  var FIRST_WAIT_MS = 60000;

  var ua = navigator.userAgent.toLowerCase();
  var isIOS = /iphone|ipad|ipod/.test(ua) ||
    // iPadOS reports itself as a Mac; the touch points give it away.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Safari proper: other iOS browsers and in-app web views have no 「加入主畫面」 in the share sheet.
  var isIOSSafari = isIOS && /safari/.test(ua) && !/crios|fxios|edgios|opios|gsa\/|line\/|fban|fbav|instagram|micromessenger/.test(ua);

  var deferred = null;
  var onInstallable = null;      // set by schedule() while the card waits for Chrome's offer
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // our card, not Chrome's mini-infobar
    deferred = e;
    window.dispatchEvent(new CustomEvent('cp:installable'));
    if (onInstallable) { var go = onInstallable; onInstallable = null; go(); }
  });
  window.addEventListener('appinstalled', function () {
    write(OFF, 'installed');
    deferred = null;
    leave(document.getElementById('cpInstall'));
  });

  function install() {
    if (!deferred) return Promise.resolve('unavailable');
    var ev = deferred;
    deferred = null;             // a beforeinstallprompt event can be used once
    try { ev.prompt(); } catch (e) { return Promise.resolve('unavailable'); }
    return Promise.resolve(ev.userChoice).then(function (c) {
      var outcome = (c && c.outcome) || 'dismissed';
      if (outcome === 'accepted') write(OFF, 'installed');
      return outcome;
    }, function () { return 'dismissed'; });
  }

  window.cpPWA = {
    isStandalone: isStandalone,
    canInstall: function () { return !!deferred; },
    install: install,
    isIOS: isIOS,
    ready: function () { return swReady || Promise.resolve(null); },
  };

  var SVG_SHARE = '<svg class="install-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v13"/><path d="m16 6-4-4-4 4"/>' +
    '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/></svg>';
  var SVG_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  var busy = function () {
    return !!document.querySelector('[role=dialog][open], dialog[open], .sheet.open, [data-sheet-open]') ||
      document.body.classList.contains('has-overlay');
  };

  function buildCard(platform) {
    injectStyle();
    var card = document.createElement('div');
    card.className = 'install';
    card.id = 'cpInstall';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-labelledby', 'cpInstallTitle');

    var icon = document.createElement('img');
    icon.className = 'install-icon';
    icon.src = '/icons/icon.svg';
    icon.alt = '';
    icon.width = 44;
    icon.height = 44;

    var body = document.createElement('div');
    body.className = 'install-body';
    var title = document.createElement('p');
    title.className = 'install-title';
    title.id = 'cpInstallTitle';
    var text = document.createElement('p');
    text.className = 'install-text';
    var actions = document.createElement('div');
    actions.className = 'install-actions';
    var primary = document.createElement('button');
    primary.type = 'button';
    primary.className = 'install-btn';
    actions.appendChild(primary);
    body.appendChild(title);
    body.appendChild(text);
    body.appendChild(actions);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'install-x';
    close.innerHTML = SVG_X;

    card.appendChild(icon);
    card.appendChild(body);
    card.appendChild(close);

    var words = function () {
      title.textContent = say('把 CampusPass 加入主畫面', 'Add CampusPass to your home screen');
      if (platform === 'ios') {
        text.innerHTML = say('點選「分享」' + SVG_SHARE + '，再選「加入主畫面」', 'Tap Share' + SVG_SHARE + ', then “Add to Home Screen”');
        primary.textContent = say('知道了', 'Got it');
      } else {
        /* Only what the app keeps true offline. The deal list is always there (sw.js); the saved
           deals' full terms are only once the app keeps its own copy of them (cp_saved_cache,
           app.js), so the offline promise waits for that copy to exist. */
        text.textContent = read('cp_saved_cache')
          ? say('從主畫面一點就開，離線也能看已載入的優惠與收藏。', 'Opens from your home screen. Loaded and saved deals stay readable offline.')
          : say('從主畫面一點就開，像 App 一樣全螢幕使用。', 'Opens from your home screen, full screen like an app.');
        primary.textContent = say('安裝', 'Install');
      }
      close.setAttribute('aria-label', say('關閉，不再顯示', 'Dismiss, don’t ask again'));
    };
    words();
    var langObs = new MutationObserver(words);
    langObs.observe(root, { attributes: true, attributeFilter: ['data-lang'] });

    var dismiss = function () { langObs.disconnect(); leave(card); };
    primary.addEventListener('click', function () {
      if (platform === 'ios') { dismiss(); return; }
      install().then(dismiss);
    });
    close.addEventListener('click', function () {
      // An explicit ×: stop asking, for good.
      write(OFF, '1');
      dismiss();
    });
    return card;
  }

  function showCard(platform) {
    if (document.getElementById('cpInstall')) return null;
    var card = buildCard(platform);
    enter(card);
    place(card);
    return card;
  }

  window.__cpShowInstall = function (platform) {
    var p = platform === 'android' || platform === 'ios' ? platform : (isIOS ? 'ios' : 'android');
    var old = document.getElementById('cpInstall');
    if (old) old.remove();
    return showCard(p);
  };

  /* A shop's counter page (/m/<key>, /r/<code>): installing from there would open the student
     app, not the shop page, so the card never shows there and never spends an ask. */
  var shopPage = function () {
    return /^\/(?:m|r)\//.test(location.pathname) || root.classList.contains('chrome-min');
  };

  (function schedule() {
    if (isStandalone()) { write(OFF, 'installed'); return; }
    if (shopPage()) return;
    if (read(OFF)) return;

    var firstAt = Number(read(FIRST) || 0);
    if (!firstAt || !isFinite(firstAt)) { firstAt = Date.now(); write(FIRST, String(firstAt)); }
    var asks = Number(read(ASKS) || 0);
    if (!isFinite(asks) || asks >= MAX_ASKS) return;

    var phone = function () { return mq('(max-width: 820px)').matches || mq('(pointer: coarse)').matches; };
    if (!phone()) return;
    if (isIOS && !isIOSSafari) return;

    var deferrals = 20;          // ≈ one minute of stepping aside for an open sheet, then let it go
    var again = function (ms) { setTimeout(function () { idle(show); }, ms); };

    function show() {
      if (document.getElementById('cpInstall') || isStandalone() || read(OFF) || !phone()) return;
      // Not in the first minute of the very first visit: let them see what it is first.
      var early = firstAt + FIRST_WAIT_MS - Date.now();
      if (early > 0) { again(early); return; }
      // Busy, on a shop page (reached in-app), or the update toast is up: wait, ask nothing.
      if (busy() || shopPage() || document.querySelector('.cp-update')) { if (deferrals-- > 0) again(3000); return; }
      // Android/Chrome: only with a real install to offer. Nothing else can install from a card.
      if (!isIOS && !deferred) {
        onInstallable = function () { again(SETTLE_MS); };
        return;
      }
      write(ASKS, String(asks + 1));
      showCard(isIOS ? 'ios' : 'android');
    }

    again(SETTLE_MS);
  })();
})();
