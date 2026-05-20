import * as cheerio from 'cheerio'

export function compileDeckComponents(source) {
  const root = cheerio.load(`<root>${source}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  const components = []

  root('deck-stat-grid').each((_, element) => {
    const grid = root(element)
    const stats = []
    grid.find('deck-stat').each((__, statElement) => {
      const stat = root(statElement)
      const value = stat.attr('value') || cleanText(stat.find('value').text())
      const label = stat.attr('label') || cleanText(stat.find('label').text() || stat.text())
      if (value || label) stats.push({ value, label })
    })

    components.push({ type: 'stat-grid', stats })

    const html = `<div class="stat-grid">${stats
      .map(
        (stat) => `<div class="stat-card">
  <strong>${escapeHtml(stat.value)}</strong>
  <span>${escapeHtml(stat.label)}</span>
</div>`,
      )
      .join('\n')}</div>`
    grid.replaceWith(html)
  })

  root('deck-card-grid').each((_, element) => {
    const grid = root(element)
    const columns = Number.parseInt(grid.attr('columns') || '3', 10)
    const cards = []

    grid.find('deck-card').each((__, cardElement) => {
      const card = root(cardElement)
      const header = card.attr('title') || card.attr('header') || cleanText(card.find('h2,h3').first().text())
      const body = cleanText(card.find('p').first().text() || card.text())
      if (header || body) cards.push({ header, body })
    })

    components.push({ type: 'card-grid', columns, cards })

    const className = columns === 4 ? 'four' : 'three'
    const html = `<div class="card-grid ${className}">${cards
      .map(
        (card) => `<article>
  <h2>${escapeHtml(card.header)}</h2>
  <p>${escapeHtml(card.body)}</p>
</article>`,
      )
      .join('\n')}</div>`
    grid.replaceWith(html)
  })

  root('deck-chart').each((_, element) => {
    const chart = root(element)
    const model = parseChart(chart)
    components.push(model)
    chart.replaceWith(renderChartHtml(model))
  })

  root('deck-comparison').each((_, element) => {
    const comparison = root(element)
    const model = parseComparison(root, comparison)
    components.push(model)
    comparison.replaceWith(renderComparisonHtml(model))
  })

  root('deck-swimlane').each((_, element) => {
    const swimlane = root(element)
    const model = parseSwimlane(root, swimlane)
    components.push(model)
    swimlane.replaceWith(renderSwimlaneHtml(model))
  })

  root('deck-proof').each((_, element) => {
    const proof = root(element)
    const model = parseProof(root, proof)
    components.push(model)
    proof.replaceWith(renderProofHtml(model))
  })

  root('deck-next-steps').each((_, element) => {
    const nextSteps = root(element)
    const model = parseNextSteps(root, nextSteps)
    components.push(model)
    nextSteps.replaceWith(renderNextStepsHtml(model))
  })

  root('deck-logo-wall').each((_, element) => {
    const logoWall = root(element)
    const model = parseLogoWall(root, logoWall)
    components.push(model)
    logoWall.replaceWith(renderLogoWallHtml(model))
  })

  root('deck-divider').each((_, element) => {
    const divider = root(element)
    const model = {
      type: 'divider',
      act: divider.attr('act') || divider.attr('label') || '',
      title: divider.attr('title') || cleanText(divider.find('h1').first().text()),
      subtitle: divider.attr('subtitle') || cleanText(divider.find('p').first().text()),
    }
    components.push(model)
    divider.replaceWith(renderDividerHtml(model))
  })

  root('deck-close').each((_, element) => {
    const close = root(element)
    const model = {
      type: 'close',
      title: close.attr('title') || cleanText(close.find('h1').first().text()) || 'Thank you',
      name: close.attr('name') || '',
      role: close.attr('role') || '',
    }
    components.push(model)
    close.replaceWith(renderCloseHtml(model))
  })

  root('deck-takeaway').each((_, element) => {
    const takeaway = root(element)
    const text = cleanText(takeaway.attr('text') || takeaway.text())
    components.push({ type: 'takeaway', text })
    takeaway.replaceWith(`<div class="takeaway">${escapeHtml(text)}</div>`)
  })

  return {
    source: root('root').html() || source,
    components,
  }
}

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

export function parseComparison(root, comparison) {
  const leftTitle = comparison.attr('left-title') || comparison.attr('left') || 'Option A'
  const rightTitle = comparison.attr('right-title') || comparison.attr('right') || 'Option B'
  const rows = []

  comparison.find('deck-row').each((_, rowElement) => {
    const row = root(rowElement)
    const label = row.attr('label') || row.attr('title') || cleanText(row.find('label').text())
    const left = row.attr('left') || cleanText(row.find('left').text())
    const right = row.attr('right') || cleanText(row.find('right').text())
    if (label || left || right) rows.push({ label, left, right })
  })

  return { type: 'comparison', leftTitle, rightTitle, rows }
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

export function renderChartHtml(chart) {
  const max = Math.max(...chart.values, 1)
  const rows = chart.labels
    .map((label, index) => {
      const value = chart.values[index] ?? 0
      const width = Math.max(3, Math.round((value / max) * 100))
      return `<div class="deck-chart-row">
  <span class="deck-chart-label">${escapeHtml(label)}</span>
  <span class="deck-chart-track"><span class="deck-chart-fill" style="width:${width}%"></span></span>
  <strong>${escapeHtml(formatNumber(value))}</strong>
</div>`
    })
    .join('\n')

  return `<figure class="deck-chart deck-chart-${chart.chartType}">
  ${chart.title ? `<figcaption>${escapeHtml(chart.title)}</figcaption>` : ''}
  <div class="deck-chart-rows">${rows}</div>
</figure>`
}

export function renderComparisonHtml(comparison) {
  const rows = comparison.rows
    .map(
      (row) => `<tr>
  <th>${escapeHtml(row.label)}</th>
  <td class="negative">${escapeHtml(row.left)}</td>
  <td class="positive">${escapeHtml(row.right)}</td>
</tr>`,
    )
    .join('\n')

  return `<table class="deck-comparison">
  <thead><tr><th></th><th>${escapeHtml(comparison.leftTitle)}</th><th>${escapeHtml(comparison.rightTitle)}</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`
}

export function renderSwimlaneHtml(swimlane) {
  return `<div class="deck-swimlane">${swimlane.lanes
    .map(
      (lane) => `<section class="deck-lane deck-lane-${escapeAttr(lane.color)}">
  <h2>${escapeHtml(lane.title)}</h2>
  <div class="deck-lane-steps">${lane.steps
    .map(
      (step) => `<article>
    <h3>${escapeHtml(step.title)}</h3>
    ${step.body ? `<p>${escapeHtml(step.body)}</p>` : ''}
  </article>`,
    )
    .join('<span class="deck-arrow">&gt;</span>')}</div>
</section>`,
    )
    .join('\n')}</div>`
}

export function renderProofHtml(proof) {
  const stats = proof.stats
    .map(
      (stat) => `<div class="stat-card">
  <strong>${escapeHtml(stat.value)}</strong>
  <span>${escapeHtml(stat.label)}</span>
</div>`,
    )
    .join('\n')

  return `<div class="deck-proof">
  ${proof.logo || proof.logoName ? `<div class="deck-proof-logo">${proof.logo ? `<img src="${escapeAttr(proof.logo)}" alt="${escapeAttr(proof.logoName)}">` : escapeHtml(proof.logoName)}</div>` : ''}
  <div class="stat-grid">${stats}</div>
  ${proof.context ? `<p class="deck-proof-context">${escapeHtml(proof.context)}</p>` : ''}
  ${proof.bridge ? `<p class="deck-proof-bridge">${escapeHtml(proof.bridge)}</p>` : ''}
  ${proof.source ? `<p class="deck-proof-source">${escapeHtml(proof.source)}</p>` : ''}
</div>`
}

export function renderNextStepsHtml(nextSteps) {
  return `<ol class="deck-next-steps">${nextSteps.steps
    .map(
      (step) => `<li>
  <strong>${escapeHtml(step.title)}</strong>
  <span>${escapeHtml(step.body)}</span>
</li>`,
    )
    .join('\n')}</ol>`
}

export function renderLogoWallHtml(logoWall) {
  return `<div class="deck-logo-wall">
  ${logoWall.title ? `<h2>${escapeHtml(logoWall.title)}</h2>` : ''}
  <div class="deck-logo-grid">${logoWall.logos
    .map(
      (logo) => `<div class="deck-logo-tile">${logo.image ? `<img src="${escapeAttr(logo.image)}" alt="${escapeAttr(logo.name)}">` : `<span>${escapeHtml(logo.name)}</span>`}</div>`,
    )
    .join('\n')}</div>
</div>`
}

export function renderDividerHtml(divider) {
  return `<div class="deck-divider">
  ${divider.act ? `<p class="eyebrow">${escapeHtml(divider.act)}</p>` : ''}
  <h1>${escapeHtml(divider.title)}</h1>
  ${divider.subtitle ? `<p>${escapeHtml(divider.subtitle)}</p>` : ''}
</div>`
}

export function renderCloseHtml(close) {
  return `<div class="deck-close">
  <h1>${escapeHtml(close.title)}</h1>
  ${close.name ? `<p><strong>${escapeHtml(close.name)}</strong>${close.role ? `<br><span>${escapeHtml(close.role)}</span>` : ''}</p>` : ''}
</div>`
}

function normalizeChartType(value) {
  if (value === 'line') return 'line'
  if (value === 'column') return 'bar'
  return 'bar'
}

function splitCsv(value = '') {
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;')
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(value)
}
