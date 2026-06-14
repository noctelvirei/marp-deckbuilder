import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#e8eef7',
    axis: '#9aa8bd',
    text: '#555555',
    bar: '#0f82f5',
    'bar-border': '#0b67c7',
    line: '#ff9f51',
    point: '#ff9f51',
  },
  dark: {
    grid: '#1e3a5f',
    axis: '#8a95a8',
    text: '#c8d8f0',
    bar: '#59d6fd',
    'bar-border': '#9ae8ff',
    line: '#ff9f51',
    point: '#ff9f51',
  },
}

export function renderParetoSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS[mode].axis,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    bar: options.barColor || DEFAULT_COLORS[mode].bar,
    'bar-border': options.barBorderColor || DEFAULT_COLORS[mode]['bar-border'],
    line: options.lineColor || DEFAULT_COLORS[mode].line,
    point: options.pointColor || DEFAULT_COLORS[mode].point,
  }
  const color = (name) => useVariables ? `var(--deck-pareto-${name}, ${colors[name]})` : colors[name]
  const geometry = paretoGeometry(chart)
  const grid = geometry.ticks
    .map((tick) => {
      const y = geometry.yForValue(tick)
      return `<line class="deck-pareto-grid" x1="${geometry.margin.left}" y1="${round(y)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(y)}"></line>
  <text class="deck-pareto-tick" x="${geometry.margin.left - 14}" y="${round(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`
    })
    .join('\n  ')
  const percentTicks = [0, 25, 50, 75, 100]
    .map((tick) => {
      const y = geometry.yForPercent(tick)
      return `<text class="deck-pareto-percent-tick" x="${geometry.width - geometry.margin.right + 14}" y="${round(y + 5)}">${tick}%</text>`
    })
    .join('\n  ')
  const bars = geometry.items
    .map((item, index) => {
      const showLabel = index % geometry.labelStep === 0 || index === geometry.items.length - 1
      const valueLabelY = Math.max(geometry.margin.top + 14, item.barY - 8)
      return `<g class="deck-pareto-item" transform="translate(${round(item.x)} 0)">
    <rect class="deck-pareto-bar" x="0" y="${round(item.barY)}" width="${round(item.barW)}" height="${round(item.barH)}" rx="5"><title>${escapeHtml(item.label)}: ${escapeHtml(formatNumber(item.value))}; cumulative ${round(item.cumulativePercent)}%</title></rect>
    ${item.value > 0 ? `<text class="deck-pareto-value" x="${round(item.barW / 2)}" y="${round(valueLabelY)}" text-anchor="middle">${escapeHtml(formatNumber(item.value))}</text>` : ''}
    ${showLabel ? `<text class="deck-pareto-label" x="${round(item.barW / 2)}" y="${geometry.height - 30}" text-anchor="middle">${escapeHtml(item.label)}</text>` : ''}
  </g>`
    })
    .join('\n  ')
  const line = linePath(geometry.items.map((item) => ({ x: item.pointX, y: item.pointY })))
  const points = geometry.items
    .map((item) => `<circle class="deck-pareto-point" cx="${round(item.pointX)}" cy="${round(item.pointY)}" r="5"><title>${escapeHtml(item.label)} cumulative: ${round(item.cumulativePercent)}%</title></circle>`)
    .join('\n  ')

  return `<svg class="deck-chart-pareto-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Pareto chart')}">
  <style>
    .deck-pareto-grid { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-pareto-axis { stroke: ${color('axis')}; stroke-width: 1.4; }
    .deck-pareto-bar { fill: ${color('bar')}; stroke: ${color('bar-border')}; stroke-width: 1.2; opacity: .9; }
    .deck-pareto-line { fill: none; stroke: ${color('line')}; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .deck-pareto-point { fill: ${color('point')}; stroke: ${color('line')}; stroke-width: 2; }
    .deck-pareto-label, .deck-pareto-value, .deck-pareto-tick, .deck-pareto-percent-tick, .deck-pareto-axis-label { fill: ${color('text')}; font: 500 12px "Poppins", "Aptos", sans-serif; }
    .deck-pareto-value { font-weight: 700; }
  </style>
  ${grid}
  ${percentTicks}
  <line class="deck-pareto-axis" x1="${geometry.margin.left}" y1="${round(geometry.height - geometry.margin.bottom)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-pareto-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-pareto-axis" x1="${round(geometry.width - geometry.margin.right)}" y1="${geometry.margin.top}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  ${bars}
  <path class="deck-pareto-line" d="${line}"></path>
  ${points}
  <text class="deck-pareto-axis-label" transform="translate(18 ${round(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || chart.series || 'Value')}</text>
  <text class="deck-pareto-axis-label" transform="translate(${geometry.width - 18} ${round(geometry.margin.top + geometry.plotHeight / 2)}) rotate(90)" text-anchor="middle">Cumulative %</text>
</svg>`
}

export function paretoRows(chart) {
  return chart.labels
    .map((label, index) => ({
      label,
      value: chart.values[index] ?? 0,
      originalIndex: index,
    }))
    .sort((left, right) => right.value - left.value || left.originalIndex - right.originalIndex)
}

function paretoGeometry(chart) {
  const width = 760
  const height = 330
  const margin = { top: 34, right: 70, bottom: 70, left: 68 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const rows = paretoRows(chart)
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  const maxValue = niceCeiling(Math.max(1, ...rows.map((row) => row.value)))
  const yForValue = (value) => margin.top + plotHeight - (value / maxValue) * plotHeight
  const yForPercent = (percent) => margin.top + plotHeight - (percent / 100) * plotHeight
  const band = plotWidth / Math.max(1, rows.length)
  const gap = Math.min(9, band * 0.22)
  const barW = Math.max(4, band - gap)
  let cumulative = 0

  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    yForValue,
    yForPercent,
    ticks: tickValues(0, maxValue),
    labelStep: Math.max(1, Math.ceil(rows.length / 7)),
    items: rows.map((row, index) => {
      cumulative += row.value
      const barY = yForValue(row.value)
      const x = margin.left + index * band + gap / 2
      const cumulativePercent = total > 0 ? (cumulative / total) * 100 : 0
      return {
        ...row,
        x,
        barW,
        barY,
        barH: row.value > 0 ? Math.max(2, margin.top + plotHeight - barY) : 0,
        pointX: x + barW / 2,
        pointY: yForPercent(cumulativePercent),
        cumulativePercent,
      }
    }),
  }
}

function linePath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${round(point.x)} ${round(point.y)}`)
    .join(' ')
}

function tickValues(min, max) {
  const ticks = []
  const count = 4
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + ((max - min) / count) * index)
  }
  return ticks
}

function niceCeiling(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 1
    ? 1
    : normalized <= 2
      ? 2
      : normalized <= 2.5
        ? 2.5
        : normalized <= 5
          ? 5
          : 10
  return nice * magnitude
}

function round(value) {
  return Math.round(value * 10) / 10
}
