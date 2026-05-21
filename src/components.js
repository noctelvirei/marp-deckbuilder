import * as cheerio from 'cheerio'

import {
  parseChart,
  parseComparison,
  parseLogoWall,
  parseNextSteps,
  parseProof,
  parseSwimlane,
  parseVisual,
} from './components/parsers.js'
import {
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderLogoWallHtml,
  renderNextStepsHtml,
  renderProofHtml,
  renderSwimlaneHtml,
  renderVisualHtml,
} from './components/renderers.js'
import { cleanText, escapeHtml } from './components/utils.js'

export {
  parseChart,
  parseComparison,
  parseLogoWall,
  parseNextSteps,
  parseProof,
  parseSwimlane,
  parseVisual,
  renderChartHtml,
  renderCloseHtml,
  renderComparisonHtml,
  renderDividerHtml,
  renderLogoWallHtml,
  renderNextStepsHtml,
  renderProofHtml,
  renderSwimlaneHtml,
  renderVisualHtml,
}

export function compileDeckComponents(source) {
  const root = cheerio.load(`<root>${source}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  const components = []

  root('deck-stat-grid').each((_, element) => compileStatGrid(root, element, components))
  root('deck-card-grid').each((_, element) => compileCardGrid(root, element, components))
  root('deck-chart').each((_, element) => {
    const chart = root(element)
    const model = parseChart(chart)
    components.push(model)
    chart.replaceWith(renderChartHtml(model))
  })
  root('deck-visual').each((_, element) => {
    const visual = root(element)
    const model = parseVisual(visual)
    components.push(model)
    visual.replaceWith(renderVisualHtml(model))
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
  root('deck-divider').each((_, element) => compileDivider(root, element, components))
  root('deck-close').each((_, element) => compileClose(root, element, components))
  root('deck-takeaway').each((_, element) => compileTakeaway(root, element, components))

  return {
    source: root('root').html() || source,
    components,
  }
}

function compileStatGrid(root, element, components) {
  const grid = root(element)
  const stats = []
  grid.find('deck-stat').each((_, statElement) => {
    const stat = root(statElement)
    const value = stat.attr('value') || cleanText(stat.find('value').text())
    const label = stat.attr('label') || cleanText(stat.find('label').text() || stat.text())
    if (value || label) stats.push({ value, label })
  })

  components.push({ type: 'stat-grid', stats })
  grid.replaceWith(renderStatGridHtml(stats))
}

function compileCardGrid(root, element, components) {
  const grid = root(element)
  const columns = Number.parseInt(grid.attr('columns') || '3', 10)
  const cards = []

  grid.find('deck-card').each((_, cardElement) => {
    const card = root(cardElement)
    const header = card.attr('title') || card.attr('header') || cleanText(card.find('h2,h3').first().text())
    const body = cleanText(card.find('p').first().text() || card.text())
    if (header || body) cards.push({ header, body })
  })

  components.push({ type: 'card-grid', columns, cards })
  grid.replaceWith(renderCardGridHtml(columns, cards))
}

function compileDivider(root, element, components) {
  const divider = root(element)
  const model = {
    type: 'divider',
    act: divider.attr('act') || divider.attr('label') || '',
    title: divider.attr('title') || cleanText(divider.find('h1').first().text()),
    subtitle: divider.attr('subtitle') || cleanText(divider.find('p').first().text()),
  }
  components.push(model)
  divider.replaceWith(renderDividerHtml(model))
}

function compileClose(root, element, components) {
  const close = root(element)
  const model = {
    type: 'close',
    title: close.attr('title') || cleanText(close.find('h1').first().text()) || 'Thank you',
    name: close.attr('name') || '',
    role: close.attr('role') || '',
  }
  components.push(model)
  close.replaceWith(renderCloseHtml(model))
}

function compileTakeaway(root, element, components) {
  const takeaway = root(element)
  const text = cleanText(takeaway.attr('text') || takeaway.text())
  components.push({ type: 'takeaway', text })
  takeaway.replaceWith(`<div class="takeaway">${escapeHtml(text)}</div>`)
}

function renderStatGridHtml(stats) {
  return `<div class="stat-grid">${stats
    .map(
      (stat) => `<div class="stat-card">
  <strong>${escapeHtml(stat.value)}</strong>
  <span>${escapeHtml(stat.label)}</span>
</div>`,
    )
    .join('\n')}</div>`
}

function renderCardGridHtml(columns, cards) {
  const className = columns === 4 ? 'four' : 'three'
  return `<div class="card-grid ${className}">${cards
    .map(
      (card) => `<article>
  <h2>${escapeHtml(card.header)}</h2>
  <p>${escapeHtml(card.body)}</p>
</article>`,
    )
    .join('\n')}</div>`
}
