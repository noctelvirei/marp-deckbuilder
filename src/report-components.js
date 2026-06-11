import * as cheerio from 'cheerio'

import {
  parseReportChart,
  parseReportMetricGrid,
} from './report-components/parsers.js'
import {
  renderReportChartHtml,
  renderReportChartScript,
  renderReportMetricGridHtml,
} from './report-components/renderers.js'

const knownReportTags = new Set(['report-chart', 'report-metric-grid', 'report-metric'])

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
    if (!knownReportTags.has(tag)) fail(`Unknown report component <${tag}>.`, context, line)

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
  if (chart.chartType !== 'bar') {
    fail(`Unsupported report-chart type "${chart.chartType}". Supported type: bar.`, context)
  }
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
