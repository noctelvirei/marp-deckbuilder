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

// src/charts-svg/core.js
var SVG_PALETTE = ["#0f82f5", "#59d6fd", "#5143d5", "#f9935b", "#66cc8e", "#fc5161"];
var DEFAULT_THEME = {
  dark: { heading: "#ffffff", muted: "#8a95a8", grid: "#27395a", axis: "#3a4f6f", surface: "#0d1d36", valueLabel: "#cfe5ff" },
  light: { heading: "#0b1b33", muted: "#5a6b82", grid: "#e3e9f1", axis: "#c2cddd", surface: "#ffffff", valueLabel: "#234" }
};
function normHex(value, fallback) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) return raw;
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`;
  return fallback;
}
function resolvePalette(brand = {}, override) {
  if (Array.isArray(override) && override.length) return override.map((c2, i) => normHex(c2, SVG_PALETTE[i % SVG_PALETTE.length]));
  const c = brand && brand.colors || {};
  return [
    normHex(c.blue, SVG_PALETTE[0]),
    normHex(c.cyan || c.lightBlue, SVG_PALETTE[1]),
    normHex(c.purple, SVG_PALETTE[2]),
    normHex(c.orange, SVG_PALETTE[3]),
    normHex(c.green, SVG_PALETTE[4]),
    normHex(c.red, SVG_PALETTE[5])
  ];
}
function round(n) {
  return Math.round(n * 100) / 100;
}
function niceExtent(min, max, { includeZero = false, pad = 0.12 } = {}) {
  let lo = includeZero ? Math.min(0, min) : min;
  let hi = includeZero ? Math.max(0, max) : max;
  if (lo === hi) {
    hi = lo + 1;
    lo = lo - 1;
  }
  const span = hi - lo;
  lo -= span * pad;
  hi += span * pad;
  if (includeZero) {
    if (min >= 0) lo = 0;
    if (max <= 0) hi = 0;
  }
  return [lo, hi];
}
function niceTicks(lo, hi, count = 5) {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.ceil(lo / step) * step;
  const ticks = [];
  for (let v = start; v <= hi + step * 1e-6; v += step) ticks.push(round(v));
  return ticks;
}
function smoothPath(points) {
  if (points.length < 2) return points.length ? `M ${round(points[0].x)} ${round(points[0].y)}` : "";
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const t = 0.5 / 3;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`;
  }
  return d;
}
function straightPath(points) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${round(p.x)} ${round(p.y)}`).join(" ");
}
function chartDefs(id, accent, accent2) {
  const a2 = accent2 || accent;
  return `<defs>
    <linearGradient id="${id}-area" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.42"/>
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0"/>
    </linearGradient>
    <linearGradient id="${id}-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" style="stop-color:${a2}"/>
      <stop offset="100%" style="stop-color:${accent}"/>
    </linearGradient>
    <filter id="${id}-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}
var __idSeq = 0;
function chartId(prefix = "svgc") {
  __idSeq += 1;
  return `${prefix}-${__idSeq}`;
}

// src/charts-svg/bar.js
var W = 760;
var H = 380;
function setup(options, hasLegend) {
  const mode = options.mode === "light" ? "light" : "dark";
  const theme = DEFAULT_THEME[mode];
  const useVars = options.cssVariables !== false;
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback;
  const palette = resolvePalette(options.brand, options.palette);
  const margin = { top: hasLegend ? 40 : 22, right: 28, bottom: 46, left: 58 };
  return { theme, tc, palette, margin };
}
function axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit }) {
  const grid = ticks.map((t) => {
    const y = yFor(t);
    return `<line class="dsvg-grid" x1="${round(margin.left)}" y1="${round(y)}" x2="${round(margin.left + plotW)}" y2="${round(y)}" style="stroke:${tc("grid", theme.grid)}"/>
    <text class="dsvg-ytick" x="${round(margin.left - 12)}" y="${round(y + 4)}" text-anchor="end" style="fill:${tc("muted", theme.muted)}">${escapeHtml(formatNumber(t))}${escapeHtml(unit || "")}</text>`;
  }).join("\n  ");
  const xlabels = labels.map(
    (label, i) => `<text class="dsvg-xtick" x="${round(bandCenter(i))}" y="${H - 18}" text-anchor="middle" style="fill:${tc("muted", theme.muted)}">${escapeHtml(label)}</text>`
  ).join("\n  ");
  return { grid, xlabels };
}
function legendRow(seriesNames, palette, margin, headingColor) {
  let x = margin.left;
  const y = 18;
  return seriesNames.map((name, i) => {
    const swatch = `<rect x="${round(x)}" y="${y - 10}" width="12" height="12" rx="3" style="fill:${palette[i % palette.length]}"/>`;
    const text = `<text class="dsvg-legend" x="${round(x + 17)}" y="${y}" style="fill:${headingColor}">${escapeHtml(name)}</text>`;
    x += 17 + Math.max(48, name.length * 8.2) + 18;
    return `${swatch}${text}`;
  }).join("\n  ");
}
function barRect(x, y, w, h, fill, tip) {
  const r = Math.min(5, w / 2, h);
  return `<g class="dsvg-bar" data-deck-tip="${escapeAttr(tip)}">
      <path d="M ${round(x)} ${round(y + h)} L ${round(x)} ${round(y + r)} Q ${round(x)} ${round(y)} ${round(x + r)} ${round(y)} L ${round(x + w - r)} ${round(y)} Q ${round(x + w)} ${round(y)} ${round(x + w)} ${round(y + r)} L ${round(x + w)} ${round(y + h)} Z" style="fill:${fill}"/>
    </g>`;
}
function svgWrap(kind, label, inner) {
  return `<svg class="dsvg dsvg-bar" data-deck-svgchart="${kind}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(label || "Bar chart")}">
  ${inner}
</svg>`;
}
function renderBarChartSvg(chart, options = {}) {
  const { theme, tc, palette, margin } = setup(options, false);
  const labels = chart.labels || [];
  const values = (chart.values || []).map((v) => Number(v) || 0);
  const [, hi] = niceExtent(0, Math.max(...values, 0), { includeZero: true, pad: 0.16 });
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;
  const baseY = margin.top + plotH;
  const yFor = (v) => baseY - v / hi * plotH;
  const band = plotW / Math.max(1, labels.length);
  const barW = band * 0.6;
  const bandCenter = (i) => margin.left + band * i + band / 2;
  const ticks = niceTicks(0, hi, 5);
  const accent = normHex(options.accentColor, palette[0] || SVG_PALETTE[0]);
  const bars = values.map((v, i) => {
    const x = bandCenter(i) - barW / 2;
    const y = yFor(v);
    const h = baseY - y;
    const tip = `${labels[i] || ""}: ${formatNumber(v)}${chart.unit || ""}`;
    const rect = barRect(x, y, barW, h, accent, tip);
    const valLabel = `<text class="dsvg-val" x="${round(bandCenter(i))}" y="${round(y - 8)}" text-anchor="middle" style="fill:${tc("value", theme.valueLabel)}">${escapeHtml(formatNumber(v))}${escapeHtml(chart.unit || "")}</text>`;
    return rect + "\n  " + valLabel;
  }).join("\n  ");
  const { grid, xlabels } = axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit: chart.unit });
  return svgWrap(
    "bar",
    chart.title || "Bar chart",
    `${grid}
  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baseY)}" x2="${round(margin.left + plotW)}" y2="${round(baseY)}" style="stroke:${tc("axis", theme.axis)}"/>
  ${bars}
  ${xlabels}`
  );
}
function renderGroupedBarChartSvg(chart, options = {}) {
  const { theme, tc, palette, margin } = setup(options, true);
  const labels = chart.labels || [];
  const seriesNames = chart.seriesNames || [];
  const matrix = chart.matrix || [];
  const allVals = matrix.flat().map((v) => Number(v) || 0);
  const [, hi] = niceExtent(0, Math.max(...allVals, 0), { includeZero: true, pad: 0.16 });
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;
  const baseY = margin.top + plotH;
  const yFor = (v) => baseY - v / hi * plotH;
  const band = plotW / Math.max(1, labels.length);
  const bandCenter = (i) => margin.left + band * i + band / 2;
  const groupW = band * 0.74;
  const n = Math.max(1, seriesNames.length);
  const barW = groupW / n;
  const ticks = niceTicks(0, hi, 5);
  const bars = labels.map((label, li) => {
    const x0 = bandCenter(li) - groupW / 2;
    return seriesNames.map((name, si) => {
      const v = Number(matrix[si]?.[li]) || 0;
      const x = x0 + si * barW;
      const y = yFor(v);
      const h = baseY - y;
      const tip = `${name} \xB7 ${label}: ${formatNumber(v)}${chart.unit || ""}`;
      return barRect(x + barW * 0.08, y, barW * 0.84, h, palette[si % palette.length], tip);
    }).join("\n  ");
  }).join("\n  ");
  const { grid, xlabels } = axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit: chart.unit });
  return svgWrap(
    "grouped-bar",
    chart.title || "Grouped bar chart",
    `${legendRow(seriesNames, palette, margin, tc("heading", theme.heading))}
  ${grid}
  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baseY)}" x2="${round(margin.left + plotW)}" y2="${round(baseY)}" style="stroke:${tc("axis", theme.axis)}"/>
  ${bars}
  ${xlabels}`
  );
}
function renderStackedBarChartSvg(chart, options = {}) {
  const { theme, tc, palette, margin } = setup(options, true);
  const labels = chart.labels || [];
  const seriesNames = chart.seriesNames || [];
  const matrix = chart.matrix || [];
  const totals = labels.map((_, li) => seriesNames.reduce((s, _n, si) => s + (Number(matrix[si]?.[li]) || 0), 0));
  const [, hi] = niceExtent(0, Math.max(...totals, 0), { includeZero: true, pad: 0.16 });
  const plotW = W - margin.left - margin.right;
  const plotH = H - margin.top - margin.bottom;
  const baseY = margin.top + plotH;
  const yFor = (v) => baseY - v / hi * plotH;
  const band = plotW / Math.max(1, labels.length);
  const bandCenter = (i) => margin.left + band * i + band / 2;
  const barW = band * 0.6;
  const ticks = niceTicks(0, hi, 5);
  const bars = labels.map((label, li) => {
    const x = bandCenter(li) - barW / 2;
    let cursor = 0;
    const segs = seriesNames.map((name, si) => {
      const v = Number(matrix[si]?.[li]) || 0;
      if (v <= 0) return "";
      const yTop = yFor(cursor + v);
      const yBottom = yFor(cursor);
      cursor += v;
      const tip = `${name} \xB7 ${label}: ${formatNumber(v)}${chart.unit || ""}`;
      return `<rect class="dsvg-bar" data-deck-tip="${escapeAttr(tip)}" x="${round(x)}" y="${round(yTop)}" width="${round(barW)}" height="${round(yBottom - yTop)}" style="fill:${palette[si % palette.length]}"/>`;
    }).join("\n  ");
    const totalLabel = `<text class="dsvg-val" x="${round(bandCenter(li))}" y="${round(yFor(totals[li]) - 8)}" text-anchor="middle" style="fill:${tc("value", theme.valueLabel)}">${escapeHtml(formatNumber(totals[li]))}${escapeHtml(chart.unit || "")}</text>`;
    return segs + "\n  " + totalLabel;
  }).join("\n  ");
  const { grid, xlabels } = axes({ ticks, yFor, labels, bandCenter, margin, plotW, tc, theme, unit: chart.unit });
  return svgWrap(
    "stacked-bar",
    chart.title || "Stacked bar chart",
    `${legendRow(seriesNames, palette, margin, tc("heading", theme.heading))}
  ${grid}
  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baseY)}" x2="${round(margin.left + plotW)}" y2="${round(baseY)}" style="stroke:${tc("axis", theme.axis)}"/>
  ${bars}
  ${xlabels}`
  );
}

// src/charts-svg/doughnut.js
var W2 = 760;
var H2 = 350;
function arcPath(cx, cy, R, r, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (rad, a) => [round(cx + rad * Math.cos(a)), round(cy + rad * Math.sin(a))];
  const [x0o, y0o] = p(R, a0);
  const [x1o, y1o] = p(R, a1);
  const [x1i, y1i] = p(r, a1);
  const [x0i, y0i] = p(r, a0);
  return `M ${x0o} ${y0o} A ${R} ${R} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${r} ${r} 0 ${large} 0 ${x0i} ${y0i} Z`;
}
function renderDoughnutChartSvg(chart, options = {}) {
  const mode = options.mode === "light" ? "light" : "dark";
  const theme = DEFAULT_THEME[mode];
  const useVars = options.cssVariables !== false;
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback;
  const palette = resolvePalette(options.brand, options.palette);
  const labels = chart.labels || [];
  const values = (chart.values || []).map((v) => Number(v) || 0);
  const total = values.reduce((s, v) => s + v, 0);
  const cx = 200;
  const cy = 178;
  const R = 132;
  const r = 82;
  const gap = 0.012;
  let cursor = -Math.PI / 2;
  const slices = values.map((v, i) => {
    const frac = total > 0 ? v / total : 0;
    const a0 = cursor + gap / 2;
    const a1 = cursor + frac * Math.PI * 2 - gap / 2;
    cursor += frac * Math.PI * 2;
    const color = normHex(palette[i % palette.length], SVG_PALETTE[i % SVG_PALETTE.length]);
    const pct = total > 0 ? Math.round(frac * 100) : 0;
    const tip = `${labels[i] || ""}: ${formatNumber(v)} \xB7 ${pct}%`;
    if (a1 <= a0) return "";
    return `<path class="dsvg-slice" data-deck-tip="${escapeAttr(tip)}" d="${arcPath(cx, cy, R, r, a0, a1)}" style="fill:${color}"/>`;
  }).join("\n  ");
  const keyX = 410;
  const rowH = Math.min(54, (H2 - 40) / Math.max(1, labels.length));
  const startY = (H2 - rowH * labels.length) / 2 + rowH / 2;
  const key = labels.map((label, i) => {
    const v = values[i] || 0;
    const pct = total > 0 ? Math.round(v / total * 100) : 0;
    const color = normHex(palette[i % palette.length], SVG_PALETTE[i % SVG_PALETTE.length]);
    const y = startY + i * rowH;
    return `<g class="dsvg-slice" data-deck-tip="${escapeAttr(`${label}: ${formatNumber(v)} \xB7 ${pct}%`)}">
      <rect x="${keyX}" y="${round(y - 7)}" width="13" height="13" rx="3" style="fill:${color}"/>
      <text class="dsvg-key-name" x="${keyX + 22}" y="${round(y - 1)}" style="fill:${tc("heading", theme.heading)}">${escapeHtml(label)}</text>
      <text class="dsvg-key-value" x="${keyX + 22}" y="${round(y + 15)}" style="fill:${tc("muted", theme.muted)}">${escapeHtml(formatNumber(v))} \xB7 ${pct}%</text>
    </g>`;
  }).join("\n  ");
  return `<svg class="dsvg dsvg-doughnut" data-deck-svgchart="doughnut" viewBox="0 0 ${W2} ${H2}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(chart.title || "Doughnut chart")}">
  ${slices}
  <text class="dsvg-doughnut-cap" x="${cx}" y="${cy - 8}" text-anchor="middle" style="fill:${tc("muted", theme.muted)}">Total</text>
  <text class="dsvg-doughnut-total" x="${cx}" y="${cy + 20}" text-anchor="middle" style="fill:${tc("heading", theme.heading)}">${escapeHtml(formatNumber(total))}</text>
  ${key}
</svg>`;
}

// src/charts-svg/line.js
function renderLineChartSvg(chart, options = {}) {
  const mode = options.mode === "light" ? "light" : "dark";
  const theme = DEFAULT_THEME[mode];
  const useVars = options.cssVariables !== false;
  const area = options.area === true;
  const smooth = options.smooth !== false;
  const width = options.width || 760;
  const height = options.height || 380;
  const margin = { top: chart.title ? 54 : 28, right: 34, bottom: 46, left: 56 };
  const palette = resolvePalette(options.brand, options.palette);
  const accentHex = normHex(options.accentColor, palette[0] || SVG_PALETTE[0]);
  const accent2Hex = normHex(options.accent2Color, palette[1] || accentHex);
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback;
  const accent = useVars ? `var(--deck-chart-accent, ${accentHex})` : accentHex;
  const accent2 = useVars ? `var(--deck-chart-accent2, ${accent2Hex})` : accent2Hex;
  const labels = chart.labels || [];
  const values = (chart.values || []).map((v) => Number(v) || 0);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const [lo, hi] = niceExtent(minV, maxV, { includeZero: area });
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const xFor = (i) => values.length > 1 ? margin.left + i / (values.length - 1) * plotW : margin.left + plotW / 2;
  const yFor = (v) => margin.top + plotH - (v - lo) / (hi - lo) * plotH;
  const baselineY = margin.top + plotH;
  const points = values.map((v, i) => ({ x: xFor(i), y: yFor(v), v, label: labels[i] || "" }));
  const id = chartId("line");
  const ticks = niceTicks(lo, hi, 5);
  const grid = ticks.map((t) => {
    const y = yFor(t);
    return `<line class="dsvg-grid" x1="${round(margin.left)}" y1="${round(y)}" x2="${round(margin.left + plotW)}" y2="${round(y)}" style="stroke:${tc("grid", theme.grid)}"></line>
    <text class="dsvg-ytick" x="${round(margin.left - 12)}" y="${round(y + 4)}" text-anchor="end" style="fill:${tc("muted", theme.muted)}">${escapeHtml(formatNumber(t))}${escapeHtml(chart.unit || "")}</text>`;
  }).join("\n  ");
  const lastIndex = points.length - 1;
  const xlabels = points.map((p, i) => {
    const anchor = i === 0 ? "start" : i === lastIndex ? "end" : "middle";
    return `<text class="dsvg-xtick" x="${round(p.x)}" y="${height - 18}" text-anchor="${anchor}" style="fill:${tc("muted", theme.muted)}">${escapeHtml(p.label)}</text>`;
  }).join("\n  ");
  const linePathD = smooth ? smoothPath(points) : straightPath(points);
  const areaPathD = area ? `${linePathD} L ${round(points[lastIndex].x)} ${round(baselineY)} L ${round(points[0].x)} ${round(baselineY)} Z` : "";
  const markers = points.map((p) => {
    const tip = `${p.label}: ${formatNumber(p.v)}${chart.unit || ""}`;
    return `<g class="dsvg-marker" data-deck-tip="${escapeAttr(tip)}" data-deck-x="${round(p.x)}" data-deck-y="${round(p.y)}">
      <circle class="dsvg-hit" cx="${round(p.x)}" cy="${round(p.y)}" r="14"></circle>
      <circle class="dsvg-halo" cx="${round(p.x)}" cy="${round(p.y)}" r="9" style="fill:${accent}"></circle>
      <circle class="dsvg-dot" cx="${round(p.x)}" cy="${round(p.y)}" r="4.5" style="stroke:${accent}"></circle>
      <text class="dsvg-val" x="${round(p.x)}" y="${round(p.y - 14)}" text-anchor="middle" style="fill:${tc("value", theme.valueLabel)}">${escapeHtml(formatNumber(p.v))}${escapeHtml(chart.unit || "")}</text>
    </g>`;
  }).join("\n  ");
  return `<svg class="dsvg dsvg-line" data-deck-svgchart="${area ? "area" : "line"}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(chart.title || (area ? "Area chart" : "Line chart"))}">
  ${chartDefs(id, accent, accent2)}
  ${chart.title ? `<text class="dsvg-title" x="${margin.left}" y="30" style="fill:${tc("heading", theme.heading)}">${escapeHtml(chart.title)}</text>` : ""}
  ${grid}
  <line class="dsvg-axis" x1="${round(margin.left)}" y1="${round(baselineY)}" x2="${round(margin.left + plotW)}" y2="${round(baselineY)}" style="stroke:${tc("axis", theme.axis)}"></line>
  ${area ? `<path class="dsvg-areafill" d="${areaPathD}" style="fill:url(#${id}-area)"></path>` : ""}
  <path class="dsvg-linepath" d="${linePathD}" style="stroke:url(#${id}-line);filter:url(#${id}-glow)"></path>
  ${markers}
  ${xlabels}
</svg>`;
}
function renderAreaChartSvg(chart, options = {}) {
  return renderLineChartSvg(chart, { ...options, area: true });
}

// src/charts-svg/point.js
var W3 = 760;
var H3 = 350;
function renderPointSvg(chart, options = {}) {
  const bubble = options.bubble === true;
  const mode = options.mode === "light" ? "light" : "dark";
  const theme = DEFAULT_THEME[mode];
  const useVars = options.cssVariables !== false;
  const tc = (name, fallback) => useVars ? `var(--deck-chart-${name}, ${fallback})` : fallback;
  const palette = resolvePalette(options.brand, options.palette);
  const margin = { top: 26, right: 28, bottom: 56, left: 64 };
  const pts = (chart.points || []).filter((p) => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
  const xs = pts.map((p) => Number(p.x));
  const ys = pts.map((p) => Number(p.y));
  const [minX, maxX] = niceExtent(Math.min(...xs, 0), Math.max(...xs, 1), { pad: 0.1 });
  const [minY, maxY] = niceExtent(Math.min(...ys, 0), Math.max(...ys, 1), { pad: 0.1 });
  const plotW = W3 - margin.left - margin.right;
  const plotH = H3 - margin.top - margin.bottom;
  const xFor = (v) => margin.left + (v - minX) / (maxX - minX) * plotW;
  const yFor = (v) => margin.top + plotH - (v - minY) / (maxY - minY) * plotH;
  const maxR = Math.max(...pts.map((p) => Number(p.r) || 0), 1);
  const xTicks = niceTicks(minX, maxX, 5);
  const yTicks = niceTicks(minY, maxY, 5);
  const grid = [
    ...xTicks.map((t) => {
      const x = xFor(t);
      return `<line class="dsvg-grid" x1="${round(x)}" y1="${margin.top}" x2="${round(x)}" y2="${round(margin.top + plotH)}" style="stroke:${tc("grid", theme.grid)}"/>
    <text class="dsvg-xtick" x="${round(x)}" y="${H3 - 30}" text-anchor="middle" style="fill:${tc("muted", theme.muted)}">${escapeHtml(formatNumber(t))}</text>`;
    }),
    ...yTicks.map((t) => {
      const y = yFor(t);
      return `<line class="dsvg-grid" x1="${margin.left}" y1="${round(y)}" x2="${round(margin.left + plotW)}" y2="${round(y)}" style="stroke:${tc("grid", theme.grid)}"/>
    <text class="dsvg-ytick" x="${round(margin.left - 12)}" y="${round(y + 4)}" text-anchor="end" style="fill:${tc("muted", theme.muted)}">${escapeHtml(formatNumber(t))}</text>`;
    })
  ].join("\n  ");
  const dots = pts.map((p, i) => {
    const x = xFor(Number(p.x));
    const y = yFor(Number(p.y));
    const color = normHex(palette[i % palette.length], SVG_PALETTE[i % SVG_PALETTE.length]);
    const r = bubble ? Math.max(6, Math.min(26, 6 + (Number(p.r) || 0) / maxR * 20)) : 7;
    const label = p.label || `${formatNumber(p.x)}, ${formatNumber(p.y)}`;
    const tip = bubble ? `${label}: ${formatNumber(p.x)}, ${formatNumber(p.y)} \xB7 size ${formatNumber(p.r)}` : `${label}: ${formatNumber(p.x)}, ${formatNumber(p.y)}`;
    const text = !bubble && p.label ? `<text class="dsvg-point-label" x="${round(x + r + 4)}" y="${round(y - r - 2)}" style="fill:${tc("value", theme.valueLabel)}">${escapeHtml(p.label)}</text>` : "";
    return `<g class="dsvg-point" data-deck-tip="${escapeAttr(tip)}">
      <circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" style="fill:${color}${bubble ? "cc" : "ee"};stroke:${color}"/>
      ${text}
    </g>`;
  }).join("\n  ");
  const xAxisLabel = chart.xAxisLabel || "X";
  const yAxisLabel = chart.yAxisLabel || "Y";
  return `<svg class="dsvg dsvg-point" data-deck-svgchart="${bubble ? "bubble" : "scatter"}" viewBox="0 0 ${W3} ${H3}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeAttr(chart.title || (bubble ? "Bubble chart" : "Scatter chart"))}">
  ${grid}
  <line class="dsvg-axis" x1="${margin.left}" y1="${round(margin.top + plotH)}" x2="${round(margin.left + plotW)}" y2="${round(margin.top + plotH)}" style="stroke:${tc("axis", theme.axis)}"/>
  <line class="dsvg-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${round(margin.top + plotH)}" style="stroke:${tc("axis", theme.axis)}"/>
  ${dots}
  <text class="dsvg-axislabel" x="${round(margin.left + plotW / 2)}" y="${H3 - 6}" text-anchor="middle" style="fill:${tc("muted", theme.muted)}">${escapeHtml(xAxisLabel)}</text>
  <text class="dsvg-axislabel" transform="translate(16 ${round(margin.top + plotH / 2)}) rotate(-90)" text-anchor="middle" style="fill:${tc("muted", theme.muted)}">${escapeHtml(yAxisLabel)}</text>
</svg>`;
}
function renderScatterChartSvg(chart, options = {}) {
  return renderPointSvg(chart, { ...options, bubble: false });
}
function renderBubbleChartSvg(chart, options = {}) {
  return renderPointSvg(chart, { ...options, bubble: true });
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
    return `<line class="deck-boxplot-grid" x1="${geometry.margin.left}" y1="${round2(y)}" x2="${round2(geometry.width - geometry.margin.right)}" y2="${round2(y)}"></line>
  <text class="deck-boxplot-tick" x="${geometry.margin.left - 14}" y="${round2(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  const boxes = geometry.items.map((item) => `<g class="deck-boxplot-item" transform="translate(${round2(item.x)} 0)">
    <line class="deck-boxplot-whisker" x1="0" y1="${round2(item.minY)}" x2="0" y2="${round2(item.maxY)}"></line>
    <line class="deck-boxplot-whisker" x1="${round2(-item.capW / 2)}" y1="${round2(item.minY)}" x2="${round2(item.capW / 2)}" y2="${round2(item.minY)}"></line>
    <line class="deck-boxplot-whisker" x1="${round2(-item.capW / 2)}" y1="${round2(item.maxY)}" x2="${round2(item.capW / 2)}" y2="${round2(item.maxY)}"></line>
    <rect class="deck-boxplot-box" x="${round2(-item.boxW / 2)}" y="${round2(item.boxY)}" width="${round2(item.boxW)}" height="${round2(item.boxH)}" rx="5"><title>${escapeHtml(item.title)}</title></rect>
    <line class="deck-boxplot-median" x1="${round2(-item.boxW / 2)}" y1="${round2(item.medianY)}" x2="${round2(item.boxW / 2)}" y2="${round2(item.medianY)}"></line>
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
  <line class="deck-boxplot-axis" x1="${geometry.margin.left}" y1="${round2(geometry.height - geometry.margin.bottom)}" x2="${round2(geometry.width - geometry.margin.right)}" y2="${round2(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-boxplot-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round2(geometry.height - geometry.margin.bottom)}"></line>
  ${boxes}
  <text class="deck-boxplot-axis-label" transform="translate(18 ${round2(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || chart.series || "Value")}</text>
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
function round2(value) {
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
    return `<line class="deck-bullet-grid" x1="${round3(x)}" y1="${geometry.margin.top}" x2="${round3(x)}" y2="${round3(geometry.height - geometry.margin.bottom)}"></line>
  <text class="deck-bullet-tick" x="${round3(x)}" y="${geometry.height - 12}" text-anchor="middle">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  const rows = geometry.rows.map((row) => `<g class="deck-bullet-row" transform="translate(0 ${round3(row.y)})">
    <text class="deck-bullet-label" x="${geometry.margin.left - 16}" y="${round3(row.center + 5)}" text-anchor="end">${escapeHtml(row.label)}</text>
    <rect class="deck-bullet-track" x="${geometry.margin.left}" y="${round3(row.center - row.trackH / 2)}" width="${geometry.plotWidth}" height="${round3(row.trackH)}" rx="8"></rect>
    <rect class="deck-bullet-bar" x="${geometry.margin.left}" y="${round3(row.center - row.barH / 2)}" width="${round3(row.barW)}" height="${round3(row.barH)}" rx="6"></rect>
    <line class="deck-bullet-target" x1="${round3(row.targetX)}" y1="${round3(row.center - row.trackH / 2 - 6)}" x2="${round3(row.targetX)}" y2="${round3(row.center + row.trackH / 2 + 6)}"></line>
    <text class="deck-bullet-value${row.valueInside ? " deck-bullet-value-inside" : ""}" x="${round3(row.valueX)}" y="${round3(row.center + 5)}" text-anchor="${row.valueAnchor}">${escapeHtml(formatNumber(row.value))}</text>
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
  <line class="deck-bullet-axis" x1="${geometry.margin.left}" y1="${round3(geometry.height - geometry.margin.bottom)}" x2="${round3(geometry.width - geometry.margin.right)}" y2="${round3(geometry.height - geometry.margin.bottom)}"></line>
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
function round3(value) {
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
var STAGE_PALETTE = ["#0F82F5", "#59D6FD", "#5143D5", "#F9935B", "#66CC8E", "#FC5161"];
function funnelPalette(brand = {}) {
  const c = brand.colors || {};
  const pick = (value, fallback) => {
    const raw = String(value || fallback).trim();
    return /^#/.test(raw) ? raw : `#${raw}`;
  };
  return [
    pick(c.blue, "0F82F5"),
    pick(c.cyan || c.lightBlue, "59D6FD"),
    pick(c.purple, "5143D5"),
    pick(c.orange, "F9935B"),
    pick(c.green, "66CC8E"),
    pick(c.red, "FC5161")
  ];
}
function renderFunnelSvg(funnel, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS3[mode],
    accent: cssColor(options.accentColor, DEFAULT_COLORS3[mode].accent),
    onAccent: cssColor(options.onAccentColor, DEFAULT_COLORS3[mode].onAccent),
    // key text sits on the card surface; callers (PPTX) can pass colours that
    // contrast with the actual card so the stage name is never invisible.
    heading: cssColor(options.headingColor, DEFAULT_COLORS3[mode].heading),
    muted: cssColor(options.mutedColor, DEFAULT_COLORS3[mode].muted)
  };
  const color = (name) => useVariables ? `var(--deck-funnel-${name}, ${colors[name]})` : colors[name];
  const palette = Array.isArray(options.palette) && options.palette.length ? options.palette : STAGE_PALETTE;
  const stageColor = (index) => {
    const k = index % STAGE_PALETTE.length;
    return useVariables ? `var(--deck-funnel-stage-${k}, ${STAGE_PALETTE[k]})` : palette[k] || STAGE_PALETTE[k];
  };
  const width = 760;
  const height = 318;
  const keyWidth = 230;
  const funnelWidth = width - keyWidth;
  const centerX = funnelWidth / 2;
  const topY = 20;
  const gap = 7;
  const stages = funnelStages(funnel, { maxWidth: funnelWidth - 56, minWidth: 84 });
  const stageH = (height - topY - 20 - gap * Math.max(0, stages.length - 1)) / Math.max(1, stages.length);
  const keyX = funnelWidth + 14;
  const segments = stages.map((stage, index) => {
    const y1 = topY + index * (stageH + gap);
    const y2 = y1 + stageH;
    const topW = stage.topWidth;
    const bottomW = stage.bottomWidth;
    const points = [
      `${round4(centerX - topW / 2)},${round4(y1)}`,
      `${round4(centerX + topW / 2)},${round4(y1)}`,
      `${round4(centerX + bottomW / 2)},${round4(y2)}`,
      `${round4(centerX - bottomW / 2)},${round4(y2)}`
    ].join(" ");
    const mid = y1 + stageH / 2;
    const fill = stageColor(index);
    return `<g class="deck-funnel-stage deck-funnel-stage-${index % 6}">
    <polygon class="deck-funnel-segment" points="${points}" style="fill:${fill}"></polygon>
    <polygon class="deck-funnel-sheen" points="${points}"></polygon>
    <rect class="deck-funnel-key-swatch" x="${keyX}" y="${round4(mid - 7)}" width="13" height="13" rx="3" style="fill:${fill}"></rect>
    <text class="deck-funnel-key-name" x="${keyX + 22}" y="${round4(mid - 1)}">${escapeHtml(stage.label)}</text>
    <text class="deck-funnel-key-value" x="${keyX + 22}" y="${round4(mid + 15)}">${escapeHtml(`${formatNumber(stage.value)}${funnel.unit} \xB7 ${stage.rate}`)}</text>
  </g>`;
  }).join("\n  ");
  return `<svg class="deck-funnel-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(funnel.title || "Funnel chart")}">
  <defs>
    <linearGradient id="deck-funnel-sheen-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <style>
    .deck-funnel-segment { stroke: ${color("surface")}; stroke-width: 2; }
    .deck-funnel-sheen { fill: url(#deck-funnel-sheen-grad); pointer-events: none; }
    .deck-funnel-key-name { fill: ${color("heading")}; font: 600 14px "Poppins", "Aptos", sans-serif; }
    .deck-funnel-key-value { fill: ${color("muted")}; font: 500 12.5px "Poppins", "Aptos", sans-serif; }
  </style>
  ${segments}
</svg>`;
}
function funnelStages(funnel, options = {}) {
  const maxValue = Math.max(...funnel.values, 1);
  const maxWidth = options.maxWidth ?? 610;
  const minWidth = options.minWidth ?? 126;
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
function round4(value) {
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
    return `<g class="deck-histogram-bin" transform="translate(${round5(bin.x)} ${round5(bin.y)})">
    <rect class="deck-histogram-bar" width="${round5(bin.w)}" height="${round5(bin.h)}" rx="4"><title>${escapeHtml(label)}: ${escapeHtml(formatNumber(bin.count))}</title></rect>
    ${bin.count > 0 ? `<text class="deck-histogram-count" x="${round5(bin.w / 2)}" y="-8" text-anchor="middle">${escapeHtml(formatNumber(bin.count))}</text>` : ""}
    ${index % geometry.labelStep === 0 ? `<text class="deck-histogram-label" x="${round5(bin.w / 2)}" y="${round5(geometry.axisLabelY - bin.y)}" text-anchor="middle">${escapeHtml(label)}</text>` : ""}
  </g>`;
  }).join("\n  ");
  const grid = geometry.ticks.map((tick) => {
    const y = geometry.yFor(tick);
    return `<line class="deck-histogram-grid" x1="${geometry.margin.left}" y1="${round5(y)}" x2="${round5(geometry.width - geometry.margin.right)}" y2="${round5(y)}"></line>
  <text class="deck-histogram-tick" x="${geometry.margin.left - 14}" y="${round5(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
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
  <line class="deck-histogram-axis" x1="${geometry.margin.left}" y1="${round5(geometry.height - geometry.margin.bottom)}" x2="${round5(geometry.width - geometry.margin.right)}" y2="${round5(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-histogram-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round5(geometry.height - geometry.margin.bottom)}"></line>
  ${bars}
  <text class="deck-histogram-axis-label" x="${round5(geometry.margin.left + geometry.plotWidth / 2)}" y="${geometry.height - 8}" text-anchor="middle">${escapeHtml(chart.xAxisLabel || "Range")}</text>
  <text class="deck-histogram-axis-label" transform="translate(18 ${round5(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || "Count")}</text>
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
function round5(value) {
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
    .deck-impact-radar-bar-fill { transform-box: fill-box; transform-origin: left center; }
    .deck-impact-radar-shape-animated { transform-box: fill-box; transform-origin: center; }
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
  const axes2 = radarPointObjects(impactRadar.labels.length, center, radius).map((point) => `<line class="deck-impact-radar-grid" x1="${center.x}" y1="${center.y}" x2="${point.x}" y2="${point.y}"></line>`).join("\n    ");
  const labels = radarPointObjects(impactRadar.labels.length, center, radius + 28).map((point, index) => {
    const anchor = point.x < center.x - 12 ? "end" : point.x > center.x + 12 ? "start" : "middle";
    return `<text class="deck-impact-radar-label" x="${point.x}" y="${point.y + 5}" text-anchor="${anchor}">${escapeHtml(impactRadar.labels[index])}</text>`;
  }).join("\n    ");
  const shapePoints = impactRadar.radarValues.map((value, index) => radarPoint(index, impactRadar.radarValues.length, center, radius * (value / 100))).map((point) => `${point.x},${point.y}`).join(" ");
  const animationClass = animate ? " deck-impact-radar-shape-animated" : "";
  return `<g>
    ${grid}
    ${axes2}
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
    x: round6(center.x + Math.cos(angle) * radius),
    y: round6(center.y + Math.sin(angle) * radius)
  };
}
function round6(value) {
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
    return `${path2} C ${round7(control1.x)} ${round7(control1.y)}, ${round7(control2.x)} ${round7(control2.y)}, ${point.x} ${point.y}`;
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
function round7(value) {
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
    return `<line class="deck-pareto-grid" x1="${geometry.margin.left}" y1="${round8(y)}" x2="${round8(geometry.width - geometry.margin.right)}" y2="${round8(y)}"></line>
  <text class="deck-pareto-tick" x="${geometry.margin.left - 14}" y="${round8(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
  }).join("\n  ");
  const percentTicks = [0, 25, 50, 75, 100].map((tick) => {
    const y = geometry.yForPercent(tick);
    return `<text class="deck-pareto-percent-tick" x="${geometry.width - geometry.margin.right + 14}" y="${round8(y + 5)}">${tick}%</text>`;
  }).join("\n  ");
  const bars = geometry.items.map((item, index) => {
    const showLabel = index % geometry.labelStep === 0 || index === geometry.items.length - 1;
    const valueLabelY = Math.max(geometry.margin.top + 14, item.barY - 8);
    return `<g class="deck-pareto-item" transform="translate(${round8(item.x)} 0)">
    <rect class="deck-pareto-bar" x="0" y="${round8(item.barY)}" width="${round8(item.barW)}" height="${round8(item.barH)}" rx="5"><title>${escapeHtml(item.label)}: ${escapeHtml(formatNumber(item.value))}; cumulative ${round8(item.cumulativePercent)}%</title></rect>
    ${item.value > 0 ? `<text class="deck-pareto-value" x="${round8(item.barW / 2)}" y="${round8(valueLabelY)}" text-anchor="middle">${escapeHtml(formatNumber(item.value))}</text>` : ""}
    ${showLabel ? `<text class="deck-pareto-label" x="${round8(item.barW / 2)}" y="${geometry.height - 30}" text-anchor="middle">${escapeHtml(item.label)}</text>` : ""}
  </g>`;
  }).join("\n  ");
  const line = linePath(geometry.items.map((item) => ({ x: item.pointX, y: item.pointY })));
  const points = geometry.items.map((item) => `<circle class="deck-pareto-point" cx="${round8(item.pointX)}" cy="${round8(item.pointY)}" r="5"><title>${escapeHtml(item.label)} cumulative: ${round8(item.cumulativePercent)}%</title></circle>`).join("\n  ");
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
  <line class="deck-pareto-axis" x1="${geometry.margin.left}" y1="${round8(geometry.height - geometry.margin.bottom)}" x2="${round8(geometry.width - geometry.margin.right)}" y2="${round8(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-pareto-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round8(geometry.height - geometry.margin.bottom)}"></line>
  <line class="deck-pareto-axis" x1="${round8(geometry.width - geometry.margin.right)}" y1="${geometry.margin.top}" x2="${round8(geometry.width - geometry.margin.right)}" y2="${round8(geometry.height - geometry.margin.bottom)}"></line>
  ${bars}
  <path class="deck-pareto-line" d="${line}"></path>
  ${points}
  <text class="deck-pareto-axis-label" transform="translate(18 ${round8(geometry.margin.top + geometry.plotHeight / 2)}) rotate(-90)" text-anchor="middle">${escapeHtml(chart.yAxisLabel || chart.series || "Value")}</text>
  <text class="deck-pareto-axis-label" transform="translate(${geometry.width - 18} ${round8(geometry.margin.top + geometry.plotHeight / 2)}) rotate(90)" text-anchor="middle">Cumulative %</text>
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
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${round8(point.x)} ${round8(point.y)}`).join(" ");
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
function round8(value) {
  return Math.round(value * 10) / 10;
}

// src/components/radar.js
var DEFAULT_COLORS7 = {
  light: {
    grid: "#d8e2f0",
    text: "#333333",
    muted: "#666666",
    fill: "rgba(15, 130, 245, .18)",
    stroke: "#0f82f5",
    point: "#59d6fd",
    halo: "#ffffff"
  },
  dark: {
    grid: "#31557e",
    text: "#f4f8ff",
    muted: "#c8d8f0",
    fill: "rgba(89, 214, 253, .20)",
    stroke: "#59d6fd",
    point: "#0f82f5",
    halo: "#0d1d36"
  }
};
function renderRadarSvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false;
  const mode = options.mode === "dark" ? "dark" : "light";
  const colors = {
    ...DEFAULT_COLORS7[mode],
    grid: options.gridColor || DEFAULT_COLORS7[mode].grid,
    text: options.textColor || DEFAULT_COLORS7[mode].text,
    muted: options.mutedColor || DEFAULT_COLORS7[mode].muted,
    fill: options.fillColor || DEFAULT_COLORS7[mode].fill,
    stroke: options.strokeColor || DEFAULT_COLORS7[mode].stroke,
    point: options.pointColor || DEFAULT_COLORS7[mode].point,
    halo: options.haloColor || DEFAULT_COLORS7[mode].halo
  };
  const color = (name) => useVariables ? `var(--deck-radar-${name}, ${colors[name]})` : colors[name];
  const geometry = radarGeometry(chart);
  const rings = [0.25, 0.5, 0.75, 1].map((scale) => `<polygon class="deck-radar-grid" points="${radarPoints2(chart.labels.length, geometry.center, geometry.radius * scale).join(" ")}"></polygon>`).join("\n  ");
  const axes2 = radarPointObjects2(chart.labels.length, geometry.center, geometry.radius).map((point) => `<line class="deck-radar-grid" x1="${geometry.center.x}" y1="${geometry.center.y}" x2="${point.x}" y2="${point.y}"></line>`).join("\n  ");
  const labels = radarPointObjects2(chart.labels.length, geometry.center, geometry.radius + 34).map((point, index) => {
    const anchor = point.x < geometry.center.x - 8 ? "end" : point.x > geometry.center.x + 8 ? "start" : "middle";
    return `<text class="deck-radar-label" x="${point.x}" y="${point.y + 5}" text-anchor="${anchor}">${escapeHtml(chart.labels[index])}</text>`;
  }).join("\n  ");
  const shapePoints = chart.values.map((value, index) => radarPoint2(index, chart.values.length, geometry.center, geometry.radius * (value / geometry.maxValue))).map((point) => `${point.x},${point.y}`).join(" ");
  const dots = chart.values.map((value, index) => {
    const point = radarPoint2(index, chart.values.length, geometry.center, geometry.radius * (value / geometry.maxValue));
    return `<g class="deck-radar-point" transform="translate(${point.x} ${point.y})">
    <circle r="5"><title>${escapeHtml(chart.labels[index])}: ${escapeHtml(formatNumber(value))}</title></circle>
    <text x="0" y="-12" text-anchor="middle">${escapeHtml(formatNumber(value))}</text>
  </g>`;
  }).join("\n  ");
  return `<svg class="dsvg deck-chart-radar-svg" data-deck-svgchart="radar" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Radar chart")}">
  <style>
    .deck-radar-grid { fill: none; stroke: ${color("grid")}; stroke-width: 1.4; }
    .deck-radar-shape { fill: ${color("fill")}; stroke: ${color("stroke")}; stroke-width: 4; stroke-linejoin: round; }
    .deck-radar-point circle { fill: ${color("point")}; stroke: ${color("stroke")}; stroke-width: 2; }
    .deck-radar-point text, .deck-radar-label, .deck-radar-scale { fill: ${color("text")}; font: 600 12px "Poppins", "Aptos", sans-serif; paint-order: stroke; stroke: ${color("halo")}; stroke-width: 3.5px; stroke-linejoin: round; }
    .deck-radar-scale { fill: ${color("muted")}; font-weight: 500; }
  </style>
  <text class="deck-radar-scale" x="${geometry.center.x + 10}" y="${geometry.center.y - geometry.radius - 8}">${escapeHtml(formatNumber(geometry.maxValue))}</text>
  ${rings}
  ${axes2}
  <polygon class="deck-radar-shape" points="${shapePoints}"></polygon>
  ${dots}
  ${labels}
</svg>`;
}
function radarGeometry(chart) {
  const width = 760;
  const height = 350;
  const center = { x: 380, y: 180 };
  const radius = 132;
  const maxValue = niceCeiling4(Math.max(1, ...chart.values));
  return { width, height, center, radius, maxValue };
}
function radarPoints2(count, center, radius) {
  return radarPointObjects2(count, center, radius).map((point) => `${point.x},${point.y}`);
}
function radarPointObjects2(count, center, radius) {
  return Array.from({ length: count }, (_, index) => radarPoint2(index, count, center, radius));
}
function radarPoint2(index, count, center, radius) {
  const angle = -Math.PI / 2 + index / count * Math.PI * 2;
  return {
    x: round9(center.x + Math.cos(angle) * radius),
    y: round9(center.y + Math.sin(angle) * radius)
  };
}
function niceCeiling4(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}
function round9(value) {
  return Math.round(value * 10) / 10;
}

// src/components/sankey.js
var DEFAULT_COLORS8 = {
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
  const defaults = DEFAULT_COLORS8[mode];
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
  const links = geometry.links.map((link) => `<path class="deck-sankey-link deck-sankey-link-${link.source.index % 6}" d="${linkPath(link, geometry.nodeWidth)}" stroke="${nodeColor(link.source.index)}" stroke-width="${round10(link.width)}">
    <title>${escapeHtml(link.source.label)} to ${escapeHtml(link.target.label)}: ${escapeHtml(formatNumber(link.value))}</title>
  </path>`).join("\n  ");
  const nodes = geometry.nodes.map((node) => {
    const label = nodeLabel(node, geometry);
    const nodeValue = Math.max(node.incoming, node.outgoing);
    return `<g class="deck-sankey-node deck-sankey-node-${node.index % 6}" transform="translate(${round10(node.x)} ${round10(node.y)})">
    <rect class="deck-sankey-node-rect" width="${geometry.nodeWidth}" height="${round10(node.height)}" rx="5" fill="${nodeColor(node.index)}"><title>${escapeHtml(node.label)}: in ${escapeHtml(formatNumber(node.incoming))}, out ${escapeHtml(formatNumber(node.outgoing))}</title></rect>
    <text class="deck-sankey-label" x="${label.x}" y="${label.y}" text-anchor="${label.anchor}">${escapeHtml(truncateLabel(node.label))}</text>
    <text class="deck-sankey-value" x="${label.x}" y="${label.y + 15}" text-anchor="${label.anchor}">${escapeHtml(formatNumber(nodeValue))}</text>
  </g>`;
  }).join("\n  ");
  return `<svg class="deck-chart-sankey-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || "Sankey chart")}">
  <style>
    .deck-sankey-link { fill: none; stroke-linecap: round; opacity: ${color("linkOpacity")}; }
    .deck-sankey-node-rect { stroke: ${color("grid")}; stroke-width: 1; }
    .deck-sankey-label, .deck-sankey-value, .deck-sankey-caption { fill: ${color("text")}; font: 700 12px "Poppins", "Aptos", sans-serif; }
    .deck-sankey-label { paint-order: stroke; stroke: ${color("label-halo")}; stroke-width: 5; stroke-linejoin: round; }
    .deck-sankey-value { fill: ${color("muted")}; font-size: 10.5px; font-weight: 600; paint-order: stroke; stroke: ${color("label-halo")}; stroke-width: 4; stroke-linejoin: round; }
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
  const nodeWidth = 16;
  const margin = { top: 48, right: 86, bottom: 34, left: 86 };
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
  const maxNodeWeight = Math.max(...nodes.map((node) => Math.max(node.incoming, node.outgoing, 1)), 1);
  columns.forEach((column, depth) => {
    column.sort((a, b) => Math.max(b.incoming, b.outgoing) - Math.max(a.incoming, a.outgoing) || a.index - b.index);
    const gap = column.length > 1 ? 44 : 0;
    const heights = column.map((node) => {
      const weight = Math.max(node.incoming, node.outgoing, 1);
      return clamp(28 + Math.sqrt(weight / maxNodeWeight) * 42, 30, 72);
    });
    const totalHeight = heights.reduce((sum, value) => sum + value, 0) + gap * Math.max(0, column.length - 1);
    let y = margin.top + Math.max(0, (innerHeight - totalHeight) / 2);
    column.forEach((node) => {
      node.x = margin.left + depth / maxDepth * innerWidth;
      node.y = y;
      node.height = heights[column.indexOf(node)];
      y += node.height + gap;
    });
  });
  const maxLinkValue = Math.max(...links.map((link) => link.value), 1);
  links.forEach((link) => {
    link.width = clamp(5 + Math.sqrt(link.value / maxLinkValue) * 33, 7, 38);
  });
  nodes.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y);
    node.targetLinks.sort((a, b) => a.source.y - b.source.y);
    spreadAnchors(node, node.sourceLinks, "y0");
    spreadAnchors(node, node.targetLinks, "y1");
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
  const mid = x0 + (x1 - x0) * 0.46;
  return `M${round10(x0)},${round10(link.y0)}C${round10(mid)},${round10(link.y0)} ${round10(mid)},${round10(link.y1)} ${round10(x1)},${round10(link.y1)}`;
}
function spreadAnchors(node, links, key) {
  if (!links.length) return;
  const center = node.y + node.height / 2;
  const spacing = links.length > 1 ? Math.min(24, node.height / Math.max(1, links.length - 0.25)) : 0;
  const start = center - spacing * (links.length - 1) / 2;
  links.forEach((link, index) => {
    link[key] = start + spacing * index;
  });
}
function nodeLabel(node, geometry) {
  if (node.depth === 0) {
    return {
      x: -12,
      y: round10(node.height / 2 - 2),
      anchor: "end"
    };
  }
  if (node.depth === geometry.maxDepth) {
    return {
      x: geometry.nodeWidth + 12,
      y: round10(node.height / 2 - 2),
      anchor: "start"
    };
  }
  return {
    x: round10(geometry.nodeWidth / 2),
    y: -10,
    anchor: "middle"
  };
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
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function round10(value) {
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
    x: round11(box.x + inset),
    y: round11(box.y + inset),
    w: round11(Math.max(0, box.w - inset * 2)),
    h: round11(Math.max(0, box.h - inset * 2))
  };
}
function round11(value) {
  return Number(value.toFixed(2));
}

// src/components/waterfall.js
var DEFAULT_COLORS9 = {
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
    ...DEFAULT_COLORS9[mode],
    grid: options.gridColor || DEFAULT_COLORS9[mode].grid,
    axis: options.axisColor || DEFAULT_COLORS9[mode].axis,
    text: options.textColor || DEFAULT_COLORS9[mode].text,
    positive: options.positiveColor || DEFAULT_COLORS9[mode].positive,
    negative: options.negativeColor || DEFAULT_COLORS9[mode].negative,
    connector: options.connectorColor || DEFAULT_COLORS9[mode].connector
  };
  const color = (name) => useVariables ? `var(--deck-waterfall-${name}, ${colors[name]})` : colors[name];
  const geometry = waterfallGeometry(chart);
  const bars = geometry.steps.map((step) => {
    const className = step.delta < 0 ? "negative" : "positive";
    return `<g class="deck-waterfall-step deck-waterfall-step-${className}">
    <rect class="deck-waterfall-bar deck-waterfall-bar-${className}" x="${round12(step.x)}" y="${round12(step.y)}" width="${round12(step.w)}" height="${round12(step.h)}" rx="5"></rect>
    <text class="deck-waterfall-value" x="${round12(step.x + step.w / 2)}" y="${round12(step.valueY)}" text-anchor="middle">${escapeHtml(formatDelta(step.delta))}</text>
    <text class="deck-waterfall-label" x="${round12(step.x + step.w / 2)}" y="${geometry.height - 18}" text-anchor="middle">${escapeHtml(step.label)}</text>
  </g>`;
  }).join("\n  ");
  const connectors = geometry.steps.slice(0, -1).map((step, index) => {
    const next = geometry.steps[index + 1];
    return `<line class="deck-waterfall-connector" x1="${round12(step.x + step.w)}" y1="${round12(step.endY)}" x2="${round12(next.x)}" y2="${round12(step.endY)}"></line>`;
  }).join("\n  ");
  const grid = geometry.ticks.map((tick) => {
    const y = geometry.yFor(tick);
    return `<line class="deck-waterfall-grid" x1="${geometry.margin.left}" y1="${round12(y)}" x2="${round12(geometry.width - geometry.margin.right)}" y2="${round12(y)}"></line>
  <text class="deck-waterfall-tick" x="${geometry.margin.left - 14}" y="${round12(y + 5)}" text-anchor="end">${escapeHtml(formatNumber(tick))}</text>`;
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
  <line class="deck-waterfall-axis" x1="${geometry.margin.left}" y1="${round12(geometry.zeroY)}" x2="${round12(geometry.width - geometry.margin.right)}" y2="${round12(geometry.zeroY)}"></line>
  <line class="deck-waterfall-axis" x1="${geometry.margin.left}" y1="${geometry.margin.top}" x2="${geometry.margin.left}" y2="${round12(geometry.height - geometry.margin.bottom)}"></line>
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
function round12(value) {
  return Math.round(value * 10) / 10;
}

export {
  splitCsv,
  cleanText,
  escapeHtml,
  escapeAttr,
  formatNumber,
  renderBarChartSvg,
  renderGroupedBarChartSvg,
  renderStackedBarChartSvg,
  renderDoughnutChartSvg,
  renderLineChartSvg,
  renderAreaChartSvg,
  renderScatterChartSvg,
  renderBubbleChartSvg,
  renderBoxplotSvg,
  renderBulletSvg,
  funnelPalette,
  renderFunnelSvg,
  renderHistogramSvg,
  histogramBins,
  renderImpactRadarSvg,
  renderJourneyPathSvg,
  renderParetoSvg,
  paretoRows,
  renderRadarSvg,
  renderSankeySvg,
  treemapRects,
  renderWaterfallSvg,
  normalizeResourceReference,
  resolveResourceFile,
  resolveSurfaceResourceFile,
  resourceToDataUri
};
