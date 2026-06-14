# Deck Chart Help

Use this file when answering detailed questions about `deck-chart` types, chart attributes, or chart validation errors. For non-chart components, use `../REFERENCE.md`.

Deck Markdown must still use renderer-owned components only. If the user asks for a chart shape that is not listed here, tell them to ask the skill maker to add it as a renderer-backed capability.

## Quick Contract

```md
<deck-chart
  type="bar"
  title="Average completion time"
  series="Days"
  labels="Digital, Branch, Contact centre"
  values="2.1, 3.8, 4.6"
></deck-chart>
```

Common attributes:

| Attribute | Notes |
| --- | --- |
| `type` | Required when not using the default `bar`. |
| `title` | Optional visible chart heading. |
| `series` | Single series label, or multiple series names for grouped/stacked bars. |
| `labels` | Comma-separated category labels for most charts. |
| `values` | Numeric values, or matrix rows for grouped/stacked bars and boxplots. |
| `points` | Point data for area, scatter, and bubble charts. Alias: `data`. |
| `targets` | Target markers for bullet charts. Aliases: `target`, `target-values`. |
| `links` | Flow data for Sankey charts. Aliases: `flows`, `edges`. |
| `x-axis`, `y-axis` | Axis labels for point charts. Aliases: `x-label`, `y-label`. |
| `bins` | Histogram bucket count, 2 to 30. Aliases: `buckets`, `bucket-count`. |

Separator rules:

- Use commas for one-dimensional lists: `labels="A, B"` and `values="10, 20"`.
- Use semicolons between matrix rows: `values="10,20; 12,24"`.
- Use pipes inside observation rows or scatter rows: `points="2|8|Automate; 5|6|Consolidate"`.
- Use commas between Sankey links: `links="Opened>Started:4400, Started>Completed:3800"`.

## Chart Types

| Type | Use For | Required Data | Validation Notes |
| --- | --- | --- | --- |
| `bar` | Single-series categorical comparison | `labels`, `values` | Label/value counts must match; values must be numeric. |
| `line` | Ordered trend line | `labels`, `values` | Needs at least two points; values must be numeric. |
| `area` | Cumulative or volume trend | `labels` and `values`, or `points` | Needs at least two points. `points` accepts `Label:Value` rows. |
| `waterfall` | Sequential positive/negative movement | `labels`, delta `values` | Values are deltas; renderer computes the running total. |
| `bullet` | Actual versus target | `labels`, `values`, `targets` | Values/targets must be zero or positive and include a value above zero. |
| `grouped-bar` | Side-by-side series comparison | `labels`, multi-name `series`, matrix `values` | One semicolon-separated values row per series; each row matches label count. |
| `stacked-bar` | Part-to-whole series comparison | `labels`, multi-name `series`, matrix `values` | Values must be zero or positive; each stacked category must sum above zero. |
| `doughnut` | Compact composition | `labels`, `values` | Values must be zero or positive and sum above zero. |
| `scatter` | X/Y relationship | `points="x|y|Label; ..."` | X and Y must be numeric; supports up to 12 points. |
| `bubble` | X/Y relationship plus magnitude | `points="x:y:r, ..."` | X, Y, and radius must be numeric; radius must be above zero; supports up to 16 points. |
| `histogram` | Raw numeric distribution | Raw numeric `values` | Renderer computes bins; do not pre-bin with labels. |
| `boxplot` | Spread, median, and outlier context | `labels`, observation rows in `values` | One row per label; each row needs at least five numeric observations. |
| `pareto` | Ranked drivers plus cumulative share | `labels`, `values` | Values must be zero or positive and sum above zero; renderer sorts by value. |
| `sankey` | Acyclic flow diagram | `links` | Values must be above zero; self-links and cycles are rejected. |

## Examples

### Area

```md
<deck-chart
  type="area"
  title="Monthly adoption"
  series="Users"
  points="Jan:18, Feb:24, Mar:31, Apr:44"
></deck-chart>
```

### Grouped Bar

```md
<deck-chart
  type="grouped-bar"
  title="Quarterly conversion"
  series="Current, Target"
  labels="Q1, Q2, Q3, Q4"
  values="42, 58, 63, 71; 50, 60, 70, 78"
></deck-chart>
```

### Stacked Bar

```md
<deck-chart
  type="stacked-bar"
  title="Quarterly volume mix"
  series="New, Returning, Expansion"
  labels="Q1, Q2, Q3, Q4"
  values="20, 24, 30, 34; 12, 15, 18, 22; 4, 6, 9, 11"
></deck-chart>
```

### Scatter

```md
<deck-chart
  type="scatter"
  title="Impact versus effort"
  series="Initiatives"
  x-axis="Effort"
  y-axis="Impact"
  points="2|8|Automate; 5|6|Consolidate; 8|3|Defer"
></deck-chart>
```

### Bubble

```md
<deck-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-axis="Touches"
  y-axis="Completion"
  points="2:93:10, 4:88:14, 7:72:18, 9:61:9"
></deck-chart>
```

### Histogram

```md
<deck-chart
  type="histogram"
  title="Response time distribution"
  series="Cases"
  values="1.2, 1.8, 2.1, 2.4, 2.8, 3.3, 3.7, 4.1"
  bins="6"
></deck-chart>
```

### Boxplot

```md
<deck-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-axis="Days"
  labels="Digital, Assisted, Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></deck-chart>
```

### Pareto

```md
<deck-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  labels="Identity, Address, Income, Consent"
  values="42, 18, 27, 13"
></deck-chart>
```

### Sankey

```md
<deck-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  links="Opened>Started:4400, Started>Completed:3800, Started>Exception:380, Exception>Recovered:220"
></deck-chart>
```
