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

function normalizeAccent(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['blue', 'cyan', 'purple', 'green', 'orange', 'red'].includes(token)) return token
  return ''
}
