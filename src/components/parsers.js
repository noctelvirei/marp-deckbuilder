import { cleanText, splitCsv } from './utils.js'

export function parseChart(chart) {
  const title = chart.attr('title') || ''
  const type = normalizeChartType(chart.attr('type') || 'bar')
  const seriesAttribute = chart.attr('series') || ''
  const areaPoints = type === 'area' ? parseAreaPointRows(chart.attr('points') || chart.attr('data')) : []
  const bubblePoints = type === 'bubble' ? parseBubblePointRows(chart.attr('points') || chart.attr('data')) : []
  const links = parseChartLinks(chart.attr('links') || chart.attr('flows') || chart.attr('edges') || '')
  const labels = splitCsv(chart.attr('labels'))
  const valuesAttribute = splitCsv(chart.attr('values'))
  const targets = splitCsv(chart.attr('targets') || chart.attr('target-values') || chart.attr('target')).map(Number)
  const binCount = Number.parseInt(chart.attr('bins') || chart.attr('bucket-count') || chart.attr('buckets') || '10', 10)
  const chartLabels = type === 'area' && labels.length === 0 ? areaPoints.map((point) => point.x) : labels
  const points = type === 'scatter'
    ? parsePointRows(chart.attr('points'))
    : type === 'bubble'
      ? bubblePoints
      : areaPoints
  const isMultiSeriesBar = type === 'grouped-bar' || type === 'stacked-bar'
  const seriesNames = isMultiSeriesBar ? splitCsv(seriesAttribute) : []
  const matrix = type === 'boxplot'
    ? parseObservationMatrix(chart.attr('values') || chart.attr('matrix') || chart.attr('series-values'))
    : isMultiSeriesBar
      ? parseNumberMatrix(chart.attr('values'))
      : []
  const values = isMultiSeriesBar || type === 'scatter' || type === 'bubble' || type === 'boxplot'
    ? []
    : valuesAttribute.length
      ? valuesAttribute.map(Number)
      : areaPoints.map((point) => point.y)
  const series = isMultiSeriesBar ? seriesAttribute : seriesAttribute || title || 'Series 1'

  return {
    type: 'chart',
    chartType: type,
    title,
    series,
    seriesNames,
    labels: chartLabels,
    values,
    targets,
    binCount,
    matrix,
    points,
    links,
    xAxisLabel: chart.attr('x-axis') || chart.attr('x-label') || '',
    yAxisLabel: chart.attr('y-axis') || chart.attr('y-label') || '',
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

export function parseSlideMeta(slide) {
  const directives = {}
  for (const attr of [
    'layout',
    'title',
    'subtitle',
    'eyebrow',
    'takeaway',
    'footnote',
    'surface',
    'mode',
    'html',
    'pptx',
    'html-skip',
    'pptx-skip',
    'html-only',
    'pptx-only',
  ]) {
    const value = slide.attr(attr)
    if (value !== undefined) directives[attr] = value
  }

  return {
    type: 'slide',
    directives,
    companyLogo: logoFromAttrs(slide, 'company'),
    customerLogo: logoFromAttrs(slide, 'customer'),
  }
}

export function parseSignalBars(signalBars) {
  return {
    type: 'signal-bars',
    metric: signalBars.attr('metric') || '',
    metricLabel: signalBars.attr('metric-label') || '',
    title: signalBars.attr('title') || '',
    subtitle: signalBars.attr('subtitle') || '',
    labels: splitCsv(signalBars.attr('labels')),
    values: splitCsv(signalBars.attr('values')).map(Number),
    unit: signalBars.attr('unit') || '',
    accent: normalizeAccent(signalBars.attr('accent') || 'blue'),
  }
}

export function parseSignalBoard(signalBoard) {
  return {
    type: 'signal-board',
    title: signalBoard.attr('title') || cleanText(signalBoard.find('h2,h3,h4').first().text()),
    body: signalBoard.attr('body') || cleanText(signalBoard.find('p').first().text() || signalBoard.text()),
    tags: splitCsv(signalBoard.attr('tags')),
    chartTitle: signalBoard.attr('chart-title') || signalBoard.attr('chart') || 'Signal strength',
    labels: splitCsv(signalBoard.attr('labels')),
    values: splitCsv(signalBoard.attr('values')).map(Number),
    unit: signalBoard.attr('unit') || '',
    accent: normalizeAccent(signalBoard.attr('accent') || 'blue'),
  }
}

export function parseFunnel(funnel) {
  return {
    type: 'funnel',
    title: funnel.attr('title') || '',
    labels: splitCsv(funnel.attr('labels')),
    values: splitCsv(funnel.attr('values')).map(Number),
    unit: funnel.attr('unit') || '',
    accent: normalizeAccent(funnel.attr('accent') || 'blue'),
  }
}

export function parseMetricTrend(metricTrend) {
  return {
    type: 'metric-trend',
    metric: metricTrend.attr('metric') || '',
    metricLabel: metricTrend.attr('metric-label') || '',
    title: metricTrend.attr('title') || '',
    labels: splitCsv(metricTrend.attr('labels')),
    values: splitCsv(metricTrend.attr('values')).map(Number),
    unit: metricTrend.attr('unit') || '',
    accent: normalizeAccent(metricTrend.attr('accent') || 'blue'),
  }
}

export function parseHeatmap(heatmap) {
  return {
    type: 'heatmap',
    title: heatmap.attr('title') || '',
    xLabels: splitCsv(heatmap.attr('x-labels') || heatmap.attr('columns')),
    yLabels: splitCsv(heatmap.attr('y-labels') || heatmap.attr('rows')),
    values: parseNumberMatrix(heatmap.attr('values')),
    unit: heatmap.attr('unit') || '',
    caption: heatmap.attr('caption') || '',
    accent: normalizeAccent(heatmap.attr('accent') || 'blue'),
  }
}

export function parseTreemap(treemap) {
  const labels = splitCsv(treemap.attr('labels'))
  const values = splitCsv(treemap.attr('values')).map(Number)
  return {
    type: 'treemap',
    title: treemap.attr('title') || '',
    labels,
    values,
    unit: treemap.attr('unit') || '',
    caption: treemap.attr('caption') || '',
    accent: normalizeAccent(treemap.attr('accent') || 'blue'),
  }
}

export function parseJourneyMap(root, journeyMap) {
  const steps = []
  journeyMap.find('deck-journey-step').each((_, stepElement) => {
    const step = root(stepElement)
    const title = step.attr('title') || cleanText(step.find('h3,h4').first().text())
    const body = step.attr('body') || cleanText(step.find('p').first().text() || step.text())
    if (title || body) {
      steps.push({
        label: step.attr('label') || String(steps.length + 1).padStart(2, '0'),
        title,
        body,
        accent: normalizeAccent(step.attr('accent') || (steps.length === 0 ? 'blue' : 'blue')),
      })
    }
  })

  return {
    type: 'journey-map',
    title: journeyMap.attr('title') || '',
    steps,
  }
}

export function parseJourneyPath(journeyPath) {
  return {
    type: 'journey-path',
    title: journeyPath.attr('title') || journeyPath.attr('chart-title') || 'Journey path',
    metric: journeyPath.attr('metric') || '',
    metricLabel: journeyPath.attr('metric-label') || journeyPath.attr('metric-body') || '',
    labels: splitCsv(journeyPath.attr('labels')),
    notes: splitCsv(journeyPath.attr('notes')),
    hotspots: splitCsv(journeyPath.attr('hotspots')),
    calloutTitle: journeyPath.attr('callout-title') || '',
    calloutBody: journeyPath.attr('callout-body') || '',
    accent: normalizeAccent(journeyPath.attr('accent') || 'blue'),
  }
}

export function parseImpactRadar(impactRadar) {
  const labels = splitCsv(impactRadar.attr('labels'))
  const values = splitCsv(impactRadar.attr('values')).map(Number)
  const radarValues = splitCsv(impactRadar.attr('radar-values') || impactRadar.attr('radar') || '')

  return {
    type: 'impact-radar',
    title: impactRadar.attr('title') || '',
    barTitle: impactRadar.attr('bar-title') || impactRadar.attr('title') || 'Workstream impact',
    radarTitle: impactRadar.attr('radar-title') || 'Operating balance',
    labels,
    values,
    radarValues: radarValues.length ? radarValues.map(Number) : values,
    unit: impactRadar.attr('unit') || '',
    caption: impactRadar.attr('caption') || '',
    accent: normalizeAccent(impactRadar.attr('accent') || 'blue'),
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

function logoFromAttrs(element, prefix) {
  const src = element.attr(`${prefix}-logo`) || ''
  if (!src) return null
  return {
    src,
    alt: element.attr(`${prefix}-alt`) || element.attr(`${prefix}-name`) || `${prefix} logo`,
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

function parseNumberMatrix(value = '') {
  return String(value || '')
    .split(';')
    .map((row) => splitCsv(row).map(Number))
    .filter((row) => row.length > 0)
}

function parseObservationMatrix(value = '') {
  return String(value || '')
    .split(';')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split('|').map((cell) => Number(cell.trim())))
}

function parsePointRows(value = '') {
  return String(value || '')
    .split(';')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [x = '', y = '', label = ''] = row.split('|').map(cleanText)
      return { x: Number(x), y: Number(y), label }
    })
}

function parseBubblePointRows(value = '') {
  return String(value || '')
    .split(/[;,]/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const separator = row.includes('|') ? '|' : ':'
      const [x = '', y = '', r = '', label = ''] = row.split(separator).map(cleanText)
      return { x: parseStrictNumber(x), y: parseStrictNumber(y), r: parseStrictNumber(r), label }
    })
}

function parseChartLinks(value = '') {
  return splitCsv(value).map((item) => {
    const match = String(item || '').match(/^(.+?)(?:->|=>|>)(.+?)(?::|=)(.+)$/)
    if (!match) {
      return {
        source: '',
        target: '',
        value: Number.NaN,
      }
    }
    return {
      source: cleanText(match[1]),
      target: cleanText(match[2]),
      value: Number(String(match[3] || '').trim().replace(/,/g, '')),
    }
  })
}

function parseStrictNumber(value) {
  const text = String(value ?? '').trim()
  return text === '' ? Number.NaN : Number(text)
}

function parseAreaPointRows(value = '') {
  return String(value || '')
    .split(/[;,]/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const separator = row.includes('|') ? '|' : row.includes('=') ? '=' : ':'
      const [x = '', y = ''] = row.split(separator).map(cleanText)
      return { x, y: Number(y) }
    })
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
  const token = String(value || 'bar').trim().toLowerCase()
  if (token === 'line') return 'line'
  if (token === 'area-chart' || token === 'filled-line') return 'area'
  if (token === 'waterfall' || token === 'waterfall-chart') return 'waterfall'
  if (token === 'bullet' || token === 'bullet-chart') return 'bullet'
  if (token === 'bubble' || token === 'bubble-chart') return 'bubble'
  if (token === 'histogram' || token === 'distribution') return 'histogram'
  if (token === 'boxplot' || token === 'box-plot') return 'boxplot'
  if (token === 'pareto' || token === 'pareto-chart') return 'pareto'
  if (token === 'sankey' || token === 'sankey-flow') return 'sankey'
  if (token === 'donut') return 'doughnut'
  if (token === 'scatterplot' || token === 'xy') return 'scatter'
  if (token === 'column') return 'bar'
  if (token === 'grouped' || token === 'clustered' || token === 'clustered-bar' || token === 'clustered-column') {
    return 'grouped-bar'
  }
  if (token === 'stacked' || token === 'stacked-column') return 'stacked-bar'
  return token || 'bar'
}
