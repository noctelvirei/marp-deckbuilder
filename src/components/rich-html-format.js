import { escapeAttr, escapeHtml, splitCsv } from './utils.js'

const colorTokens = ['blue', 'cyan', 'purple', 'green', 'orange', 'red', 'yellow']

export function colorToken(value, index = 0) {
  const token = String(value || '').trim().toLowerCase()
  if (colorTokens.includes(token)) return token
  if (token === 'lightblue') return 'cyan'
  return colorTokens[index % colorTokens.length]
}

export function cssVar(token) {
  return `var(--${escapeAttr(colorToken(token))})`
}

export function richTitle(value) {
  const parts = String(value || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return escapeHtml(value)
  return `${escapeHtml(parts[0])} <span>${escapeHtml(parts.slice(1).join(' '))}</span>`
}

export function highlightTitle(title, highlight) {
  const safe = escapeHtml(title).replace(/\s*\|\s*/g, '<br>')
  const target = escapeHtml(highlight)
  if (!target || !safe.includes(target)) return safe
  return safe.replace(target, `<em>${target}</em>`)
}

export function breakText(value) {
  return escapeHtml(value).replace(/\s*\|\s*/g, '<br>').replace(/\\n/g, '<br>')
}

export function normalizeComparisonValue(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['yes', 'true', 'y', '1', 'check', 'ok'].includes(token)) return 'yes'
  if (['partial', 'part', 'maybe', '~'].includes(token)) return 'partial'
  if (['no', 'false', 'n', '0', 'x'].includes(token)) return 'no'
  return token || 'no'
}

export function comparisonClass(value) {
  if (value === 'yes') return 'y'
  if (value === 'partial') return 'p'
  return 'n'
}

export function comparisonLabel(value) {
  if (value === 'yes') return '&#10003;'
  if (value === 'partial') return '~'
  return '&#10007;'
}

export function numberAttr(node, attr, fallback = 0) {
  return number(node.attr(attr), fallback)
}

export function numbers(value = '') {
  return splitCsv(value).map((item) => number(item, Number.NaN)).filter(Number.isFinite)
}

export function number(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

export function decimals(value) {
  const match = String(value || '').match(/\.(\d+)/)
  return match ? Math.min(match[1].length, 2) : 0
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
