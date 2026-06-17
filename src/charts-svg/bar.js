// SSR-SVG bar charts: single, grouped, stacked. Vertical bars on a categorical
// X axis with a value Y axis (gridlines + ticks). Solid bright palette fills,
// rounded tops, value/total labels, per-bar hover tips. Shares core.js helpers.
import { escapeAttr, escapeHtml, formatNumber } from '../components/utils.js'
import {
  DEFAULT_THEME, SVG_PALETTE, niceExtent, niceTicks, normHex, resolvePalette, round,
} from './core.js'

const W = 760
const H = 380

function setup(options, hasLegend) {
  const mode = options.mode === 'light' ? 'light' : 'dark'
  const theme = DEFAULT_THEME[mode]
  const useVars = options.cssVariables !== false
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback
  const palette = resolvePalette(options.brand, options.palette)
  const margin = { top: hasLegend ? 40 : 22, right: 28, bottom: 46, left: 58 }
  return { theme, tc, palette, margin }
}

// horizontal gridlines + y tick labels + x category labels
function axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit }) {
  const grid = ticks.map((t) => {
    const y = yFor(t)
    return `<line class="dsvg-grid" x1="${round(margin.left)}" y1="${round(y)}" x2="${round(margin.left + plotW)}" y2="${round(y)}" style="stroke:${tc('grid', theme.grid)}"/>
    <text class="dsvg-ytick" x="${round(margin.left - 12)}" y="${round(y + 4)}" text-anchor="end" style="fill:${tc('muted', theme.muted)}">${escapeHtml(formatNumber(t))}${escapeHtml(unit || '')}</text>`
  }).join('\n  ')
  const xlabels = labels.map((label, i) =>
    `<text class="dsvg-xtick" x="${round(bandCenter(i))}" y="${H - 18}" text-anchor="middle" style="fill:${tc('muted', theme.muted)}">${escapeHtml(label)}</text>`
  ).join('\n  ')
  return { grid, xlabels }
}

function legendRow(seriesNames, palette, margin, headingColor) {
  // simple horizontal legend across the top
  let x = margin.left
  const y = 18
  return seriesNames.map((name, i) => {
    const swatch = `<rect x="${round(x)}" y="${y - 10}" width="12" height="12" rx="3" style="fill:${palette[i % palette.length]}"/>`
    const text = `<text class="dsvg-legend" x="${round(x + 17)}" y="${y}" style="fill:${headingColor}">${escapeHtml(name)}</text>`
    x += 17 + Math.max(48, name.length * 8.2) + 18
    return `${swatch}${text}`
  }).join('\n  ')
}

function barRect(x, y, w, h, fill, tip) {
  const r = Math.min(5, w / 2, h)
  return `<g class="dsvg-bar" data-deck-tip="${escapeAttr(tip)}">
      <path d="M ${round(x)} ${round(y + h)} L ${round(x)} ${round(y + r)} Q ${round(x)} ${round(y)} ${round(x + r)} ${round(y)} L ${round(x + w - r)} ${round(y)} Q ${round(x + w)} ${round(y)} ${round(x + w)} ${round(y + r)} L ${round(x + w)} ${round(y + h)} Z" style="fill:${fill}"/>
    </g>`
}

function svgWrap(kind, label, inner) {
  return `<svg class="dsvg dsvg-bar" data-deck-svgchart="${kind}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(label || 'Bar chart')}">
  ${inner}
</svg>`
}

export function renderBarChartSvg(chart, options = {}) {
  const { theme, tc, palette, margin } = setup(options, false)
  const labels = chart.labels || []
  const values = (chart.values || []).map((v) => Number(v) || 0)
  const [, hi] = niceExtent(0, Math.max(...values, 0), { includeZero: true, pad: 0.16 })
  const plotW = W - margin.left - margin.right
  const plotH = H - margin.top - margin.bottom
  const baseY = margin.top + plotH
  const yFor = (v) => baseY - (v / hi) * plotH
  const band = plotW / Math.max(1, labels.length)
  const barW = band * 0.6
  const bandCenter = (i) => margin.left + band * i + band / 2
  const ticks = niceTicks(0, hi, 5)
  const accent = normHex(options.accentColor, palette[0] || SVG_PALETTE[0])

  const bars = values.map((v, i) => {
    const x = bandCenter(i) - barW / 2
    const y = yFor(v)
    const h = baseY - y
    const tip = `${labels[i] || ''}: ${formatNumber(v)}${chart.unit || ''}`
    const rect = barRect(x, y, barW, h, accent, tip)
    const valLabel = `<text class="dsvg-val" x="${round(bandCenter(i))}" y="${round(y - 8)}" text-anchor="middle" style="fill:${tc('value', theme.valueLabel)}">${escapeHtml(formatNumber(v))}${escapeHtml(chart.unit || '')}</text>`
    return rect + '\n  ' + valLabel
  }).join('\n  ')

  const { grid, xlabels } = axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit: chart.unit })
  return svgWrap('bar', chart.title || 'Bar chart',
    `${grid}\n  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baseY)}" x2="${round(margin.left + plotW)}" y2="${round(baseY)}" style="stroke:${tc('axis', theme.axis)}"/>\n  ${bars}\n  ${xlabels}`)
}

export function renderGroupedBarChartSvg(chart, options = {}) {
  const { theme, tc, palette, margin } = setup(options, true)
  const labels = chart.labels || []
  const seriesNames = chart.seriesNames || []
  const matrix = chart.matrix || []
  const allVals = matrix.flat().map((v) => Number(v) || 0)
  const [, hi] = niceExtent(0, Math.max(...allVals, 0), { includeZero: true, pad: 0.16 })
  const plotW = W - margin.left - margin.right
  const plotH = H - margin.top - margin.bottom
  const baseY = margin.top + plotH
  const yFor = (v) => baseY - (v / hi) * plotH
  const band = plotW / Math.max(1, labels.length)
  const bandCenter = (i) => margin.left + band * i + band / 2
  const groupW = band * 0.74
  const n = Math.max(1, seriesNames.length)
  const barW = groupW / n
  const ticks = niceTicks(0, hi, 5)

  const bars = labels.map((label, li) => {
    const x0 = bandCenter(li) - groupW / 2
    return seriesNames.map((name, si) => {
      const v = Number(matrix[si]?.[li]) || 0
      const x = x0 + si * barW
      const y = yFor(v)
      const h = baseY - y
      const tip = `${name} · ${label}: ${formatNumber(v)}${chart.unit || ''}`
      return barRect(x + barW * 0.08, y, barW * 0.84, h, palette[si % palette.length], tip)
    }).join('\n  ')
  }).join('\n  ')

  const { grid, xlabels } = axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit: chart.unit })
  return svgWrap('grouped-bar', chart.title || 'Grouped bar chart',
    `${legendRow(seriesNames, palette, margin, tc('heading', theme.heading))}\n  ${grid}\n  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baseY)}" x2="${round(margin.left + plotW)}" y2="${round(baseY)}" style="stroke:${tc('axis', theme.axis)}"/>\n  ${bars}\n  ${xlabels}`)
}

export function renderStackedBarChartSvg(chart, options = {}) {
  const { theme, tc, palette, margin } = setup(options, true)
  const labels = chart.labels || []
  const seriesNames = chart.seriesNames || []
  const matrix = chart.matrix || []
  const totals = labels.map((_, li) => seriesNames.reduce((s, _n, si) => s + (Number(matrix[si]?.[li]) || 0), 0))
  const [, hi] = niceExtent(0, Math.max(...totals, 0), { includeZero: true, pad: 0.16 })
  const plotW = W - margin.left - margin.right
  const plotH = H - margin.top - margin.bottom
  const baseY = margin.top + plotH
  const yFor = (v) => baseY - (v / hi) * plotH
  const band = plotW / Math.max(1, labels.length)
  const bandCenter = (i) => margin.left + band * i + band / 2
  const barW = band * 0.6
  const ticks = niceTicks(0, hi, 5)

  const bars = labels.map((label, li) => {
    const x = bandCenter(li) - barW / 2
    let cursor = 0 // running value from bottom
    const segs = seriesNames.map((name, si) => {
      const v = Number(matrix[si]?.[li]) || 0
      if (v <= 0) return ''
      const yTop = yFor(cursor + v)
      const yBottom = yFor(cursor)
      cursor += v
      const tip = `${name} · ${label}: ${formatNumber(v)}${chart.unit || ''}`
      return `<rect class="dsvg-bar" data-deck-tip="${escapeAttr(tip)}" x="${round(x)}" y="${round(yTop)}" width="${round(barW)}" height="${round(yBottom - yTop)}" style="fill:${palette[si % palette.length]}"/>`
    }).join('\n  ')
    const totalLabel = `<text class="dsvg-val" x="${round(bandCenter(li))}" y="${round(yFor(totals[li]) - 8)}" text-anchor="middle" style="fill:${tc('value', theme.valueLabel)}">${escapeHtml(formatNumber(totals[li]))}${escapeHtml(chart.unit || '')}</text>`
    return segs + '\n  ' + totalLabel
  }).join('\n  ')

  const { grid, xlabels } = axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit: chart.unit })
  return svgWrap('stacked-bar', chart.title || 'Stacked bar chart',
    `${legendRow(seriesNames, palette, margin, tc('heading', theme.heading))}\n  ${grid}\n  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baseY)}" x2="${round(margin.left + plotW)}" y2="${round(baseY)}" style="stroke:${tc('axis', theme.axis)}"/>\n  ${bars}\n  ${xlabels}`)
}
