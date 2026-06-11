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
  if (chart.chartType === 'area') return renderReportPlotChartHtml(chart)
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
  if (chart.chartType === 'area') return renderReportAreaChartScript(chart, context)

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
  const themeRoot = canvas.closest(".deck-report") || document.body || document.documentElement;
  const rootStyle = getComputedStyle(themeRoot);
  const tickColor = rootStyle.getPropertyValue("--text-dim").trim() || "#64748b";
  const gridColor = rootStyle.getPropertyValue("--border").trim() || "rgba(148, 163, 184, 0.28)";
  const tooltipBg = rootStyle.getPropertyValue("--bg-card").trim() || "rgba(15, 23, 42, 0.92)";
  const tooltipText = rootStyle.getPropertyValue("--text").trim() || "#ffffff";
  const tooltipMuted = rootStyle.getPropertyValue("--text-dim").trim() || "#cbd5e1";
  const valuePrefix = ${jsString(chart.valuePrefix)};
  const valueSuffix = ${jsString(chart.valueSuffix)};
  const valueFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const formatTooltipValue = (value) => {
    const numeric = Number(value);
    const formatted = Number.isFinite(numeric) ? valueFormatter.format(numeric) : String(value ?? "");
    return valuePrefix + formatted + valueSuffix;
  };
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

function renderReportAreaChartScript(chart, context = {}) {
  const palette = chart.colors.length ? chart.colors : reportChartPalette(context.brand)
  const primaryColor = normalizeChartColor(palette[0]) || '#0F82F5'
  const fillColor = hexToRgba(primaryColor, 0.24)

  return `(() => {
  const target = document.getElementById(${jsString(chart.id)});
  const themeRoot = target.closest(".deck-report") || document.body || document.documentElement;
  const rootStyle = getComputedStyle(themeRoot);
  const tickColor = rootStyle.getPropertyValue("--text-dim").trim() || "#64748b";
  const gridColor = rootStyle.getPropertyValue("--border").trim() || "rgba(148, 163, 184, 0.28)";
  const tooltipBg = rootStyle.getPropertyValue("--bg-card").trim() || "rgba(15, 23, 42, 0.92)";
  const textColor = rootStyle.getPropertyValue("--text").trim() || "#0f172a";
  const valuePrefix = ${jsString(chart.valuePrefix)};
  const valueSuffix = ${jsString(chart.valueSuffix)};
  const valueFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const formatTooltipValue = (value) => {
    const numeric = Number(value);
    const formatted = Number.isFinite(numeric) ? valueFormatter.format(numeric) : String(value ?? "");
    return valuePrefix + formatted + valueSuffix;
  };
  const parseX = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed;
  };
  const data = ${jsValue(chart.points)}.map((point) => ({
    x: parseX(point.x),
    label: point.x,
    y: Number(point.y)
  }));
  const tickStep = Math.max(1, Math.ceil(data.length / 6));
  const xTickValues = data
    .filter((point, index) => data.length <= 8 || index === 0 || index === data.length - 1 || index % tickStep === 0)
    .map((point) => point.x);
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
    x: {
      grid: true,
      label: null,
      ticks: xTickValues,
      tickFormat: (value) => value instanceof Date ? value.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : String(value)
    },
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

function clampPercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, numeric))
}
