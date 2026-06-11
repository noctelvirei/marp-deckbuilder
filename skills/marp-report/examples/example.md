---
title: Sample Usage Report
subtitle: April 2026 journey volume
surface: dark
---

# Executive Summary

April volume is concentrated in one dominant journey. The top three journeys
account for 92.4% of activity, while one unregistered journey requires follow-up.

## Highlights

<deck-rich-stats eyebrow="Renderer-owned report metrics" title="Operational|Highlights">
  <deck-rich-metric value="77.9" unit="k" label="Total Cases" sub="April volume" progress="78" color="blue"></deck-rich-metric>
  <deck-rich-metric value="67.1" unit="%" label="J0107 Share" sub="Dominant journey" progress="67" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="92.4" unit="%" label="Top 3 Journeys" sub="Concentration" progress="92" color="green"></deck-rich-metric>
</deck-rich-stats>

## Volume

<deck-rich-bars eyebrow="Renderer-owned SVG/CSS chart" title="Cases by|Journey" labels="J0107,J0106,J0101,J0116">
  <deck-rich-series name="Cases" values="67,14,11,5" color="blue"></deck-rich-series>
  <deck-rich-series name="Prior Month" values="61,18,10,4" color="cyan"></deck-rich-series>
</deck-rich-bars>

## Channel Mix

<deck-rich-donut title="Journey|Mix" total="77,951" total-label="Total Cases">
  <deck-rich-segment label="J0107" value="67" color="blue"></deck-rich-segment>
  <deck-rich-segment label="J0106" value="14" color="cyan"></deck-rich-segment>
  <deck-rich-segment label="J0101" value="11" color="purple"></deck-rich-segment>
  <deck-rich-segment label="J0116" value="5" color="orange"></deck-rich-segment>
</deck-rich-donut>

## Breakdown

| Journey | Cases | Share | Status |
| --- | ---: | ---: | --- |
| J0107 | 52,208 | 67.1% | <span class="r-badge green">Active</span> |
| J0106 | 11,119 | 14.3% | <span class="r-badge green">Active</span> |
| J0101 | 8,648 | 11.1% | <span class="r-badge green">Active</span> |
| J0116 | 3,751 | 4.8% | <span class="r-badge orange">Review</span> |

> Action: J0116 generated meaningful volume but is not in the registered journey profile.

## Performance

<deck-gauge title="Completion|Gauge" value="87" label="Completion Score" sub="April 2026">
  <deck-rich-metric value="94" unit="%" label="Response Rate" progress="94" color="blue"></deck-rich-metric>
  <deck-rich-metric value="87" unit="%" label="First Contact Resolution" progress="87" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="91" unit="%" label="Digital Completion Rate" progress="91" color="green"></deck-rich-metric>
  <deck-rich-metric value="78" unit="%" label="Agent Productivity Gain" progress="78" color="orange"></deck-rich-metric>
</deck-gauge>

## Next Steps

1. Confirm whether J0116 is a new journey or a data quality issue.
2. Add month-over-month tracking for the top three journeys.
3. Calibrate operational monitoring to the dominant journey.
