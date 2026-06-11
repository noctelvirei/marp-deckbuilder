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
reportDate: 2026-06-11
preparedFor: Customer Operations
preparedBy: Analytics
classification: Internal
version: v1.0
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
| Metadata or context summary | `report-key-values` | `items`; optional `title`, `columns` |
| Ranked distribution bars | `report-rate-bars` | `labels`, `values`; optional `shares` |
| Formatted data table | `report-data-table` | `columns`, `rows`; optional `types`, `compact`, `align`, `totals`, `highlights`, `caption`, `source` |
| Structured insight | `report-insight` | Finding/body text or `title`, `evidence`, `impact`, `action` |
| Owned recommendation | `report-recommendation` | Body text or `title`; optional `owner`, `priority`, `due`, `status` |
| Citation or methodology note | `report-source-note` | Body text and/or `source`; optional `title`, `date` |
| Reusable source list | `report-source-list` with `report-source` children | Source `id` and descriptive source data |
| Inline source citation | `report-cite` | `source` matching a declared `report-source` id |
| Print/PDF page break | `report-page-break` | Optional `label` |
| Mixed insight/action card grid | `report-card-grid` with `report-card` children | Card `title` and/or body text |
| Ordered milestones/events | `report-timeline` with `report-event` children | Event date/title/body |
| Finding, risk, or action block | `report-callout` | Body text or `text`; optional `variant`, `title` |
| Highlighted recommendation card | `report-accent-card` | Body text or `body`; optional `accent`, `title` |
| Captioned embedded image | `report-figure` | `src`, `alt`; optional `caption`, `source`, `size` |
| Inline status label | `report-badge` | Body text or `label`; optional `status`, `variant` |
| Chart.js bar chart | `report-chart type="bar"` | `labels`, `values` |
| Chart.js line chart | `report-chart type="line"` | `labels`, `values` |
| Chart.js doughnut chart | `report-chart type="doughnut"` | `labels`, `values` |
| Chart.js grouped bar chart | `report-chart type="grouped-bar"` | `labels`, `series`, matrix `values` |
| Chart.js stacked bar chart | `report-chart type="stacked-bar"` | `labels`, `series`, matrix `values` |
| Chart.js waterfall chart | `report-chart type="waterfall"` | `labels`, `values` as sequential deltas |
| Chart.js bullet chart | `report-chart type="bullet"` | `labels`, `values`, `targets` |
| Chart.js scatter chart | `report-chart type="scatter"` | numeric `points` as `x:y` pairs |
| Chart.js bubble chart | `report-chart type="bubble"` | numeric `points` as `x:y:r` triples |
| Observable Plot area chart | `report-chart type="area"` | `points` as `x:y` pairs, or `labels`, `values` |
| D3 treemap | `report-chart type="treemap"` | `labels`, `values` |
| D3 funnel | `report-chart type="funnel"` | `labels`, `values` |
| D3 heatmap | `report-chart type="heatmap"` | `x-labels`, `y-labels`, matrix `values` |

## Generating Report Markdown

Use this sequence when creating `report.md`:

1. Add frontmatter for `title`, optional `subtitle`, optional `reportTheme: dark`, optional `reportNav: true`, and optional report metadata fields.
2. Add Markdown headings for sections.
3. Add narrative content with plain Markdown paragraphs, lists, and tables.
4. Add visuals only through the available `report-*` component tags below.
5. Build with `node scripts/build-report.mjs report.md --out-dir output`.

If the needed visual is not listed, do not create raw HTML or JavaScript in the Markdown. Tell the user to ask the skill maker to add a renderer-backed component.

## Report Metadata And Page Breaks

Use renderer-owned frontmatter for cover metadata:

```yaml
reportDate: 2026-06-11
preparedFor: Customer Operations
preparedBy: Analytics
classification: Internal
version: v1.0
```

Use `report-page-break` for deliberate print/PDF boundaries. Do not paste page-break CSS into Markdown.

```md
<report-page-break label="Appendix"></report-page-break>
```

Supported `report-page-break` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `label` | no | Optional screen-visible separator label. Alias: `title`. |

### Report Chart: Chart.js, Observable Plot, And D3

Use `report-chart` for standard Chart.js bar, line, doughnut, grouped bar, stacked bar, waterfall, bullet, scatter, and bubble charts, Observable Plot area charts, D3 treemaps, D3 funnels, and D3 heatmaps. Do not write the `<canvas>`, chart container, SVG, or JavaScript initializer yourself. The renderer generates hover tooltips that show the represented value.

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
  type="grouped-bar"
  title="Weekly journey outcomes"
  series="Opened|Completed|Exceptions"
  value-suffix=" cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="17240|15020|640;18990|16880|720;20530|18030|760;21191|19050|810"
></report-chart>
```

```md
<report-chart
  type="stacked-bar"
  title="Weekly case composition"
  series="J0107|J0106|J0101|J0116"
  value-suffix=" cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="11420|2450|2020|620;12680|2680|2240|720;13750|2940|2330|760;14358|3049|2058|810"
></report-chart>
```

```md
<report-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  value-suffix=" cases"
  labels="Opening,New cases,Exceptions,Recoveries"
  values="52000,6400,-1200,3750"
></report-chart>
```

```md
<report-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  value-suffix="%"
  labels="Digital,Assisted,Exceptions"
  values="92,84,63"
  targets="95,90,75"
></report-chart>
```

```md
<report-chart
  type="scatter"
  title="Effort vs completion"
  series="Journeys"
  x-label="Touches"
  y-label="Completion"
  value-suffix="%"
  points="2:93,4:88,7:72,9:61"
></report-chart>
```

```md
<report-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-label="Touches"
  y-label="Completion"
  value-suffix="%"
  points="2:93:10,4:88:14,7:72:18,9:61:9"
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

```md
<report-chart
  type="funnel"
  title="Journey completion funnel"
  series="Cases"
  value-suffix=" cases"
  labels="Opened,Started,Completed,Exception"
  values="52208,44120,37980,3751"
></report-chart>
```

```md
<report-chart
  type="heatmap"
  title="Journey weekday intensity"
  value-suffix=" cases"
  x-labels="Mon|Tue|Wed|Thu|Fri"
  y-labels="J0107|J0106|J0101|J0116"
  values="11920|12380|11650|12710|13120;2480|2640|2710|2820|2469;2020|2140|1980|2230|2278;620|720|760|810|841"
></report-chart>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `type` | no | Supports `bar`, `line`, `doughnut`, `grouped-bar`, `stacked-bar`, `waterfall`, `bullet`, `scatter`, `bubble`, `area`, `treemap`, `funnel`, and `heatmap`. Defaults to `bar`. Aliases: `donut`, `tree-map`, `grouped`, `clustered-bar`, `stacked`. |
| `title` | no | Rendered above the chart and used as the accessible label. |
| `series` | no | Dataset label for single-series charts. For `grouped-bar` and `stacked-bar`, use pipe-separated series names such as `Opened|Completed`. Aliases: `datasets`, `series-labels`. |
| `labels` | yes for Chart.js, `treemap`, and `funnel` types | Comma-separated labels. For `area`, this can be used with `values` as an alternative to `points`. |
| `values` | yes for Chart.js, `treemap`, and `funnel` types | Comma-separated numeric values. Must match label count. For `area`, this can be used with `labels` as an alternative to `points`. |
| `values` for `waterfall` | yes | Comma-separated sequential deltas. Positive values move the running total up; negative values move it down. |
| `targets` for `bullet` | yes | Comma-separated numeric target markers. Must match label count. Aliases: `target`, `target-values`. |
| `points` for `scatter` | yes | Comma-separated numeric `x:y` or `x=y` pairs such as `2:93,4:88`. Numeric `labels` with `values` are also accepted. |
| `points` for `bubble` | yes | Comma-separated numeric `x:y:r` or `x=y=r` triples such as `2:93:10,4:88:14`; `r` is the rendered bubble radius. |
| `values` for `grouped-bar` and `stacked-bar` | yes | Semicolon-separated label rows with pipe-separated series values, such as `10|20;12|24`. Aliases: `matrix`, `series-values`. |
| `x-labels` | yes for `heatmap` | Pipe-separated column labels. Aliases: `columns`, `x`. |
| `y-labels` | yes for `heatmap` | Pipe-separated row labels. Aliases: `rows`, `y`. |
| `values` for `heatmap` | yes | Semicolon-separated rows with pipe-separated numeric cells. Row count must match `y-labels`; cell count must match `x-labels`. Aliases: `matrix`, `series-values`. |
| `points` | yes for `area` | Comma-separated `x:y` or `x=y` points such as `2026-04-01:2200,2026-04-02:2600`. Alias: `data`. |
| `colors` | no | Comma-separated hex colors. Defaults to brand chart colors. |
| `height` | no | Pixel height, clamped by the renderer. Defaults to `320`. |
| `x-label`, `y-label` | no | Axis titles for `scatter`. Aliases: `x-axis-label`, `x-title`, `y-axis-label`, `y-title`. |
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

### Report Key Values

Use `report-key-values` for report context, parameters, ownership, and other compact label/value summaries. Do not hand-author definition-list HTML or card grids for this standard display.

```md
<report-key-values
  title="Report context"
  columns="3"
  items="Period: April 2026; Source: Journey export; Owner: Operations"
></report-key-values>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Rendered above the key/value grid. |
| `items` | yes | Semicolon-separated `Label: Value` or `Label=Value` pairs. Alias: `data`. |
| `columns` | no | Number of columns from `1` to `4`. Alias: `cols`. Defaults to `2`. |

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

### Report Data Table

Use `report-data-table` for compact formatted tables with renderer-owned number, percent, and status styling. Do not hand-author table HTML or inline status badges when this component covers the need.

```md
<report-data-table
  title="Journey breakdown"
  compact="true"
  columns="Journey|Cases|Share|Status"
  types="text|number|percent|status"
  align="left|right|right|center"
  rows="J0107|52208|67.1|Active;J0116|3751|4.8|Review"
  totals="Total|55959|71.9|"
  highlights="2:orange;1.3:green"
  caption="Registered and unregistered journey volume."
  source="Source: April journey export"
></report-data-table>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Rendered above the table. |
| `columns` | yes | Pipe-separated column labels. Alias: `headers`. |
| `types` | no | Pipe-separated cell types. Supports `text`, `number`, `percent`, `status`. Defaults to `text` for every column. Alias: `formats`. |
| `rows` | yes | Semicolon-separated rows with pipe-separated cells. Alias: `data`. |
| `compact` | no | Use `true` for denser report tables. Alias: `dense`. |
| `align` | no | Pipe-separated column alignment. Supports `left`, `center`, `right`. Defaults numeric and percent columns to right alignment. Alias: `alignment`. |
| `totals` | no | Pipe-separated footer row with the same number of cells as `columns`. Aliases: `total`, `footer`. |
| `highlights` | no | Semicolon-separated row or cell highlights. Use `2:orange` for row 2 or `1.3:green` for row 1, column 3. Supports `blue`, `green`, `orange`, `red`, `muted`. Alias: `highlight`. |
| `caption` | no | Visible caption below the table. |
| `source` | no | Source note under the caption. |

For a cell type that is not supported, do not write raw HTML. Ask the skill maker to add the missing table cell type.

### Report Insight

Use `report-insight` for finding, evidence, impact, and action narrative. Do not hand-author insight card HTML.

```md
<report-insight
  variant="warning"
  title="Journey concentration"
  finding="One journey dominates April activity."
  evidence="J0107 accounts for 67.1% of observed volume."
  impact="Monitoring should be tuned around this journey."
  action="Validate J0116 while calibrating J0107 thresholds."
></report-insight>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Short insight title. |
| `finding` | no | Primary finding. Aliases: `text`, `body`; otherwise use the tag body. |
| `evidence` | no | Data or observation supporting the finding. |
| `impact` | no | Why the finding matters. |
| `action` | no | Recommended next action. Alias: `next`. |
| `variant` | no | Supports `info`, `warning`, `success`, `danger`. Aliases: `type`, `tone`. Defaults to `info`. |

The component must include at least one of title, finding/body text, evidence, impact, or action.

### Report Recommendation

Use `report-recommendation` for owned actions, decisions, and next steps. Do not hand-author recommendation card HTML.

```md
<report-recommendation
  title="Validate the unregistered journey"
  owner="Operations"
  priority="High"
  due="Week 1"
  status="Watch"
>Confirm whether J0116 is a new journey or a data quality issue.</report-recommendation>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Short recommendation title. |
| `body` | no | Action detail when you prefer attribute-only authoring. Alias: `text`; otherwise use the tag body. |
| `owner` | no | Responsible person, team, or function. |
| `priority` | no | Supports `critical`, `high`, `medium`, `low`. |
| `due` | no | Due date, period, or sequence label. Alias: `date`. |
| `status` | no | Status badge value. Alias: `state`. |

The component must include title or body text.

### Report Source Note

Use `report-source-note` for citations, methodology, assumptions, and data freshness notes. Do not hand-author aside blocks for standard source notes.

```md
<report-source-note title="Methodology" source="Journey export" date="April 2026">
Cases are counted from completed journey records and exclude test journeys.
</report-source-note>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Short note label. Alias: `label`. |
| `text` | no | Body text when you prefer attribute-only authoring. Alias: `body`. Otherwise use the tag body. |
| `source` | no | Data source, citation, or owner. |
| `date` | no | Date, period, or freshness indicator. Alias: `period`. |

The note must include at least one of title, body text, source, or date.

### Report Source List And Cite

Use `report-source-list` for reusable numbered sources and `report-cite` for inline references. Do not hand-author citation links, numbered source lists, or footnote HTML.

```md
Completion rates use the April extract <report-cite source="journey-export"></report-cite>.

<report-source-list title="Sources">
  <report-source
    id="journey-export"
    title="April journey export"
    publisher="Operations"
    date="April 2026"
  >Completed journey records excluding test journeys.</report-source>
</report-source-list>
```

Supported `report-source-list` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Rendered above the source list. Alias: `label`. Defaults to `Sources`. |

Supported `report-source` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique source id used by `report-cite`. Alias: `source-id`. Use letters, numbers, hyphens, and underscores only. |
| `title` | no | Source title. Alias: `label`. |
| `publisher` | no | Source owner or publisher. Alias: `source`. |
| `date` | no | Date, period, or freshness indicator. Alias: `period`. |
| `url` | no | Source URL. Alias: `href`. |
| `note` | no | Source detail when you prefer attribute-only authoring. Aliases: `text`, `body`. Otherwise use the tag body. |

Each `report-source` must be directly inside `report-source-list`, and ids must be unique.

Supported `report-cite` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `source` | yes | Must match a declared `report-source` id. Aliases: `ref`, `id`. |
| `label` | no | Optional visible citation label. Defaults to the generated source number such as `[1]`. |

If a citation cannot resolve to a declared source, do not create a manual link. Ask the skill maker to add or adjust renderer-backed citation support.

### Report Card Grid

Use `report-card-grid` for grouped insights, action plans, ownership summaries, and mixed card layouts. Do not hand-author grid/card HTML for this standard layout.

```md
<report-card-grid title="Action plan" columns="3">
  <report-card title="Confirm" accent="orange">Determine whether J0116 is a new journey or a data quality issue.</report-card>
  <report-card title="Track" accent="blue">Add month-over-month monitoring for the top three journeys.</report-card>
  <report-card title="Calibrate" accent="green">Tune operational monitoring around the dominant journey.</report-card>
</report-card-grid>
```

Supported `report-card-grid` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Rendered above the grid. |
| `columns` | no | Number of columns from `1` to `4`. Alias: `cols`. Defaults to `3`. |

Supported `report-card` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Short card title. |
| `body` | no | Body text when you prefer attribute-only authoring. Alias: `text`. Otherwise use the tag body. |
| `accent` | no | Supports `blue`, `cyan`, `purple`, `green`, `orange`, `red`. Aliases: `color`, `tone`. Defaults to `blue`. |

Each `report-card` must be directly inside `report-card-grid`.

### Report Timeline

Use `report-timeline` for ordered milestones, delivery paths, decision logs, and event sequences. Do not hand-author timeline connector HTML.

```md
<report-timeline title="Delivery path">
  <report-event date="Week 1" title="Confirm journey mapping" status="watch">Resolve whether J0116 is a new journey or a data quality issue.</report-event>
  <report-event date="Week 2" title="Add monthly tracking" status="active">Add month-over-month monitoring for the top three journeys.</report-event>
  <report-event date="Week 3" title="Tune monitoring" status="pending">Calibrate operational monitoring around the dominant journey.</report-event>
</report-timeline>
```

Supported `report-timeline` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `title` | no | Rendered above the timeline. |

Supported `report-event` attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `date` | no | Date, period, or sequence label. Aliases: `time`, `period`. |
| `title` | no | Event title. |
| `body` | no | Body text when you prefer attribute-only authoring. Alias: `text`. Otherwise use the tag body. |
| `status` | no | Maps common statuses such as `active`, `watch`, `complete`, `blocked`, and `pending` to badge colors. Aliases: `variant`, `tone`. Defaults to `muted`. |

Each `report-event` must be directly inside `report-timeline`.

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

### Report Figure

Use `report-figure` for screenshots, diagrams, and other embedded report images. Store image files under resources and reference them through `src`.

```md
<report-figure
  src="images/journey-volume.svg"
  alt="Sample journey volume snapshot"
  caption="Journey volume is concentrated in J0107."
  source="Source: April journey export"
  size="wide"
></report-figure>
```

Supported attributes:

| Attribute | Required | Notes |
| --- | --- | --- |
| `src` | yes | Resource path to the image. Alias: `image`. |
| `alt` | yes | Accessible image description. |
| `caption` | no | Visible caption under the image. Otherwise the tag body is used. |
| `source` | no | Source note under the caption. |
| `size` | no | Supports `narrow`, `normal`, and `wide`. Defaults to `normal`. |

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
