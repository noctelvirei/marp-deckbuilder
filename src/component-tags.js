export function expandSelfClosingComponentTags(source, knownTags, prefix) {
  const pattern = new RegExp(`<\\s*(${prefix}-[a-z0-9-]+)\\b([^<>]*?)\\/\\s*>`, 'gi')
  return String(source || '').replace(pattern, (raw, tag, attrs = '') => {
    const normalizedTag = tag.toLowerCase()
    if (!knownTags.has(normalizedTag)) return raw
    return `<${normalizedTag}${attrs}></${normalizedTag}>`
  })
}
