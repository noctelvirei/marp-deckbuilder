---
title: Sample Usage Report
subtitle: Synthetic journey volume
reportDate: 2026-06-11
preparedFor: Customer Operations
preparedBy: Analytics
classification: Internal
version: v1.0
reportTheme: dark
reportNav: true
---

## Executive Summary

synthetic sample volume is concentrated in one dominant journey. The top three journeys account for 92% of activity, while one unmapped journey requires follow-up <report-cite source="journey-export"></report-cite>.

<report-key-values
  title="Report context"
  columns="3"
  items="Period: synthetic sample; Source: Synthetic sample export; Owner: Operations"
></report-key-values>

<report-metric-grid>
  <report-metric value="7,800" label="Total cases" />
  <report-metric value="67%" label="Journey A share" accent="blue" />
  <report-metric value="92%" label="Top 3 journeys" accent="cyan" />
</report-metric-grid>

<report-insight
  variant="warning"
  title="Journey concentration"
  finding="One journey dominates synthetic sample activity."
  evidence="Journey A accounts for 67% of observed volume."
  impact="Operational monitoring should be tuned around the dominant journey before month-end review."
  action="Validate whether Journey D is a synthetic flow while calibrating Journey A thresholds."
></report-insight>

<report-figure
  src="images/journey-volume.svg"
  alt="Sample journey volume snapshot"
  caption="Volume distribution snapshot for the top journeys."
  source="Source: synthetic sample export"
  size="wide"
></report-figure>

<report-dataset
  id="journey-volume"
  columns="Journey|Cases|Share|Status"
  rows="Journey A|5200|67|Active;Journey B|1100|14|Active;Journey C|860|11|Active;Journey D|380|5|Review"
></report-dataset>

<report-dataset
  id="weekly-outcomes"
  columns="Week|Opened|Completed|Exceptions"
  rows="Week 1|17240|15020|640;Week 2|18990|16880|720;Week 3|20530|18030|760;Week 4|21191|19050|810"
></report-dataset>

<report-dataset
  id="weekly-composition"
  columns="Week|Journey A|Journey B|Journey C|Journey D"
  rows="Week 1|11420|2450|2020|620;Week 2|12680|2680|2240|720;Week 3|13750|2940|2330|760;Week 4|14358|3049|2058|810"
></report-dataset>

## Volume Chart

<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  data-ref="journey-volume"
  label-column="Journey"
  value-column="Cases"
></report-chart>

## Weekly Trend

<report-chart
  type="line"
  title="Weekly case volume"
  series="Cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="17240,18990,20530,21191"
></report-chart>

## Outcome Comparison

<report-chart
  type="grouped-bar"
  title="Weekly journey outcomes"
  data-ref="weekly-outcomes"
  label-column="Week"
  series-columns="Opened|Completed|Exceptions"
  value-suffix=" cases"
></report-chart>

## Case Composition

<report-chart
  type="stacked-bar"
  title="Weekly case composition"
  data-ref="weekly-composition"
  label-column="Week"
  value-suffix=" cases"
></report-chart>

## Monthly Movement

<report-chart
  type="waterfall"
  title="Monthly volume movement"
  series="Cases"
  value-suffix=" cases"
  labels="Opening,New cases,Exceptions,Recoveries"
  values="52000,6400,-1200,3750"
></report-chart>

## SLA Against Target

<report-chart
  type="bullet"
  title="SLA attainment against target"
  series="Actual"
  value-suffix="%"
  labels="Digital,Assisted,Exceptions"
  values="92,84,63"
  targets="95,90,75"
></report-chart>

## Effort And Completion

<report-chart
  type="scatter"
  title="Journey effort vs completion"
  series="Journeys"
  x-label="Touches"
  y-label="Completion"
  value-suffix="%"
  points="2:93,4:88,7:72,9:61"
></report-chart>

## Impact Concentration

<report-chart
  type="bubble"
  title="Journey effort, completion, and impact"
  series="Journeys"
  x-label="Touches"
  y-label="Completion"
  value-suffix="%"
  points="2:93:10,4:88:14,7:72:18,9:61:9"
></report-chart>

## Cycle Time Distribution

<report-chart
  type="histogram"
  title="Cycle time distribution"
  series="Journeys"
  x-label="Days"
  y-label="Journeys"
  bins="6"
  values="5,6,7,7,8,10,11,12,12,13,15,17,18,21,23,24,26,28"
></report-chart>

## Cycle Time Spread

<report-chart
  type="boxplot"
  title="Cycle time spread by journey type"
  series="Days"
  y-label="Days"
  labels="Digital,Assisted,Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></report-chart>

## Exception Drivers

<report-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  value-suffix=" cases"
  labels="Identity,Address,Income,Consent"
  values="42,18,27,13"
></report-chart>

## Completion Funnel

<report-chart
  type="funnel"
  title="Journey completion funnel"
  series="Cases"
  value-suffix=" cases"
  labels="Opened,Started,Completed,Exception"
  values="5200,4400,3800,380"
></report-chart>

## Journey Flow

<report-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  value-suffix=" cases"
  links="Opened>Started:4400,Started>Completed:3800,Started>Exception:380,Exception>Recovered:220"
></report-chart>

## Journey Mix

<report-chart
  type="doughnut"
  title="Journey mix"
  series="Cases"
  labels="Journey A,Journey B,Journey C,Journey D"
  values="5200,1100,860,380"
></report-chart>

## Daily Volume

<report-chart
  type="area"
  title="Daily volume"
  series="Cases"
  points="2026-04-01:2200,2026-04-02:2600,2026-04-03:2450,2026-04-04:3100,2026-04-05:3380,2026-04-06:3520"
></report-chart>

## Weekday Intensity

<report-chart
  type="heatmap"
  title="Journey weekday intensity"
  value-suffix=" cases"
  x-labels="Mon|Tue|Wed|Thu|Fri"
  y-labels="Journey A|Journey B|Journey C|Journey D"
  values="11920|12380|11650|12710|13120;2480|2640|2710|2820|2469;2020|2140|1980|2230|2278;620|720|760|810|841"
></report-chart>

## Distribution

<report-rate-bars
  title="Share by journey"
  labels="Journey A,Journey B,Journey C,Journey D"
  values="5200,1100,860,380"
  shares="67,14,11,5"
></report-rate-bars>

## Journey Treemap

<report-chart
  type="treemap"
  title="Volume by journey"
  series="Cases"
  labels="Journey A,Journey B,Journey C,Journey D"
  values="5200,1100,860,380"
></report-chart>

## Breakdown

<report-data-table
  title="Journey breakdown"
  compact="true"
  data-ref="journey-volume"
  types="text|number|percent|status"
  align="left|right|right|center"
  totals="Total|75726|97.3|"
  highlights="4:orange;1.3:green"
  caption="Registered and unmapped journey volume."
  source="Source: synthetic sample export"
></report-data-table>

<report-source-note title="Methodology" source="Synthetic sample export" date="Synthetic sample">
Cases are counted from completed journey records and exclude test journeys and duplicate retries.
</report-source-note>

<report-source-list title="Sources">
  <report-source id="journey-export" title="synthetic sample export" publisher="Operations" date="Synthetic sample">Completed journey records excluding test journeys and duplicate retries.</report-source>
  <report-source id="profile-register" title="Synthetic journey profile" publisher="Journey governance" date="Synthetic sample">Reference list used to identify unmapped journeys.</report-source>
</report-source-list>

<report-callout variant="warning" title="Action">
Journey D generated meaningful volume but is not in the synthetic journey profile.
</report-callout>

## Next Steps

<report-card-grid title="Action plan" columns="3">
  <report-card title="Confirm" accent="orange">Determine whether Journey D is a new synthetic flow or a data quality issue.</report-card>
  <report-card title="Track" accent="blue">Add month-over-month monitoring for the top three journeys.</report-card>
  <report-card title="Calibrate" accent="green">Tune operational monitoring around the dominant journey.</report-card>
</report-card-grid>

<report-timeline title="Delivery path">
  <report-event date="Week 1" title="Confirm journey mapping" status="watch">Resolve whether Journey D is a new synthetic flow or a data quality issue.</report-event>
  <report-event date="Week 2" title="Add monthly tracking" status="active">Add month-over-month monitoring for the top three journeys.</report-event>
  <report-event date="Week 3" title="Tune monitoring" status="pending">Calibrate operational monitoring around the dominant journey.</report-event>
</report-timeline>

<report-accent-card accent="green" title="Recommended focus">
Prioritise monitoring for Journey A while validating whether Journey D is a synthetic flow or a data quality issue.
</report-accent-card>

<report-recommendation
  title="Validate the unmapped journey"
  owner="Operations"
  priority="High"
  due="Week 1"
  status="Watch"
>Confirm whether Journey D is a new synthetic journey or a data quality issue before the next monitoring cycle.</report-recommendation>
