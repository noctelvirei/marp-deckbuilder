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

const STAGE_OPACITY = [1, 0.86, 0.72, 0.6, 0.5, 0.42]

export function renderFunnelSvg(funnel, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = {
    ...DEFAULT_COLORS[mode],
    accent: cssColor(options.accentColor, DEFAULT_COLORS[mode].accent),
    onAccent: cssColor(options.onAccentColor, DEFAULT_COLORS[mode].onAccent),
  }
  const color = (name) => useVariables ? `var(--deck-funnel-${name}, ${colors[name]})` : colors[name]
  const stages = funnelStages(funnel)
  const width = 760
  const height = 318
  const centerX = 380
  const topY = 24
  const gap = 7
  const stageH = (height - topY - 24 - gap * Math.max(0, stages.length - 1)) / Math.max(1, stages.length)

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
      const textY = y1 + stageH / 2
      const opacity = STAGE_OPACITY[index] ?? STAGE_OPACITY.at(-1)
      return `<g class="deck-funnel-stage deck-funnel-stage-${index % 6}">
    <polygon class="deck-funnel-segment" points="${points}" style="opacity:${opacity}"></polygon>
    <text class="deck-funnel-stage-label" x="${centerX}" y="${round(textY - 6)}" text-anchor="middle">${escapeHtml(stage.label)}</text>
    <text class="deck-funnel-stage-value" x="${centerX}" y="${round(textY + 20)}" text-anchor="middle">${escapeHtml(`${formatNumber(stage.value)}${funnel.unit}`)}</text>
    <text class="deck-funnel-stage-rate" x="${round(centerX + topW / 2 + 24)}" y="${round(textY + 5)}">${escapeHtml(stage.rate)}</text>
  </g>`
    })
    .join('\n  ')

  return `<svg class="deck-funnel-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(funnel.title || 'Funnel chart')}">
  <style>
    .deck-funnel-segment { fill: ${color('accent')}; stroke: ${color('surface')}; stroke-width: 2; }
    .deck-funnel-stage-label { fill: ${color('onAccent')}; font: 600 17px "Poppins", "Aptos", sans-serif; }
    .deck-funnel-stage-value { fill: ${color('onAccent')}; font: 500 14px "Poppins", "Aptos", sans-serif; opacity: .9; }
    .deck-funnel-stage-rate { fill: ${color('muted')}; font: 500 13px "Poppins", "Aptos", sans-serif; }
  </style>
  ${segments}
</svg>`
}

function funnelStages(funnel) {
  const maxValue = Math.max(...funnel.values, 1)
  const maxWidth = 610
  const minWidth = 126
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
