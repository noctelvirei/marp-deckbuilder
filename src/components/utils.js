export function splitCsv(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;')
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return ''
  return Number.isInteger(value)
    ? value.toLocaleString('en-GB')
    : value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}
