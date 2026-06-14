import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    surface: '#ffffff',
    panel: '#fdfdfd',
    border: '#dedede',
    heading: '#090909',
    body: '#444444',
    muted: '#666666',
    track: '#eef6fe',
    radarGrid: '#dedede',
    radarFill: 'rgba(15, 130, 245, .2)',
    radarStroke: '#0f82f5',
    fills: ['#0f82f5', '#5143d5', '#66cc8e', '#59d6fd', '#f9935b', '#fbc546'],
  },
  dark: {
    surface: '#071228',
    panel: '#0d1d36',
    border: '#1e3a5f',
    heading: '#ffffff',
    body: '#c8d8f0',
    muted: '#8a95a8',
    track: '#071228',
    radarGrid: '#1e3a5f',
    radarFill: 'rgba(89, 214, 253, .22)',
    radarStroke: '#59d6fd',
    fills: ['#0f82f5', '#5143d5', '#66cc8e', '#59d6fd', '#f9935b', '#fbc546'],
  },
}

export function renderImpactRadarSvg(impactRadar, options = {}) {
  const animate = options.animate !== false
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = DEFAULT_COLORS[mode]
  const color = (name) => useVariables ? `var(--deck-impact-radar-${name}, ${colors[name]})` : colors[name]
  const fillColor = (index) => useVariables
    ? `var(--deck-impact-radar-fill-${index % colors.fills.length}, ${colors.fills[index % colors.fills.length]})`
    : colors.fills[index % colors.fills.length]

  const bars = renderBars(impactRadar, fillColor, animate)
  const radar = renderRadar(impactRadar, animate)

  return `<svg class="deck-impact-radar-svg" viewBox="0 0 920 360" role="img" aria-label="${escapeAttr(impactRadar.title || 'Impact radar')}">
  <style>
    .deck-impact-radar-surface { fill: ${color('surface')}; }
    .deck-impact-radar-panel { fill: ${color('panel')}; stroke: ${color('border')}; }
    .deck-impact-radar-heading { fill: ${color('heading')}; font: 500 24px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-label { fill: ${color('heading')}; font: 15px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-value { fill: ${color('heading')}; font: 500 15px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-muted { fill: ${color('muted')}; font: 13px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-track { fill: ${color('track')}; }
    .deck-impact-radar-grid { fill: none; stroke: ${color('radarGrid')}; }
    .deck-impact-radar-shape { fill: ${color('radarFill')}; stroke: ${color('radarStroke')}; stroke-width: 5; }
    .deck-impact-radar-bar-fill { transform-box: fill-box; transform-origin: left center; animation: deck-impact-radar-fill-in 800ms ease-out both; }
    .deck-impact-radar-shape-animated { opacity: 0; animation: deck-impact-radar-fade-in 800ms ease-out 240ms both; }
    @keyframes deck-impact-radar-fill-in { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes deck-impact-radar-fade-in { from { opacity: 0; } to { opacity: 1; } }
  </style>
  <rect class="deck-impact-radar-surface" x="0" y="0" width="920" height="360" rx="0"></rect>
  <rect class="deck-impact-radar-panel" x="18" y="18" width="884" height="324"></rect>
  <text class="deck-impact-radar-heading" x="50" y="64">${escapeHtml(impactRadar.barTitle)}</text>
  ${bars}
  <text class="deck-impact-radar-heading" x="575" y="64">${escapeHtml(impactRadar.radarTitle)}</text>
  ${radar}
</svg>`
}

function renderBars(impactRadar, fillColor, animate) {
  const rowStep = Math.min(50, 190 / Math.max(impactRadar.labels.length - 1, 1))
  return impactRadar.labels
    .map((label, index) => {
      const value = impactRadar.values[index] ?? 0
      const width = Math.max(2, Math.round((value / 100) * 250))
      const y = 104 + index * rowStep
      const animationAttrs = animate
        ? ` class="deck-impact-radar-bar-fill" style="animation-delay: ${index * 80}ms;"`
        : ''
      return `<g>
    <text class="deck-impact-radar-label" x="50" y="${y + 16}">${escapeHtml(label)}</text>
    <rect class="deck-impact-radar-track" x="178" y="${y}" width="250" height="18"></rect>
    <rect${animationAttrs} x="178" y="${y}" width="${width}" height="18" fill="${fillColor(index)}"></rect>
    <text class="deck-impact-radar-value" x="446" y="${y + 16}">${escapeHtml(formatNumber(value))}${escapeHtml(impactRadar.unit)}</text>
  </g>`
    })
    .join('\n')
}

function renderRadar(impactRadar, animate) {
  const center = { x: 705, y: 198 }
  const radius = 96
  const grid = [1, 2 / 3, 1 / 3]
    .map((scale) => `<polygon class="deck-impact-radar-grid" points="${radarPoints(impactRadar.labels.length, center, radius * scale).join(' ')}"></polygon>`)
    .join('\n    ')
  const axes = radarPointObjects(impactRadar.labels.length, center, radius)
    .map((point) => `<line class="deck-impact-radar-grid" x1="${center.x}" y1="${center.y}" x2="${point.x}" y2="${point.y}"></line>`)
    .join('\n    ')
  const labels = radarPointObjects(impactRadar.labels.length, center, radius + 28)
    .map((point, index) => {
      const anchor = point.x < center.x - 12 ? 'end' : point.x > center.x + 12 ? 'start' : 'middle'
      return `<text class="deck-impact-radar-label" x="${point.x}" y="${point.y + 5}" text-anchor="${anchor}">${escapeHtml(impactRadar.labels[index])}</text>`
    })
    .join('\n    ')
  const shapePoints = impactRadar.radarValues
    .map((value, index) => radarPoint(index, impactRadar.radarValues.length, center, radius * (value / 100)))
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  const animationClass = animate ? ' deck-impact-radar-shape-animated' : ''

  return `<g>
    ${grid}
    ${axes}
    <polygon class="deck-impact-radar-shape${animationClass}" points="${shapePoints}"></polygon>
    ${labels}
  </g>`
}

function radarPoints(count, center, radius) {
  return radarPointObjects(count, center, radius).map((point) => `${point.x},${point.y}`)
}

function radarPointObjects(count, center, radius) {
  return Array.from({ length: count }, (_, index) => {
    return radarPoint(index, count, center, radius)
  })
}

function radarPoint(index, count, center, radius) {
  const angle = -Math.PI / 2 + (index / count) * Math.PI * 2
  return {
    x: round(center.x + Math.cos(angle) * radius),
    y: round(center.y + Math.sin(angle) * radius),
  }
}

function round(value) {
  return Math.round(value * 10) / 10
}
