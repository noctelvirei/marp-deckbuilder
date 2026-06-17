// SSR-SVG scatter / bubble charts. Numeric X and Y axes (gridlines + ticks both
// directions), per-point palette fill (matches the old canvas), optional point
// labels, axis titles, per-point hover tips. Bubble scales radius from point.r.
import { escapeAttr, escapeHtml, formatNumber } from '../components/utils.js'
import {
  DEFAULT_THEME, SVG_PALETTE, niceExtent, niceTicks, normHex, resolvePalette, round,
} from './core.js'

const W = 760
const H = 350

function renderPointSvg(chart, options = {}) {
  const bubble = options.bubble === true
  const mode = options.mode === 'light' ? 'light' : 'dark'
  const theme = DEFAULT_THEME[mode]
  const useVars = options.cssVariables !== false
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback
  const palette = resolvePalette(options.brand, options.palette)

  const margin = { top: 26, right: 28, bottom: 56, left: 64 }
  const pts = (chart.points || []).filter((p) => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
  const xs = pts.map((p) => Number(p.x))
  const ys = pts.map((p) => Number(p.y))
  const [minX, maxX] = niceExtent(Math.min(...xs, 0), Math.max(...xs, 1), { pad: 0.1 })
  const [minY, maxY] = niceExtent(Math.min(...ys, 0), Math.max(...ys, 1), { pad: 0.1 })
  const plotW = W - margin.left - margin.right
  const plotH = H - margin.top - margin.bottom
  const xFor = (v) => margin.left + ((v - minX) / (maxX - minX)) * plotW
  const yFor = (v) => margin.top + plotH - ((v - minY) / (maxY - minY)) * plotH
  const maxR = Math.max(...pts.map((p) => Number(p.r) || 0), 1)

  const xTicks = niceTicks(minX, maxX, 5)
  const yTicks = niceTicks(minY, maxY, 5)
  const grid = [
    ...xTicks.map((t) => {
      const x = xFor(t)
      return `<line class="dsvg-grid" x1="${round(x)}" y1="${margin.top}" x2="${round(x)}" y2="${round(margin.top + plotH)}" style="stroke:${tc('grid', theme.grid)}"/>
    <text class="dsvg-xtick" x="${round(x)}" y="${H - 30}" text-anchor="middle" style="fill:${tc('muted', theme.muted)}">${escapeHtml(formatNumber(t))}</text>`
    }),
    ...yTicks.map((t) => {
      const y = yFor(t)
      return `<line class="dsvg-grid" x1="${margin.left}" y1="${round(y)}" x2="${round(margin.left + plotW)}" y2="${round(y)}" style="stroke:${tc('grid', theme.grid)}"/>
    <text class="dsvg-ytick" x="${round(margin.left - 12)}" y="${round(y + 4)}" text-anchor="end" style="fill:${tc('muted', theme.muted)}">${escapeHtml(formatNumber(t))}</text>`
    }),
  ].join('\n  ')

  const dots = pts.map((p, i) => {
    const x = xFor(Number(p.x))
    const y = yFor(Number(p.y))
    const color = normHex(palette[i % palette.length], SVG_PALETTE[i % SVG_PALETTE.length])
    const r = bubble ? Math.max(6, Math.min(26, 6 + ((Number(p.r) || 0) / maxR) * 20)) : 7
    const label = p.label || `${formatNumber(p.x)}, ${formatNumber(p.y)}`
    const tip = bubble
      ? `${label}: ${formatNumber(p.x)}, ${formatNumber(p.y)} · size ${formatNumber(p.r)}`
      : `${label}: ${formatNumber(p.x)}, ${formatNumber(p.y)}`
    const text = (!bubble && p.label)
      ? `<text class="dsvg-point-label" x="${round(x + r + 4)}" y="${round(y - r - 2)}" style="fill:${tc('value', theme.valueLabel)}">${escapeHtml(p.label)}</text>`
      : ''
    return `<g class="dsvg-point" data-deck-tip="${escapeAttr(tip)}">
      <circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" style="fill:${color}${bubble ? 'cc' : 'ee'};stroke:${color}"/>
      ${text}
    </g>`
  }).join('\n  ')

  const xAxisLabel = chart.xAxisLabel || 'X'
  const yAxisLabel = chart.yAxisLabel || 'Y'
  return `<svg class="dsvg dsvg-point" data-deck-svgchart="${bubble ? 'bubble' : 'scatter'}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(chart.title || (bubble ? 'Bubble chart' : 'Scatter chart'))}">
  ${options.background ? `<rect x="0" y="0" width="${W}" height="${H}" fill="${theme.surface}"/>` : ''}
  ${grid}
  <line class="dsvg-axis" x1="${margin.left}" y1="${round(margin.top + plotH)}" x2="${round(margin.left + plotW)}" y2="${round(margin.top + plotH)}" style="stroke:${tc('axis', theme.axis)}"/>
  <line class="dsvg-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${round(margin.top + plotH)}" style="stroke:${tc('axis', theme.axis)}"/>
  ${dots}
  <text class="dsvg-axislabel" x="${round(margin.left + plotW / 2)}" y="${H - 6}" text-anchor="middle" style="fill:${tc('muted', theme.muted)}">${escapeHtml(xAxisLabel)}</text>
  <text class="dsvg-axislabel" transform="translate(16 ${round(margin.top + plotH / 2)}) rotate(-90)" text-anchor="middle" style="fill:${tc('muted', theme.muted)}">${escapeHtml(yAxisLabel)}</text>
</svg>`
}

export function renderScatterChartSvg(chart, options = {}) {
  return renderPointSvg(chart, { ...options, bubble: false })
}

export function renderBubbleChartSvg(chart, options = {}) {
  return renderPointSvg(chart, { ...options, bubble: true })
}
