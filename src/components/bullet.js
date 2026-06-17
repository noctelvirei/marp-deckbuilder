import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#e8eef7',
    axis: '#9aa8bd',
    text: '#555555',
    bar: '#0f82f5',
    onBar: '#ffffff',
    target: '#ff9f51',
    track: '#eef6fe',
  },
  dark: {
    grid: '#1e3a5f',
    axis: '#8a95a8',
    text: '#c8d8f0',
    bar: '#0f82f5',
    onBar: '#ffffff',
    target: '#ff9f51',
    track: '#132747',
  },
}

export function renderBulletSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS[mode].axis,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    bar: options.barColor || DEFAULT_COLORS[mode].bar,
    onBar: options.onBarColor || DEFAULT_COLORS[mode].onBar,
    target: options.targetColor || DEFAULT_COLORS[mode].target,
    track: options.trackColor || DEFAULT_COLORS[mode].track,
  }
  const color = (name) => useVariables ? `var(--deck-bullet-${name}, ${colors[name]})` : colors[name]
  const geometry = bulletGeometry(chart)
  const grid = geometry.ticks
    .map((tick) => {
      const x = geometry.xFor(tick)
      return `<line class="deck-bullet-grid" x1="${round(x)}" y1="${geometry.margin.top}" x2="${round(x)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  <text class="deck-bullet-tick" x="${round(x)}" y="${geometry.height - 12}" text-anchor="middle">${escapeHtml(formatNumber(tick))}</text>`
    })
    .join('\n  ')
  const rows = geometry.rows
    .map((row) => `<g class="deck-bullet-row" transform="translate(0 ${round(row.y)})">
    <text class="deck-bullet-label" x="${geometry.margin.left - 16}" y="${round(row.center + 5)}" text-anchor="end">${escapeHtml(row.label)}</text>
    <rect class="deck-bullet-track" x="${geometry.margin.left}" y="${round(row.center - row.trackH / 2)}" width="${geometry.plotWidth}" height="${round(row.trackH)}" rx="8"></rect>
    <rect class="deck-bullet-bar" x="${geometry.margin.left}" y="${round(row.center - row.barH / 2)}" width="${round(row.barW)}" height="${round(row.barH)}" rx="6"></rect>
    <line class="deck-bullet-target" x1="${round(row.targetX)}" y1="${round(row.center - row.trackH / 2 - 6)}" x2="${round(row.targetX)}" y2="${round(row.center + row.trackH / 2 + 6)}"></line>
    <text class="deck-bullet-value${row.valueInside ? ' deck-bullet-value-inside' : ''}" x="${round(row.valueX)}" y="${round(row.center + 5)}" text-anchor="${row.valueAnchor}">${escapeHtml(formatNumber(row.value))}</text>
  </g>`)
    .join('\n  ')

  return `<svg class="dsvg deck-chart-bullet-svg" data-deck-svgchart="bullet" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Bullet chart')}">
  <style>
    .deck-bullet-grid { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-bullet-axis { stroke: ${color('axis')}; stroke-width: 1.4; }
    .deck-bullet-track { fill: ${color('track')}; }
    .deck-bullet-bar { fill: ${color('bar')}; }
    .deck-bullet-target { stroke: ${color('target')}; stroke-width: 4; stroke-linecap: round; }
    .deck-bullet-label, .deck-bullet-tick, .deck-bullet-value { fill: ${color('text')}; font: 500 13px "Poppins", "Aptos", sans-serif; }
    .deck-bullet-value { font-weight: 600; }
    .deck-bullet-value-inside { fill: ${color('onBar')}; }
  </style>
  ${grid}
  <line class="deck-bullet-axis" x1="${geometry.margin.left}" y1="${round(geometry.height - geometry.margin.bottom)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  ${rows}
</svg>`
}

function bulletGeometry(chart) {
  const width = 760
  const rowCount = Math.max(1, chart.labels.length)
  const height = Math.max(250, 108 + rowCount * 58)
  const margin = { top: 28, right: 58, bottom: 44, left: 142 }
  const plotWidth = width - margin.left - margin.right
  const plotHeight = height - margin.top - margin.bottom
  const maxValue = niceCeiling(Math.max(1, ...chart.values, ...chart.targets))
  const xFor = (value) => margin.left + (Math.max(0, value) / maxValue) * plotWidth
  const rowH = plotHeight / rowCount
  const rows = chart.labels.map((label, index) => {
    const center = rowH * index + rowH / 2
    const value = chart.values[index] ?? 0
    const target = chart.targets[index] ?? 0
    const barEnd = xFor(value)
    const targetX = xFor(target)
    const valueInside = value > 0 && (Math.abs(targetX - barEnd) < 42 || barEnd > width - margin.right - 38)
    return {
      label,
      value,
      target,
      y: margin.top,
      center,
      trackH: Math.min(28, rowH * 0.42),
      barH: Math.min(18, rowH * 0.28),
      barW: Math.max(2, barEnd - margin.left),
      targetX,
      valueInside,
      valueX: valueInside ? Math.max(margin.left + 18, barEnd - 12) : Math.min(width - margin.right, barEnd + 12),
      valueAnchor: valueInside ? 'end' : 'start',
    }
  })

  return {
    width,
    height,
    margin,
    plotWidth,
    xFor,
    ticks: tickValues(0, maxValue),
    rows,
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

function round(value) {
  return Math.round(value * 10) / 10
}
