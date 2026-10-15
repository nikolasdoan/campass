# CampusPass design system

CampusPass uses the **Tecxmate Design System v1.1**. The reference implementation is
`tecxmate/bizmap` (vanilla HTML/CSS/JS on Cloudflare, zh-TW first); `tecxmate/tecxwork`
uses the same palette in Next.js. When in doubt, copy bizmap.

Reference files (read-only clones in the dev container):
- `bizmap/web/index.tpl.html` lines ~202–368 — tokens, base + phone CSS
- `bizmap/web/static/searchfirst.css` — search bar, pills, sheets, bottom nav
- `bizmap/web/rail.py` `css()` — desktop rail, account menu, motion tokens, i18n, Lucide `ICONS`
- `bizmap/web/phonechrome.py` — phone header for non-map pages
- `bizmap/web/static/{manifest.webmanifest,sw.js,pwa.js,icon.svg}` — PWA
- `tecxwork/docs/des/Tecxmate Design System.html` — full spec

## Tokens

```css
:root{ color-scheme:light;
 --page:#FAFAFA; --surface:#FFFFFF; --map-ground:#F2F2F4;
 --ink:#1D1D1F; --ink-2:#48484A; --muted:#6E6E73; --line:#E5E5E7; --chip:#F5F5F7; --ring:#AEAEB2;
 --dot:#8C52FF;         /* primary (icons, text, active state) */
 --accent-fill:#6B3FCC; /* filled backgrounds behind white text (AA 7.0:1) */
 --on-accent:#FFFFFF; --warn:#D70015;
 --seal:#0A8282; --seal-ink:#067272; --seal-wash:#E6F3F3; /* "saved" teal */
 --shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.08);
 --sans:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI","Helvetica Neue",Helvetica,"PingFang TC","Noto Sans TC","Microsoft JhengHei",Arial,sans-serif;
 --serif:"Instrument Serif","Noto Serif TC","Songti TC","PMingLiU",serif;
 --mono:"IBM Plex Mono",ui-monospace,"SF Mono",Menlo,monospace;
 --dur-tap:120ms; --dur-ui:200ms; --dur-panel:300ms;
 --ease-standard:cubic-bezier(.4,0,.2,1); --ease-decel:cubic-bezier(0,0,.2,1); --ease-sheet:cubic-bezier(.32,.72,0,1); }
```

Dark mode: the same block twice, identical — under
`@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){…}}` and `:root[data-theme="dark"]{…}`:
`--page:#17171B; --surface:#202026; --map-ground:#1B1B20; --ink:#FAFAFA; --ink-2:#C7C7CC; --muted:#A1A1A6;
--line:#35353D; --chip:#2A2A31; --ring:#5A5A5F; --dot:#A978FF; --accent-fill:#A978FF; --on-accent:#0A0A0A;
--warn:#FF3B30; --seal:#5EC0C0; --seal-ink:#5EC0C0; --seal-wash:#2A3A3F; --shadow:0 1px 2px rgba(0,0,0,.5),0 8px 24px rgba(0,0,0,.55)`.
**CampusPass additions (contrast, QA round 1).** Measured with axe; all text now clears WCAG AA in
both themes:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--dot-ink` | `#6B3FCC` | `#C4A6FF` | Purple **small text** (links, badges, active labels). `--dot` stays for icons, rings and large text |
| `--warn-ink` | `#C00014` | `#FF6961` | Red text (field errors, "ends soon", shop errors) |
| `--on-warn` | `#FFFFFF` | `#0A0A0A` | Text on a `--warn` fill |
| `--seg-on` | `var(--surface)` | `#46464E` | Selected segment of a segmented control |
| `--qr-bg` / `--qr-ink` | `#FFFFFF` / `#48484A` | same | Pass QR stays dark-on-white in dark mode, so it scans |
| `--dur-pulse` / `--dur-sweep` | `1.2s` / `1.8s` | same | Looping skeleton pulse and pass shimmer |

Theme choice is stored in `localStorage cp_theme` (`light`/`dark`/absent = system) and applied by an
inline `<head>` script **before** CSS loads (no flash).

Fonts (CampusPass self-hosts glyph subsets in public/fonts/ instead): one Google Fonts request
`https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Noto+Serif+TC:wght@700&display=swap`
(wordmark only); the UI uses the system `--sans` stack (no web font for Chinese UI text).

Type: H1 32/1.2 600 -0.02em · H2 28 · H3 24/1.3 · H4 20 · H5 18/1.4 · body 15/1.5 -0.01em · small 13 · caption 12 ·
eyebrow 11/600/.14em uppercase. Dense app chrome: list name 15/600, meta 12.5 muted. Inputs ≥16px on phones
(no iOS zoom). Numbers `font-variant-numeric:tabular-nums`.

Spacing 4/8/12/16/24/32/48 · radii 6/8/12/16, pills 999px · tap targets ≥44px.
**Breakpoint 820px**: phone `max-width:820px`, desktop `min-width:821px`. Test at 360/390/414 and 1280.

Motion: animate only `transform`/`opacity`; every transition uses the duration/ease tokens (never raw values);
`prefers-reduced-motion` → durations 0ms.

## Components

- **Buttons**: `.btn{padding:10px 16px;font:500 14px;border-radius:8px}`; primary = `--accent-fill`/`--on-accent`;
  outline = surface + `1px solid #D2D2D7` (dark: `--line`); secondary = `--chip`; ghost = transparent, hover `--chip`;
  sm `8px 12px/13px`; lg `12px 32px/15px`; icon 40×40; disabled opacity .5; press `transform:scale(.97)`.
  Signature CTA pill (max one per screen): `padding:16px 32px;border-radius:999px;box-shadow:0 10px 30px rgba(140,82,255,.28)`.
- **Search field**: pill `border-radius:19px;background:var(--chip);height:36px` (40px on phone), 14px magnifier at left.
- **Filter pills**: `height:32px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:13px;white-space:nowrap`;
  selected `background:var(--accent-fill);color:var(--on-accent);border-color:transparent;font-weight:600`; count `.n` 12px muted.
  Row scrolls horizontally with masked edges, no scrollbar.
- **Chip/badge**: `padding:2px 10px;font:600 12px;border-radius:999px`; neutral chip `--chip`; tinted status `color-mix(in srgb,var(--dot) 13%,transparent)` + `--dot` text.
- **List rows** (bizmap `.item`): grid `minmax(0,1fr) auto`, `border-bottom:1px solid var(--line)`, padding `12px 16px`,
  name clamps to 2 lines, meta one line, trailing 36px star button.
- **Section card**: `padding:18px 20px;background:var(--surface);border:1px solid var(--line);border-radius:10px`.
- **Bottom sheet (phone)**: fixed, `border-radius:16px 16px 0 0;box-shadow:0 -2px 24px rgb(0 0 0/.13)`,
  `transition:transform var(--dur-panel) var(--ease-sheet)`, 44px grab area with a 40×5 `--line` bar, backdrop `rgba(0,0,0,.28)`.
- **Modal**: backdrop `rgb(0 0 0/.42)`, card `width:min(430px,100%);padding:18px;border-radius:14px`. One blocking dialog at a time.
- **Toast**: pill `padding:6px 12px;border-radius:999px;background:color-mix(in srgb,var(--ink) 88%,transparent);color:var(--surface);font-size:12px`.
- **Empty state**: centred 40px muted circle icon, 14px/500 title, 12px muted detail, optional action.
- **Avatar**: 30px circle; initials on `#6B3FCC` white.
- **Account menu**: `border-radius:12px;box-shadow:0 10px 34px rgba(0,0,0,.18)`, items `9px 10px` radius 7; segmented control on `--chip`, selected segment `--surface` + `0 1px 3px` shadow.

## App shell

- **Desktop (≥821px)**: fixed left rail `--rail-w:72px`, `background:var(--map-ground)`: logo mark at top, tabs
  (icon tile 56×32 radius 16 over an 11.5px label; active tile `color-mix(in srgb,var(--dot) 13%,transparent)` + `--dot`),
  avatar/account at the bottom. Content to the right.
- **Phone (≤820px)**: rail hidden. Top bar (safe-area aware) + content + **bottom tab bar**:
  fixed, `background:var(--surface)`, `padding-bottom:env(safe-area-inset-bottom)`, grid of equal columns, 52px tall,
  icon 21px over 11px label, colour `--ink-2`, `[aria-current=page]{color:var(--dot);font-weight:600}`, a 28px
  surface-colour fade above it instead of a border.
- Content widths: lists 760px, prose 680px.

## Brand & voice

- Wordmark: lowercase `campuspass`, Instrument Serif *italic* 400, `--dot`; Chinese 校園優惠 in Noto Serif TC 700.
- App icon: 512 canvas, `rect rx="104" fill="#8C52FF"` with a white mark.
- Icons: **Lucide only**, inline SVG, stroke 1.75 (rail 1.6, nav 1.8). No emoji icons; ☆/★ only for saved.
- i18n: zh first. `.i18n-zh`/`.i18n-en` spans with `html[data-lang]`:
  `:root[data-lang="en"] .i18n-zh{display:none} :root:not([data-lang="en"]) .i18n-en{display:none}`.
  Labels never wrap — shorten the English. Write 臺 not 台 in UI copy. Plain full sentences. Every number shows its source and date.

## PWA

- Manifest: `display:standalone`, `display_override:["standalone","minimal-ui"]`, `background_color:#FAFAFA`,
  `theme_color:#FFFFFF`, `lang:zh-Hant-TW`, icons svg/192/512 + maskable 512 (mark at 68%), shortcuts.
- Meta: `viewport-fit=cover`; two `theme-color` tags (`#FFFFFF` light / `#202026` dark via media);
  `mobile-web-app-capable` + `apple-mobile-web-app-capable`; status bar style `default`; `apple-mobile-web-app-title`.
- Standalone detection: `matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true`
  → `html.is-standalone`. Safe-area insets on top bar and bottom nav.
- Install prompt (bizmap `pwa.js`): phone only, never when standalone, max 3 asks (localStorage), × ends it,
  4s + idle delay, never over open sheets/dialogs; Android `beforeinstallprompt`, iOS Share → 加入主畫面 instructions.
