import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#d8e2f0',
    text: '#333333',
    muted: '#666666',
    fill: 'rgba(15, 130, 245, .18)',
    stroke: '#0f82f5',
    point: '#59d6fd',
  },
  dark: {
    grid: '#31557e',
    text: '#f4f8ff',
    muted: '#c8d8f0',
    fill: 'rgba(89, 214, 253, .20)',
    stroke: '#59d6fd',
    point: '#0f82f5',
  },
}

export function renderRadarSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    muted: options.mutedColor || DEFAULT_COLORS[mode].muted,
    fill: options.fillColor || DEFAULT_COLORS[mode].fill,
    stroke: options.strokeColor || DEFAULT_COLORS[mode].stroke,
    point: options.pointColor || DEFAULT_COLORS[mode].point,
  }
  const color = (name) => useVariables ? `var(--deck-radar-${name}, ${colors[name]})` : colors[name]
  const geometry = radarGeometry(chart)
  const rings = [0.25, 0.5, 0.75, 1]
    .map((scale) => `<polygon class="deck-radar-grid" points="${radarPoints(chart.labels.length, geometry.center, geometry.radius * scale).join(' ')}"></polygon>`)
    .join('\n  ')
  const axes = radarPointObjects(chart.labels.length, geometry.center, geometry.radius)
    .map((point) => `<line class="deck-radar-grid" x1="${geometry.center.x}" y1="${geometry.center.y}" x2="${point.x}" y2="${point.y}"></line>`)
    .join('\n  ')
  const labels = radarPointObjects(chart.labels.length, geometry.center, geometry.radius + 34)
    .map((point, index) => {
      const anchor = point.x < geometry.center.x - 8 ? 'end' : point.x > geometry.center.x + 8 ? 'start' : 'middle'
      return `<text class="deck-radar-label" x="${point.x}" y="${point.y + 5}" text-anchor="${anchor}">${escapeHtml(chart.labels[index])}</text>`
    })
    .join('\n  ')
  const shapePoints = chart.values
    .map((value, index) => radarPoint(index, chart.values.length, geometry.center, geometry.radius * (value / geometry.maxValue)))
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  const dots = chart.values
    .map((value, index) => {
      const point = radarPoint(index, chart.values.length, geometry.center, geometry.radius * (value / geometry.maxValue))
      return `<g class="deck-radar-point" transform="translate(${point.x} ${point.y})">
    <circle r="5"><title>${escapeHtml(chart.labels[index])}: ${escapeHtml(formatNumber(value))}</title></circle>
    <text x="0" y="-12" text-anchor="middle">${escapeHtml(formatNumber(value))}</text>
  </g>`
    })
    .join('\n  ')

  return `<svg class="deck-chart-radar-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Radar chart')}">
  <style>
    .deck-radar-grid { fill: none; stroke: ${color('grid')}; stroke-width: 1.4; }
    .deck-radar-shape { fill: ${color('fill')}; stroke: ${color('stroke')}; stroke-width: 4; stroke-linejoin: round; }
    .deck-radar-point circle { fill: ${color('point')}; stroke: ${color('stroke')}; stroke-width: 2; }
    .deck-radar-point text, .deck-radar-label, .deck-radar-scale { fill: ${color('text')}; font: 600 12px "Poppins", "Aptos", sans-serif; }
    .deck-radar-scale { fill: ${color('muted')}; font-weight: 500; }
  </style>
  <text class="deck-radar-scale" x="${geometry.center.x + 10}" y="${geometry.center.y - geometry.radius - 8}">${escapeHtml(formatNumber(geometry.maxValue))}</text>
  ${rings}
  ${axes}
  <polygon class="deck-radar-shape" points="${shapePoints}"></polygon>
  ${dots}
  ${labels}
</svg>`
}

function radarGeometry(chart) {
  const width = 760
  const height = 350
  const center = { x: 380, y: 176 }
  const radius = 116
  const maxValue = niceCeiling(Math.max(1, ...chart.values))
  return { width, height, center, radius, maxValue }
}

function radarPoints(count, center, radius) {
  return radarPointObjects(count, center, radius).map((point) => `${point.x},${point.y}`)
}

function radarPointObjects(count, center, radius) {
  return Array.from({ length: count }, (_, index) => radarPoint(index, count, center, radius))
}

function radarPoint(index, count, center, radius) {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2
  return {
    x: round(center.x + Math.cos(angle) * radius),
    y: round(center.y + Math.sin(angle) * radius),
  }
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
