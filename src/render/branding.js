import {
  normalizeResourceReference,
  resolveSurfaceResourceFile,
} from '../resources.js'

export function prepareDeckForHtml(deck, brand = {}, resourcesDir = 'resources') {
  return {
    ...deck,
    slides: deck.slides
      .filter((slide) => !shouldSkipHtml(slide))
      .map((slide) => ({
        ...slide,
        source: prepareHtmlSource(applyHtmlBranding(slide, brand, resourcesDir)),
      })),
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
    case 'rich-cover':
      return 'cover'
    case 'divider':
      return 'divider'
    case 'close':
    case 'rich-close':
      return 'close'
    default:
      return 'content'
  }
}

function htmlClassForLayout(layout) {
  switch (layout) {
    case 'cover':
    case 'rich-cover':
      return 'cover'
    case 'divider':
      return 'deck-divider-slide'
    case 'close':
    case 'rich-close':
      return 'deck-close-slide'
    case 'rich-html':
      return 'dark'
    default:
      return ''
  }
}

function htmlClassForSlide(slide) {
  return htmlClassForLayout(slide.layout) || slide.surface || ''
}

function normalizeLocalImageSources(source) {
  return String(source || '').replace(/<img\b[^>]*\bsrc=(["'])([^"']+)\1[^>]*>/gi, (tag, quote, src) => {
    const normalized = normalizeResourceReference(src)
    if (normalized === src) return tag
    return tag.replace(`src=${quote}${src}${quote}`, `src=${quote}${normalized}${quote}`)
  })
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function isTruthyDirective(value) {
  return ['true', 'yes', 'on', '1'].includes(normalizeDirective(value))
}

function normalizeDirective(value) {
  return String(value || '').trim().toLowerCase()
}
