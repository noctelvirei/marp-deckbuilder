import { createRequire as __deckbuilderCreateRequire } from "node:module";
import { fileURLToPath as __deckbuilderFileURLToPath } from "node:url";
import { dirname as __deckbuilderDirname } from "node:path";
const require = __deckbuilderCreateRequire(import.meta.url);
const __filename = __deckbuilderFileURLToPath(import.meta.url);
const __dirname = __deckbuilderDirname(__filename);

// src/resources.js
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
var imageExtensions = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
function normalizeResourceReference(value, options = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(data|https?|file):/i.test(raw)) return raw;
  if (raw.startsWith("resource:")) return raw;
  const normalized = raw.replace(/\\/g, "/");
  const defaultFolder = options.defaultFolder || "";
  const resourcePath = defaultFolder && !normalized.includes("/") ? `${defaultFolder}/${normalized}` : normalized;
  return `resource:${resourcePath}`;
}
function resolveResourceFile(value, resourcesDir = "resources") {
  const rawValue = String(value || "").trim();
  if (!rawValue) return null;
  if (/^(data|https?|file):/i.test(rawValue)) {
    throw new Error(
      `Unsupported resource URL "${rawValue}". Use files under the resources folder so the deck can embed them.`
    );
  }
  const root = path.resolve(resourcesDir);
  const resourcePath = rawValue.startsWith("resource:") ? rawValue.slice("resource:".length) : rawValue;
  const normalized = resourcePath.replace(/\\/g, "/");
  if (!normalized || normalized.includes("\0")) {
    throw new Error(`Invalid resource reference "${rawValue}".`);
  }
  const basePath = path.resolve(root, normalized);
  if (!isInsideOrSame(root, basePath)) {
    throw new Error(
      `Resource reference "${rawValue}" resolves outside the resources folder: ${basePath}`
    );
  }
  const candidates = candidatePaths(basePath);
  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) throw missingResourceError(rawValue, candidates);
  return {
    path: resolved,
    relativePath: normalizeResourcePath(path.relative(root, resolved))
  };
}
function resolveSurfaceResourceFile(value, resourcesDir = "resources", surface = "") {
  const rawValue = String(value || "").trim();
  if (!rawValue || !surface) return resolveResourceFile(value, resourcesDir);
  const variant = surfaceResourceCandidates(rawValue, surface);
  for (const candidate of variant) {
    try {
      return resolveResourceFile(candidate, resourcesDir);
    } catch {
    }
  }
  return resolveResourceFile(value, resourcesDir);
}
function resourceToDataUri(filePath) {
  const bytes = readFileSync(filePath);
  return `data:${mimeType(filePath)};base64,${bytes.toString("base64")}`;
}
function normalizeResourcePath(value) {
  return String(value || "").replace(/\\/g, "/");
}
function candidatePaths(basePath) {
  if (path.extname(basePath)) return [basePath];
  return imageExtensions.map((extension) => `${basePath}${extension}`);
}
function surfaceResourceCandidates(value, surface) {
  const token = String(surface || "").trim().toLowerCase();
  if (token !== "dark" && token !== "light") return [];
  const prefix = value.startsWith("resource:") ? "resource:" : "";
  const resourcePath = prefix ? value.slice(prefix.length) : value;
  const extension = path.extname(resourcePath);
  const withoutExtension = extension ? resourcePath.slice(0, -extension.length) : resourcePath;
  const suffixes = token === "dark" ? [".dark", "-dark", ".on-dark", "-on-dark"] : [".light", "-light", ".on-light", "-on-light"];
  if (!extension) {
    return suffixes.map((suffix) => `${prefix}${withoutExtension}${suffix}`);
  }
  const extensions = [
    extension,
    ...imageExtensions.filter((candidate) => candidate !== extension.toLowerCase())
  ];
  return suffixes.flatMap(
    (suffix) => extensions.map((candidateExtension) => `${prefix}${withoutExtension}${suffix}${candidateExtension}`)
  );
}
function missingResourceError(value, candidates) {
  return new Error(
    `Resource not found: ${value}. Looked for:
${candidates.map((candidate) => `  - ${candidate}`).join("\n")}`
  );
}
function isInsideOrSame(root, candidate) {
  const relative = path.relative(root, candidate);
  return !relative || !relative.startsWith("..") && !path.isAbsolute(relative);
}
function mimeType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

// src/components/utils.js
function splitCsv(value = "") {
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}
function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
function formatNumber(value) {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? value.toLocaleString("en-GB") : value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

// src/components/boxplot.js
var DEFAULT_COLORS = {
  light: {
    grid: "#e8eef7",
    axis: "#9aa8bd",
    text: "#555555",
    box: "#0f82f5",
    fill: "#bfe0ff",
    median: "#ff9f51"
  },
  dark: {
    grid: "#1e3a5f",
    axis: "#8a95a8",
    text: "#c8d8f0",
    box: "#59d6fd",
    fill: "#123c66",
    median: "#ff9f51"
  }
};
function renderBoxplotSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS[mode],
    grid: options.gridColor || DEFAULT_COLORS[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS[mode].axis,
    text: options.textColor || DEFAULT_COLORS[mode].text,
    box: options.boxColor || DEFAULT_COLORS[mode].box,
    fill: options.fillColor || DEFAULT_COLORS[mode].fill,
    median: options.medianColor || DEFAULT_COLORS[mode].median
  };
  const color = (name) => useVariables ? `var(--deck-boxplot-${name}, ${colors[name]})` : colors[name];
  const geometry = boxplotGeometry(chart);
  const grid = geometry.ticks.map((tick) => {
    const y = geometry.yFor(tick);
    return `<line class="deck-boxplot-grid" x1="${geometry.margin.left}" y1="${round(y)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(y)}"></line>
  <text class="deck-boxplot-tick" x="${geometry.margin.left - 14}" y="${round(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  const boxes = geometry.items.map((item) => `<g class="deck-boxplot-item" transform="translate(${round(item.x)} 0)">
    <line class="deck-boxplot-whisker" x1="0" y1="${round(item.minY)}" x2="0" y2="${round(item.maxY)}"></line>
    <line class="deck-boxplot-whisker" x1="${round(-item.capW / 2)}" y1="${round(item.minY)}" x2="${round(item.capW / 2)}" y2="${round(item.minY)}"></line>
    <line class="deck-boxplot-whisker" x1="${round(-item.capW / 2)}" y1="${round(item.maxY)}" x2="${round(item.capW / 2)}" y2="${round(item.maxY)}"></line>
    <rect class="deck-boxplot-box" x="${round(-item.boxW / 2)}" y="${round(item.boxY)}" width="${round(item.boxW)}" height="${round(item.boxH)}" rx="5"><title>${escapeHtml(item.title)}</title></rect>
    <line class="deck-boxplot-median" x1="${round(-item.boxW / 2)}" y1="${round(item.medianY)}" x2="${round(item.boxW / 2)}" y2="${round(item.medianY)}"></line>
    <text class="deck-boxplot-label" x="0" y="${geometry.height - 24}" text-anchor="middle">${escapeHtml(item.label)}</text>
  </g>`).join("\n  ");
  return `<svg class="deck-chart-boxplot-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Boxplot chart")}">
  <style>
    .deck-boxplot-grid { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-boxplot-axis { stroke: ${color("axis")}; stroke-width: 1.4; }
    .deck-boxplot-whisker { stroke: ${color("box")}; stroke-width: 2; stroke-linecap: round; }
    .deck-boxplot-box { fill: ${color("fill")}; stroke: ${color("box")}; stroke-width: 2; }
    .deck-boxplot-median { stroke: ${color("median")}; stroke-width: 3; stroke-linecap: round; }
    .deck-boxplot-label, .deck-boxplot-tick, .deck-boxplot-axis-label { fill: ${color("text")}; font: 500 12px "Poppins", "Aptos", sans-serif; }
  </style>
  ${grid}
  <line class="deck-boxplot-axis" x1="${geometry.margin.left}" y1="${round(geometry.height - geometry.margin.bottom)}" x2="${round(geometry.width - geometry.margin.right)}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-boxplot-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round(geometry.height - geometry.margin.bottom)}"></line>
  ${boxes}
  <text class="deck-boxplot-axis-label" transform="translate(18 ${round(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || chart.series || "Value")}</text>
</svg>`;
}
function boxplotStats(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1]
  };
}
function boxplotGeometry(chart) {
  const width = 760;
  const height = 330;
  const margin = { top: 30, right: 30, bottom: 54, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const stats = chart.matrix.map((row, index) => ({
    label: chart.labels[index] || "",
    ...boxplotStats(row)
  }));
  const rawMin = Math.min(...stats.map((item) => item.min));
  const rawMax = Math.max(...stats.map((item) => item.max));
  let [minY, maxY] = paddedExtent(rawMin, rawMax);
  if (minY === maxY) maxY = minY + 1;
  const yFor = (value) => margin.top + plotHeight - (value - minY) / (maxY - minY) * plotHeight;
  const band = plotWidth / Math.max(1, stats.length);
  const boxW = Math.min(74, band * 0.42);
  const capW = Math.min(54, boxW * 0.72);
  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    yFor,
    ticks: tickValues(minY, maxY),
    items: stats.map((item, index) => {
      const q3Y = yFor(item.q3);
      const q1Y = yFor(item.q1);
      return {
        ...item,
        x: margin.left + index * band + band / 2,
        minY: yFor(item.min),
        maxY: yFor(item.max),
        medianY: yFor(item.median),
        boxY: Math.min(q1Y, q3Y),
        boxH: Math.max(3, Math.abs(q1Y - q3Y)),
        boxW,
        capW,
        title: `${item.label}: min ${formatNumber(item.min)}, Q1 ${formatNumber(item.q1)}, median ${formatNumber(item.median)}, Q3 ${formatNumber(item.q3)}, max ${formatNumber(item.max)}`
      };
    })
  };
}
function quantile(values, fraction) {
  if (!values.length) return 0;
  const position = (values.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return values[lower];
  const weight = position - lower;
  return values[lower] * (1 - weight) + values[upper] * weight;
}
function paddedExtent(min, max) {
  if (min === max) return [min, min + 1];
  const padding = (max - min) * 0.12;
  return [min - padding, max + padding];
}
function tickValues(min, max) {
  const ticks = [];
  const count = 4;
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + (max - min) / count * index);
  }
  return ticks;
}
function round(value) {
  return Math.round(value * 10) / 10;
}

// src/components/bullet.js
var DEFAULT_COLORS2 = {
  light: {
    grid: "#e8eef7",
    axis: "#9aa8bd",
    text: "#555555",
    bar: "#0f82f5",
    onBar: "#ffffff",
    target: "#ff9f51",
    track: "#eef6fe"
  },
  dark: {
    grid: "#1e3a5f",
    axis: "#8a95a8",
    text: "#c8d8f0",
    bar: "#0f82f5",
    onBar: "#ffffff",
    target: "#ff9f51",
    track: "#132747"
  }
};
function renderBulletSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS2[mode],
    grid: options.gridColor || DEFAULT_COLORS2[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS2[mode].axis,
    text: options.textColor || DEFAULT_COLORS2[mode].text,
    bar: options.barColor || DEFAULT_COLORS2[mode].bar,
    onBar: options.onBarColor || DEFAULT_COLORS2[mode].onBar,
    target: options.targetColor || DEFAULT_COLORS2[mode].target,
    track: options.trackColor || DEFAULT_COLORS2[mode].track
  };
  const color = (name) => useVariables ? `var(--deck-bullet-${name}, ${colors[name]})` : colors[name];
  const geometry = bulletGeometry(chart);
  const grid = geometry.ticks.map((tick) => {
    const x = geometry.xFor(tick);
    return `<line class="deck-bullet-grid" x1="${round2(x)}" y1="${geometry.margin.top}" x2="${round2(x)}" y2="${round2(geometry.height - geometry.margin.bottom)}"></line>
  <text class="deck-bullet-tick" x="${round2(x)}" y="${geometry.height - 12}" text-anchor="middle">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  const rows = geometry.rows.map((row) => `<g class="deck-bullet-row" transform="translate(0 ${round2(row.y)})">
    <text class="deck-bullet-label" x="${geometry.margin.left - 16}" y="${round2(row.center + 5)}" text-anchor="end">${escapeHtml(row.label)}</text>
    <rect class="deck-bullet-track" x="${geometry.margin.left}" y="${round2(row.center - row.trackH / 2)}" width="${geometry.plotWidth}" height="${round2(row.trackH)}" rx="8"></rect>
    <rect class="deck-bullet-bar" x="${geometry.margin.left}" y="${round2(row.center - row.barH / 2)}" width="${round2(row.barW)}" height="${round2(row.barH)}" rx="6"></rect>
    <line class="deck-bullet-target" x1="${round2(row.targetX)}" y1="${round2(row.center - row.trackH / 2 - 6)}" x2="${round2(row.targetX)}" y2="${round2(row.center + row.trackH / 2 + 6)}"></line>
    <text class="deck-bullet-value${row.valueInside ? " deck-bullet-value-inside" : ""}" x="${round2(row.valueX)}" y="${round2(row.center + 5)}" text-anchor="${row.valueAnchor}">${escapeHtml(formatNumber(row.value))}</text>
  </g>`).join("\n  ");
  return `<svg class="deck-chart-bullet-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Bullet chart")}">
  <style>
    .deck-bullet-grid { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-bullet-axis { stroke: ${color("axis")}; stroke-width: 1.4; }
    .deck-bullet-track { fill: ${color("track")}; }
    .deck-bullet-bar { fill: ${color("bar")}; }
    .deck-bullet-target { stroke: ${color("target")}; stroke-width: 4; stroke-linecap: round; }
    .deck-bullet-label, .deck-bullet-tick, .deck-bullet-value { fill: ${color("text")}; font: 500 13px "Poppins", "Aptos", sans-serif; }
    .deck-bullet-value { font-weight: 600; }
    .deck-bullet-value-inside { fill: ${color("onBar")}; }
  </style>
  ${grid}
  <line class="deck-bullet-axis" x1="${geometry.margin.left}" y1="${round2(geometry.height - geometry.margin.bottom)}" x2="${round2(geometry.width - geometry.margin.right)}" y2="${round2(geometry.height - geometry.margin.bottom)}"></line>
  ${rows}
</svg>`;
}
function bulletGeometry(chart) {
  const width = 760;
  const rowCount = Math.max(1, chart.labels.length);
  const height = Math.max(250, 108 + rowCount * 58);
  const margin = { top: 28, right: 58, bottom: 44, left: 142 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const maxValue = niceCeiling(Math.max(1, ...chart.values, ...chart.targets));
  const xFor = (value) => margin.left + Math.max(0, value) / maxValue * plotWidth;
  const rowH = plotHeight / rowCount;
  const rows = chart.labels.map((label, index) => {
    const center = rowH * index + rowH / 2;
    const value = chart.values[index] ?? 0;
    const target = chart.targets[index] ?? 0;
    const barEnd = xFor(value);
    const targetX = xFor(target);
    const valueInside = value > 0 && (Math.abs(targetX - barEnd) < 42 || barEnd > width - margin.right - 38);
    return {
      label,
      value,
      target,
      y: margin.top,
      center,
      trackH: Math.min(28, rowH * 0.42),
      barH: Math.min(18, rowH * 0.28),
      barW: Math.max(2, barEnd - margin.left),
      targetX,
      valueInside,
      valueX: valueInside ? Math.max(margin.left + 18, barEnd - 12) : Math.min(width - margin.right, barEnd + 12),
      valueAnchor: valueInside ? "end" : "start"
    };
  });
  return {
    width,
    height,
    margin,
    plotWidth,
    xFor,
    ticks: tickValues2(0, maxValue),
    rows
  };
}
function tickValues2(min, max) {
  const ticks = [];
  const count = 4;
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + (max - min) / count * index);
  }
  return ticks;
}
function niceCeiling(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}
function round2(value) {
  return Math.round(value * 10) / 10;
}

// src/components/funnel.js
var DEFAULT_COLORS3 = {
  light: {
    surface: "#ffffff",
    border: "#dedede",
    heading: "#090909",
    muted: "#666666",
    accent: "#0f82f5",
    onAccent: "#ffffff"
  },
  dark: {
    surface: "#0d1d36",
    border: "#1e3a5f",
    heading: "#ffffff",
    muted: "#8a95a8",
    accent: "#0f82f5",
    onAccent: "#ffffff"
  }
};
var STAGE_OPACITY = [1, 0.86, 0.72, 0.6, 0.5, 0.42];
function renderFunnelSvg(funnel, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS3[mode],
    accent: cssColor(options.accentColor, DEFAULT_COLORS3[mode].accent),
    onAccent: cssColor(options.onAccentColor, DEFAULT_COLORS3[mode].onAccent)
  };
  const color = (name) => useVariables ? `var(--deck-funnel-${name}, ${colors[name]})` : colors[name];
  const stages = funnelStages(funnel);
  const width = 760;
  const height = 318;
  const centerX = 380;
  const topY = 24;
  const gap = 7;
  const stageH = (height - topY - 24 - gap * Math.max(0, stages.length - 1)) / Math.max(1, stages.length);
  const segments = stages.map((stage, index) => {
    const y1 = topY + index * (stageH + gap);
    const y2 = y1 + stageH;
    const topW = stage.topWidth;
    const bottomW = stage.bottomWidth;
    const points = [
      `${round3(centerX - topW / 2)},${round3(y1)}`,
      `${round3(centerX + topW / 2)},${round3(y1)}`,
      `${round3(centerX + bottomW / 2)},${round3(y2)}`,
      `${round3(centerX - bottomW / 2)},${round3(y2)}`
    ].join(" ");
    const textY = y1 + stageH / 2;
    const opacity = STAGE_OPACITY[index] ?? STAGE_OPACITY.at(-1);
    return `<g class="deck-funnel-stage deck-funnel-stage-${index % 6}">
    <polygon class="deck-funnel-segment" points="${points}" style="opacity:${opacity}"></polygon>
    <text class="deck-funnel-stage-label" x="${centerX}" y="${round3(textY - 6)}" text-anchor="middle">${escapeHtml(stage.label)}</text>
    <text class="deck-funnel-stage-value" x="${centerX}" y="${round3(textY + 20)}" text-anchor="middle">${escapeHtml(`${formatNumber(stage.value)}${funnel.unit}`)}</text>
    <text class="deck-funnel-stage-rate" x="${round3(centerX + topW / 2 + 24)}" y="${round3(textY + 5)}">${escapeHtml(stage.rate)}</text>
  </g>`;
  }).join("\n  ");
  return `<svg class="deck-funnel-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(funnel.title || "Funnel chart")}">
  <style>
    .deck-funnel-segment { fill: ${color("accent")}; stroke: ${color("surface")}; stroke-width: 2; }
    .deck-funnel-stage-label { fill: ${color("onAccent")}; font: 600 17px "Poppins", "Aptos", sans-serif; }
    .deck-funnel-stage-value { fill: ${color("onAccent")}; font: 500 14px "Poppins", "Aptos", sans-serif; opacity: .9; }
    .deck-funnel-stage-rate { fill: ${color("muted")}; font: 500 13px "Poppins", "Aptos", sans-serif; }
  </style>
  ${segments}
</svg>`;
}
function funnelStages(funnel) {
  const maxValue = Math.max(...funnel.values, 1);
  const maxWidth = 610;
  const minWidth = 126;
  const widths = funnel.values.map((value) => {
    if (value <= 0) return minWidth;
    return Math.max(minWidth, value / maxValue * maxWidth);
  });
  return funnel.labels.map((label, index) => {
    const value = funnel.values[index] ?? 0;
    const previous = index === 0 ? value : funnel.values[index - 1] || 0;
    const rate = index === 0 || previous <= 0 ? "100%" : `${Math.round(value / previous * 100)}%`;
    return {
      label,
      value,
      rate,
      topWidth: widths[index],
      bottomWidth: widths[index + 1] ?? Math.max(minWidth, widths[index] * 0.78)
    };
  });
}
function round3(value) {
  return Math.round(value * 10) / 10;
}
function cssColor(value, fallback) {
  const raw = String(value || fallback || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`;
  return fallback;
}

// src/components/histogram.js
var DEFAULT_COLORS4 = {
  light: {
    grid: "#e8eef7",
    axis: "#9aa8bd",
    text: "#555555",
    bar: "#5d4ee8",
    barBorder: "#4637c7"
  },
  dark: {
    grid: "#1e3a5f",
    axis: "#8a95a8",
    text: "#c8d8f0",
    bar: "#6f63ff",
    barBorder: "#9aa3ff"
  }
};
function renderHistogramSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS4[mode],
    grid: options.gridColor || DEFAULT_COLORS4[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS4[mode].axis,
    text: options.textColor || DEFAULT_COLORS4[mode].text,
    bar: options.barColor || DEFAULT_COLORS4[mode].bar,
    barBorder: options.barBorderColor || DEFAULT_COLORS4[mode].barBorder
  };
  const color = (name) => useVariables ? `var(--deck-histogram-${name}, ${colors[name]})` : colors[name];
  const geometry = histogramGeometry(chart);
  const bars = geometry.bins.map((bin, index) => {
    const label = `${formatBinLabel(bin.start)}-${formatBinLabel(bin.end)}`;
    return `<g class="deck-histogram-bin" transform="translate(${round4(bin.x)} ${round4(bin.y)})">
    <rect class="deck-histogram-bar" width="${round4(bin.w)}" height="${round4(bin.h)}" rx="4"><title>${escapeHtml(label)}: ${escapeHtml(formatNumber(bin.count))}</title></rect>
    ${bin.count > 0 ? `<text class="deck-histogram-count" x="${round4(bin.w / 2)}" y="-8" text-anchor="middle">${escapeHtml(formatNumber(bin.count))}</text>` : ""}
    ${index % geometry.labelStep === 0 ? `<text class="deck-histogram-label" x="${round4(bin.w / 2)}" y="${round4(geometry.axisLabelY - bin.y)}" text-anchor="middle">${escapeHtml(label)}</text>` : ""}
  </g>`;
  }).join("\n  ");
  const grid = geometry.ticks.map((tick) => {
    const y = geometry.yFor(tick);
    return `<line class="deck-histogram-grid" x1="${geometry.margin.left}" y1="${round4(y)}" x2="${round4(geometry.width - geometry.margin.right)}" y2="${round4(y)}"></line>
  <text class="deck-histogram-tick" x="${geometry.margin.left - 14}" y="${round4(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  return `<svg class="deck-chart-histogram-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Histogram chart")}">
  <style>
    .deck-histogram-grid { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-histogram-axis { stroke: ${color("axis")}; stroke-width: 1.4; }
    .deck-histogram-bar { fill: ${color("bar")}; stroke: ${color("barBorder")}; stroke-width: 1; opacity: .88; }
    .deck-histogram-label, .deck-histogram-tick, .deck-histogram-count, .deck-histogram-axis-label { fill: ${color("text")}; font: 500 12px "Poppins", "Aptos", sans-serif; }
    .deck-histogram-count { font-weight: 700; }
  </style>
  ${grid}
  <line class="deck-histogram-axis" x1="${geometry.margin.left}" y1="${round4(geometry.height - geometry.margin.bottom)}" x2="${round4(geometry.width - geometry.margin.right)}" y2="${round4(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-histogram-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round4(geometry.height - geometry.margin.bottom)}"></line>
  ${bars}
  <text class="deck-histogram-axis-label" x="${round4(geometry.margin.left + geometry.plotWidth / 2)}" y="${geometry.height - 8}" text-anchor="middle">${escapeHtml(chart.xAxisLabel || "Range")}</text>
  <text class="deck-histogram-axis-label" transform="translate(18 ${round4(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || "Count")}</text>
</svg>`;
}
function histogramBins(values, binCount) {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue;
  const width = span === 0 ? 1 : span / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = span === 0 ? minValue - 0.5 + index * width : minValue + index * width;
    const end = start + width;
    return { start, end, count: 0 };
  });
  values.forEach((value) => {
    const rawIndex = span === 0 ? Math.floor(binCount / 2) : Math.floor((value - minValue) / width);
    const index = Math.max(0, Math.min(binCount - 1, rawIndex));
    bins[index].count += 1;
  });
  return bins;
}
function histogramGeometry(chart) {
  const width = 760;
  const height = 330;
  const margin = { top: 34, right: 30, bottom: 70, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const bins = histogramBins(chart.values, chart.binCount);
  const maxCount = niceCeiling2(Math.max(1, ...bins.map((bin) => bin.count)));
  const yFor = (value) => margin.top + plotHeight - value / maxCount * plotHeight;
  const band = plotWidth / Math.max(1, bins.length);
  const gap = Math.min(5, band * 0.18);
  const barW = Math.max(2, band - gap);
  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    yFor,
    ticks: tickValues3(0, maxCount),
    labelStep: Math.max(1, Math.ceil(bins.length / 6)),
    axisLabelY: height - margin.bottom + 28,
    bins: bins.map((bin, index) => {
      const x = margin.left + index * band + gap / 2;
      const y = yFor(bin.count);
      return {
        ...bin,
        x,
        y,
        w: barW,
        h: Math.max(2, margin.top + plotHeight - y)
      };
    })
  };
}
function tickValues3(min, max) {
  const ticks = [];
  const count = 4;
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + (max - min) / count * index);
  }
  return ticks;
}
function niceCeiling2(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}
function formatBinLabel(value) {
  if (!Number.isFinite(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
function round4(value) {
  return Math.round(value * 10) / 10;
}

// src/components/impact-radar.js
var DEFAULT_COLORS5 = {
  light: {
    surface: "#ffffff",
    panel: "#fdfdfd",
    border: "#dedede",
    heading: "#090909",
    body: "#444444",
    muted: "#666666",
    track: "#eef6fe",
    radarGrid: "#dedede",
    radarFill: "rgba(15, 130, 245, .2)",
    radarStroke: "#0f82f5",
    fills: ["#0f82f5", "#5143d5", "#66cc8e", "#59d6fd", "#f9935b", "#fbc546"]
  },
  dark: {
    surface: "#071228",
    panel: "#0d1d36",
    border: "#1e3a5f",
    heading: "#ffffff",
    body: "#c8d8f0",
    muted: "#8a95a8",
    track: "#071228",
    radarGrid: "#1e3a5f",
    radarFill: "rgba(89, 214, 253, .22)",
    radarStroke: "#59d6fd",
    fills: ["#0f82f5", "#5143d5", "#66cc8e", "#59d6fd", "#f9935b", "#fbc546"]
  }
};
function renderImpactRadarSvg(impactRadar, options = {}) {
  const animate = options.animate !== false;
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = DEFAULT_COLORS5[mode];
  const color = (name) => useVariables ? `var(--deck-impact-radar-${name}, ${colors[name]})` : colors[name];
  const fillColor = (index) => useVariables ? `var(--deck-impact-radar-fill-${index % colors.fills.length}, ${colors.fills[index % colors.fills.length]})` : colors.fills[index % colors.fills.length];
  const bars = renderBars(impactRadar, fillColor, animate);
  const radar = renderRadar(impactRadar, animate);
  return `<svg class="deck-impact-radar-svg" viewBox="0 0 920 360" role="img" aria-label="${escapeAttr(impactRadar.title || "Impact radar")}">
  <style>
    .deck-impact-radar-surface { fill: ${color("surface")}; }
    .deck-impact-radar-panel { fill: ${color("panel")}; stroke: ${color("border")}; }
    .deck-impact-radar-heading { fill: ${color("heading")}; font: 500 24px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-label { fill: ${color("heading")}; font: 15px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-value { fill: ${color("heading")}; font: 500 15px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-muted { fill: ${color("muted")}; font: 13px "Poppins", "Aptos", sans-serif; }
    .deck-impact-radar-track { fill: ${color("track")}; }
    .deck-impact-radar-grid { fill: none; stroke: ${color("radarGrid")}; }
    .deck-impact-radar-shape { fill: ${color("radarFill")}; stroke: ${color("radarStroke")}; stroke-width: 5; }
    .deck-impact-radar-bar-fill { transform-box: fill-box; transform-origin: left center; animation: deck-impact-radar-fill-in 800ms ease-out both; }
    .deck-impact-radar-shape-animated { opacity: 0; animation: deck-impact-radar-fade-in 800ms ease-out 240ms both; }
    @keyframes deck-impact-radar-fill-in { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes deck-impact-radar-fade-in { from { opacity: 0; } to { opacity: 1; } }
  </style>
  <rect class="deck-impact-radar-surface" x="0" y="0" width="920" height="360" rx="0"></rect>
  <rect class="deck-impact-radar-panel" x="18" y="18" width="884" height="324"></rect>
  <text class="deck-impact-radar-heading" x="50" y="64">${escapeHtml(impactRadar.barTitle)}</text>
  ${bars}
  <text class="deck-impact-radar-heading" x="575" y="64">${escapeHtml(impactRadar.radarTitle)}</text>
  ${radar}
</svg>`;
}
function renderBars(impactRadar, fillColor, animate) {
  const rowStep = Math.min(50, 190 / Math.max(impactRadar.labels.length - 1, 1));
  return impactRadar.labels.map((label, index) => {
    const value = impactRadar.values[index] ?? 0;
    const width = Math.max(2, Math.round(value / 100 * 250));
    const y = 104 + index * rowStep;
    const animationAttrs = animate ? ` class="deck-impact-radar-bar-fill" style="animation-delay: ${index * 80}ms;"` : "";
    return `<g>
    <text class="deck-impact-radar-label" x="50" y="${y + 16}">${escapeHtml(label)}</text>
    <rect class="deck-impact-radar-track" x="178" y="${y}" width="250" height="18"></rect>
    <rect${animationAttrs} x="178" y="${y}" width="${width}" height="18" fill="${fillColor(index)}"></rect>
    <text class="deck-impact-radar-value" x="446" y="${y + 16}">${escapeHtml(formatNumber(value))}${escapeHtml(impactRadar.unit)}</text>
  </g>`;
  }).join("\n");
}
function renderRadar(impactRadar, animate) {
  const center = { x: 705, y: 198 };
  const radius = 96;
  const grid = [1, 2 / 3, 1 / 3].map((scale) => `<polygon class="deck-impact-radar-grid" points="${radarPoints(impactRadar.labels.length, center, radius * scale).join(" ")}"></polygon>`).join("\n    ");
  const axes = radarPointObjects(impactRadar.labels.length, center, radius).map((point) => `<line class="deck-impact-radar-grid" x1="${center.x}" y1="${center.y}" x2="${point.x}" y2="${point.y}"></line>`).join("\n    ");
  const labels = radarPointObjects(impactRadar.labels.length, center, radius + 28).map((point, index) => {
    const anchor = point.x < center.x - 12 ? "end" : point.x > center.x + 12 ? "start" : "middle";
    return `<text class="deck-impact-radar-label" x="${point.x}" y="${point.y + 5}" text-anchor="${anchor}">${escapeHtml(impactRadar.labels[index])}</text>`;
  }).join("\n    ");
  const shapePoints = impactRadar.radarValues.map((value, index) => radarPoint(index, impactRadar.radarValues.length, center, radius * (value / 100))).map((point) => `${point.x},${point.y}`).join(" ");
  const animationClass = animate ? " deck-impact-radar-shape-animated" : "";
  return `<g>
    ${grid}
    ${axes}
    <polygon class="deck-impact-radar-shape${animationClass}" points="${shapePoints}"></polygon>
    ${labels}
  </g>`;
}
function radarPoints(count, center, radius) {
  return radarPointObjects(count, center, radius).map((point) => `${point.x},${point.y}`);
}
function radarPointObjects(count, center, radius) {
  return Array.from({ length: count }, (_, index) => {
    return radarPoint(index, count, center, radius);
  });
}
function radarPoint(index, count, center, radius) {
  const angle = -Math.PI / 2 + index / count * Math.PI * 2;
  return {
    x: round5(center.x + Math.cos(angle) * radius),
    y: round5(center.y + Math.sin(angle) * radius)
  };
}
function round5(value) {
  return Math.round(value * 10) / 10;
}

// src/components/journey-path.js
var PRESETS = {
  2: [
    { x: 70, y: 260 },
    { x: 610, y: 96 }
  ],
  3: [
    { x: 58, y: 264 },
    { x: 340, y: 136 },
    { x: 610, y: 96 }
  ],
  4: [
    { x: 50, y: 264 },
    { x: 260, y: 150 },
    { x: 470, y: 150 },
    { x: 610, y: 95 }
  ],
  5: [
    { x: 50, y: 264 },
    { x: 205, y: 198 },
    { x: 340, y: 122 },
    { x: 490, y: 164 },
    { x: 610, y: 95 }
  ]
};
function renderJourneyPathSvg(journeyPath, options = {}) {
  const animate = options.animate !== false;
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = journeyPathColors(mode);
  const color = (name) => useVariables ? `var(--deck-journey-path-${name}, ${colors[name]})` : colors[name];
  const points = PRESETS[Math.min(Math.max(journeyPath.labels.length, 2), 5)];
  const path2 = pathFromPoints(points);
  const hotspotSet = new Set(journeyPath.hotspots.map((hotspot) => hotspot.toLowerCase()));
  const nodes = journeyPath.labels.map((label, index) => {
    const point = points[index];
    const note = journeyPath.notes[index] || "";
    const isHotspot = hotspotSet.has(label.toLowerCase()) || hotspotSet.has(String(index + 1));
    const labelY = point.y > 220 ? point.y + 44 : point.y - 40;
    const noteY = labelY + 18;
    const edgeText = edgeTextPlacement(point.x);
    const hotspot = isHotspot ? `<g class="journey-path-hotspot-marker" transform="translate(${point.x} ${point.y})">
  <title>Attention hotspot</title>
  <circle r="8"></circle>
  <text y="1" text-anchor="middle" dominant-baseline="middle">!</text>
</g>` : "";
    return `<g>
  <circle class="journey-path-node" cx="${point.x}" cy="${point.y}" r="22"></circle>
  ${hotspot}
  <text class="journey-path-label" x="${edgeText.x}" y="${labelY}" text-anchor="${edgeText.anchor}">${escapeHtml(label)}</text>
  ${note ? `<text class="journey-path-note" x="${edgeText.x}" y="${noteY}" text-anchor="${edgeText.anchor}">${escapeHtml(note)}</text>` : ""}
</g>`;
  }).join("\n");
  const callout = renderCallout(journeyPath);
  const lineAnimation = animate ? " stroke-dashoffset: 980; animation: journey-path-draw 1.4s ease-out 0.1s forwards;" : " stroke-dashoffset: 0;";
  const animationCss = animate ? `
    @keyframes journey-path-draw { to { stroke-dashoffset: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .journey-path-line { animation: none; stroke-dashoffset: 0; }
    }` : "";
  return `<svg class="deck-journey-path-svg" viewBox="0 0 680 360" overflow="visible" role="img" aria-label="${escapeAttr(journeyPath.title || "Journey path")}">
  <style>
    .journey-path-line { fill: none; stroke: ${color("accent")}; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 980;${lineAnimation} }
    .journey-path-node { fill: ${color("surface")}; stroke: ${color("accent")}; stroke-width: 5; }
    .journey-path-hotspot-marker circle { fill: ${color("hotspot")}; stroke: ${color("surface")}; stroke-width: 3; }
    .journey-path-hotspot-marker text { fill: #ffffff; font: 700 11px "Poppins", "Aptos", sans-serif; }
    .journey-path-label { fill: ${color("heading")}; font: 500 17px "Poppins", "Aptos", sans-serif; }
    .journey-path-callout-title { font-weight: 600; }
    .journey-path-note { fill: ${color("body")}; font: 13px "Poppins", "Aptos", sans-serif; }
    .journey-path-callout rect { fill: ${color("callout")}; stroke: ${color("accent")}; }
    ${animationCss}
  </style>
  <path class="journey-path-line" d="${escapeAttr(path2)}"></path>
  ${nodes}
  ${callout}
</svg>`;
}
function edgeTextPlacement(x) {
  if (x < 90) return { x: 24, anchor: "start" };
  if (x > 590) return { x: 656, anchor: "end" };
  return { x, anchor: "middle" };
}
function renderCallout(journeyPath) {
  if (!journeyPath.calloutTitle) return "";
  const x = 330;
  const y = 238;
  const width = 318;
  const titleLines = wrapSvgLines(journeyPath.calloutTitle, 28, 2);
  const bodyLines = wrapSvgLines(journeyPath.calloutBody, 38, 3);
  const height = Math.max(84, 44 + titleLines.length * 19 + (bodyLines.length ? 10 + bodyLines.length * 17 : 0));
  const titleText = titleLines.map((line, index) => `<text class="journey-path-label journey-path-callout-title" x="${x + 20}" y="${y + 31 + index * 19}">${escapeHtml(line)}</text>`).join("\n  ");
  const bodyStartY = y + 34 + titleLines.length * 19 + 10;
  const bodyText = bodyLines.map((line, index) => `<text class="journey-path-note" x="${x + 20}" y="${bodyStartY + index * 17}">${escapeHtml(line)}</text>`).join("\n  ");
  return `<g class="journey-path-callout">
  <rect x="${x}" y="${y}" width="${width}" height="${height}"></rect>
  ${titleText}
  ${bodyText}
</g>`;
}
function wrapSvgLines(value, maxChars, maxLines) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}
function pathFromPoints(points) {
  const [first, ...rest] = points;
  return rest.reduce((path2, point, index) => {
    const previous = index === 0 ? first : rest[index - 1];
    const dx = point.x - previous.x;
    const control1 = {
      x: previous.x + dx * 0.42,
      y: previous.y - 92 + index * 34
    };
    const control2 = {
      x: point.x - dx * 0.42,
      y: point.y + 92 - index * 28
    };
    return `${path2} C ${round6(control1.x)} ${round6(control1.y)}, ${round6(control2.x)} ${round6(control2.y)}, ${point.x} ${point.y}`;
  }, `M ${first.x} ${first.y}`);
}
function journeyPathColors(mode) {
  if (mode === "dark") {
    return {
      accent: "#0f82f5",
      body: "#c8d8f0",
      callout: "#102642",
      heading: "#ffffff",
      hotspot: "#fc5161",
      surface: "#071228"
    };
  }
  return {
    accent: "#0f82f5",
    body: "#444444",
    callout: "#eef6fe",
    heading: "#090909",
    hotspot: "#fc5161",
    surface: "#ffffff"
  };
}
function round6(value) {
  return Math.round(value * 10) / 10;
}

// src/components/pareto.js
var DEFAULT_COLORS6 = {
  light: {
    grid: "#e8eef7",
    axis: "#9aa8bd",
    text: "#555555",
    bar: "#0f82f5",
    "bar-border": "#0b67c7",
    line: "#ff9f51",
    point: "#ff9f51"
  },
  dark: {
    grid: "#1e3a5f",
    axis: "#8a95a8",
    text: "#c8d8f0",
    bar: "#59d6fd",
    "bar-border": "#9ae8ff",
    line: "#ff9f51",
    point: "#ff9f51"
  }
};
function renderParetoSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS6[mode],
    grid: options.gridColor || DEFAULT_COLORS6[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS6[mode].axis,
    text: options.textColor || DEFAULT_COLORS6[mode].text,
    bar: options.barColor || DEFAULT_COLORS6[mode].bar,
    "bar-border": options.barBorderColor || DEFAULT_COLORS6[mode]["bar-border"],
    line: options.lineColor || DEFAULT_COLORS6[mode].line,
    point: options.pointColor || DEFAULT_COLORS6[mode].point
  };
  const color = (name) => useVariables ? `var(--deck-pareto-${name}, ${colors[name]})` : colors[name];
  const geometry = paretoGeometry(chart);
  const grid = geometry.ticks.map((tick) => {
    const y = geometry.yForValue(tick);
    return `<line class="deck-pareto-grid" x1="${geometry.margin.left}" y1="${round7(y)}" x2="${round7(geometry.width - geometry.margin.right)}" y2="${round7(y)}"></line>
  <text class="deck-pareto-tick" x="${geometry.margin.left - 14}" y="${round7(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  const percentTicks = [0, 25, 50, 75, 100].map((tick) => {
    const y = geometry.yForPercent(tick);
    return `<text class="deck-pareto-percent-tick" x="${geometry.width - geometry.margin.right + 14}" y="${round7(y + 5)}">${tick}%</text>`;
  }).join("\n  ");
  const bars = geometry.items.map((item, index) => {
    const showLabel = index % geometry.labelStep === 0 || index === geometry.items.length - 1;
    const valueLabelY = Math.max(geometry.margin.top + 14, item.barY - 8);
    return `<g class="deck-pareto-item" transform="translate(${round7(item.x)} 0)">
    <rect class="deck-pareto-bar" x="0" y="${round7(item.barY)}" width="${round7(item.barW)}" height="${round7(item.barH)}" rx="5"><title>${escapeHtml(item.label)}: ${escapeHtml(formatNumber(item.value))}; cumulative ${round7(item.cumulativePercent)}%</title></rect>
    ${item.value > 0 ? `<text class="deck-pareto-value" x="${round7(item.barW / 2)}" y="${round7(valueLabelY)}" text-anchor="middle">${escapeHtml(formatNumber(item.value))}</text>` : ""}
    ${showLabel ? `<text class="deck-pareto-label" x="${round7(item.barW / 2)}" y="${geometry.height - 30}" text-anchor="middle">${escapeHtml(item.label)}</text>` : ""}
  </g>`;
  }).join("\n  ");
  const line = linePath(geometry.items.map((item) => ({ x: item.pointX, y: item.pointY })));
  const points = geometry.items.map((item) => `<circle class="deck-pareto-point" cx="${round7(item.pointX)}" cy="${round7(item.pointY)}" r="5"><title>${escapeHtml(item.label)} cumulative: ${round7(item.cumulativePercent)}%</title></circle>`).join("\n  ");
  return `<svg class="deck-chart-pareto-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Pareto chart")}">
  <style>
    .deck-pareto-grid { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-pareto-axis { stroke: ${color("axis")}; stroke-width: 1.4; }
    .deck-pareto-bar { fill: ${color("bar")}; stroke: ${color("bar-border")}; stroke-width: 1.2; opacity: .9; }
    .deck-pareto-line { fill: none; stroke: ${color("line")}; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .deck-pareto-point { fill: ${color("point")}; stroke: ${color("line")}; stroke-width: 2; }
    .deck-pareto-label, .deck-pareto-value, .deck-pareto-tick, .deck-pareto-percent-tick, .deck-pareto-axis-label { fill: ${color("text")}; font: 500 12px "Poppins", "Aptos", sans-serif; }
    .deck-pareto-value { font-weight: 700; }
  </style>
  ${grid}
  ${percentTicks}
  <line class="deck-pareto-axis" x1="${geometry.margin.left}" y1="${round7(geometry.height - geometry.margin.bottom)}" x2="${round7(geometry.width - geometry.margin.right)}" y2="${round7(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-pareto-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round7(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-pareto-axis" x1="${round7(geometry.width - geometry.margin.right)}" y1="${geometry.margin.top}" x2="${round7(geometry.width - geometry.margin.right)}" y2="${round7(geometry.height - geometry.margin.bottom)}"></line>
  ${bars}
  <path class="deck-pareto-line" d="${line}"></path>
  ${points}
  <text class="deck-pareto-axis-label" transform="translate(18 ${round7(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || chart.series || "Value")}</text>
  <text class="deck-pareto-axis-label" transform="translate(${geometry.width - 18} ${round7(geometry.margin.top + geometry.plotHeight / 2)}) rotate(90)" text-anchor="middle">Cumulative %</text>
</svg>`;
}
function paretoRows(chart) {
  return chart.labels.map((label, index) => ({
    label,
    value: chart.values[index] ?? 0,
    originalIndex: index
  })).sort((left, right) => right.value - left.value || left.originalIndex - right.originalIndex);
}
function paretoGeometry(chart) {
  const width = 760;
  const height = 330;
  const margin = { top: 34, right: 70, bottom: 70, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rows = paretoRows(chart);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const maxValue = niceCeiling3(Math.max(1, ...rows.map((row) => row.value)));
  const yForValue = (value) => margin.top + plotHeight - value / maxValue * plotHeight;
  const yForPercent = (percent) => margin.top + plotHeight - percent / 100 * plotHeight;
  const band = plotWidth / Math.max(1, rows.length);
  const gap = Math.min(9, band * 0.22);
  const barW = Math.max(4, band - gap);
  let cumulative = 0;
  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    yForValue,
    yForPercent,
    ticks: tickValues4(0, maxValue),
    labelStep: Math.max(1, Math.ceil(rows.length / 7)),
    items: rows.map((row, index) => {
      cumulative += row.value;
      const barY = yForValue(row.value);
      const x = margin.left + index * band + gap / 2;
      const cumulativePercent = total > 0 ? cumulative / total * 100 : 0;
      return {
        ...row,
        x,
        barW,
        barY,
        barH: row.value > 0 ? Math.max(2, margin.top + plotHeight - barY) : 0,
        pointX: x + barW / 2,
        pointY: yForPercent(cumulativePercent),
        cumulativePercent
      };
    })
  };
}
function linePath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${round7(point.x)} ${round7(point.y)}`).join(" ");
}
function tickValues4(min, max) {
  const ticks = [];
  const count = 4;
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + (max - min) / count * index);
  }
  return ticks;
}
function niceCeiling3(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}
function round7(value) {
  return Math.round(value * 10) / 10;
}

// src/components/sankey.js
var DEFAULT_COLORS7 = {
  light: {
    grid: "#d8e2f0",
    text: "#333333",
    muted: "#666666",
    "label-halo": "#fdfdfd",
    linkOpacity: "0.36",
    nodes: ["#0f82f5", "#4cc9f0", "#5d4ee8", "#ff9f51", "#2fc27d", "#ff5c7a"]
  },
  dark: {
    grid: "#31557e",
    text: "#f4f8ff",
    muted: "#c8d8f0",
    "label-halo": "#1d1e29",
    linkOpacity: "0.48",
    nodes: ["#59d6fd", "#0f82f5", "#8b7cff", "#ff9f51", "#66cc8e", "#ff5c7a"]
  }
};
function renderSankeySvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const defaults = DEFAULT_COLORS7[mode];
  const colors = {
    grid: options.gridColor || defaults.grid,
    text: options.textColor || defaults.text,
    muted: options.mutedColor || options.textColor || defaults.muted,
    "label-halo": options.labelHaloColor || defaults["label-halo"],
    linkOpacity: options.linkOpacity || defaults.linkOpacity,
    nodes: options.palette?.length ? options.palette : defaults.nodes
  };
  const color = (name) => useVariables ? `var(--deck-sankey-${name}, ${colors[name]})` : colors[name];
  const nodeColor = (index) => {
    const fallback = colors.nodes[index % colors.nodes.length];
    return useVariables ? `var(--deck-sankey-node-${index % 6}, ${fallback})` : fallback;
  };
  const geometry = sankeyGeometry(chart);
  const links = geometry.links.map((link) => `<path class="deck-sankey-link deck-sankey-link-${link.source.index % 6}" d="${linkPath(link, geometry.nodeWidth)}" stroke="${nodeColor(link.source.index)}" stroke-width="${round8(link.width)}">
    <title>${escapeHtml(link.source.label)} to ${escapeHtml(link.target.label)}: ${escapeHtml(formatNumber(link.value))}</title>
  </path>`).join("\n  ");
  const nodes = geometry.nodes.map((node) => {
    const labelAnchor = node.depth === geometry.maxDepth ? "end" : "start";
    const labelX = node.depth === geometry.maxDepth ? -8 : geometry.nodeWidth + 8;
    return `<g class="deck-sankey-node deck-sankey-node-${node.index % 6}" transform="translate(${round8(node.x)} ${round8(node.y)})">
    <rect class="deck-sankey-node-rect" width="${geometry.nodeWidth}" height="${round8(node.height)}" rx="5" fill="${nodeColor(node.index)}"><title>${escapeHtml(node.label)}: in ${escapeHtml(formatNumber(node.incoming))}, out ${escapeHtml(formatNumber(node.outgoing))}</title></rect>
    <text class="deck-sankey-label" x="${labelX}" y="${round8(Math.max(12, node.height / 2))}" dy="0.35em" text-anchor="${labelAnchor}">${escapeHtml(truncateLabel(node.label))}</text>
  </g>`;
  }).join("\n  ");
  return `<svg class="deck-chart-sankey-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Sankey chart")}">
  <style>
    .deck-sankey-link { fill: none; stroke-linecap: round; opacity: ${color("linkOpacity")}; }
    .deck-sankey-node-rect { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-sankey-label, .deck-sankey-caption { fill: ${color("text")}; font: 700 12px "Poppins", "Aptos", sans-serif; }
    .deck-sankey-label { paint-order: stroke; stroke: ${color("label-halo")}; stroke-width: 5; stroke-linejoin: round; }
    .deck-sankey-caption { fill: ${color("muted")}; font-weight: 500; }
  </style>
  <g class="deck-sankey-links">
  ${links}
  </g>
  <g class="deck-sankey-nodes">
  ${nodes}
  </g>
  <text class="deck-sankey-caption" x="${geometry.margin.left}" y="${geometry.height - 4}">${escapeHtml(chart.series || "Flow")}</text>
</svg>`;
}
function sankeyRows(chart) {
  return chart.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.value
  }));
}
function sankeyGeometry(chart) {
  const width = 760;
  const height = 330;
  const nodeWidth = 18;
  const margin = { top: 24, right: 118, bottom: 24, left: 34 };
  const innerHeight = Math.max(120, height - margin.top - margin.bottom);
  const innerWidth = Math.max(220, width - margin.left - margin.right - nodeWidth);
  const nodeMap = /* @__PURE__ */ new Map();
  const addNode = (label) => {
    if (!nodeMap.has(label)) {
      nodeMap.set(label, {
        label,
        index: nodeMap.size,
        incoming: 0,
        outgoing: 0,
        depth: 0,
        sourceLinks: [],
        targetLinks: []
      });
    }
    return nodeMap.get(label);
  };
  const links = sankeyRows(chart).map((link) => {
    const source = addNode(link.source);
    const target = addNode(link.target);
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
  const nodes = Array.from(nodeMap.values());
  const maxDepth = Math.max(...nodes.map((node) => node.depth), 1);
  const columns = groupBy(nodes, (node) => node.depth);
  columns.forEach((column) => {
    column.sort((a, b) => Math.max(b.incoming, b.outgoing) - Math.max(a.incoming, a.outgoing));
    const gap = column.length > 1 ? 12 : 0;
    const available = Math.max(24, innerHeight - gap * Math.max(0, column.length - 1));
    const totalWeight = column.reduce((sum, node) => sum + Math.max(node.incoming, node.outgoing, 1), 0);
    const minHeight = column.length * 16 <= available ? 16 : Math.max(6, available / Math.max(1, column.length));
    let y = margin.top;
    column.forEach((node) => {
      const weight = Math.max(node.incoming, node.outgoing, 1);
      node.x = margin.left + node.depth / maxDepth * innerWidth;
      node.y = y;
      node.height = Math.max(minHeight, weight / Math.max(totalWeight, 1) * available);
      y += node.height + gap;
    });
  });
  const maxColumnWeight = Math.max(
    ...Array.from(
      columns.values(),
      (column) => column.reduce((sum, node) => sum + Math.max(node.incoming, node.outgoing, 1), 0)
    ),
    1
  );
  const linkScale = innerHeight / maxColumnWeight;
  links.forEach((link) => {
    const maxLinkWidth = Math.max(2, Math.min(link.source.height, link.target.height, innerHeight * 0.24));
    link.width = Math.min(maxLinkWidth, Math.max(2, link.value * linkScale));
  });
  nodes.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    node.targetLinks.sort((a, b) => a.source.y - b.source.y);
    let sourceOffset = Math.max(0, (node.height - totalLinkWidth(node.sourceLinks)) / 2);
    node.sourceLinks.forEach((link) => {
      link.y0 = node.y + Math.min(node.height - link.width / 2, sourceOffset + link.width / 2);
      sourceOffset += link.width;
    });
    let targetOffset = Math.max(0, (node.height - totalLinkWidth(node.targetLinks)) / 2);
    node.targetLinks.forEach((link) => {
      link.y1 = node.y + Math.min(node.height - link.width / 2, targetOffset + link.width / 2);
      targetOffset += link.width;
    });
  });
  return {
    width,
    height,
    margin,
    nodeWidth,
    maxDepth,
    nodes,
    links
  };
}
function linkPath(link, nodeWidth) {
  const x0 = link.source.x + nodeWidth;
  const x1 = link.target.x;
  const mid = x0 + (x1 - x0) * 0.5;
  return `M${round8(x0)},${round8(link.y0)}C${round8(mid)},${round8(link.y0)} ${round8(mid)},${round8(link.y1)} ${round8(x1)},${round8(link.y1)}`;
}
function totalLinkWidth(links) {
  return links.reduce((sum, link) => sum + link.width, 0);
}
function groupBy(items, keyFor) {
  const groups = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    const key = keyFor(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
}
function truncateLabel(label) {
  const value = String(label || "");
  return value.length > 18 ? `${value.slice(0, 16).trim()}...` : value;
}
function round8(value) {
  return Math.round(value * 10) / 10;
}

// src/components/treemap.js
function treemapRects(items, box, gap = 4) {
  const normalized = items.map((item, index) => ({
    ...item,
    index,
    value: Math.max(0, Number(item.value) || 0)
  })).filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  return binaryTreemap(normalized, box, gap).sort((a, b) => a.index - b.index);
}
function binaryTreemap(items, box, gap) {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], ...insetBox(box, gap / 2) }];
  const total = sumValues(items);
  const splitIndex = balancedSplitIndex(items, total);
  const leftItems = items.slice(0, splitIndex);
  const rightItems = items.slice(splitIndex);
  const leftTotal = sumValues(leftItems);
  const ratio = total > 0 ? leftTotal / total : 0.5;
  if (box.w >= box.h) {
    const leftW = box.w * ratio;
    return [
      ...binaryTreemap(leftItems, { ...box, w: leftW }, gap),
      ...binaryTreemap(rightItems, { x: box.x + leftW, y: box.y, w: box.w - leftW, h: box.h }, gap)
    ];
  }
  const topH = box.h * ratio;
  return [
    ...binaryTreemap(leftItems, { ...box, h: topH }, gap),
    ...binaryTreemap(rightItems, { x: box.x, y: box.y + topH, w: box.w, h: box.h - topH }, gap)
  ];
}
function balancedSplitIndex(items, total) {
  let running = 0;
  let bestIndex = 1;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let index = 1; index < items.length; index += 1) {
    running += items[index - 1].value;
    const delta = Math.abs(total / 2 - running);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = index;
    }
  }
  return bestIndex;
}
function sumValues(items) {
  return items.reduce((sum, item) => sum + item.value, 0);
}
function insetBox(box, inset) {
  return {
    x: round9(box.x + inset),
    y: round9(box.y + inset),
    w: round9(Math.max(0, box.w - inset * 2)),
    h: round9(Math.max(0, box.h - inset * 2))
  };
}
function round9(value) {
  return Number(value.toFixed(2));
}

// src/components/waterfall.js
var DEFAULT_COLORS8 = {
  light: {
    grid: "#e8eef7",
    axis: "#9aa8bd",
    text: "#555555",
    positive: "#2fc27d",
    negative: "#ff5c7a",
    connector: "#9aa8bd"
  },
  dark: {
    grid: "#1e3a5f",
    axis: "#8a95a8",
    text: "#c8d8f0",
    positive: "#2fc27d",
    negative: "#ff5c7a",
    connector: "#8a95a8"
  }
};
function renderWaterfallSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS8[mode],
    grid: options.gridColor || DEFAULT_COLORS8[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS8[mode].axis,
    text: options.textColor || DEFAULT_COLORS8[mode].text,
    positive: options.positiveColor || DEFAULT_COLORS8[mode].positive,
    negative: options.negativeColor || DEFAULT_COLORS8[mode].negative,
    connector: options.connectorColor || DEFAULT_COLORS8[mode].connector
  };
  const color = (name) => useVariables ? `var(--deck-waterfall-${name}, ${colors[name]})` : colors[name];
  const geometry = waterfallGeometry(chart);
  const bars = geometry.steps.map((step) => {
    const className = step.delta < 0 ? "negative" : "positive";
    return `<g class="deck-waterfall-step deck-waterfall-step-${className}">
    <rect class="deck-waterfall-bar deck-waterfall-bar-${className}" x="${round10(step.x)}" y="${round10(step.y)}" width="${round10(step.w)}" height="${round10(step.h)}" rx="5"></rect>
    <text class="deck-waterfall-value" x="${round10(step.x + step.w / 2)}" y="${round10(step.valueY)}" text-anchor="middle">${escapeHtml(formatDelta(step.delta))}</text>
    <text class="deck-waterfall-label" x="${round10(step.x + step.w / 2)}" y="${geometry.height - 18}" text-anchor="middle">${escapeHtml(step.label)}</text>
  </g>`;
  }).join("\n  ");
  const connectors = geometry.steps.slice(0, -1).map((step, index) => {
    const next = geometry.steps[index + 1];
    return `<line class="deck-waterfall-connector" x1="${round10(step.x + step.w)}" y1="${round10(step.endY)}" x2="${round10(next.x)}" y2="${round10(step.endY)}"></line>`;
  }).join("\n  ");
  const grid = geometry.ticks.map((tick) => {
    const y = geometry.yFor(tick);
    return `<line class="deck-waterfall-grid" x1="${geometry.margin.left}" y1="${round10(y)}" x2="${round10(geometry.width - geometry.margin.right)}" y2="${round10(y)}"></line>
  <text class="deck-waterfall-tick" x="${geometry.margin.left - 14}" y="${round10(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  return `<svg class="deck-chart-waterfall-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Waterfall chart")}">
  <style>
    .deck-waterfall-grid { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-waterfall-axis { stroke: ${color("axis")}; stroke-width: 1.4; }
    .deck-waterfall-connector { stroke: ${color("connector")}; stroke-width: 1.4; stroke-dasharray: 5 5; opacity: .86; }
    .deck-waterfall-bar-positive { fill: ${color("positive")}; }
    .deck-waterfall-bar-negative { fill: ${color("negative")}; }
    .deck-waterfall-label, .deck-waterfall-tick, .deck-waterfall-value { fill: ${color("text")}; font: 500 13px "Poppins", "Aptos", sans-serif; }
    .deck-waterfall-value { font-weight: 600; }
  </style>
  ${grid}
  <line class="deck-waterfall-axis" x1="${geometry.margin.left}" y1="${round10(geometry.zeroY)}" x2="${round10(geometry.width - geometry.margin.right)}" y2="${round10(geometry.zeroY)}"></line>
  <line class="deck-waterfall-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round10(geometry.height - geometry.margin.bottom)}"></line>
  ${connectors}
  ${bars}
</svg>`;
}
function waterfallGeometry(chart) {
  const width = 760;
  const height = 330;
  const margin = { top: 28, right: 30, bottom: 52, left: 68 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const steps = [];
  let running = 0;
  for (const [index, delta] of chart.values.entries()) {
    const start = running;
    const end = start + delta;
    running = end;
    steps.push({
      index,
      label: chart.labels[index] || "",
      delta,
      start,
      end,
      low: Math.min(start, end),
      high: Math.max(start, end)
    });
  }
  const rawMin = Math.min(0, ...steps.map((step) => step.low));
  const rawMax = Math.max(0, ...steps.map((step) => step.high));
  let [minY, maxY] = paddedExtent2(rawMin, rawMax);
  if (rawMin >= 0) minY = 0;
  if (rawMax <= 0) maxY = 0;
  if (minY === maxY) maxY = minY + 1;
  const yFor = (value) => margin.top + plotHeight - (value - minY) / (maxY - minY) * plotHeight;
  const band = plotWidth / Math.max(1, steps.length);
  const barW = Math.min(82, band * 0.58);
  const zeroY = yFor(0);
  return {
    width,
    height,
    margin,
    zeroY,
    yFor,
    ticks: tickValues5(minY, maxY),
    steps: steps.map((step) => {
      const x = margin.left + step.index * band + (band - barW) / 2;
      const y1 = yFor(step.low);
      const y2 = yFor(step.high);
      return {
        ...step,
        x,
        y: Math.min(y1, y2),
        w: barW,
        h: Math.max(2, Math.abs(y2 - y1)),
        endY: yFor(step.end),
        valueY: step.delta < 0 ? Math.max(y1, y2) + 18 : Math.min(y1, y2) - 8
      };
    })
  };
}
function paddedExtent2(min, max) {
  if (min === max) return [min, min + 1];
  const padding = (max - min) * 0.12;
  return [min - padding, max + padding];
}
function tickValues5(min, max) {
  const ticks = [];
  const count = 4;
  for (let index = 0; index <= count; index += 1) {
    ticks.push(min + (max - min) / count * index);
  }
  return ticks;
}
function formatDelta(value) {
  const formatted = formatNumber(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}
function round10(value) {
  return Math.round(value * 10) / 10;
}

export {
  splitCsv,
  cleanText,
  escapeHtml,
  escapeAttr,
  formatNumber,
  renderBoxplotSvg,
  renderBulletSvg,
  renderFunnelSvg,
  renderHistogramSvg,
  renderImpactRadarSvg,
  renderJourneyPathSvg,
  renderParetoSvg,
  renderSankeySvg,
  treemapRects,
  renderWaterfallSvg,
  normalizeResourceReference,
  resolveResourceFile,
  resolveSurfaceResourceFile,
  resourceToDataUri
};
