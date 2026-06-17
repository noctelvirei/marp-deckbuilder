import { escapeAttr, escapeHtml, formatNumber } from './utils.js'
import { renderBarChartSvg, renderGroupedBarChartSvg, renderStackedBarChartSvg } from '../charts-svg/bar.js'
import { renderDoughnutChartSvg } from '../charts-svg/doughnut.js'
import { renderAreaChartSvg, renderLineChartSvg } from '../charts-svg/line.js'
import { renderBubbleChartSvg, renderScatterChartSvg } from '../charts-svg/point.js'
import { renderBoxplotSvg } from './boxplot.js'
import { renderBulletSvg } from './bullet.js'
import { renderFunnelSvg } from './funnel.js'
import { histogramBins, renderHistogramSvg } from './histogram.js'
import { renderImpactRadarSvg } from './impact-radar.js'
import { renderJourneyPathSvg } from './journey-path.js'
import { paretoRows, renderParetoSvg } from './pareto.js'
import { renderRadarSvg } from './radar.js'
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
  if (chart.chartType === 'radar') return renderRadarChartHtml(chart)
  if (chart.chartType === 'sankey') return renderSankeyChartHtml(chart)
  if (chart.chartType === 'waterfall') return renderWaterfallChartHtml(chart)
  if (chart.chartType === 'bullet') return renderBulletChartHtml(chart)

  return `<figure class="deck-chart deck-chart-${escapeAttr(chart.chartType)}">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderBarChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
}

function renderWaterfallChartHtml(chart) {
  const steps = waterfallSteps(chart)
  const chartConfig = {
    type: 'waterfall',
    labels: steps.map((step) => step.label),
    ranges: steps.map((step) => [step.start, step.end]),
    deltas: steps.map((step) => step.delta),
    series: chart.series || chart.title || 'Change',
    title: chart.title || '',
  }
  return `<figure class="deck-chart deck-chart-waterfall">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-js" data-deck-chart-type="waterfall">
    <div class="deck-chart-js-frame">
      <canvas class="deck-chart-js-canvas" data-deck-chartjs="waterfall" data-deck-chart-config="${escapeAttr(JSON.stringify(chartConfig))}" role="img" aria-label="${escapeAttr(chart.title || 'Waterfall chart')}"></canvas>
    </div>
    <div class="deck-chart-js-fallback">
      ${renderWaterfallSvg(chart, { cssVariables: true })}
    </div>
  </div>
</figure>`
}

function renderBulletChartHtml(chart) {
  const chartConfig = {
    type: 'bullet',
    labels: chart.labels,
    values: chart.values,
    targets: chart.targets,
    series: chart.series || chart.title || 'Actual',
    title: chart.title || '',
  }
  return `<figure class="deck-chart deck-chart-bullet">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-js" data-deck-chart-type="bullet">
    <div class="deck-chart-js-frame">
      <canvas class="deck-chart-js-canvas" data-deck-chartjs="bullet" data-deck-chart-config="${escapeAttr(JSON.stringify(chartConfig))}" role="img" aria-label="${escapeAttr(chart.title || 'Bullet chart')}"></canvas>
    </div>
    <div class="deck-chart-js-fallback">
      ${renderBulletSvg(chart, { cssVariables: true })}
    </div>
  </div>
</figure>`
}

function renderHistogramChartHtml(chart) {
  const bins = histogramBins(chart.values, chart.binCount)
  const chartConfig = {
    type: 'histogram',
    labels: bins.map((bin) => `${compactNumber(bin.start)}-${compactNumber(bin.end)}`),
    values: bins.map((bin) => bin.count),
    series: chart.series || chart.title || 'Count',
    title: chart.title || '',
    xAxisLabel: chart.xAxisLabel || 'Range',
    yAxisLabel: chart.yAxisLabel || 'Count',
  }
  return `<figure class="deck-chart deck-chart-histogram">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-js" data-deck-chart-type="histogram">
    <div class="deck-chart-js-frame">
      <canvas class="deck-chart-js-canvas" data-deck-chartjs="histogram" data-deck-chart-config="${escapeAttr(JSON.stringify(chartConfig))}" role="img" aria-label="${escapeAttr(chart.title || 'Histogram chart')}"></canvas>
    </div>
    <div class="deck-chart-js-fallback">
      ${renderHistogramSvg(chart, { cssVariables: true })}
    </div>
  </div>
</figure>`
}

function renderBoxplotChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-boxplot">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderBoxplotSvg(chart, { cssVariables: true })}
</figure>`
}

function renderParetoChartHtml(chart) {
  const rows = paretoRows(chart)
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  let cumulative = 0
  const cumulativePercent = rows.map((row) => {
    cumulative += row.value
    return total > 0 ? Math.round((cumulative / total) * 1000) / 10 : 0
  })
  const chartConfig = {
    type: 'pareto',
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.value),
    cumulativePercent,
    series: chart.series || chart.title || 'Value',
    title: chart.title || '',
    yAxisLabel: chart.yAxisLabel || chart.series || 'Value',
  }
  return `<figure class="deck-chart deck-chart-pareto">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-js" data-deck-chart-type="pareto">
    <div class="deck-chart-js-frame">
      <canvas class="deck-chart-js-canvas" data-deck-chartjs="pareto" data-deck-chart-config="${escapeAttr(JSON.stringify(chartConfig))}" role="img" aria-label="${escapeAttr(chart.title || 'Pareto chart')}"></canvas>
    </div>
    <div class="deck-chart-js-fallback">
      ${renderParetoSvg(chart, { cssVariables: true })}
    </div>
  </div>
</figure>`
}

function renderRadarChartHtml(chart) {
  // renderRadarSvg is already a complete themed SVG radar; promote it to primary.
  return `<figure class="deck-chart deck-chart-radar">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderRadarSvg(chart, { cssVariables: true })}
</figure>`
}

function renderSankeyChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-sankey">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderSankeySvg(chart, { cssVariables: true })}
</figure>`
}

function renderLineChartHtml(chart) {
  // SSR-SVG (vector, crisp at any scale) + thin hover runtime. No canvas, no
  // `deck-chart-js` class, so the chart.js enhancer skips it. Title lives in the
  // figcaption (consistent with other charts), so the SVG's own title is off.
  return `<figure class="deck-chart deck-chart-line">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderLineChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
}

function renderAreaChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-area">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderAreaChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
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

export function renderOrchestrationHtml(orchestration) {
  const upstreamNodes = orchestration.upstream
    .map((node) => `<span class="deck-orchestration-node">${escapeHtml(node)}</span>`)
    .join('')
  const downstreamNodes = orchestration.downstream
    .map((node) => `<span class="deck-orchestration-node">${escapeHtml(node)}</span>`)
    .join('')
  const capabilities = orchestration.capabilities
    .map((capability) => `<span class="deck-orchestration-cap"><b></b>${escapeHtml(capability)}</span>`)
    .join('')

  return `<div class="deck-orchestration deck-orchestration-accent-${escapeAttr(orchestration.accent)}">
  <div class="deck-orchestration-tier">
    <div class="deck-orchestration-tier-label">${escapeHtml(orchestration.upstreamLabel)}</div>
    <div class="deck-orchestration-nodes">${upstreamNodes}</div>
  </div>
  <article class="deck-orchestration-layer">
    <div class="deck-orchestration-layer-head">
      <strong class="deck-orchestration-layer-brand"${orchestration.logo ? ' data-deck-inline-logo="company"' : ''}>${escapeHtml(orchestration.layer)}</strong>
      <span class="deck-orchestration-layer-tag">${escapeHtml(orchestration.tagline)}</span>
    </div>
    <div class="deck-orchestration-caps">${capabilities}</div>
  </article>
  <div class="deck-orchestration-tier">
    <div class="deck-orchestration-tier-label">${escapeHtml(orchestration.downstreamLabel)}</div>
    <div class="deck-orchestration-nodes">${downstreamNodes}</div>
  </div>
  ${orchestration.caption ? `<p class="deck-orchestration-caption">${escapeHtml(orchestration.caption)}</p>` : ''}
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
  return `<figure class="deck-chart deck-chart-scatter">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderScatterChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
}

function renderBubbleChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-bubble">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderBubbleChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
}

function renderDoughnutChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-doughnut">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderDoughnutChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
}

function renderGroupedBarChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-grouped-bar">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderGroupedBarChartSvg({ ...chart, title: '' }, { cssVariables: true })}
</figure>`
}

function renderStackedBarChartHtml(chart) {
  return `<figure class="deck-chart deck-chart-stacked-bar">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  ${renderStackedBarChartSvg({ ...chart, title: '' }, { cssVariables: true })}
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
      const fillIndex = index % chartPalette.length
      const fallbackFill = chartPalette[fillIndex]
      const valueText = compact
        ? ''
        : `<text class="deck-treemap-value" x="${rect.x + 12}" y="${valueY}" fill="#ffffff">${escapeHtml(value)}</text>`
      return `<g class="deck-treemap-cell deck-treemap-fill-${fillIndex}" clip-path="url(#${id}-${index})">
  <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" rx="6" fill="${fallbackFill}" style="fill:var(--deck-treemap-fill-${fillIndex}, ${fallbackFill})"></rect>
  <text class="deck-treemap-label${compact ? ' deck-treemap-label-compact' : ''}" x="${rect.x + 12}" y="${labelY}" fill="#ffffff">${escapeHtml(rect.label)}</text>
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

function compactNumber(value) {
  if (!Number.isFinite(value)) return String(value)
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function waterfallSteps(chart) {
  const steps = []
  let running = 0
  chart.values.forEach((delta, index) => {
    const start = running
    const end = start + delta
    running = end
    steps.push({
      label: chart.labels[index] || '',
      delta,
      start,
      end,
    })
  })
  return steps
}

function renderMetricTrendSvg(metricTrend) {
  const width = 520
  const height = 220
  const pad = { left: 36, right: 44, top: 22, bottom: 42 }
  const points = metricTrendPoints(metricTrend.values, width, height, pad)
  const pathPoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const lastIndex = points.length - 1
  const labels = points
    .map((point, index) => {
      const isFirst = index === 0
      const isLast = index === lastIndex
      const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle'
      const x = point.x + (isFirst ? 2 : isLast ? -2 : 0)
      return `<text x="${x}" y="204" text-anchor="${anchor}">${escapeHtml(metricTrend.labels[index])}</text>`
    })
    .join('')
  const dots = points
    .map((point) => `<circle class="deck-metric-trend-dot" cx="${point.x}" cy="${point.y}" r="5" fill="#0f82f5" stroke="#ffffff"></circle>`)
    .join('')
  const last = points.at(-1)
  const lastValue = metricTrend.values.at(-1) ?? 0
  const valueTag = last
    ? `<text class="deck-metric-trend-final" x="${Math.min(width - 72, last.x + 12)}" y="${Math.max(26, last.y - 10)}">${escapeHtml(`${formatNumber(lastValue)}${metricTrend.unit}`)}</text>`
    : ''

  return `<svg class="deck-metric-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(metricTrend.title || metricTrend.metricLabel)}">
      <line class="deck-metric-trend-axis" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <polyline class="deck-metric-trend-line" points="${pathPoints}" fill="none" stroke="#0f82f5"></polyline>
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
  const lanes = swimlane.lanes
    .map((lane) => {
      const steps = lane.steps
        .map((step) => {
          const body = step.body
            ? `<p class="deck-lane-step-body" style="${swimlaneStepBodyStyle}">${escapeHtml(step.body)}</p>`
            : ''
          return `<article class="deck-lane-step"><h3 class="deck-lane-step-title" style="${swimlaneStepTitleStyle}">${escapeHtml(step.title)}</h3>${body}</article>`
        })
        .join('<span class="deck-arrow">&gt;</span>')
      return `<div class="deck-lane deck-lane-${escapeAttr(lane.color)}"><h2>${escapeHtml(lane.title)}</h2><div class="deck-lane-steps deck-lane-steps-${Math.max(lane.steps.length, 1)}">${steps}</div></div>`
    })
    .join('')
  return `<div class="deck-swimlane deck-swimlane-${laneCount}">${lanes}</div>`
}

const swimlaneStepTitleStyle =
  'display:block;visibility:visible;opacity:1;position:relative;z-index:1;margin:0 0 var(--deck-swimlane-step-title-margin, 6px);font-size:var(--deck-swimlane-step-title-size, 14px);line-height:var(--deck-swimlane-step-title-line-height, 1.18);color:var(--deck-swimlane-step-title-color, #090909)'

const swimlaneStepBodyStyle =
  'display:block;visibility:visible;opacity:1;position:relative;z-index:1;margin:0;font-size:var(--deck-swimlane-step-body-size, 11px);line-height:var(--deck-swimlane-step-body-line-height, 1.25);max-height:var(--deck-swimlane-step-body-max-height, 42px);overflow:hidden;color:var(--deck-swimlane-step-body-color, #444444)'

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

export function renderTakeawayHeroHtml(takeaway) {
  return `<div class="deck-takeaway-hero">
  ${takeaway.eyebrow ? `<p class="eyebrow">${escapeHtml(takeaway.eyebrow)}</p>` : ''}
  <h1>${escapeHtml(takeaway.text)}</h1>
</div>
<div class="takeaway">${escapeHtml(takeaway.text)}</div>`
}

export function renderExecTitleHtml(execTitle) {
  return `<div class="deck-exec deck-exec-title ${surfaceClass(execTitle)} deck-exec-accent-${escapeAttr(execTitle.accent)}">
  ${execTitle.eyebrow ? `<p class="deck-exec-eyebrow">${escapeHtml(execTitle.eyebrow)}</p>` : ''}
  <h1>${escapeHtml(execTitle.title)}</h1>
  ${execTitle.subtitle ? `<p class="deck-exec-subtitle">${escapeHtml(execTitle.subtitle)}</p>` : ''}
</div>`
}

export function renderExecRowsHtml(execRows) {
  const takeawayClass = execRows.takeaway ? ' has-takeaway' : ''
  const side = execRows.side
    ? `<aside class="deck-exec-side deck-exec-accent-${escapeAttr(execRows.side.accent)}">${[
      execRows.side.title ? `<h3>${escapeHtml(execRows.side.title)}</h3>` : '',
      execRows.side.value ? `<strong>${escapeHtml(execRows.side.value)}</strong>` : '',
      execRows.side.body ? `<p>${escapeHtml(execRows.side.body)}</p>` : '',
    ].filter(Boolean).join('')}</aside>`
    : ''

  return `<div class="deck-exec deck-exec-rows ${surfaceClass(execRows)}${side ? ' has-side' : ''}${takeawayClass}">
  <div class="deck-exec-row-stack">${execRows.rows
    .map((row) => {
      const label = `<div class="deck-exec-row-label"><strong>${escapeHtml(row.label)}</strong>${row.kicker ? `<span>${escapeHtml(row.kicker)}</span>` : ''}</div>`
      const copy = `<div class="deck-exec-row-copy"><h3>${escapeHtml(row.title)}</h3>${row.body ? `<p>${escapeHtml(row.body)}</p>` : ''}</div>`
      const note = row.note ? `<em>${escapeHtml(row.note)}</em>` : ''
      return `<article class="deck-exec-row deck-exec-accent-${escapeAttr(row.accent)}">${label}${copy}${note}</article>`
    })
    .join('\n')}</div>
  ${side}
  ${renderExecTakeawayHtml(execRows.takeaway, execRows.takeawayAccent)}
</div>`
}

export function renderExecCardsHtml(execCards) {
  const takeawayClass = execCards.takeaway ? ' has-takeaway' : ''
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
    `<div class="deck-exec deck-exec-cards ${surfaceClass(execCards)} deck-exec-cards-${execCards.columns} deck-exec-cards-${escapeAttr(execCards.variant)}${takeawayClass}">`,
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
  const count = Math.max(1, execTimeline.items.length)
  const takeawayClass = execTimeline.takeaway ? ' has-takeaway' : ''
  return `<div class="deck-exec deck-exec-timeline ${surfaceClass(execTimeline)} deck-exec-timeline-${Math.min(count, 5)}${takeawayClass}" style="--deck-exec-timeline-count:${Math.min(count, 5)}">
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
  const takeawayClass = execMetrics.takeaway ? ' has-takeaway' : ''
  return `<div class="deck-exec deck-exec-metrics ${surfaceClass(execMetrics)}${takeawayClass}">
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
