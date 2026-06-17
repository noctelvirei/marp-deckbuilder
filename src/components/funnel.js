import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    surface: '#ffffff',
    border: '#dedede',
    heading: '#090909',
    muted: '#666666',
    accent: '#0f82f5',
    onAccent: '#ffffff',
  },
  dark: {
    surface: '#0d1d36',
    border: '#1e3a5f',
    heading: '#ffffff',
    muted: '#8a95a8',
    accent: '#0f82f5',
    onAccent: '#ffffff',
  },
}

// Per-stage palette (matches the report funnel's reportChartPalette defaults).
const STAGE_PALETTE = ['#0F82F5', '#59D6FD', '#5143D5', '#F9935B', '#66CC8E', '#FC5161']

// Resolve the brand chart palette the same way the report funnel does.
export function funnelPalette(brand = {}) {
  const c = brand.colors || {}
  const pick = (value, fallback) => {
    const raw = String(value || fallback).trim()
    return /^#/.test(raw) ? raw : `#${raw}`
  }
  return [
    pick(c.blue, '0F82F5'),
    pick(c.cyan || c.lightBlue, '59D6FD'),
    pick(c.purple, '5143D5'),
    pick(c.orange, 'F9935B'),
    pick(c.green, '66CC8E'),
    pick(c.red, 'FC5161'),
  ]
}

export function renderFunnelSvg(funnel, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    accent: cssColor(options.accentColor, DEFAULT_COLORS[mode].accent),
    onAccent: cssColor(options.onAccentColor, DEFAULT_COLORS[mode].onAccent),
    // key text sits on the card surface; callers (PPTX) can pass colours that
    // contrast with the actual card so the stage name is never invisible.
    heading: cssColor(options.headingColor, DEFAULT_COLORS[mode].heading),
    muted: cssColor(options.mutedColor, DEFAULT_COLORS[mode].muted),
  }
  const color = (name) => useVariables ? `var(--deck-funnel-${name}, ${colors[name]})` : colors[name]
  // Static (PPTX) renders pass an explicit palette; deck HTML reads brand colours
  // from render.js via the --deck-funnel-stage-* CSS variables.
  const palette = Array.isArray(options.palette) && options.palette.length ? options.palette : STAGE_PALETTE
  const stageColor = (index) => {
    const k = index % STAGE_PALETTE.length
    return useVariables ? `var(--deck-funnel-stage-${k}, ${STAGE_PALETTE[k]})` : (palette[k] || STAGE_PALETTE[k])
  }

  const width = 760
  const height = 318
  const keyWidth = 230
  const funnelWidth = width - keyWidth
  const centerX = funnelWidth / 2
  const topY = 20
  const gap = 7
  const stages = funnelStages(funnel, { maxWidth: funnelWidth - 56, minWidth: 84 })
  const stageH = (height - topY - 20 - gap * Math.max(0, stages.length - 1)) / Math.max(1, stages.length)
  const keyX = funnelWidth + 14

  const segments = stages
    .map((stage, index) => {
      const y1 = topY + index * (stageH + gap)
      const y2 = y1 + stageH
      const topW = stage.topWidth
      const bottomW = stage.bottomWidth
      const points = [
        `${round(centerX - topW / 2)},${round(y1)}`,
        `${round(centerX + topW / 2)},${round(y1)}`,
        `${round(centerX + bottomW / 2)},${round(y2)}`,
        `${round(centerX - bottomW / 2)},${round(y2)}`,
      ].join(' ')
      const mid = y1 + stageH / 2
      const fill = stageColor(index)
      return `<g class="deck-funnel-stage deck-funnel-stage-${index % 6}">
    <polygon class="deck-funnel-segment" points="${points}" style="fill:${fill}"></polygon>
    <polygon class="deck-funnel-sheen" points="${points}"></polygon>
    <rect class="deck-funnel-key-swatch" x="${keyX}" y="${round(mid - 7)}" width="13" height="13" rx="3" style="fill:${fill}"></rect>
    <text class="deck-funnel-key-name" x="${keyX + 22}" y="${round(mid - 1)}">${escapeHtml(stage.label)}</text>
    <text class="deck-funnel-key-value" x="${keyX + 22}" y="${round(mid + 15)}">${escapeHtml(`${formatNumber(stage.value)}${funnel.unit} · ${stage.rate}`)}</text>
  </g>`
    })
    .join('\n  ')

  return `<svg class="deck-funnel-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(funnel.title || 'Funnel chart')}">
  <defs>
    <linearGradient id="deck-funnel-sheen-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <style>
    .deck-funnel-segment { stroke: ${color('surface')}; stroke-width: 2; }
    .deck-funnel-sheen { fill: url(#deck-funnel-sheen-grad); pointer-events: none; }
    .deck-funnel-key-name { fill: ${color('heading')}; font: 600 14px "Poppins", "Aptos", sans-serif; }
    .deck-funnel-key-value { fill: ${color('muted')}; font: 500 12.5px "Poppins", "Aptos", sans-serif; }
  </style>
  ${segments}
</svg>`
}

function funnelStages(funnel, options = {}) {
  const maxValue = Math.max(...funnel.values, 1)
  const maxWidth = options.maxWidth ?? 610
  const minWidth = options.minWidth ?? 126
  const widths = funnel.values.map((value) => {
    if (value <= 0) return minWidth
    return Math.max(minWidth, (value / maxValue) * maxWidth)
  })

  return funnel.labels.map((label, index) => {
    const value = funnel.values[index] ?? 0
    const previous = index === 0 ? value : funnel.values[index - 1] || 0
    const rate = index === 0 || previous <= 0
      ? '100%'
      : `${Math.round((value / previous) * 100)}%`
    return {
      label,
      value,
      rate,
      topWidth: widths[index],
      bottomWidth: widths[index + 1] ?? Math.max(minWidth, widths[index] * 0.78),
    }
  })
}

function round(value) {
  return Math.round(value * 10) / 10
}

function cssColor(value, fallback) {
  const raw = String(value || fallback || '').trim()
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`
  return fallback
}
