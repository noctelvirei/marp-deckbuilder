import { Marp } from '@marp-team/marp-core'
import { Element } from '@marp-team/marpit'
import { pathToFileURL } from 'node:url'

import { buildMarpMarkdown } from './markdown.js'
import {
  normalizeResourceReference,
  resolveResourceFile,
  resolveSurfaceResourceFile,
  resourceToDataUri,
} from './resources.js'

export function renderDeckHtml(deck, options = {}) {
  const definitions = options.definitions
  const htmlDeck = {
    ...deck,
    slides: deck.slides
      .filter((slide) => !shouldSkipHtml(slide))
      .map((slide) => ({
        ...slide,
        source: prepareHtmlSource(applyHtmlBranding(slide, options.definitions?.brand, options.resourcesDir)),
      })),
  }
  const marp = new Marp({
    html: true,
    container: new Element('div', { id: ':$p' }),
    inlineSVG: true,
    slideContainer: [],
  })
  const assetMap = options.collectResources ? new Map() : null
  const resolverOptions = {
    assetMap,
    inlineAssets: options.inlineAssets,
    assetUrlPrefix: options.assetUrlPrefix,
  }
  const themeCss = resolveResourceUrls(
    [
      definitions.themeCss,
      brandBackgroundCss(definitions.brand),
      brandSurfaceCss(definitions.brand),
      brandLogoCss(definitions.brand),
    ]
      .filter(Boolean)
      .join('\n'),
    options.resourcesDir,
    resolverOptions,
  )
  marp.themeSet.add(themeCss)

  const markdown = resolveResourceUrls(
    buildMarpMarkdown(htmlDeck, { themeName: definitions.brand.themeName }),
    options.resourcesDir,
    resolverOptions,
  )
  const { html, css, comments } = marp.render(markdown)

  return {
    html,
    css,
    comments,
    document: htmlDocument({
      html,
      css,
      deckbuilderCss: themeCss,
      comments,
      bespokeCss: definitions.bespokeCss,
      bespokeJs: definitions.bespokeJs,
      title: deck.frontmatter.title || 'Deck',
    }),
    assets: assetMap
      ? [...assetMap.entries()].map(([relativePath, sourcePath]) => ({
          relativePath,
          sourcePath,
        }))
      : [],
  }
}

export function brandBackgroundCss(brand = {}) {
  const backgrounds = brand.assets?.backgrounds || {}
  const rules = [
    backgroundRule('section', backgrounds.content || backgrounds.default),
    lightBackgroundRule(backgrounds.light || backgrounds.contentLight),
    backgroundRule('section.cover', backgrounds.cover),
    backgroundRule(
      'section.deck-divider-slide, section:has(.deck-divider), .deck-divider',
      backgrounds.divider || backgrounds.cover,
    ),
    backgroundRule(
      'section.deck-close-slide, section:has(.deck-close), .deck-close',
      backgrounds.close || backgrounds.cover,
    ),
  ].filter(Boolean)

  return rules.length ? rules.join('\n') : ''
}

export function brandLogoCss(brand = {}) {
  const companyBox = brand.layouts?.companyLogo || brand.layouts?.logo || { x: 36, y: 21, w: 98, h: 24 }
  const customerBox = brand.layouts?.customerLogo || { x: 828, y: 21, w: 98, h: 24 }
  return `.deck-brand-logo,
.deck-company-logo {
  position: absolute;
  left: ${ptToPxCss(brand, companyBox.x)};
  top: ${ptToPxCss(brand, companyBox.y)};
  width: ${ptToPxCss(brand, companyBox.w)};
  height: ${ptToPxCss(brand, companyBox.h)};
  display: block;
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
}

.deck-customer-logo-frame {
  position: absolute;
  left: ${ptToPxCss(brand, customerBox.x)};
  top: ${ptToPxCss(brand, customerBox.y)};
  width: ${ptToPxCss(brand, customerBox.w)};
  height: ${ptToPxCss(brand, customerBox.h)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
}

${customerLogoBackplateEnabled(brand) ? `.deck-customer-logo-frame.deck-logo-on-dark {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 4px;
}` : ''}

.deck-customer-logo {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: none !important;
  mix-blend-mode: normal !important;
}`
}

export function brandSurfaceCss(brand = {}) {
  const darkBackground = cssColor(brand, 'backgroundDark', cssColor(brand, 'dark', '090909'))
  const lightBackground = cssColor(brand, 'backgroundLight', cssColor(brand, 'white', 'FFFFFF'))
  const darkText = readableDarkCssColor(brand, 'body', 'C8D8F0')
  const darkMuted = readableDarkCssColor(brand, 'muted', '8B9AB5')
  const darkHeading = readableDarkCssColor(brand, 'white', 'FFFFFF')
  const darkCard = cssColor(brand, 'cardDark', cssColor(brand, 'cardLight', '0D1D36'))
  const darkBorder = cssColor(brand, 'border', '1E3A5F')
  const lightHeading = cssColor(brand, 'headingLight', '090909')
  const lightText = cssColor(brand, 'bodyLight', '444444')
  const lightMuted = cssColor(brand, 'mutedLight', '666666')
  const lightCard = cssColor(brand, 'cardFillLight', 'FDFDFD')
  const lightBorder = cssColor(brand, 'borderLight', 'DEDEDE')

  return `section.dark {
  background-color: ${darkBackground};
  color: ${darkText};
}

section.light {
  background-color: ${lightBackground};
}

section.dark h1,
section.dark h2,
section.dark h3,
section.dark .card-grid h2,
section.dark .deck-lane h2,
section.dark .deck-lane-steps h3,
section.dark .deck-chart figcaption {
  color: ${darkHeading};
}

section.dark p,
section.dark li,
section.dark .card-grid p,
section.dark .deck-lane-steps p,
section.dark .deck-chart-label,
section.dark .deck-chart-value {
  color: ${darkText};
}

section.dark .deck-visual-caption,
section.dark .deck-arrow {
  color: ${darkMuted};
}

section.dark .card-grid article,
section.dark .deck-chart,
section.dark .deck-lane,
section.dark .deck-lane-steps article,
section.dark .deck-proof,
section.dark .deck-logo-tile {
  background: ${darkCard};
  border-color: ${darkBorder};
}

section.light h1,
section.light h2,
section.light h3,
section.light .card-grid h2,
section.light .deck-lane h2,
section.light .deck-lane-steps h3,
section.light .deck-chart figcaption {
  color: ${lightHeading};
}

section.light p,
section.light li,
section.light .card-grid p,
section.light .deck-lane-steps p,
section.light .deck-chart-label,
section.light .deck-chart-value {
  color: ${lightText};
}

section.light .deck-visual-caption,
section.light .deck-arrow {
  color: ${lightMuted};
}

section.light .card-grid article,
section.light .deck-chart,
section.light .deck-lane,
section.light .deck-lane-steps article,
section.light .deck-proof,
section.light .deck-logo-tile {
  background: ${lightCard};
  border-color: ${lightBorder};
}

section.dark .deck-lane-blue .deck-lane-steps article,
section.dark .deck-lane-lightBlue .deck-lane-steps article,
section.dark .deck-lane-cyan .deck-lane-steps article,
section.dark .deck-lane-purple .deck-lane-steps article,
section.dark .deck-lane-green .deck-lane-steps article,
section.dark .deck-lane-orange .deck-lane-steps article,
section.dark .deck-lane-red .deck-lane-steps article,
section.dark .deck-lane-yellow .deck-lane-steps article {
  background: ${darkCard};
}

section.dark .deck-lane-blue .deck-lane-steps article { border-left-color: ${cssColor(brand, 'blue', '0F82F5')}; }
section.dark .deck-lane-lightBlue .deck-lane-steps article,
section.dark .deck-lane-cyan .deck-lane-steps article { border-left-color: ${cssColor(brand, 'lightBlue', '59D6FD')}; }
section.dark .deck-lane-purple .deck-lane-steps article { border-left-color: ${cssColor(brand, 'purple', '5143D5')}; }
section.dark .deck-lane-green .deck-lane-steps article { border-left-color: ${cssColor(brand, 'green', '66CC8E')}; }
section.dark .deck-lane-orange .deck-lane-steps article { border-left-color: ${cssColor(brand, 'orange', 'F9935B')}; }
section.dark .deck-lane-red .deck-lane-steps article { border-left-color: ${cssColor(brand, 'red', 'FC5161')}; }
section.dark .deck-lane-yellow .deck-lane-steps article { border-left-color: ${cssColor(brand, 'yellow', 'FBC546')}; }

section.light .deck-lane-blue .deck-lane-steps article {
  background: #e8f4fe;
  border-left-color: ${cssColor(brand, 'blue', '0F82F5')};
}

section.light .deck-lane-lightBlue .deck-lane-steps article,
section.light .deck-lane-cyan .deck-lane-steps article {
  background: #e9f9ff;
  border-left-color: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-lane-purple .deck-lane-steps article {
  background: #f0edfe;
  border-left-color: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-lane-green .deck-lane-steps article {
  background: #ecf9f1;
  border-left-color: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-lane-orange .deck-lane-steps article {
  background: #fff3ea;
  border-left-color: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-lane-red .deck-lane-steps article {
  background: #fff0f2;
  border-left-color: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-lane-yellow .deck-lane-steps article {
  background: #fff8df;
  border-left-color: ${cssColor(brand, 'yellow', 'FBC546')};
}`
}

function backgroundRule(selector, resource) {
  if (!resource) return ''
  return `${selector} {
  background-image: url("${escapeCssUrl(resource)}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}`
}

function lightBackgroundRule(resource) {
  if (resource) {
    return backgroundRule('section.light', resource)
  }
  return `section.light {
  background-color: #ffffff;
  background-image: none;
}`
}

function applyHtmlBranding(slide, brand = {}, resourcesDir = 'resources') {
  const source = rewriteSurfaceLogoImages(
    stripCustomerLogoHtml(applyHtmlSlideClass(slide)),
    resourcesDir,
    slide.surface,
  )
  const logos = []
  const companyLogo = slide.companyLogo?.src
    ? surfaceResourceReference(slide.companyLogo.src, resourcesDir, slide.surface)
    : brandLogoForSlide(brand, slideKind(slide), slide.surface)
  const companyAlt = slide.companyLogo?.alt || `${brand.name || 'Brand'} logo`
  if (companyLogo && !/class=["'][^"']*\bdeck-brand-logo\b/i.test(source)) {
    logos.push(logoHtml(companyLogo, companyAlt, 'deck-brand-logo deck-company-logo'))
  }
  if (slide.customerLogo?.src) {
    logos.push(customerLogoHtml(
      surfaceResourceReference(slide.customerLogo.src, resourcesDir, slide.surface),
      slide.customerLogo.alt || 'Customer logo',
      slide.surface,
    ))
  }
  return logos.length ? insertLogoHtml(source, logos.join('\n')) : source
}

function applyHtmlSlideClass(slide) {
  const className = htmlClassForSlide(slide)
  if (!className || /<!--\s*_class\s*:/i.test(slide.source)) return slide.source
  return `<!-- _class: ${className} -->\n${slide.source}`
}

function insertLogoHtml(source, logo) {
  const lines = source.split(/\r?\n/)
  let insertAt = 0

  while (/^\s*<!--[\s\S]*?-->\s*$/.test(lines[insertAt] || '')) {
    insertAt += 1
  }

  return [...lines.slice(0, insertAt), logo, '', ...lines.slice(insertAt)].join('\n')
}

function prepareHtmlSource(source) {
  return normalizeLocalImageSources(compactRawSvgBlocks(source))
}

function stripCustomerLogoHtml(source) {
  return String(source || '').replace(
    /<img\b[^>]*\bclass=["'][^"']*\bdeck-customer-logo\b[^"']*["'][^>]*>\s*/gi,
    '',
  )
}

function compactRawSvgBlocks(source) {
  return String(source || '')
    .split(/(```[\s\S]*?```)/g)
    .map((part) => {
      if (part.startsWith('```')) return part
      return part.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svg) =>
        svg
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .join('\n'),
      )
    })
    .join('')
}

function brandLogoForSlide(brand = {}, kind = 'content', surface = 'light') {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  if (surface === 'light') {
    return (
      logo.companyLight ||
      logo.contentLight ||
      logo.light ||
      logo[kind] ||
      logo.content ||
      logo.default ||
      ''
    )
  }
  return (
    logo.companyDark ||
    logo.dark ||
    logo[kind] ||
    (kind === 'divider' ? logo.cover : '') ||
    (kind === 'close' ? logo.cover : '') ||
    logo.default ||
    ''
  )
}

function logoHtml(src, alt, className) {
  return `<img class="${escapeHtmlAttr(className)}" src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}">`
}

function customerLogoHtml(src, alt, surface = 'light') {
  const surfaceClass = surface === 'dark' ? 'deck-logo-on-dark' : 'deck-logo-on-light'
  return `<span class="deck-customer-logo-frame ${surfaceClass}">${logoHtml(src, alt, 'deck-customer-logo')}</span>`
}

function rewriteSurfaceLogoImages(source, resourcesDir, surface) {
  return String(source || '').replace(
    /(<div\b[^>]*\bclass=["'][^"']*\bdeck-logo-tile\b[^"']*["'][^>]*>\s*<img\b[^>]*\bsrc=)(["'])([^"']+)\2/gi,
    (match, prefix, quote, src) => `${prefix}${quote}${surfaceResourceReference(src, resourcesDir, surface)}${quote}`,
  )
}

function surfaceResourceReference(src, resourcesDir, surface) {
  try {
    return `resource:${resolveSurfaceResourceFile(src, resourcesDir, surface).relativePath}`
  } catch {
    return src
  }
}

function slideKind(slide) {
  switch (slide.layout) {
    case 'cover':
      return 'cover'
    case 'divider':
      return 'divider'
    case 'close':
      return 'close'
    default:
      return 'content'
  }
}

function htmlClassForLayout(layout) {
  switch (layout) {
    case 'cover':
      return 'cover'
    case 'divider':
      return 'deck-divider-slide'
    case 'close':
      return 'deck-close-slide'
    default:
      return ''
  }
}

function htmlClassForSlide(slide) {
  return htmlClassForLayout(slide.layout) || slide.surface || ''
}

function customerLogoBackplateEnabled(brand = {}) {
  const value = brand.customerLogoBackplate ?? brand.assets?.customerLogoBackplate ?? false
  return value === true || ['true', 'yes', 'on', '1', 'chip', 'backplate'].includes(
    String(value || '').trim().toLowerCase(),
  )
}

export function shouldSkipHtml(slideModel) {
  const directives = slideModel?.directives || {}
  if (isTruthyDirective(directives['pptx-only'])) return true
  if (isTruthyDirective(directives['html-skip'])) return true
  return ['skip', 'omit', 'none', 'false', 'no', 'off'].includes(
    normalizeDirective(directives.html),
  )
}

export function htmlDocument({
  html,
  css,
  deckbuilderCss = '',
  comments = [],
  bespokeCss = '',
  bespokeJs = '',
  title = 'Deck',
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
  <style data-deckbuilder-theme>${deckbuilderCss}</style>
  <style>${bespokeCss}</style>
</head>
<body>
${bespokeOsc()}
${html}
${renderNotes(comments)}
<script>${bespokeJs}</script>
</body>
</html>
`
}

export function resolveResourceUrls(source, resourcesDir = 'resources', options = {}) {
  const resolvedSource = source.replace(/resource:([^)"'<\s]+)/g, (full, resourcePath) => {
    const resolved = resolveResourceFile(`resource:${resourcePath}`, resourcesDir)
    if (options.inlineAssets) return resourceToDataUri(resolved.path)
    if (options.assetMap) {
      options.assetMap.set(resolved.relativePath, resolved.path)
      return encodeURI(
        [options.assetUrlPrefix || 'resources', resolved.relativePath]
          .filter(Boolean)
          .join('/'),
      )
    }
    return pathToFileURL(resolved.path).href
  })
  const unresolved = resolvedSource.match(/resource:[^)"'<\s]+/g)
  if (unresolved?.length) {
    throw new Error(`Unresolved resource reference(s): ${[...new Set(unresolved)].join(', ')}`)
  }
  return resolvedSource
}

function normalizeLocalImageSources(source) {
  return String(source || '').replace(/<img\b[^>]*\bsrc=(["'])([^"']+)\1[^>]*>/gi, (tag, quote, src) => {
    const normalized = normalizeResourceReference(src)
    if (normalized === src) return tag
    return tag.replace(`src=${quote}${src}${quote}`, `src=${quote}${normalized}${quote}`)
  })
}

function escapeCssUrl(value) {
  return String(value).replace(/["\\\n\r\f]/g, '\\$&')
}

function cssColor(brand, keyOrHex, fallback = '') {
  const raw = brand.colors?.[keyOrHex] || keyOrHex || fallback
  const value = /^#?[0-9a-f]{6}$/i.test(String(raw)) ? raw : fallback
  if (!value) return ''
  return /^#/.test(String(value)) ? String(value) : `#${value}`
}

function readableDarkCssColor(brand, token, fallback) {
  const value = cssColor(brand, token, fallback)
  return isDarkCssColor(value) ? `#${fallback}` : value
}

function isDarkCssColor(value) {
  const rgb = hexRgb(value)
  if (!rgb) return false
  return relativeLuminance(rgb) < 0.35
}

function hexRgb(value) {
  const match = String(value || '').match(/^#?([0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ptToPxCss(brand, value) {
  const pxToPt = brand.slide?.pxToPt || 0.75
  const numeric = Number(value || 0)
  return `${Number((numeric / pxToPt).toFixed(3))}px`
}

function isTruthyDirective(value) {
  return ['true', 'yes', 'on', '1'].includes(normalizeDirective(value))
}

function normalizeDirective(value) {
  return String(value || '').trim().toLowerCase()
}

function bespokeOsc() {
  return `<div class="bespoke-marp-osc">
  <button data-bespoke-marp-osc="prev" tabindex="-1" title="Previous slide">Previous slide</button>
  <span data-bespoke-marp-osc="page"></span>
  <button data-bespoke-marp-osc="next" tabindex="-1" title="Next slide">Next slide</button>
  <button data-bespoke-marp-osc="fullscreen" tabindex="-1" title="Toggle fullscreen (f)">Toggle fullscreen</button>
  <button data-bespoke-marp-osc="overview" tabindex="-1" title="Toggle overview view (o)">Toggle overview view</button>
  <button data-bespoke-marp-osc="presenter" tabindex="-1" title="Open presenter view (p)">Open presenter view</button>
</div>`
}

function renderNotes(comments = []) {
  return comments
    .map((notes, index) => {
      if (!notes?.length) return ''
      const paragraphs = notes
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('')
      return `<div class="bespoke-marp-note" data-index="${index}" tabindex="0">${paragraphs}</div>`
    })
    .join('\n')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
