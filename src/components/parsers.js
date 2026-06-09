import { cleanText, firstMatch, splitCsv } from './utils.js'

export function parseChart(chart) {
  const labels = splitCsv(chart.attr('labels'))
  const values = splitCsv(chart.attr('values')).map(Number)
  const title = chart.attr('title') || ''
  const series = chart.attr('series') || title || 'Series 1'
  const type = normalizeChartType(chart.attr('type') || 'bar')

  return {
    type: 'chart',
    chartType: type,
    title,
    series,
    labels,
    values,
  }
}

export function parseVisual(visual) {
  const html = visual.html() || ''
  const svg = firstMatch(html, /(<svg\b[\s\S]*?<\/svg>)/i)
  const titleAttr = visual.attr('title') || ''
  const title = titleAttr || cleanText(visual.find('h2,h3,figcaption').first().text())
  const caption = visual.attr('caption') || ''
  const fallback = visual.attr('fallback') || cleanText(visual.find('p').first().text() || visual.text())

  return {
    type: 'visual',
    title,
    showTitle: Boolean(titleAttr),
    caption,
    alt: visual.attr('alt') || title || fallback,
    svg,
    html: html.trim(),
    fallback,
  }
}

export function parseComparison(root, comparison) {
  const columns = splitCsv(comparison.attr('columns'))
  const leftTitle = comparison.attr('left-title') || comparison.attr('left') || columns[0] || 'Option A'
  const rightTitle =
    comparison.attr('right-title') || comparison.attr('right') || columns[1] || 'Option B'
  const rows = []

  comparison.find('deck-row').each((_, rowElement) => {
    const row = root(rowElement)
    const label = row.attr('label') || row.attr('title') || cleanText(row.find('label').text())
    const left = row.attr('left') || cleanText(row.find('left').text())
    const right = row.attr('right') || cleanText(row.find('right').text())
    if (label || left || right) rows.push({ label, left, right })
  })

  rows.push(...parseInlineComparisonRows(comparison.attr('rows')))

  return { type: 'comparison', leftTitle, rightTitle, rows }
}

function parseInlineComparisonRows(value = '') {
  return String(value || '')
    .split(';')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const cells = row.split('|').map(cleanText)
      if (cells.length === 2) return { label: '', left: cells[0], right: cells[1] }
      return {
        label: cells[0] || '',
        left: cells[1] || '',
        right: cells.slice(2).join(' | '),
      }
    })
    .filter((row) => row.label || row.left || row.right)
}

export function parseSwimlane(root, swimlane) {
  const lanes = []

  swimlane.find('deck-lane').each((_, laneElement) => {
    const lane = root(laneElement)
    const steps = []
    lane.find('deck-step').each((__, stepElement) => {
      const step = root(stepElement)
      const title = step.attr('title') || cleanText(step.find('h3,h4').first().text())
      const body = cleanText(step.find('p').first().text() || step.text())
      if (title || body) steps.push({ title, body })
    })
    lanes.push({
      title: lane.attr('title') || lane.attr('label') || `Lane ${lanes.length + 1}`,
      color: lane.attr('color') || (lanes.length === 0 ? 'blue' : 'purple'),
      steps,
    })
  })

  return { type: 'swimlane', lanes }
}

export function parseProof(root, proof) {
  const stats = []
  proof.find('deck-stat').each((_, statElement) => {
    const stat = root(statElement)
    const value = stat.attr('value') || cleanText(stat.find('value').text())
    const label = stat.attr('label') || cleanText(stat.find('label').text() || stat.text())
    if (value || label) stats.push({ value, label })
  })

  return {
    type: 'proof',
    stats,
    context: cleanText(proof.find('p').first().text()),
    bridge: proof.attr('bridge') || cleanText(proof.find('bridge').text()),
    source: proof.attr('source') || cleanText(proof.find('source').text()),
    logo: proof.attr('logo') || '',
    logoName: proof.attr('logo-name') || proof.attr('customer') || '',
  }
}

export function parseNextSteps(root, nextSteps) {
  const steps = []
  nextSteps.find('deck-step').each((_, stepElement) => {
    const step = root(stepElement)
    const title = step.attr('title') || cleanText(step.find('h3,h4').first().text())
    const body = cleanText(step.find('p').first().text() || step.text())
    if (title || body) steps.push({ title, body })
  })
  return { type: 'next-steps', steps }
}

export function parseLogoWall(root, logoWall) {
  const logos = []
  logoWall.find('deck-logo').each((_, logoElement) => {
    const logo = root(logoElement)
    const name = logo.attr('name') || cleanText(logo.text())
    const image = logo.attr('image') || logo.attr('src') || ''
    if (name || image) logos.push({ name, image })
  })

  return {
    type: 'logo-wall',
    title: logoWall.attr('title') || '',
    logos,
  }
}

export function parseExecTitle(execTitle) {
  return {
    type: 'exec-title',
    surface: normalizeSurface(execTitle.attr('surface')),
    eyebrow: execTitle.attr('eyebrow') || execTitle.attr('kicker') || '',
    title: execTitle.attr('title') || cleanText(execTitle.find('h1').first().text()),
    subtitle: execTitle.attr('subtitle') || cleanText(execTitle.find('p').first().text()),
    accent: normalizeAccent(execTitle.attr('accent') || 'pink'),
  }
}

export function parseExecRows(root, execRows) {
  const rows = []
  execRows.find('deck-exec-row').each((_, rowElement) => {
    const row = root(rowElement)
    const title = row.attr('title') || cleanText(row.find('h3,h4').first().text())
    const body = row.attr('body') || cleanText(row.find('p').first().text() || row.text())
    if (title || body) {
      rows.push({
        label: row.attr('label') || String(rows.length + 1).padStart(2, '0'),
        kicker: row.attr('kicker') || row.attr('eyebrow') || '',
        title,
        body,
        note: row.attr('note') || '',
        accent: normalizeAccent(row.attr('accent') || (rows.length === 0 ? 'yellow' : 'blue')),
      })
    }
  })

  const side = parseExecSideCallout(execRows)

  return {
    type: 'exec-rows',
    surface: normalizeSurface(execRows.attr('surface')),
    rows,
    side,
    takeaway: execRows.attr('takeaway') || '',
    takeawayAccent: normalizeAccent(execRows.attr('takeaway-accent') || side?.accent || 'blue'),
  }
}

export function parseExecCards(root, execCards) {
  const cards = []
  execCards.find('deck-exec-card').each((_, cardElement) => {
    const card = root(cardElement)
    const title = card.attr('title') || cleanText(card.find('h3,h4').first().text())
    const body = card.attr('body') || cleanText(card.find('p').first().text() || card.text())
    const metric = card.attr('metric') || card.attr('value') || ''
    if (title || body || metric) {
      cards.push({
        label: card.attr('label') || String(cards.length + 1).padStart(2, '0'),
        title,
        metric,
        subtitle: card.attr('subtitle') || card.attr('label-text') || '',
        body,
        accent: normalizeAccent(card.attr('accent') || (cards.length === 0 ? 'blue' : 'blue')),
      })
    }
  })

  return {
    type: 'exec-cards',
    surface: normalizeSurface(execCards.attr('surface')),
    columns: clampInt(execCards.attr('columns'), 2, 4, 3),
    variant: execCards.attr('variant') || 'cards',
    cards,
    intro: execCards.attr('intro') || '',
    loopCaption: execCards.attr('loop-caption') || '',
    target: execCards.attr('target') || '',
    targetAccent: normalizeAccent(execCards.attr('target-accent') || 'yellow'),
    takeaway: execCards.attr('takeaway') || '',
    takeawayAccent: normalizeAccent(execCards.attr('takeaway-accent') || 'yellow'),
  }
}

export function parseExecTimeline(root, execTimeline) {
  const items = []
  execTimeline.find('deck-exec-milestone').each((_, itemElement) => {
    const item = root(itemElement)
    const year = item.attr('year') || item.attr('label') || ''
    const title = item.attr('title') || cleanText(item.find('h3,h4').first().text())
    const body = item.attr('body') || cleanText(item.find('p').first().text() || item.text())
    if (year || title || body) {
      items.push({
        year,
        title,
        body,
        accent: normalizeAccent(item.attr('accent') || (items.length === 2 ? 'yellow' : 'blue')),
      })
    }
  })

  return {
    type: 'exec-timeline',
    surface: normalizeSurface(execTimeline.attr('surface')),
    items,
    takeaway: execTimeline.attr('takeaway') || '',
    takeawayAccent: normalizeAccent(execTimeline.attr('takeaway-accent') || 'yellow'),
  }
}

export function parseExecMetrics(root, execMetrics) {
  const metrics = []
  execMetrics.find('deck-exec-metric').each((_, metricElement) => {
    const metric = root(metricElement)
    const value = metric.attr('value') || cleanText(metric.find('value,strong').first().text())
    const label = metric.attr('label') || cleanText(metric.find('label,span').first().text() || metric.text())
    if (value || label) {
      metrics.push({
        value,
        label,
        accent: normalizeAccent(metric.attr('accent') || (metrics.length === 2 ? 'yellow' : 'blue')),
      })
    }
  })

  const panels = []
  execMetrics.find('deck-exec-panel').each((_, panelElement) => {
    const panel = root(panelElement)
    const title = panel.attr('title') || cleanText(panel.find('h3,h4').first().text())
    const body = panel.attr('body') || cleanText(panel.find('p').first().text() || panel.text())
    const value = panel.attr('value') || panel.attr('metric') || ''
    if (title || body || value) {
      panels.push({
        value,
        title,
        body,
        note: panel.attr('note') || '',
        accent: normalizeAccent(panel.attr('accent') || (panels.length === 1 ? 'yellow' : 'blue')),
      })
    }
  })

  return {
    type: 'exec-metrics',
    surface: normalizeSurface(execMetrics.attr('surface')),
    metrics,
    panels,
    sectionTitle: execMetrics.attr('section-title') || '',
    takeaway: execMetrics.attr('takeaway') || '',
    takeawayAccent: normalizeAccent(execMetrics.attr('takeaway-accent') || 'blue'),
  }
}

function parseExecSideCallout(execRows) {
  const hasSide =
    execRows.attr('side-title') ||
    execRows.attr('side-value') ||
    execRows.attr('side-body')
  if (!hasSide) return null
  return {
    title: execRows.attr('side-title') || '',
    value: execRows.attr('side-value') || '',
    body: execRows.attr('side-body') || '',
    accent: normalizeAccent(execRows.attr('side-accent') || 'yellow'),
  }
}

function normalizeAccent(value = 'blue') {
  const token = String(value || 'blue').trim()
  const aliases = {
    lightblue: 'lightBlue',
    cyan: 'lightBlue',
    pink: 'red',
    magenta: 'red',
  }
  return aliases[token.toLowerCase()] || token
}

function normalizeSurface(value = '') {
  const token = String(value || '').trim().toLowerCase()
  if (token === 'light' || token === 'white') return 'light'
  if (token === 'dark' || token === 'navy' || token === 'black') return 'dark'
  return ''
}

function clampInt(value, min, max, fallback) {
  const numeric = Number.parseInt(value || fallback, 10)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, numeric))
}

function normalizeChartType(value) {
  if (value === 'line') return 'line'
  if (value === 'column') return 'bar'
  return 'bar'
}
