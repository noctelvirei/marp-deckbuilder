// Fast in-browser preview for SSR-SVG charts — imports renderers straight from
// src/ (no WSL bundle needed). Writes an HTML with the shared chart CSS, the
// hover runtime and a zoom slider (to judge crispness at projector scale).
//
//   node tools/preview-chart.mjs [out.html]
//
import { writeFileSync } from 'node:fs'
import { renderLineChartSvg, renderAreaChartSvg } from '../src/charts-svg/line.js'
import { renderBarChartSvg, renderGroupedBarChartSvg, renderStackedBarChartSvg } from '../src/charts-svg/bar.js'
import { renderScatterChartSvg, renderBubbleChartSvg } from '../src/charts-svg/point.js'
import { svgChartCss } from '../src/charts-svg/styles.js'
import { svgChartHoverScript } from '../src/charts-svg/hover.js'

const out = process.argv[2] || 'C:/temp/ssr-svg-experiment/preview.html'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const completion = { title: 'Completion rate by month', labels: months, values: [62, 64, 61, 68, 72, 70, 75, 79, 77, 83, 86, 91], unit: '%' }
const volume = { title: 'Sessions (000s)', labels: months, values: [12, 18, 15, 22, 28, 26, 31, 35, 33, 42, 47, 55], unit: 'k' }
const swing = { title: 'Net change', labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [-8, 14, -3, 21], unit: '' }

// each tile: a heading + the SVG, rendered for the given mode
function tile(title, svg) {
  return `<div class="tile"><h3>${title}</h3><div class="card">${svg}</div></div>`
}

const channels = { title: 'Completion time by channel', labels: ['Digital', 'Branch', 'Contact centre', 'Paper'], values: [2.1, 3.8, 4.6, 5.2], unit: 'd' }
const grouped = { title: 'Channel mix by quarter', labels: ['Q1', 'Q2', 'Q3', 'Q4'], seriesNames: ['Digital', 'Branch', 'Paper'], matrix: [[40, 46, 52, 58], [30, 28, 26, 24], [30, 26, 22, 18]] }
const stacked = { title: 'Volume by channel', labels: ['Q1', 'Q2', 'Q3', 'Q4'], seriesNames: ['Digital', 'Branch', 'Paper'], matrix: [[120, 160, 190, 240], [80, 70, 65, 60], [40, 35, 30, 25]] }
const scatterData = { title: 'Impact vs effort', xAxisLabel: 'Effort', yAxisLabel: 'Impact', points: [{ x: 2, y: 8, label: 'Auto-verify' }, { x: 5, y: 9, label: 'E-sign' }, { x: 7, y: 4, label: 'Legacy port' }, { x: 3, y: 6, label: 'SMS' }, { x: 8, y: 7, label: 'Co-browse' }, { x: 4, y: 3, label: 'Manual QA' }] }
const bubbleData = { title: 'Impact by effort (size = reach)', xAxisLabel: 'Effort', yAxisLabel: 'Impact', points: [{ x: 2, y: 8, r: 40, label: 'Auto-verify' }, { x: 5, y: 9, r: 80, label: 'E-sign' }, { x: 7, y: 4, r: 25, label: 'Legacy' }, { x: 3, y: 6, r: 55, label: 'SMS' }, { x: 8, y: 7, r: 70, label: 'Co-browse' }] }

const darkTiles = [
  tile('line — dark', renderLineChartSvg(completion, { mode: 'dark' })),
  tile('area — dark', renderAreaChartSvg(volume, { mode: 'dark' })),
  tile('area w/ negatives — dark', renderAreaChartSvg(swing, { mode: 'dark' })),
  tile('bar — dark', renderBarChartSvg(channels, { mode: 'dark' })),
  tile('grouped-bar — dark', renderGroupedBarChartSvg(grouped, { mode: 'dark' })),
  tile('stacked-bar — dark', renderStackedBarChartSvg(stacked, { mode: 'dark' })),
  tile('scatter — dark', renderScatterChartSvg(scatterData, { mode: 'dark' })),
  tile('bubble — dark', renderBubbleChartSvg(bubbleData, { mode: 'dark' })),
].join('\n')

const lightTiles = [
  tile('line — light', renderLineChartSvg(completion, { mode: 'light' })),
  tile('area — light', renderAreaChartSvg(volume, { mode: 'light' })),
].join('\n')

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>SSR-SVG chart preview</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#0a1526; color:#e8eef7; font-family:"Poppins","Aptos",system-ui,sans-serif; }
  header { padding:20px 28px 4px; } h1 { font-size:19px; margin:0; } p.sub { color:#8a95a8; font-size:13px; margin:4px 0 0; }
  .controls { display:flex; gap:14px; align-items:center; padding:14px 28px; flex-wrap:wrap; }
  input[type=range]{ width:260px; accent-color:#0f82f5; } .zoomval{ color:#59d6fd; font-weight:600; min-width:46px; }
  button{ background:#16264180; color:#cfe5ff; border:1px solid #27406b; border-radius:8px; padding:6px 12px; font:inherit; font-size:13px; cursor:pointer; } button:hover{ background:#1d3a63; }
  section.band { padding:6px 28px 30px; } section.band.light { background:#eef3fa; color:#0b1b33; }
  section.band h2 { font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:#8a95a8; margin:18px 0 10px; }
  section.band.light h2 { color:#5a6b82; }
  .grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:22px; }
  .tile h3 { font-size:13px; font-weight:600; margin:0 0 8px; color:#9fb2cc; } section.band.light .tile h3 { color:#5a6b82; }
  .card { border:1px solid #1e3354; border-radius:14px; background:#0d1d36; padding:16px; overflow:auto; }
  section.band.light .card { background:#ffffff; border-color:#dbe3ee; }
  .zoomwrap { transform-origin: top left; transition: transform .08s linear; }
  ${svgChartCss()}
</style></head>
<body>
<header><h1>SSR-SVG chart preview — line + area</h1><p class="sub">Hover the points for tooltips. Drag zoom to check crispness at scale.</p></header>
<div class="controls">
  <span>Zoom</span><input id="zoom" type="range" min="100" max="400" step="10" value="100"><span class="zoomval" id="zv">100%</span>
  <button data-z="100">1×</button><button data-z="200">2×</button><button data-z="300">3×</button>
</div>
<div class="zoomwrap" id="zoomwrap">
  <section class="band"><h2>Dark (deck default)</h2><div class="grid">${darkTiles}</div></section>
  <section class="band light"><h2>Light</h2><div class="grid">${lightTiles}</div></section>
</div>
<script>${svgChartHoverScript()}</script>
<script>
  const z=document.getElementById('zoom'),zv=document.getElementById('zv'),w=document.getElementById('zoomwrap');
  function apply(v){ w.style.transform='scale('+(v/100)+')'; zv.textContent=v+'%'; z.value=v; }
  z.addEventListener('input',e=>apply(+e.target.value));
  document.querySelectorAll('button[data-z]').forEach(b=>b.addEventListener('click',()=>apply(+b.dataset.z)));
  apply(100);
</script>
</body></html>`

writeFileSync(out, html)
console.log('wrote', out)
