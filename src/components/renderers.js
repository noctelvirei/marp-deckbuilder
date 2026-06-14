import { escapeAttr, escapeHtml, formatNumber } from './utils.js'
import { renderBoxplotSvg } from './boxplot.js'
import { renderBulletSvg } from './bullet.js'
import { renderFunnelSvg } from './funnel.js'
import { renderHistogramSvg } from './histogram.js'
import { renderImpactRadarSvg } from './impact-radar.js'
import { renderJourneyPathSvg } from './journey-path.js'
import { renderParetoSvg } from './pareto.js'
import { renderSankeySvg } from './sankey.js'
import { treemapRects } from './treemap.js'
import { renderWaterfallSvg } from './waterfall.js'

const chartPalette = ['#0f82f5', '#4cc9f0', '#5d4ee8', '#ff9f51', '#2fc27d', '#ff5c7a']

export function renderChartHtml(chart) {
  if (chart.chartType === 'grouped-bar') return renderGroupedBarChartHtml(chart)
  if (chart.chartType === 'stacked-bar') return renderStackedBarChartHtml(chart)
  if (chart.chartType === 'doughnut') return renderDoughnutChartHtml(chart)
  if (chart.chartType === 'area') return renderAreaChartHtml(chart)
  if (chart.chartType === 'line') return renderLineChartHtml(chart)
  if (chart.chartType === 'scatter') return renderScatterChartHtml(chart)
  if (chart.chartType === 'bubble') return renderBubbleChartHtml(chart)
  if (chart.chartType === 'histogram') return renderHistogramChartHtml(chart)
  if (chart.chartType === 'boxplot') return renderBoxplotChartHtml(chart)
  if (chart.chartType === 'pareto') return renderParetoChartHtml(chart)
  if (chart.chartType === 'sankey') return renderSankeyChartHtml(chart)
  if (chart.chartType === 'waterfall') return renderWaterfallChartHtml(chart)
  if (chart.chartType === 'bullet') return renderBulletChartHtml(chart)

  const max = Math.max(...chart.values, 1)
  const rows = chart.labels
    .map((label, index) => {
      const value = chart.values[index] ?? 0
      const width = Math.max(3, Math.round((value / max) * 100))
      return `<div class="deck-chart-row">
  <span class="deck-chart-label">${escapeHtml(label)}</span>
  <span class="deck-chart-track"><span class="deck-chart-fill" style="width:${width}%"></span></span>
  <strong>${escapeHtml(formatNumber(value))}</strong>
</div>`
    })
    .join('\n')

  return `<figure class="deck-chart deck-chart-${chart.chartType}">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-rows">${rows}</div>
</figure>`
}

function renderWaterfallChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-waterfall">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderWaterfallSvg(chart, { cssVariables: true })}
</figure>`
}

function renderBulletChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-bullet">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderBulletSvg(chart, { cssVariables: true })}
</figure>`
}

function renderHistogramChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-histogram">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderHistogramSvg(chart, { cssVariables: true })}
</figure>`
}

function renderBoxplotChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-boxplot">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderBoxplotSvg(chart, { cssVariables: true })}
</figure>`
}

function renderParetoChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-pareto">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderParetoSvg(chart, { cssVariables: true })}
</figure>`
}

function renderSankeyChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-sankey">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderSankeySvg(chart, { cssVariables: true })}
</figure>`
}

function renderLineChartHtml(chart) {
  const geometry = categoricalSeriesGeometry(chart)
  const markers = geometry.points
    .map((point) => `<g transform="translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})">
  <circle class="deck-chart-line-point" r="6"><title>${escapeHtml(point.label)}: ${escapeHtml(formatNumber(point.value))}</title></circle>
  <text class="deck-chart-line-point-value" x="0" y="-13" text-anchor="middle">${escapeHtml(formatNumber(point.value))}</text>
</g>`)
    .join('\n')

  return `<figure class="deck-chart deck-chart-line">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <svg class="deck-chart-line-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Line chart')}">
    ${renderSeriesGrid(geometry, 'line')}
    ${renderSeriesAxes(geometry, 'line')}
    <path class="deck-chart-line-path" d="${linePath(geometry.points)}"></path>
    ${markers}
    ${renderSeriesXLabels(geometry, 'line')}
  </svg>
</figure>`
}

function renderAreaChartHtml(chart) {
  const geometry = categoricalSeriesGeometry(chart, { includeZero: true })
  const baseline = geometry.yFor(0)
  const areaPath = [
    `M ${geometry.points[0].x.toFixed(2)} ${baseline.toFixed(2)}`,
    ...geometry.points.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    `L ${geometry.points.at(-1).x.toFixed(2)} ${baseline.toFixed(2)}`,
    'Z',
  ].join(' ')
  const markers = geometry.points
    .map((point) => `<g transform="translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})">
  <circle class="deck-chart-area-point" r="5"><title>${escapeHtml(point.label)}: ${escapeHtml(formatNumber(point.value))}</title></circle>
  <text class="deck-chart-area-point-value" x="0" y="-12" text-anchor="middle">${escapeHtml(formatNumber(point.value))}</text>
</g>`)
    .join('\n')

  return `<figure class="deck-chart deck-chart-area">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <svg class="deck-chart-area-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Area chart')}">
    ${renderSeriesGrid(geometry, 'area')}
    ${renderSeriesAxes(geometry, 'area')}
    <path class="deck-chart-area-fill" d="${areaPath}"></path>
    <path class="deck-chart-area-path" d="${linePath(geometry.points)}"></path>
    ${markers}
    ${renderSeriesXLabels(geometry, 'area')}
  </svg>
</figure>`
}

function categoricalSeriesGeometry(chart, options = {}) {
  const width = 760
  const height = 342
  const margin = { top: 30, right: 28, bottom: 54, left: 64 }
  const values = chart.values
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  let [minY, maxY] = expandExtent(
    options.includeZero ? Math.min(0, minValue) : minValue,
    options.includeZero ? Math.max(0, maxValue) : maxValue,
  )
  if (options.includeZero && minValue >= 0) minY = 0
  if (options.includeZero && maxValue <= 0) maxY = 0
  if (minY === maxY) maxY = minY + 1
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const xFor = (index) => values.length > 1
    ? margin.left + (index / (values.length - 1)) * plotWidth
    : margin.left + plotWidth / 2
  const yFor = (value) => margin.top + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight
  const points = values.map((value, index) => ({
    x: xFor(index),
    y: yFor(value),
    value,
    label: chart.labels[index] || '',
  }))
  return { width, height, margin, plotWidth, plotHeight, minY, maxY, yFor, points }
}

function renderSeriesGrid(geometry, prefix) {
  return tickValues(geometry.minY, geometry.maxY)
    .map((tick) => {
      const y = geometry.yFor(tick)
      return `<line class="deck-chart-${prefix}-grid" x1="${geometry.margin.left}" y1="${y.toFixed(2)}" x2="${geometry.margin.left + geometry.plotWidth}" y2="${y.toFixed(2)}"></line>
<text class="deck-chart-${prefix}-tick" x="${geometry.margin.left - 14}" y="${(y + 5).toFixed(2)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`
    })
    .join('\n')
}

function renderSeriesAxes(geometry, prefix) {
  return `<line class="deck-chart-${prefix}-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top + geometry.plotHeight}" x2="${geometry.margin.left + geometry.plotWidth}" y2="${geometry.margin.top + geometry.plotHeight}"></line>
    <line class="deck-chart-${prefix}-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${geometry.margin.top + geometry.plotHeight}"></line>`
}

function renderSeriesXLabels(geometry, prefix) {
  return geometry.points
    .map((point) => `<text class="deck-chart-${prefix}-tick" x="${point.x.toFixed(2)}" y="${geometry.height - 24}" text-anchor="middle">${escapeHtml(point.label)}</text>`)
    .join('\n')
}

function linePath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
}

export function renderSignalBarsHtml(signalBars) {
  const max = Math.max(...signalBars.values, 1)
  const rows = signalBars.labels
    .map((label, index) => {
      const value = signalBars.values[index] ?? 0
      const width = Math.max(2, Math.round((value / max) * 100))
      const displayValue = `${formatNumber(value)}${signalBars.unit}`
      return `<div class="deck-signal-row">
  <span class="deck-signal-label">${escapeHtml(label)}</span>
  <span class="deck-signal-track"><span class="deck-signal-fill" style="width:${width}%"></span></span>
  <strong>${escapeHtml(displayValue)}</strong>
</div>`
    })
    .join('\n')

  return `<div class="deck-signal-bars deck-signal-accent-${escapeAttr(signalBars.accent)}">
  <article class="deck-signal-summary">
    <strong>${escapeHtml(signalBars.metric)}</strong>
    <p>${escapeHtml(signalBars.metricLabel)}</p>
  </article>
  <figure class="deck-signal-chart">
    ${signalBars.title || signalBars.subtitle ? `<figcaption>${signalBars.title ? `<strong>${escapeHtml(signalBars.title)}</strong>` : ''}${signalBars.subtitle ? `<span>${escapeHtml(signalBars.subtitle)}</span>` : ''}</figcaption>` : ''}
    <div class="deck-signal-rows">${rows}</div>
  </figure>
</div>`
}

export function renderSignalBoardHtml(signalBoard) {
  const max = Math.max(...signalBoard.values, 1)
  const tags = signalBoard.tags
    .map((tag) => `<span class="deck-signal-board-tag">${escapeHtml(tag)}</span>`)
    .join('\n')
  const rows = signalBoard.labels
    .map((label, index) => {
      const value = signalBoard.values[index] ?? 0
      const width = Math.max(2, Math.round((value / max) * 100))
      const displayValue = `${formatNumber(value)}${signalBoard.unit}`
      return `<div class="deck-signal-row">
  <span class="deck-signal-label">${escapeHtml(label)}</span>
  <span class="deck-signal-track"><span class="deck-signal-fill" style="width:${width}%"></span></span>
  <strong>${escapeHtml(displayValue)}</strong>
</div>`
    })
    .join('\n')

  return `<div class="deck-signal-board deck-signal-accent-${escapeAttr(signalBoard.accent)}">
  <article class="deck-signal-board-panel">
    <h2>${escapeHtml(signalBoard.title)}</h2>
    <p>${escapeHtml(signalBoard.body)}</p>
    ${tags ? `<div class="deck-signal-board-tags">${tags}</div>` : ''}
  </article>
  <figure class="deck-signal-board-chart">
    <figcaption>${escapeHtml(signalBoard.chartTitle)}</figcaption>
    <div class="deck-signal-rows">${rows}</div>
  </figure>
</div>`
}

export function renderFunnelHtml(funnel) {
  return `<figure class="deck-funnel deck-funnel-accent-${escapeAttr(funnel.accent)}">
  ${funnel.title ? `<figcaption>${escapeHtml(funnel.title)}</figcaption>` : ''}
  ${renderFunnelSvg(funnel, { cssVariables: true })}
</figure>`
}

function renderScatterChartHtml(chart) {
  return renderPointChartHtml(chart, { type: 'scatter' })
}

function renderBubbleChartHtml(chart) {
  return renderPointChartHtml(chart, { type: 'bubble' })
}

function renderPointChartHtml(chart, options = {}) {
  const isBubble = options.type === 'bubble'
  const width = 760
  const height = 350
  const margin = { top: 28, right: 28, bottom: 58, left: 64 }
  const xs = chart.points.map((point) => point.x)
  const ys = chart.points.map((point) => point.y)
  const [minX, maxX] = expandExtent(Math.min(...xs), Math.max(...xs))
  const [minY, maxY] = expandExtent(Math.min(...ys), Math.max(...ys))
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const xFor = (value) => margin.left + ((value - minX) / (maxX - minX)) * plotWidth
  const yFor = (value) => margin.top + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight
  const xTicks = tickValues(minX, maxX)
  const yTicks = tickValues(minY, maxY)
  const maxRadius = Math.max(...chart.points.map((point) => point.r || 0), 1)

  const grid = [
    ...xTicks.map((tick) => {
      const x = xFor(tick)
      return `<line class="deck-chart-scatter-grid" x1="${x.toFixed(2)}" y1="${margin.top}" x2="${x.toFixed(2)}" y2="${margin.top + plotHeight}"></line>
<text class="deck-chart-scatter-tick" x="${x.toFixed(2)}" y="${height - 28}" text-anchor="middle">${escapeHtml(formatNumber(tick))}</text>`
    }),
    ...yTicks.map((tick) => {
      const y = yFor(tick)
      return `<line class="deck-chart-scatter-grid" x1="${margin.left}" y1="${y.toFixed(2)}" x2="${margin.left + plotWidth}" y2="${y.toFixed(2)}"></line>
<text class="deck-chart-scatter-tick" x="${margin.left - 14}" y="${(y + 5).toFixed(2)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`
    }),
  ].join('\n')

  const points = chart.points
    .map((point, index) => {
      const x = xFor(point.x)
      const y = yFor(point.y)
      const label = point.label || `${formatNumber(point.x)}, ${formatNumber(point.y)}`
      const radius = isBubble ? Math.max(6, Math.min(25, 6 + ((point.r || 0) / maxRadius) * 19)) : 8
      const pointClass = isBubble ? 'deck-chart-bubble-point' : 'deck-chart-scatter-point'
      const title = isBubble
        ? `${label}: ${formatNumber(point.x)}, ${formatNumber(point.y)}, size ${formatNumber(point.r)}`
        : `${label}: ${formatNumber(point.x)}, ${formatNumber(point.y)}`
      return `<g class="${pointClass} deck-chart-series-${index % 6}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">
  <circle r="${radius.toFixed(2)}"><title>${escapeHtml(title)}</title></circle>
  ${point.label ? `<text x="12" y="-10">${escapeHtml(point.label)}</text>` : ''}
</g>`
    })
    .join('\n')

  const xAxisLabel = chart.xAxisLabel || 'X'
  const yAxisLabel = chart.yAxisLabel || 'Y'

  const chartClass = isBubble ? 'deck-chart-bubble' : 'deck-chart-scatter'
  const svgClass = isBubble ? 'deck-chart-bubble-svg' : 'deck-chart-scatter-svg'
  const ariaLabel = isBubble ? 'Bubble chart' : 'Scatter chart'

  return `<figure class="deck-chart ${chartClass}">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <svg class="${svgClass}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(chart.title || ariaLabel)}">
    ${grid}
    <line class="deck-chart-scatter-axis" x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}"></line>
    <line class="deck-chart-scatter-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}"></line>
    ${points}
    <text class="deck-chart-scatter-axis-label" x="${margin.left + plotWidth / 2}" y="${height - 4}" text-anchor="middle">${escapeHtml(xAxisLabel)}</text>
    <text class="deck-chart-scatter-axis-label" transform="translate(18 ${margin.top + plotHeight / 2}) rotate(-90)" text-anchor="middle">${escapeHtml(yAxisLabel)}</text>
  </svg>
</figure>`
}

function expandExtent(min, max) {
  if (min === max) return [min - 1, max + 1]
  const padding = (max - min) * 0.12
  return [min - padding, max + padding]
}

function tickValues(min, max) {
  const ticks = []
  const count = 4
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + ((max - min) / count) * index)
  }
  return ticks
}

function renderDoughnutChartHtml(chart) {
  const total = chart.values.reduce((sum, value) => sum + value, 0)
  let cursor = 0
  const stops = chart.values.map((value, index) => {
    const start = cursor
    cursor += (value / total) * 100
    return `${chartPalette[index % chartPalette.length]} ${start.toFixed(3)}% ${cursor.toFixed(3)}%`
  })
  const rows = chart.labels
    .map((label, index) => {
      const value = chart.values[index] ?? 0
      const percent = total > 0 ? (value / total) * 100 : 0
      return `<div class="deck-chart-doughnut-row deck-chart-series-${index % 6}">
  <span class="deck-chart-legend-swatch"></span>
  <span class="deck-chart-label">${escapeHtml(label)}</span>
  <strong>${escapeHtml(formatNumber(value))}</strong>
  <span class="deck-chart-doughnut-percent">${escapeHtml(`${Math.round(percent)}%`)}</span>
</div>`
    })
    .join('\n')

  return `<figure class="deck-chart deck-chart-doughnut">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-doughnut-layout">
    <div class="deck-chart-doughnut-ring" style="background: conic-gradient(${stops.join(', ')})">
      <span>Total<strong>${escapeHtml(formatNumber(total))}</strong></span>
    </div>
    <div class="deck-chart-doughnut-legend">${rows}</div>
  </div>
</figure>`
}

function renderGroupedBarChartHtml(chart) {
  const values = chart.matrix.flat()
  const max = Math.max(...values, 1)
  const legend = chart.seriesNames
    .map(
      (series, index) => `<span class="deck-chart-legend-item deck-chart-series-${index % 6}">
  <span class="deck-chart-legend-swatch"></span>${escapeHtml(series)}
</span>`,
    )
    .join('\n')
  const rows = chart.labels
    .map((label, labelIndex) => {
      const bars = chart.seriesNames
        .map((series, seriesIndex) => {
          const value = chart.matrix[seriesIndex][labelIndex] ?? 0
          const width = Math.max(3, Math.round((value / max) * 100))
          return `<div class="deck-chart-grouped-bar-row deck-chart-series-${seriesIndex % 6}">
  <span class="deck-chart-series-label">${escapeHtml(series)}</span>
  <span class="deck-chart-track"><span class="deck-chart-fill" style="width:${width}%"></span></span>
  <strong>${escapeHtml(formatNumber(value))}</strong>
</div>`
        })
        .join('\n')

      return `<div class="deck-chart-grouped-row">
  <span class="deck-chart-label">${escapeHtml(label)}</span>
  <div class="deck-chart-grouped-bars">${bars}</div>
</div>`
    })
    .join('\n')

  return `<figure class="deck-chart deck-chart-grouped-bar">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-legend">${legend}</div>
  <div class="deck-chart-grouped-rows">${rows}</div>
</figure>`
}

function renderStackedBarChartHtml(chart) {
  const totals = chart.labels.map((_, labelIndex) =>
    chart.matrix.reduce((sum, row) => sum + (row[labelIndex] ?? 0), 0),
  )
  const max = Math.max(...totals, 1)
  const legend = chart.seriesNames
    .map(
      (series, index) => `<span class="deck-chart-legend-item deck-chart-series-${index % 6}">
  <span class="deck-chart-legend-swatch"></span>${escapeHtml(series)}
</span>`,
    )
    .join('\n')
  const rows = chart.labels
    .map((label, labelIndex) => {
      const total = totals[labelIndex]
      const stackWidth = Math.max(3, Math.round((total / max) * 100))
      const segments = chart.seriesNames
        .map((_, seriesIndex) => {
          const value = chart.matrix[seriesIndex][labelIndex] ?? 0
          const width = total > 0 ? Math.max(0, (value / total) * 100) : 0
          return `<span class="deck-chart-stacked-segment deck-chart-series-${seriesIndex % 6}" style="width:${width}%"></span>`
        })
        .join('')

      return `<div class="deck-chart-stacked-row">
  <span class="deck-chart-label">${escapeHtml(label)}</span>
  <span class="deck-chart-stacked-track">
    <span class="deck-chart-stacked-fill" style="width:${stackWidth}%">${segments}</span>
  </span>
  <strong>${escapeHtml(formatNumber(total))}</strong>
</div>`
    })
    .join('\n')

  return `<figure class="deck-chart deck-chart-stacked-bar">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-legend">${legend}</div>
  <div class="deck-chart-stacked-rows">${rows}</div>
</figure>`
}

export function renderMetricTrendHtml(metricTrend) {
  const svg = renderMetricTrendSvg(metricTrend)
  const title = metricTrend.title || 'Trend'

  return `<div class="deck-metric-trend deck-metric-trend-accent-${escapeAttr(metricTrend.accent)}">
  <article class="deck-metric-trend-summary">
    <strong>${escapeHtml(metricTrend.metric)}</strong>
    <span>${escapeHtml(metricTrend.metricLabel)}</span>
  </article>
  <figure class="deck-metric-trend-chart">
    <figcaption>${escapeHtml(title)}</figcaption>
    ${svg}
  </figure>
</div>`
}

export function renderHeatmapHtml(heatmap) {
  const values = heatmap.values.flat()
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const xLabels = heatmap.xLabels
    .map((label) => `<span class="deck-heatmap-x-label">${escapeHtml(label)}</span>`)
    .join('\n')
  const rows = heatmap.yLabels
    .map((label, rowIndex) => {
      const cells = heatmap.values[rowIndex]
        .map((value, columnIndex) => {
          const alpha = heatmapCellAlpha(value, min, range)
          const displayValue = `${formatNumber(value)}${heatmap.unit}`
          const title = `${label} ${heatmap.xLabels[columnIndex]}: ${displayValue}`
          return `<span class="deck-heatmap-cell" style="--deck-heatmap-alpha:${alpha}" title="${escapeAttr(title)}"><span>${escapeHtml(displayValue)}</span></span>`
        })
        .join('\n')
      return `<span class="deck-heatmap-y-label">${escapeHtml(label)}</span>
${cells}`
    })
    .join('\n')

  return `<figure class="deck-heatmap deck-heatmap-accent-${escapeAttr(heatmap.accent)}" style="--deck-heatmap-columns:${heatmap.xLabels.length}">
  ${heatmap.title ? `<figcaption>${escapeHtml(heatmap.title)}</figcaption>` : ''}
  <div class="deck-heatmap-grid">
    <span class="deck-heatmap-corner"></span>
    ${xLabels}
    ${rows}
  </div>
  ${heatmap.caption ? `<p class="deck-heatmap-caption">${escapeHtml(heatmap.caption)}</p>` : ''}
</figure>`
}

export function renderTreemapHtml(treemap) {
  const width = 760
  const height = 292
  const items = treemap.labels.map((label, index) => ({
    label,
    value: treemap.values[index] ?? 0,
  }))
  const rects = treemapRects(items, { x: 0, y: 0, w: width, h: height }, 6)
  const id = `deck-treemap-${hashString(`${treemap.labels.join('|')}|${treemap.values.join('|')}`)}`
  const clips = rects
    .map((rect, index) => `<clipPath id="${id}-${index}"><rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" rx="6"></rect></clipPath>`)
    .join('\n')
  const cells = rects
    .map((rect, index) => {
      const value = `${formatNumber(rect.value)}${treemap.unit}`
      const labelY = rect.y + 26
      const valueY = rect.y + Math.min(rect.h - 14, 50)
      const compact = rect.w < 92 || rect.h < 54
      const valueText = compact
        ? ''
        : `<text class="deck-treemap-value" x="${rect.x + 12}" y="${valueY}">${escapeHtml(value)}</text>`
      return `<g class="deck-treemap-cell deck-treemap-fill-${index % 6}" clip-path="url(#${id}-${index})">
  <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" rx="6"></rect>
  <text class="deck-treemap-label${compact ? ' deck-treemap-label-compact' : ''}" x="${rect.x + 12}" y="${labelY}">${escapeHtml(rect.label)}</text>
  ${valueText}
</g>`
    })
    .join('\n')

  return `<figure class="deck-treemap deck-treemap-accent-${escapeAttr(treemap.accent)}">
  ${treemap.title ? `<figcaption>${escapeHtml(treemap.title)}</figcaption>` : ''}
  <svg class="deck-treemap-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(treemap.title || 'Treemap')}">
    <defs>${clips}</defs>
    ${cells}
  </svg>
  ${treemap.caption ? `<p class="deck-treemap-caption">${escapeHtml(treemap.caption)}</p>` : ''}
</figure>`
}

export function renderJourneyMapHtml(journeyMap) {
  const count = Math.min(Math.max(journeyMap.steps.length, 1), 6)
  const steps = journeyMap.steps
    .map((step) => `<article class="deck-journey-step deck-journey-step-accent-${escapeAttr(step.accent)}">
  <small>${escapeHtml(step.label)}</small>
  <h2>${escapeHtml(step.title)}</h2>
  ${step.body ? `<p>${escapeHtml(step.body)}</p>` : ''}
</article>`)
    .join('\n')

  return `<div class="deck-journey-map deck-journey-map-${count}">
  ${journeyMap.title ? `<h2>${escapeHtml(journeyMap.title)}</h2>` : ''}
  <div class="deck-journey-steps">${steps}</div>
</div>`
}

export function renderJourneyPathHtml(journeyPath) {
  return `<div class="deck-journey-path deck-journey-path-accent-${escapeAttr(journeyPath.accent)}">
  <article class="deck-journey-path-summary">
    <strong>${escapeHtml(journeyPath.metric)}</strong>
    <span>${escapeHtml(journeyPath.metricLabel)}</span>
  </article>
  <figure class="deck-journey-path-map">
    ${renderJourneyPathSvg(journeyPath, { animate: true, cssVariables: true })}
  </figure>
</div>`
}

export function renderImpactRadarHtml(impactRadar) {
  return `<figure class="deck-impact-radar deck-impact-radar-accent-${escapeAttr(impactRadar.accent)}">
  ${renderImpactRadarSvg(impactRadar, { animate: true, cssVariables: true })}
  ${impactRadar.caption ? `<p class="deck-impact-radar-caption">${escapeHtml(impactRadar.caption)}</p>` : ''}
</figure>`
}

function heatmapCellAlpha(value, min, range) {
  return (0.16 + ((value - min) / range) * 0.7).toFixed(2)
}

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

function renderMetricTrendSvg(metricTrend) {
  const width = 520
  const height = 220
  const pad = { left: 28, right: 28, top: 22, bottom: 42 }
  const points = metricTrendPoints(metricTrend.values, width, height, pad)
  const pathPoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const labels = points
    .map((point, index) => `<text x="${point.x}" y="204">${escapeHtml(metricTrend.labels[index])}</text>`)
    .join('')
  const dots = points
    .map((point) => `<circle class="deck-metric-trend-dot" cx="${point.x}" cy="${point.y}" r="5"></circle>`)
    .join('')
  const last = points.at(-1)
  const lastValue = metricTrend.values.at(-1) ?? 0
  const valueTag = last
    ? `<text class="deck-metric-trend-final" x="${Math.min(width - 72, last.x + 12)}" y="${Math.max(26, last.y - 10)}">${escapeHtml(`${formatNumber(lastValue)}${metricTrend.unit}`)}</text>`
    : ''

  return `<svg class="deck-metric-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(metricTrend.title || metricTrend.metricLabel)}">
      <line class="deck-metric-trend-axis" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <polyline class="deck-metric-trend-line" points="${pathPoints}"></polyline>
      ${dots}
      <g class="deck-metric-trend-labels">${labels}</g>
      ${valueTag}
    </svg>`
}

function metricTrendPoints(values, width, height, pad) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const step = values.length > 1 ? plotW / (values.length - 1) : 0
  return values.map((value, index) => ({
    x: Number((pad.left + step * index).toFixed(1)),
    y: Number((pad.top + (1 - (value - min) / range) * plotH).toFixed(1)),
  }))
}

export function renderComparisonHtml(comparison) {
  const rows = comparison.rows
    .map(
      (row) => `<tr>
  <th>${escapeHtml(row.label)}</th>
  <td class="negative">${escapeHtml(row.left)}</td>
  <td class="positive">${escapeHtml(row.right)}</td>
</tr>`,
    )
    .join('\n')

  return `<table class="deck-comparison">
  <thead><tr><th></th><th>${escapeHtml(comparison.leftTitle)}</th><th>${escapeHtml(comparison.rightTitle)}</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`
}

export function renderSwimlaneHtml(swimlane) {
  const laneCount = Math.max(swimlane.lanes.length, 1)
  return `<div class="deck-swimlane deck-swimlane-${laneCount}">${swimlane.lanes
    .map(
      (lane) => `<div class="deck-lane deck-lane-${escapeAttr(lane.color)}">
  <h2>${escapeHtml(lane.title)}</h2>
  <div class="deck-lane-steps deck-lane-steps-${Math.max(lane.steps.length, 1)}">${lane.steps
    .map(
      (step) => `<article>
    <h3>${escapeHtml(step.title)}</h3>
    ${step.body ? `<p>${escapeHtml(step.body)}</p>` : ''}
  </article>`,
    )
    .join('<span class="deck-arrow">&gt;</span>')}</div>
</div>`,
    )
    .join('\n')}</div>`
}

export function renderProofHtml(proof) {
  const stats = proof.stats
    .map(
      (stat) => `<div class="stat-card">
  <strong>${escapeHtml(stat.value)}</strong>
  <span>${escapeHtml(stat.label)}</span>
</div>`,
    )
    .join('\n')

  return `<div class="deck-proof">
  ${proof.logo || proof.logoName ? `<div class="deck-proof-logo">${proof.logo ? `<img src="${escapeAttr(proof.logo)}" alt="${escapeAttr(proof.logoName)}">` : escapeHtml(proof.logoName)}</div>` : ''}
  <div class="stat-grid">${stats}</div>
  ${proof.context ? `<p class="deck-proof-context">${escapeHtml(proof.context)}</p>` : ''}
  ${proof.bridge ? `<p class="deck-proof-bridge">${escapeHtml(proof.bridge)}</p>` : ''}
  ${proof.source ? `<p class="deck-proof-source">${escapeHtml(proof.source)}</p>` : ''}
</div>`
}

export function renderNextStepsHtml(nextSteps) {
  return `<ol class="deck-next-steps">${nextSteps.steps
    .map(
      (step) => `<li>
  <strong>${escapeHtml(step.title)}</strong>
  <span>${escapeHtml(step.body)}</span>
</li>`,
    )
    .join('\n')}</ol>`
}

export function renderLogoWallHtml(logoWall) {
  return `<div class="deck-logo-wall">
  ${logoWall.title ? `<h2>${escapeHtml(logoWall.title)}</h2>` : ''}
  <div class="deck-logo-grid">${logoWall.logos
    .map(
      (logo) => `<div class="deck-logo-tile">${logo.image ? `<img src="${escapeAttr(logo.image)}" alt="${escapeAttr(logo.name)}">` : `<span>${escapeHtml(logo.name)}</span>`}</div>`,
    )
    .join('\n')}</div>
</div>`
}

export function renderDividerHtml(divider) {
  return `<div class="deck-divider">
  ${divider.act ? `<p class="eyebrow">${escapeHtml(divider.act)}</p>` : ''}
  <h1>${escapeHtml(divider.title)}</h1>
  ${divider.subtitle ? `<p>${escapeHtml(divider.subtitle)}</p>` : ''}
</div>`
}

export function renderCloseHtml(close) {
  return `<div class="deck-close">
  <h1>${escapeHtml(close.title)}</h1>
  ${close.name ? `<p><strong>${escapeHtml(close.name)}</strong>${close.role ? `<br><span>${escapeHtml(close.role)}</span>` : ''}</p>` : ''}
</div>`
}

export function renderExecTitleHtml(execTitle) {
  return `<div class="deck-exec deck-exec-title ${surfaceClass(execTitle)} deck-exec-accent-${escapeAttr(execTitle.accent)}">
  ${execTitle.eyebrow ? `<p class="deck-exec-eyebrow">${escapeHtml(execTitle.eyebrow)}</p>` : ''}
  <h1>${escapeHtml(execTitle.title)}</h1>
  ${execTitle.subtitle ? `<p class="deck-exec-subtitle">${escapeHtml(execTitle.subtitle)}</p>` : ''}
</div>`
}

export function renderExecRowsHtml(execRows) {
  const side = execRows.side
    ? `<aside class="deck-exec-side deck-exec-accent-${escapeAttr(execRows.side.accent)}">
    ${execRows.side.title ? `<h3>${escapeHtml(execRows.side.title)}</h3>` : ''}
    ${execRows.side.value ? `<strong>${escapeHtml(execRows.side.value)}</strong>` : ''}
    ${execRows.side.body ? `<p>${escapeHtml(execRows.side.body)}</p>` : ''}
  </aside>`
    : ''

  return `<div class="deck-exec deck-exec-rows ${surfaceClass(execRows)}${side ? ' has-side' : ''}">
  <div class="deck-exec-row-stack">${execRows.rows
    .map(
      (row) => `<article class="deck-exec-row deck-exec-accent-${escapeAttr(row.accent)}">
    <div class="deck-exec-row-label">
      <strong>${escapeHtml(row.label)}</strong>
      ${row.kicker ? `<span>${escapeHtml(row.kicker)}</span>` : ''}
    </div>
    <div class="deck-exec-row-copy">
      <h3>${escapeHtml(row.title)}</h3>
      ${row.body ? `<p>${escapeHtml(row.body)}</p>` : ''}
    </div>
    ${row.note ? `<em>${escapeHtml(row.note)}</em>` : ''}
  </article>`,
    )
    .join('\n')}</div>
  ${side}
  ${renderExecTakeawayHtml(execRows.takeaway, execRows.takeawayAccent)}
</div>`
}

export function renderExecCardsHtml(execCards) {
  const cards = execCards.cards
    .map((card) => {
      const parts = [
        `<article class="deck-exec-card deck-exec-accent-${escapeAttr(card.accent)}">`,
        `<strong class="deck-exec-card-label">${escapeHtml(card.label)}</strong>`,
      ]
      if (card.title) parts.push(`<h3>${escapeHtml(card.title)}</h3>`)
      if (card.metric) parts.push(`<div class="deck-exec-card-metric">${escapeHtml(card.metric)}</div>`)
      if (card.subtitle) parts.push(`<span class="deck-exec-card-subtitle">${escapeHtml(card.subtitle)}</span>`)
      if (card.body) parts.push(`<p>${escapeHtml(card.body)}</p>`)
      parts.push('</article>')
      return parts.join('')
    })
    .join('')

  const parts = [
    `<div class="deck-exec deck-exec-cards ${surfaceClass(execCards)} deck-exec-cards-${execCards.columns} deck-exec-cards-${escapeAttr(execCards.variant)}">`,
  ]
  if (execCards.intro) parts.push(`<p class="deck-exec-intro">${escapeHtml(execCards.intro)}</p>`)
  parts.push(`<div class="deck-exec-card-grid">${cards}</div>`)
  if (execCards.loopCaption) {
    parts.push(`<p class="deck-exec-loop-caption">${escapeHtml(execCards.loopCaption)}</p>`)
  }
  if (execCards.target) {
    parts.push(
      `<div class="deck-exec-target deck-exec-accent-${escapeAttr(execCards.targetAccent)}">${escapeHtml(execCards.target)}</div>`,
    )
  }
  parts.push(renderExecTakeawayHtml(execCards.takeaway, execCards.takeawayAccent))
  parts.push('</div>')
  return parts.join('')
}

export function renderExecTimelineHtml(execTimeline) {
  return `<div class="deck-exec deck-exec-timeline ${surfaceClass(execTimeline)}">
  <div class="deck-exec-timeline-line"></div>
  <div class="deck-exec-timeline-items">${execTimeline.items
    .map(
      (item) => `<article class="deck-exec-timeline-item deck-exec-accent-${escapeAttr(item.accent)}">
    <strong>${escapeHtml(item.year)}</strong>
    <span></span>
    <h3>${escapeHtml(item.title)}</h3>
    ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
  </article>`,
    )
    .join('\n')}</div>
  ${renderExecTakeawayHtml(execTimeline.takeaway, execTimeline.takeawayAccent)}
</div>`
}

export function renderExecMetricsHtml(execMetrics) {
  return `<div class="deck-exec deck-exec-metrics ${surfaceClass(execMetrics)}">
  <div class="deck-exec-metric-row">${execMetrics.metrics
    .map(
      (metric) => `<article class="deck-exec-metric deck-exec-accent-${escapeAttr(metric.accent)}">
    <strong>${escapeHtml(metric.value)}</strong>
    <span>${escapeHtml(metric.label)}</span>
  </article>`,
    )
    .join('\n')}</div>
  ${execMetrics.sectionTitle ? `<h2>${escapeHtml(execMetrics.sectionTitle)}</h2>` : ''}
  ${execMetrics.panels.length ? `<div class="deck-exec-panel-grid">${execMetrics.panels
    .map(
      (panel) => `<article class="deck-exec-panel deck-exec-accent-${escapeAttr(panel.accent)}">
    ${panel.value ? `<strong>${escapeHtml(panel.value)}</strong>` : ''}
    ${panel.title ? `<h3>${escapeHtml(panel.title)}</h3>` : ''}
    ${panel.body ? `<p>${escapeHtml(panel.body)}</p>` : ''}
    ${panel.note ? `<em>${escapeHtml(panel.note)}</em>` : ''}
  </article>`,
    )
    .join('\n')}</div>` : ''}
  ${renderExecTakeawayHtml(execMetrics.takeaway, execMetrics.takeawayAccent)}
</div>`
}

function renderExecTakeawayHtml(text, accent = 'blue') {
  return text
    ? `<div class="deck-exec-takeaway deck-exec-accent-${escapeAttr(accent)}">${escapeHtml(text)}</div>`
    : ''
}

function surfaceClass(model) {
  return model.surface ? `deck-exec-surface-${escapeAttr(model.surface)}` : ''
}
