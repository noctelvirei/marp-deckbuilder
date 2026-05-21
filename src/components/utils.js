export function splitCsv(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function firstMatch(source, pattern) {
  const match = String(source || '').match(pattern)
  return match?.[1] || ''
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
  return Number.isInteger(value) ? String(value) : String(value)
}

export function compactHtmlBlock(value) {
  return String(value || '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .join('\n')
}
