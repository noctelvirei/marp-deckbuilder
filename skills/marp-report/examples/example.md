---
title: Sample Usage Report
subtitle: April 2026 journey volume
reportTheme: dark
reportNav: true
---

## Executive Summary

April volume is concentrated in one dominant journey. The top three journeys account for 92.4% of activity, while one unregistered journey requires follow-up.

<report-metric-grid>
  <report-metric value="77,951" label="Total cases"></report-metric>
  <report-metric value="67.1%" label="J0107 share" accent="blue"></report-metric>
  <report-metric value="92.4%" label="Top 3 journeys" accent="cyan"></report-metric>
</report-metric-grid>

## Volume Chart

<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
></report-chart>

## Distribution

<report-rate-bars
  title="Share by journey"
  labels="J0107,J0106,J0101,J0116"
  values="52208,11119,8648,3751"
  shares="67.1,14.3,11.1,4.8"
></report-rate-bars>

## Breakdown

| Journey | Cases | Share | Status |
| --- | ---: | ---: | --- |
| J0107 | 52,208 | 67.1% | Active |
| J0106 | 11,119 | 14.3% | Active |
| J0101 | 8,648 | 11.1% | Active |
| J0116 | 3,751 | 4.8% | Review |

<report-callout variant="warning" title="Action">
J0116 generated meaningful volume but is not in the registered journey profile.
</report-callout>

## Next Steps

1. Confirm whether J0116 is a new journey or a data quality issue.
2. Add month-over-month tracking for the top three journeys.
3. Calibrate operational monitoring to the dominant journey.
