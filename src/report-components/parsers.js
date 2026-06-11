import { normalizeResourceReference } from '../resources.js'
import { cleanText, splitCsv } from './utils.js'

export function parseReportChart(chart, index = 0) {
  const type = normalizeChartType(chart.attr('type') || 'bar')
  const labels = splitCsv(chart.attr('labels'))
  const values = splitCsv(chart.attr('values')).map((value) => Number(value))
  const targets = splitCsv(chart.attr('targets') || chart.attr('target-values') || chart.attr('target')).map((value) =>
    Number(value),
  )
  const title = chart.attr('title') || cleanText(chart.find('h2,h3,figcaption').first().text())
  const series = chart.attr('series') || title || 'Series 1'
  const colors = splitCsv(chart.attr('colors'))
  const height = parseDimension(chart.attr('height'), 320)
  const requestedId = chart.attr('id') || chart.attr('chart-id') || ''
  const valuePrefix = chart.attr('value-prefix') || chart.attr('prefix') || ''
  const valueSuffix = chart.attr('value-suffix') || chart.attr('suffix') || ''
  const xAxisLabel = chart.attr('x-label') || chart.attr('x-axis-label') || chart.attr('x-title') || ''
  const yAxisLabel = chart.attr('y-label') || chart.attr('y-axis-label') || chart.attr('y-title') || ''
  const points = parseChartPoints(chart.attr('points') || chart.attr('data'))
  const seriesNames = splitPipe(chart.attr('series') || chart.attr('datasets') || chart.attr('series-labels'))
  const xLabels = splitPipe(chart.attr('x-labels') || chart.attr('columns') || chart.attr('x') || '')
  const yLabels = splitPipe(chart.attr('y-labels') || chart.attr('rows') || chart.attr('y') || '')
  const matrix = parseChartMatrix(
    chart.attr('matrix') ||
      chart.attr('series-values') ||
      (['grouped-bar', 'stacked-bar', 'heatmap'].includes(type) ? chart.attr('values') : ''),
  )
  const derivedPoints =
    points.length > 0
      ? points
      : labels.map((label, index) => ({
          x: label,
          y: values[index],
        }))

  return {
    type: 'chart',
    chartType: type,
    id: requestedId,
    generatedId: `report-chart-${index + 1}`,
    title,
    series,
    labels,
    values,
    targets,
    colors,
    points: derivedPoints,
    seriesNames,
    xLabels,
    yLabels,
    matrix,
    height,
    valuePrefix,
    valueSuffix,
    xAxisLabel,
    yAxisLabel,
    ariaLabel: chart.attr('aria-label') || title || `${type} chart`,
  }
}

export function parseReportMetricGrid(root, grid) {
  const metrics = []
  grid.children('report-metric').each((_, element) => {
    const metric = root(element)
    const value = metric.attr('value') || cleanText(metric.find('value,strong').first().text())
    const label = metric.attr('label') || cleanText(metric.find('label,span').first().text() || metric.text())
    const sub = metric.attr('sub') || metric.attr('delta') || metric.attr('change') || ''
    if (value || label || sub) {
      metrics.push({
        value,
        label,
        sub,
        direction: normalizeMetricDirection(metric.attr('direction') || metric.attr('trend')),
        accent: normalizeAccent(metric.attr('accent') || metric.attr('color')),
      })
    }
  })

  return {
    type: 'metric-grid',
    metrics,
  }
}

export function parseReportFigure(figure) {
  return {
    type: 'figure',
    src: normalizeResourceReference(figure.attr('src') || figure.attr('image') || ''),
    alt: figure.attr('alt') || '',
    caption: figure.attr('caption') || cleanText(figure.text()),
    source: figure.attr('source') || '',
    size: normalizeFigureSize(figure.attr('size') || figure.attr('width') || ''),
  }
}

export function parseReportDataTable(table) {
  const columns = splitPipe(table.attr('columns') || table.attr('headers'))
  const rawTypes = splitPipe(table.attr('types') || table.attr('formats'))
  const types = rawTypes.length ? rawTypes.map(normalizeDataTableType) : columns.map(() => 'text')
  const rows = splitRows(table.attr('rows') || table.attr('data')).map((row) => splitPipe(row, { keepEmpty: true }))
  const totalsValue = table.attr('totals') || table.attr('total') || table.attr('footer') || ''
  const totals = cleanText(totalsValue) ? splitPipe(totalsValue, { keepEmpty: true }) : []

  return {
    type: 'data-table',
    title: table.attr('title') || cleanText(table.find('caption,h2,h3').first().text()),
    columns,
    types,
    rows,
    compact: normalizeBoolean(table.attr('compact') || table.attr('dense')),
    align: parseDataTableAlignments(table.attr('align') || table.attr('alignment')),
    totals,
    highlights: parseDataTableHighlights(table.attr('highlights') || table.attr('highlight')),
    caption: table.attr('caption') || '',
    source: table.attr('source') || '',
  }
}

export function parseReportKeyValues(keyValues) {
  return {
    type: 'key-values',
    title: keyValues.attr('title') || cleanText(keyValues.find('h2,h3').first().text()),
    items: parseKeyValueItems(keyValues.attr('items') || keyValues.attr('data') || cleanText(keyValues.text())),
    columns: normalizeKeyValueColumns(keyValues.attr('columns') || keyValues.attr('cols') || ''),
  }
}

export function parseReportInsight(insight) {
  return {
    type: 'insight',
    variant: normalizeCalloutVariant(insight.attr('variant') || insight.attr('type') || insight.attr('tone') || 'info'),
    rawVariant: insight.attr('variant') || insight.attr('type') || insight.attr('tone') || 'info',
    title: insight.attr('title') || cleanText(insight.find('h3,strong,b').first().text()),
    finding: insight.attr('finding') || insight.attr('text') || insight.attr('body') || cleanText(insight.text()),
    evidence: insight.attr('evidence') || '',
    impact: insight.attr('impact') || '',
    action: insight.attr('action') || insight.attr('next') || '',
  }
}

export function parseReportRecommendation(recommendation) {
  return {
    type: 'recommendation',
    title: recommendation.attr('title') || cleanText(recommendation.find('h3,strong,b').first().text()),
    body: recommendation.attr('body') || recommendation.attr('text') || cleanText(recommendation.text()),
    owner: recommendation.attr('owner') || '',
    priority: normalizeRecommendationPriority(recommendation.attr('priority') || ''),
    rawPriority: recommendation.attr('priority') || '',
    due: recommendation.attr('due') || recommendation.attr('date') || '',
    status: normalizeBadgeVariant(recommendation.attr('status') || recommendation.attr('state') || 'pending'),
    rawStatus: recommendation.attr('status') || recommendation.attr('state') || 'pending',
  }
}

export function parseReportPageBreak(pageBreak) {
  return {
    type: 'page-break',
    label: pageBreak.attr('label') || pageBreak.attr('title') || '',
  }
}

export function parseReportCardGrid(root, grid) {
  const cards = []
  grid.children('report-card').each((_, element) => {
    const card = root(element)
    const rawAccent = card.attr('accent') || card.attr('color') || card.attr('tone') || 'blue'
    cards.push({
      title: card.attr('title') || cleanText(card.find('h3,strong,b').first().text()),
      body: card.attr('body') || card.attr('text') || cleanText(card.text()),
      accent: normalizeAccent(rawAccent) || String(rawAccent || '').trim().toLowerCase(),
      rawAccent,
    })
  })

  return {
    type: 'card-grid',
    title: grid.attr('title') || cleanText(grid.find('h2,h3').first().text()),
    columns: normalizeCardGridColumns(grid.attr('columns') || grid.attr('cols') || ''),
    cards,
  }
}

export function parseReportTimeline(root, timeline) {
  const events = []
  timeline.children('report-event').each((_, element) => {
    const event = root(element)
    const rawStatus = event.attr('status') || event.attr('variant') || event.attr('tone') || 'muted'
    events.push({
      date: event.attr('date') || event.attr('time') || event.attr('period') || '',
      title: event.attr('title') || cleanText(event.find('h3,strong,b').first().text()),
      body: event.attr('body') || event.attr('text') || cleanText(event.text()),
      status: normalizeBadgeVariant(rawStatus),
      rawStatus,
    })
  })

  return {
    type: 'timeline',
    title: timeline.attr('title') || cleanText(timeline.find('h2,h3').first().text()),
    events,
  }
}

export function parseReportSourceNote(sourceNote) {
  return {
    type: 'source-note',
    title: sourceNote.attr('title') || sourceNote.attr('label') || '',
    body: sourceNote.attr('text') || sourceNote.attr('body') || cleanText(sourceNote.text()),
    source: sourceNote.attr('source') || '',
    date: sourceNote.attr('date') || sourceNote.attr('period') || '',
  }
}

export function parseReportSourceList(root, sourceList) {
  const sources = []
  sourceList.children('report-source').each((_, element) => {
    const source = root(element)
    sources.push({
      id: source.attr('id') || source.attr('source-id') || '',
      title: source.attr('title') || source.attr('label') || '',
      publisher: source.attr('publisher') || source.attr('source') || '',
      date: source.attr('date') || source.attr('period') || '',
      url: source.attr('url') || source.attr('href') || '',
      note: source.attr('note') || source.attr('text') || source.attr('body') || cleanText(source.text()),
    })
  })

  return {
    type: 'source-list',
    title: sourceList.attr('title') || sourceList.attr('label') || 'Sources',
    sources,
  }
}

export function parseReportCite(cite) {
  return {
    type: 'cite',
    source: cite.attr('source') || cite.attr('ref') || cite.attr('id') || '',
    label: cite.attr('label') || cleanText(cite.text()),
  }
}

export function parseReportCallout(callout) {
  return {
    type: 'callout',
    variant: normalizeCalloutVariant(callout.attr('variant') || callout.attr('type') || callout.attr('tone')),
    rawVariant: callout.attr('variant') || callout.attr('type') || callout.attr('tone') || 'info',
    title: callout.attr('title') || cleanText(callout.find('strong,b,h3').first().text()),
    body: callout.attr('text') || cleanText(callout.text()),
  }
}

export function parseReportAccentCard(card) {
  const rawAccent = card.attr('accent') || card.attr('color') || card.attr('tone') || 'blue'
  return {
    type: 'accent-card',
    accent: normalizeAccent(rawAccent) || String(rawAccent || '').trim().toLowerCase(),
    rawAccent,
    title: card.attr('title') || cleanText(card.find('h3,strong,b').first().text()),
    body: card.attr('body') || card.attr('text') || cleanText(card.text()),
  }
}

export function parseReportBadge(badge) {
  const label = badge.attr('label') || cleanText(badge.text())
  const rawVariant =
    badge.attr('variant') || badge.attr('color') || badge.attr('tone') || badge.attr('status') || label || 'muted'
  return {
    type: 'badge',
    variant: normalizeBadgeVariant(rawVariant),
    rawVariant,
    label,
  }
}

export function parseReportRateBars(rateBars) {
  return {
    type: 'rate-bars',
    title: rateBars.attr('title') || cleanText(rateBars.find('h2,h3,figcaption').first().text()),
    labels: splitCsv(rateBars.attr('labels')),
    values: splitCsv(rateBars.attr('values')).map((value) => Number(value)),
    shares: splitCsv(rateBars.attr('shares') || rateBars.attr('percentages') || rateBars.attr('percents')).map((value) =>
      Number(value),
    ),
    colors: splitCsv(rateBars.attr('colors')),
    ariaLabel: rateBars.attr('aria-label') || rateBars.attr('title') || 'Ranked distribution',
  }
}

function normalizeChartType(value = 'bar') {
  const token = String(value || 'bar').trim().toLowerCase()
  if (token === 'column') return 'bar'
  if (token === 'donut') return 'doughnut'
  if (token === 'tree-map') return 'treemap'
  if (['grouped', 'groupedbar', 'clustered', 'clustered-bar', 'clusteredbar'].includes(token)) return 'grouped-bar'
  if (['stacked', 'stackedbar'].includes(token)) return 'stacked-bar'
  return token
}

function normalizeFigureSize(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['narrow', 'normal', 'wide'].includes(token)) return token
  return token || 'normal'
}

function normalizeDataTableType(value = '') {
  return String(value || 'text').trim().toLowerCase()
}

function normalizeBoolean(value = '') {
  const token = String(value || '').trim().toLowerCase()
  return ['1', 'true', 'yes', 'y', 'on', 'compact', 'dense'].includes(token)
}

function parseDataTableAlignments(value = '') {
  return splitPipe(value).map((item) => {
    const token = String(item || '').trim().toLowerCase()
    if (token === 'middle') return 'center'
    if (['left', 'center', 'right'].includes(token)) return token
    return token
  })
}

function parseDataTableHighlights(value = '') {
  return splitRows(value).map((item) => {
    const separator = item.includes('=') ? '=' : ':'
    const [target, ...rest] = item.split(separator)
    const [row, column] = cleanText(target).split('.')
    return {
      row: Number.parseInt(row, 10),
      column: column ? Number.parseInt(column, 10) : 0,
      variant: normalizeBadgeVariant(rest.join(separator)),
      rawVariant: cleanText(rest.join(separator)),
    }
  })
}

function splitPipe(value = '', options = {}) {
  const keepEmpty = Boolean(options.keepEmpty)
  const items = String(value || '')
    .split('|')
    .map((item) => cleanText(item))
  return keepEmpty ? items : items.filter(Boolean)
}

function splitRows(value = '') {
  return String(value || '')
    .split(';')
    .map((row) => row.trim())
    .filter(Boolean)
}

function parseKeyValueItems(value = '') {
  return splitRows(value).map((item) => {
    const separator = item.includes('=') ? '=' : ':'
    const [key, ...rest] = item.split(separator)
    return {
      key: cleanText(key),
      value: cleanText(rest.join(separator)),
    }
  })
}

function normalizeKeyValueColumns(value = '') {
  const numeric = Number.parseInt(value || 2, 10)
  if (!Number.isFinite(numeric)) return 2
  return numeric
}

function normalizeCardGridColumns(value = '') {
  const numeric = Number.parseInt(value || 3, 10)
  if (!Number.isFinite(numeric)) return 0
  return numeric
}

function parseChartPoints(value = '') {
  return splitCsv(value).map((item) => {
    const separator = item.includes('=') ? '=' : ':'
    const [x, ...rest] = item.split(separator)
    return {
      x: cleanText(x),
      y: Number(rest.join(separator).trim()),
    }
  })
}

function parseChartMatrix(value = '') {
  return splitRows(value).map((row) => splitPipe(row, { keepEmpty: true }).map((cell) => Number(cell.replace(/,/g, ''))))
}

function parseDimension(value, fallback) {
  const numeric = Number.parseInt(value || fallback, 10)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(720, Math.max(180, numeric))
}

function normalizeMetricDirection(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['down', 'negative', 'decrease', 'bad'].includes(token)) return 'down'
  return ''
}

function normalizeCalloutVariant(value = 'info') {
  const token = String(value || 'info').trim().toLowerCase()
  if (token === 'danger' || token === 'error') return 'danger'
  if (token === 'warn') return 'warning'
  if (token === 'positive') return 'success'
  return token
}

function normalizeRecommendationPriority(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['critical', 'high', 'medium', 'low'].includes(token)) return token
  return token
}

function normalizeBadgeVariant(value = 'muted') {
  const token = String(value || 'muted').trim().toLowerCase()
  if (['green', 'success', 'active', 'approved', 'done', 'complete', 'completed', 'pass'].includes(token)) {
    return 'green'
  }
  if (['blue', 'info', 'live', 'new'].includes(token)) return 'blue'
  if (['orange', 'warning', 'warn', 'review', 'watch', 'attention'].includes(token)) return 'orange'
  if (['red', 'danger', 'error', 'blocked', 'fail', 'failed'].includes(token)) return 'red'
  if (['muted', 'neutral', 'pending', 'draft', 'gray', 'grey'].includes(token)) return 'muted'
  return token
}

function normalizeAccent(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['blue', 'cyan', 'purple', 'green', 'orange', 'red'].includes(token)) return token
  return ''
}
