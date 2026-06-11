import { escapeAttr, escapeHtml } from './utils.js'
import {
  breakText,
  clamp,
  comparisonClass,
  comparisonLabel,
  cssVar,
  decimals,
  highlightTitle,
  number,
  richTitle,
} from './rich-html-format.js'

export { parseRichHtmlComponent } from './rich-html-parser.js'
export { richHtmlLayout, richHtmlParentTags, richHtmlTags } from './rich-html-definitions.js'

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
