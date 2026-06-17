// SSR-SVG doughnut: annular sectors (palette per slice), centre total, right-side
// key (swatch + label + value · percent, like the funnel), per-slice hover tips.
import { escapeAttr, escapeHtml, formatNumber } from '../components/utils.js'
import { DEFAULT_THEME, SVG_PALETTE, normHex, resolvePalette, round } from './core.js'

const W = 760
const H = 350

function arcPath(cx, cy, R, r, a0, a1) {
  const large = (a1 - a0) > Math.PI ? 1 : 0
  const p = (rad, a) => [round(cx + rad * Math.cos(a)), round(cy + rad * Math.sin(a))]
  const [x0o, y0o] = p(R, a0)
  const [x1o, y1o] = p(R, a1)
  const [x1i, y1i] = p(r, a1)
  const [x0i, y0i] = p(r, a0)
  return `M ${x0o} ${y0o} A ${R} ${R} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${r} ${r} 0 ${large} 0 ${x0i} ${y0i} Z`
}

export function renderDoughnutChartSvg(chart, options = {}) {
  const mode = options.mode === 'light' ? 'light' : 'dark'
  const theme = DEFAULT_THEME[mode]
  const useVars = options.cssVariables !== false
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback
  const palette = resolvePalette(options.brand, options.palette)

  const labels = chart.labels || []
  const values = (chart.values || []).map((v) => Number(v) || 0)
  const total = values.reduce((s, v) => s + v, 0)

  const cx = 200
  const cy = 178
  const R = 132
  const r = 82
  const gap = 0.012 // radians between slices

  let cursor = -Math.PI / 2
  const slices = values.map((v, i) => {
    const frac = total > 0 ? v / total : 0
    const a0 = cursor + gap / 2
    const a1 = cursor + frac * Math.PI * 2 - gap / 2
    cursor += frac * Math.PI * 2
    const color = normHex(palette[i % palette.length], SVG_PALETTE[i % SVG_PALETTE.length])
    const pct = total > 0 ? Math.round(frac * 100) : 0
    const tip = `${labels[i] || ''}: ${formatNumber(v)} · ${pct}%`
    if (a1 <= a0) return ''
    return `<path class="dsvg-slice" data-deck-tip="${escapeAttr(tip)}" d="${arcPath(cx, cy, R, r, a0, a1)}" style="fill:${color}"/>`
  }).join('\n  ')

  // right-side key
  const keyX = 410
  const rowH = Math.min(54, (H - 40) / Math.max(1, labels.length))
  const startY = (H - rowH * labels.length) / 2 + rowH / 2
  const key = labels.map((label, i) => {
    const v = values[i] || 0
    const pct = total > 0 ? Math.round((v / total) * 100) : 0
    const color = normHex(palette[i % palette.length], SVG_PALETTE[i % SVG_PALETTE.length])
    const y = startY + i * rowH
    return `<g class="dsvg-slice" data-deck-tip="${escapeAttr(`${label}: ${formatNumber(v)} · ${pct}%`)}">
      <rect x="${keyX}" y="${round(y - 7)}" width="13" height="13" rx="3" style="fill:${color}"/>
      <text class="dsvg-key-name" x="${keyX + 22}" y="${round(y - 1)}" style="fill:${tc('heading', theme.heading)}">${escapeHtml(label)}</text>
      <text class="dsvg-key-value" x="${keyX + 22}" y="${round(y + 15)}" style="fill:${tc('muted', theme.muted)}">${escapeHtml(formatNumber(v))} · ${pct}%</text>
    </g>`
  }).join('\n  ')

  return `<svg class="dsvg dsvg-doughnut" data-deck-svgchart="doughnut" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(chart.title || 'Doughnut chart')}">
  ${options.background ? `<rect x="0" y="0" width="${W}" height="${H}" fill="${theme.surface}"/>` : ''}
  ${slices}
  <text class="dsvg-doughnut-cap" x="${cx}" y="${cy - 8}" text-anchor="middle" style="fill:${tc('muted', theme.muted)}">Total</text>
  <text class="dsvg-doughnut-total" x="${cx}" y="${cy + 20}" text-anchor="middle" style="fill:${tc('heading', theme.heading)}">${escapeHtml(formatNumber(total))}</text>
  ${key}
</svg>`
}
