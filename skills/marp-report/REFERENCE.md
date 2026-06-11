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

## Report Theme

Use renderer-owned frontmatter for theme and navigation:

```yaml
reportTheme: dark
reportNav: true
```

Do not paste CSS into report Markdown. Add or update renderer-owned theme support instead.

## Component Tags

Reports use normal Markdown plus compact `report-*` component tags. The renderer expands those tags into HTML, CSS hooks, SVG where needed, and JavaScript initializers. Do not write raw HTML, CSS, SVG, canvas, or JavaScript in report Markdown.

## Available Renderer Components

| Need | Component | Required data |
| --- | --- | --- |
| KPI card grid | `report-metric-grid` with `report-metric` children | Metric `value` and/or `label` |
| Ranked distribution bars | `report-rate-bars` | `labels`, `values`; optional `shares` |
| Finding, risk, or action block | `report-callout` | Body text or `text`; optional `variant`, `title` |
| Highlighted recommendation card | `report-accent-card` | Body text or `body`; optional `accent`, `title` |
| Inline status label | `report-badge` | Body text or `label`; optional `status`, `variant` |
| Chart.js bar chart | `report-chart type="bar"` | `labels`, `values` |
| Chart.js line chart | `report-chart type="line"` | `labels`, `values` |
| Chart.js doughnut chart | `report-chart type="doughnut"` | `labels`, `values` |
| Observable Plot area chart | `report-chart type="area"` | `points` as `x:y` pairs, or `labels`, `values` |
| D3 treemap | `report-chart type="treemap"` | `labels`, `values` |

## Generating Report Markdown

Use this sequence when creating `report.md`:

1. Add frontmatter for `title`, optional `subtitle`, optional `reportTheme: dark`, and optional `reportNav: true`.
2. Add Markdown headings for sections.
3. Add narrative content with plain Markdown paragraphs, lists, and tables.
4. Add visuals only through the available `report-*` component tags below.
5. Build with `node scripts/build-report.mjs report.md --out-dir output`.

If the needed visual is not listed, do not create raw HTML or JavaScript in the Markdown. Tell the user to ask the skill maker to add a renderer-backed component.

### Report Chart: Chart.js, Observable Plot, And D3

Use `report-chart` for standard Chart.js bar, line, and doughnut charts, Observable Plot area charts, and D3 treemaps. Do not write the `<canvas>`, chart container, SVG, or JavaScript initializer yourself. The renderer generates hover tooltips that show the represented value.

```md
<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>
```

```md
<report-chart
  type="line"
  title="Weekly case volume"
  series="Cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="17240,18990,20530,21191"
></report-chart>
```

```md
<report-chart
  type="doughnut"
  title="Journey mix"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>
```

```md
<report-chart
  type="area"
  title="Daily volume"
  series="Cases"
  points="2026-04-01:2200,2026-04-02:2600,2026-04-03:2450"
></report-chart>
```

```md
<report-chart
  type="treemap"
  title="Volume by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `type` | no | Supports `bar`, `line`, `doughnut`, `area`, and `treemap`. Defaults to `bar`. Aliases: `donut`, `tree-map`. |
| `title` | no | Rendered above the chart and used as the accessible label. |
| `series` | no | Dataset label. |
| `labels` | yes for Chart.js and `treemap` types | Comma-separated labels. For `area`, this can be used with `values` as an alternative to `points`. |
| `values` | yes for Chart.js and `treemap` types | Comma-separated numeric values. Must match label count. For `area`, this can be used with `labels` as an alternative to `points`. |
| `points` | yes for `area` | Comma-separated `x:y` or `x=y` points such as `2026-04-01:2200,2026-04-02:2600`. Alias: `data`. |
| `colors` | no | Comma-separated hex colors. Defaults to brand chart colors. |
| `height` | no | Pixel height, clamped by the renderer. Defaults to `320`. |
| `value-prefix` | no | Prefix shown in tooltips, such as `$`. Alias: `prefix`. |
| `value-suffix` | no | Suffix shown in tooltips, such as `%` or ` cases`. Alias: `suffix`. |

### Report Metric Grid

Use `report-metric-grid` for KPI cards. Do not hand-author nested metric card `div` blocks.

```md
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

```md
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

```md
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

Use `report-accent-card` for highlighted recommendations, risks, ownership notes, and small standalone insight cards. Do not hand-author raw card blocks for standard cards.

```md
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

```md
<report-badge status="active">Active</report-badge>
<report-badge status="review" label="Review"></report-badge>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `variant` | no | Supports `blue`, `green`, `orange`, `red`, `muted`. Aliases: `color`, `tone`. |
| `status` | no | Maps common statuses such as `active`, `review`, `blocked`, and `pending` to badge colors. |
| `label` | no | Badge text when you prefer attribute-only authoring. Otherwise use the tag body. |

## Unsupported Capabilities

Do not use raw HTML, CSS, SVG, canvas, Chart.js, Observable Plot, D3, or handwritten JavaScript as a fallback in report Markdown.

When the report needs a display type that is not listed above, ask the skill maker to add it as a renderer-backed component. The skill maker should:

1. Add parsing in `src/report-components/parsers.js`.
2. Add validation and registration in `src/report-components.js`.
3. Add HTML, SVG, and script generation in `src/report-components/renderers.js` or report CSS in `src/report.js`.
4. Add tests in `test/report.test.js`.
5. Add a compact component example to this reference and `skills/marp-report/examples/`.

Do not use `deck-*` tags in reports. They are presentation components.

## Authoring Safety

- No slide delimiters (`---`) unless you want a horizontal rule in report prose.
- No `deck-*` tags.
- No raw HTML blocks.
- No CSS, SVG, canvas, script tags, chart containers, chart initializer scripts, CDN tags, or minified library source in Markdown.
- No hand-placed logos, brand colors, font declarations, or background chrome.
- No unsupported visuals. Ask the skill maker to add a renderer-backed component.
