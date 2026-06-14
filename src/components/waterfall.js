import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#e8eef7',
    axis: '#9aa8bd',
    text: '#555555',
    positive: '#2fc27d',
    negative: '#ff5c7a',
    connector: '#9aa8bd',
  },
  dark: {
    grid: '#1e3a5f',
    axis: '#8a95a8',
    text: '#c8d8f0',
    positive: '#2fc27d',
    negative: '#ff5c7a',
    connector: '#8a95a8',
  },
}

export function renderWaterfallSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS[mode].axis,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    positive: options.positiveColor || DEFAULT_COLORS[mode].positive,
    negative: options.negativeColor || DEFAULT_COLORS[mode].negative,
    connector: options.connectorColor || DEFAULT_COLORS[mode].connector,
  }
  const color = (name) => useVariables ? `var(--deck-waterfall-${name}, ${colors[name]})` : colors[name]
  const geometry = waterfallGeometry(chart)
  const bars = geometry.steps
    .map((step) => {
      const className = step.delta < 0 ? 'negative' : 'positive'
      return `<g class="deck-waterfall-step deck-waterfall-step-${className}">
    <rect class="deck-waterfall-bar deck-waterfall-bar-${className}" x="${round(step.x)}" y="${round(step.y)}" width="${round(step.w)}" height="${round(step.h)}" rx="5"></rect>
    <text class="deck-waterfall-value" x="${round(step.x + step.w / 2)}" y="${round(step.valueY)}" text-anchor="middle">${escapeHtml(formatDelta(step.delta))}</text>
    <text class="deck-waterfall-label" x="${round(step.x + step.w / 2)}" y="${geometry.height - 18}" text-anchor="middle">${escapeHtml(step.label)}</text>
  </g>`
    })
    .join('\n  ')
  const connectors = geometry.steps
    .slice(0, -1)
    .map((step, index) => {
      const next = geometry.steps[index + 1]
      return `<line class="deck-waterfall-connector" x1="${round(step.x + step.w)}" y1="${round(step.endY)}" x2="${round(next.x)}" y2="${round(step.endY)}"></line>`
    })
    .join('\n  ')
  const grid = geometry.ticks
    .map((tick) => {
      const y = geometry.yFor(tick)
      return `<line class="deck-waterfall-grid" x1="${geometry.margin.left}" y1="${round(y)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(y)}"></line>
  <text class="deck-waterfall-tick" x="${geometry.margin.left - 14}" y="${round(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`
    })
    .join('\n  ')

  return `<svg class="deck-chart-waterfall-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Waterfall chart')}">
  <style>
    .deck-waterfall-grid { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-waterfall-axis { stroke: ${color('axis')}; stroke-width: 1.4; }
    .deck-waterfall-connector { stroke: ${color('connector')}; stroke-width: 1.4; stroke-dasharray: 5 5; opacity: .86; }
    .deck-waterfall-bar-positive { fill: ${color('positive')}; }
    .deck-waterfall-bar-negative { fill: ${color('negative')}; }
    .deck-waterfall-label, .deck-waterfall-tick, .deck-waterfall-value { fill: ${color('text')}; font: 500 13px "Poppins", "Aptos", sans-serif; }
    .deck-waterfall-value { font-weight: 600; }
  </style>
  ${grid}
  <line class="deck-waterfall-axis" x1="${geometry.margin.left}" y1="${round(geometry.zeroY)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.zeroY)}"></line>
  <line class="deck-waterfall-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  ${connectors}
  ${bars}
</svg>`
}

function waterfallGeometry(chart) {
  const width = 760
  const height = 330
  const margin = { top: 28, right: 30, bottom: 52, left: 68 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const steps = []
  let running = 0
  for (const [index, delta] of chart.values.entries()) {
    const start = running
    const end = start + delta
    running = end
    steps.push({
      index,
      label: chart.labels[index] || '',
      delta,
      start,
      end,
      low: Math.min(start, end),
      high: Math.max(start, end),
    })
  }
  const rawMin = Math.min(0, ...steps.map((step) => step.low))
  const rawMax = Math.max(0, ...steps.map((step) => step.high))
  let [minY, maxY] = paddedExtent(rawMin, rawMax)
  if (rawMin >= 0) minY = 0
  if (rawMax <= 0) maxY = 0
  if (minY === maxY) maxY = minY + 1
  const yFor = (value) => margin.top + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight
  const band = plotWidth / Math.max(1, steps.length)
  const barW = Math.min(82, band * 0.58)
  const zeroY = yFor(0)

  return {
    width,
    height,
    margin,
    zeroY,
    yFor,
    ticks: tickValues(minY, maxY),
    steps: steps.map((step) => {
      const x = margin.left + step.index * band + (band - barW) / 2
      const y1 = yFor(step.low)
      const y2 = yFor(step.high)
      return {
        ...step,
        x,
        y: Math.min(y1, y2),
        w: barW,
        h: Math.max(2, Math.abs(y2 - y1)),
        endY: yFor(step.end),
        valueY: step.delta < 0 ? Math.max(y1, y2) + 18 : Math.min(y1, y2) - 8,
      }
    }),
  }
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

function formatDelta(value) {
  const formatted = formatNumber(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

function round(value) {
  return Math.round(value * 10) / 10
}
