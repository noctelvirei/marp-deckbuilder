import { cleanText, splitCsv } from './utils.js'

export function parseReportChart(chart, index = 0) {
  const type = normalizeChartType(chart.attr('type') || 'bar')
  const labels = splitCsv(chart.attr('labels'))
  const values = splitCsv(chart.attr('values')).map((value) => Number(value))
  const title = chart.attr('title') || cleanText(chart.find('h2,h3,figcaption').first().text())
  const series = chart.attr('series') || title || 'Series 1'
  const colors = splitCsv(chart.attr('colors'))
  const height = parseDimension(chart.attr('height'), 320)
  const requestedId = chart.attr('id') || chart.attr('chart-id') || ''
  const valuePrefix = chart.attr('value-prefix') || chart.attr('prefix') || ''
  const valueSuffix = chart.attr('value-suffix') || chart.attr('suffix') || ''

  return {
    type: 'chart',
    chartType: type,
    id: requestedId,
    generatedId: `report-chart-${index + 1}`,
    title,
    series,
    labels,
    values,
    colors,
    height,
    valuePrefix,
    valueSuffix,
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
  return token
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
