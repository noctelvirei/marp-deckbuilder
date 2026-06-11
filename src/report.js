import MarkdownIt from 'markdown-it'

import { splitFrontmatter } from './markdown.js'
import { compileReportComponents } from './report-components.js'
import {
  prepareReportPresentation,
  reportArticleClass,
  reportBodyClass,
  reportMainClass,
} from './report-layout.js'
import { normalizeResourceReference, resolveSurfaceResourceFile } from './resources.js'
import { resolveResourceUrls } from './render.js'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

export function renderReportHtml(source, options = {}) {
  const definitions = options.definitions || {}
  const brand = definitions.brand || {}
  const { frontmatter, body } = splitFrontmatter(source)
  const assetMap = options.collectResources ? new Map() : null
  const resolverOptions = {
    assetMap,
    inlineAssets: options.inlineAssets,
    assetUrlPrefix: options.assetUrlPrefix,
  }
  const title = frontmatter.title || firstHeading(body) || 'Report'
  const subtitle = frontmatter.subtitle || ''
  const prepared = normalizeReportImageReferences(body)
  const compiled = compileReportComponents(prepared, { brand, reportName: title })
  const presentation = prepareReportPresentation(markdown.render(compiled.source), frontmatter)
  const content = resolveResourceUrls(presentation.content, options.resourcesDir, resolverOptions)
  const css = resolveResourceUrls(reportCss(brand), options.resourcesDir, resolverOptions)
  const logo = reportLogo(brand, presentation.theme || 'light', options.resourcesDir)
  const document = resolveResourceUrls(
    reportDocument({
      title,
      subtitle,
      content,
      css,
      logo,
      brandName: brand.name || 'Brand',
      bodyClass: reportBodyClass(presentation.theme),
      mainClass: reportMainClass(presentation.theme),
      articleClass: reportArticleClass(presentation.hasLayout),
    }),
    options.resourcesDir,
    resolverOptions,
  )

  return {
    html: content,
    css,
    frontmatter,
    document,
    assets: assetMap
      ? [...assetMap.entries()].map(([relativePath, sourcePath]) => ({
          relativePath,
          sourcePath,
        }))
      : [],
  }
}

function normalizeReportImageReferences(source) {
  return String(source || '').replace(
    /!\[([^\]]*)]\(([^)\s]+)(\s+["'][^"']*["'])?\)/g,
    (full, alt, src, title = '') => {
      const normalized = normalizeResourceReference(src)
      return `![${alt}](${normalized}${title})`
    },
  )
}

function reportLogo(brand = {}, surface = 'light', resourcesDir = 'resources') {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return surfaceResourceReference(logo, resourcesDir, surface)
  const candidate =
    surface === 'dark'
      ? logo.reportDark ||
        logo.reportOnDark ||
        logo.companyDark ||
        logo.contentDark ||
        logo.dark ||
        logo.report ||
        logo.content ||
        logo.cover ||
        logo.default ||
        ''
      : logo.reportLight ||
        logo.reportOnLight ||
        logo.companyLight ||
        logo.contentLight ||
        logo.light ||
        logo.report ||
        logo.content ||
        logo.default ||
        logo.cover ||
        ''
  return surfaceResourceReference(candidate, resourcesDir, surface)
}

function surfaceResourceReference(src, resourcesDir, surface = 'light') {
  if (!src || /^(data|https?|file):/i.test(String(src))) return src
  try {
    return `resource:${resolveSurfaceResourceFile(src, resourcesDir, surface).relativePath}`
  } catch {
    return src
  }
}

function reportDocument({
  title,
  subtitle = '',
  content,
  css,
  logo = '',
  brandName = 'Brand',
  bodyClass = '',
  mainClass = 'deck-report',
  articleClass = 'report-body',
}) {
  const bodyClassAttr = bodyClass ? ` class="${escapeHtmlAttr(bodyClass)}"` : ''
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body${bodyClassAttr}>
  <main class="${escapeHtmlAttr(mainClass)}">
    <header class="report-cover">
      ${logo ? `<img class="report-logo" src="${escapeHtmlAttr(logo)}" alt="${escapeHtmlAttr(brandName)} logo">` : ''}
      <p class="report-kicker">Report</p>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="report-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </header>
    <article class="${escapeHtmlAttr(articleClass)}">
${content}
    </article>
  </main>
</body>
</html>
`
}

function reportCss(brand = {}) {
  const colors = brand.colors || {}
  const dark = hex(colors.dark, '060D18')
  const white = hex(colors.white, 'FFFFFF')
  const blue = hex(colors.blue, '0F82F5')
  const cyan = hex(colors.cyan, '59D6FD')
  const cardDark = hex(colors.cardDark, '0D1D36')
  const body = hex(colors.body, 'C8D8F0')
  const muted = hex(colors.muted, '8B9AB5')
  const border = hex(colors.border, '1E3A5F')
  const darkBody = hex(colors.bodyOnDark || colors.reportBodyDark, 'C8D8F0')
  const darkMuted = hex(colors.mutedOnDark || colors.reportMutedDark, '8B9AB5')
  const darkBorder = hex(colors.borderDark || colors.reportBorderDark, '1E3A5F')
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

.report-body {
  padding: 54px 76px 76px;
}

.report-body.report-body-has-layout {
  padding: 0;
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

.report-figure {
  margin: 28px auto;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-figure-normal {
  max-width: 760px;
}

.report-figure-narrow {
  max-width: 560px;
}

.report-figure-wide {
  max-width: 100%;
}

.report-figure img {
  display: block;
  width: 100%;
  border-radius: 6px;
}

.report-figure figcaption {
  display: grid;
  gap: 5px;
  margin-top: 12px;
  color: var(--text-dim, #64748b);
  font-size: 13px;
  line-height: 1.35;
}

.report-figure-caption {
  color: var(--text, #334155);
  font-weight: 600;
}

.report-figure-source {
  font-size: 12px;
}

.report-data-table {
  margin: 28px 0;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  overflow: hidden;
}

.report-data-table-title {
  padding: 18px 20px 0;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-data-table-scroll {
  overflow-x: auto;
}

.report-data-table table {
  width: 100%;
  min-width: 560px;
  margin: 0;
  border: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.report-data-table th,
.report-data-table td {
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid var(--border-dim, #e2e8f0);
  color: var(--text, #334155);
  text-align: left;
  vertical-align: middle;
}

.report-data-table-compact th,
.report-data-table-compact td {
  padding: 8px 10px;
  font-size: 12px;
}

.report-data-table th {
  background: var(--bg-subtle, #071228);
  color: var(--white, #ffffff);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-data-table tbody tr:nth-child(even) td {
  background: rgba(15, 130, 245, 0.04);
}

.report-data-table tbody tr:last-child td {
  border-bottom: 0;
}

.report-data-table tfoot td {
  border-top: 2px solid var(--border, #dbe5f2);
  border-bottom: 0;
  background: rgba(15, 130, 245, 0.09);
  color: var(--text, #0f172a);
  font-weight: 750;
}

.report-data-table-cell-number,
.report-data-table-cell-percent {
  font-family: Consolas, "SFMono-Regular", monospace;
  white-space: nowrap;
}

.report-data-table .report-data-table-align-left {
  text-align: left;
}

.report-data-table .report-data-table-align-center {
  text-align: center;
}

.report-data-table .report-data-table-align-right {
  text-align: right;
}

.report-data-table-cell-status {
  white-space: nowrap;
}

.report-data-table-highlight-blue td,
.report-data-table-cell.report-data-table-highlight-blue {
  background: rgba(15, 130, 245, 0.16);
}

.report-data-table-highlight-green td,
.report-data-table-cell.report-data-table-highlight-green {
  background: rgba(31, 169, 93, 0.16);
}

.report-data-table-highlight-orange td,
.report-data-table-cell.report-data-table-highlight-orange {
  background: rgba(245, 158, 11, 0.18);
}

.report-data-table-highlight-red td,
.report-data-table-cell.report-data-table-highlight-red {
  background: rgba(239, 68, 68, 0.16);
}

.report-data-table-highlight-muted td,
.report-data-table-cell.report-data-table-highlight-muted {
  background: rgba(100, 116, 139, 0.14);
}

.report-data-table figcaption {
  display: grid;
  gap: 5px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--border-dim, #e2e8f0);
  color: var(--text-dim, #64748b);
  font-size: 12px;
  line-height: 1.35;
}

.report-data-table-caption {
  color: var(--text, #334155);
  font-weight: 600;
}

.report-data-table-source {
  font-size: 12px;
}

.report-key-values {
  margin: 24px 0;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-key-values-title {
  margin: 0 0 14px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-key-values dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.report-key-values-1 dl {
  grid-template-columns: minmax(0, 1fr);
}

.report-key-values-3 dl {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.report-key-values-4 dl {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.report-key-value {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-dim, #e2e8f0);
  border-radius: 6px;
  background: var(--bg-subtle, #f8fbff);
}

.report-key-value dt {
  margin: 0 0 5px;
  color: var(--text-dim, #64748b);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-key-value dd {
  min-width: 0;
  margin: 0;
  color: var(--text, #0f172a);
  font-size: 15px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.report-source-note {
  margin: 22px 0;
  padding: 13px 16px;
  border: 1px solid var(--border-dim, #e2e8f0);
  border-left: 4px solid var(--cyan, var(--report-cyan, #59D6FD));
  border-radius: 7px;
  background: rgba(89, 214, 253, 0.07);
  color: var(--text-dim, #64748b);
}

.report-source-note-title {
  margin-bottom: 4px;
  color: var(--text, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.report-source-note-body {
  color: var(--text, #334155);
  font-size: 13px;
  line-height: 1.45;
}

.report-source-note-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 7px;
  color: var(--text-dim, #64748b);
  font-size: 12px;
}

.report-card-grid {
  margin: 28px 0;
}

.report-card-grid-title {
  margin: 0 0 14px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-card-grid-items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.report-card-grid-1 .report-card-grid-items {
  grid-template-columns: minmax(0, 1fr);
}

.report-card-grid-2 .report-card-grid-items {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.report-card-grid-4 .report-card-grid-items {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.report-card-grid-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border, #dbe5f2);
  border-top: 4px solid var(--report-card-accent, var(--blue, #0F82F5));
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-card-grid-card-title {
  margin-bottom: 7px;
  color: var(--report-card-accent, var(--blue, #0F82F5));
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-card-grid-card-body {
  min-width: 0;
  color: var(--text, #334155);
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.report-card-grid-card-blue { --report-card-accent: var(--blue, #0F82F5); }
.report-card-grid-card-cyan { --report-card-accent: var(--cyan, #59D6FD); }
.report-card-grid-card-purple { --report-card-accent: var(--purple, #5143D5); }
.report-card-grid-card-green { --report-card-accent: var(--green, #16a34a); }
.report-card-grid-card-orange { --report-card-accent: var(--orange, #F9935B); }
.report-card-grid-card-red { --report-card-accent: var(--red, #dc2626); }

.report-timeline {
  margin: 28px 0;
}

.report-timeline-title {
  margin: 0 0 16px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-timeline ol {
  position: relative;
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.report-timeline ol::before {
  content: "";
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 11px;
  width: 2px;
  background: var(--border, #dbe5f2);
}

.report-timeline-event {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
}

.report-timeline-marker {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  border: 4px solid var(--bg, #ffffff);
  border-radius: 999px;
  background: var(--report-timeline-color, var(--blue, #0F82F5));
  box-shadow: 0 0 0 1px var(--border, #dbe5f2);
}

.report-timeline-content {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-timeline-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}

.report-timeline-date {
  color: var(--text-dim, #64748b);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.report-timeline-event-title {
  color: var(--text, #0f172a);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
}

.report-timeline-event-body {
  margin-top: 5px;
  color: var(--text, #334155);
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.report-timeline-event-blue { --report-timeline-color: var(--blue, #0F82F5); }
.report-timeline-event-green { --report-timeline-color: var(--green, #16a34a); }
.report-timeline-event-orange { --report-timeline-color: var(--orange, #F9935B); }
.report-timeline-event-red { --report-timeline-color: var(--red, #dc2626); }
.report-timeline-event-muted { --report-timeline-color: var(--text-dim, #64748b); }

.report-chart {
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.report-chart-title {
  margin: 0 0 16px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-chart-stage {
  position: relative;
  width: 100%;
  min-height: 180px;
}

.report-chart-stage canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.report-chart-plot {
  position: relative;
  width: 100%;
  height: 100%;
}

.report-chart-plot svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.report-chart-floating-tooltip {
  position: absolute;
  z-index: 2;
  max-width: 240px;
  padding: 9px 11px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.35));
  border-radius: 6px;
  background: var(--bg-card, rgba(15, 23, 42, 0.94));
  color: var(--text, #ffffff);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 10px));
  white-space: nowrap;
}

.report-chart-floating-tooltip[hidden] {
  display: none;
}

.report-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin: 22px 0;
}

.report-metric {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  text-align: center;
}

.report-metric-value {
  margin-bottom: 6px;
  color: var(--text, #0b1220);
  font-size: 31px;
  font-weight: 300;
  line-height: 1;
}

.report-metric-label {
  color: var(--text-dim, #64748b);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-metric-sub {
  margin-top: 8px;
  color: var(--green, #16a34a);
  font-size: 13px;
}

.report-metric-sub.down {
  color: var(--red, #dc2626);
}

.report-metric-blue .report-metric-value { color: var(--blue, #0F82F5); }
.report-metric-cyan .report-metric-value { color: var(--cyan, #59D6FD); }
.report-metric-purple .report-metric-value { color: var(--purple, #5143D5); }
.report-metric-green .report-metric-value { color: var(--green, #16a34a); }
.report-metric-orange .report-metric-value { color: var(--orange, #F9935B); }
.report-metric-red .report-metric-value { color: var(--red, #dc2626); }

.report-rate-bars {
  margin: 28px 0;
}

.report-rate-bars-title {
  margin: 0 0 16px;
  color: var(--text-dim, #334155);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-rate-bar {
  display: grid;
  grid-template-columns: minmax(84px, 128px) minmax(0, 1fr) max-content;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.report-rate-label {
  min-width: 0;
  color: var(--text, #0f172a);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.report-rate-track {
  position: relative;
  min-width: 0;
  height: 24px;
  border: 1px solid var(--border, #dbe5f2);
  border-radius: 5px;
  background: var(--bg-subtle, #e8f4fe);
  overflow: hidden;
}

.report-rate-fill {
  width: var(--report-rate-width, 0%);
  height: 100%;
  border-radius: 4px;
  background: var(--report-rate-color, var(--report-blue, #0F82F5));
}

.report-rate-value {
  position: absolute;
  inset: 0 auto 0 10px;
  display: flex;
  align-items: center;
  max-width: calc(100% - 20px);
  color: var(--white, #ffffff);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-rate-pct {
  min-width: 46px;
  color: var(--text-dim, #64748b);
  font-family: "Consolas", "SFMono-Regular", monospace;
  font-size: 12px;
  text-align: right;
}

.report-callout {
  margin: 22px 0;
  padding: 16px 18px;
  border: 1px solid var(--report-callout-border, rgba(15, 130, 245, 0.32));
  border-left-width: 5px;
  border-radius: 8px;
  background: var(--report-callout-bg, rgba(15, 130, 245, 0.08));
  color: var(--report-callout-text, var(--text, #0f172a));
}

.report-callout-title {
  margin-bottom: 4px;
  color: var(--report-callout-title, var(--text, #0f172a));
  font-size: 14px;
  font-weight: 700;
}

.report-callout-body {
  color: var(--report-callout-text, var(--text, #334155));
  font-size: 15px;
}

.report-callout-info {
  --report-callout-bg: rgba(15, 130, 245, 0.1);
  --report-callout-border: rgba(15, 130, 245, 0.38);
  --report-callout-title: var(--blue, #0F82F5);
}

.report-callout-warning {
  --report-callout-bg: rgba(249, 147, 91, 0.12);
  --report-callout-border: rgba(249, 147, 91, 0.42);
  --report-callout-title: var(--orange, #F9935B);
}

.report-callout-success {
  --report-callout-bg: rgba(102, 204, 142, 0.12);
  --report-callout-border: rgba(102, 204, 142, 0.42);
  --report-callout-title: var(--green, #16a34a);
}

.report-callout-danger {
  --report-callout-bg: rgba(252, 81, 97, 0.12);
  --report-callout-border: rgba(252, 81, 97, 0.44);
  --report-callout-title: var(--red, #dc2626);
}

.report-accent-card {
  margin: 22px 0;
  padding: 18px 20px;
  border: 1px solid var(--border, #dbe5f2);
  border-top: 4px solid var(--report-accent-color, var(--blue, #0F82F5));
  border-radius: 8px;
  background: var(--bg-card, #ffffff);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-accent-card-title {
  margin-bottom: 7px;
  color: var(--report-accent-color, var(--blue, #0F82F5));
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.report-accent-card-body {
  min-width: 0;
  color: var(--text, #334155);
  font-size: 15px;
  overflow-wrap: anywhere;
}

.report-accent-card-blue { --report-accent-color: var(--blue, #0F82F5); }
.report-accent-card-cyan { --report-accent-color: var(--cyan, #59D6FD); }
.report-accent-card-purple { --report-accent-color: var(--purple, #5143D5); }
.report-accent-card-green { --report-accent-color: var(--green, #16a34a); }
.report-accent-card-orange { --report-accent-color: var(--orange, #F9935B); }
.report-accent-card-red { --report-accent-color: var(--red, #dc2626); }

.report-badge {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  max-width: 100%;
  padding: 3px 8px;
  border: 1px solid var(--report-badge-border, rgba(100, 116, 139, 0.32));
  border-radius: 999px;
  background: var(--report-badge-bg, rgba(100, 116, 139, 0.1));
  color: var(--report-badge-text, #475569);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.1;
  text-transform: uppercase;
  vertical-align: middle;
  white-space: nowrap;
}

.report-badge-blue {
  --report-badge-bg: rgba(15, 130, 245, 0.12);
  --report-badge-border: rgba(15, 130, 245, 0.35);
  --report-badge-text: var(--blue, #0F82F5);
}

.report-badge-green {
  --report-badge-bg: rgba(102, 204, 142, 0.12);
  --report-badge-border: rgba(102, 204, 142, 0.35);
  --report-badge-text: var(--green, #16a34a);
}

.report-badge-orange {
  --report-badge-bg: rgba(249, 147, 91, 0.12);
  --report-badge-border: rgba(249, 147, 91, 0.35);
  --report-badge-text: var(--orange, #F9935B);
}

.report-badge-red {
  --report-badge-bg: rgba(252, 81, 97, 0.12);
  --report-badge-border: rgba(252, 81, 97, 0.38);
  --report-badge-text: var(--red, #dc2626);
}

.report-badge-muted {
  --report-badge-bg: rgba(139, 154, 181, 0.1);
  --report-badge-border: rgba(139, 154, 181, 0.28);
  --report-badge-text: var(--text-dim, #64748b);
}

.report-layout {
  display: grid;
  grid-template-columns: minmax(160px, 200px) minmax(0, 1fr);
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

.report-sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  padding: 20px;
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  background: #f8fbff;
}

.report-sidebar-title {
  margin-bottom: 12px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.report-sidebar a {
  display: block;
  padding: 7px 10px;
  border-radius: 4px;
  color: #475569;
  font-size: 13px;
  text-decoration: none;
}

.report-sidebar a:hover {
  background: #e8f4fe;
  color: #0F82F5;
}

.report-main {
  min-width: 0;
  padding: 32px 40px 60px;
}

body.report-theme-dark-page {
  --bg: #060D18;
  --bg-card: #${cardDark};
  --bg-subtle: #071228;
  --border: #${darkBorder};
  --border-dim: rgba(30, 58, 95, 0.45);
  --blue: #${blue};
  --cyan: #${cyan};
  --purple: #${hex(colors.purple, '5143D5')};
  --green: #${hex(colors.green, '66CC8E')};
  --orange: #${hex(colors.orange, 'F9935B')};
  --red: #${hex(colors.red, 'FC5161')};
  --white: #${white};
  --text: #${darkBody};
  --text-dim: #${darkMuted};
  background: var(--bg);
  color: var(--text);
}

.deck-report.report-theme-dark {
  max-width: 1200px;
  background: var(--bg-subtle);
  color: var(--text);
  box-shadow: none;
}

.deck-report.report-theme-dark .report-cover {
  background: linear-gradient(135deg, var(--bg), #0a1730);
}

.deck-report.report-theme-dark .report-body h1,
.deck-report.report-theme-dark .report-body h2,
.deck-report.report-theme-dark .report-body h3 {
  color: var(--cyan);
}

.deck-report.report-theme-dark .report-body h2 {
  border-top: 0;
  border-bottom: 1px solid var(--border);
  font-size: 1.15rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-bottom: 8px;
}

.deck-report.report-theme-dark .report-body p,
.deck-report.report-theme-dark .report-body li {
  color: var(--text);
}

.deck-report.report-theme-dark .report-body table {
  color: var(--text);
  font-size: 14px;
}

.deck-report.report-theme-dark .report-body th {
  border-color: var(--border);
  background: var(--bg-card);
  color: var(--white);
}

.deck-report.report-theme-dark .report-body td {
  border-color: var(--border-dim);
  color: var(--text);
}

.deck-report.report-theme-dark .report-body tr:nth-child(even) td {
  background: rgba(13, 31, 56, 0.4);
}

.deck-report.report-theme-dark .report-sidebar {
  border-color: var(--border);
  background: var(--bg-card);
}

.deck-report.report-theme-dark .report-sidebar-title {
  color: var(--text-dim);
}

.deck-report.report-theme-dark .report-sidebar a {
  color: var(--text-dim);
}

.deck-report.report-theme-dark .report-sidebar a:hover {
  background: rgba(89, 214, 253, 0.08);
  color: var(--cyan);
}

.deck-report.report-theme-dark .report-chart {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-data-table {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-key-values {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-card-grid-card {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-timeline-content {
  box-shadow: none;
}

.deck-report.report-theme-dark .report-accent-card {
  box-shadow: none;
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

@media (max-width: 760px) {
  .report-cover {
    padding: 54px 32px 60px;
  }

  .report-cover h1 {
    font-size: 44px;
  }

  .report-body {
    padding: 40px 32px 56px;
  }

  .report-layout {
    display: block;
    padding: 24px;
  }

  .report-sidebar {
    position: static;
    margin-bottom: 24px;
  }

  .report-main {
    padding: 0;
  }

  .report-key-values dl,
  .report-key-values-3 dl,
  .report-key-values-4 dl,
  .report-card-grid-items,
  .report-card-grid-2 .report-card-grid-items,
  .report-card-grid-4 .report-card-grid-items {
    grid-template-columns: minmax(0, 1fr);
  }
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
    right: 0;
  }

  .report-body {
    padding: 34px 0 0;
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
`
}

function firstHeading(source) {
  const match = String(source || '').match(/^\s*#\s+(.+)$/m)
  return match ? stripInline(match[1]) : ''
}

function stripInline(value) {
  return String(value || '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim()
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeHtmlAttr(value) {
  return escapeHtml(value)
}
