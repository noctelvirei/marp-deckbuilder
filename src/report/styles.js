export function reportCss(brand = {}, frontmatter = {}, themeCss = '') {
  const colors = brand.colors || {}
  const darkSurface = reportSurfaceToken(frontmatter) === 'dark'
  const dark = hex(colors.dark, '060D18')
  const white = hex(colors.white, 'FFFFFF')
  const blue = hex(colors.blue, '0F82F5')
  const cyan = hex(colors.cyan, '59D6FD')
  const cardDark = hex(colors.cardDark, '0D1D36')
  const body = hex(darkSurface ? colors.bodyOnDark : colors.body, darkSurface ? 'C8D8F0' : '444444')
  const muted = hex(darkSurface ? colors.mutedOnDark : colors.muted, darkSurface ? '8B9AB5' : '64748B')
  const border = hex(darkSurface ? colors.borderOnDark : colors.border, darkSurface ? '1E3A5F' : 'DBE5F2')
  const font = fontFamily(brand)
  const background = brand.assets?.backgrounds?.content || ''
  const backgroundRule = background
    ? `
.report-cover {
  background-image: linear-gradient(90deg, rgba(6, 13, 24, 0.96), rgba(6, 13, 24, 0.78)), url("${escapeCssUrl(background)}");
  background-size: cover;
  background-position: center;
}`
    : ''

  return `
:root {
  color-scheme: light;
  --report-dark: #${dark};
  --report-white: #${white};
  --report-blue: #${blue};
  --report-cyan: #${cyan};
  --report-card: #${cardDark};
  --report-body: #${body};
  --report-muted: #${muted};
  --report-border: #${border};
  --report-purple: #${hex(colors.purple, '5143D5')};
  --report-green: #${hex(colors.green, '66CC8E')};
  --report-orange: #${hex(colors.orange, 'F99358')};
  --report-red: #${hex(colors.red, 'FC5161')};
  --report-yellow: #${hex(colors.yellow, 'FBC546')};
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f4f7fb;
  color: #111827;
  font-family: ${font};
  line-height: 1.62;
}

.deck-report {
  max-width: 1080px;
  margin: 0 auto;
  background: #ffffff;
  min-height: 100vh;
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12);
}

.deck-report.report-dark {
  max-width: 1200px;
  background: #071228;
  color: var(--report-body);
  box-shadow: none;
}

.report-cover {
  position: relative;
  min-height: 310px;
  padding: 64px 76px 72px;
  background: linear-gradient(135deg, var(--report-dark), #0a1730);
  color: var(--report-white);
  overflow: hidden;
}

.report-cover::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--report-blue), var(--report-cyan));
}

.report-logo {
  position: absolute;
  top: 34px;
  left: 56px;
  max-width: 150px;
  max-height: 42px;
  object-fit: contain;
}

.report-customer-logo {
  position: absolute;
  top: 34px;
  right: 56px;
  max-width: 150px;
  max-height: 42px;
  object-fit: contain;
}

.report-kicker {
  margin: 0 0 14px;
  color: var(--report-cyan);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-cover h1 {
  max-width: 780px;
  margin: 0;
  color: var(--report-white);
  font-size: 48px;
  font-weight: 500;
  line-height: 1.08;
}

.report-subtitle {
  max-width: 760px;
  margin: 22px 0 0;
  color: var(--report-body);
  font-size: 21px;
}

.report-layout {
  padding: 54px 76px 76px;
}

.report-layout.has-toc {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 42px;
  align-items: start;
}

.report-toc {
  position: sticky;
  top: 24px;
  padding: 18px;
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  background: #f8fbff;
}

.report-toc-title {
  margin-bottom: 10px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.report-toc a {
  display: block;
  padding: 7px 9px;
  border-radius: 5px;
  color: #475569;
  font-size: 13px;
  text-decoration: none;
}

.report-toc a:hover {
  background: #eef6fe;
  color: #${blue};
}

.report-body {
  min-width: 0;
}

.report-body > *:first-child {
  margin-top: 0;
}

.report-body h1,
.report-body h2,
.report-body h3 {
  color: #0b1220;
  line-height: 1.18;
}

.report-body h1 {
  margin: 46px 0 18px;
  font-size: 34px;
}

.report-body h2 {
  margin: 42px 0 16px;
  padding-top: 18px;
  border-top: 1px solid #dbe5f2;
  font-size: 27px;
}

.report-body h3 {
  margin: 30px 0 10px;
  font-size: 20px;
}

.report-body p,
.report-body li {
  font-size: 16px;
}

.report-body a {
  color: #${blue};
}

.report-body blockquote {
  margin: 28px 0;
  padding: 18px 22px;
  border-left: 5px solid #${blue};
  background: #eef6fe;
  color: #1f2937;
}

.r-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin: 22px 0;
}

.r-metric,
.r-card,
.r-card-accent,
.r-chart-wrap {
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  background: #f8fbff;
}

.r-metric {
  padding: 18px;
  text-align: center;
}

.r-metric-value {
  margin-bottom: 5px;
  color: #0b1220;
  font-size: 31px;
  font-weight: 400;
  line-height: 1;
}

.r-metric-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.r-metric-sub {
  margin-top: 7px;
  color: var(--report-green);
  font-size: 13px;
}

.r-metric-sub.down {
  color: var(--report-red);
}

.r-card,
.r-card-accent,
.r-chart-wrap {
  margin: 18px 0;
  padding: 22px;
}

.r-card-accent {
  border-top: 3px solid var(--report-blue);
}

.r-card-accent.cyan { border-top-color: var(--report-cyan); }
.r-card-accent.green { border-top-color: var(--report-green); }
.r-card-accent.orange { border-top-color: var(--report-orange); }
.r-card-accent.red { border-top-color: var(--report-red); }
.r-card-accent.purple { border-top-color: var(--report-purple); }

.r-chart-title {
  margin-bottom: 16px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.r-callout {
  margin: 18px 0;
  padding: 14px 18px;
  border: 1px solid #dbe5f2;
  border-left: 4px solid var(--report-blue);
  border-radius: 0 8px 8px 0;
  background: #eef6fe;
}

.r-callout.warning { border-left-color: var(--report-orange); background: rgba(249, 147, 88, .12); }
.r-callout.success { border-left-color: var(--report-green); background: rgba(102, 204, 142, .12); }
.r-callout.danger { border-left-color: var(--report-red); background: rgba(252, 81, 97, .1); }

.r-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.r-badge.blue { background: rgba(15, 130, 245, .12); color: var(--report-blue); border-color: rgba(15, 130, 245, .35); }
.r-badge.green { background: rgba(102, 204, 142, .12); color: var(--report-green); border-color: rgba(102, 204, 142, .35); }
.r-badge.orange { background: rgba(249, 147, 88, .12); color: var(--report-orange); border-color: rgba(249, 147, 88, .35); }
.r-badge.red { background: rgba(252, 81, 97, .1); color: var(--report-red); border-color: rgba(252, 81, 97, .35); }
.r-badge.muted { background: rgba(100, 116, 139, .1); color: #64748b; border-color: rgba(100, 116, 139, .25); }

.report-dark .report-body h1,
.report-dark .report-body h2,
.report-dark .report-body h3 {
  color: var(--report-white);
}

.report-dark .report-body h2 {
  border-top-color: var(--report-border);
}

.report-dark .report-body p,
.report-dark .report-body li,
.report-dark .report-body td {
  color: var(--report-body);
}

.report-dark .report-body a,
.report-dark .report-toc a:hover {
  color: var(--report-cyan);
}

.report-dark .report-body th {
  background: var(--report-card);
  border-color: var(--report-border);
}

.report-dark .report-body td {
  border-color: rgba(30, 58, 95, .55);
}

.report-dark .report-body tr:nth-child(even) td {
  background: rgba(13, 29, 54, .5);
}

.report-dark .report-body blockquote,
.report-dark .r-card,
.report-dark .r-card-accent,
.report-dark .r-chart-wrap,
.report-dark .r-metric {
  border-color: var(--report-border);
  background: var(--report-card);
}

.report-dark .report-toc {
  border-color: var(--report-border);
  background: var(--report-card);
}

.report-dark .report-toc-title,
.report-dark .report-toc a,
.report-dark .r-chart-title,
.report-dark .r-metric-label {
  color: var(--report-muted);
}

.report-dark .report-toc a:hover {
  background: rgba(89, 214, 253, .08);
}

.report-dark .r-metric-value {
  color: var(--report-white);
}

.report-dark code {
  border-color: var(--report-border);
  background: var(--report-card);
  color: var(--report-cyan);
}

.report-body table {
  width: 100%;
  margin: 28px 0;
  border-collapse: collapse;
  font-size: 14px;
}

.report-body th,
.report-body td {
  padding: 12px 14px;
  border: 1px solid #dbe5f2;
  text-align: left;
  vertical-align: top;
}

.report-body th {
  background: #071228;
  color: #ffffff;
  font-weight: 600;
}

.report-body tr:nth-child(even) td {
  background: #f8fbff;
}

.report-body img,
.report-body svg {
  max-width: 100%;
  height: auto;
}

.report-body hr {
  margin: 42px 0;
  border: 0;
  border-top: 1px solid #dbe5f2;
}

pre,
code {
  font-family: Consolas, "SFMono-Regular", monospace;
}

pre {
  overflow-x: auto;
  padding: 16px 18px;
  border: 1px solid #dbe5f2;
  background: #071228;
  color: #e2e8f0;
}

code {
  padding: 2px 5px;
  border-radius: 4px;
  background: #eef2f7;
}

pre code {
  padding: 0;
  background: transparent;
}

${backgroundRule}

@page {
  size: A4;
  margin: 14mm;
}

@media print {
  body {
    background: #ffffff;
  }

  .deck-report {
    max-width: none;
    box-shadow: none;
  }

  .report-cover {
    min-height: 220px;
    padding: 34px 0 42px;
    background: #${dark} !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .report-logo {
    top: 22px;
    left: 0;
  }

  .report-customer-logo {
    top: 22px;
    right: 0;
  }

  .report-body {
    padding: 0;
  }

  .report-layout {
    display: block;
    padding: 34px 0 0;
  }

  .report-toc {
    display: none;
  }

  .report-body h1,
  .report-body h2 {
    break-after: avoid;
  }

  .report-body table,
  .report-body blockquote,
  pre {
    break-inside: avoid;
  }
}
${reportRichCss(themeCss)}
`
}

function reportRichCss(themeCss = '') {
  const richCss = richHtmlCssFromTheme(themeCss)

  return `
${richCss}

.report-rich-block {
  margin: 30px 0;
  break-inside: avoid;
}

.report-rich-block .deck-rich {
  position: relative;
  inset: auto;
  width: 100%;
  height: 560px;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--report-border);
  border-radius: 8px;
  box-shadow: 0 18px 50px rgba(6, 13, 24, .12);
}

.report-rich-block .deck-rich-cover,
.report-rich-block .deck-particle-network,
.report-rich-block .deck-rich-close {
  min-height: 520px;
}

.report-rich-block .deck-rich-cover .s1-h1 {
  font-size: clamp(42px, 6vw, 76px);
}

.report-rich-block .deck-rich .s-title {
  font-size: clamp(24px, 3vw, 30px);
}

.report-rich-block .deck-rich .rings {
  gap: 18px;
}

.report-rich-block .deck-rich .ring-c {
  width: 180px;
  height: 180px;
}

.report-rich-block .deck-rich .book {
  width: min(700px, 90%);
}

.report-rich-block .deck-rich .rad-layout,
.report-rich-block .deck-rich .gauge-layout,
.report-rich-block .deck-rich .dn-layout {
  gap: 24px;
}

@media print {
  .report-rich-block {
    margin: 22px 0;
    break-inside: avoid;
  }

  .report-rich-block .deck-rich {
    height: auto;
    min-height: 420px;
    box-shadow: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
`
}

function richHtmlCssFromTheme(themeCss = '') {
  const marker = '/* Renderer-owned rich HTML components.'
  const endMarker = '/* End renderer-owned rich HTML components. */'
  const markerIndex = String(themeCss || '').indexOf(marker)
  if (markerIndex < 0) return ''
  const endMarkerIndex = String(themeCss).indexOf(endMarker, markerIndex)
  if (endMarkerIndex < 0) return String(themeCss).slice(markerIndex).trimStart()
  return String(themeCss)
    .slice(markerIndex, endMarkerIndex + endMarker.length)
    .trimStart()
}

function reportSurfaceToken(frontmatter = {}) {
  const token = String(frontmatter.surface || frontmatter.reportSurface || frontmatter.reportTheme || frontmatter.theme || '')
    .trim()
    .toLowerCase()
  return ['dark', 'navy', 'black'].includes(token) ? 'dark' : 'light'
}

function fontFamily(brand = {}) {
  const fonts = brand.fonts || {}
  return `"${fonts.regular || 'Poppins'}", "${fonts.fallback || 'Segoe UI'}", Arial, sans-serif`
}

function hex(value, fallback) {
  return String(value || fallback).replace(/^#/, '')
}

function escapeCssUrl(value) {
  return String(value).replace(/["\\\n\r\f]/g, '\\$&')
}


