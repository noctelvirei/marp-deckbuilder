import yaml from 'js-yaml'

import { compileDeckComponents } from './components.js'

export function parseDeckMarkdown(source) {
  const { frontmatter, body } = splitFrontmatter(source)
  const slideSources = splitSlides(body)
  const slides = slideSources.map((slideSource, index) => {
    const compiled = compileDeckComponents(slideSource, { slideNumber: index + 1 })
    return parseSlide(compiled.source, index, slideSource, compiled.components, frontmatter)
  })

  return {
    frontmatter,
    body: slides.map((slide) => slide.source).join('\n\n---\n\n'),
    slides,
  }
}

export function splitFrontmatter(source) {
  const normalized = source.replace(/^\uFEFF/, '')
  const frontmatterMatch = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: normalized }
  }

  const frontmatter = yaml.load(frontmatterMatch[1]) || {}
  return {
    frontmatter,
    body: normalized.slice(frontmatterMatch[0].length),
  }
}

export function buildMarpMarkdown(deck, options = {}) {
  const marpFrontmatter = {
    ...deck.frontmatter,
    marp: true,
    theme: options.themeName || deck.frontmatter.theme,
    size: deck.frontmatter.size || '16:9',
    paginate: deck.frontmatter.paginate ?? false,
  }

  const body = deck.slides.map((slide) => slide.source).join('\n\n---\n\n')
  return `---\n${yaml.dump(marpFrontmatter, { lineWidth: 100 })}---\n${body}`
}

export function splitSlides(body) {
  const slides = []
  const current = []

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*---\s*$/.test(line)) {
      slides.push(current.join('\n').trim())
      current.length = 0
    } else {
      current.push(line)
    }
  }

  slides.push(current.join('\n').trim())
  return slides.filter((slide) => slide.length > 0)
}

export function parseSlide(source, index, originalSource = source, components = [], frontmatter = {}) {
  const slideMeta = firstComponent(components, 'slide')
  const directives = {
    ...extractDirectives(source),
    ...(slideMeta?.directives || {}),
  }
  const titleComponent =
    firstComponent(components, 'divider') ||
    firstComponent(components, 'close') ||
    firstComponent(components, 'exec-title')
  const title = directives.title || titleComponent?.title || extractTitle(source) || `Slide ${index + 1}`
  const subtitle = directives.subtitle || titleComponent?.subtitle || extractSubtitle(source, title)
  const layout = directives.layout || inferComponentLayout(components) || inferLayout(source, index)
  const componentTakeaway = components.find((component) => component.type === 'takeaway')
  const proof = firstComponent(components, 'proof')
  const companyLogo = slideMeta?.companyLogo || extractCompanyLogo(source) || frontmatterCompanyLogo(frontmatter)
  const customerLogo = slideMeta?.customerLogo || extractCustomerLogo(source) || frontmatterCustomerLogo(frontmatter)
  const layoutComponent = firstComponent(components, layout)
  const surface = inferSurface(layout, directives, frontmatter, layoutComponent?.surface)

  return {
    index,
    source,
    originalSource,
    components,
    directives,
    layout,
    surface,
    title,
    subtitle,
    eyebrow: directives.eyebrow,
    takeaway: directives.takeaway || componentTakeaway?.text,
    footnote: directives.footnote || proof?.source,
    stats: firstComponent(components, 'stat-grid')?.stats || extractStats(source),
    cards: firstComponent(components, 'card-grid')?.cards || extractCards(source),
    chart: firstComponent(components, 'chart'),
    signalBars: firstComponent(components, 'signal-bars'),
    signalBoard: firstComponent(components, 'signal-board'),
    funnel: firstComponent(components, 'funnel'),
    metricTrend: firstComponent(components, 'metric-trend'),
    heatmap: firstComponent(components, 'heatmap'),
    impactRadar: firstComponent(components, 'impact-radar'),
    treemap: firstComponent(components, 'treemap'),
    journeyMap: firstComponent(components, 'journey-map'),
    journeyPath: firstComponent(components, 'journey-path'),
    comparison: firstComponent(components, 'comparison'),
    swimlane: firstComponent(components, 'swimlane'),
    proof,
    nextSteps: firstComponent(components, 'next-steps'),
    logoWall: firstComponent(components, 'logo-wall'),
    execTitle: firstComponent(components, 'exec-title'),
    execRows: firstComponent(components, 'exec-rows'),
    execCards: firstComponent(components, 'exec-cards'),
    execTimeline: firstComponent(components, 'exec-timeline'),
    execMetrics: firstComponent(components, 'exec-metrics'),
    divider: firstComponent(components, 'divider'),
    close: firstComponent(components, 'close'),
    companyLogo,
    customerLogo,
    paragraphs: extractParagraphs(source, title),
    bullets: extractBullets(source),
  }
}

export function extractDirectives(source) {
  const directives = {}
  const pattern = /<!--\s*([\w-]+)\s*:\s*([\s\S]*?)\s*-->/g
  for (const match of source.matchAll(pattern)) {
    directives[match[1].toLowerCase()] = decodeHtml(match[2].trim())
  }
  return directives
}

function inferLayout(source, index) {
  if (index === 0) return 'cover'
  if (/<div[^>]+class=["'][^"']*stat-grid/i.test(source)) return 'three-stat'
  if (/<div[^>]+class=["'][^"']*card-grid/i.test(source)) return 'cards'
  if (/<figure[^>]+class=["'][^"']*deck-chart/i.test(source)) return 'chart'
  if (/<div[^>]+class=["'][^"']*deck-signal-bars/i.test(source)) return 'signal-bars'
  if (/<div[^>]+class=["'][^"']*deck-signal-board/i.test(source)) return 'signal-board'
  if (/<figure[^>]+class=["'][^"']*deck-funnel/i.test(source)) return 'funnel'
  if (/<div[^>]+class=["'][^"']*deck-metric-trend/i.test(source)) return 'metric-trend'
  if (/<figure[^>]+class=["'][^"']*deck-heatmap/i.test(source)) return 'heatmap'
  if (/<figure[^>]+class=["'][^"']*deck-impact-radar/i.test(source)) return 'impact-radar'
  if (/<figure[^>]+class=["'][^"']*deck-treemap/i.test(source)) return 'treemap'
  if (/<div[^>]+class=["'][^"']*deck-journey-map/i.test(source)) return 'journey-map'
  if (/<div[^>]+class=["'][^"']*deck-journey-path/i.test(source)) return 'journey-path'
  if (/<table[^>]+class=["'][^"']*deck-comparison/i.test(source)) return 'comparison'
  if (/<div[^>]+class=["'][^"']*deck-swimlane/i.test(source)) return 'swimlane'
  if (/<div[^>]+class=["'][^"']*deck-proof/i.test(source)) return 'proof'
  if (/<ol[^>]+class=["'][^"']*deck-next-steps/i.test(source)) return 'next-steps'
  if (/<div[^>]+class=["'][^"']*deck-logo-wall/i.test(source)) return 'logo-wall'
  if (/<div[^>]+class=["'][^"']*deck-exec-title/i.test(source)) return 'exec-title'
  if (/<div[^>]+class=["'][^"']*deck-exec-rows/i.test(source)) return 'exec-rows'
  if (/<div[^>]+class=["'][^"']*deck-exec-cards/i.test(source)) return 'exec-cards'
  if (/<div[^>]+class=["'][^"']*deck-exec-timeline/i.test(source)) return 'exec-timeline'
  if (/<div[^>]+class=["'][^"']*deck-exec-metrics/i.test(source)) return 'exec-metrics'
  if (/<div[^>]+class=["'][^"']*deck-divider/i.test(source)) return 'divider'
  if (/<div[^>]+class=["'][^"']*deck-close/i.test(source)) return 'close'
  return 'content'
}

function inferComponentLayout(components) {
  const layoutComponents = new Map([
    ['comparison', 'comparison'],
    ['swimlane', 'swimlane'],
    ['proof', 'proof'],
    ['next-steps', 'next-steps'],
    ['logo-wall', 'logo-wall'],
    ['exec-title', 'exec-title'],
    ['exec-rows', 'exec-rows'],
    ['exec-cards', 'exec-cards'],
    ['exec-timeline', 'exec-timeline'],
    ['exec-metrics', 'exec-metrics'],
    ['divider', 'divider'],
    ['close', 'close'],
    ['signal-board', 'signal-board'],
    ['signal-bars', 'signal-bars'],
    ['funnel', 'funnel'],
    ['metric-trend', 'metric-trend'],
    ['heatmap', 'heatmap'],
    ['impact-radar', 'impact-radar'],
    ['treemap', 'treemap'],
    ['journey-map', 'journey-map'],
    ['journey-path', 'journey-path'],
    ['chart', 'chart'],
    ['card-grid', 'cards'],
    ['stat-grid', 'three-stat'],
  ])

  for (const component of components) {
    if (layoutComponents.has(component.type)) return layoutComponents.get(component.type)
  }
  return ''
}

function inferSurface(layout, directives = {}, frontmatter = {}, componentSurface = '') {
  const explicitSurface = normalizeSurface(directives.surface || directives.mode || componentSurface)
  if (explicitSurface) return explicitSurface

  const classDirective = String(directives._class || directives.class || '').toLowerCase()
  if (/\blight\b/.test(classDirective)) return 'light'
  if (/\bdark\b/.test(classDirective)) return 'dark'

  const defaultSurface = normalizeSurface(
    frontmatter.defaultSurface ||
      frontmatter.deckSurface ||
      frontmatter.surface ||
      frontmatter.themeSurface,
  )
  if (defaultSurface) return defaultSurface

  if (['cover', 'divider', 'close'].includes(layout)) return 'dark'
  return 'light'
}

function normalizeSurface(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (token === 'light' || token === 'white') return 'light'
  if (token === 'dark' || token === 'navy' || token === 'black') return 'dark'
  return ''
}

function firstComponent(components, type) {
  return components.find((component) => component.type === type)
}

function extractTitle(source) {
  const markdownHeading = source.match(/^\s*#\s+(.+)$/m)
  if (markdownHeading) return stripInline(markdownHeading[1])

  const htmlHeading = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (htmlHeading) return cleanText(htmlHeading[1])

  return ''
}

function extractSubtitle(source, title) {
  const markdownSubheading = source.match(/^\s*##\s+(.+)$/m)
  if (markdownSubheading) return stripInline(markdownSubheading[1])

  const paragraphs = extractParagraphs(source, title)
  return paragraphs[0] || ''
}

function extractStats(source) {
  const stats = []
  const pattern =
    /<div[^>]*class=["'][^"']*stat-card[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi

  for (const match of source.matchAll(pattern)) {
    const html = match[1]
    const value = cleanText(firstMatch(html, /<strong[^>]*>([\s\S]*?)<\/strong>/i))
    const label = cleanText(firstMatch(html, /<span[^>]*>([\s\S]*?)<\/span>/i))
    if (value || label) stats.push({ value, label })
  }

  return stats
}

function extractCards(source) {
  const cards = []
  const pattern = /<article[^>]*>([\s\S]*?)<\/article>/gi

  for (const match of source.matchAll(pattern)) {
    const html = match[1]
    const header = cleanText(firstMatch(html, /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i))
    const body = cleanText(firstMatch(html, /<p[^>]*>([\s\S]*?)<\/p>/i))
    const media = extractCardMedia(html)
    if (header || body || media) cards.push({ header, body, media })
  }

  return cards
}

function extractCustomerLogo(source) {
  const img = String(source || '').match(/<img\b([^>]*\bclass=["'][^"']*\bdeck-customer-logo\b[^"']*["'][^>]*)>/i)
  if (!img) return null
  const attrs = img[1]
  const src = firstMatch(attrs, /\bsrc=["']([^"']+)["']/i)
  if (!src) return null
  return {
    src,
    alt: firstMatch(attrs, /\balt=["']([^"']*)["']/i) || 'Customer logo',
  }
}

function extractCompanyLogo(source) {
  const img = String(source || '').match(/<img\b([^>]*\bclass=["'][^"']*\bdeck-(?:brand|company)-logo\b[^"']*["'][^>]*)>/i)
  if (!img) return null
  const attrs = img[1]
  const src = firstMatch(attrs, /\bsrc=["']([^"']+)["']/i)
  if (!src) return null
  return {
    src,
    alt: firstMatch(attrs, /\balt=["']([^"']*)["']/i) || 'Company logo',
  }
}

function frontmatterCompanyLogo(frontmatter = {}) {
  const value = frontmatter.companyLogo || frontmatter.brandLogo || frontmatter.company?.logo || frontmatter.company?.logoSrc
  if (!value) return null
  return {
    src: String(value),
    alt: frontmatter.companyName || frontmatter.company?.name || frontmatter.brandName || 'Company logo',
  }
}

function frontmatterCustomerLogo(frontmatter = {}) {
  const value = frontmatter.customerLogo || frontmatter.customer?.logo || frontmatter.customer?.logoSrc
  if (!value) return null
  return {
    src: String(value),
    alt: frontmatter.customerName || frontmatter.customer?.name || 'Customer logo',
  }
}

function extractParagraphs(source, title) {
  const withoutComments = source.replace(/<!--[\s\S]*?-->/g, '')
  const htmlParagraphs = [...withoutComments.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean)

  const markdownParagraphs = withoutComments
    .replace(/```[\s\S]*?```/g, '')
    .split(/\r?\n{2,}/)
    .map((block) => block.trim())
    .filter(
      (block) =>
        block &&
        !block.startsWith('#') &&
        !block.startsWith('<') &&
        !isMarkdownListBlock(block),
    )
    .map(stripInline)
    .filter(Boolean)

  return [...htmlParagraphs, ...markdownParagraphs]
    .filter((paragraph) => paragraph !== title)
    .slice(0, 6)
}

function extractBullets(source) {
  const withoutComments = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '')

  return withoutComments
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(stripInline)
}

function isMarkdownListBlock(block) {
  return block.split(/\r?\n/).some((line) => /^\s*[-*]\s+/.test(line))
}

function firstMatch(source, pattern) {
  const match = source.match(pattern)
  return match?.[1] || ''
}

function extractCardMedia(html) {
  const img = String(html || '').match(/<img\b([^>]*)>/i)
  if (!img) return null
  const attrs = img[1]
  const src = firstMatch(attrs, /\bsrc=["']([^"']+)["']/i)
  if (!src) return null
  const className = firstMatch(attrs, /\bclass=["']([^"']+)["']/i)
  return {
    kind: /\bdeck-card-icon\b/.test(className) ? 'icon' : 'image',
    src,
    alt: firstMatch(attrs, /\balt=["']([^"']*)["']/i),
  }
}

function stripInline(value) {
  return cleanText(
    value
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/[*_`~]/g, ''),
  )
}

function cleanText(value) {
  return decodeHtml(
    String(value || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
