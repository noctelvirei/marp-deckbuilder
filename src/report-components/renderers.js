import { escapeAttr, escapeHtml, jsString, jsValue } from './utils.js'

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
