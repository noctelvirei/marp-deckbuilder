---
name: marp-report
description: Builds long-form, scrollable, brandable HTML reports from source data. Use when the user asks for a report, findings document, written analysis, or print-to-PDF output rather than a slide deck.
---

# Marp Report

Use this skill to turn source material into a long-form HTML report: a scrollable, self-contained document designed to be read in a browser and printed to PDF. The generated HTML must embed image assets and vendor scripts; source assets can live under `tool/resources`, but report output should not depend on sidecar resource files. Use `marp-deckbuilder` instead when the user asks for slides, a presentation, or editable PPTX.

## Core Rule

Do not force reports into slides. Write `report.md` using normal Markdown plus the report component tags in `REFERENCE.md`, then run the bundled report wrapper. This skill includes its own bundled renderer and resources under `tool/`.

The report wrapper injects Chart.js, Observable Plot, and D3 into the generated HTML head from local vendor files, so the final HTML works offline after generation. The report Markdown must not contain raw HTML layouts, SVG blocks, chart containers, CSS, JavaScript, or library source. Use supported `report-*` components only. If the requested display is not supported, tell the user to ask the skill maker to add a renderer-backed component.

## Workflow

1. Read the source material and identify the report purpose, audience, period, source data, and required decisions.
2. Ask for theme preference before drafting when the user has not already specified it:
   `Dark navy report theme (recommended) or light print theme?`
3. Create one output folder for the request. Prefer `Documents/Presentations/YYYY-MM-DD/<report-title-slug>/` when the user has not specified a location.
4. Draft `report.md` in that folder. For dark navy, set `reportTheme: dark` in frontmatter. For reports with four or more sections, set `reportNav: true` to generate a sticky sidebar from headings.
5. Let the renderer own brand chrome. Corporate logos, colors, fonts, and report background assets come from `tool/resources/definitions/brand.json` and `tool/resources`; do not hand-place branding in report Markdown.
6. Use report components for fidelity. Use `<report-metric-grid>` for KPI cards, `<report-key-values>` for metadata summaries, `<report-rate-bars>` for ranked distributions, `<report-data-table>` for formatted tabular data, `<report-source-note>` for citations or methodology, `<report-callout>` for findings or actions, `<report-accent-card>` for recommendation cards, `<report-badge>` for inline statuses, and `<report-chart>` for supported chart types. Do not use raw HTML or JavaScript as a fallback. If a component type is missing, tell the user to ask the skill maker to add it.
7. Build from this skill folder:

```bash
node scripts/build-report.mjs <output-folder>/report.md --out-dir <output-folder>
```

8. Return the generated `.html` and source `.md` paths. Do not create or return a generated resource folder for report images; they should be embedded in the HTML. For PDF, tell the user to open the HTML and use browser Print to PDF.

## Available Components

Use these renderer-backed component tags in `report.md`. They look like HTML tags, but they are report directives consumed by the renderer.

| Need | Component | Required data |
| --- | --- | --- |
| KPI cards | `<report-metric-grid>` with `<report-metric>` children | Metric `value` and/or `label` |
| Metadata or context summary | `<report-key-values>` | `items`; optional `title`, `columns` |
| Ranked distribution bars | `<report-rate-bars>` | `labels`, `values`; optional `shares` |
| Formatted data table | `<report-data-table>` | `columns`, `rows`; optional `types`, `caption`, `source` |
| Citation or methodology note | `<report-source-note>` | Body text and/or `source`; optional `title`, `date` |
| Mixed insight/action card grid | `<report-card-grid>` with `<report-card>` children | Card `title` and/or body text |
| Ordered milestones/events | `<report-timeline>` with `<report-event>` children | Event date/title/body |
| Findings and actions | `<report-callout>` | Body text or `text`; optional `variant`, `title` |
| Recommendation or insight card | `<report-accent-card>` | Body text or `body`; optional `accent`, `title` |
| Captioned embedded image | `<report-figure>` | `src`, `alt`; optional `caption`, `source`, `size` |
| Table status label | `<report-badge>` | Body text or `label`; optional `status`, `variant` |
| Chart.js bar chart | `<report-chart type="bar">` | `labels`, `values` |
| Chart.js line chart | `<report-chart type="line">` | `labels`, `values` |
| Chart.js doughnut chart | `<report-chart type="doughnut">` | `labels`, `values` |
| Chart.js grouped bar chart | `<report-chart type="grouped-bar">` | `labels`, `series`, matrix `values` |
| Chart.js stacked bar chart | `<report-chart type="stacked-bar">` | `labels`, `series`, matrix `values` |
| Observable Plot area chart | `<report-chart type="area">` | `points` as `x:y` pairs, or `labels` and `values` |
| D3 treemap | `<report-chart type="treemap">` | `labels`, `values` |
| D3 funnel | `<report-chart type="funnel">` | `labels`, `values` |
| D3 heatmap | `<report-chart type="heatmap">` | `x-labels`, `y-labels`, matrix `values` |

## Markdown Generation Pattern

Generate `report.md` in this order:

1. Frontmatter with `title`, optional `subtitle`, `reportTheme`, and `reportNav`.
2. Markdown headings for report sections.
3. Prose, Markdown lists, and Markdown tables for narrative content.
4. Renderer component tags from the available list for visuals, cards, statuses, and charts.
5. No raw HTML, CSS, SVG, canvas, JavaScript, CDN tags, or handwritten chart initializers.

## Authoring Guidance

- Write for a reader scrolling a document, not for a presenter advancing slides.
- Use prose, headings, Markdown lists, Markdown tables, and report components freely.
- Prefer `reportNav: true` for reports with four or more sections.
- Prefer `reportTheme: dark` for dark navy reports instead of pasting CSS into Markdown.
- Keep branding renderer-owned through `brand.json` and bundled resources; report Markdown should not declare corporate logos, brand colors, fonts, or background chrome.
- Keep technical field names as plain text in dark reports unless code formatting is truly necessary.
- Use `<report-chart type="bar">`, `<report-chart type="line">`, or `<report-chart type="doughnut">` for standard Chart.js charts with renderer-owned hover tooltips.
- Use `<report-chart type="grouped-bar">` for Chart.js grouped comparisons with matrix `values` like `10|20;12|24`.
- Use `<report-chart type="stacked-bar">` for Chart.js cumulative comparisons with the same matrix syntax.
- Use `<report-chart type="area">` for Observable Plot time-series area charts with renderer-owned hover tips.
- Use `<report-chart type="treemap">` for D3 treemaps with renderer-owned sizing, brand colors, and hover tips.
- Use `<report-chart type="funnel">` for D3 stage funnels with renderer-owned hover tips.
- Use `<report-chart type="heatmap">` for D3 matrix intensity displays with renderer-owned hover tips.
- Use `<report-metric-grid>` for KPI summaries.
- Use `<report-key-values>` for metadata, report context, parameters, and compact label/value summaries.
- Use `<report-rate-bars>` for ranked distribution bars.
- Use `<report-data-table>` for formatted tables with text, number, percent, and status columns.
- Use `<report-source-note>` for citations, methodology, assumptions, and data freshness notes.
- Use `<report-card-grid>` for grouped insights, action plans, ownership summaries, and mixed card layouts.
- Use `<report-timeline>` for ordered milestones, delivery paths, decision logs, and event sequences.
- Use `<report-callout>` for info, warning, success, and danger findings.
- Use `<report-accent-card>` for highlighted recommendations, risks, or ownership notes.
- Use `<report-figure>` for captioned images, screenshots, and diagrams stored under resources.
- Use `<report-badge>` for table statuses and small inline state labels.
- For chart types that are not yet supported, do not write Chart.js, Observable Plot, D3, SVG, or HTML manually. Tell the user to ask the skill maker to add that chart type.

## Renderer-Only Rules

Report Markdown is a compact data-and-copy layer. The renderer owns all HTML structure, CSS hooks, SVG, chart containers, and JavaScript initializers.

1. Do not write raw HTML blocks in `report.md`.
2. Do not write `<style>`, `<script>`, `<canvas>`, `<svg>`, or chart container elements in `report.md`.
3. Do not include CDN tags, vendored library source, or chart initializers in `report.md`.
4. Do not hand-place logos, background assets, brand colors, or fonts in `report.md`.
5. When a supported capability exists, remove any legacy raw-code guidance for it from this skill.
6. When a requested capability does not exist, tell the user to ask the skill maker to add it as a renderer-backed component.

## Dark-Mode Rules

- Do not use light SVG fills such as `#f8fbff`, `#fdfdfd`, or white chart backgrounds on the navy theme.
- Renderer-generated SVG text on dark backgrounds should use `#C8D8F0`, `#8B9AB5`, or `#FFFFFF`, not near-black text.
- Do not write raw HTML, SVG, CSS, JavaScript, or library code into Markdown.
- Do not rely on external network scripts for final output.
- These are renderer component choices, not CSS problems. If the renderer component does not support the need, ask the skill maker to add or adjust it.

## Build Output

`scripts/build-report.mjs` writes:

- `report.html`: self-contained report HTML with brand resources and vendor chart libraries inlined.
- `report.md`: unchanged source file.

The skill intentionally does not bundle a browser engine. PDF export is done with browser Print to PDF.

See [REFERENCE.md](REFERENCE.md) for the full report component library and working examples.
