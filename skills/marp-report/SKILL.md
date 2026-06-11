---
name: marp-report
description: Builds long-form, scrollable, brandable HTML reports from source data. Use when the user asks for a report, findings document, written analysis, or print-to-PDF output rather than a slide deck.
---

# Marp Report

Use this skill to turn source material into a long-form HTML report: a scrollable, self-contained document designed to be read in a browser and printed to PDF. Use `marp-deckbuilder` instead when the user asks for slides, a presentation, or editable PPTX.

## Core Rule

Do not force reports into slides. Write `report.md` using normal Markdown plus the report component tags in `REFERENCE.md`, then run the bundled report wrapper. This skill includes its own bundled renderer and resources under `tool/`.

The report wrapper injects Chart.js, Observable Plot, and D3 into the generated HTML head from local vendor files, so the final HTML works offline after generation. Use supported `report-*` components instead of pasting chart container HTML or JavaScript initializers. Do not paste minified library source into Markdown.

## Workflow

1. Read the source material and identify the report purpose, audience, period, source data, and required decisions.
2. Ask for theme preference before drafting when the user has not already specified it:
   `Dark navy report theme (recommended) or light print theme?`
3. Create one output folder for the request. Prefer `Documents/Presentations/YYYY-MM-DD/<report-title-slug>/` when the user has not specified a location.
4. Draft `report.md` in that folder. For dark navy, set `reportTheme: dark` in frontmatter. For reports with four or more sections, set `reportNav: true` to generate a sticky sidebar from headings.
5. Let the renderer own brand chrome. The corporate logo comes from the bundled brand resources; do not hand-place it in report Markdown.
6. Use report components for fidelity. Use `<report-metric-grid>` for KPI cards, `<report-rate-bars>` for ranked distributions, `<report-callout>` for findings or actions, and `<report-chart type="bar">` for standard bar charts. For component types that are not implemented yet, use the class patterns in `REFERENCE.md` as a temporary fallback.
7. Build from this skill folder:

```bash
node scripts/build-report.mjs <output-folder>/report.md --out-dir <output-folder>
```

8. Return the generated `.html` and source `.md` paths. For PDF, tell the user to open the HTML and use browser Print to PDF.

## Authoring Guidance

- Write for a reader scrolling a document, not for a presenter advancing slides.
- Use prose, headings, tables, and explanatory callouts freely.
- Prefer `reportNav: true` for reports with four or more sections.
- Prefer `reportTheme: dark` for dark navy reports instead of pasting CSS into Markdown.
- Keep the corporate logo renderer-owned through brand definitions and resources.
- Keep technical field names as plain text in dark reports unless code formatting is truly necessary.
- Use `<report-chart type="bar">` for standard Chart.js bar charts.
- Use `<report-metric-grid>` for KPI summaries.
- Use `<report-rate-bars>` for ranked distribution bars.
- Use `<report-callout>` for info, warning, success, and danger findings.
- Use Chart.js manually only for chart types that are not yet supported as report components, such as stacked bar, line, and doughnut charts.
- Use Observable Plot for concise dot, area, heatmap, and small-multiple charts.
- Use D3 for bespoke SVG charts such as treemaps, custom arcs, Sankey-style flows, and force layouts.
- Use inline SVG when the visual should be static, exact, and dependency-free.

## Script Rules

For supported `report-*` components, do not write JavaScript. The renderer generates the container and initializer. Follow these rules exactly only for temporary custom visuals that still require handwritten JavaScript:

1. Do not include CDN `<script src>` tags in `report.md`. The wrapper injects bundled vendor libraries into the final HTML head.
2. Put chart containers in the relevant section body.
3. Put one init `<script>` block as the last element inside `<main class="r-main">`, before `</main>` and `</div>`.
4. Wrap every initializer in `document.addEventListener('DOMContentLoaded', function() { ... })`.
5. Never put `<script>` tags after `</main></div>`. Some Markdown renderers will turn them into visible text.
6. Never use em dashes or double-hyphen separators in JavaScript comments. Use simple comments such as `// Bar chart section`.

## Dark-Mode Rules

- Do not use light SVG fills such as `#f8fbff`, `#fdfdfd`, or white chart backgrounds on the navy theme.
- SVG text on dark backgrounds should use `#C8D8F0`, `#8B9AB5`, or `#FFFFFF`, not near-black text.
- Do not write raw library code into Markdown.
- Do not rely on external network scripts for final output.
- These are authoring choices, not CSS problems. Fix the source pattern instead of stacking override rules.

## Build Output

`scripts/build-report.mjs` writes:

- `report.html`: self-contained report HTML with brand resources and vendor chart libraries inlined.
- `report.md`: unchanged source file.

The skill intentionally does not bundle a browser engine. PDF export is done with browser Print to PDF.

See [REFERENCE.md](REFERENCE.md) for the full report component library and working examples.
