import * as cheerio from 'cheerio'

import { animationAttributes } from './animations/registry.js'
import { expandSelfClosingComponentTags } from './component-tags.js'
import {
  parseChart,
  parseComparison,
  parseExecCards,
  parseExecMetrics,
  parseExecRows,
  parseExecTimeline,
  parseExecTitle,
  parseFunnel,
  parseHeatmap,
  parseImpactRadar,
  parseJourneyMap,
  parseJourneyPath,
  parseLogoWall,
  parseMetricTrend,
  parseNextSteps,
  parseOrchestration,
  parseProof,
  parseSignalBars,
  parseSignalBoard,
  parseSlideMeta,
  parseSwimlane,
  parseTreemap,
} from './components/parsers.js'
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
  renderFunnelHtml,
  renderHeatmapHtml,
  renderImpactRadarHtml,
  renderJourneyMapHtml,
  renderJourneyPathHtml,
  renderLogoWallHtml,
  renderMetricTrendHtml,
  renderNextStepsHtml,
  renderOrchestrationHtml,
  renderProofHtml,
  renderSignalBarsHtml,
  renderSignalBoardHtml,
  renderSwimlaneHtml,
  renderTakeawayHeroHtml,
  renderTreemapHtml,
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
  'deck-exec-card',
  'deck-exec-cards',
  'deck-exec-metric',
  'deck-exec-metrics',
  'deck-exec-milestone',
  'deck-exec-panel',
  'deck-exec-row',
  'deck-exec-rows',
  'deck-exec-timeline',
  'deck-exec-title',
  'deck-funnel',
  'deck-heatmap',
  'deck-impact-radar',
  'deck-journey-map',
  'deck-journey-path',
  'deck-journey-step',
  'deck-lane',
  'deck-logo',
  'deck-logo-wall',
  'deck-metric-trend',
  'deck-next-steps',
  'deck-orchestration',
  'deck-proof',
  'deck-row',
  'deck-signal-bars',
  'deck-signal-board',
  'deck-slide',
  'deck-stat',
  'deck-stat-grid',
  'deck-step',
  'deck-swimlane',
  'deck-takeaway',
  'deck-treemap',
  'deck-visual',
])

const deckComponentAttributeAllowList = new Map([
  ['deck-card', ['title', 'header', 'icon', 'icon-alt', 'image', 'src', 'image-alt', 'alt']],
  ['deck-card-grid', ['columns']],
  ['deck-chart', ['labels', 'values', 'targets', 'target-values', 'target', 'title', 'series', 'type', 'points', 'data', 'links', 'flows', 'edges', 'matrix', 'series-values', 'bins', 'buckets', 'bucket-count', 'x-axis', 'x-label', 'y-axis', 'y-label']],
  ['deck-close', ['title', 'name', 'role']],
  ['deck-comparison', ['columns', 'left-title', 'left', 'right-title', 'right', 'rows']],
  ['deck-divider', ['act', 'label', 'title', 'subtitle']],
  ['deck-exec-card', ['label', 'title', 'metric', 'value', 'subtitle', 'label-text', 'body', 'accent']],
  ['deck-exec-cards', ['surface', 'columns', 'variant', 'intro', 'loop-caption', 'target', 'target-accent', 'takeaway', 'takeaway-accent']],
  ['deck-exec-metric', ['value', 'label', 'accent']],
  ['deck-exec-metrics', ['surface', 'section-title', 'takeaway', 'takeaway-accent']],
  ['deck-exec-milestone', ['year', 'label', 'title', 'body', 'accent']],
  ['deck-exec-panel', ['value', 'metric', 'title', 'body', 'note', 'accent']],
  ['deck-exec-row', ['label', 'kicker', 'eyebrow', 'title', 'body', 'note', 'accent']],
  ['deck-exec-rows', ['surface', 'side-title', 'side-value', 'side-body', 'side-accent', 'takeaway', 'takeaway-accent']],
  ['deck-exec-timeline', ['surface', 'takeaway', 'takeaway-accent']],
  ['deck-exec-title', ['surface', 'eyebrow', 'kicker', 'title', 'subtitle', 'accent']],
  ['deck-funnel', ['title', 'labels', 'values', 'unit', 'accent']],
  ['deck-heatmap', ['title', 'x-labels', 'columns', 'y-labels', 'rows', 'values', 'unit', 'caption', 'accent']],
  ['deck-impact-radar', ['title', 'bar-title', 'radar-title', 'labels', 'values', 'radar-values', 'radar', 'unit', 'caption', 'accent']],
  ['deck-journey-map', ['title']],
  ['deck-journey-path', ['title', 'metric', 'metric-label', 'metric-body', 'labels', 'notes', 'hotspots', 'callout-title', 'callout-body', 'accent']],
  ['deck-journey-step', ['label', 'title', 'body', 'accent']],
  ['deck-lane', ['title', 'label', 'color']],
  ['deck-logo', ['name', 'image', 'src']],
  ['deck-logo-wall', ['title']],
  ['deck-metric-trend', ['metric', 'metric-label', 'title', 'labels', 'values', 'unit', 'accent']],
  ['deck-next-steps', []],
  ['deck-orchestration', ['upstream-label', 'channels-label', 'upstream', 'channels', 'layer', 'title', 'logo', 'brand-logo', 'company-logo', 'inline-logo', 'tagline', 'layer-tag', 'capabilities', 'caps', 'tags', 'downstream-label', 'systems-label', 'downstream', 'systems', 'caption', 'body', 'accent']],
  ['deck-proof', ['bridge', 'source', 'logo', 'logo-name', 'customer']],
  ['deck-row', ['label', 'title', 'left', 'right']],
  ['deck-signal-bars', ['metric', 'metric-label', 'title', 'subtitle', 'labels', 'values', 'unit', 'accent']],
  ['deck-signal-board', ['title', 'body', 'tags', 'chart-title', 'chart', 'labels', 'values', 'unit', 'accent']],
  ['deck-slide', [
    'layout',
    'title',
    'subtitle',
    'eyebrow',
    'takeaway',
    'footnote',
    'surface',
    'mode',
    'html',
    'pptx',
    'html-skip',
    'pptx-skip',
    'html-only',
    'pptx-only',
    'company-logo',
    'company-name',
    'company-alt',
    'customer-logo',
    'customer-name',
    'customer-alt',
    ...animationAttributes,
  ]],
  ['deck-stat', ['value', 'label']],
  ['deck-stat-grid', []],
  ['deck-step', ['title']],
  ['deck-swimlane', []],
  ['deck-takeaway', ['text']],
  ['deck-treemap', ['title', 'labels', 'values', 'unit', 'caption', 'accent']],
  ['deck-visual', ['title', 'caption', 'fallback', 'alt']],
])

export {
  parseChart,
  parseComparison,
  parseExecCards,
  parseExecMetrics,
  parseExecRows,
  parseExecTimeline,
  parseExecTitle,
  parseFunnel,
  parseHeatmap,
  parseImpactRadar,
  parseJourneyMap,
  parseJourneyPath,
  parseLogoWall,
  parseMetricTrend,
  parseNextSteps,
  parseOrchestration,
  parseProof,
  parseSignalBars,
  parseSignalBoard,
  parseSlideMeta,
  parseSwimlane,
  parseTreemap,
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderExecCardsHtml,
  renderExecMetricsHtml,
  renderExecRowsHtml,
  renderExecTimelineHtml,
  renderExecTitleHtml,
  renderFunnelHtml,
  renderHeatmapHtml,
  renderImpactRadarHtml,
  renderJourneyMapHtml,
  renderJourneyPathHtml,
  renderLogoWallHtml,
  renderMetricTrendHtml,
  renderNextStepsHtml,
  renderOrchestrationHtml,
  renderProofHtml,
  renderSignalBarsHtml,
  renderSignalBoardHtml,
  renderSwimlaneHtml,
  renderTreemapHtml,
}

export function compileDeckComponents(source, options = {}) {
  const context = componentContext(options)
  validateDeckComponentSyntax(source, context)
  const parseSource = expandSelfClosingComponentTags(source, knownDeckTags, 'deck')
  const root = cheerio.load(`<root>${parseSource}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  validateDeckComponentTree(root, context)
  validateDeckComponentAttributes(root, context)
  validateRetiredDeckComponents(root, context)
  validateRawAuthorHtml(root, context)
  const components = []

  root('deck-slide').each((_, element) => compileSlideMeta(root, element, components, context))
  root('deck-stat-grid').each((_, element) => compileStatGrid(root, element, components, context))
  root('deck-card-grid').each((_, element) => compileCardGrid(root, element, components, context))
  root('deck-chart').each((_, element) => {
    const chart = root(element)
    const model = parseChart(chart)
    validateChart(model, context)
    components.push(model)
    chart.replaceWith(renderChartHtml(model))
  })
  root('deck-signal-bars').each((_, element) => {
    const signalBars = root(element)
    const model = parseSignalBars(signalBars)
    validateSignalBars(model, context)
    components.push(model)
    signalBars.replaceWith(renderSignalBarsHtml(model))
  })
  root('deck-orchestration').each((_, element) => {
    const orchestration = root(element)
    const model = parseOrchestration(orchestration)
    validateOrchestration(model, context)
    components.push(model)
    orchestration.replaceWith(renderOrchestrationHtml(model))
  })
  root('deck-signal-board').each((_, element) => {
    const signalBoard = root(element)
    const model = parseSignalBoard(signalBoard)
    validateSignalBoard(model, context)
    components.push(model)
    signalBoard.replaceWith(renderSignalBoardHtml(model))
  })
  root('deck-funnel').each((_, element) => {
    const funnel = root(element)
    const model = parseFunnel(funnel)
    validateFunnel(model, context)
    components.push(model)
    funnel.replaceWith(renderFunnelHtml(model))
  })
  root('deck-metric-trend').each((_, element) => {
    const metricTrend = root(element)
    const model = parseMetricTrend(metricTrend)
    validateMetricTrend(model, context)
    components.push(model)
    metricTrend.replaceWith(renderMetricTrendHtml(model))
  })
  root('deck-heatmap').each((_, element) => {
    const heatmap = root(element)
    const model = parseHeatmap(heatmap)
    validateHeatmap(model, context)
    components.push(model)
    heatmap.replaceWith(renderHeatmapHtml(model))
  })
  root('deck-impact-radar').each((_, element) => {
    const impactRadar = root(element)
    const model = parseImpactRadar(impactRadar)
    validateImpactRadar(model, context)
    components.push(model)
    impactRadar.replaceWith(renderImpactRadarHtml(model))
  })
  root('deck-treemap').each((_, element) => {
    const treemap = root(element)
    const model = parseTreemap(treemap)
    validateTreemap(model, context)
    components.push(model)
    treemap.replaceWith(renderTreemapHtml(model))
  })
  root('deck-journey-map').each((_, element) => {
    const journeyMap = root(element)
    const model = parseJourneyMap(root, journeyMap)
    validateJourneyMap(model, context)
    components.push(model)
    journeyMap.replaceWith(renderJourneyMapHtml(model))
  })
  root('deck-journey-path').each((_, element) => {
    const journeyPath = root(element)
    const model = parseJourneyPath(journeyPath)
    validateJourneyPath(model, context)
    components.push(model)
    journeyPath.replaceWith(renderJourneyPathHtml(model))
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
  root('deck-divider').each((_, element) => compileDivider(root, element, components, context))
  root('deck-close').each((_, element) => compileClose(root, element, components))
  root('deck-takeaway').each((_, element) => compileTakeaway(root, element, components))

  return {
    source: root('root').html() || source,
    components,
  }
}

function compileSlideMeta(root, element, components, context) {
  if (root('deck-slide').length > 1) fail('Only one deck-slide metadata component is allowed per slide.', context)
  const slide = root(element)
  const model = parseSlideMeta(slide)
  components.push(model)
  slide.replaceWith('')
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
      fail('deck-card must include title/header, body text, icon, image, or src.', context)
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
  const slideMeta = components.find((component) => component.type === 'slide')
  const model = { type: 'takeaway', text, eyebrow: slideMeta?.directives?.eyebrow || '' }
  components.push(model)
  takeaway.replaceWith(renderTakeawayHeroHtml(model))
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

  return null
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
    if (!knownDeckTags.has(tag)) {
      fail(
        `Deck component <${tag}> is not available. Use a supported deck-* component or ask the skill maker to add it.`,
        context,
        line,
      )
    }

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
    ['deck-exec-row', 'deck-exec-rows'],
    ['deck-exec-card', 'deck-exec-cards'],
    ['deck-exec-milestone', 'deck-exec-timeline'],
    ['deck-exec-metric', 'deck-exec-metrics'],
    ['deck-exec-panel', 'deck-exec-metrics'],
    ['deck-journey-step', 'deck-journey-map'],
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

function validateDeckComponentAttributes(root, context) {
  for (const [tag, supportedAttributes] of deckComponentAttributeAllowList.entries()) {
    const supported = new Set(supportedAttributes)
    root(tag).each((_, element) => {
      const attributes = root(element).attr() || {}
      const unsupported = Object.keys(attributes).find((attribute) => !supported.has(attribute))
      if (unsupported) {
        fail(unsupportedDeckAttributeMessage(tag, unsupported, supportedAttributes), context)
      }
    })
  }
}

function validateRetiredDeckComponents(root, context) {
  root('deck-visual').each(() => {
    fail(
      '<deck-visual> is no longer supported because it allowed raw SVG authoring. Use a documented renderer-backed deck-* component, or ask the skill maker to add the missing slide type.',
      context,
    )
  })
}

function validateRawAuthorHtml(root, context) {
  const blockedTags = ['script', 'style', 'canvas', 'iframe', 'object', 'embed', 'img']
  for (const tag of blockedTags) {
    root(tag).each(() => {
      fail(rawHtmlMessage(tag), context)
    })
  }

  const blockedLayoutTags = ['div', 'section', 'article', 'figure', 'table', 'form', 'button', 'video', 'audio']
  for (const tag of blockedLayoutTags) {
    root(tag).each(() => {
      fail(rawHtmlMessage(tag), context)
    })
  }

  root('svg').each(() => {
    fail(rawHtmlMessage('svg'), context)
  })
}

function rawHtmlMessage(tag) {
  return `Raw <${tag}> is not supported in deck Markdown. Use a supported deck-* component, or ask the skill maker to add the missing renderer-backed slide type.`
}

function unsupportedDeckAttributeMessage(tag, attribute, supportedAttributes = []) {
  const supported = supportedAttributes.length ? supportedAttributes.join(', ') : 'none'
  return `Unsupported <${tag}> attribute "${attribute}". Use only documented attributes or ask the skill maker to add support. Supported attributes: ${supported}.`
}

function validateChart(chart, context) {
  const supportedTypes = ['bar', 'line', 'area', 'waterfall', 'bullet', 'grouped-bar', 'stacked-bar', 'doughnut', 'scatter', 'bubble', 'histogram', 'boxplot', 'pareto', 'radar', 'sankey']
  if (!supportedTypes.includes(chart.chartType)) {
    fail(
      `deck-chart type "${chart.chartType}" is not available. Supported types: ${supportedTypes.join(', ')}. Ask the skill maker to add the missing chart type.`,
      context,
    )
  }
  if (chart.chartType === 'scatter') {
    validateScatterChart(chart, context)
    return
  }
  if (chart.chartType === 'bubble') {
    validateBubbleChart(chart, context)
    return
  }
  if (chart.chartType === 'histogram') {
    validateHistogramChart(chart, context)
    return
  }
  if (chart.chartType === 'boxplot') {
    validateBoxplotChart(chart, context)
    return
  }
  if (chart.chartType === 'pareto') {
    validateParetoChart(chart, context)
    return
  }
  if (chart.chartType === 'sankey') {
    validateSankeyChart(chart, context)
    return
  }
  if (chart.labels.length === 0) {
    fail('deck-chart requires a non-empty labels attribute.', context)
  }
  if (chart.chartType === 'grouped-bar' || chart.chartType === 'stacked-bar') {
    validateMultiSeriesBarChart(chart, context)
    return
  }
  if (chart.values.length === 0) {
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
  if (chart.chartType === 'area' && chart.labels.length < 2) {
    fail('deck-chart type="area" requires at least two labels/values or points entries.', context)
  }
  if (chart.chartType === 'bullet') {
    validateBulletChart(chart, context)
  }
  if (chart.chartType === 'radar') {
    validateRadarChart(chart, context)
  }
  if (chart.chartType === 'doughnut') {
    if (chart.values.some((value) => value < 0)) {
      fail('deck-chart doughnut values must be zero or positive.', context)
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail('deck-chart doughnut values must sum to more than zero.', context)
    }
  }
}

function validateRadarChart(chart, context) {
  if (chart.labels.length < 3) {
    fail('deck-chart type="radar" requires at least three labels/values.', context)
  }
  if (chart.labels.length > 8) {
    fail('deck-chart type="radar" supports up to 8 labels. Split denser profiles across slides.', context)
  }
  if (chart.values.some((value) => value < 0)) {
    fail('deck-chart type="radar" values must be zero or positive.', context)
  }
  if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail('deck-chart type="radar" values must include at least one value above zero.', context)
  }
  for (const [index, label] of chart.labels.entries()) {
    if (label.length > 18) fail(`deck-chart type="radar" label ${index + 1} must be 18 characters or fewer.`, context)
  }
}

function validateBulletChart(chart, context) {
  if (chart.targets.length === 0) {
    fail('deck-chart type="bullet" requires targets or target-values.', context)
  }
  if (chart.targets.length !== chart.labels.length) {
    fail(
      `deck-chart type="bullet" labels/targets length mismatch: ${chart.labels.length} label(s), ${chart.targets.length} target(s).`,
      context,
    )
  }
  if (chart.targets.some((value) => !Number.isFinite(value))) {
    fail('deck-chart type="bullet" targets must all be numeric.', context)
  }
  if (chart.values.some((value) => value < 0) || chart.targets.some((value) => value < 0)) {
    fail('deck-chart type="bullet" values and targets must be zero or positive.', context)
  }
  if ([...chart.values, ...chart.targets].every((value) => value === 0)) {
    fail('deck-chart type="bullet" values and targets must include at least one value above zero.', context)
  }
}

function validateBubbleChart(chart, context) {
  if (chart.points.length === 0) {
    fail('deck-chart type="bubble" requires points="x:y:r,..." with at least one point.', context)
  }
  chart.points.forEach((point, index) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.r)) {
      fail(`deck-chart bubble point ${index + 1} must use numeric x, y, and r values.`, context)
    }
    if (point.r <= 0) {
      fail(`deck-chart bubble point ${index + 1} radius must be greater than zero.`, context)
    }
  })
  if (chart.points.length > 16) {
    fail('deck-chart type="bubble" supports up to 16 points. Split larger plots across slides.', context)
  }
}

function validateHistogramChart(chart, context) {
  if (chart.values.length === 0) {
    fail('deck-chart type="histogram" requires non-empty numeric values.', context)
  }
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail('deck-chart type="histogram" values must all be numeric.', context)
  }
  if (!Number.isInteger(chart.binCount) || chart.binCount < 2 || chart.binCount > 30) {
    fail('deck-chart type="histogram" bins must be an integer between 2 and 30.', context)
  }
}

function validateBoxplotChart(chart, context) {
  if (chart.labels.length === 0) {
    fail('deck-chart type="boxplot" requires non-empty labels.', context)
  }
  if (chart.matrix.length === 0) {
    fail('deck-chart type="boxplot" requires matrix values in values, matrix, or series-values.', context)
  }
  if (chart.matrix.length !== chart.labels.length) {
    fail(
      `deck-chart type="boxplot" labels/rows length mismatch: ${chart.labels.length} label(s), ${chart.matrix.length} row(s).`,
      context,
    )
  }
  chart.matrix.forEach((row, rowIndex) => {
    if (row.length < 5) {
      fail(`deck-chart type="boxplot" row ${rowIndex + 1} must include at least 5 numeric observations.`, context)
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`deck-chart type="boxplot" row ${rowIndex + 1} values must all be numeric.`, context)
    }
  })
}

function validateParetoChart(chart, context) {
  if (chart.labels.length === 0 || chart.values.length === 0) {
    fail('deck-chart type="pareto" requires non-empty labels and values.', context)
  }
  if (chart.labels.length !== chart.values.length) {
    fail(
      `deck-chart type="pareto" labels/values length mismatch: ${chart.labels.length} label(s), ${chart.values.length} value(s).`,
      context,
    )
  }
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail('deck-chart type="pareto" values must all be numeric.', context)
  }
  if (chart.values.some((value) => value < 0)) {
    fail('deck-chart pareto values must be zero or positive.', context)
  }
  if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail('deck-chart pareto values must sum to more than zero.', context)
  }
}

function validateSankeyChart(chart, context) {
  if (chart.links.length === 0) {
    fail('deck-chart type="sankey" requires non-empty links.', context)
  }
  chart.links.forEach((link, index) => {
    if (!link.source || !link.target) {
      fail(`deck-chart type="sankey" link ${index + 1} must use source>target:value syntax.`, context)
    }
    if (!Number.isFinite(link.value)) {
      fail(`deck-chart type="sankey" link ${index + 1} value must be numeric.`, context)
    }
    if (link.value <= 0) {
      fail(`deck-chart type="sankey" link ${index + 1} value must be greater than zero.`, context)
    }
    if (link.source === link.target) {
      fail(`deck-chart type="sankey" link ${index + 1} cannot connect a node to itself.`, context)
    }
  })
  validateSankeyAcyclic(chart, context)
}

function validateSankeyAcyclic(chart, context) {
  const graph = new Map()
  chart.links.forEach((link) => {
    if (!graph.has(link.source)) graph.set(link.source, [])
    graph.get(link.source).push(link.target)
    if (!graph.has(link.target)) graph.set(link.target, [])
  })
  const visiting = new Set()
  const visited = new Set()
  const visit = (node) => {
    if (visiting.has(node)) return false
    if (visited.has(node)) return true
    visiting.add(node)
    for (const next of graph.get(node) || []) {
      if (!visit(next)) return false
    }
    visiting.delete(node)
    visited.add(node)
    return true
  }
  for (const node of graph.keys()) {
    if (!visit(node)) {
      fail('deck-chart type="sankey" links must not contain cycles.', context)
    }
  }
}

function validateScatterChart(chart, context) {
  if (chart.points.length === 0) {
    fail('deck-chart type="scatter" requires points="x|y|Label;..." with at least one point.', context)
  }
  chart.points.forEach((point, index) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      fail(`deck-chart scatter point ${index + 1} must use numeric x and y values.`, context)
    }
  })
  if (chart.points.length > 12) {
    fail('deck-chart type="scatter" supports up to 12 points. Split larger plots across slides.', context)
  }
}

function validateMultiSeriesBarChart(chart, context) {
  if (chart.seriesNames.length < 2) {
    fail(`deck-chart type="${chart.chartType}" requires at least two series names in series="...".`, context)
  }
  if (chart.matrix.length === 0) {
    fail(`deck-chart type="${chart.chartType}" requires values with one semicolon-separated row per series.`, context)
  }
  if (chart.matrix.length !== chart.seriesNames.length) {
    fail(
      `deck-chart ${chart.chartType} series/values row mismatch: ${chart.seriesNames.length} series name(s), ${chart.matrix.length} value row(s).`,
      context,
    )
  }
  chart.matrix.forEach((row, index) => {
    if (row.length !== chart.labels.length) {
      fail(
        `deck-chart ${chart.chartType} row ${index + 1} length mismatch: ${chart.labels.length} label(s), ${row.length} value(s).`,
        context,
      )
    }
  })
  if (chart.matrix.flat().some((value) => !Number.isFinite(value))) {
    fail(`deck-chart ${chart.chartType} values must all be numeric.`, context)
  }
  if (chart.matrix.flat().some((value) => value < 0)) {
    fail(`deck-chart ${chart.chartType} values must be zero or positive.`, context)
  }
  if (chart.chartType === 'stacked-bar') {
    chart.labels.forEach((label, labelIndex) => {
      const total = chart.matrix.reduce((sum, row) => sum + row[labelIndex], 0)
      if (total <= 0) {
        fail(`deck-chart stacked-bar column "${label}" must sum to more than zero.`, context)
      }
    })
  }
}

function validateSignalBars(signalBars, context) {
  if (!signalBars.metric) fail('deck-signal-bars requires a metric attribute.', context)
  if (!signalBars.metricLabel) fail('deck-signal-bars requires a metric-label attribute.', context)
  if (signalBars.labels.length === 0 || signalBars.values.length === 0) {
    fail('deck-signal-bars requires non-empty labels and values attributes.', context)
  }
  if (signalBars.labels.length !== signalBars.values.length) {
    fail(
      `deck-signal-bars labels/values length mismatch: ${signalBars.labels.length} label(s), ${signalBars.values.length} value(s).`,
      context,
    )
  }
  if (signalBars.values.some((value) => !Number.isFinite(value))) {
    fail('deck-signal-bars values must all be numeric.', context)
  }
  if (signalBars.values.some((value) => value < 0)) {
    fail('deck-signal-bars values must be zero or positive.', context)
  }
  if (signalBars.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail('deck-signal-bars values must sum to more than zero.', context)
  }
  if (signalBars.labels.length > 5) {
    fail('deck-signal-bars supports up to 5 rows. Split larger datasets across slides.', context)
  }
  if (signalBars.metric.length > 18) {
    fail('deck-signal-bars metric must be 18 characters or fewer.', context)
  }
  if (signalBars.metricLabel.length > 180) {
    fail('deck-signal-bars metric-label must be 180 characters or fewer.', context)
  }
}

function validateOrchestration(orchestration, context) {
  if (!orchestration.layer) fail('deck-orchestration requires a layer or title attribute.', context)
  if (orchestration.upstream.length === 0) {
    fail('deck-orchestration requires upstream or channels entries.', context)
  }
  if (orchestration.downstream.length === 0) {
    fail('deck-orchestration requires downstream or systems entries.', context)
  }
  if (orchestration.capabilities.length === 0) {
    fail('deck-orchestration requires capabilities, caps, or tags entries.', context)
  }
  if (orchestration.upstream.length > 8) {
    fail('deck-orchestration supports up to 8 upstream/channel nodes.', context)
  }
  if (orchestration.downstream.length > 8) {
    fail('deck-orchestration supports up to 8 downstream/system nodes.', context)
  }
  if (orchestration.capabilities.length > 6) {
    fail('deck-orchestration supports up to 6 capability chips.', context)
  }
  if (orchestration.layer.length > 48) {
    fail('deck-orchestration layer must be 48 characters or fewer.', context)
  }
  if (orchestration.tagline.length > 72) {
    fail('deck-orchestration tagline must be 72 characters or fewer.', context)
  }
  if (orchestration.caption.length > 220) {
    fail('deck-orchestration caption/body must be 220 characters or fewer.', context)
  }
  for (const [index, node] of [...orchestration.upstream, ...orchestration.downstream].entries()) {
    if (node.length > 28) {
      fail(`deck-orchestration node ${index + 1} must be 28 characters or fewer.`, context)
    }
  }
  for (const [index, capability] of orchestration.capabilities.entries()) {
    if (capability.length > 36) {
      fail(`deck-orchestration capability ${index + 1} must be 36 characters or fewer.`, context)
    }
  }
}

function validateSignalBoard(signalBoard, context) {
  if (!signalBoard.title) fail('deck-signal-board requires a title attribute.', context)
  if (!signalBoard.body) fail('deck-signal-board requires a body attribute or short paragraph body.', context)
  if (signalBoard.labels.length === 0 || signalBoard.values.length === 0) {
    fail('deck-signal-board requires non-empty labels and values attributes.', context)
  }
  if (signalBoard.labels.length !== signalBoard.values.length) {
    fail(
      `deck-signal-board labels/values length mismatch: ${signalBoard.labels.length} label(s), ${signalBoard.values.length} value(s).`,
      context,
    )
  }
  if (signalBoard.values.some((value) => !Number.isFinite(value))) {
    fail('deck-signal-board values must all be numeric.', context)
  }
  if (signalBoard.values.some((value) => value < 0)) {
    fail('deck-signal-board values must be zero or positive.', context)
  }
  if (signalBoard.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail('deck-signal-board values must sum to more than zero.', context)
  }
  if (signalBoard.labels.length > 5) {
    fail('deck-signal-board supports up to 5 rows. Split larger signal boards across slides.', context)
  }
  if (signalBoard.tags.length > 5) {
    fail('deck-signal-board supports up to 5 tags. Keep tags selective.', context)
  }
  if (signalBoard.title.length > 64) {
    fail('deck-signal-board title must be 64 characters or fewer.', context)
  }
  if (signalBoard.body.length > 220) {
    fail('deck-signal-board body must be 220 characters or fewer.', context)
  }
  if (signalBoard.chartTitle.length > 64) {
    fail('deck-signal-board chart-title must be 64 characters or fewer.', context)
  }
  for (const [index, tag] of signalBoard.tags.entries()) {
    if (tag.length > 28) {
      fail(`deck-signal-board tag ${index + 1} must be 28 characters or fewer.`, context)
    }
  }
}

function validateFunnel(funnel, context) {
  if (funnel.labels.length === 0 || funnel.values.length === 0) {
    fail('deck-funnel requires non-empty labels and values attributes.', context)
  }
  if (funnel.labels.length !== funnel.values.length) {
    fail(
      `deck-funnel labels/values length mismatch: ${funnel.labels.length} label(s), ${funnel.values.length} value(s).`,
      context,
    )
  }
  if (funnel.values.some((value) => !Number.isFinite(value))) {
    fail('deck-funnel values must all be numeric.', context)
  }
  if (funnel.values.some((value) => value < 0)) {
    fail('deck-funnel values must be zero or positive.', context)
  }
  if (funnel.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail('deck-funnel values must sum to more than zero.', context)
  }
  if (funnel.labels.length > 6) {
    fail('deck-funnel supports up to 6 stages. Split larger funnels across slides.', context)
  }
}

function validateMetricTrend(metricTrend, context) {
  if (!metricTrend.metric) fail('deck-metric-trend requires a metric attribute.', context)
  if (!metricTrend.metricLabel) fail('deck-metric-trend requires a metric-label attribute.', context)
  if (metricTrend.labels.length === 0 || metricTrend.values.length === 0) {
    fail('deck-metric-trend requires non-empty labels and values attributes.', context)
  }
  if (metricTrend.labels.length !== metricTrend.values.length) {
    fail(
      `deck-metric-trend labels/values length mismatch: ${metricTrend.labels.length} label(s), ${metricTrend.values.length} value(s).`,
      context,
    )
  }
  if (metricTrend.values.some((value) => !Number.isFinite(value))) {
    fail('deck-metric-trend values must all be numeric.', context)
  }
  if (metricTrend.labels.length > 8) {
    fail('deck-metric-trend supports up to 8 points. Split longer trends across slides.', context)
  }
  if (metricTrend.metric.length > 18) {
    fail('deck-metric-trend metric must be 18 characters or fewer.', context)
  }
  if (metricTrend.metricLabel.length > 180) {
    fail('deck-metric-trend metric-label must be 180 characters or fewer.', context)
  }
}

function validateHeatmap(heatmap, context) {
  if (heatmap.xLabels.length === 0) {
    fail('deck-heatmap requires x-labels="..." with at least one column label.', context)
  }
  if (heatmap.yLabels.length === 0) {
    fail('deck-heatmap requires y-labels="..." with at least one row label.', context)
  }
  if (heatmap.values.length === 0) {
    fail(
      'deck-heatmap requires values="..." as semicolon-separated rows with comma-separated numeric cells.',
      context,
    )
  }
  if (heatmap.values.length !== heatmap.yLabels.length) {
    fail(
      `deck-heatmap values/y-labels mismatch: ${heatmap.values.length} value row(s), ${heatmap.yLabels.length} y-label(s).`,
      context,
    )
  }
  for (const [index, row] of heatmap.values.entries()) {
    if (row.length !== heatmap.xLabels.length) {
      fail(
        `deck-heatmap row ${index + 1} has ${row.length} value(s), but x-labels has ${heatmap.xLabels.length}.`,
        context,
      )
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`deck-heatmap row ${index + 1} contains a non-numeric value.`, context)
    }
  }
  if (heatmap.xLabels.length > 12) {
    fail('deck-heatmap supports up to 12 x-labels. Split denser heatmaps across slides.', context)
  }
  if (heatmap.yLabels.length > 8) {
    fail('deck-heatmap supports up to 8 y-labels. Split denser heatmaps across slides.', context)
  }
  if (heatmap.xLabels.length * heatmap.yLabels.length > 80) {
    fail('deck-heatmap supports up to 80 cells. Split denser heatmaps across slides.', context)
  }
  if (heatmap.title.length > 70) {
    fail('deck-heatmap title must be 70 characters or fewer.', context)
  }
}

function validateImpactRadar(impactRadar, context) {
  if (impactRadar.labels.length === 0 || impactRadar.values.length === 0) {
    fail('deck-impact-radar requires non-empty labels and values attributes.', context)
  }
  if (impactRadar.labels.length < 3) {
    fail('deck-impact-radar requires at least 3 labels for the radar shape.', context)
  }
  if (impactRadar.labels.length > 6) {
    fail('deck-impact-radar supports up to 6 labels. Split denser profiles across slides.', context)
  }
  if (impactRadar.labels.length !== impactRadar.values.length) {
    fail(
      `deck-impact-radar labels/values length mismatch: ${impactRadar.labels.length} label(s), ${impactRadar.values.length} value(s).`,
      context,
    )
  }
  if (impactRadar.radarValues.length !== impactRadar.labels.length) {
    fail(
      `deck-impact-radar radar-values/labels length mismatch: ${impactRadar.radarValues.length} radar value(s), ${impactRadar.labels.length} label(s).`,
      context,
    )
  }
  if (impactRadar.values.some((value) => !Number.isFinite(value)) || impactRadar.radarValues.some((value) => !Number.isFinite(value))) {
    fail('deck-impact-radar values and radar-values must all be numeric.', context)
  }
  if ([...impactRadar.values, ...impactRadar.radarValues].some((value) => value < 0 || value > 100)) {
    fail('deck-impact-radar values and radar-values must be between 0 and 100.', context)
  }
  for (const [index, label] of impactRadar.labels.entries()) {
    if (label.length > 18) fail(`deck-impact-radar label ${index + 1} must be 18 characters or fewer.`, context)
  }
  if (impactRadar.barTitle.length > 40) fail('deck-impact-radar bar-title must be 40 characters or fewer.', context)
  if (impactRadar.radarTitle.length > 40) fail('deck-impact-radar radar-title must be 40 characters or fewer.', context)
  if (impactRadar.caption.length > 130) fail('deck-impact-radar caption must be 130 characters or fewer.', context)
}

function validateTreemap(treemap, context) {
  if (treemap.labels.length === 0 || treemap.values.length === 0) {
    fail('deck-treemap requires non-empty labels and values attributes.', context)
  }
  if (treemap.labels.length !== treemap.values.length) {
    fail(
      `deck-treemap labels/values length mismatch: ${treemap.labels.length} label(s), ${treemap.values.length} value(s).`,
      context,
    )
  }
  if (treemap.values.some((value) => !Number.isFinite(value))) {
    fail('deck-treemap values must all be numeric.', context)
  }
  if (treemap.values.reduce((sum, value) => sum + Math.max(0, value), 0) <= 0) {
    fail('deck-treemap values must sum to more than zero.', context)
  }
  if (treemap.labels.length > 10) {
    fail('deck-treemap supports up to 10 items. Split larger treemaps across slides.', context)
  }
  for (const [index, label] of treemap.labels.entries()) {
    if (label.length > 32) {
      fail(`deck-treemap label ${index + 1} must be 32 characters or fewer.`, context)
    }
  }
  if (treemap.title.length > 70) {
    fail('deck-treemap title must be 70 characters or fewer.', context)
  }
}

function validateJourneyMap(journeyMap, context) {
  if (journeyMap.steps.length === 0) {
    fail('deck-journey-map must include at least one deck-journey-step child.', context)
  }
  if (journeyMap.steps.length > 6) {
    fail('deck-journey-map supports up to 6 steps. Split longer journeys across slides.', context)
  }
  for (const [index, step] of journeyMap.steps.entries()) {
    if (!step.title) fail(`deck-journey-step ${index + 1} requires a title.`, context)
    if (step.title.length > 42) fail(`deck-journey-step ${index + 1} title must be 42 characters or fewer.`, context)
    if (step.body.length > 150) fail(`deck-journey-step ${index + 1} body must be 150 characters or fewer.`, context)
  }
}

function validateJourneyPath(journeyPath, context) {
  if (!journeyPath.metric) fail('deck-journey-path requires a metric attribute.', context)
  if (!journeyPath.metricLabel) fail('deck-journey-path requires a metric-label attribute.', context)
  if (journeyPath.labels.length < 2) {
    fail('deck-journey-path requires labels="..." with 2 to 5 journey stages.', context)
  }
  if (journeyPath.labels.length > 5) {
    fail('deck-journey-path supports up to 5 journey stages. Split longer paths across slides.', context)
  }
  if (journeyPath.notes.length && journeyPath.notes.length !== journeyPath.labels.length) {
    fail(
      `deck-journey-path notes/labels length mismatch: ${journeyPath.notes.length} note(s), ${journeyPath.labels.length} label(s).`,
      context,
    )
  }
  if (journeyPath.hotspots.length > journeyPath.labels.length) {
    fail('deck-journey-path hotspots cannot outnumber labels.', context)
  }
  if (journeyPath.metric.length > 18) {
    fail('deck-journey-path metric must be 18 characters or fewer.', context)
  }
  if (journeyPath.metricLabel.length > 170) {
    fail('deck-journey-path metric-label must be 170 characters or fewer.', context)
  }
  if (journeyPath.calloutTitle.length > 48) {
    fail('deck-journey-path callout-title must be 48 characters or fewer.', context)
  }
  if (journeyPath.calloutBody.length > 74) {
    fail('deck-journey-path callout-body must be 74 characters or fewer.', context)
  }
  journeyPath.labels.forEach((label, index) => {
    if (label.length > 24) fail(`deck-journey-path label ${index + 1} must be 24 characters or fewer.`, context)
  })
  journeyPath.notes.forEach((note, index) => {
    if (note.length > 34) fail(`deck-journey-path note ${index + 1} must be 34 characters or fewer.`, context)
  })
}

function validateExecTitleCopy(model, context) {
  assertCopyFits({
    component: 'deck-exec-title',
    field: 'title',
    text: model.title,
    maxChars: 42,
    maxLines: 2,
    charsPerLine: 22,
    context,
  })
  if (model.subtitle) {
    assertCopyFits({
      component: 'deck-exec-title',
      field: 'subtitle',
      text: model.subtitle,
      maxChars: 110,
      maxLines: 2,
      charsPerLine: 58,
      context,
    })
  }
}

function validateExecRowsCopy(model, context) {
  model.rows.forEach((row, index) => {
    const label = `deck-exec-row[${index + 1}]`
    assertCopyFits({
      component: 'deck-exec-rows',
      field: `${label}.title`,
      text: row.title,
      maxChars: 28,
      maxLines: 1,
      charsPerLine: 28,
      context,
    })
    if (row.body) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: `${label}.body`,
        text: row.body,
        maxChars: 105,
        maxLines: 2,
        charsPerLine: 58,
        context,
      })
    }
    if (row.note) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: `${label}.note`,
        text: row.note,
        maxChars: 16,
        maxLines: 1,
        charsPerLine: 16,
        context,
      })
    }
  })

  if (model.side) {
    if (model.side.value) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: 'side-value',
        text: model.side.value,
        maxChars: 8,
        maxLines: 1,
        charsPerLine: 8,
        context,
      })
    }
    if (model.side.body) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: 'side-body',
        text: model.side.body,
        maxChars: 62,
        maxLines: 4,
        charsPerLine: 18,
        context,
      })
    }
  }
}

function validateExecCardsCopy(model, context) {
  const columns = model.columns || 3
  const titleChars = columns === 4 ? 22 : 30
  const metricChars = columns === 4 ? 10 : 14
  const bodyChars = columns === 4 ? 82 : 100

  model.cards.forEach((card, index) => {
    const label = `deck-exec-card[${index + 1}]`
    if (card.title) {
      assertCopyFits({
        component: 'deck-exec-cards',
        field: `${label}.title`,
        text: card.title,
        maxChars: titleChars,
        maxLines: 2,
        charsPerLine: columns === 4 ? 15 : 22,
        context,
      })
    }
    if (card.metric) {
      assertCopyFits({
        component: 'deck-exec-cards',
        field: `${label}.metric`,
        text: card.metric,
        maxChars: metricChars,
        maxLines: 1,
        charsPerLine: metricChars,
        context,
      })
    }
    if (card.body) {
      assertCopyFits({
        component: 'deck-exec-cards',
        field: `${label}.body`,
        text: card.body,
        maxChars: bodyChars,
        maxLines: columns === 4 ? 4 : 3,
        charsPerLine: columns === 4 ? 26 : 42,
        context,
      })
    }
  })
}

function validateSwimlaneCopy(model, context) {
  model.lanes.forEach((lane, laneIndex) => {
    const stepCount = Math.max(1, lane.steps.length)
    const compact = model.lanes.length >= 3 || stepCount >= 3
    const bodyChars = stepCount >= 4 ? 88 : compact ? 105 : 116
    lane.steps.forEach((step, stepIndex) => {
      const label = `deck-lane[${laneIndex + 1}].deck-step[${stepIndex + 1}]`
      assertCopyFits({
        component: 'deck-swimlane',
        field: `${label}.title`,
        text: step.title,
        maxChars: 22,
        maxLines: 1,
        charsPerLine: 22,
        context,
      })
      if (step.body) {
        assertCopyFits({
          component: 'deck-swimlane',
          field: `${label}.body`,
          text: step.body,
          maxChars: bodyChars,
          maxLines: compact ? 2 : 3,
          charsPerLine: stepCount >= 4 ? 36 : compact ? 52 : 42,
          context,
        })
      }
    })
  })
}

function validateDividerCopy(model, context) {
  assertCopyFits({
    component: 'deck-divider',
    field: 'title',
    text: model.title,
    maxChars: 82,
    maxLines: 3,
    charsPerLine: 30,
    context,
  })
  if (model.subtitle) {
    assertCopyFits({
      component: 'deck-divider',
      field: 'subtitle',
      text: model.subtitle,
      maxChars: 130,
      maxLines: 2,
      charsPerLine: 65,
      context,
    })
  }
}

function assertCopyFits({ component, field, text, maxChars, maxLines, charsPerLine, context }) {
  const normalized = cleanText(text)
  if (!normalized) return
  const lines = estimateCopyLines(normalized, charsPerLine)
  if (normalized.length <= maxChars && lines <= maxLines) return

  fail(
    `Keep <${component}>; shorten ${field} to fit this component (${normalized.length}/${maxChars} chars, ${lines}/${maxLines} estimated line(s)). Do not switch component type; reduce words or split the idea across another slide.`,
    context,
  )
}

function estimateCopyLines(text, charsPerLine) {
  return String(text || '')
    .split(/\r?\n/)
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.trim().length / Math.max(8, charsPerLine))), 0)
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
