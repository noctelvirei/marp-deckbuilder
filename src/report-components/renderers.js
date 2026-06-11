import {
  escapeAttr,
  escapeHtml,
  formatReportNumber,
  formatReportPercent,
  jsString,
  jsValue,
  normalizeHexColor,
} from './utils.js'

export function renderReportChartHtml(chart) {
  return `<div class="report-chart report-chart-${escapeAttr(chart.chartType)}">
  ${chart.title ? `<div class="report-chart-title">${escapeHtml(chart.title)}</div>` : ''}
  <div class="report-chart-stage" style="height:${chart.height}px">
    <canvas id="${escapeAttr(chart.id)}" role="img" aria-label="${escapeAttr(chart.ariaLabel)}"></canvas>
  </div>
</div>`
}

export function renderReportMetricGridHtml(grid) {
  return `<div class="report-metric-grid">
${grid.metrics.map(renderReportMetricHtml).join('\n')}
</div>`
}

export function renderReportCalloutHtml(callout) {
  return `<div class="report-callout report-callout-${escapeAttr(callout.variant)}" role="note">
  ${callout.title ? `<div class="report-callout-title">${escapeHtml(callout.title)}</div>` : ''}
  ${callout.body ? `<div class="report-callout-body">${escapeHtml(callout.body)}</div>` : ''}
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

export function renderReportChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const colors = chart.labels.map((_, index) => normalizeChartColor(palette[index % palette.length]))

  return `(() => {
  const canvas = document.getElementById(${jsString(chart.id)});
  const themeRoot = canvas.closest(".deck-report") || document.body || document.documentElement;
  const rootStyle = getComputedStyle(themeRoot);
  const tickColor = rootStyle.getPropertyValue("--text-dim").trim() || "#64748b";
  const gridColor = rootStyle.getPropertyValue("--border").trim() || "rgba(148, 163, 184, 0.28)";
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ${jsValue(chart.labels)},
      datasets: [{
        label: ${jsString(chart.series)},
        data: ${jsValue(chart.values)},
        backgroundColor: ${jsValue(colors)},
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: ${chart.series && chart.series !== chart.title ? 'true' : 'false'} }
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

function clampPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, numeric))
}
