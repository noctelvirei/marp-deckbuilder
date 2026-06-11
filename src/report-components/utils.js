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

export function jsString(value = '') {
  return JSON.stringify(String(value || ''))
}

export function jsValue(value) {
  return JSON.stringify(value)
}
