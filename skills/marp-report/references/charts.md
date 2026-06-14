# Report Chart Help

Use this file when answering detailed questions about `report-chart` types, chart attributes, dataset-backed charts, or chart validation errors. For non-chart report components, use `../REFERENCE.md`.

Report Markdown must still use renderer-owned components only. If the user asks for a chart shape that is not listed here, tell them to ask the skill maker to add it as a renderer-backed component.

## Quick Contract

```md
<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>
```

Common attributes:

| Attribute | Notes |
| --- | --- |
| `type` | Defaults to `bar`. Supported aliases include `donut`, `tree-map`, `grouped`, `clustered-bar`, and `stacked`. |
| `title` | Visible chart heading and accessible label. |
| `series` | Dataset label, or pipe-separated series names for grouped/stacked bars. Aliases: `datasets`, `series-labels`. |
| `labels` | Comma-separated labels for most charts. |
| `values` | Numeric values, matrix values, or raw observations depending on chart type. |
| `points` | Point data for area, scatter, and bubble charts. Alias: `data`. |
| `links` | Flow data for Sankey charts. Aliases: `flows`, `edges`. |
| `colors` | Optional comma-separated hex colors. Defaults to brand chart colors. |
| `height` | Optional pixel height, clamped by the renderer. |
| `value-prefix`, `value-suffix` | Tooltip value decoration. Aliases: `prefix`, `suffix`. |
| `x-label`, `y-label` | Axis titles. Aliases include `x-axis-label`, `x-title`, `y-axis-label`, `y-title`. |

Separator rules:

- Use commas for one-dimensional lists: `labels="A,B"` and `values="10,20"`.
- Use semicolons between matrix rows: `values="10|20;12|24"`.
- Use pipes inside matrix rows: `series="Opened|Completed"` and `values="10|8;12|9"`.
- Use commas between Sankey links: `links="Opened>Started:44120,Started>Completed:37980"`.

## Chart Types

| Type | Engine | Use For | Required Data | Validation Notes |
| --- | --- | --- | --- | --- |
| `bar` | Chart.js | Single-series categorical comparison | `labels`, `values` | Label/value counts must match; values must be numeric. |
| `line` | Chart.js | Ordered trend line | `labels`, `values` | Label/value counts must match; values must be numeric. |
| `doughnut` | Chart.js | Compact composition | `labels`, `values` | Values must be zero or positive and sum above zero. |
| `grouped-bar` | Chart.js | Side-by-side series comparison | `labels`, pipe-separated `series`, matrix `values` | One matrix row per label; each row has one value per series. |
| `stacked-bar` | Chart.js | Part-to-whole series comparison | `labels`, pipe-separated `series`, matrix `values` | Values must be numeric and zero or positive. |
| `waterfall` | Chart.js | Sequential positive/negative movement | `labels`, delta `values` | Values are deltas; renderer computes the running total. |
| `bullet` | Chart.js | Actual versus target | `labels`, `values`, `targets` | Values/targets must be zero or positive and include a value above zero. |
| `scatter` | Chart.js | X/Y relationship | `points` or numeric `labels` plus `values` | Points must be numeric x/y pairs. |
| `bubble` | Chart.js | X/Y relationship plus magnitude | `points="x:y:r,..."` | X, Y, and radius must be numeric; radius must be above zero. |
| `histogram` | Chart.js | Raw numeric distribution | Raw numeric `values`; optional `bins` | Renderer computes bins; `bins` must be 2 to 30. |
| `boxplot` | Chart.js | Spread, median, and outlier context | `labels`, observation rows in `values` | One row per label; each row needs at least five numeric observations. |
| `pareto` | Chart.js | Ranked drivers plus cumulative share | `labels`, `values` | Values must be zero or positive and sum above zero; renderer sorts by value. |
| `area` | Observable Plot | Cumulative or volume trend | `points`, or `labels` plus `values` | Points use `x:y` or `x=y`; y must be numeric. |
| `treemap` | D3 | Portfolio/composition area chart | `labels`, `values` | Values must be zero or positive and sum above zero. |
| `funnel` | D3 | Completion/conversion stages | `labels`, `values` | Values must be zero or positive and sum above zero. |
| `heatmap` | D3 | Matrix intensity | `x-labels`, `y-labels`, matrix `values` | Matrix dimensions must match both axes. |
| `sankey` | D3 | Acyclic flow diagram | `links` | Values must be above zero; self-links and cycles are rejected. |

## Dataset-Backed Charts

`report-dataset` can feed `report-data-table` and these `report-chart` types only:

`bar`, `line`, `doughnut`, `waterfall`, `bullet`, `pareto`, `grouped-bar`, `stacked-bar`.

```md
<report-dataset
  id="journey-volume"
  columns="Journey|Cases|Target|Status"
  rows="J0107|52208|55000|Active;J0106|11119|12000|Active"
></report-dataset>

<report-chart
  type="grouped-bar"
  title="Cases vs target by journey"
  data-ref="journey-volume"
  label-column="Journey"
  series-columns="Cases|Target"
></report-chart>
```

Dataset-specific attributes:

| Attribute | Notes |
| --- | --- |
| `data-ref` | Dataset id. Alias: `dataset`. |
| `label-column` | Dataset column used for chart labels. Aliases: `label-field`, `label`. |
| `value-column` | Dataset column used for single-value charts. Aliases: `value-field`, `value`. |
| `series-columns` | Pipe-separated dataset columns for grouped/stacked bars. Aliases: `value-columns`, `series-fields`, `value-fields`. |
| `target-column` | Dataset column used for bullet targets. Alias: `target-field`. |

## Examples

### Grouped Bar

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

### Scatter

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

### Bubble

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

### Histogram

```md
<report-chart
  type="histogram"
  title="Cycle time distribution"
  series="Journeys"
  x-label="Days"
  y-label="Journeys"
  bins="6"
  values="5,6,7,7,8,10,11,12,12,13,15,17,18,21,23,24,26,28"
></report-chart>
```

### Boxplot

```md
<report-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-label="Days"
  labels="Digital,Assisted,Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></report-chart>
```

### Pareto

```md
<report-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  value-suffix=" cases"
  labels="Identity,Address,Income,Consent"
  values="42,18,27,13"
></report-chart>
```

### Heatmap

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

### Sankey

```md
<report-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  value-suffix=" cases"
  links="Opened>Started:44120,Started>Completed:37980,Started>Exception:3751,Exception>Recovered:2160"
></report-chart>
```
