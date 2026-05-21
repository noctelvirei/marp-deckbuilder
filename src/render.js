import { Marp } from '@marp-team/marp-core'
import { Element } from '@marp-team/marpit'
import { pathToFileURL } from 'node:url'

import { buildMarpMarkdown } from './markdown.js'
import { normalizeResourceReference, resolveResourceFile, resourceToDataUri } from './resources.js'

export function renderDeckHtml(deck, options = {}) {
  const definitions = options.definitions
  const htmlDeck = {
    ...deck,
    slides: deck.slides
      .filter((slide) => !shouldSkipHtml(slide))
      .map((slide) => ({
        ...slide,
        source: prepareHtmlSource(applyHtmlBranding(slide, options.definitions?.brand)),
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
    [definitions.themeCss, brandBackgroundCss(definitions.brand), brandLogoCss(definitions.brand)]
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
  if (!brand.assets?.logo) return ''
  const logoBox = brand.layouts?.logo || { x: 828, y: 21, w: 98, h: 24 }
  return `.deck-brand-logo {
  position: absolute;
  left: ${ptToPxCss(brand, logoBox.x)};
  top: ${ptToPxCss(brand, logoBox.y)};
  width: ${ptToPxCss(brand, logoBox.w)};
  height: ${ptToPxCss(brand, logoBox.h)};
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
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

function applyHtmlBranding(slide, brand = {}) {
  const source = applyHtmlSlideClass(slide)
  const logo = brandLogoForKind(brand, slideKind(slide))
  if (!logo || /class=["'][^"']*\bdeck-brand-logo\b/i.test(source)) return source
  return insertLogoHtml(source, logoHtml(logo, `${brand.name || 'Brand'} logo`))
}

function applyHtmlSlideClass(slide) {
  const className = htmlClassForLayout(slide.layout)
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

function brandLogoForKind(brand = {}, kind = 'content') {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  return (
    logo[kind] ||
    (kind === 'divider' ? logo.cover : '') ||
    (kind === 'close' ? logo.cover : '') ||
    logo.default ||
    ''
  )
}

function logoHtml(src, alt) {
  return `<img class="deck-brand-logo" src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}">`
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
