import { cleanText, escapeAttr, escapeHtml, splitCsv } from './utils.js'

const richTagTypes = new Map([
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

const colorTokens = ['blue', 'cyan', 'purple', 'green', 'orange', 'red', 'yellow']

export function parseRichHtmlComponent(root, element, context = {}) {
  const tagName = element.tagName?.toLowerCase()
  const type = richTagTypes.get(tagName)
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

export function renderRichHtml(model) {
  switch (model.type) {
    case 'rich-cover':
      return renderRichCover(model)
    case 'rich-agenda':
      return renderRichAgenda(model)
    case 'rich-stats':
      return renderRichStats(model)
    case 'rich-bars':
      return renderRichBars(model)
    case 'rich-line':
      return renderRichLine(model)
    case 'rich-donut':
      return renderRichDonut(model)
    case 'magazine-book':
      return renderMagazineBook(model)
    case 'rich-timeline':
      return renderRichTimeline(model)
    case 'tilt-cards':
      return renderCardGrid(model, 'deck-tilt-cards tilt-grid', 'tc', 'data-deck-rich-tilt-cards')
    case 'typewriter':
      return renderTypewriter(model)
    case 'particle-network':
      return renderParticleNetwork(model)
    case 'neon-title':
      return renderNeonTitle(model)
    case 'glass-cards':
      return renderGlassCards(model)
    case 'radar-chart':
      return renderRadar(model)
    case 'stagger-grid':
      return renderCardGrid(model, 'deck-stagger-grid feat-grid', 'fc', 'data-deck-rich-stagger-grid')
    case 'comparison-reveal':
      return renderComparisonReveal(model)
    case 'gauge':
      return renderGauge(model)
    case 'reveal-stack':
      return renderRevealStack(model)
    case 'rich-close':
      return renderRichClose(model)
    default:
      return ''
  }
}

export function isRichHtmlComponent(component) {
  return Boolean(component?.rich)
}

export function richHtmlLayout(component) {
  if (!component?.rich) return ''
  if (component.type === 'rich-cover') return 'rich-cover'
  if (component.type === 'rich-close') return 'rich-close'
  return 'rich-html'
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

function renderFrame(model, attrs, body) {
  return `<div class="deck-rich deck-rich-${escapeAttr(model.type)}" data-deck-rich ${attrs}>
  ${model.eyebrow ? `<div class="s-eyebrow">${escapeHtml(model.eyebrow)}</div>` : ''}
  ${model.title ? `<div class="s-title">${richTitle(model.title)}</div>` : ''}
  ${body}
</div>`
}

function renderRichCover(model) {
  return `<div class="deck-rich deck-rich-cover" data-deck-rich data-deck-rich-cover>
  <canvas class="deck-rich-canvas" aria-hidden="true"></canvas>
  ${model.eyebrow ? `<div class="s1-eye">${escapeHtml(model.eyebrow)}</div>` : ''}
  <h1 class="s1-h1">${highlightTitle(model.title, model.highlight)}</h1>
  ${model.subtitle ? `<p class="s1-sub">${escapeHtml(model.subtitle)}</p>` : ''}
  ${model.badge ? `<div class="s1-badge">${escapeHtml(model.badge)}</div>` : ''}
</div>`
}

function renderRichAgenda(model) {
  const count = model.count || String(model.items.length || 0)
  const items = model.items.map((item) => `<li>${escapeHtml(item.label)}</li>`).join('')
  return renderFrame(model, 'data-deck-rich-agenda', `<div class="ag-grid">
    <div><div class="ag-big">${escapeHtml(count)}</div><div class="ag-t">${breakText(model.countLabel || 'Slides of Pure CSS')}</div></div>
    <ol class="ag-ol">${items}</ol>
  </div>`)
}

function renderRichStats(model) {
  const metrics = model.metrics.map((metric) => {
    const progress = clamp(number(metric.progress, 0), 0, 100) / 100
    const value = number(metric.value, 0)
    return `<div class="ring-item">
      <div class="ring-c">
        <svg viewBox="0 0 180 180"><circle class="ring-bg" cx="90" cy="90" r="80"></circle><circle class="ring-f" cx="90" cy="90" r="80" stroke="${cssVar(metric.color)}" data-progress="${progress}" data-value="${escapeAttr(value)}" data-decimals="${decimals(metric.value)}"></circle></svg>
        <div class="ring-mid"><div class="ring-val" data-count-target="${escapeAttr(value)}" data-decimals="${decimals(metric.value)}">0</div><div class="ring-unit">${escapeHtml(metric.unit)}</div></div>
      </div>
      <div class="ring-lbl">${escapeHtml(metric.label)}</div>
      ${metric.sub ? `<div class="ring-sub">${escapeHtml(metric.sub)}</div>` : ''}
    </div>`
  }).join('')
  return renderFrame(model, 'data-deck-rich-stats', `<div class="rings">${metrics}</div>`)
}

function renderRichBars(model) {
  const groups = model.labels.map((label, labelIndex) => {
    const bars = model.series.map((series, seriesIndex) => {
      const height = clamp(number(series.values[labelIndex], 0), 0, 100)
      const delay = (0.1 + (labelIndex + seriesIndex) * 0.1).toFixed(1)
      return `<div class="bar" style="height:${height}%;background:${cssVar(series.color)};transition-delay:${delay}s"></div>`
    }).join('')
    return `<div class="bgrp"><div class="bgrp-bars">${bars}</div><div class="bgrp-lbl">${escapeHtml(label)}</div></div>`
  }).join('')
  const legend = model.series.map((series) => `<div class="bc-leg"><div class="bc-leg-dot" style="background:${cssVar(series.color)}"></div>${escapeHtml(series.name)}</div>`).join('')
  return renderFrame(model, 'data-deck-rich-bars', `<div class="bc-wrap">
    <div class="bc-gl" style="bottom:calc(36px + 75%)"></div>
    <div class="bc-gl" style="bottom:calc(36px + 50%)"></div>
    <div class="bc-gl" style="bottom:calc(36px + 25%)"></div>
    ${groups}
  </div><div class="bc-legend">${legend}</div>`)
}

function renderRichLine(model) {
  const chart = lineChartGeometry(model.labels, model.series, model.max)
  const yLabels = [0, 25, 50, 75].map((label) => {
    const y = chart.yFor(label)
    return `<text x="70" y="${y + 4}" font-family="Poppins,sans-serif" font-size="11" fill="#8B9AB5" text-anchor="end">${label}</text>`
  }).join('')
  const xLabels = model.labels.map((label, index) => `<text x="${chart.xFor(index)}" y="360" font-family="Poppins,sans-serif" font-size="11" fill="#8B9AB5" text-anchor="middle">${escapeHtml(label)}</text>`).join('')
  const areas = chart.series.slice(0, 2).map((series) => `<path class="lc-area" d="${series.area}" fill="${cssVar(series.color)}"></path>`).join('')
  const paths = chart.series.map((series) => `<path class="lc-path" d="${series.path}" stroke="${cssVar(series.color)}"></path>`).join('')
  const dots = chart.series.flatMap((series) => series.points.map((point) => `<circle class="lc-dot" cx="${point.x}" cy="${point.y}" r="5" fill="${cssVar(series.color)}"></circle>`)).join('')
  const legend = model.series.map((series) => `<div class="lc-li"><div class="lc-ld" style="background:${cssVar(series.color)}"></div>${escapeHtml(series.name)}</div>`).join('')
  return renderFrame(model, 'data-deck-rich-line', `<div class="lc-wrap"><svg viewBox="0 0 1100 400" preserveAspectRatio="xMidYMid meet">
    <line class="lc-grid" x1="80" y1="20" x2="80" y2="340"></line>
    <line class="lc-grid" x1="80" y1="340" x2="1080" y2="340"></line>
    <line class="lc-grid" x1="80" y1="255" x2="1080" y2="255" stroke-dasharray="4 4"></line>
    <line class="lc-grid" x1="80" y1="170" x2="1080" y2="170" stroke-dasharray="4 4"></line>
    <line class="lc-grid" x1="80" y1="85" x2="1080" y2="85" stroke-dasharray="4 4"></line>
    ${yLabels}${xLabels}${areas}${paths}${dots}
  </svg></div><div class="lc-legend">${legend}</div>`)
}

function renderRichDonut(model) {
  const segments = model.segments.map((segment) => `<circle class="dn-seg" cx="150" cy="150" r="110" stroke="${cssVar(segment.color)}" data-value="${escapeAttr(segment.value)}"></circle>`).join('')
  const rows = model.segments.map((segment) => `<div class="dn-row"><div class="dn-dot" style="background:${cssVar(segment.color)}"></div>
    <div class="dn-info"><div class="dn-name">${escapeHtml(segment.label)}</div><div class="dn-pct">${escapeHtml(segment.value)}%</div>
    <div class="dn-bar"><div class="dn-bf" style="background:${cssVar(segment.color)}" data-w="${escapeAttr(segment.value)}%"></div></div></div></div>`).join('')
  return renderFrame(model, 'data-deck-rich-donut', `<div class="dn-layout">
    <div class="dn-wrap"><svg class="dn-svg" viewBox="0 0 300 300">
      <circle cx="150" cy="150" r="110" fill="none" stroke="var(--border)" stroke-width="44"></circle>${segments}
    </svg><div class="dn-mid"><div class="dn-tot" data-count-target="${escapeAttr(model.total)}">0</div><div class="dn-tsub">${escapeHtml(model.totalLabel)}</div></div></div>
    <div class="dn-leg">${rows}</div>
  </div>`)
}

function renderMagazineBook(model) {
  const pageSheets = []
  for (let index = 0; index < model.pages.length; index += 2) {
    const front = model.pages[index]
    const back = model.pages[index + 1] || {}
    pageSheets.push(`<div class="mag-page">
      ${renderBookFace(front, 'mfront')}
      ${renderBookFace(back, 'mback')}
    </div>`)
  }
  const printCards = model.pages.map((page, index) => `<div class="bp-cell"><div class="bp-label">Page ${index + 1}</div><div class="bp-card${index % 2 ? ' alt' : ''}">${renderBookFaceInner(page)}</div></div>`).join('')
  return renderFrame(model, 'data-deck-rich-book', `<div class="book-scene"><div class="book">
    <div class="mag-cover"><div class="mag-chapter">${escapeHtml(model.chapter)}</div><div class="mag-cover-body"><div class="mag-quote">${highlightTitle(model.quote, model.quoteEmphasis)}</div></div><div class="mag-cover-foot">${escapeHtml(model.footer)}</div></div>
    ${pageSheets.join('')}
  </div></div>
  <div class="book-print">${printCards}</div>
  <div class="flip-hint">${escapeHtml(model.hint)}</div>`)
}

function renderRichTimeline(model) {
  const nodes = model.milestones.map((item, index) => `<div class="tl-n" style="--deck-rich-node-color:${cssVar(item.color)}"><div class="tl-dot"></div><div class="tl-yr">${escapeHtml(item.year)}</div><div class="tl-tit">${escapeHtml(item.title)}</div><div class="tl-bod">${escapeHtml(item.body)}</div></div>`).join('')
  return renderFrame(model, 'data-deck-rich-timeline', `<div class="tl"><div class="tl-track"><div class="tl-prog"></div></div><div class="tl-nodes">${nodes}</div></div>`)
}

function renderCardGrid(model, gridClass, cardClass, dataAttr) {
  const cards = model.cards.map((card, index) => `<div class="${cardClass}" style="transition-delay:${(0.05 + index * 0.05).toFixed(2)}s">
    ${card.icon ? `<div class="${cardClass}-ico">${escapeHtml(card.icon)}</div>` : ''}
    <div class="${cardClass}-tit">${escapeHtml(card.title)}</div>
    <div class="${cardClass}-bod">${escapeHtml(card.body)}</div>
    ${card.tag ? `<div class="${cardClass}-tag">${escapeHtml(card.tag)}</div>` : ''}
    ${card.stat ? `<div class="${cardClass}-stat">${escapeHtml(card.stat)}</div>` : ''}
  </div>`).join('')
  return renderFrame(model, dataAttr, `<div class="${gridClass}">${cards}</div>`)
}

function renderTypewriter(model) {
  const phrases = model.phrases.length ? model.phrases : [
    'Static presentations are history.',
    'CSS is the most powerful design tool in the browser.',
    'Rich HTML means animations, data, and interaction.',
    'Every customer journey deserves this quality of experience.',
  ]
  const dots = phrases.map((_, index) => `<div class="tw-d${index === 0 ? ' on' : ''}"></div>`).join('')
  const print = phrases.map((phrase) => `<div class="tw-pl">${escapeHtml(phrase)}</div>`).join('')
  return `<div class="deck-rich deck-typewriter" data-deck-rich data-deck-rich-typewriter>
  ${model.eyebrow ? `<div class="tw-eye">${escapeHtml(model.eyebrow)}</div>` : ''}
  <div class="tw-out"><span class="tw-txt"></span><span class="tw-cur"></span></div>
  <div class="tw-dots">${dots}</div>
  <div class="tw-print">${print}</div>
</div>`
}

function renderParticleNetwork(model) {
  return `<div class="deck-rich deck-particle-network" data-deck-rich data-deck-rich-particles>
  <canvas class="deck-rich-canvas" aria-hidden="true"></canvas>
  <div class="p11-ov">
    <div class="p11-h">${escapeHtml(model.title || 'Connected Experiences')}</div>
    ${model.subtitle ? `<p class="p11-sub">${escapeHtml(model.subtitle)}</p>` : ''}
    ${model.tag ? `<div class="p11-tag">${escapeHtml(model.tag)}</div>` : ''}
  </div>
</div>`
}

function renderNeonTitle(model) {
  const effects = (model.effects.length ? model.effects : [
    { label: 'text-shadow', sub: 'Multi-layer blur', color: 'blue' },
    { label: 'box-shadow', sub: 'Inner + outer glow', color: 'cyan' },
    { label: 'animation', sub: 'Flicker keyframes', color: 'green' },
    { label: 'filter', sub: 'drop-shadow()', color: 'purple' },
  ]).map((item) => `<div class="nb ${escapeAttr(item.color || 'blue')}">${escapeHtml(item.label)}${item.sub ? `<br><small>${escapeHtml(item.sub)}</small>` : ''}</div>`).join('')
  return `<div class="deck-rich deck-neon-title" data-deck-rich data-deck-rich-neon>
  <div class="neon-t">${escapeHtml(model.title)}</div>
  ${model.subtitle ? `<div class="neon-s">${escapeHtml(model.subtitle)}</div>` : ''}
  <div class="neon-grid">${effects}</div>
</div>`
}

function renderGlassCards(model) {
  return `<div class="deck-rich deck-glass-cards" data-deck-rich data-deck-rich-glass-cards>
  <div class="gl-blob gl-b1"></div><div class="gl-blob gl-b2"></div><div class="gl-blob gl-b3"></div>
  ${model.eyebrow ? `<div class="s-eyebrow">${escapeHtml(model.eyebrow)}</div>` : ''}
  ${model.title ? `<div class="s-title">${richTitle(model.title)}</div>` : ''}
  <div class="gl-grid">${model.cards.map((card) => `<div class="gc">
    ${card.icon ? `<div class="gc-ico">${escapeHtml(card.icon)}</div>` : ''}
    <div class="gc-tit">${escapeHtml(card.title)}</div>
    <div class="gc-bod">${escapeHtml(card.body)}</div>
    ${card.stat ? `<div class="gc-stat">${escapeHtml(card.stat)}</div>` : ''}
  </div>`).join('')}</div>
</div>`
}

function renderRadar(model) {
  const labels = model.axes.map((axis) => axis.label)
  const values = model.axes.map((axis) => axis.value)
  const baseline = model.axes.map((axis) => axis.baseline)
  const stats = model.axes.map((axis) => `<div class="rs-row"><div class="rs-lbl">${escapeHtml(axis.label)}</div><div class="rs-bw"><div class="rs-bf" style="background:${cssVar(axis.color)}" data-v="${escapeAttr(axis.value)}"></div></div><div class="rs-val">${escapeHtml(axis.value)}</div></div>`).join('')
  return renderFrame(model, `data-deck-rich-radar data-labels="${escapeAttr(JSON.stringify(labels))}" data-values="${escapeAttr(JSON.stringify(values))}" data-baseline="${escapeAttr(JSON.stringify(baseline))}"`, `<div class="rad-layout">
    <div class="rad-wrap"><svg class="rad-svg" viewBox="0 0 380 380"><g class="radar-grid"></g><g class="radar-axes"></g><polygon class="r-p2" points=""></polygon><polygon class="r-p1" points=""></polygon><g class="radar-dots"></g><g class="radar-labels"></g></svg></div>
    <div class="rad-stats">${stats}</div>
  </div>`)
}

function renderComparisonReveal(model) {
  const header = `<div class="cmp-hdr" style="grid-template-columns:2fr repeat(${model.columns.length},1fr)"><div>Capability</div>${model.columns.map((col) => `<div>${escapeHtml(col)}</div>`).join('')}</div>`
  const rows = model.rows.map((row) => `<div class="cmp-row" style="grid-template-columns:2fr repeat(${model.columns.length},1fr)"><div class="cmp-feat">${escapeHtml(row.feature)}</div>${row.values.map((value) => `<div class="cmp-cell"><span class="ck ${comparisonClass(value)}">${comparisonLabel(value)}</span></div>`).join('')}</div>`).join('')
  return renderFrame(model, 'data-deck-rich-comparison', `<div class="cmp-wrap">${header}${rows}</div>`)
}

function renderGauge(model) {
  const metrics = model.metrics.map((metric) => `<div class="gm"><div class="gm-top">${escapeHtml(metric.label)} <span>${escapeHtml(metric.value)}${escapeHtml(metric.unit)}</span></div><div class="gm-bg"><div class="gm-f" style="background:${cssVar(metric.color)}" data-v="${escapeAttr(metric.progress || metric.value)}"></div></div></div>`).join('')
  const gradientId = `${model.id}-gfg`
  return renderFrame(model, `data-deck-rich-gauge data-value="${escapeAttr(model.value)}"`, `<div class="gauge-layout">
    <div class="gw"><svg class="g-svg" viewBox="0 0 340 200"><defs><linearGradient id="${escapeAttr(gradientId)}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#5143D5"></stop><stop offset="40%" stop-color="#0F82F5"></stop><stop offset="100%" stop-color="#66CC8E"></stop></linearGradient></defs>
      <path class="g-track" d="M 50,160 A 120,120 0 0 1 290,160" stroke="var(--border)"></path>
      <path class="g-fill" d="M 50,160 A 120,120 0 0 1 290,160" stroke="url(#${escapeAttr(gradientId)})"></path>
      <g class="g-needle"><line x1="170" y1="160" x2="170" y2="58" stroke="var(--white)" stroke-width="2.5" stroke-linecap="round"></line><circle cx="170" cy="160" r="7" fill="var(--blue)"></circle><circle cx="170" cy="160" r="3" fill="var(--white)"></circle></g>
      <text class="g-val" x="170" y="118">0</text><text class="g-lbl" x="170" y="165">${escapeHtml(model.label)}</text>
      <text font-family="Poppins,sans-serif" font-size="11" fill="#8B9AB5" x="45" y="182">0</text><text font-family="Poppins,sans-serif" font-size="11" fill="#8B9AB5" x="283" y="182">100</text>
    </svg><div class="g-sub">${escapeHtml(model.sub)}</div></div><div class="g-met">${metrics}</div>
  </div>`)
}

function renderRevealStack(model) {
  return `<div class="deck-rich deck-reveal-stack" data-deck-rich data-deck-rich-reveal>
  <div class="rl xl"><span class="rt">${escapeHtml(model.line1)}</span></div>
  ${model.line2 ? `<div class="rl xl"><span class="rt">${escapeHtml(model.line2)}</span></div>` : ''}
  <div class="rev-hr"></div>
  ${model.accent ? `<div class="rl ac"><span class="rt">${escapeHtml(model.accent)}</span></div>` : ''}
  ${model.body ? `<div class="rl md"><span class="rt">${escapeHtml(model.body)}</span></div>` : ''}
</div>`
}

function renderRichClose(model) {
  return `<div class="deck-rich deck-rich-close" data-deck-rich data-deck-rich-close>
  <canvas class="deck-rich-canvas" aria-hidden="true"></canvas>
  <div class="cl-content">
    <h1 class="cl-h1">${breakText(model.title)}</h1>
    ${model.subtitle ? `<p class="cl-sub">${breakText(model.subtitle)}</p>` : ''}
    ${model.button ? `<button class="cl-btn" type="button" data-deck-rich-restart>${escapeHtml(model.button)}</button>` : ''}
  </div>
</div>`
}

function renderBookFace(page, className) {
  return `<div class="mface ${className}">${renderBookFaceInner(page)}</div>`
}

function renderBookFaceInner(page = {}) {
  return `${page.icon ? `<div class="m-ico">${escapeHtml(page.icon)}</div>` : ''}
  <div class="m-tit">${escapeHtml(page.title || '')}</div>
  <div class="m-bod">${escapeHtml(page.body || '')}</div>
  ${page.number ? `<div class="m-num">${escapeHtml(page.number)}</div>` : ''}`
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

function lineChartGeometry(labels, series, max = 100) {
  const x0 = 180
  const xStep = labels.length > 1 ? 800 / (labels.length - 1) : 0
  const yFor = (value) => Math.round(340 - (clamp(number(value, 0), 0, max) / max) * 320)
  const xFor = (index) => Math.round(x0 + index * xStep)
  return {
    xFor,
    yFor,
    series: series.map((item) => {
      const points = item.values.map((value, index) => ({ x: xFor(index), y: yFor(value) }))
      const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
      const area = `${path} L${points.at(-1)?.x || x0},340 L${points[0]?.x || x0},340 Z`
      return { ...item, points, path, area }
    }),
  }
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

function colorToken(value, index = 0) {
  const token = String(value || '').trim().toLowerCase()
  if (colorTokens.includes(token)) return token
  if (token === 'lightblue') return 'cyan'
  return colorTokens[index % colorTokens.length]
}

function cssVar(token) {
  return `var(--${escapeAttr(colorToken(token))})`
}

function richTitle(value) {
  const parts = String(value || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= 1) return escapeHtml(value)
  return `${escapeHtml(parts[0])} <span>${escapeHtml(parts.slice(1).join(' '))}</span>`
}

function highlightTitle(title, highlight) {
  const safe = escapeHtml(title).replace(/\s*\|\s*/g, '<br>')
  const target = escapeHtml(highlight)
  if (!target || !safe.includes(target)) return safe
  return safe.replace(target, `<em>${target}</em>`)
}

function breakText(value) {
  return escapeHtml(value).replace(/\s*\|\s*/g, '<br>').replace(/\\n/g, '<br>')
}

function normalizeComparisonValue(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (['yes', 'true', 'y', '1', 'check', 'ok'].includes(token)) return 'yes'
  if (['partial', 'part', 'maybe', '~'].includes(token)) return 'partial'
  if (['no', 'false', 'n', '0', 'x'].includes(token)) return 'no'
  return token || 'no'
}

function comparisonClass(value) {
  if (value === 'yes') return 'y'
  if (value === 'partial') return 'p'
  return 'n'
}

function comparisonLabel(value) {
  if (value === 'yes') return '&#10003;'
  if (value === 'partial') return '~'
  return '&#10007;'
}

function numberAttr(node, attr, fallback = 0) {
  return number(node.attr(attr), fallback)
}

function numbers(value = '') {
  return splitCsv(value).map((item) => number(item, Number.NaN)).filter(Number.isFinite)
}

function number(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function decimals(value) {
  const match = String(value || '').match(/\.(\d+)/)
  return match ? Math.min(match[1].length, 2) : 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
