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
