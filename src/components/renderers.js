import { compactHtmlBlock, escapeAttr, escapeHtml, formatNumber } from './utils.js'

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

export function renderVisualHtml(visual) {
  const body = visual.html
    ? compactHtmlBlock(visual.html)
    : visual.fallback
      ? `<p>${escapeHtml(visual.fallback)}</p>`
      : ''

  return `<figure class="deck-visual">
  ${visual.showTitle ? `<figcaption>${escapeHtml(visual.title)}</figcaption>` : ''}
  <div class="deck-visual-stage">${body}</div>
  ${visual.caption ? `<p class="deck-visual-caption">${escapeHtml(visual.caption)}</p>` : ''}
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
