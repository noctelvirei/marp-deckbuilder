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
  const laneCount = Math.max(swimlane.lanes.length, 1)
  return `<div class="deck-swimlane deck-swimlane-${laneCount}">${swimlane.lanes
    .map(
      (lane) => `<section class="deck-lane deck-lane-${escapeAttr(lane.color)}">
  <h2>${escapeHtml(lane.title)}</h2>
  <div class="deck-lane-steps deck-lane-steps-${Math.max(lane.steps.length, 1)}">${lane.steps
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

export function renderExecTitleHtml(execTitle) {
  return `<section class="deck-exec deck-exec-title ${surfaceClass(execTitle)} deck-exec-accent-${escapeAttr(execTitle.accent)}">
  ${execTitle.eyebrow ? `<p class="deck-exec-eyebrow">${escapeHtml(execTitle.eyebrow)}</p>` : ''}
  <h1>${escapeHtml(execTitle.title)}</h1>
  ${execTitle.subtitle ? `<p class="deck-exec-subtitle">${escapeHtml(execTitle.subtitle)}</p>` : ''}
</section>`
}

export function renderExecRowsHtml(execRows) {
  const side = execRows.side
    ? `<aside class="deck-exec-side deck-exec-accent-${escapeAttr(execRows.side.accent)}">
    ${execRows.side.title ? `<h3>${escapeHtml(execRows.side.title)}</h3>` : ''}
    ${execRows.side.value ? `<strong>${escapeHtml(execRows.side.value)}</strong>` : ''}
    ${execRows.side.body ? `<p>${escapeHtml(execRows.side.body)}</p>` : ''}
  </aside>`
    : ''

  return `<div class="deck-exec deck-exec-rows ${surfaceClass(execRows)}${side ? ' has-side' : ''}">
  <div class="deck-exec-row-stack">${execRows.rows
    .map(
      (row) => `<article class="deck-exec-row deck-exec-accent-${escapeAttr(row.accent)}">
    <div class="deck-exec-row-label">
      <strong>${escapeHtml(row.label)}</strong>
      ${row.kicker ? `<span>${escapeHtml(row.kicker)}</span>` : ''}
    </div>
    <div class="deck-exec-row-copy">
      <h3>${escapeHtml(row.title)}</h3>
      ${row.body ? `<p>${escapeHtml(row.body)}</p>` : ''}
    </div>
    ${row.note ? `<em>${escapeHtml(row.note)}</em>` : ''}
  </article>`,
    )
    .join('\n')}</div>
  ${side}
  ${renderExecTakeawayHtml(execRows.takeaway, execRows.takeawayAccent)}
</div>`
}

export function renderExecCardsHtml(execCards) {
  return `<div class="deck-exec deck-exec-cards ${surfaceClass(execCards)} deck-exec-cards-${execCards.columns} deck-exec-cards-${escapeAttr(execCards.variant)}">
  ${execCards.intro ? `<p class="deck-exec-intro">${escapeHtml(execCards.intro)}</p>` : ''}
  <div class="deck-exec-card-grid">${execCards.cards
    .map(
      (card) => `<article class="deck-exec-card deck-exec-accent-${escapeAttr(card.accent)}">
    <strong class="deck-exec-card-label">${escapeHtml(card.label)}</strong>
    ${card.title ? `<h3>${escapeHtml(card.title)}</h3>` : ''}
    ${card.metric ? `<div class="deck-exec-card-metric">${escapeHtml(card.metric)}</div>` : ''}
    ${card.subtitle ? `<span class="deck-exec-card-subtitle">${escapeHtml(card.subtitle)}</span>` : ''}
    ${card.body ? `<p>${escapeHtml(card.body)}</p>` : ''}
  </article>`,
    )
    .join('\n')}</div>
  ${execCards.loopCaption ? `<p class="deck-exec-loop-caption">${escapeHtml(execCards.loopCaption)}</p>` : ''}
  ${execCards.target ? `<div class="deck-exec-target deck-exec-accent-${escapeAttr(execCards.targetAccent)}">${escapeHtml(execCards.target)}</div>` : ''}
  ${renderExecTakeawayHtml(execCards.takeaway, execCards.takeawayAccent)}
</div>`
}

export function renderExecTimelineHtml(execTimeline) {
  return `<div class="deck-exec deck-exec-timeline ${surfaceClass(execTimeline)}">
  <div class="deck-exec-timeline-line"></div>
  <div class="deck-exec-timeline-items">${execTimeline.items
    .map(
      (item) => `<article class="deck-exec-timeline-item deck-exec-accent-${escapeAttr(item.accent)}">
    <strong>${escapeHtml(item.year)}</strong>
    <span></span>
    <h3>${escapeHtml(item.title)}</h3>
    ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
  </article>`,
    )
    .join('\n')}</div>
  ${renderExecTakeawayHtml(execTimeline.takeaway, execTimeline.takeawayAccent)}
</div>`
}

export function renderExecMetricsHtml(execMetrics) {
  return `<div class="deck-exec deck-exec-metrics ${surfaceClass(execMetrics)}">
  <div class="deck-exec-metric-row">${execMetrics.metrics
    .map(
      (metric) => `<article class="deck-exec-metric deck-exec-accent-${escapeAttr(metric.accent)}">
    <strong>${escapeHtml(metric.value)}</strong>
    <span>${escapeHtml(metric.label)}</span>
  </article>`,
    )
    .join('\n')}</div>
  ${execMetrics.sectionTitle ? `<h2>${escapeHtml(execMetrics.sectionTitle)}</h2>` : ''}
  ${execMetrics.panels.length ? `<div class="deck-exec-panel-grid">${execMetrics.panels
    .map(
      (panel) => `<article class="deck-exec-panel deck-exec-accent-${escapeAttr(panel.accent)}">
    ${panel.value ? `<strong>${escapeHtml(panel.value)}</strong>` : ''}
    ${panel.title ? `<h3>${escapeHtml(panel.title)}</h3>` : ''}
    ${panel.body ? `<p>${escapeHtml(panel.body)}</p>` : ''}
    ${panel.note ? `<em>${escapeHtml(panel.note)}</em>` : ''}
  </article>`,
    )
    .join('\n')}</div>` : ''}
  ${renderExecTakeawayHtml(execMetrics.takeaway, execMetrics.takeawayAccent)}
</div>`
}

function renderExecTakeawayHtml(text, accent = 'blue') {
  return text
    ? `<div class="deck-exec-takeaway deck-exec-accent-${escapeAttr(accent)}">${escapeHtml(text)}</div>`
    : ''
}

function surfaceClass(model) {
  return model.surface ? `deck-exec-surface-${escapeAttr(model.surface)}` : ''
}
