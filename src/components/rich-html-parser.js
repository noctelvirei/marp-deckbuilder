import { cleanText, splitCsv } from './utils.js'
import { richHtmlTypeForTag } from './rich-html-definitions.js'
import {
  colorToken,
  normalizeComparisonValue,
  number,
  numberAttr,
  numbers,
} from './rich-html-format.js'

export function parseRichHtmlComponent(root, element, context = {}) {
  const tagName = element.tagName?.toLowerCase()
  const type = richHtmlTypeForTag(tagName)
  if (!type) return null

  const node = root(element)
  const base = {
    type,
    rich: true,
    sourceTag: tagName,
    id: stableId(type, context),
    eyebrow: attrOrText(node, 'eyebrow', root, 'eyebrow'),
    title: attrOrText(node, 'title', root, 'h1,h2,title'),
    subtitle: attrOrText(node, 'subtitle', root, 'p,subtitle'),
    surface: node.attr('surface') || 'dark',
  }

  switch (type) {
    case 'rich-cover':
      return {
        ...base,
        title: base.title || 'The Future of Rich HTML Experiences',
        highlight: node.attr('highlight') || 'Rich HTML',
        badge: attrOrText(node, 'badge', root, 'badge') || '',
      }
    case 'rich-agenda':
      return {
        ...base,
        title: base.title || 'Agenda',
        count: node.attr('count') || '',
        countLabel: node.attr('count-label') || node.attr('label') || '',
        items: richItems(root, node),
      }
    case 'rich-stats':
      return {
        ...base,
        metrics: richMetrics(root, node, [
          { value: '99.9', unit: '%', label: 'Platform Uptime', sub: '12-month rolling average', progress: 99.9, color: 'blue' },
          { value: '127', unit: 'k', label: 'Daily Active Users', sub: 'Peak Q4 2025', progress: 85, color: 'cyan' },
          { value: '2.8', unit: 's', label: 'Avg. Completion Time', sub: 'Customer journey end-to-end', progress: 70, color: 'green' },
        ]),
      }
    case 'rich-bars':
      return parseBars(root, node, base)
    case 'rich-line':
      return parseLine(root, node, base)
    case 'rich-donut':
      return parseDonut(root, node, base)
    case 'magazine-book':
      return parseMagazineBook(root, node, base)
    case 'rich-timeline':
      return {
        ...base,
        milestones: richMilestones(root, node),
      }
    case 'tilt-cards':
    case 'glass-cards':
    case 'stagger-grid':
      return {
        ...base,
        cards: richCards(root, node),
      }
    case 'typewriter':
      return {
        ...base,
        phrases: richPhrases(root, node),
      }
    case 'particle-network':
      return {
        ...base,
        tag: attrOrText(node, 'tag', root, 'tag') || '',
      }
    case 'neon-title':
      return {
        ...base,
        title: base.title || cleanText(node.text()) || 'lightico',
        effects: richItems(root, node),
      }
    case 'radar-chart':
      return parseRadar(root, node, base)
    case 'comparison-reveal':
      return parseComparisonReveal(root, node, base)
    case 'gauge':
      return parseGauge(root, node, base)
    case 'reveal-stack':
      return {
        ...base,
        line1: node.attr('line1') || base.title || 'No more',
        line2: node.attr('line2') || '',
        accent: node.attr('accent') || '',
        body: node.attr('body') || base.subtitle || '',
      }
    case 'rich-close':
      return {
        ...base,
        title: base.title || 'This is just the beginning.',
        button: node.attr('button') || '',
      }
    default:
      return base
  }
}

function parseBars(root, node, base) {
  const labels = splitCsv(node.attr('labels') || 'Q1,Q2,Q3,Q4')
  const series = richSeries(root, node, [
    { name: 'Platform', values: [65, 72, 68, 85], color: 'blue' },
    { name: 'Mobile', values: [40, 55, 62, 74], color: 'cyan' },
    { name: 'Integration', values: [30, 38, 52, 61], color: 'purple' },
  ])
  return { ...base, labels, series }
}

function parseLine(root, node, base) {
  const labels = splitCsv(node.attr('labels') || 'Jan,Feb,Mar,Apr,May')
  const series = richSeries(root, node, [
    { name: 'Engagement Rate', values: [48, 55, 60, 67, 72], color: 'blue' },
    { name: 'Completion Rate', values: [30, 36, 40, 46, 53], color: 'cyan' },
    { name: 'NPS Score', values: [13, 18, 22, 26, 31], color: 'green' },
  ])
  return { ...base, labels, series, max: numberAttr(node, 'max', 100) }
}

function parseDonut(root, node, base) {
  const segments = richSegments(root, node, [
    { label: 'Digital Onboarding', value: 45, color: 'blue' },
    { label: 'Mobile Banking', value: 25, color: 'cyan' },
    { label: 'Branch Assisted', value: 20, color: 'orange' },
    { label: 'Partner API', value: 10, color: 'green' },
  ])
  return {
    ...base,
    total: node.attr('total') || '486',
    totalLabel: node.attr('total-label') || 'Total Sessions',
    segments,
  }
}

function parseMagazineBook(root, node, base) {
  const pages = []
  node.find('deck-magazine-page').each((_, pageElement) => {
    const page = root(pageElement)
    pages.push({
      icon: page.attr('icon') || '',
      title: page.attr('title') || cleanText(page.find('h3,h4').first().text()),
      body: page.attr('body') || cleanText(page.find('p').first().text() || page.text()),
      number: page.attr('number') || '',
    })
  })

  return {
    ...base,
    chapter: node.attr('chapter') || 'Chapter 1 - The Story',
    quote: node.attr('quote') || 'Every customer journey is a page waiting to be turned.',
    quoteEmphasis: node.attr('quote-emphasis') || 'page',
    footer: node.attr('footer') || 'Turn the pages on the right',
    hint: node.attr('hint') || 'click the right page to turn',
    pages: pages.length ? pages : [
      { icon: '01', title: 'Speed to Value', body: 'Deploy in days, not months. Integrate with the existing stack without rebuilding what works.', number: 'Page 1 of 4' },
      { icon: '02', title: 'Zero Friction', body: 'No app download. Customers complete complex journeys from any device, anywhere, in minutes.', number: 'Page 2 of 4' },
      { icon: '03', title: 'Real-time Insights', body: 'Every session generates structured data so teams can see where customers drop off.', number: 'Page 3 of 4' },
      { icon: '04', title: 'Built for Enterprise', body: 'Enterprise-grade security with the UX of a consumer product.', number: 'Page 4 of 4' },
    ],
  }
}

function parseRadar(root, node, base) {
  const axes = []
  node.find('deck-rich-axis').each((_, axisElement) => {
    const axis = root(axisElement)
    const label = axis.attr('label') || cleanText(axis.text())
    const value = numberAttr(axis, 'value', 0)
    const baseline = numberAttr(axis, 'baseline', Math.max(0, value - 18))
    if (label) axes.push({ label, value, baseline, color: colorToken(axis.attr('color'), axes.length) })
  })
  return {
    ...base,
    axes: axes.length ? axes : [
      { label: 'Speed', value: 92, baseline: 70, color: 'blue' },
      { label: 'Accuracy', value: 88, baseline: 75, color: 'cyan' },
      { label: 'Scale', value: 95, baseline: 60, color: 'green' },
      { label: 'Security', value: 98, baseline: 80, color: 'orange' },
      { label: 'UX Score', value: 91, baseline: 72, color: 'purple' },
      { label: 'Integration', value: 85, baseline: 65, color: 'red' },
    ],
  }
}

function parseComparisonReveal(root, node, base) {
  const columns = []
  node.find('deck-rich-column').each((_, colElement) => {
    const col = root(colElement)
    const label = col.attr('label') || col.attr('title') || cleanText(col.text())
    if (label) columns.push(label)
  })
  if (columns.length === 0) columns.push(...splitCsv(node.attr('columns') || 'Legacy Portal,Competitor,Lightico'))

  const rows = []
  node.find('deck-rich-row').each((_, rowElement) => {
    const row = root(rowElement)
    const feature = row.attr('feature') || row.attr('label') || cleanText(row.find('label').text())
    const values = splitCsv(row.attr('values')).map(normalizeComparisonValue)
    if (feature) {
      rows.push({
        feature,
        values: columns.map((_, index) => values[index] || normalizeComparisonValue(row.attr(`value-${index + 1}`))),
      })
    }
  })

  return { ...base, columns, rows }
}

function parseGauge(root, node, base) {
  return {
    ...base,
    value: numberAttr(node, 'value', 87),
    label: node.attr('label') || 'CSAT Score',
    sub: node.attr('sub') || node.attr('subtitle') || 'Customer Satisfaction',
    metrics: richMetrics(root, node, [
      { value: '94', unit: '%', label: 'Response Rate', progress: 94, color: 'blue' },
      { value: '87', unit: '%', label: 'First Contact Resolution', progress: 87, color: 'cyan' },
      { value: '91', unit: '%', label: 'Digital Completion Rate', progress: 91, color: 'green' },
      { value: '78', unit: '%', label: 'Agent Productivity Gain', progress: 78, color: 'orange' },
      { value: '63', unit: '%', label: 'Repeat Contact Reduction', progress: 63, color: 'purple' },
    ]),
  }
}

function richItems(root, node) {
  const items = []
  node.find('deck-rich-item').each((_, itemElement) => {
    const item = root(itemElement)
    const label = item.attr('label') || item.attr('title') || cleanText(item.text())
    if (label) {
      items.push({
        label,
        sub: item.attr('sub') || item.attr('subtitle') || '',
        color: colorToken(item.attr('color'), items.length),
      })
    }
  })
  return items
}

function richMetrics(root, node, fallback = []) {
  const metrics = []
  node.find('deck-rich-metric').each((_, metricElement) => {
    const metric = root(metricElement)
    const value = metric.attr('value') || cleanText(metric.find('value,strong').first().text())
    const label = metric.attr('label') || cleanText(metric.find('label,span').first().text() || metric.text())
    if (value || label) {
      metrics.push({
        value,
        unit: metric.attr('unit') || '',
        label,
        sub: metric.attr('sub') || metric.attr('subtitle') || '',
        progress: numberAttr(metric, 'progress', number(value, 0)),
        color: colorToken(metric.attr('color'), metrics.length),
      })
    }
  })
  return metrics.length ? metrics : fallback
}

function richSeries(root, node, fallback = []) {
  const series = []
  node.find('deck-rich-series').each((_, seriesElement) => {
    const item = root(seriesElement)
    const name = item.attr('name') || item.attr('label') || cleanText(item.text())
    const values = numbers(item.attr('values'))
    if (name && values.length) {
      series.push({ name, values, color: colorToken(item.attr('color'), series.length) })
    }
  })
  return series.length ? series : fallback
}

function richSegments(root, node, fallback = []) {
  const segments = []
  node.find('deck-rich-segment').each((_, segmentElement) => {
    const segment = root(segmentElement)
    const label = segment.attr('label') || segment.attr('name') || cleanText(segment.text())
    const value = numberAttr(segment, 'value', 0)
    if (label && value > 0) {
      segments.push({ label, value, color: colorToken(segment.attr('color'), segments.length) })
    }
  })
  return segments.length ? segments : fallback
}

function richMilestones(root, node) {
  const milestones = []
  node.find('deck-rich-milestone').each((_, milestoneElement) => {
    const item = root(milestoneElement)
    const year = item.attr('year') || item.attr('label') || ''
    const title = item.attr('title') || cleanText(item.find('h3,h4').first().text())
    const body = item.attr('body') || cleanText(item.find('p').first().text() || item.text())
    if (year || title || body) milestones.push({ year, title, body, color: colorToken(item.attr('color'), milestones.length) })
  })
  return milestones
}

function richCards(root, node) {
  const cards = []
  node.find('deck-rich-card').each((_, cardElement) => {
    const card = root(cardElement)
    const title = card.attr('title') || cleanText(card.find('h3,h4').first().text())
    const body = card.attr('body') || cleanText(card.find('p').first().text() || card.text())
    if (title || body) {
      cards.push({
        icon: card.attr('icon') || '',
        title,
        body,
        tag: card.attr('tag') || '',
        stat: card.attr('stat') || '',
      })
    }
  })
  return cards
}

function richPhrases(root, node) {
  const phrases = []
  node.find('deck-rich-phrase').each((_, phraseElement) => {
    const phrase = root(phraseElement)
    const text = phrase.attr('text') || cleanText(phrase.text())
    if (text) phrases.push(text)
  })
  return phrases
}

function attrOrText(node, attr, root, selector) {
  const value = node.attr(attr)
  if (value) return value
  const child = node.find(selector).first()
  return child.length ? cleanText(child.text()) : ''
}

function stableId(type, context) {
  return `deck-rich-${type}-${context.slideNumber || 'x'}-${context.ordinal || 0}`.replace(/[^a-z0-9_-]/gi, '-')
}
