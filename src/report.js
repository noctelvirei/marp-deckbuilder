import MarkdownIt from 'markdown-it'

import { splitFrontmatter } from './markdown.js'
import { compileReportComponents } from './report-components.js'
import { normalizeResourceReference } from './resources.js'
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
  const content = resolveResourceUrls(markdown.render(compiled.source), options.resourcesDir, resolverOptions)
  const css = resolveResourceUrls(reportCss(brand), options.resourcesDir, resolverOptions)
  const logo = reportLogo(brand)
  const document = resolveResourceUrls(
    reportDocument({
      title,
      subtitle,
      content,
      css,
      logo,
      brandName: brand.name || 'Brand',
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

function reportLogo(brand = {}) {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  return logo.report || logo.default || logo.content || logo.cover || ''
}

function reportDocument({
  title,
  subtitle = '',
  content,
  css,
  logo = '',
  brandName = 'Brand',
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <main class="deck-report">
    <header class="report-cover">
      ${logo ? `<img class="report-logo" src="${escapeHtmlAttr(logo)}" alt="${escapeHtmlAttr(brandName)} logo">` : ''}
      <p class="report-kicker">Report</p>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="report-subtitle">${escapeHtml(subtitle)}</p>` : ''}
    </header>
    <article class="report-body">
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
