# Marp Report Reference

## Build Command

From the `skills/marp-report` folder:

```bash
node scripts/build-report.mjs report.md --out-dir output
```

The wrapper calls the bundled renderer at `tool/dist/deckbuilder.mjs` and uses resources from `tool/resources`. Generated report HTML is self-contained: images and brand assets are embedded into the HTML rather than written beside it as copied resource files.

For PDF, open the generated HTML in a browser and use Print to PDF. No browser engine is bundled.

## Report Skeleton

Use this shape for rich reports. `reportTheme: dark` applies the built-in dark navy report theme. `reportNav: true` generates a sticky sidebar from section headings.
Branding is renderer-owned and comes from `tool/resources/definitions/brand.json` plus bundled resources; do not add logo `<img>` tags, brand colors, font declarations, or background chrome to report Markdown. Dark reports use `assets.logo.reportDark`, `companyDark`, or `dark`; light reports use `assets.logo.reportLight`, `companyLight`, or `light`.

```md
---
title: Usage Report
subtitle: April 2026
reportTheme: dark
reportNav: true
---

## Executive Summary

Report prose goes here.

## Volume

<report-chart title="Cases by journey" labels="J0107,J0106" values="52208,11119"></report-chart>
```

## Dark Navy CSS Setup

Prefer the built-in frontmatter preset:

```yaml
reportTheme: dark
reportNav: true
```

The historical raw CSS setup is retained below only for legacy Markdown that has not moved to renderer-owned theme/layout yet.

```html
<style>
:root {
  --bg: #060D18;
  --bg-card: #0D1D36;
  --bg-subtle: #071228;
  --border: #1E3A5F;
  --border-dim: rgba(30,58,95,.45);
  --blue: #0F82F5;
  --cyan: #59D6FD;
  --purple: #5143D5;
  --green: #66CC8E;
  --orange: #F99358;
  --red: #FC5161;
  --white: #FFFFFF;
  --text: #C8D8F0;
  --text-dim: #8B9AB5;
  --font-mono: "Consolas", "SFMono-Regular", monospace;
}
body { background: var(--bg) !important; color: var(--text) !important; }
.deck-report { background: var(--bg-subtle) !important; box-shadow: none !important; max-width: 1200px !important; }
.report-body { padding: 0 !important; }
.report-body h2 { color: var(--cyan) !important; border-top: none !important; border-bottom: 1px solid var(--border) !important; font-size: 1.15rem !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: .06em; padding-bottom: 8px; margin-top: 40px !important; }
.report-body h3 { color: var(--cyan) !important; font-size: .8rem !important; font-weight: 600 !important; text-transform: uppercase; letter-spacing: .08em; }
.report-body p, .report-body li { color: var(--text) !important; font-size: .93rem; }
.report-body a { color: var(--cyan) !important; }
.report-body hr { border-top-color: var(--border) !important; margin: 32px 0 !important; }
.report-body table { font-size: .87rem; }
.report-body thead tr { background: var(--bg-card) !important; border-top: 2px solid var(--blue) !important; }
.report-body th { color: var(--white) !important; font-size: .72rem !important; text-transform: uppercase; letter-spacing: .06em; background: transparent !important; border-bottom: 1px solid var(--border) !important; }
.report-body td { color: var(--text) !important; border-color: var(--border-dim) !important; vertical-align: middle; }
.report-body tr:nth-child(even) td { background: rgba(13,31,56,.4) !important; }
.report-body tr:hover td { background: rgba(89,214,253,.05) !important; }
.report-body blockquote { background: var(--bg-card) !important; border-left: 4px solid var(--blue) !important; color: var(--text) !important; padding: 14px 18px !important; border-radius: 0 6px 6px 0; }
code { background: var(--bg-card) !important; color: var(--cyan) !important; border: 1px solid var(--border) !important; font-family: var(--font-mono); padding: 1px 5px; border-radius: 3px; font-size: .85em; }
.r-layout { display: grid; grid-template-columns: 200px 1fr; gap: 40px; max-width: 1200px; margin: 0 auto; padding: 32px; }
.r-sidebar { position: sticky; top: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; align-self: start; }
.r-sidebar-title { font-size: .65rem; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--text-dim); margin-bottom: 12px; }
.r-sidebar a { display: block; color: var(--text-dim); text-decoration: none; font-size: .82rem; padding: 7px 10px; border-radius: 4px; transition: all .15s; }
.r-sidebar a:hover { color: var(--cyan); background: rgba(89,214,253,.08); }
.r-main { min-width: 0; padding: 32px 40px 60px; }
.r-metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 14px; margin: 18px 0; }
.r-metric { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; text-align: center; }
.r-metric-value { font-size: 1.9rem; font-weight: 300; color: var(--white); line-height: 1; margin-bottom: 5px; }
.r-metric-label { font-size: .7rem; font-weight: 500; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); }
.r-metric-sub { font-size: .76rem; margin-top: 7px; color: var(--green); }
.r-metric-sub.down { color: var(--red); }
.r-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-bottom: 14px; }
.r-card-accent { background: var(--bg-card); border: 1px solid var(--border); border-top: 3px solid var(--blue); border-radius: 12px; padding: 22px; margin-bottom: 14px; }
.r-card-accent.cyan { border-top-color: var(--cyan); }
.r-card-accent.green { border-top-color: var(--green); }
.r-card-accent.orange { border-top-color: var(--orange); }
.r-card-accent.red { border-top-color: var(--red); }
.r-card-accent.purple { border-top-color: var(--purple); }
.r-chart-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin: 18px 0; }
.r-chart-title { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); margin-bottom: 16px; }
.r-rate-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.r-rate-label { font-size: .82rem; min-width: 110px; color: var(--text); }
.r-rate-track { flex: 1; height: 22px; background: rgba(30,58,95,.6); border-radius: 4px; overflow: hidden; }
.r-rate-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 10px; font-size: .72rem; font-weight: 600; color: var(--white); white-space: nowrap; }
.r-rate-pct { font-size: .76rem; font-family: var(--font-mono); color: var(--text-dim); min-width: 42px; text-align: right; }
.r-callout { display: flex; gap: 14px; padding: 14px 18px; border-radius: 8px; margin: 16px 0; border: 1px solid; }
.r-callout.info { background: rgba(15,130,245,.1); border-color: rgba(15,130,245,.3); color: #93c5fd; }
.r-callout.warning { background: rgba(249,147,88,.1); border-color: rgba(249,147,88,.3); color: #fdba74; }
.r-callout.success { background: rgba(102,204,142,.1); border-color: rgba(102,204,142,.3); color: #86efac; }
.r-callout.danger { background: rgba(252,81,97,.1); border-color: rgba(252,81,97,.3); color: #fca5a5; }
.r-badge { display: inline-flex; align-items: center; font-size: .66rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; padding: 2px 7px; border-radius: 999px; border: 1px solid; }
.r-badge.blue { background: rgba(15,130,245,.12); color: var(--blue); border-color: rgba(15,130,245,.35); }
.r-badge.green { background: rgba(102,204,142,.12); color: var(--green); border-color: rgba(102,204,142,.35); }
.r-badge.orange { background: rgba(249,147,88,.12); color: var(--orange); border-color: rgba(249,147,88,.35); }
.r-badge.red { background: rgba(252,81,97,.12); color: var(--red); border-color: rgba(252,81,97,.35); }
.r-badge.muted { background: rgba(139,154,181,.1); color: var(--text-dim); border-color: rgba(139,154,181,.25); }
.r-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.r-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.r-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 14px; font-size: .75rem; color: var(--text-dim); }
.r-legend-item { display: flex; align-items: center; gap: 7px; }
.r-legend-swatch { width: 20px; height: 3px; border-radius: 2px; display: inline-block; }
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
</style>
```

## Component Tags And Classes

Reports use normal Markdown plus compact `report-*` component tags where supported. The renderer expands those tags into HTML, CSS hooks, and JavaScript initializers.

### Report Chart: Chart.js Bar, Line, And Doughnut

Use `report-chart` for standard Chart.js bar, line, and doughnut charts. Do not write the `<canvas>` or Chart.js initializer yourself. The renderer generates Chart.js hover tooltips that show the represented value.

```html
<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>
```

```html
<report-chart
  type="line"
  title="Weekly case volume"
  series="Cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="17240,18990,20530,21191"
></report-chart>
```

```html
<report-chart
  type="doughnut"
  title="Journey mix"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `type` | no | Supports `bar`, `line`, and `doughnut`. Defaults to `bar`. Alias: `donut`. |
| `title` | no | Rendered above the chart and used as the accessible label. |
| `series` | no | Dataset label. |
| `labels` | yes | Comma-separated labels. |
| `values` | yes | Comma-separated numeric values. Must match label count. |
| `colors` | no | Comma-separated hex colors. Defaults to brand chart colors. |
| `height` | no | Pixel height, clamped by the renderer. Defaults to `320`. |
| `value-prefix` | no | Prefix shown in tooltips, such as `$`. Alias: `prefix`. |
| `value-suffix` | no | Suffix shown in tooltips, such as `%` or ` cases`. Alias: `suffix`. |

### Report Metric Grid

Use `report-metric-grid` for KPI cards. Do not hand-author nested metric card `div` blocks.

```html
<report-metric-grid>
  <report-metric value="77,951" label="Total cases" sub="+12% vs prior"></report-metric>
  <report-metric value="94.3%" label="Completion rate" sub="-1.1 pp" direction="down"></report-metric>
</report-metric-grid>
```

Supported `report-metric` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `value` | no | Primary metric value. |
| `label` | no | Metric label. |
| `sub` | no | Supporting delta or note. Aliases: `delta`, `change`. |
| `direction` | no | Use `down` for negative deltas. |
| `accent` | no | Supports `blue`, `cyan`, `purple`, `green`, `orange`, `red`. |

### Report Rate Bars

Use `report-rate-bars` for ranked distributions. Do not hand-author inline-width rate bar HTML.

```html
<report-rate-bars
  title="Journey distribution"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-rate-bars>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Rendered above the rate bars and used as the accessible label. |
| `labels` | yes | Comma-separated item labels. |
| `values` | yes | Comma-separated numeric values. Must match label count. |
| `shares` | no | Comma-separated percentages. Aliases: `percentages`, `percents`. When omitted, shares are computed from `values`. |
| `colors` | no | Comma-separated six-digit hex colors. Defaults to brand chart colors. |

### Report Callout

Use `report-callout` for findings, risks, and next actions. Do not hand-author `r-callout` blocks.

```html
<report-callout variant="warning" title="Action">
J0116 generated meaningful volume but is not in the registered journey profile.
</report-callout>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `variant` | no | Supports `info`, `warning`, `success`, `danger`. Aliases: `type`, `tone`. Defaults to `info`. |
| `title` | no | Short bold heading. |
| `text` | no | Body text when you prefer attribute-only authoring. Otherwise use the tag body. |

### Report Accent Card

Use `report-accent-card` for highlighted recommendations, risks, ownership notes, and small standalone insight cards. Do not hand-author `r-card-accent` blocks for standard cards.

```html
<report-accent-card accent="green" title="Recommended focus">
Prioritise monitoring for J0107 while validating whether J0116 is a real journey.
</report-accent-card>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `accent` | no | Supports `blue`, `cyan`, `purple`, `green`, `orange`, `red`. Aliases: `color`, `tone`. Defaults to `blue`. |
| `title` | no | Short card title. |
| `body` | no | Body text when you prefer attribute-only authoring. Alias: `text`. Otherwise use the tag body. |

### Report Badge

Use `report-badge` for table statuses and compact inline state labels. Do not hand-author `r-badge` spans.

```html
<report-badge status="active">Active</report-badge>
<report-badge status="review" label="Review"></report-badge>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `variant` | no | Supports `blue`, `green`, `orange`, `red`, `muted`. Aliases: `color`, `tone`. |
| `status` | no | Maps common statuses such as `active`, `review`, `blocked`, and `pending` to badge colors. |
| `label` | no | Badge text when you prefer attribute-only authoring. Otherwise use the tag body. |

## Legacy HTML Classes

Some components are still in migration. Until their `report-*` versions exist, reports may use these HTML classes:

| Pattern | Required classes | Optional modifiers |
| --- | --- | --- |
| Sidebar layout | `r-layout`, `r-sidebar`, `r-sidebar-title`, `r-main` | none |
| Metrics | `r-metric-grid`, `r-metric`, `r-metric-value`, `r-metric-label` | `r-metric-sub`, `down` |
| Cards | `r-card`, `r-card-accent` | `cyan`, `green`, `orange`, `red`, `purple` |
| Chart frame | `r-chart-wrap`, `r-chart-title` | `r-legend`, `r-legend-item`, `r-legend-swatch` |
| Grids | `r-two-col`, `r-three-col` | none |

Do not use `deck-*` tags in reports. They are presentation components.

### Metric Grid

```html
<div class="r-metric-grid">
  <div class="r-metric">
    <div class="r-metric-value">77,951</div>
    <div class="r-metric-label">Total cases</div>
    <div class="r-metric-sub">+12% vs prior</div>
  </div>
  <div class="r-metric">
    <div class="r-metric-value">94.3%</div>
    <div class="r-metric-label">Completion rate</div>
    <div class="r-metric-sub down">-1.1 pp</div>
  </div>
</div>
```

### Accent Cards

Use `report-accent-card` for standard accent cards. Keep this raw class pattern only for temporary custom multi-card layouts.

```html
<div class="r-three-col">
  <div class="r-card-accent"><h3>Primary</h3><p>Main finding.</p></div>
  <div class="r-card-accent green"><h3>Positive</h3><p>Target met.</p></div>
  <div class="r-card-accent orange"><h3>Watch</h3><p>Needs review.</p></div>
</div>
```

## JavaScript Charts

The report wrapper injects Chart.js, Observable Plot, and D3 into the final HTML head from local vendor files. Do not include CDN script tags in Markdown. Only write the init script.

Place the init script inside `<main class="r-main">` as the final element before `</main>`.

### Legacy Chart.js Bar

Use the structured `report-chart` component above instead of the legacy raw `<canvas>` and Chart.js initializer.

### Observable Plot Area

```html
<div class="r-chart-wrap">
  <div class="r-chart-title">Daily volume</div>
  <div id="volumePlot"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const data = [
    { day: 'W1', cases: 1200 },
    { day: 'W2', cases: 1480 },
    { day: 'W3', cases: 1390 },
    { day: 'W4', cases: 1710 }
  ];
  const chart = Plot.plot({
    width: 680,
    height: 280,
    style: { background: 'transparent', color: '#c8d8f0', fontFamily: 'Poppins,sans-serif' },
    x: { label: null },
    y: { grid: true, label: null, tickFormat: d => d.toLocaleString() },
    marks: [
      Plot.areaY(data, { x: 'day', y: 'cases', fill: '#0f82f5', fillOpacity: .25 }),
      Plot.lineY(data, { x: 'day', y: 'cases', stroke: '#0f82f5', strokeWidth: 2 }),
      Plot.ruleY([0], { stroke: '#1e3a5f' })
    ]
  });
  document.getElementById('volumePlot').append(chart);
});
</script>
```

### D3 Treemap

```html
<div class="r-chart-wrap">
  <div class="r-chart-title">Volume by journey</div>
  <div id="treemap"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  const raw = [
    { name: 'J0107', value: 52208 },
    { name: 'J0106', value: 11119 },
    { name: 'J0101', value: 8648 },
    { name: 'J0116', value: 3751 }
  ];
  const colours = ['#0f82f5', '#59d6fd', '#5143d5', '#f99358'];
  const width = 680;
  const height = 300;
  const root = d3.hierarchy({ children: raw }).sum(d => d.value);
  d3.treemap().size([width, height]).padding(3)(root);
  const svg = d3.select('#treemap').append('svg').attr('width', width).attr('height', height);
  const cell = svg.selectAll('g').data(root.leaves()).join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);
  cell.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', (_, i) => colours[i % colours.length])
    .attr('rx', 4);
  cell.append('text')
    .attr('x', 8)
    .attr('y', 20)
    .attr('fill', '#ffffff')
    .attr('font-size', 13)
    .attr('font-family', 'Poppins,sans-serif')
    .text(d => d.data.name);
});
</script>
```

## Inline SVG

Use inline SVG for exact static visuals. Keep fills dark and text readable on navy.

```html
<div class="r-chart-wrap">
  <div class="r-chart-title">Completion funnel</div>
  <svg viewBox="0 0 640 240" role="img" aria-label="Completion funnel" style="width:100%;max-width:640px">
    <rect x="60" y="24" width="520" height="52" fill="#0f82f5" rx="4"/>
    <text x="84" y="57" fill="#ffffff" font-family="Poppins,sans-serif" font-size="15">Invited</text>
    <text x="552" y="57" fill="#ffffff" font-family="Poppins,sans-serif" font-size="15" text-anchor="end">8,420</text>
    <rect x="100" y="94" width="440" height="52" fill="#5143d5" rx="4"/>
    <text x="124" y="127" fill="#ffffff" font-family="Poppins,sans-serif" font-size="15">Started</text>
    <text x="512" y="127" fill="#ffffff" font-family="Poppins,sans-serif" font-size="15" text-anchor="end">6,568</text>
    <rect x="160" y="164" width="320" height="52" fill="#66cc8e" rx="4"/>
    <text x="184" y="197" fill="#071228" font-family="Poppins,sans-serif" font-size="15">Completed</text>
    <text x="452" y="197" fill="#071228" font-family="Poppins,sans-serif" font-size="15" text-anchor="end">5,136</text>
  </svg>
</div>
```

## Authoring Safety

- No slide delimiters (`---`) unless you want a horizontal rule in report prose.
- No `deck-*` tags.
- No CDN script tags.
- No minified library source in Markdown.
- No init scripts after `</main></div>`.
- No em dash or double-hyphen separators in JavaScript comments.
- No light SVG islands on dark navy backgrounds.
