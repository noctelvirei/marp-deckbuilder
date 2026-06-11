import * as cheerio from 'cheerio'
import MarkdownIt from 'markdown-it'

import { compileDeckComponents } from '../components.js'
import { normalizeResourceReference } from '../resources.js'
import { resolveResourceUrls } from '../render.js'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

export function prepareReportContent(source, options = {}) {
  const prepared = compileReportComponents(normalizeReportImageReferences(source))
  const renderedContent = resolveResourceUrls(markdown.render(prepared), options.resourcesDir, options.resolverOptions)
  const { content, toc } = decorateReportContent(renderedContent)

  return {
    content,
    toc,
    titleFallback: firstHeading(source),
  }
}

function compileReportComponents(source) {
  if (!/<\/?\s*deck-/i.test(source)) return source

  const compiled = compileDeckComponents(source, { slideNumber: 0 })
  const unsupported = compiled.components.filter((component) => !component.rich)
  if (unsupported.length) {
    throw new Error(
      `Report mode supports Markdown plus renderer-owned rich HTML effect tags only. Unsupported deck component type(s): ${unsupported.map((component) => component.type).join(', ')}.`,
    )
  }

  return wrapReportRichBlocks(compiled.source)
}

function wrapReportRichBlocks(source) {
  const root = cheerio.load(`<root>${source}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  root('[data-deck-rich]').each((_, element) => {
    const rich = root(element)
    if (rich.parent().hasClass('report-rich-block')) return
    const type = reportRichType(rich)
    rich.wrap(`<section class="report-rich-block report-rich-${escapeHtmlAttr(type)}"></section>`)
  })
  return root('root').html() || source
}

function reportRichType(rich) {
  const attrs = [
    'cover',
    'agenda',
    'stats',
    'bars',
    'line',
    'donut',
    'book',
    'timeline',
    'tilt-cards',
    'typewriter',
    'particles',
    'neon',
    'glass-cards',
    'radar',
    'stagger-grid',
    'comparison',
    'gauge',
    'reveal',
    'close',
  ]
  return attrs.find((attr) => rich.attr(`data-deck-rich-${attr}`) !== undefined) || 'rich'
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

function decorateReportContent(content) {
  const root = cheerio.load(`<root>${content}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  const used = new Set()
  const toc = []

  root('h1,h2').each((_, element) => {
    const heading = root(element)
    const label = heading.text().replace(/\s+/g, ' ').trim()
    if (!label) return
    const id = uniqueSlug(heading.attr('id') || label, used)
    heading.attr('id', id)
    toc.push({ id, label })
  })

  return {
    content: root('root').html() || content,
    toc,
  }
}

function uniqueSlug(value, used) {
  const base =
    String(value || '')
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  let slug = base
  let index = 2
  while (used.has(slug)) {
    slug = `${base}-${index}`
    index += 1
  }
  used.add(slug)
  return slug
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
