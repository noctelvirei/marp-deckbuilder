import yaml from 'js-yaml'

import { compileDeckComponents } from './components.js'

export function parseDeckMarkdown(source) {
  const { frontmatter, body } = splitFrontmatter(source)
  const slideSources = splitSlides(body)
  const slides = slideSources.map((slideSource, index) => {
    const compiled = compileDeckComponents(slideSource)
    return parseSlide(compiled.source, index, slideSource, compiled.components)
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
    theme: deck.frontmatter.theme || options.themeName,
    size: deck.frontmatter.size || '16:9',
    paginate: deck.frontmatter.paginate ?? true,
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

export function parseSlide(source, index, originalSource = source, components = []) {
  const directives = extractDirectives(source)
  const titleComponent = firstComponent(components, 'divider') || firstComponent(components, 'close')
  const title = directives.title || titleComponent?.title || extractTitle(source) || `Slide ${index + 1}`
  const subtitle = directives.subtitle || titleComponent?.subtitle || extractSubtitle(source, title)
  const layout = directives.layout || inferComponentLayout(components) || inferLayout(source, index)
  const componentTakeaway = components.find((component) => component.type === 'takeaway')
  const proof = firstComponent(components, 'proof')

  return {
    index,
    source,
    originalSource,
    components,
    directives,
    layout,
    title,
    subtitle,
    eyebrow: directives.eyebrow,
    takeaway: directives.takeaway || componentTakeaway?.text,
    footnote: directives.footnote || proof?.source,
    stats: firstComponent(components, 'stat-grid')?.stats || extractStats(source),
    cards: firstComponent(components, 'card-grid')?.cards || extractCards(source),
    chart: firstComponent(components, 'chart'),
    visual: firstComponent(components, 'visual'),
    comparison: firstComponent(components, 'comparison'),
    swimlane: firstComponent(components, 'swimlane'),
    proof,
    nextSteps: firstComponent(components, 'next-steps'),
    logoWall: firstComponent(components, 'logo-wall'),
    divider: firstComponent(components, 'divider'),
    close: firstComponent(components, 'close'),
    paragraphs: extractParagraphs(source, title),
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
  if (/<figure[^>]+class=["'][^"']*deck-visual/i.test(source)) return 'visual'
  if (/<table[^>]+class=["'][^"']*deck-comparison/i.test(source)) return 'comparison'
  if (/<div[^>]+class=["'][^"']*deck-swimlane/i.test(source)) return 'swimlane'
  if (/<div[^>]+class=["'][^"']*deck-proof/i.test(source)) return 'proof'
  if (/<ol[^>]+class=["'][^"']*deck-next-steps/i.test(source)) return 'next-steps'
  if (/<div[^>]+class=["'][^"']*deck-logo-wall/i.test(source)) return 'logo-wall'
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
    ['divider', 'divider'],
    ['close', 'close'],
    ['visual', 'visual'],
    ['chart', 'chart'],
    ['card-grid', 'cards'],
    ['stat-grid', 'three-stat'],
  ])

  for (const component of components) {
    if (layoutComponents.has(component.type)) return layoutComponents.get(component.type)
  }
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
    if (header || body) cards.push({ header, body })
  }

  return cards
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
    .filter((block) => block && !block.startsWith('#') && !block.startsWith('<'))
    .map(stripInline)
    .filter(Boolean)

  return [...htmlParagraphs, ...markdownParagraphs]
    .filter((paragraph) => paragraph !== title)
    .slice(0, 6)
}

function firstMatch(source, pattern) {
  const match = source.match(pattern)
  return match?.[1] || ''
}

function stripInline(value) {
  return cleanText(
    value
      .replace(/!\[[^\]]*]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
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
