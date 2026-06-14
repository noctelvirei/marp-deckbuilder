# Plan: Modular Report Component Pipeline

> Source PRD: User request on 2026-06-11 to replace report Markdown that is mostly HTML, CSS, and JavaScript with compact report component calls rendered by the report pipeline.

## Architectural Decisions

Durable decisions that apply across all phases:

- **Authoring contract**: Report Markdown should contain normal prose, headings, data, and compact report component calls. It should not require pasted CSS setup, chart container HTML, or JavaScript initializers for standard visuals.
- **Component namespace**: Use report-specific tags such as `report-chart`, `report-metric-grid`, and `report-callout`. Do not reuse `deck-*` tags, because reports and presentation decks have different output contracts.
- **Renderer boundary**: Add report component expansion before MarkdownIt renders the body in `src/report.js`, or through a small report component module called from there.
- **Source modularity**: Keep parsing, validation, rendering, CSS, and script generation in modular source files so new components can be added one at a time. The distributable skill can still ship as the existing bundled single runtime file.
- **Vendor boundary**: Keep D3, Observable Plot, and Chart.js injected by the report build wrapper from local vendor files. Component code should only generate initializers that assume those globals exist in the final HTML.
- **Generated output**: Continue producing one self-contained report HTML file. The source `report.md` remains unchanged after build.
- **Brand chrome retention**: Corporate logo rendering remains renderer-owned and must be preserved while Markdown moves to compact report components. Authors should not hand-place the corporate logo in report Markdown.
- **Verification loop**: Every component slice must include focused tests, a generated sample Markdown file, a rendered HTML output, and browser visual inspection with screenshots stored under `.tmp/`.
- **Skill packaging**: Runtime changes are made in `src/`, then propagated through `npm run bundle:skill`. Do not hand-edit generated `tool/dist/` files.

---

## Phase 1: Report Component Compiler Spine

**User stories**: Agents can write compact report component calls; the renderer expands them before final HTML generation.

### What To Build

Create the report-side component compiler that can parse known report tags, validate them, render HTML fragments, collect any required CSS and script initializers, and pass the expanded Markdown into the existing report renderer. This phase should include one very small non-chart tracer component if needed to prove the compiler path without adding chart complexity.

### Acceptance Criteria

- [ ] Report rendering preserves existing Markdown, tables, images, and raw HTML behavior.
- [ ] Unknown or malformed `report-*` components fail with clear line-aware errors.
- [ ] Component parsing, rendering, validation, shared utilities, CSS, and script collection are separated enough that a new component can be added without growing one monolithic function.
- [ ] The bundled skill still builds into one distributable runtime file.
- [ ] Tests cover the component compiler path and unchanged legacy report rendering.

---

## Phase 2: Chart.js Bar Chart Tracer Bullet

**User stories**: Agents can request a standard bar chart without writing canvas HTML or Chart.js initializer code.

### What To Build

Implement the first real report component as a Chart.js bar chart. The author supplies title, labels, values, optional series label, optional colors, and accessible label text through a compact `report-chart` call. The renderer generates the chart frame, canvas, stable ID, and DOMContentLoaded initializer.

Example authoring shape:

```md
<report-chart
  type="bar"
  title="Cases by journey"
  labels="Journey A,Journey B,Journey C,Journey D"
  values="5200,1100,860,380"
></report-chart>
```

### Acceptance Criteria

- [ ] The source Markdown contains no chart `<canvas>` HTML and no chart `<script>`.
- [ ] The rendered HTML includes one chart container and one generated initializer.
- [ ] Multiple bar charts on the same report get unique IDs and render independently.
- [ ] Invalid labels or values fail clearly.
- [ ] A generated sample MD is rendered through `skills/marp-report/scripts/build-report.mjs`.
- [ ] Browser inspection confirms the chart is visible, correctly sized, and styled; screenshot is saved under `.tmp/`.

---

## Phase 3: Dark Report Layout And Theme Preset

**User stories**: Agents can request the dark navy report layout without pasting a giant CSS block or sidebar scaffold.

### What To Build

Move the reusable dark report CSS and layout skeleton into the report renderer. Add a compact layout component or frontmatter contract that wraps report body content in the sticky-sidebar layout and applies the dark theme. Navigation should be generated from explicit nav data or from headings when explicit data is absent.

Example authoring shape:

```md
---
title: Sample Usage Report
subtitle: Synthetic journey volume
reportTheme: dark
reportNav: true
---
```

### Acceptance Criteria

- [ ] Authors no longer paste the dark navy `<style>` block.
- [ ] Reports with four or more sections can get a sticky sidebar without hand-authored layout HTML.
- [ ] Existing light/default report output remains available.
- [ ] Corporate logo assets from brand definitions still render in the report cover and are preserved in dark themed reports.
- [ ] Chart components render correctly inside the themed layout.
- [ ] Browser screenshots cover desktop and a narrow viewport.

---

## Phase 4: Metric Grid Component

**User stories**: Agents can present KPI cards with values, labels, deltas, and semantic colors using compact component data.

### What To Build

Implement `report-metric-grid` and child metric parsing. Support value, label, optional subtext, optional direction, and optional accent color. Render the existing metric-card visual style from structured input.

### Acceptance Criteria

- [ ] Metric grids can be authored without nested `div` blocks.
- [ ] Optional positive and negative deltas render with semantic styles.
- [ ] Long labels wrap cleanly and do not break the grid.
- [ ] Tests cover empty grids, missing values, and escaping of text.
- [ ] Screenshot verifies the grid in dark and default report contexts.

---

## Phase 5: Rate Bars / Ranked Distribution Component

**User stories**: Agents can show ranked shares without inline width and background HTML.

### What To Build

Implement a ranked rate-bar component that accepts labels, values, optional shares, and optional colors. Calculate widths when shares are not supplied. Render accessible, stable rate bars using the existing report visual language.

### Acceptance Criteria

- [ ] Authors can express a full distribution in one compact component block.
- [ ] Widths are clamped safely and do not overflow.
- [ ] The component supports raw values plus percentages.
- [ ] Tests cover computed shares, explicit shares, zero totals, and malformed values.
- [ ] Screenshot verifies visual output next to a chart and table.

---

## Phase 6: Callouts, Badges, And Accent Cards

**User stories**: Agents can mark findings, risks, statuses, and recommendation cards without raw class-heavy HTML.

### What To Build

Implement compact components for report callouts, badges, and accent cards. Keep them intentionally small and composable rather than creating a broad generic layout system.

### Acceptance Criteria

- [ ] `report-callout` supports info, warning, success, and danger variants.
- [ ] `report-badge` supports the current status colors and can be used in Markdown tables.
- [ ] Accent cards support title, body, and accent color.
- [ ] Components escape text safely.
- [ ] Skill reference examples replace raw class-heavy snippets.

---

## Phase 7: Observable Plot Area Chart

**User stories**: Agents can request compact time-series or area charts using structured data, with renderer-owned Plot setup.

### What To Build

Add an Observable Plot backed chart type after the Chart.js bar path is stable. Start with an area chart because it maps directly to the current report guidance and gives the compiler a second JavaScript backend.

### Acceptance Criteria

- [ ] `report-chart type="area"` generates an Observable Plot chart and initializer.
- [ ] The component can parse x/y pairs from compact inline data.
- [ ] The rendered chart works offline using the injected local Plot vendor library.
- [ ] Tests prove Chart.js and Plot initializers can coexist in the same report.
- [ ] Screenshot verifies the chart after rendering through the skill wrapper.

---

## Phase 8: D3 Treemap Or Bespoke SVG Component

**User stories**: Agents can request one richer bespoke visual at a time while keeping Markdown small.

### What To Build

Implement one D3 component, starting with a treemap because it is already documented in the current report reference. Keep its options narrow: title, labels, values, optional colors, and dimensions.

### Acceptance Criteria

- [ ] `report-chart type="treemap"` generates D3 SVG output at runtime.
- [ ] D3 and Chart.js components can coexist without ID collisions.
- [ ] Values are validated and escaped where rendered as labels.
- [ ] Screenshot verifies readable labels on the dark report theme.

---

## Phase 9: Skill Docs And Example Rewrite

**User stories**: The report skill instructs agents to use compact report components, and the example demonstrates the new style instead of 95% CSS, HTML, and JavaScript.

### What To Build

Rewrite the report skill guidance and reference around the new component contract. Replace the current raw HTML-heavy example with compact component calls that render to equivalent output.

### Acceptance Criteria

- [ ] `skills/marp-report/SKILL.md` tells agents to use report components rather than copying CSS and JS.
- [ ] `skills/marp-report/REFERENCE.md` documents each implemented component with compact examples.
- [ ] `skills/marp-report/examples/example.md` is substantially smaller and uses the new component calls.
- [ ] README report guidance points to the new contract.
- [ ] Legacy raw HTML remains possible for one-off advanced needs but is no longer the default path.

---

## Phase 10: Packaging And Regression Gate

**User stories**: Skill users get the updated bundled renderer, and smoke tests prove offline vendor injection plus component rendering still work.

### What To Build

Rebuild and smoke-test the portable skills after the component slices are complete. Keep generated bundles out of manual edits and use package scripts to sync `skills/marp-report/tool/dist/`.

### Acceptance Criteria

- [ ] `npm test` passes.
- [ ] `npm run check` passes.
- [ ] `npm run bundle:skill` passes and updates generated skill runtime output.
- [ ] `npm run smoke:skill` passes for both deck and report skills.
- [ ] Final report sample has compact Markdown, self-contained HTML, injected local vendors, and screenshot proof.
- [ ] Corporate logo rendering is covered by regression tests and remains renderer-owned.
