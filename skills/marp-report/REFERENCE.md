# Marp Report Reference

Reports are single-page HTML documents. They are not slide decks. Authors write
Markdown and renderer-owned rich effect tags; the renderer owns CSS, layout,
runtime behavior, print behavior, and offline vendor injection.

## Build Command

From the `skills/marp-report` folder:

```bash
node scripts/build-report.mjs report.md --out-dir output
```

For PDF, open the generated HTML in a browser and use Print to PDF.

## Frontmatter

```md
---
title: Usage Report
subtitle: April 2026 journey volume
surface: dark
---
```

Fields:

| Field | Purpose |
| --- | --- |
| `title` | Report cover title and browser title |
| `subtitle` | Report cover subtitle |
| `surface: dark` | Use the Lightico dark report surface |
| omit `surface` | Use the default light report surface |

## Structure

Use Markdown headings, prose, tables, lists, and blockquotes. The renderer wraps
the content in a report page, creates the cover, and builds a sticky table of
contents when there are four or more body headings.

```md
# Executive summary

The report is one scrolling HTML page.

## Volume

The dominant journey accounts for most cases.

## Breakdown

| Journey | Cases | Status |
| --- | ---: | --- |
| J0107 | 52,208 | <span class="r-badge green">Active</span> |

## Actions

1. Confirm the data owner.
2. Review the outlier journey.
```

Do not write `<main>`, sidebars, layout wrappers, or report-level CSS. The
renderer creates those.

## Rich Effect Tags

These tags are allowed inside reports. In report mode they render as in-flow
blocks inside the single page, not as slides.

| Tag | Use for | Child tags |
| --- | --- | --- |
| `deck-rich-stats` or `deck-metric-rings` | Animated metric rings | `deck-rich-metric` |
| `deck-rich-bars` | Animated grouped bar chart | `deck-rich-series` |
| `deck-rich-line` | Animated SVG line chart | `deck-rich-series` |
| `deck-rich-donut` | Animated donut chart | `deck-rich-segment` |
| `deck-rich-timeline` | Staged timeline | `deck-rich-milestone` |
| `deck-tilt-cards` | 3D tilt cards | `deck-rich-card` |
| `deck-glass-cards` | Glass card grid | `deck-rich-card` |
| `deck-radar-chart` | Radar chart | `deck-rich-axis` |
| `deck-stagger-grid` | Staggered feature grid | `deck-rich-card` |
| `deck-comparison-reveal` | Capability comparison | `deck-rich-column`, `deck-rich-row` |
| `deck-gauge` | Gauge and metric bars | `deck-rich-metric` |
| `deck-reveal-stack` | Staged narrative bridge | attributes only |

Report mode rejects slide-only components such as `deck-card-grid`,
`deck-chart`, `deck-divider`, and `deck-close`.

### Metric Rings

```md
<deck-rich-stats eyebrow="Report metric rings" title="Operational|Highlights">
  <deck-rich-metric value="99.9" unit="%" label="Availability" progress="99.9" color="blue"></deck-rich-metric>
  <deck-rich-metric value="127" unit="k" label="Daily Users" progress="85" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="2.8" unit="s" label="Avg Completion" progress="70" color="green"></deck-rich-metric>
</deck-rich-stats>
```

### Bars

```md
<deck-rich-bars title="Journey|Volume" labels="Q1,Q2,Q3,Q4">
  <deck-rich-series name="Platform" values="65,72,68,85" color="blue"></deck-rich-series>
  <deck-rich-series name="Mobile" values="40,55,62,74" color="cyan"></deck-rich-series>
  <deck-rich-series name="Integration" values="30,38,52,61" color="purple"></deck-rich-series>
</deck-rich-bars>
```

### Donut

```md
<deck-rich-donut title="Channel|Mix" total="486" total-label="Sessions">
  <deck-rich-segment label="Digital" value="45" color="blue"></deck-rich-segment>
  <deck-rich-segment label="Mobile" value="25" color="cyan"></deck-rich-segment>
  <deck-rich-segment label="Assisted" value="20" color="orange"></deck-rich-segment>
  <deck-rich-segment label="Partner" value="10" color="green"></deck-rich-segment>
</deck-rich-donut>
```

### Radar And Gauge

```md
<deck-radar-chart title="Capability|Radar">
  <deck-rich-axis label="Speed" value="92" baseline="70" color="blue"></deck-rich-axis>
  <deck-rich-axis label="Accuracy" value="88" baseline="75" color="cyan"></deck-rich-axis>
  <deck-rich-axis label="Scale" value="95" baseline="60" color="green"></deck-rich-axis>
  <deck-rich-axis label="Security" value="98" baseline="80" color="orange"></deck-rich-axis>
</deck-radar-chart>

<deck-gauge title="Performance|Gauge" value="87" label="CSAT Score" sub="Customer Satisfaction">
  <deck-rich-metric value="94" unit="%" label="Response Rate" progress="94" color="blue"></deck-rich-metric>
  <deck-rich-metric value="87" unit="%" label="First Contact Resolution" progress="87" color="cyan"></deck-rich-metric>
</deck-gauge>
```

## Inline Report Classes

Use these small classes only where Markdown needs a compact inline treatment.
Do not recreate layout wrappers with them.

| Class | Use |
| --- | --- |
| `r-badge blue` | Informational status |
| `r-badge green` | Positive/active status |
| `r-badge orange` | Watch/review status |
| `r-badge red` | Blocked/risk status |
| `r-badge muted` | Pending/neutral status |
| `r-callout warning` | Optional short HTML callout if a blockquote is not specific enough |
| `r-card-accent green/orange/red/purple` | Optional compact finding card |

Prefer Markdown blockquotes before custom callout HTML:

```md
> Action: J0116 generated meaningful volume but is not in the registered journey profile.
```

## What Not To Write

Do not put these in `report.md`:

- `<style>` blocks
- `<script>` blocks
- CDN `<script src>` tags
- layout skeletons such as `<main>`, `<aside>`, or sticky sidebar HTML
- hand-authored Chart.js, D3, or Observable Plot initializers
- slide-only deck components

Use Markdown for narrative/data and the rich renderer tags for visual effects.
