import * as cheerio from 'cheerio'

import {
  parseChart,
  parseComparison,
  parseLogoWall,
  parseNextSteps,
  parseProof,
  parseSwimlane,
  parseVisual,
} from './components/parsers.js'
import {
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderLogoWallHtml,
  renderNextStepsHtml,
  renderProofHtml,
  renderSwimlaneHtml,
  renderVisualHtml,
} from './components/renderers.js'
import { cleanText, escapeHtml } from './components/utils.js'
import { normalizeResourceReference } from './resources.js'

const knownDeckTags = new Set([
  'deck-card',
  'deck-card-grid',
  'deck-chart',
  'deck-close',
  'deck-comparison',
  'deck-divider',
  'deck-lane',
  'deck-logo',
  'deck-logo-wall',
  'deck-next-steps',
  'deck-proof',
  'deck-row',
  'deck-stat',
  'deck-stat-grid',
  'deck-step',
  'deck-swimlane',
  'deck-takeaway',
  'deck-visual',
])

export {
  parseChart,
  parseComparison,
  parseLogoWall,
  parseNextSteps,
  parseProof,
  parseSwimlane,
  parseVisual,
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderLogoWallHtml,
  renderNextStepsHtml,
  renderProofHtml,
  renderSwimlaneHtml,
  renderVisualHtml,
}

export function compileDeckComponents(source, options = {}) {
  const context = componentContext(options)
  validateDeckComponentSyntax(source, context)
  const root = cheerio.load(`<root>${source}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  validateDeckComponentTree(root, context)
  const components = []

  root('deck-stat-grid').each((_, element) => compileStatGrid(root, element, components, context))
  root('deck-card-grid').each((_, element) => compileCardGrid(root, element, components, context))
  root('deck-chart').each((_, element) => {
    const chart = root(element)
    const model = parseChart(chart)
    validateChart(model, context)
    components.push(model)
    chart.replaceWith(renderChartHtml(model))
  })
  root('deck-visual').each((_, element) => {
    const visual = root(element)
    const model = parseVisual(visual)
    components.push(model)
    visual.replaceWith(renderVisualHtml(model))
  })
  root('deck-comparison').each((_, element) => {
    const comparison = root(element)
    const model = parseComparison(root, comparison)
    if (model.rows.length === 0) {
      fail('deck-comparison must include at least one deck-row child or rows="..." entry.', context)
    }
    components.push(model)
    comparison.replaceWith(renderComparisonHtml(model))
  })
  root('deck-swimlane').each((_, element) => {
    const swimlane = root(element)
    const model = parseSwimlane(root, swimlane)
    if (model.lanes.length === 0) fail('deck-swimlane must include at least one deck-lane.', context)
    for (const lane of model.lanes) {
      if (lane.steps.length === 0) {
        fail(`deck-lane "${lane.title}" must include at least one deck-step.`, context)
      }
    }
    components.push(model)
    swimlane.replaceWith(renderSwimlaneHtml(model))
  })
  root('deck-proof').each((_, element) => {
    const proof = root(element)
    const model = parseProof(root, proof)
    components.push(model)
    proof.replaceWith(renderProofHtml(model))
  })
  root('deck-next-steps').each((_, element) => {
    const nextSteps = root(element)
    const model = parseNextSteps(root, nextSteps)
    if (model.steps.length === 0) fail('deck-next-steps must include at least one deck-step.', context)
    components.push(model)
    nextSteps.replaceWith(renderNextStepsHtml(model))
  })
  root('deck-logo-wall').each((_, element) => {
    const logoWall = root(element)
    const model = parseLogoWall(root, logoWall)
    if (model.logos.length === 0) fail('deck-logo-wall must include at least one deck-logo.', context)
    components.push(model)
    logoWall.replaceWith(renderLogoWallHtml(model))
  })
  root('deck-divider').each((_, element) => compileDivider(root, element, components, context))
  root('deck-close').each((_, element) => compileClose(root, element, components))
  root('deck-takeaway').each((_, element) => compileTakeaway(root, element, components))

  return {
    source: root('root').html() || source,
    components,
  }
}

function compileStatGrid(root, element, components, context) {
  const grid = root(element)
  const stats = []
  grid.find('deck-stat').each((_, statElement) => {
    const stat = root(statElement)
    const value = stat.attr('value') || cleanText(stat.find('value').text())
    const label = stat.attr('label') || cleanText(stat.find('label').text() || stat.text())
    if (!value && !label) fail('deck-stat must include value and/or label text.', context)
    stats.push({ value, label })
  })

  if (stats.length === 0) fail('deck-stat-grid must include at least one deck-stat.', context)
  components.push({ type: 'stat-grid', stats })
  grid.replaceWith(renderStatGridHtml(stats))
}

function compileCardGrid(root, element, components, context) {
  const grid = root(element)
  const columns = Number.parseInt(grid.attr('columns') || '3', 10)
  const cards = []

  grid.find('deck-card').each((_, cardElement) => {
    const card = root(cardElement)
    const header = card.attr('title') || card.attr('header') || cleanText(card.find('h2,h3').first().text())
    const media = parseCardMedia(root, card)
    const body = cleanText(card.find('p').first().text() || card.text())
    if (!header && !body && !media) {
      fail('deck-card must include title/header, body text, icon, image, src, or an img child.', context)
    }
    cards.push({ header, body, media })
  })

  if (cards.length === 0) fail('deck-card-grid must include at least one deck-card.', context)
  components.push({ type: 'card-grid', columns, cards })
  grid.replaceWith(renderCardGridHtml(columns, cards))
}

function compileDivider(root, element, components, context) {
  const divider = root(element)
  const model = {
    type: 'divider',
    act: divider.attr('act') || divider.attr('label') || '',
    title: divider.attr('title') || cleanText(divider.find('h1').first().text()),
    subtitle: divider.attr('subtitle') || cleanText(divider.find('p').first().text()),
  }
  if (!model.title) fail('deck-divider requires a title attribute or h1 child.', context)
  components.push(model)
  divider.replaceWith(renderDividerHtml(model))
}

function compileClose(root, element, components) {
  const close = root(element)
  const model = {
    type: 'close',
    title: close.attr('title') || cleanText(close.find('h1').first().text()) || 'Thank you',
    name: close.attr('name') || '',
    role: close.attr('role') || '',
  }
  components.push(model)
  close.replaceWith(renderCloseHtml(model))
}

function compileTakeaway(root, element, components) {
  const takeaway = root(element)
  const text = cleanText(takeaway.attr('text') || takeaway.text())
  components.push({ type: 'takeaway', text })
  takeaway.replaceWith(`<div class="takeaway">${escapeHtml(text)}</div>`)
}

function renderStatGridHtml(stats) {
  return `<div class="stat-grid">${stats
    .map(
      (stat) => `<div class="stat-card">
  <strong>${escapeHtml(stat.value)}</strong>
  <span>${escapeHtml(stat.label)}</span>
</div>`,
    )
    .join('\n')}</div>`
}

function renderCardGridHtml(columns, cards) {
  const className = columns === 4 ? 'four' : 'three'
  return `<div class="card-grid ${className}">${cards
    .map(
      (card) => `<article>
  ${renderCardMediaHtml(card)}
  <h2>${escapeHtml(card.header)}</h2>
  ${card.body ? `<p>${escapeHtml(card.body)}</p>` : ''}
</article>`,
    )
    .join('\n')}</div>`
}

function parseCardMedia(root, card) {
  const icon = card.attr('icon')
  if (icon) {
    return {
      kind: 'icon',
      src: normalizeResourceReference(icon, { defaultFolder: 'icons' }),
      alt: card.attr('icon-alt') || card.attr('title') || '',
    }
  }

  const image = card.attr('image') || card.attr('src')
  if (image) {
    return {
      kind: 'image',
      src: normalizeResourceReference(image),
      alt: card.attr('image-alt') || card.attr('alt') || card.attr('title') || '',
    }
  }

  const img = card.find('img').first()
  const imgSrc = img.attr('src')
  if (!imgSrc) return null
  return {
    kind: img.attr('data-kind') || 'image',
    src: normalizeResourceReference(imgSrc),
    alt: img.attr('alt') || card.attr('title') || '',
  }
}

function renderCardMediaHtml(card) {
  if (!card.media?.src) return ''
  const kind = card.media.kind === 'icon' ? 'icon' : 'image'
  return `<img class="deck-card-media deck-card-${kind}" src="${escapeHtml(card.media.src)}" alt="${escapeHtml(card.media.alt || card.header || '')}">`
}

function validateDeckComponentSyntax(source, context) {
  const stack = []
  const tagPattern = /<\/?\s*(deck-[a-z0-9-]+)\b[^>]*>/gi

  for (const match of source.matchAll(tagPattern)) {
    const raw = match[0]
    const tag = match[1].toLowerCase()
    const line = lineNumberAt(source, match.index)
    if (!knownDeckTags.has(tag)) fail(`Unknown deck component <${tag}>.`, context, line)

    const isClosing = /^<\s*\//.test(raw)
    const isSelfClosing = /\/\s*>$/.test(raw)
    if (isClosing) {
      const opened = stack.pop()
      if (!opened) fail(`Closing </${tag}> has no matching opening tag.`, context, line)
      if (opened.tag !== tag) {
        fail(
          `Mismatched deck component tags: opened <${opened.tag}> on line ${opened.line}, but found </${tag}>.`,
          context,
          line,
        )
      }
    } else if (!isSelfClosing) {
      stack.push({ tag, line })
    }
  }

  if (stack.length > 0) {
    const opened = stack[stack.length - 1]
    fail(`Unclosed deck component <${opened.tag}> opened on line ${opened.line}.`, context, opened.line)
  }
}

function validateDeckComponentTree(root, context) {
  const parentRules = [
    ['deck-card', 'deck-card-grid'],
    ['deck-row', 'deck-comparison'],
    ['deck-lane', 'deck-swimlane'],
    ['deck-logo', 'deck-logo-wall'],
  ]

  for (const [childTag, parentTag] of parentRules) {
    root(childTag).each((_, element) => {
      if (!root(element).parent().is(parentTag)) {
        fail(`<${childTag}> must be placed directly inside <${parentTag}>.`, context)
      }
    })
  }

  root('deck-step').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('deck-lane') && !parent.is('deck-next-steps')) {
      fail('<deck-step> must be placed directly inside <deck-lane> or <deck-next-steps>.', context)
    }
  })

  root('deck-stat').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('deck-stat-grid') && !parent.is('deck-proof')) {
      fail('<deck-stat> must be placed directly inside <deck-stat-grid> or <deck-proof>.', context)
    }
  })
}

function validateChart(chart, context) {
  if (chart.labels.length === 0 || chart.values.length === 0) {
    fail('deck-chart requires non-empty labels and values attributes.', context)
  }
  if (chart.labels.length !== chart.values.length) {
    fail(
      `deck-chart labels/values length mismatch: ${chart.labels.length} label(s), ${chart.values.length} value(s).`,
      context,
    )
  }
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail('deck-chart values must all be numeric.', context)
  }
}

function componentContext(options = {}) {
  return options.slideNumber ? `slide ${options.slideNumber}` : 'deck'
}

function lineNumberAt(source, index = 0) {
  return String(source || '').slice(0, index).split(/\r?\n/).length
}

function fail(message, context = 'deck', line = 0) {
  throw new Error(`Invalid deck Markdown in ${context}${line ? `, line ${line}` : ''}: ${message}`)
}
