export function splitCsv(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function cleanText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeAttr(value = '') {
  return escapeHtml(value)
}

export function parseDataTableNumber(value) {
  return Number(String(value || '').replace(/,/g, '').replace(/%$/, '').trim())
}

export function formatReportNumber(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value || '')
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(numeric)
}

export function formatReportPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '0%'
  const rounded = (Math.round(numeric * 10) / 10).toFixed(1)
  return `${rounded.replace(/\.0$/, '')}%`
}

export function normalizeHexColor(value = '') {
  const token = String(value || '').trim()
  const hex = token.match(/^#?([0-9a-f]{6})$/i)
  return hex ? `#${hex[1].toUpperCase()}` : ''
}

export function normalizeBadgeVariant(value = 'muted') {
  const token = String(value || 'muted').trim().toLowerCase()
  if (['green', 'success', 'active', 'approved', 'done', 'complete', 'completed', 'pass'].includes(token)) {
    return 'green'
  }
  if (['blue', 'info', 'live', 'new'].includes(token)) return 'blue'
  if (['orange', 'warning', 'warn', 'review', 'watch', 'attention'].includes(token)) return 'orange'
  if (['red', 'danger', 'error', 'blocked', 'fail', 'failed'].includes(token)) return 'red'
  if (['muted', 'neutral', 'pending', 'draft', 'gray', 'grey'].includes(token)) return 'muted'
  return 'muted'
}

export function isKnownBadgeVariant(value = 'muted') {
  const token = String(value || 'muted').trim().toLowerCase()
  return [
    'green',
    'success',
    'active',
    'approved',
    'done',
    'complete',
    'completed',
    'pass',
    'blue',
    'info',
    'live',
    'new',
    'orange',
    'warning',
    'warn',
    'review',
    'watch',
    'attention',
    'red',
    'danger',
    'error',
    'blocked',
    'fail',
    'failed',
    'muted',
    'neutral',
    'pending',
    'draft',
    'gray',
    'grey',
  ].includes(token)
}

export function jsString(value = '') {
  return JSON.stringify(String(value || ''))
}

export function jsValue(value) {
  return JSON.stringify(value)
}
