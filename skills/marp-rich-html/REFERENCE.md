# Marp Rich HTML Reference

Rich HTML slides are browser-first presentation components. Authors write
custom tags; the renderer generates the HTML scaffold, CSS classes, runtime
initializers, animation timing, print snapshots, and PDF-safe fallbacks.

Do not add inline `<style>` or custom animation `<script>` blocks to slides that
use these tags.

## Build

Use the deckbuilder renderer:

```powershell
node src/cli.js build samples/rich-html-showcase.md --html dist/rich-html-showcase.html --resources resources
```

Inside the portable rich HTML baseline skill, use:

```powershell
node scripts/build-rich-html.mjs deck.md --out-dir output
```

## Parent Tags

| Tag | Purpose | Key attributes |
| --- | --- | --- |
| `deck-rich-cover` | Cinematic cover with animated canvas background | `eyebrow`, `title`, `highlight`, `subtitle`, `badge` |
| `deck-rich-agenda` | Numbered agenda/section navigation | `eyebrow`, `title`, `count`, `count-label` |
| `deck-rich-stats` | Animated metric rings and count-up values | `eyebrow`, `title` |
| `deck-metric-rings` | Alias for `deck-rich-stats` | same as `deck-rich-stats` |
| `deck-rich-bars` | Animated grouped bar chart | `eyebrow`, `title`, `labels` |
| `deck-rich-line` | Animated SVG line chart | `eyebrow`, `title`, `labels`, `max` |
| `deck-rich-donut` | Animated SVG donut chart | `eyebrow`, `title`, `total`, `total-label` |
| `deck-magazine-book` | 3D magazine page flip with print fallback | `eyebrow`, `title`, `chapter`, `quote`, `quote-emphasis`, `footer`, `hint` |
| `deck-rich-timeline` | Animated horizontal timeline | `eyebrow`, `title` |
| `deck-tilt-cards` | Mouse-driven 3D tilt card grid | `eyebrow`, `title` |
| `deck-typewriter` | Typewriter phrase reveal | `eyebrow` |
| `deck-particle-network` | Particle network canvas slide | `title`, `subtitle`, `tag` |
| `deck-neon-title` | Neon title and glow treatment | `title`, `subtitle` |
| `deck-glass-cards` | Glassmorphism card grid | `eyebrow`, `title` |
| `deck-radar-chart` | Radar chart with animated polygon and side bars | `eyebrow`, `title` |
| `deck-stagger-grid` | Staggered feature grid | `eyebrow`, `title` |
| `deck-comparison-reveal` | Animated capability comparison rows | `eyebrow`, `title`, `columns` |
| `deck-gauge` | Arc gauge with needle and metric bars | `eyebrow`, `title`, `value`, `label`, `sub` |
| `deck-reveal-stack` | Staged narrative reveal/bridge slide | `line1`, `line2`, `accent`, `body` |
| `deck-rich-close` | Closing slide with animated canvas background | `title`, `subtitle`, `button` |

Use `|` in title-like attributes when you want the renderer to insert a designed
line break or title accent.

## Brand Chrome And Surfaces

Corporate-branded rich HTML baselines should populate
`tool/resources/definitions/brand.json`, `theme.css`, and `tool/resources/`.
The renderer places the corporate logo from `assets.logo` top left and the
customer logo from deck frontmatter top right. Use light and dark logo variants
in the resource folder and reference one logical logo from Markdown.

## Child Tags

| Child tag | Parent tags | Key attributes |
| --- | --- | --- |
| `deck-rich-item` | `deck-rich-agenda`, `deck-neon-title` | `label`, `sub`, `color` |
| `deck-rich-card` | `deck-tilt-cards`, `deck-glass-cards`, `deck-stagger-grid` | `icon`, `title`, `body`, `tag`, `stat` |
| `deck-rich-metric` | `deck-rich-stats`, `deck-metric-rings`, `deck-gauge` | `value`, `unit`, `label`, `sub`, `progress`, `color` |
| `deck-rich-series` | `deck-rich-bars`, `deck-rich-line` | `name`, `values`, `color` |
| `deck-rich-segment` | `deck-rich-donut` | `label`, `value`, `color` |
| `deck-rich-milestone` | `deck-rich-timeline` | `year`, `title`, `body`, `color` |
| `deck-rich-phrase` | `deck-typewriter` | `text` |
| `deck-rich-axis` | `deck-radar-chart` | `label`, `value`, `baseline`, `color` |
| `deck-rich-column` | `deck-comparison-reveal` | `label` |
| `deck-rich-row` | `deck-comparison-reveal` | `feature`, `values`, `value-1`, `value-2`, `value-3` |
| `deck-magazine-page` | `deck-magazine-book` | `icon`, `title`, `body`, `number` |

Supported color tokens are `blue`, `cyan`, `purple`, `green`, `orange`, `red`,
and `yellow`.

Comparison row values accept `yes`, `partial`, and `no` plus common aliases such
as `true`, `maybe`, and `false`.

## Examples

### Cover

```md
<deck-rich-cover
  eyebrow="Lightico - CSS Showcase - 2026"
  title="The Future|of Rich HTML|Experiences"
  highlight="Rich HTML"
  subtitle="What CSS, SVG and Canvas can do without PowerPoint constraints"
  badge="Pure CSS - SVG - Canvas - No Libraries"
></deck-rich-cover>
```

### Metric Rings

```md
<deck-rich-stats eyebrow="CSS Animation - SVG Rings" title="Animated Statistics">
  <deck-rich-metric value="99.9" unit="%" label="Platform Uptime" progress="99.9" color="blue"></deck-rich-metric>
  <deck-rich-metric value="127" unit="k" label="Daily Active Users" progress="85" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="2.8" unit="s" label="Avg. Completion Time" progress="70" color="green"></deck-rich-metric>
</deck-rich-stats>
```

### Charts

```md
<deck-rich-bars title="Animated|Bar Chart" labels="Q1,Q2,Q3,Q4">
  <deck-rich-series name="Platform" values="65,72,68,85" color="blue"></deck-rich-series>
  <deck-rich-series name="Mobile" values="40,55,62,74" color="cyan"></deck-rich-series>
</deck-rich-bars>

---

<deck-rich-line title="Animated|Line Chart" labels="Jan,Feb,Mar,Apr,May" max="100">
  <deck-rich-series name="Engagement Rate" values="48,55,60,67,72" color="blue"></deck-rich-series>
  <deck-rich-series name="Completion Rate" values="30,36,40,46,53" color="cyan"></deck-rich-series>
</deck-rich-line>

---

<deck-rich-donut title="Animated|Donut Chart" total="486" total-label="Total Sessions">
  <deck-rich-segment label="Digital Onboarding" value="45" color="blue"></deck-rich-segment>
  <deck-rich-segment label="Mobile Banking" value="25" color="cyan"></deck-rich-segment>
  <deck-rich-segment label="Branch Assisted" value="20" color="orange"></deck-rich-segment>
</deck-rich-donut>
```

### Magazine Book

```md
<deck-magazine-book
  title="Magazine|Page Turn"
  chapter="Chapter 1 - The Story"
  quote="Every customer journey is a page waiting to be turned."
  quote-emphasis="page"
  footer="Turn the pages on the right"
>
  <deck-magazine-page icon="01" title="Speed to Value" body="Deploy in days, not months." number="Page 1 of 4"></deck-magazine-page>
  <deck-magazine-page icon="02" title="Zero Friction" body="Customers complete journeys from any device." number="Page 2 of 4"></deck-magazine-page>
  <deck-magazine-page icon="03" title="Real-time Insights" body="See where customers drop off." number="Page 3 of 4"></deck-magazine-page>
  <deck-magazine-page icon="04" title="Built for Enterprise" body="Enterprise-grade security with consumer-grade UX." number="Page 4 of 4"></deck-magazine-page>
</deck-magazine-book>
```

The HTML runtime turns the right-hand pages forward on right-side clicks and
turns them back on left-side clicks. Print mode hides the 3D book and shows every
page in a flat fallback grid.

### Radar And Gauge

```md
<deck-radar-chart title="Capability|Radar">
  <deck-rich-axis label="Speed" value="92" baseline="70" color="blue"></deck-rich-axis>
  <deck-rich-axis label="Accuracy" value="88" baseline="75" color="cyan"></deck-rich-axis>
  <deck-rich-axis label="Scale" value="95" baseline="60" color="green"></deck-rich-axis>
  <deck-rich-axis label="Security" value="98" baseline="80" color="orange"></deck-rich-axis>
</deck-radar-chart>

---

<deck-gauge title="Performance|Gauge" value="87" label="CSAT Score" sub="Customer Satisfaction">
  <deck-rich-metric value="94" unit="%" label="Response Rate" progress="94" color="blue"></deck-rich-metric>
  <deck-rich-metric value="87" unit="%" label="First Contact Resolution" progress="87" color="cyan"></deck-rich-metric>
</deck-gauge>
```

## Print And PDF

The renderer listens for browser print events. It snaps counters, bars, chart
paths, timeline items, comparison rows, radar polygons, and gauges to their final
state. Canvas backgrounds are hidden when needed, typewriter phrases are shown as
a static list, and the magazine book switches to its flat print fallback.

Verify PDF output with the browser Print dialog after any substantial theme or
runtime change.
