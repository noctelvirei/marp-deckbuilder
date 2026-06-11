---
title: Baseline Report Skill
subtitle: Single-page HTML report source for renderer-owned output
surface: dark
customerName: Example Customer
---

# Executive Summary

This report demonstrates how the `report` baseline should be authored: Markdown
for narrative structure, renderer-owned rich tags for visual emphasis, and small
approved inline classes only where tabular status needs a compact label.

The report skill does not create slides. It creates one scrollable HTML page
that can be reviewed in a browser and printed to PDF.

## Operating Signals

<deck-rich-stats eyebrow="Report metrics" title="Baseline|Signals">
  <deck-rich-metric value="3" unit="" label="Baseline skills" sub="present, richhtml, report" progress="75" color="blue"></deck-rich-metric>
  <deck-rich-metric value="0" unit="" label="Inline scripts" sub="runtime-owned behavior" progress="100" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="11" unit="" label="Chunks per skill" sub="semantic runtime bundles" progress="92" color="green"></deck-rich-metric>
</deck-rich-stats>

## Import Readiness

<deck-rich-bars title="Work import|Checks" labels="Clean bundles,Brand resources,Build HTML,Print PDF">
  <deck-rich-series name="Readiness" values="95,88,92,90" color="blue"></deck-rich-series>
  <deck-rich-series name="Risk reduced" values="90,84,88,86" color="cyan"></deck-rich-series>
</deck-rich-bars>

## Brand Ownership

Corporate branding belongs in `tool/resources/definitions/brand.json`,
`tool/resources/definitions/theme.css`, and `tool/resources/`. The corporate
logo is the renderer-owned company logo on the left. Customer logos are supplied
by report or deck frontmatter and render on the right when present.

| Area | Agent writes | Renderer owns | Status |
| --- | --- | --- | --- |
| Narrative | Markdown headings and paragraphs | Page shell and table of contents | <span class="r-badge green">Ready</span> |
| Metrics | Rich effect tags | Counters, rings, animation, print state | <span class="r-badge green">Ready</span> |
| Brand | Resource references and frontmatter | Logo placement, surfaces, backgrounds | <span class="r-badge green">Ready</span> |
| Runtime | Nothing custom | CSS, JavaScript, vendor injection | <span class="r-badge blue">Owned</span> |

## Capability Radar

<deck-radar-chart title="Report|Capability">
  <deck-rich-axis label="Clarity" value="91" baseline="72" color="blue"></deck-rich-axis>
  <deck-rich-axis label="Branding" value="88" baseline="70" color="cyan"></deck-rich-axis>
  <deck-rich-axis label="Print" value="94" baseline="74" color="green"></deck-rich-axis>
  <deck-rich-axis label="Governance" value="90" baseline="69" color="orange"></deck-rich-axis>
</deck-radar-chart>

## Verification Gauge

<deck-gauge title="Import|Confidence" value="91" label="Ready for work sync" sub="After smoke and print checks">
  <deck-rich-metric value="100" unit="%" label="Renderer-owned CSS" progress="100" color="blue"></deck-rich-metric>
  <deck-rich-metric value="100" unit="%" label="Renderer-owned JS" progress="100" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="91" unit="%" label="Print/PDF readiness" progress="91" color="green"></deck-rich-metric>
</deck-gauge>

## Actions

1. Remove old `tool/dist` chunks before importing new baseline skill bundles.
2. Reapply private corporate resources and theme files.
3. Build one presentation, one rich HTML deck, and one report from Markdown.
4. Check browser output, print/PDF behavior, and PPTX editability where relevant.
