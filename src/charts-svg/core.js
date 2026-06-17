// Shared SSR-SVG charting primitives — used by both the deck
// (components/renderers.js) and the report (report-components/renderers.js).
// Pure functions, no DOM, no deps. Vector output stays crisp at any scale and
// renders with no client JS; a thin hover runtime (hover.js) layers tooltips on
// top for HTML only. Theme colours follow the funnel.js convention: emit
// `var(--deck-chart-*, fallback)` for HTML, or explicit hex for static/PPTX.

// Brand-aligned categorical palette (matches chartPalette / funnelPalette).
export const SVG_PALETTE = ['#0f82f5', '#59d6fd', '#5143d5', '#f9935b', '#66cc8e', '#fc5161']

export const DEFAULT_THEME = {
  dark: { heading: '#ffffff', muted: '#8a95a8', grid: '#27395a', axis: '#3a4f6f', surface: '#0d1d36', valueLabel: '#cfe5ff' },
  light: { heading: '#0b1b33', muted: '#5a6b82', grid: '#e3e9f1', axis: '#c2cddd', surface: '#ffffff', valueLabel: '#234' },
}

export function normHex(value, fallback) {
  const raw = String(value ?? '').trim()
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) return raw
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`
  return fallback
}

// Resolve the categorical palette from a brand definition (brand.colors.*),
// falling back to SVG_PALETTE. Mirrors funnelPalette so charts stay consistent.
export function resolvePalette(brand = {}, override) {
  if (Array.isArray(override) && override.length) return override.map((c, i) => normHex(c, SVG_PALETTE[i % SVG_PALETTE.length]))
  const c = (brand && brand.colors) || {}
  return [
    normHex(c.blue, SVG_PALETTE[0]),
    normHex(c.cyan || c.lightBlue, SVG_PALETTE[1]),
    normHex(c.purple, SVG_PALETTE[2]),
    normHex(c.orange, SVG_PALETTE[3]),
    normHex(c.green, SVG_PALETTE[4]),
    normHex(c.red, SVG_PALETTE[5]),
  ]
}

export function round(n) {
  return Math.round(n * 100) / 100
}

// Expand a numeric extent by a fraction so the line never kisses the frame.
export function niceExtent(min, max, { includeZero = false, pad = 0.12 } = {}) {
  let lo = includeZero ? Math.min(0, min) : min
  let hi = includeZero ? Math.max(0, max) : max
  if (lo === hi) { hi = lo + 1; lo = lo - 1 }
  const span = hi - lo
  lo -= span * pad
  hi += span * pad
  if (includeZero) { if (min >= 0) lo = 0; if (max <= 0) hi = 0 }
  return [lo, hi]
}

// ~`count` human-friendly tick values inside [lo, hi].
export function niceTicks(lo, hi, count = 5) {
  const span = hi - lo
  if (span <= 0) return [lo]
  const raw = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm >= 7.5 ? 10 : norm >= 3 ? 5 : norm >= 1.5 ? 2 : 1) * mag
  const start = Math.ceil(lo / step) * step
  const ticks = []
  for (let v = start; v <= hi + step * 1e-6; v += step) ticks.push(round(v))
  return ticks
}

// Smooth path via Catmull-Rom -> cubic Bezier (tension 0.5).
export function smoothPath(points) {
  if (points.length < 2) return points.length ? `M ${round(points[0].x)} ${round(points[0].y)}` : ''
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const t = 0.5 / 3
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`
  }
  return d
}

export function straightPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)}`).join(' ')
}

// Reusable <defs>: a vertical area gradient, a left->right line gradient and a
// soft glow. `id` namespaces them so multiple charts can coexist on one page.
export function chartDefs(id, accent, accent2) {
  const a2 = accent2 || accent
  // stop-color via style= so CSS var() resolves reliably inside SVG gradients
  return `<defs>
    <linearGradient id="${id}-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.42"></stop>
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0"></stop>
    </linearGradient>
    <linearGradient id="${id}-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" style="stop-color:${a2}"></stop>
      <stop offset="100%" style="stop-color:${accent}"></stop>
    </linearGradient>
    <filter id="${id}-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.4" result="b"></feGaussianBlur>
      <feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
    </filter>
  </defs>`
}

let __idSeq = 0
export function chartId(prefix = 'svgc') {
  __idSeq += 1
  return `${prefix}-${__idSeq}`
}
