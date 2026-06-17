// SSR-SVG line / area chart. One renderer, `area` flag toggles the fill.
import { escapeAttr, escapeHtml, formatNumber } from '../components/utils.js'
import {
  DEFAULT_THEME, SVG_PALETTE, chartDefs, chartId, niceExtent, niceTicks,
  normHex, resolvePalette, round, smoothPath, straightPath,
} from './core.js'

export function renderLineChartSvg(chart, options = {}) {
  const mode = options.mode === 'light' ? 'light' : 'dark'
  const theme = DEFAULT_THEME[mode]
  const useVars = options.cssVariables !== false
  const area = options.area === true
  const smooth = options.smooth !== false
  const width = options.width || 760
  const height = options.height || 380
  const margin = { top: chart.title ? 54 : 28, right: 34, bottom: 46, left: 56 }

  // theme colour: CSS var (HTML, brand-overridable) or explicit (static/PPTX)
  const palette = resolvePalette(options.brand, options.palette)
  const accent = normHex(options.accentColor, palette[0] || SVG_PALETTE[0])
  const accent2 = normHex(options.accent2Color, palette[1] || accent)
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback

  const labels = chart.labels || []
  const values = (chart.values || []).map((v) => Number(v) || 0)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const [lo, hi] = niceExtent(minV, maxV, { includeZero: area })

  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const xFor = (i) => values.length > 1 ? margin.left + (i / (values.length - 1)) * plotW : margin.left + plotW / 2
  const yFor = (v) => margin.top + plotH - ((v - lo) / (hi - lo)) * plotH
  const baselineY = margin.top + plotH
  const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v), v, label: labels[i] || '' }))

  const id = chartId('line')
  const ticks = niceTicks(lo, hi, 5)
  const grid = ticks.map((t) => {
    const y = yFor(t)
    return `<line class="dsvg-grid" x1="${round(margin.left)}" y1="${round(y)}" x2="${round(margin.left + plotW)}" y2="${round(y)}" style="stroke:${tc('grid', theme.grid)}"></line>
    <text class="dsvg-ytick" x="${round(margin.left - 12)}" y="${round(y + 4)}" text-anchor="end" style="fill:${tc('muted', theme.muted)}">${escapeHtml(formatNumber(t))}${escapeHtml(chart.unit || '')}</text>`
  }).join('\n  ')

  const lastIndex = points.length - 1
  const xlabels = points.map((p, i) => {
    const anchor = i === 0 ? 'start' : i === lastIndex ? 'end' : 'middle'
    return `<text class="dsvg-xtick" x="${round(p.x)}" y="${height - 18}" text-anchor="${anchor}" style="fill:${tc('muted', theme.muted)}">${escapeHtml(p.label)}</text>`
  }).join('\n  ')

  const linePathD = smooth ? smoothPath(points) : straightPath(points)
  const areaPathD = area
    ? `${linePathD} L ${round(points[lastIndex].x)} ${round(baselineY)} L ${round(points[0].x)} ${round(baselineY)} Z`
    : ''

  const markers = points.map((p) => {
    const tip = `${p.label}: ${formatNumber(p.v)}${chart.unit || ''}`
    return `<g class="dsvg-marker" data-deck-tip="${escapeAttr(tip)}" data-deck-x="${round(p.x)}" data-deck-y="${round(p.y)}">
      <circle class="dsvg-hit" cx="${round(p.x)}" cy="${round(p.y)}" r="14"></circle>
      <circle class="dsvg-halo" cx="${round(p.x)}" cy="${round(p.y)}" r="9" style="fill:${accent}"></circle>
      <circle class="dsvg-dot" cx="${round(p.x)}" cy="${round(p.y)}" r="4.5" style="stroke:${accent}"></circle>
      <text class="dsvg-val" x="${round(p.x)}" y="${round(p.y - 14)}" text-anchor="middle" style="fill:${tc('value', theme.valueLabel)}">${escapeHtml(formatNumber(p.v))}${escapeHtml(chart.unit || '')}</text>
    </g>`
  }).join('\n  ')

  return `<svg class="dsvg dsvg-line" data-deck-svgchart="${area ? 'area' : 'line'}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(chart.title || (area ? 'Area chart' : 'Line chart'))}">
  ${chartDefs(id, accent, accent2)}
  ${chart.title ? `<text class="dsvg-title" x="${margin.left}" y="30" style="fill:${tc('heading', theme.heading)}">${escapeHtml(chart.title)}</text>` : ''}
  ${grid}
  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baselineY)}" x2="${round(margin.left + plotW)}" y2="${round(baselineY)}" style="stroke:${tc('axis', theme.axis)}"></line>
  ${area ? `<path class="dsvg-areafill" d="${areaPathD}" style="fill:url(#${id}-area)"></path>` : ''}
  <path class="dsvg-linepath" d="${linePathD}" style="stroke:url(#${id}-line);filter:url(#${id}-glow)"></path>
  ${markers}
  ${xlabels}
</svg>`
}

export function renderAreaChartSvg(chart, options = {}) {
  return renderLineChartSvg(chart, { ...options, area: true })
}
