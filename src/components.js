import * as cheerio from 'cheerio'

import {
  parseChart,
  parseComparison,
  parseExecCards,
  parseExecMetrics,
  parseExecRows,
  parseExecTimeline,
  parseExecTitle,
  parseLogoWall,
  parseNextSteps,
  parseProof,
  parseSwimlane,
  parseVisual,
} from './components/parsers.js'
import {
  parseRichHtmlComponent,
  renderRichHtml,
} from './components/rich-html.js'
import { richHtmlParentTags } from './components/rich-html-definitions.js'
import {
  componentContext,
  fail,
  validateChart,
  validateDeckComponentSyntax,
  validateDeckComponentTree,
  validateDividerCopy,
  validateExecCardsCopy,
  validateExecRowsCopy,
  validateExecTitleCopy,
  validateSwimlaneCopy,
} from './components/validation.js'
import {
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderExecCardsHtml,
  renderExecMetricsHtml,
  renderExecRowsHtml,
  renderExecTimelineHtml,
  renderExecTitleHtml,
  renderLogoWallHtml,
  renderNextStepsHtml,
  renderProofHtml,
  renderSwimlaneHtml,
  renderVisualHtml,
} from './components/renderers.js'
import { cleanText, escapeHtml } from './components/utils.js'
import { normalizeResourceReference } from './resources.js'

export {
  parseChart,
  parseComparison,
  parseExecCards,
  parseExecMetrics,
  parseExecRows,
  parseExecTimeline,
  parseExecTitle,
  parseLogoWall,
  parseNextSteps,
  parseProof,
  parseSwimlane,
  parseVisual,
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderExecCardsHtml,
  renderExecMetricsHtml,
  renderExecRowsHtml,
  renderExecTimelineHtml,
  renderExecTitleHtml,
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
    validateSwimlaneCopy(model, context)
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
  root('deck-exec-title').each((_, element) => {
    const execTitle = root(element)
    const model = parseExecTitle(execTitle)
    if (!model.title) fail('deck-exec-title requires a title attribute or h1 child.', context)
    validateExecTitleCopy(model, context)
    components.push(model)
    execTitle.replaceWith(renderExecTitleHtml(model))
  })
  root('deck-exec-rows').each((_, element) => {
    const execRows = root(element)
    const model = parseExecRows(root, execRows)
    if (model.rows.length === 0) fail('deck-exec-rows must include at least one deck-exec-row.', context)
    validateExecRowsCopy(model, context)
    components.push(model)
    execRows.replaceWith(renderExecRowsHtml(model))
  })
  root('deck-exec-cards').each((_, element) => {
    const execCards = root(element)
    const model = parseExecCards(root, execCards)
    if (model.cards.length === 0) fail('deck-exec-cards must include at least one deck-exec-card.', context)
    validateExecCardsCopy(model, context)
    components.push(model)
    execCards.replaceWith(renderExecCardsHtml(model))
  })
  root('deck-exec-timeline').each((_, element) => {
    const execTimeline = root(element)
    const model = parseExecTimeline(root, execTimeline)
    if (model.items.length === 0) fail('deck-exec-timeline must include at least one deck-exec-milestone.', context)
    components.push(model)
    execTimeline.replaceWith(renderExecTimelineHtml(model))
  })
  root('deck-exec-metrics').each((_, element) => {
    const execMetrics = root(element)
    const model = parseExecMetrics(root, execMetrics)
    if (model.metrics.length === 0 && model.panels.length === 0) {
      fail('deck-exec-metrics must include at least one deck-exec-metric or deck-exec-panel.', context)
    }
    components.push(model)
    execMetrics.replaceWith(renderExecMetricsHtml(model))
  })
  root([...richHtmlParentTags].join(',')).each((_, element) => {
    const model = parseRichHtmlComponent(root, element, {
      ...context,
      ordinal: components.length + 1,
    })
    if (!model) return
    components.push(model)
    root(element).replaceWith(renderRichHtml(model))
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
  validateDividerCopy(model, context)
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
