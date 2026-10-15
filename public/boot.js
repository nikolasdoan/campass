/* Loaded synchronously before the stylesheet, so the first paint is already in the right theme,
   language and display mode (no flash). An external file rather than an inline <script>, so the
   Content-Security-Policy can be script-src 'self'. Stored values are validated, never trusted. */
(function () {
  var d = document.documentElement;
  try {
    var th = localStorage.getItem('cp_theme');
    if (th === 'light' || th === 'dark') {
      d.setAttribute('data-theme', th);
      var c = th === 'dark' ? '#202026' : '#FFFFFF';
      var m = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < m.length; i++) m[i].setAttribute('content', c);
    }
  } catch (e) { /* storage blocked: follow the system */ }
  try {
    if (localStorage.getItem('cp_lang') === 'en') { d.lang = 'en'; d.setAttribute('data-lang', 'en'); }
  } catch (e) {}
  try {
    if (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches ||
        navigator.standalone === true) d.classList.add('is-standalone');
  } catch (e) {}
})();
