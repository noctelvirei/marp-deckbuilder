export const richTagTypes = new Map([
  ['deck-rich-cover', 'rich-cover'],
  ['deck-rich-agenda', 'rich-agenda'],
  ['deck-rich-stats', 'rich-stats'],
  ['deck-metric-rings', 'rich-stats'],
  ['deck-rich-bars', 'rich-bars'],
  ['deck-rich-line', 'rich-line'],
  ['deck-rich-donut', 'rich-donut'],
  ['deck-magazine-book', 'magazine-book'],
  ['deck-rich-timeline', 'rich-timeline'],
  ['deck-tilt-cards', 'tilt-cards'],
  ['deck-typewriter', 'typewriter'],
  ['deck-particle-network', 'particle-network'],
  ['deck-neon-title', 'neon-title'],
  ['deck-glass-cards', 'glass-cards'],
  ['deck-radar-chart', 'radar-chart'],
  ['deck-stagger-grid', 'stagger-grid'],
  ['deck-comparison-reveal', 'comparison-reveal'],
  ['deck-gauge', 'gauge'],
  ['deck-reveal-stack', 'reveal-stack'],
  ['deck-rich-close', 'rich-close'],
])

export const richHtmlTags = new Set([
  ...richTagTypes.keys(),
  'deck-rich-item',
  'deck-rich-card',
  'deck-rich-metric',
  'deck-rich-series',
  'deck-rich-segment',
  'deck-rich-milestone',
  'deck-rich-phrase',
  'deck-rich-axis',
  'deck-rich-column',
  'deck-rich-row',
  'deck-magazine-page',
])

export const richHtmlParentTags = new Set(richTagTypes.keys())

export function richHtmlTypeForTag(tagName = '') {
  return richTagTypes.get(String(tagName).toLowerCase()) || ''
}

export function richHtmlLayout(component) {
  if (!component?.rich) return ''
  if (component.type === 'rich-cover') return 'rich-cover'
  if (component.type === 'rich-close') return 'rich-close'
  return 'rich-html'
}
