import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#e8eef7',
    axis: '#9aa8bd',
    text: '#555555',
    bar: '#5d4ee8',
    barBorder: '#4637c7',
  },
  dark: {
    grid: '#1e3a5f',
    axis: '#8a95a8',
    text: '#c8d8f0',
    bar: '#6f63ff',
    barBorder: '#9aa3ff',
  },
}

export function renderHistogramSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS[mode].axis,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    bar: options.barColor || DEFAULT_COLORS[mode].bar,
    barBorder: options.barBorderColor || DEFAULT_COLORS[mode].barBorder,
  }
  const color = (name) => useVariables ? `var(--deck-histogram-${name}, ${colors[name]})` : colors[name]
  const geometry = histogramGeometry(chart)
  const bars = geometry.bins
    .map((bin, index) => {
      const label = `${formatBinLabel(bin.start)}-${formatBinLabel(bin.end)}`
      return `<g class="deck-histogram-bin" transform="translate(${round(bin.x)} ${round(bin.y)})">
    <rect class="deck-histogram-bar" width="${round(bin.w)}" height="${round(bin.h)}" rx="4"><title>${escapeHtml(label)}: ${escapeHtml(formatNumber(bin.count))}</title></rect>
    ${bin.count > 0 ? `<text class="deck-histogram-count" x="${round(bin.w / 2)}" y="-8" text-anchor="middle">${escapeHtml(formatNumber(bin.count))}</text>` : ''}
    ${index % geometry.labelStep === 0 ? `<text class="deck-histogram-label" x="${round(bin.w / 2)}" y="${round(geometry.axisLabelY - bin.y)}" text-anchor="middle">${escapeHtml(label)}</text>` : ''}
  </g>`
    })
    .join('\n  ')
  const grid = geometry.ticks
    .map((tick) => {
      const y = geometry.yFor(tick)
      return `<line class="deck-histogram-grid" x1="${geometry.margin.left}" y1="${round(y)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(y)}"></line>
  <text class="deck-histogram-tick" x="${geometry.margin.left - 14}" y="${round(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`
    })
    .join('\n  ')

  return `<svg class="deck-chart-histogram-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Histogram chart')}">
  <style>
    .deck-histogram-grid { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-histogram-axis { stroke: ${color('axis')}; stroke-width: 1.4; }
    .deck-histogram-bar { fill: ${color('bar')}; stroke: ${color('barBorder')}; stroke-width: 1; opacity: .88; }
    .deck-histogram-label, .deck-histogram-tick, .deck-histogram-count, .deck-histogram-axis-label { fill: ${color('text')}; font: 500 12px "Poppins", "Aptos", sans-serif; }
    .deck-histogram-count { font-weight: 700; }
  </style>
  ${grid}
  <line class="deck-histogram-axis" x1="${geometry.margin.left}" y1="${round(geometry.height - geometry.margin.bottom)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-histogram-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  ${bars}
  <text class="deck-histogram-axis-label" x="${round(geometry.margin.left + geometry.plotWidth / 2)}" y="${geometry.height - 8}" text-anchor="middle">${escapeHtml(chart.xAxisLabel || 'Range')}</text>
  <text class="deck-histogram-axis-label" transform="translate(18 ${round(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || 'Count')}</text>
</svg>`
}

export function histogramBins(values, binCount) {
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const span = maxValue - minValue
  const width = span === 0 ? 1 : span / binCount
  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = span === 0 ? minValue - 0.5 + index * width : minValue + index * width
    const end = start + width
    return { start, end, count: 0 }
  })
  values.forEach((value) => {
    const rawIndex = span === 0 ? Math.floor(binCount / 2) : Math.floor((value - minValue) / width)
    const index = Math.max(0, Math.min(binCount - 1, rawIndex))
    bins[index].count += 1
  })
  return bins
}

function histogramGeometry(chart) {
  const width = 760
  const height = 330
  const margin = { top: 34, right: 30, bottom: 70, left: 68 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const bins = histogramBins(chart.values, chart.binCount)
  const maxCount = niceCeiling(Math.max(1, ...bins.map((bin) => bin.count)))
  const yFor = (value) => margin.top + plotHeight - (value / maxCount) * plotHeight
  const band = plotWidth / Math.max(1, bins.length)
  const gap = Math.min(5, band * 0.18)
  const barW = Math.max(2, band - gap)

  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    yFor,
    ticks: tickValues(0, maxCount),
    labelStep: Math.max(1, Math.ceil(bins.length / 6)),
    axisLabelY: height - margin.bottom + 28,
    bins: bins.map((bin, index) => {
      const x = margin.left + index * band + gap / 2
      const y = yFor(bin.count)
      return {
        ...bin,
        x,
        y,
        w: barW,
        h: Math.max(2, margin.top + plotHeight - y),
      }
    }),
  }
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

function formatBinLabel(value) {
  if (!Number.isFinite(value)) return String(value)
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function round(value) {
  return Math.round(value * 10) / 10
}
