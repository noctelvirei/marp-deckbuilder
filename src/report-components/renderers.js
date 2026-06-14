import {
  escapeAttr,
  escapeHtml,
  formatReportNumber,
  formatReportPercent,
  jsString,
  jsValue,
  normalizeBadgeVariant,
  normalizeHexColor,
  parseDataTableNumber,
} from './utils.js'

export function renderReportChartHtml(chart) {
  if (['area', 'treemap', 'funnel', 'heatmap', 'sankey'].includes(chart.chartType)) return renderReportPlotChartHtml(chart)
  return `<div class="report-chart report-chart-${escapeAttr(chart.chartType)}">
  ${chart.title ? `<div class="report-chart-title">${escapeHtml(chart.title)}</div>` : ''}
  <div class="report-chart-stage" style="height:${chart.height}px">
    <canvas id="${escapeAttr(chart.id)}" role="img" aria-label="${escapeAttr(chart.ariaLabel)}"></canvas>
  </div>
</div>`
}

function renderReportPlotChartHtml(chart) {
  return `<div class="report-chart report-chart-${escapeAttr(chart.chartType)}">
  ${chart.title ? `<div class="report-chart-title">${escapeHtml(chart.title)}</div>` : ''}
  <div class="report-chart-stage" style="height:${chart.height}px">
    <div id="${escapeAttr(chart.id)}" class="report-chart-plot" role="img" aria-label="${escapeAttr(chart.ariaLabel)}"></div>
  </div>
</div>`
}

export function renderReportMetricGridHtml(grid) {
  return `<div class="report-metric-grid">
${grid.metrics.map(renderReportMetricHtml).join('\n')}
</div>`
}

export function renderReportFigureHtml(figure) {
  const className = ['report-figure', `report-figure-${figure.size}`].filter(Boolean).join(' ')
  const caption = [
    figure.caption ? `<span class="report-figure-caption">${escapeHtml(figure.caption)}</span>` : '',
    figure.source ? `<span class="report-figure-source">${escapeHtml(figure.source)}</span>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  return `<figure class="${escapeAttr(className)}">
  <img src="${escapeAttr(figure.src)}" alt="${escapeAttr(figure.alt)}">
  ${caption ? `<figcaption>\n    ${caption}\n  </figcaption>` : ''}
</figure>`
}

export function renderReportDataTableHtml(table) {
  const className = ['report-data-table', table.compact ? 'report-data-table-compact' : ''].filter(Boolean).join(' ')
  const caption = [
    table.caption ? `<span class="report-data-table-caption">${escapeHtml(table.caption)}</span>` : '',
    table.source ? `<span class="report-data-table-source">${escapeHtml(table.source)}</span>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  const footer = table.totals.length
    ? `      <tfoot>
${renderReportDataTableRow(table.totals, table.types, table, 'total')}
      </tfoot>
`
    : ''
  const footerHtml = footer ? `\n${footer.trimEnd()}` : ''
  return `<figure class="${escapeAttr(className)}">
  ${table.title ? `<div class="report-data-table-title">${escapeHtml(table.title)}</div>` : ''}
  <div class="report-data-table-scroll">
    <table>
      <thead>
        <tr>${table.columns.map((column, index) => renderReportDataTableHeader(column, table, index)).join('')}</tr>
      </thead>
      <tbody>
${table.rows.map((row, index) => renderReportDataTableRow(row, table.types, table, index + 1)).join('\n')}
      </tbody>${footerHtml}
    </table>
  </div>
  ${caption ? `<figcaption>\n    ${caption}\n  </figcaption>` : ''}
</figure>`
}

export function renderReportKeyValuesHtml(keyValues) {
  return `<section class="report-key-values report-key-values-${escapeAttr(keyValues.columns)}" aria-label="${escapeAttr(
    keyValues.title || 'Key details',
  )}">
  ${keyValues.title ? `<div class="report-key-values-title">${escapeHtml(keyValues.title)}</div>` : ''}
  <dl>
${keyValues.items.map(renderReportKeyValueItem).join('\n')}
  </dl>
</section>`
}

export function renderReportInsightHtml(insight) {
  const sections = [
    ['Finding', insight.finding],
    ['Evidence', insight.evidence],
    ['Impact', insight.impact],
    ['Action', insight.action],
  ].filter(([, value]) => value)
  return `<article class="report-insight report-insight-${escapeAttr(insight.variant)}" role="note">
  ${insight.title ? `<div class="report-insight-title">${escapeHtml(insight.title)}</div>` : ''}
  <dl>
${sections.map(renderReportInsightSection).join('\n')}
  </dl>
</article>`
}

export function renderReportRecommendationHtml(recommendation) {
  const meta = [
    recommendation.owner ? `<span class="report-recommendation-meta-item">Owner: ${escapeHtml(recommendation.owner)}</span>` : '',
    recommendation.priority
      ? `<span class="report-recommendation-priority report-recommendation-priority-${escapeAttr(recommendation.priority)}">${escapeHtml(recommendation.rawPriority || recommendation.priority)}</span>`
      : '',
    recommendation.due ? `<span class="report-recommendation-meta-item">Due: ${escapeHtml(recommendation.due)}</span>` : '',
    recommendation.rawStatus
      ? `<span class="report-badge report-badge-${escapeAttr(recommendation.status)}">${escapeHtml(recommendation.rawStatus)}</span>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  return `<article class="report-recommendation">
  ${recommendation.title ? `<div class="report-recommendation-title">${escapeHtml(recommendation.title)}</div>` : ''}
  ${recommendation.body ? `<div class="report-recommendation-body">${escapeHtml(recommendation.body)}</div>` : ''}
  ${meta ? `<div class="report-recommendation-meta">\n    ${meta}\n  </div>` : ''}
</article>`
}

export function renderReportPageBreakHtml(pageBreak) {
  return `<div class="report-page-break" role="separator" aria-label="${escapeAttr(
    pageBreak.label || 'Page break',
  )}">${pageBreak.label ? `<span>${escapeHtml(pageBreak.label)}</span>` : ''}</div>`
}

export function renderReportCardGridHtml(grid) {
  return `<section class="report-card-grid report-card-grid-${escapeAttr(grid.columns)}" aria-label="${escapeAttr(
    grid.title || 'Report cards',
  )}">
  ${grid.title ? `<div class="report-card-grid-title">${escapeHtml(grid.title)}</div>` : ''}
  <div class="report-card-grid-items">
${grid.cards.map(renderReportCardGridItem).join('\n')}
  </div>
</section>`
}

export function renderReportTimelineHtml(timeline) {
  return `<section class="report-timeline" aria-label="${escapeAttr(timeline.title || 'Timeline')}">
  ${timeline.title ? `<div class="report-timeline-title">${escapeHtml(timeline.title)}</div>` : ''}
  <ol>
${timeline.events.map(renderReportTimelineEvent).join('\n')}
  </ol>
</section>`
}

export function renderReportSourceNoteHtml(sourceNote) {
  const meta = [
    sourceNote.source ? `<span>Source: ${escapeHtml(sourceNote.source)}</span>` : '',
    sourceNote.date ? `<span>Date: ${escapeHtml(sourceNote.date)}</span>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  return `<aside class="report-source-note" role="note">
  ${sourceNote.title ? `<div class="report-source-note-title">${escapeHtml(sourceNote.title)}</div>` : ''}
  ${sourceNote.body ? `<div class="report-source-note-body">${escapeHtml(sourceNote.body)}</div>` : ''}
  ${meta ? `<div class="report-source-note-meta">\n    ${meta}\n  </div>` : ''}
</aside>`
}

export function renderReportSourceListHtml(sourceList) {
  return `<section class="report-source-list" aria-label="${escapeAttr(sourceList.title || 'Sources')}">
  ${sourceList.title ? `<div class="report-source-list-title">${escapeHtml(sourceList.title)}</div>` : ''}
  <ol>
${sourceList.sources.map(renderReportSourceItem).join('\n')}
  </ol>
</section>`
}

export function renderReportCiteHtml(cite) {
  const label = cite.label || `[${cite.number}]`
  return `<a class="report-cite" href="#${escapeAttr(cite.domId)}" aria-label="${escapeAttr(
    `Source ${cite.number}: ${cite.title}`,
  )}">${escapeHtml(label)}</a>`
}

export function renderReportCalloutHtml(callout) {
  return `<div class="report-callout report-callout-${escapeAttr(callout.variant)}" role="note">
  ${callout.title ? `<div class="report-callout-title">${escapeHtml(callout.title)}</div>` : ''}
  ${callout.body ? `<div class="report-callout-body">${escapeHtml(callout.body)}</div>` : ''}
</div>`
}

export function renderReportAccentCardHtml(card) {
  return `<div class="report-accent-card report-accent-card-${escapeAttr(card.accent)}">
  ${card.title ? `<div class="report-accent-card-title">${escapeHtml(card.title)}</div>` : ''}
  ${card.body ? `<div class="report-accent-card-body">${escapeHtml(card.body)}</div>` : ''}
</div>`
}

export function renderReportBadgeHtml(badge) {
  return `<span class="report-badge report-badge-${escapeAttr(badge.variant)}">${escapeHtml(badge.label)}</span>`
}

function renderReportMetricHtml(metric) {
  const className = ['report-metric', metric.accent ? `report-metric-${metric.accent}` : '']
    .filter(Boolean)
    .join(' ')
  const subClass = ['report-metric-sub', metric.direction === 'down' ? 'down' : '']
    .filter(Boolean)
    .join(' ')
  return `<div class="${escapeAttr(className)}">
  ${metric.value ? `<div class="report-metric-value">${escapeHtml(metric.value)}</div>` : ''}
  ${metric.label ? `<div class="report-metric-label">${escapeHtml(metric.label)}</div>` : ''}
  ${metric.sub ? `<div class="${escapeAttr(subClass)}">${escapeHtml(metric.sub)}</div>` : ''}
</div>`
}

function renderReportDataTableHeader(column, table, index) {
  const className = ['report-data-table-heading', reportDataTableAlignClass(table, index)].filter(Boolean).join(' ')
  return `<th scope="col" class="${escapeAttr(className)}">${escapeHtml(column)}</th>`
}

function renderReportDataTableRow(row, types, table, rowIndex) {
  const highlight = rowIndex === 'total' ? '' : reportDataTableRowHighlight(table, rowIndex)
  const className = ['report-data-table-row', rowIndex === 'total' ? 'report-data-table-total-row' : '', highlight]
    .filter(Boolean)
    .join(' ')
  return `        <tr class="${escapeAttr(className)}">${row
    .map((value, index) => renderReportDataTableCell(value, types[index], table, rowIndex, index))
    .join('')}</tr>`
}

function renderReportDataTableCell(value, type = 'text', table = {}, rowIndex = 0, cellIndex = 0) {
  const className = [
    'report-data-table-cell',
    `report-data-table-cell-${type}`,
    reportDataTableAlignClass(table, cellIndex),
    rowIndex === 'total' ? 'report-data-table-total-cell' : '',
    rowIndex === 'total' ? '' : reportDataTableCellHighlight(table, rowIndex, cellIndex + 1),
  ]
    .filter(Boolean)
    .join(' ')
  if (type === 'number') {
    return `<td class="${escapeAttr(className)}">${escapeHtml(formatReportNumber(parseDataTableNumber(value)))}</td>`
  }
  if (type === 'percent') {
    return `<td class="${escapeAttr(className)}">${escapeHtml(formatReportPercent(parseDataTableNumber(value)))}</td>`
  }
  if (type === 'status') {
    if (!String(value || '').trim()) return `<td class="${escapeAttr(className)}"></td>`
    const variant = normalizeBadgeVariant(value)
    return `<td class="${escapeAttr(className)}"><span class="report-badge report-badge-${escapeAttr(variant)}">${escapeHtml(value)}</span></td>`
  }
  return `<td class="${escapeAttr(className)}">${escapeHtml(value)}</td>`
}

function reportDataTableAlignClass(table = {}, index = 0) {
  const explicit = table.align?.[index] || ''
  const type = table.types?.[index] || 'text'
  const align = explicit || (type === 'number' || type === 'percent' ? 'right' : 'left')
  return ['left', 'center', 'right'].includes(align) ? `report-data-table-align-${align}` : ''
}

function reportDataTableRowHighlight(table = {}, rowIndex = 0) {
  const highlight = table.highlights?.find((item) => item.row === rowIndex && !item.column)
  return highlight ? `report-data-table-highlight-${highlight.variant}` : ''
}

function reportDataTableCellHighlight(table = {}, rowIndex = 0, columnIndex = 0) {
  const highlight = table.highlights?.find((item) => item.row === rowIndex && item.column === columnIndex)
  return highlight ? `report-data-table-highlight-${highlight.variant}` : ''
}

function renderReportKeyValueItem(item) {
  return `    <div class="report-key-value">
      <dt>${escapeHtml(item.key)}</dt>
      <dd>${escapeHtml(item.value)}</dd>
    </div>`
}

function renderReportInsightSection([label, value]) {
  return `    <div class="report-insight-section">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>`
}

function renderReportSourceItem(source) {
  const meta = [
    source.publisher ? `<span>${escapeHtml(source.publisher)}</span>` : '',
    source.date ? `<span>${escapeHtml(source.date)}</span>` : '',
    source.url ? `<a href="${escapeAttr(source.url)}">${escapeHtml(source.url)}</a>` : '',
  ]
    .filter(Boolean)
    .join('\n        ')
  const blocks = [
    source.note ? `<div class="report-source-list-note">${escapeHtml(source.note)}</div>` : '',
    meta ? `<div class="report-source-list-meta">\n        ${meta}\n      </div>` : '',
  ]
    .filter(Boolean)
    .join('\n      ')
  return `    <li id="${escapeAttr(source.domId)}">
      <div class="report-source-list-heading">
        <span class="report-source-list-number">[${escapeHtml(source.number)}]</span>
        <span class="report-source-list-name">${escapeHtml(source.title)}</span>
      </div>${blocks ? `\n      ${blocks}` : ''}
    </li>`
}

function renderReportCardGridItem(card) {
  return `    <article class="report-card-grid-card report-card-grid-card-${escapeAttr(card.accent)}">
      ${card.title ? `<div class="report-card-grid-card-title">${escapeHtml(card.title)}</div>` : ''}
      ${card.body ? `<div class="report-card-grid-card-body">${escapeHtml(card.body)}</div>` : ''}
    </article>`
}

function renderReportTimelineEvent(event) {
  return `    <li class="report-timeline-event report-timeline-event-${escapeAttr(event.status)}">
      <div class="report-timeline-marker" aria-hidden="true"></div>
      <div class="report-timeline-content">
        <div class="report-timeline-meta">
          ${event.date ? `<span class="report-timeline-date">${escapeHtml(event.date)}</span>` : ''}
          <span class="report-badge report-badge-${escapeAttr(event.status)}">${escapeHtml(event.rawStatus)}</span>
        </div>
        ${event.title ? `<div class="report-timeline-event-title">${escapeHtml(event.title)}</div>` : ''}
        ${event.body ? `<div class="report-timeline-event-body">${escapeHtml(event.body)}</div>` : ''}
      </div>
    </li>`
}

export function renderReportRateBarsHtml(rateBars, context = {}) {
  const palette = rateBars.colors.length ? rateBars.colors : reportChartPalette(context.brand)
  const total = rateBars.values.reduce((sum, value) => sum + value, 0)
  const rows = rateBars.labels.map((label, index) => {
    const value = rateBars.values[index]
    const share = rateBars.shares.length ? rateBars.shares[index] : (value / total) * 100
    const width = clampPercent(share)
    const color = normalizeHexColor(palette[index % palette.length]) || '#0F82F5'
    return renderReportRateBar({
      label,
      value,
      share,
      width,
      color,
    })
  })

  return `<div class="report-rate-bars" role="list" aria-label="${escapeAttr(rateBars.ariaLabel)}">
  ${rateBars.title ? `<div class="report-rate-bars-title">${escapeHtml(rateBars.title)}</div>` : ''}
${rows.join('\n')}
</div>`
}

function renderReportRateBar(row) {
  const style = `--report-rate-width:${formatReportPercent(row.width)};--report-rate-color:${row.color}`
  return `<div class="report-rate-bar" role="listitem">
  <span class="report-rate-label">${escapeHtml(row.label)}</span>
  <div class="report-rate-track">
    <div class="report-rate-fill" style="${escapeAttr(style)}"></div>
    <span class="report-rate-value">${escapeHtml(formatReportNumber(row.value))}</span>
  </div>
  <span class="report-rate-pct">${escapeHtml(formatReportPercent(row.share))}</span>
</div>`
}

function chartBoilerplate(chart, targetName = 'canvas') {
  return `  const themeRoot = ${targetName}.closest(".deck-report") || document.body || document.documentElement;
  const rootStyle = getComputedStyle(themeRoot);
  const tickColor = rootStyle.getPropertyValue("--text-dim").trim() || "#64748b";
  const gridColor = rootStyle.getPropertyValue("--border").trim() || "rgba(148, 163, 184, 0.28)";
  const tooltipBg = rootStyle.getPropertyValue("--bg-card").trim() || "rgba(15, 23, 42, 0.92)";
  const tooltipText = rootStyle.getPropertyValue("--text").trim() || "#ffffff";
  const tooltipMuted = rootStyle.getPropertyValue("--text-dim").trim() || "#cbd5e1";
  const textColor = rootStyle.getPropertyValue("--text").trim() || "#ffffff";
  const mutedColor = rootStyle.getPropertyValue("--text-dim").trim() || "#94a3b8";
  const valuePrefix = ${jsString(chart.valuePrefix)};
  const valueSuffix = ${jsString(chart.valueSuffix)};
  const valueFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const formatAxisValue = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? valueFormatter.format(numeric) : String(value ?? "");
  };
  const formatTooltipValue = (value) => {
    const formatted = formatAxisValue(value);
    return valuePrefix + formatted + valueSuffix;
  };
  const reportStaticChartOptions = {
    animation: false,
    transitions: {
      active: { animation: { duration: 0 } },
      resize: { animation: { duration: 0 } }
    }
  };`
}

export function renderReportChartScript(chart, context = {}) {
  if (chart.chartType === 'area') return renderReportAreaChartScript(chart, context)
  if (chart.chartType === 'treemap') return renderReportTreemapChartScript(chart, context)
  if (chart.chartType === 'funnel') return renderReportFunnelChartScript(chart, context)
  if (chart.chartType === 'heatmap') return renderReportHeatmapChartScript(chart, context)
  if (chart.chartType === 'sankey') return renderReportSankeyChartScript(chart, context)
  if (chart.chartType === 'grouped-bar') return renderReportMultiBarChartScript(chart, context, { stacked: false })
  if (chart.chartType === 'stacked-bar') return renderReportMultiBarChartScript(chart, context, { stacked: true })
  if (chart.chartType === 'waterfall') return renderReportWaterfallChartScript(chart, context)
  if (chart.chartType === 'bullet') return renderReportBulletChartScript(chart, context)
  if (chart.chartType === 'scatter') return renderReportScatterChartScript(chart, context)
  if (chart.chartType === 'bubble') return renderReportBubbleChartScript(chart, context)
  if (chart.chartType === 'histogram') return renderReportHistogramChartScript(chart, context)
  if (chart.chartType === 'boxplot') return renderReportBoxplotChartScript(chart, context)
  if (chart.chartType === 'pareto') return renderReportParetoChartScript(chart, context)

  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const colors = chart.labels.map((_, index) => normalizeChartColor(palette[index % palette.length]))
  const primaryColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const chartJsType = chart.chartType === 'line' ? 'line' : chart.chartType === 'doughnut' ? 'doughnut' : 'bar'
  const datasetOptions =
    chart.chartType === 'doughnut'
      ? `        backgroundColor: ${jsValue(colors)},
        borderColor: tooltipBg,
        borderWidth: 2,
        hoverOffset: 8`
      : chart.chartType === 'line'
      ? `        borderColor: ${jsString(primaryColor)},
        backgroundColor: ${jsString(hexToRgba(primaryColor, 0.18))},
        pointBackgroundColor: ${jsString(primaryColor)},
        pointBorderColor: tooltipBg,
        pointHoverRadius: 6,
        pointRadius: 4,
        borderWidth: 3,
        tension: 0.35,
        fill: false`
      : `        backgroundColor: ${jsValue(colors)},
        borderRadius: 5`
  const legendOptions =
    chart.chartType === 'doughnut'
      ? 'legend: { display: true, position: "right", labels: { color: tickColor } }'
      : `legend: { display: ${chart.series && chart.series !== chart.title ? 'true' : 'false'} }`
  const chartScales =
    chart.chartType === 'doughnut'
      ? ''
      : `,
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }`

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  new Chart(canvas, {
    type: ${jsString(chartJsType)},
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series)},
        data: ${jsValue(chart.values)},
${datasetOptions}
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      hover: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        ${legendOptions},
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ? context.dataset.label + ": " : "";
              const parsedValue = context.parsed && typeof context.parsed === "object" ? context.parsed.y : context.parsed;
              return label + formatTooltipValue(parsedValue);
            }
          }
        }
      }
${chartScales}
    }
  });
})();`
}

function renderReportParetoChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const barColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const lineColor = normalizeChartColor(palette[5]) || '#FC5161'
  const rows = chart.labels
    .map((label, index) => ({ label, value: chart.values[index] }))
    .sort((left, right) => right.value - left.value)
  const total = rows.reduce((sum, row) => sum + row.value, 0)
  let running = 0
  const cumulative = rows.map((row) => {
    running += row.value
    return Math.round((running / total) * 10000) / 100
  })

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  new Chart(canvas, {
    data: {
      labels: ${jsValue(rows.map((row) => row.label))},
      datasets: [{
        type: "bar",
        label: ${jsString(chart.series || 'Value')},
        data: ${jsValue(rows.map((row) => row.value))},
        yAxisID: "y",
        order: 2,
        backgroundColor: ${jsString(hexToRgba(barColor, 0.82))},
        borderColor: ${jsString(barColor)},
        borderWidth: 1,
        borderRadius: 5
      }, {
        type: "line",
        label: "Cumulative %",
        data: ${jsValue(cumulative)},
        yAxisID: "yPercent",
        order: 1,
        borderColor: ${jsString(lineColor)},
        backgroundColor: ${jsString(lineColor)},
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: true, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              if (context.dataset.yAxisID === "yPercent") return "Cumulative: " + valueFormatter.format(context.parsed.y) + "%";
              return context.dataset.label + ": " + formatTooltipValue(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          position: "left",
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        yPercent: {
          beginAtZero: true,
          max: 100,
          position: "right",
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString() + "%"
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
})();`
}

function renderReportBoxplotChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const boxColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const medianColor = normalizeChartColor(palette[5]) || '#FC5161'
  const stats = chart.labels.map((label, index) => {
    const values = [...chart.matrix[index]].sort((left, right) => left - right)
    return {
      label,
      min: values[0],
      q1: quantile(values, 0.25),
      median: quantile(values, 0.5),
      q3: quantile(values, 0.75),
      max: values[values.length - 1],
    }
  })

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  const stats = ${jsValue(stats)};
  const medianColor = ${jsString(medianColor)};
  const boxplotPlugin = {
    id: "reportBoxplotWhiskers",
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const yScale = chart.scales.y;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = medianColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      stats.forEach((item, index) => {
        const bar = meta.data[index];
        if (!bar) return;
        const x = bar.x;
        const halfWidth = Math.max(10, Math.min(28, Math.abs(bar.width || 28) / 2));
        const minY = yScale.getPixelForValue(item.min);
        const maxY = yScale.getPixelForValue(item.max);
        const medianY = yScale.getPixelForValue(item.median);
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
        ctx.moveTo(x - halfWidth, minY);
        ctx.lineTo(x + halfWidth, minY);
        ctx.moveTo(x - halfWidth, maxY);
        ctx.lineTo(x + halfWidth, maxY);
        ctx.moveTo(x - halfWidth, medianY);
        ctx.lineTo(x + halfWidth, medianY);
        ctx.stroke();
      });
      ctx.restore();
    }
  };
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series || 'Interquartile range')},
        data: stats.map((item) => [item.q1, item.q3]),
        backgroundColor: ${jsString(hexToRgba(boxColor, 0.52))},
        borderColor: ${jsString(boxColor)},
        borderWidth: 2,
        borderSkipped: false,
        borderRadius: 4,
        barPercentage: 0.58,
        categoryPercentage: 0.7
      }]
    },
    plugins: [boxplotPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              const item = stats[context.dataIndex];
              return [
                "Min: " + formatTooltipValue(item.min),
                "Q1: " + formatTooltipValue(item.q1),
                "Median: " + formatTooltipValue(item.median),
                "Q3: " + formatTooltipValue(item.q3),
                "Max: " + formatTooltipValue(item.max)
              ];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          title: {
            display: ${chart.yAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`
}

function renderReportHistogramChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const barColor = normalizeChartColor(palette[2] || palette[0]) || '#5A49F8'
  const minValue = Math.min(...chart.values)
  const maxValue = Math.max(...chart.values)
  const binCount = chart.binCount
  const span = maxValue - minValue
  const width = span === 0 ? 1 : span / binCount
  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = span === 0 ? minValue - 0.5 + index * width : minValue + index * width
    const end = start + width
    return {
      start,
      end,
      count: 0,
    }
  })
  chart.values.forEach((value) => {
    const rawIndex = span === 0 ? Math.floor(binCount / 2) : Math.floor((value - minValue) / width)
    const index = Math.max(0, Math.min(binCount - 1, rawIndex))
    bins[index].count += 1
  })
  const labels = bins.map((bin) => `${formatBinLabel(bin.start)}-${formatBinLabel(bin.end)}`)
  const counts = bins.map((bin) => bin.count)

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  const ranges = ${jsValue(labels)};
  const counts = ${jsValue(counts)};
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ranges,
      datasets: [{
        label: ${jsString(chart.series || 'Frequency')},
        data: counts,
        backgroundColor: ${jsString(hexToRgba(barColor, 0.82))},
        borderColor: ${jsString(barColor)},
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 1,
        categoryPercentage: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            title: (items) => {
              const index = items && items.length ? items[0].dataIndex : 0;
              return "Range: " + ranges[index];
            },
            label: (context) => "Count: " + valueFormatter.format(context.parsed.y)
          }
        }
      },
      scales: {
        x: {
          title: {
            display: ${chart.xAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.xAxisLabel)},
            color: tickColor
          },
          ticks: { color: tickColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          title: {
            display: ${chart.yAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            precision: 0,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`
}

function renderReportBubbleChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const bubbleColor = normalizeChartColor(palette[1] || palette[0]) || '#66D9EF'
  const points = chart.points.map((point) => ({
    x: Number(point.x),
    y: point.y,
    r: point.r,
  }))

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  new Chart(canvas, {
    type: "bubble",
    data: {
      datasets: [{
        label: ${jsString(chart.series || chart.title || 'Series 1')},
        data: ${jsValue(points)},
        backgroundColor: ${jsString(hexToRgba(bubbleColor, 0.42))},
        borderColor: ${jsString(bubbleColor)},
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        legend: { display: ${chart.series && chart.series !== chart.title ? 'true' : 'false'}, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              const raw = context.raw || {};
              return "X: " + formatAxisValue(raw.x) + ", Y: " + formatTooltipValue(raw.y) + ", Size: " + formatAxisValue(raw.r);
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: ${chart.xAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.xAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        y: {
          title: {
            display: ${chart.yAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`
}

function renderReportScatterChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const pointColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const points = chart.points.map((point) => ({
    x: Number(point.x),
    y: point.y,
  }))

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [{
        label: ${jsString(chart.series || chart.title || 'Series 1')},
        data: ${jsValue(points)},
        backgroundColor: ${jsString(hexToRgba(pointColor, 0.82))},
        borderColor: ${jsString(pointColor)},
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        legend: { display: ${chart.series && chart.series !== chart.title ? 'true' : 'false'}, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              return "X: " + formatAxisValue(context.parsed.x) + ", Y: " + formatTooltipValue(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: ${chart.xAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.xAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        y: {
          title: {
            display: ${chart.yAxisLabel ? 'true' : 'false'},
            text: ${jsString(chart.yAxisLabel)},
            color: tickColor
          },
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`
}

function renderReportBulletChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const barColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const targetColor = normalizeChartColor(palette[5]) || '#FC5161'

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  const targets = ${jsValue(chart.targets)};
  const targetColor = ${jsString(targetColor)};
  const targetMarkerPlugin = {
    id: "reportBulletTargetMarkers",
    afterDatasetsDraw(chart) {
      const meta = chart.getDatasetMeta(0);
      const xScale = chart.scales.x;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = targetColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      targets.forEach((target, index) => {
        const bar = meta.data[index];
        if (!bar) return;
        const x = xScale.getPixelForValue(target);
        const markerHeight = Math.min(34, Math.max(16, Math.abs(bar.height || 24) + 8));
        ctx.beginPath();
        ctx.moveTo(x, bar.y - markerHeight / 2);
        ctx.lineTo(x, bar.y + markerHeight / 2);
        ctx.stroke();
      });
      ctx.restore();
    }
  };
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series || 'Actual')},
        data: ${jsValue(chart.values)},
        backgroundColor: ${jsString(barColor)},
        borderRadius: 5,
        borderSkipped: false,
        barPercentage: 0.58,
        categoryPercentage: 0.72
      }]
    },
    plugins: [targetMarkerPlugin],
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "nearest",
        intersect: true
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "nearest",
          intersect: true,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => {
              const target = targets[context.dataIndex];
              return [
                "Actual: " + formatTooltipValue(context.parsed.x),
                "Target: " + formatTooltipValue(target)
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: tickColor },
          grid: { display: false }
        }
      }
    }
  });
})();`
}

function renderReportHeatmapChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const highColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const lowColor = hexToRgba(highColor, 0.12)
  const cells = chart.yLabels.flatMap((rowLabel, rowIndex) =>
    chart.xLabels.map((columnLabel, columnIndex) => ({
      x: columnLabel,
      y: rowLabel,
      value: chart.matrix[rowIndex][columnIndex],
    })),
  )

  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'target')}
  const xLabels = ${jsValue(chart.xLabels)};
  const yLabels = ${jsValue(chart.yLabels)};
  const cells = ${jsValue(cells)};
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const margin = { top: 22, right: 24, bottom: 44, left: Math.max(76, Math.min(148, Math.max(...yLabels.map((label) => String(label).length)) * 9 + 28)) };
  const plotWidth = Math.max(1, width - margin.left - margin.right);
  const plotHeight = Math.max(1, height - margin.top - margin.bottom);
  const cellWidth = plotWidth / Math.max(1, xLabels.length);
  const cellHeight = plotHeight / Math.max(1, yLabels.length);
  const values = cells.map((cell) => Number(cell.value));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const color = d3.scaleSequential()
    .domain(minValue === maxValue ? [minValue - 1, maxValue + 1] : [minValue, maxValue])
    .interpolator(d3.interpolateRgb(${jsString(lowColor)}, ${jsString(highColor)}));
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const plot = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  plot.selectAll("rect")
    .data(cells)
    .join("rect")
    .attr("class", "report-heatmap-cell")
    .attr("x", (cell) => xLabels.indexOf(cell.x) * cellWidth)
    .attr("y", (cell) => yLabels.indexOf(cell.y) * cellHeight)
    .attr("width", Math.max(1, cellWidth - 3))
    .attr("height", Math.max(1, cellHeight - 3))
    .attr("rx", 5)
    .attr("fill", (cell) => color(Number(cell.value)))
    .attr("stroke", tooltipBg)
    .attr("stroke-width", 1)
    .on("mousemove", (event, cell) => {
      const rect = target.getBoundingClientRect();
      tooltip.textContent = cell.y + " · " + cell.x + ": " + formatTooltipValue(cell.value);
      tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
      tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
      tooltip.hidden = false;
      d3.select(event.currentTarget).attr("stroke", gridColor).attr("stroke-width", 2);
    })
    .on("mouseleave", (event) => {
      tooltip.hidden = true;
      d3.select(event.currentTarget).attr("stroke", tooltipBg).attr("stroke-width", 1);
    });
  svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top + plotHeight + 10) + ")")
    .selectAll("text")
    .data(xLabels)
    .join("text")
    .attr("x", (_, index) => index * cellWidth + cellWidth / 2)
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("fill", tickColor)
    .attr("font-size", 12)
    .text((label) => label);
  svg.append("g")
    .attr("transform", "translate(" + (margin.left - 12) + "," + margin.top + ")")
    .selectAll("text")
    .data(yLabels)
    .join("text")
    .attr("x", 0)
    .attr("y", (_, index) => index * cellHeight + cellHeight / 2 + 4)
    .attr("text-anchor", "end")
    .attr("fill", tickColor)
    .attr("font-size", 12)
    .text((label) => label);
  svg.append("text")
    .attr("x", width - margin.right)
    .attr("y", height - 8)
    .attr("text-anchor", "end")
    .attr("fill", tickColor)
    .attr("font-size", 11)
    .text("Low " + formatTooltipValue(minValue) + "   High " + formatTooltipValue(maxValue));
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`
}

function renderReportWaterfallChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const positiveColor = normalizeChartColor(palette[4]) || '#66CC8E'
  const negativeColor = normalizeChartColor(palette[5]) || '#FC5161'
  let runningTotal = 0
  const ranges = chart.values.map((value) => {
    const start = runningTotal
    runningTotal += value
    return [Math.min(start, runningTotal), Math.max(start, runningTotal)]
  })
  const colors = chart.values.map((value) => (value < 0 ? negativeColor : positiveColor))
  const deltas = chart.values

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  const deltas = ${jsValue(deltas)};
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series || 'Change')},
        data: ${jsValue(ranges)},
        backgroundColor: ${jsValue(colors)},
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              const delta = deltas[context.dataIndex];
              return "Change: " + formatTooltipValue(delta);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`
}

function renderReportMultiBarChartScript(chart, context = {}, options = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const datasets = chart.seriesNames.map((series, seriesIndex) => ({
    label: series,
    data: chart.matrix.map((row) => row[seriesIndex]),
    backgroundColor: normalizeChartColor(palette[seriesIndex % palette.length]) || '#0F82F5',
    borderRadius: 5,
  }))
  const stacked = Boolean(options.stacked)

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'canvas')}
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: ${jsValue(datasets)}
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...reportStaticChartOptions,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: true, position: "top", labels: { color: tickColor } },
        tooltip: {
          enabled: true,
          mode: "index",
          intersect: false,
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: tooltipMuted,
          borderColor: gridColor,
          borderWidth: 1,
          displayColors: true,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ? context.dataset.label + ": " : "";
              return label + formatTooltipValue(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          stacked: ${stacked},
          ticks: { color: tickColor },
          grid: { color: gridColor }
        },
        y: {
          stacked: ${stacked},
          ticks: {
            color: tickColor,
            callback: value => Number(value).toLocaleString()
          },
          grid: { color: gridColor }
        }
      }
    }
  });
})();`
}

function renderReportFunnelChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const fallbackColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const data = chart.labels.map((label, index) => ({
    label,
    value: chart.values[index],
    color: normalizeChartColor(palette[index % palette.length]) || fallbackColor,
  }))

  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'target')}
  const data = ${jsValue(data)};
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const marginX = 28;
  const segmentGap = 5;
  const segmentHeight = Math.max(34, (height - segmentGap * (data.length - 1)) / Math.max(1, data.length));
  const availableWidth = width - marginX * 2;
  const widthFor = (value) => Math.max(34, (Number(value) / maxValue) * availableWidth);
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const segments = data.map((item, index) => {
    const y0 = index * (segmentHeight + segmentGap);
    const y1 = y0 + segmentHeight;
    const topWidth = widthFor(item.value);
    const next = data[index + 1];
    const bottomWidth = widthFor(next ? next.value : item.value * 0.72);
    const xTop = (width - topWidth) / 2;
    const xBottom = (width - bottomWidth) / 2;
    const previous = index === 0 ? null : data[index - 1];
    const conversion = previous && previous.value > 0 ? (item.value / previous.value) * 100 : null;
    return {
      ...item,
      index,
      y0,
      y1,
      xTop,
      xBottom,
      topWidth,
      bottomWidth,
      conversion,
      path: [
        "M", xTop, y0,
        "L", xTop + topWidth, y0,
        "L", xBottom + bottomWidth, y1,
        "L", xBottom, y1,
        "Z"
      ].join(" ")
    };
  });
  const cell = svg.selectAll("g")
    .data(segments)
    .join("g")
    .attr("class", "report-funnel-segment");
  cell.append("path")
    .attr("d", (segment) => segment.path)
    .attr("fill", (segment) => segment.color)
    .attr("fill-opacity", 0.9)
    .attr("stroke", tooltipBg)
    .attr("stroke-width", 1.5);
  const printLabels = cell.append("text")
    .attr("class", "report-funnel-print-label")
    .attr("x", width / 2)
    .attr("y", (segment) => (segment.y0 + segment.y1) / 2 - 7)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle");
  printLabels.append("tspan")
    .attr("class", "report-funnel-print-label-name")
    .text((segment) => segment.label);
  printLabels.append("tspan")
    .attr("class", "report-funnel-print-label-value")
    .attr("x", width / 2)
    .attr("dy", "1.25em")
    .text((segment) => {
      const conversion = segment.conversion === null ? "Start" : (Math.round(segment.conversion * 10) / 10).toString().replace(/\\.0$/, "") + "% from prior";
      return formatTooltipValue(segment.value) + " · " + conversion;
    });
  cell.on("mousemove", (event, segment) => {
    const rect = target.getBoundingClientRect();
    const conversion = segment.conversion === null ? "Start" : (Math.round(segment.conversion * 10) / 10).toString().replace(/\\.0$/, "") + "% from prior";
    tooltip.textContent = segment.label + ": " + formatTooltipValue(segment.value) + " · " + conversion;
    tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
    tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
    tooltip.hidden = false;
    d3.select(event.currentTarget).select("path").attr("stroke", gridColor).attr("fill-opacity", 1);
  });
  cell.on("mouseleave", (event) => {
    tooltip.hidden = true;
    d3.select(event.currentTarget).select("path").attr("stroke", tooltipBg).attr("fill-opacity", 0.9);
  });
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`
}

function renderReportSankeyChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const fallbackColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const nodeColors = new Map()
  const nodes = []
  chart.links.forEach((link) => {
    ;[link.source, link.target].forEach((label) => {
      if (!nodeColors.has(label)) {
        nodeColors.set(label, normalizeChartColor(palette[nodeColors.size % palette.length]) || fallbackColor)
        nodes.push(label)
      }
    })
  })
  const data = {
    nodes: nodes.map((label) => ({ label, color: nodeColors.get(label) })),
    links: chart.links.map((link) => ({ ...link, color: nodeColors.get(link.source) || fallbackColor })),
  }

  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'target')}
  const data = ${jsValue(data)};
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const nodeWidth = 18;
  const margin = { top: 18, right: 28, bottom: 18, left: 28 };
  const innerHeight = Math.max(120, height - margin.top - margin.bottom);
  const innerWidth = Math.max(220, width - margin.left - margin.right - nodeWidth);
  const nodeMap = new Map(data.nodes.map((node) => [node.label, {
    ...node,
    incoming: 0,
    outgoing: 0,
    depth: 0,
    sourceLinks: [],
    targetLinks: []
  }]));
  const links = data.links.map((link) => {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    source.outgoing += link.value;
    target.incoming += link.value;
    const resolved = { ...link, source, target };
    source.sourceLinks.push(resolved);
    target.targetLinks.push(resolved);
    return resolved;
  });
  for (let pass = 0; pass < nodeMap.size; pass += 1) {
    links.forEach((link) => {
      link.target.depth = Math.max(link.target.depth, link.source.depth + 1);
    });
  }
  const maxDepth = Math.max(...Array.from(nodeMap.values(), (node) => node.depth), 1);
  const columns = d3.group(Array.from(nodeMap.values()), (node) => node.depth);
  columns.forEach((column) => {
    column.sort((a, b) => Math.max(b.incoming, b.outgoing) - Math.max(a.incoming, a.outgoing));
    const gap = column.length > 1 ? 12 : 0;
    const available = Math.max(24, innerHeight - gap * Math.max(0, column.length - 1));
    const totalWeight = d3.sum(column, (node) => Math.max(node.incoming, node.outgoing, 1));
    const minHeight = column.length * 16 <= available ? 16 : Math.max(6, available / Math.max(1, column.length));
    let y = margin.top;
    column.forEach((node) => {
      const weight = Math.max(node.incoming, node.outgoing, 1);
      node.x = margin.left + (node.depth / maxDepth) * innerWidth;
      node.y = y;
      node.height = Math.max(minHeight, (weight / Math.max(totalWeight, 1)) * available);
      node.width = nodeWidth;
      y += node.height + gap;
    });
  });
  const maxColumnWeight = Math.max(...Array.from(columns.values(), (column) =>
    d3.sum(column, (node) => Math.max(node.incoming, node.outgoing, 1))
  ), 1);
  const linkScale = innerHeight / maxColumnWeight;
  links.forEach((link) => {
    const maxLinkWidth = Math.max(2, Math.min(link.source.height, link.target.height, innerHeight * 0.24));
    link.width = Math.min(maxLinkWidth, Math.max(2, link.value * linkScale));
  });
  nodeMap.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    node.targetLinks.sort((a, b) => a.source.y - b.source.y);
    let sourceOffset = 0;
    node.sourceLinks.forEach((link) => {
      link.y0 = node.y + Math.min(node.height - link.width / 2, sourceOffset + link.width / 2);
      sourceOffset += link.width;
    });
    let targetOffset = 0;
    node.targetLinks.forEach((link) => {
      link.y1 = node.y + Math.min(node.height - link.width / 2, targetOffset + link.width / 2);
      targetOffset += link.width;
    });
  });
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const pathFor = (link) => {
    const x0 = link.source.x + nodeWidth;
    const x1 = link.target.x;
    const mid = x0 + (x1 - x0) * 0.5;
    return "M" + x0 + "," + link.y0 + "C" + mid + "," + link.y0 + " " + mid + "," + link.y1 + " " + x1 + "," + link.y1;
  };
  const linkSelection = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("class", "report-sankey-link")
    .attr("d", pathFor)
    .attr("stroke", (link) => link.color)
    .attr("stroke-opacity", 0.36)
    .attr("stroke-width", (link) => link.width)
    .attr("stroke-linecap", "round");
  linkSelection.on("mousemove", (event, link) => {
    const rect = target.getBoundingClientRect();
    tooltip.textContent = link.source.label + " -> " + link.target.label + ": " + formatTooltipValue(link.value);
    tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
    tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
    tooltip.hidden = false;
    d3.select(event.currentTarget).attr("stroke-opacity", 0.72);
  });
  linkSelection.on("mouseleave", (event) => {
    tooltip.hidden = true;
    d3.select(event.currentTarget).attr("stroke-opacity", 0.36);
  });
  const nodeSelection = svg.append("g")
    .selectAll("g")
    .data(Array.from(nodeMap.values()))
    .join("g")
    .attr("class", "report-sankey-node")
    .attr("transform", (node) => "translate(" + node.x + "," + node.y + ")");
  nodeSelection.append("rect")
    .attr("width", nodeWidth)
    .attr("height", (node) => node.height)
    .attr("rx", 5)
    .attr("fill", (node) => node.color)
    .attr("stroke", gridColor)
    .attr("stroke-width", 1);
  nodeSelection.append("text")
    .attr("x", (node) => node.depth === maxDepth ? -8 : nodeWidth + 8)
    .attr("y", (node) => Math.max(12, node.height / 2))
    .attr("dy", "0.35em")
    .attr("text-anchor", (node) => node.depth === maxDepth ? "end" : "start")
    .attr("fill", textColor)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .text((node) => node.label)
    .each(function() {
      const text = d3.select(this);
      const maxWidth = Math.max(54, width / (maxDepth + 1) - 48);
      let label = text.text();
      while (this.getComputedTextLength && this.getComputedTextLength() > maxWidth && label.length > 4) {
        label = label.slice(0, -2).trim();
        text.text(label + "...");
      }
    });
  nodeSelection.append("title")
    .text((node) => node.label + ": in " + formatTooltipValue(node.incoming) + ", out " + formatTooltipValue(node.outgoing));
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", height - 3)
    .attr("fill", mutedColor)
    .attr("font-size", 11)
    .text(${jsString(chart.series || 'Flow')});
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`
}

function renderReportTreemapChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const fallbackColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const data = chart.labels.map((label, index) => ({
    label,
    value: chart.values[index],
    color: normalizeChartColor(palette[index % palette.length]) || fallbackColor,
  }))

  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'target')}
  const data = ${jsValue(data)};
  const width = Math.max(320, target.clientWidth || 720);
  const height = ${chart.height};
  const root = d3.hierarchy({ children: data })
    .sum((node) => node.value)
    .sort((a, b) => b.value - a.value);
  d3.treemap()
    .size([width, height])
    .paddingInner(5)
    .round(true)(root);
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", ${jsString(chart.ariaLabel)})
    .style("display", "block")
    .style("width", "100%")
    .style("height", "100%");
  const cell = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (node) => "translate(" + node.x0 + "," + node.y0 + ")");
  cell.append("rect")
    .attr("width", (node) => Math.max(0, node.x1 - node.x0))
    .attr("height", (node) => Math.max(0, node.y1 - node.y0))
    .attr("rx", 6)
    .attr("fill", (node) => node.data.color)
    .attr("fill-opacity", 0.88)
    .attr("stroke", tooltipBg)
    .attr("stroke-width", 1.5);
  cell.append("text")
    .attr("x", 12)
    .attr("y", 18)
    .attr("fill", textColor)
    .attr("font-size", 12)
    .attr("font-weight", 700)
    .style("paint-order", "stroke")
    .style("stroke", "rgba(0, 0, 0, 0.32)")
    .style("stroke-linejoin", "round")
    .style("stroke-width", "2px")
    .style("pointer-events", "none")
    .each(function(node) {
      const cellWidth = node.x1 - node.x0;
      const cellHeight = node.y1 - node.y0;
      if (cellWidth < 76 || cellHeight < 42) return;
      const text = d3.select(this);
      text.append("tspan").attr("x", 12).text(node.data.label);
      text.append("tspan")
        .attr("x", 12)
        .attr("dy", 18)
        .attr("fill", textColor)
        .attr("fill-opacity", 0.78)
        .attr("font-weight", 600)
        .text(formatTooltipValue(node.data.value));
    });
  cell.on("mousemove", (event, node) => {
    const rect = target.getBoundingClientRect();
    tooltip.textContent = node.data.label + ": " + formatTooltipValue(node.data.value);
    tooltip.style.left = Math.min(rect.width - 8, Math.max(8, event.clientX - rect.left)) + "px";
    tooltip.style.top = Math.min(rect.height - 8, Math.max(8, event.clientY - rect.top)) + "px";
    tooltip.hidden = false;
    d3.select(event.currentTarget).select("rect").attr("stroke", gridColor).attr("fill-opacity", 1);
  });
  cell.on("mouseleave", (event) => {
    tooltip.hidden = true;
    d3.select(event.currentTarget).select("rect").attr("stroke", tooltipBg).attr("fill-opacity", 0.88);
  });
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
  target.append(svg.node());
  target.append(tooltip);
})();`
}

function renderReportAreaChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const primaryColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const fillColor = hexToRgba(primaryColor, 0.24)

  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
${chartBoilerplate(chart, 'target')}
  const parseX = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed;
  };
  const data = ${jsValue(chart.points)}.map((point) => ({
    x: parseX(point.x),
    label: point.x,
    y: Number(point.y)
  }));
  const usesOrdinalXScale = data.every((point) => !(point.x instanceof Date));
  const tickStep = Math.max(1, Math.ceil(data.length / 6));
  const xTickValues = data
    .filter((point, index) => data.length <= 8 || index === 0 || index === data.length - 1 || index % tickStep === 0)
    .map((point) => point.x);
  const xScale = {
    grid: true,
    label: null,
    ticks: xTickValues,
    tickFormat: (value) => value instanceof Date ? value.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : String(value)
  };
  if (usesOrdinalXScale) {
    xScale.domain = Array.from(new Set(data.map((point) => point.x)));
  }
  target.textContent = "";
  const tooltip = document.createElement("div");
  tooltip.className = "report-chart-floating-tooltip";
  tooltip.hidden = true;
  target.append(Plot.plot({
    width: Math.max(320, target.clientWidth || 720),
    height: ${chart.height},
    marginLeft: 58,
    marginRight: 24,
    marginTop: 18,
    marginBottom: 42,
    style: {
      background: "transparent",
      color: tickColor,
      fontFamily: rootStyle.getPropertyValue("font-family").trim() || "Arial, sans-serif"
    },
    x: xScale,
    y: {
      grid: true,
      label: null,
      tickFormat: (value) => Number(value).toLocaleString()
    },
    marks: [
      Plot.ruleY([0], { stroke: gridColor }),
      Plot.areaY(data, { x: "x", y: "y", fill: ${jsString(fillColor)} }),
      Plot.lineY(data, { x: "x", y: "y", stroke: ${jsString(primaryColor)}, strokeWidth: 3, curve: "catmull-rom" }),
      Plot.dot(data, { x: "x", y: "y", fill: ${jsString(primaryColor)}, stroke: tooltipBg, r: 4 }),
      Plot.tip(data, Plot.pointerX({
        x: "x",
        y: "y",
        title: (point) => point.label + ": " + formatTooltipValue(point.y),
        fill: tooltipBg,
        stroke: gridColor,
        fontSize: 12,
        color: textColor
      }))
    ]
  }));
  target.append(tooltip);
  target.addEventListener("mousemove", (event) => {
    const rect = target.getBoundingClientRect();
    const plotLeft = 58;
    const plotRight = 24;
    const plotTop = 18;
    const plotBottom = 42;
    const plotWidth = Math.max(1, rect.width - plotLeft - plotRight);
    const plotHeight = Math.max(1, rect.height - plotTop - plotBottom);
    const relativeX = Math.min(1, Math.max(0, (event.clientX - rect.left - plotLeft) / plotWidth));
    const index = Math.min(data.length - 1, Math.max(0, Math.round(relativeX * (data.length - 1))));
    const point = data[index];
    const maxY = Math.max(...data.map((item) => item.y), 0);
    const minY = Math.min(...data.map((item) => item.y), 0);
    const yRange = Math.max(1, maxY - minY);
    const x = plotLeft + (data.length <= 1 ? 0 : (index / (data.length - 1)) * plotWidth);
    const y = plotTop + (1 - (point.y - minY) / yRange) * plotHeight;
    tooltip.textContent = point.label + ": " + formatTooltipValue(point.y);
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.hidden = false;
  });
  target.addEventListener("mouseleave", () => {
    tooltip.hidden = true;
  });
})();`
}

function reportChartPalette(brand = {}) {
  const colors = brand.colors || {}
  return [
    colors.blue || '0F82F5',
    colors.cyan || colors.lightBlue || '59D6FD',
    colors.purple || '5143D5',
    colors.orange || 'F9935B',
    colors.green || '66CC8E',
    colors.red || 'FC5161',
  ]
}

function normalizeChartColor(value = '') {
  const token = String(value || '').trim()
  const hex = token.match(/^#?([0-9a-f]{6})$/i)
  return hex ? `#${hex[1]}` : token
}

function hexToRgba(value, alpha = 1) {
  const hex = String(value || '').trim().match(/^#?([0-9a-f]{6})$/i)
  if (!hex) return value
  const numeric = Number.parseInt(hex[1], 16)
  const red = (numeric >> 16) & 255
  const green = (numeric >> 8) & 255
  const blue = numeric & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function formatBinLabel(value) {
  if (!Number.isFinite(value)) return String(value)
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function quantile(values, fraction) {
  if (!values.length) return 0
  const position = (values.length - 1) * fraction
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return values[lower]
  const weight = position - lower
  return values[lower] * (1 - weight) + values[upper] * weight
}

function clampPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, numeric))
}
