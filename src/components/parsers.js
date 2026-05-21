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

function normalizeChartType(value) {
  if (value === 'line') return 'line'
  if (value === 'column') return 'bar'
  return 'bar'
}
