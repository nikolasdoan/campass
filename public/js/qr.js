/* QR codes for the in-store pass. The encoder is Kazuhiko Arase's MIT-licensed
   qrcode-generator 2.0.4 (/vendor/qrcode.js, unmodified, license header kept). It is a classic
   script that defines a global `qrcode`, so it is loaded only when a pass first opens.
   The SVG is always black on white, whatever the theme: a camera must read it in dark mode. */

const SRC = "/vendor/qrcode.js?v=7";
let loading = null;

function load() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.qrcode ? resolve(window.qrcode) : reject(new Error("qrcode missing")));
    s.onerror = () => {
      loading = null; // let the next pass try again (e.g. back online)
      s.remove();
      reject(new Error("qrcode failed to load"));
    };
    document.head.append(s);
  });
  return loading;
}

/**
 * An <svg> string for `text`: error correction M, a 4-module quiet zone, one path of
 * horizontal runs (crisp at any size). `label` becomes the accessible name.
 */
export async function qrSVG(text, { label = "" } = {}) {
  const qrcode = await load();
  const qr = qrcode(0, "M"); // 0: the smallest version that fits
  qr.addData(text, "Byte");
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 4;
  const size = n + quiet * 2;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      let run = 1;
      while (c + run < n && qr.isDark(r, c + run)) run++;
      d += `M${c + quiet} ${r + quiet}h${run}v1h-${run}z`;
      c += run - 1;
    }
  }
  const a11y = label ? `role="img" aria-label="${label.replace(/[&<>"]/g, "")}"` : 'aria-hidden="true"';
  return `<svg class="qr" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" ${a11y} focusable="false" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${d}" fill="#000000"/></svg>`;
}
