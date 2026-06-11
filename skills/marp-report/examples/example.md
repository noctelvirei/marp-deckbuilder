---
title: Sample Usage Report
subtitle: April 2026 journey volume
reportTheme: dark
reportNav: true
---

## Executive Summary

April volume is concentrated in one dominant journey. The top three journeys account for 92.4% of activity, while one unregistered journey requires follow-up.

<report-key-values
  title="Report context"
  columns="3"
  items="Period: April 2026; Source: Journey export; Owner: Operations"
></report-key-values>

<report-metric-grid>
  <report-metric value="77,951" label="Total cases"></report-metric>
  <report-metric value="67.1%" label="J0107 share" accent="blue"></report-metric>
  <report-metric value="92.4%" label="Top 3 journeys" accent="cyan"></report-metric>
</report-metric-grid>

<report-insight
  variant="warning"
  title="Journey concentration"
  finding="One journey dominates April activity."
  evidence="J0107 accounts for 67.1% of observed volume."
  impact="Operational monitoring should be tuned around the dominant journey before month-end review."
  action="Validate whether J0116 is a real journey while calibrating J0107 thresholds."
></report-insight>

<report-figure
  src="images/journey-volume.svg"
  alt="Sample journey volume snapshot"
  caption="Volume distribution snapshot for the top journeys."
  source="Source: April journey export"
  size="wide"
></report-figure>

## Volume Chart

<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
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
  series="Opened|Completed|Exceptions"
  value-suffix=" cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="17240|15020|640;18990|16880|720;20530|18030|760;21191|19050|810"
></report-chart>

## Case Composition

<report-chart
  type="stacked-bar"
  title="Weekly case composition"
  series="J0107|J0106|J0101|J0116"
  value-suffix=" cases"
  labels="Week 1,Week 2,Week 3,Week 4"
  values="11420|2450|2020|620;12680|2680|2240|720;13750|2940|2330|760;14358|3049|2058|810"
></report-chart>

## Completion Funnel

<report-chart
  type="funnel"
  title="Journey completion funnel"
  series="Cases"
  value-suffix=" cases"
  labels="Opened,Started,Completed,Exception"
  values="52208,44120,37980,3751"
></report-chart>

## Journey Mix

<report-chart
  type="doughnut"
  title="Journey mix"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
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
  y-labels="J0107|J0106|J0101|J0116"
  values="11920|12380|11650|12710|13120;2480|2640|2710|2820|2469;2020|2140|1980|2230|2278;620|720|760|810|841"
></report-chart>

## Distribution

<report-rate-bars
  title="Share by journey"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
  shares="67.1,14.3,11.1,4.8"
></report-rate-bars>

## Journey Treemap

<report-chart
  type="treemap"
  title="Volume by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>

## Breakdown

<report-data-table
  title="Journey breakdown"
  compact="true"
  columns="Journey|Cases|Share|Status"
  types="text|number|percent|status"
  align="left|right|right|center"
  rows="J0107|52208|67.1|Active;J0106|11119|14.3|Active;J0101|8648|11.1|Active;J0116|3751|4.8|Review"
  totals="Total|75726|97.3|"
  highlights="4:orange;1.3:green"
  caption="Registered and unregistered journey volume."
  source="Source: April journey export"
></report-data-table>

<report-source-note title="Methodology" source="Journey export" date="April 2026">
Cases are counted from completed journey records and exclude test journeys and duplicate retries.
</report-source-note>

<report-callout variant="warning" title="Action">
J0116 generated meaningful volume but is not in the registered journey profile.
</report-callout>

## Next Steps

<report-card-grid title="Action plan" columns="3">
  <report-card title="Confirm" accent="orange">Determine whether J0116 is a new journey or a data quality issue.</report-card>
  <report-card title="Track" accent="blue">Add month-over-month monitoring for the top three journeys.</report-card>
  <report-card title="Calibrate" accent="green">Tune operational monitoring around the dominant journey.</report-card>
</report-card-grid>

<report-timeline title="Delivery path">
  <report-event date="Week 1" title="Confirm journey mapping" status="watch">Resolve whether J0116 is a new journey or a data quality issue.</report-event>
  <report-event date="Week 2" title="Add monthly tracking" status="active">Add month-over-month monitoring for the top three journeys.</report-event>
  <report-event date="Week 3" title="Tune monitoring" status="pending">Calibrate operational monitoring around the dominant journey.</report-event>
</report-timeline>

<report-accent-card accent="green" title="Recommended focus">
Prioritise monitoring for J0107 while validating whether J0116 is a real journey or a data quality issue.
</report-accent-card>

<report-recommendation
  title="Validate the unregistered journey"
  owner="Operations"
  priority="High"
  due="Week 1"
  status="Watch"
>Confirm whether J0116 is a new production journey or a data quality issue before the next monitoring cycle.</report-recommendation>

1. Confirm whether J0116 is a new journey or a data quality issue.
2. Add month-over-month tracking for the top three journeys.
3. Calibrate operational monitoring to the dominant journey.
