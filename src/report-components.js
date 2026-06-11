import * as cheerio from 'cheerio'

import {
  parseReportAccentCard,
  parseReportBadge,
  parseReportCallout,
  parseReportCardGrid,
  parseReportChart,
  parseReportDataTable,
  parseReportFigure,
  parseReportInsight,
  parseReportKeyValues,
  parseReportMetricGrid,
  parseReportRateBars,
  parseReportRecommendation,
  parseReportSourceNote,
  parseReportTimeline,
} from './report-components/parsers.js'
import {
  renderReportAccentCardHtml,
  renderReportBadgeHtml,
  renderReportCalloutHtml,
  renderReportCardGridHtml,
  renderReportChartHtml,
  renderReportChartScript,
  renderReportDataTableHtml,
  renderReportFigureHtml,
  renderReportInsightHtml,
  renderReportKeyValuesHtml,
  renderReportMetricGridHtml,
  renderReportRateBarsHtml,
  renderReportRecommendationHtml,
  renderReportSourceNoteHtml,
  renderReportTimelineHtml,
} from './report-components/renderers.js'

const knownReportTags = new Set([
  'report-accent-card',
  'report-badge',
  'report-callout',
  'report-card-grid',
  'report-card',
  'report-chart',
  'report-data-table',
  'report-figure',
  'report-insight',
  'report-key-values',
  'report-metric-grid',
  'report-metric',
  'report-rate-bars',
  'report-recommendation',
  'report-source-note',
  'report-timeline',
  'report-event',
])

export function compileReportComponents(source, options = {}) {
  const context = reportComponentContext(options)
  validateReportComponentSyntax(source, context)

  const root = cheerio.load(`<root>${source}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  validateReportComponentTree(root, context)

  const scripts = []
  const usedIds = new Set()

  root('report-metric-grid').each((_, element) => {
    const metricGridElement = root(element)
    const metricGrid = parseReportMetricGrid(root, metricGridElement)
    validateReportMetricGrid(metricGrid, context)
    metricGridElement.replaceWith(renderReportMetricGridHtml(metricGrid))
  })

  root('report-rate-bars').each((_, element) => {
    const rateBarsElement = root(element)
    const rateBars = parseReportRateBars(rateBarsElement)
    validateReportRateBars(rateBars, context)
    rateBarsElement.replaceWith(renderReportRateBarsHtml(rateBars, context))
  })

  root('report-callout').each((_, element) => {
    const calloutElement = root(element)
    const callout = parseReportCallout(calloutElement)
    validateReportCallout(callout, context)
    calloutElement.replaceWith(renderReportCalloutHtml(callout))
  })

  root('report-figure').each((_, element) => {
    const figureElement = root(element)
    const figure = parseReportFigure(figureElement)
    validateReportFigure(figure, context)
    figureElement.replaceWith(renderReportFigureHtml(figure))
  })

  root('report-data-table').each((_, element) => {
    const tableElement = root(element)
    const table = parseReportDataTable(tableElement)
    validateReportDataTable(table, context)
    tableElement.replaceWith(renderReportDataTableHtml(table))
  })

  root('report-key-values').each((_, element) => {
    const keyValuesElement = root(element)
    const keyValues = parseReportKeyValues(keyValuesElement)
    validateReportKeyValues(keyValues, context)
    keyValuesElement.replaceWith(renderReportKeyValuesHtml(keyValues))
  })

  root('report-insight').each((_, element) => {
    const insightElement = root(element)
    const insight = parseReportInsight(insightElement)
    validateReportInsight(insight, context)
    insightElement.replaceWith(renderReportInsightHtml(insight))
  })

  root('report-recommendation').each((_, element) => {
    const recommendationElement = root(element)
    const recommendation = parseReportRecommendation(recommendationElement)
    validateReportRecommendation(recommendation, context)
    recommendationElement.replaceWith(renderReportRecommendationHtml(recommendation))
  })

  root('report-card-grid').each((_, element) => {
    const cardGridElement = root(element)
    const cardGrid = parseReportCardGrid(root, cardGridElement)
    validateReportCardGrid(cardGrid, context)
    cardGridElement.replaceWith(renderReportCardGridHtml(cardGrid))
  })

  root('report-source-note').each((_, element) => {
    const sourceNoteElement = root(element)
    const sourceNote = parseReportSourceNote(sourceNoteElement)
    validateReportSourceNote(sourceNote, context)
    sourceNoteElement.replaceWith(renderReportSourceNoteHtml(sourceNote))
  })

  root('report-timeline').each((_, element) => {
    const timelineElement = root(element)
    const timeline = parseReportTimeline(root, timelineElement)
    validateReportTimeline(timeline, context)
    timelineElement.replaceWith(renderReportTimelineHtml(timeline))
  })

  root('report-accent-card').each((_, element) => {
    const cardElement = root(element)
    const card = parseReportAccentCard(cardElement)
    validateReportAccentCard(card, context)
    cardElement.replaceWith(renderReportAccentCardHtml(card))
  })

  root('report-badge').each((_, element) => {
    const badgeElement = root(element)
    const badge = parseReportBadge(badgeElement)
    validateReportBadge(badge, context)
    badgeElement.replaceWith(renderReportBadgeHtml(badge))
  })

  root('report-chart').each((index, element) => {
    const chartElement = root(element)
    const chart = parseReportChart(chartElement, index)
    chart.id = uniqueDomId(chart.id || chart.generatedId, usedIds, 'report-chart')
    validateReportChart(chart, context)
    scripts.push(renderReportChartScript(chart, context))
    chartElement.replaceWith(renderReportChartHtml(chart))
  })

  const compiledSource = root('root').html() || source
  return {
    source: appendReportComponentScripts(compiledSource, scripts),
    scripts,
  }
}

function validateReportComponentTree(root, context) {
  root('report-metric').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('report-metric-grid')) {
      fail('<report-metric> must be placed directly inside <report-metric-grid>.', context)
    }
  })
  root('report-card').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('report-card-grid')) {
      fail('<report-card> must be placed directly inside <report-card-grid>.', context)
    }
  })
  root('report-event').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('report-timeline')) {
      fail('<report-event> must be placed directly inside <report-timeline>.', context)
    }
  })
}

function appendReportComponentScripts(source, scripts = []) {
  if (!scripts.length) return source
  return `${source}

<script data-report-component-script="chart">
document.addEventListener("DOMContentLoaded", function() {
${scripts.map((script) => indent(script, 2)).join('\n\n')}
});
</script>`
}

function validateReportComponentSyntax(source, context) {
  const stack = []
  const tagPattern = /<\/?\s*(report-[a-z0-9-]+)\b[^>]*>/gi

  for (const match of source.matchAll(tagPattern)) {
    const raw = match[0]
    const tag = match[1].toLowerCase()
    const line = lineNumberAt(source, match.index)
    if (!knownReportTags.has(tag)) {
      fail(
        `Report component <${tag}> is not available. Use a supported report-* component or ask the skill maker to add it.`,
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
          `Mismatched report component tags: opened <${opened.tag}> on line ${opened.line}, but found </${tag}>.`,
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
    fail(`Unclosed report component <${opened.tag}> opened on line ${opened.line}.`, context, opened.line)
  }
}

function validateReportChart(chart, context) {
  const supportedTypes = new Set([
    'bar',
    'line',
    'doughnut',
    'area',
    'treemap',
    'funnel',
    'grouped-bar',
    'stacked-bar',
    'heatmap',
  ])
  if (!supportedTypes.has(chart.chartType)) {
    fail(
      `report-chart type "${chart.chartType}" is not available. Supported types: bar, line, doughnut, area, treemap, funnel, grouped-bar, stacked-bar, heatmap. Ask the skill maker to add missing chart types.`,
      context,
    )
  }
  if (chart.chartType === 'area') {
    if (chart.points.length === 0) {
      fail('report-chart type="area" requires non-empty points or labels/values attributes.', context)
    }
    if (chart.points.some((point) => !point.x || !Number.isFinite(point.y))) {
      fail('report-chart area points must be x:y pairs with numeric y values.', context)
    }
    return
  }
  if (chart.chartType === 'treemap') {
    validateReportChartLabelsAndValues(chart, context)
    if (chart.values.some((value) => value < 0)) {
      fail('report-chart treemap values must be zero or positive.', context)
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail('report-chart treemap values must sum to more than zero.', context)
    }
    return
  }
  if (chart.chartType === 'funnel') {
    validateReportChartLabelsAndValues(chart, context)
    if (chart.values.some((value) => value < 0)) {
      fail('report-chart funnel values must be zero or positive.', context)
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail('report-chart funnel values must sum to more than zero.', context)
    }
    return
  }
  if (chart.chartType === 'grouped-bar' || chart.chartType === 'stacked-bar') {
    validateReportMultiSeriesChart(chart, context)
    return
  }
  if (chart.chartType === 'heatmap') {
    validateReportHeatmapChart(chart, context)
    return
  }
  validateReportChartLabelsAndValues(chart, context)
  if (chart.chartType === 'doughnut') {
    if (chart.values.some((value) => value < 0)) {
      fail('report-chart doughnut values must be zero or positive.', context)
    }
    if (chart.values.reduce((sum, value) => sum + value, 0) <= 0) {
      fail('report-chart doughnut values must sum to more than zero.', context)
    }
  }
}

function validateReportChartLabelsAndValues(chart, context) {
  if (chart.labels.length === 0 || chart.values.length === 0) {
    fail('report-chart requires non-empty labels and values attributes.', context)
  }
  if (chart.labels.length !== chart.values.length) {
    fail(
      `report-chart labels/values length mismatch: ${chart.labels.length} label(s), ${chart.values.length} value(s).`,
      context,
    )
  }
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail('report-chart values must all be numeric.', context)
  }
}

function validateReportMultiSeriesChart(chart, context) {
  if (chart.labels.length === 0) {
    fail(`report-chart type="${chart.chartType}" requires non-empty labels.`, context)
  }
  if (chart.seriesNames.length === 0) {
    fail(`report-chart type="${chart.chartType}" requires series names in the series attribute.`, context)
  }
  if (chart.matrix.length === 0) {
    fail(`report-chart type="${chart.chartType}" requires matrix values in values, matrix, or series-values.`, context)
  }
  if (chart.matrix.length !== chart.labels.length) {
    fail(
      `report-chart type="${chart.chartType}" labels/rows length mismatch: ${chart.labels.length} label(s), ${chart.matrix.length} row(s).`,
      context,
    )
  }
  chart.matrix.forEach((row, rowIndex) => {
    if (row.length !== chart.seriesNames.length) {
      fail(
        `report-chart type="${chart.chartType}" row ${rowIndex + 1} has ${row.length} value(s), but ${chart.seriesNames.length} series were declared.`,
        context,
      )
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`report-chart type="${chart.chartType}" row ${rowIndex + 1} values must all be numeric.`, context)
    }
  })
}

function validateReportHeatmapChart(chart, context) {
  if (chart.xLabels.length === 0) {
    fail('report-chart type="heatmap" requires x-labels or columns.', context)
  }
  if (chart.yLabels.length === 0) {
    fail('report-chart type="heatmap" requires y-labels or rows.', context)
  }
  if (chart.matrix.length === 0) {
    fail('report-chart type="heatmap" requires matrix values in values, matrix, or series-values.', context)
  }
  if (chart.matrix.length !== chart.yLabels.length) {
    fail(
      `report-chart type="heatmap" y-labels/rows length mismatch: ${chart.yLabels.length} y-label(s), ${chart.matrix.length} row(s).`,
      context,
    )
  }
  chart.matrix.forEach((row, rowIndex) => {
    if (row.length !== chart.xLabels.length) {
      fail(
        `report-chart type="heatmap" row ${rowIndex + 1} has ${row.length} value(s), but ${chart.xLabels.length} x-label(s) were declared.`,
        context,
      )
    }
    if (row.some((value) => !Number.isFinite(value))) {
      fail(`report-chart type="heatmap" row ${rowIndex + 1} values must all be numeric.`, context)
    }
  })
}

function validateReportMetricGrid(metricGrid, context) {
  if (metricGrid.metrics.length === 0) {
    fail('report-metric-grid must include at least one report-metric.', context)
  }
  metricGrid.metrics.forEach((metric, index) => {
    if (!metric.value && !metric.label) {
      fail(`report-metric at position ${index + 1} must include value and/or label.`, context)
    }
  })
}

function validateReportFigure(figure, context) {
  const sizes = new Set(['narrow', 'normal', 'wide'])
  if (!figure.src) {
    fail('report-figure requires a src attribute.', context)
  }
  if (!figure.alt) {
    fail('report-figure requires an alt attribute for accessibility.', context)
  }
  if (!sizes.has(figure.size)) {
    fail('report-figure size must be narrow, normal, or wide.', context)
  }
}

function validateReportDataTable(table, context) {
  const supportedTypes = new Set(['text', 'number', 'percent', 'status'])
  const supportedAlignments = new Set(['left', 'center', 'right'])
  const supportedHighlights = new Set(['blue', 'green', 'orange', 'red', 'muted'])
  if (table.columns.length === 0) {
    fail('report-data-table requires columns or headers.', context)
  }
  if (table.rows.length === 0) {
    fail('report-data-table requires at least one row in rows or data.', context)
  }
  if (table.types.length !== table.columns.length) {
    fail(
      `report-data-table types/columns length mismatch: ${table.types.length} type(s), ${table.columns.length} column(s).`,
      context,
    )
  }
  table.types.forEach((type) => {
    if (!supportedTypes.has(type)) {
      fail(
        `report-data-table type "${type}" is not available. Supported types: text, number, percent, status. Ask the skill maker to add missing table cell types.`,
        context,
      )
    }
  })
  if (table.align.length > 0 && table.align.length !== table.columns.length) {
    fail(
      `report-data-table align/columns length mismatch: ${table.align.length} alignment(s), ${table.columns.length} column(s).`,
      context,
    )
  }
  table.align.forEach((align) => {
    if (!supportedAlignments.has(align)) {
      fail('report-data-table align supports only left, center, or right.', context)
    }
  })
  if (table.totals.length > 0) {
    if (table.totals.length !== table.columns.length) {
      fail(
        `report-data-table totals row has ${table.totals.length} cell(s), but ${table.columns.length} column(s) were declared.`,
        context,
      )
    }
    table.totals.forEach((value, cellIndex) => {
      const type = table.types[cellIndex]
      if ((type === 'number' || type === 'percent') && !Number.isFinite(parseDataTableNumber(value))) {
        fail(`report-data-table totals column "${table.columns[cellIndex]}" must be numeric.`, context)
      }
    })
  }
  table.highlights.forEach((highlight) => {
    if (!Number.isInteger(highlight.row) || highlight.row < 1 || highlight.row > table.rows.length) {
      fail('report-data-table highlights must target an existing 1-based row number.', context)
    }
    if (highlight.column && (!Number.isInteger(highlight.column) || highlight.column < 1 || highlight.column > table.columns.length)) {
      fail('report-data-table cell highlights must target an existing 1-based column number.', context)
    }
    if (!supportedHighlights.has(highlight.variant)) {
      fail(
        `report-data-table highlight "${highlight.rawVariant}" is not available. Supported highlights: blue, green, orange, red, muted.`,
        context,
      )
    }
  })
  table.rows.forEach((row, index) => {
    if (row.length !== table.columns.length) {
      fail(
        `report-data-table row ${index + 1} has ${row.length} cell(s), but ${table.columns.length} column(s) were declared.`,
        context,
      )
    }
    row.forEach((value, cellIndex) => {
      const type = table.types[cellIndex]
      if ((type === 'number' || type === 'percent') && !Number.isFinite(parseDataTableNumber(value))) {
        fail(`report-data-table row ${index + 1} column "${table.columns[cellIndex]}" must be numeric.`, context)
      }
    })
  })
}

function validateReportKeyValues(keyValues, context) {
  if (keyValues.items.length === 0) {
    fail('report-key-values requires at least one item in items or data.', context)
  }
  if (keyValues.columns < 1 || keyValues.columns > 4) {
    fail('report-key-values columns must be between 1 and 4.', context)
  }
  keyValues.items.forEach((item, index) => {
    if (!item.key || !item.value) {
      fail(`report-key-values item ${index + 1} must use "Label: Value" or "Label=Value".`, context)
    }
  })
}

function validateReportInsight(insight, context) {
  const supportedVariants = new Set(['info', 'warning', 'success', 'danger'])
  if (!supportedVariants.has(insight.variant)) {
    fail(
      `report-insight variant "${insight.rawVariant}" is not available. Supported variants: info, warning, success, danger. Ask the skill maker to add missing insight variants.`,
      context,
    )
  }
  if (!insight.title && !insight.finding && !insight.evidence && !insight.impact && !insight.action) {
    fail('report-insight requires title, finding/body text, evidence, impact, or action.', context)
  }
}

function validateReportRecommendation(recommendation, context) {
  const supportedPriorities = new Set(['', 'critical', 'high', 'medium', 'low'])
  if (!recommendation.title && !recommendation.body) {
    fail('report-recommendation requires title or body text.', context)
  }
  if (!supportedPriorities.has(recommendation.priority)) {
    fail(
      `report-recommendation priority "${recommendation.rawPriority}" is not available. Supported priorities: critical, high, medium, low. Ask the skill maker to add missing recommendation priorities.`,
      context,
    )
  }
}

function validateReportSourceNote(sourceNote, context) {
  if (!sourceNote.title && !sourceNote.body && !sourceNote.source && !sourceNote.date) {
    fail('report-source-note requires title, body text, source, or date.', context)
  }
}

function validateReportCardGrid(cardGrid, context) {
  const accents = new Set(['blue', 'cyan', 'purple', 'green', 'orange', 'red'])
  if (cardGrid.columns < 1 || cardGrid.columns > 4) {
    fail('report-card-grid columns must be between 1 and 4.', context)
  }
  if (cardGrid.cards.length === 0) {
    fail('report-card-grid must include at least one report-card.', context)
  }
  cardGrid.cards.forEach((card, index) => {
    if (!accents.has(card.accent)) {
      fail(
        `Unsupported report-card accent "${card.rawAccent}". Supported accents: blue, cyan, purple, green, orange, red.`,
        context,
      )
    }
    if (!card.title && !card.body) {
      fail(`report-card at position ${index + 1} must include title and/or body text.`, context)
    }
  })
}

function validateReportTimeline(timeline, context) {
  const variants = new Set(['blue', 'green', 'orange', 'red', 'muted'])
  if (timeline.events.length === 0) {
    fail('report-timeline must include at least one report-event.', context)
  }
  timeline.events.forEach((event, index) => {
    if (!variants.has(event.status)) {
      fail(
        `Unsupported report-event status "${event.rawStatus}". Supported statuses map to blue, green, orange, red, or muted.`,
        context,
      )
    }
    if (!event.date && !event.title && !event.body) {
      fail(`report-event at position ${index + 1} must include date, title, and/or body text.`, context)
    }
  })
}

function validateReportRateBars(rateBars, context) {
  if (rateBars.labels.length === 0 || rateBars.values.length === 0) {
    fail('report-rate-bars requires non-empty labels and values attributes.', context)
  }
  if (rateBars.labels.length !== rateBars.values.length) {
    fail(
      `report-rate-bars labels/values length mismatch: ${rateBars.labels.length} label(s), ${rateBars.values.length} value(s).`,
      context,
    )
  }
  if (rateBars.values.some((value) => !Number.isFinite(value))) {
    fail('report-rate-bars values must all be numeric.', context)
  }
  if (rateBars.values.some((value) => value < 0)) {
    fail('report-rate-bars values must be zero or positive.', context)
  }
  if (rateBars.shares.length > 0) {
    if (rateBars.shares.length !== rateBars.labels.length) {
      fail(
        `report-rate-bars shares length mismatch: ${rateBars.shares.length} share(s), ${rateBars.labels.length} label(s).`,
        context,
      )
    }
    if (rateBars.shares.some((share) => !Number.isFinite(share))) {
      fail('report-rate-bars shares must all be numeric.', context)
    }
    if (rateBars.shares.some((share) => share < 0)) {
      fail('report-rate-bars shares must be zero or positive.', context)
    }
  } else if (rateBars.values.reduce((sum, value) => sum + value, 0) <= 0) {
    fail('report-rate-bars values must sum to more than zero when shares are omitted.', context)
  }
  if (rateBars.colors.some((color) => !isSixDigitHexColor(color))) {
    fail('report-rate-bars colors must be six-digit hex colors.', context)
  }
}

function validateReportCallout(callout, context) {
  const variants = new Set(['info', 'warning', 'success', 'danger'])
  if (!variants.has(callout.variant)) {
    fail(
      `Unsupported report-callout variant "${callout.rawVariant}". Supported variants: info, warning, success, danger.`,
      context,
    )
  }
  if (!callout.title && !callout.body) {
    fail('report-callout requires title and/or text content.', context)
  }
}

function validateReportAccentCard(card, context) {
  const accents = new Set(['blue', 'cyan', 'purple', 'green', 'orange', 'red'])
  if (!accents.has(card.accent)) {
    fail(
      `Unsupported report-accent-card accent "${card.rawAccent}". Supported accents: blue, cyan, purple, green, orange, red.`,
      context,
    )
  }
  if (!card.title && !card.body) {
    fail('report-accent-card requires title and/or text content.', context)
  }
}

function validateReportBadge(badge, context) {
  const variants = new Set(['blue', 'green', 'orange', 'red', 'muted'])
  if (!variants.has(badge.variant)) {
    fail(
      `Unsupported report-badge variant "${badge.rawVariant}". Supported variants: blue, green, orange, red, muted.`,
      context,
    )
  }
  if (!badge.label) {
    fail('report-badge requires label or text content.', context)
  }
}

function uniqueDomId(value, usedIds, prefix) {
  const base = sanitizeDomId(value) || prefix
  let candidate = base
  let suffix = 2
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  usedIds.add(candidate)
  return candidate
}

function sanitizeDomId(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

function isSixDigitHexColor(value) {
  return /^#?[0-9a-f]{6}$/i.test(String(value || '').trim())
}

function parseDataTableNumber(value) {
  return Number(String(value || '').replace(/,/g, '').replace(/%$/, '').trim())
}

function indent(source, spaces) {
  const padding = ' '.repeat(spaces)
  return String(source || '')
    .split('\n')
    .map((line) => `${padding}${line}`)
    .join('\n')
}

function reportComponentContext(options = {}) {
  return options.reportName ? `report "${options.reportName}"` : 'report'
}

function lineNumberAt(source, index = 0) {
  return String(source || '').slice(0, index).split(/\r?\n/).length
}

function fail(message, context = 'report', line = 0) {
  throw new Error(`Invalid report Markdown in ${context}${line ? `, line ${line}` : ''}: ${message}`)
}
