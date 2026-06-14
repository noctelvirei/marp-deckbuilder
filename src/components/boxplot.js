import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#e8eef7',
    axis: '#9aa8bd',
    text: '#555555',
    box: '#0f82f5',
    fill: '#bfe0ff',
    median: '#ff9f51',
  },
  dark: {
    grid: '#1e3a5f',
    axis: '#8a95a8',
    text: '#c8d8f0',
    box: '#59d6fd',
    fill: '#123c66',
    median: '#ff9f51',
  },
}

export function renderBoxplotSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS[mode].axis,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    box: options.boxColor || DEFAULT_COLORS[mode].box,
    fill: options.fillColor || DEFAULT_COLORS[mode].fill,
    median: options.medianColor || DEFAULT_COLORS[mode].median,
  }
  const color = (name) => useVariables ? `var(--deck-boxplot-${name}, ${colors[name]})` : colors[name]
  const geometry = boxplotGeometry(chart)
  const grid = geometry.ticks
    .map((tick) => {
      const y = geometry.yFor(tick)
      return `<line class="deck-boxplot-grid" x1="${geometry.margin.left}" y1="${round(y)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(y)}"></line>
  <text class="deck-boxplot-tick" x="${geometry.margin.left - 14}" y="${round(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`
    })
    .join('\n  ')
  const boxes = geometry.items
    .map((item) => `<g class="deck-boxplot-item" transform="translate(${round(item.x)} 0)">
    <line class="deck-boxplot-whisker" x1="0" y1="${round(item.minY)}" x2="0" y2="${round(item.maxY)}"></line>
    <line class="deck-boxplot-whisker" x1="${round(-item.capW / 2)}" y1="${round(item.minY)}" x2="${round(item.capW / 2)}" y2="${round(item.minY)}"></line>
    <line class="deck-boxplot-whisker" x1="${round(-item.capW / 2)}" y1="${round(item.maxY)}" x2="${round(item.capW / 2)}" y2="${round(item.maxY)}"></line>
    <rect class="deck-boxplot-box" x="${round(-item.boxW / 2)}" y="${round(item.boxY)}" width="${round(item.boxW)}" height="${round(item.boxH)}" rx="5"><title>${escapeHtml(item.title)}</title></rect>
    <line class="deck-boxplot-median" x1="${round(-item.boxW / 2)}" y1="${round(item.medianY)}" x2="${round(item.boxW / 2)}" y2="${round(item.medianY)}"></line>
    <text class="deck-boxplot-label" x="0" y="${geometry.height - 24}" text-anchor="middle">${escapeHtml(item.label)}</text>
  </g>`)
    .join('\n  ')

  return `<svg class="deck-chart-boxplot-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Boxplot chart')}">
  <style>
    .deck-boxplot-grid { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-boxplot-axis { stroke: ${color('axis')}; stroke-width: 1.4; }
    .deck-boxplot-whisker { stroke: ${color('box')}; stroke-width: 2; stroke-linecap: round; }
    .deck-boxplot-box { fill: ${color('fill')}; stroke: ${color('box')}; stroke-width: 2; }
    .deck-boxplot-median { stroke: ${color('median')}; stroke-width: 3; stroke-linecap: round; }
    .deck-boxplot-label, .deck-boxplot-tick, .deck-boxplot-axis-label { fill: ${color('text')}; font: 500 12px "Poppins", "Aptos", sans-serif; }
  </style>
  ${grid}
  <line class="deck-boxplot-axis" x1="${geometry.margin.left}" y1="${round(geometry.height - geometry.margin.bottom)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-boxplot-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  ${boxes}
  <text class="deck-boxplot-axis-label" transform="translate(18 ${round(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || chart.series || 'Value')}</text>
</svg>`
}

export function boxplotStats(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return {
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
  }
}

function boxplotGeometry(chart) {
  const width = 760
  const height = 330
  const margin = { top: 30, right: 30, bottom: 54, left: 68 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const stats = chart.matrix.map((row, index) => ({
    label: chart.labels[index] || '',
    ...boxplotStats(row),
  }))
  const rawMin = Math.min(...stats.map((item) => item.min))
  const rawMax = Math.max(...stats.map((item) => item.max))
  let [minY, maxY] = paddedExtent(rawMin, rawMax)
  if (minY === maxY) maxY = minY + 1
  const yFor = (value) => margin.top + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight
  const band = plotWidth / Math.max(1, stats.length)
  const boxW = Math.min(74, band * 0.42)
  const capW = Math.min(54, boxW * 0.72)

  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    yFor,
    ticks: tickValues(minY, maxY),
    items: stats.map((item, index) => {
      const q3Y = yFor(item.q3)
      const q1Y = yFor(item.q1)
      return {
        ...item,
        x: margin.left + index * band + band / 2,
        minY: yFor(item.min),
        maxY: yFor(item.max),
        medianY: yFor(item.median),
        boxY: Math.min(q1Y, q3Y),
        boxH: Math.max(3, Math.abs(q1Y - q3Y)),
        boxW,
        capW,
        title: `${item.label}: min ${formatNumber(item.min)}, Q1 ${formatNumber(item.q1)}, median ${formatNumber(item.median)}, Q3 ${formatNumber(item.q3)}, max ${formatNumber(item.max)}`,
      }
    }),
  }
}

function quantile(values, fraction) {
  if (!values.length) return 0
  const position = (values.length - 1) * fraction
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return values[lower]
  const weight = position - lower
  return values[lower] * (1 - weight) + values[upper] * weight
}

function paddedExtent(min, max) {
  if (min === max) return [min, min + 1]
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

function round(value) {
  return Math.round(value * 10) / 10
}
