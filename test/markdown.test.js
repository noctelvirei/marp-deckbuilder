import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { loadDefinitions } from '../src/brand.js'
import { buildMarpMarkdown, parseDeckMarkdown } from '../src/markdown.js'

test('parses frontmatter, directives, and all native components', async () => {
  const source = await readFile(new URL('../samples/demo.md', import.meta.url), 'utf8')
  const deck = parseDeckMarkdown(source)

  assert.equal(deck.frontmatter.title, 'Marp Deckbuilder Demo')
  assert.equal(deck.slides.length, 12)
  assert.equal(deck.slides[0].layout, 'cover')
  assert.deepEqual(deck.slides.map((slide) => slide.layout), [
    'cover',
    'divider',
    'three-stat',
    'cards',
    'chart',
    'comparison',
    'swimlane',
    'proof',
    'logo-wall',
    'next-steps',
    'divider',
    'close',
  ])
  assert.equal(deck.slides[2].stats.length, 3)
  assert.equal(deck.slides[2].takeaway.includes('Marp'), true)
  assert.equal(deck.slides[3].cards.length, 3)
  assert.equal(deck.slides[4].chart.title, 'Average completion time')
  assert.deepEqual(deck.slides[4].chart.values, [2.1, 3.8, 4.6, 6.2])
  assert.equal(deck.slides[5].comparison.rows.length, 4)
  assert.equal(deck.slides[6].swimlane.lanes.length, 2)
  assert.equal(deck.slides[7].proof.stats.length, 3)
  assert.equal(deck.slides[8].logoWall.logos.length, 12)
  assert.equal(deck.slides[9].nextSteps.steps.length, 3)
  assert.equal(deck.slides[11].close.title, 'Thank you')
})

test('parses self-closing deck component tags as siblings', () => {
  const deck = parseDeckMarkdown(`# Metrics

<deck-stat-grid>
  <deck-stat value="1" label="One" />
  <deck-stat value="2" label="Two" />
</deck-stat-grid>

<deck-chart title="Chart" labels="A" values="1" />

<deck-takeaway text="Done" />
`)

  assert.equal(deck.slides[0].stats.length, 2)
  assert.deepEqual(deck.slides[0].stats.map((stat) => stat.value), ['1', '2'])
  assert.equal(deck.slides[0].chart.title, 'Chart')
  assert.equal(deck.slides[0].takeaway, 'Done')
  assert.doesNotMatch(deck.slides[0].source, /<deck-/)
})

test('parses grouped bar deck charts as structured multi-series data', () => {
  const deck = parseDeckMarkdown(`# Segment comparison

<deck-chart
  type="grouped-bar"
  title="Quarterly conversion"
  series="Current, Target"
  labels="Q1, Q2, Q3"
  values="42, 58, 63; 50, 60, 70"
></deck-chart>
`)

  assert.equal(deck.slides[0].chart.chartType, 'grouped-bar')
  assert.deepEqual(deck.slides[0].chart.seriesNames, ['Current', 'Target'])
  assert.deepEqual(deck.slides[0].chart.labels, ['Q1', 'Q2', 'Q3'])
  assert.deepEqual(deck.slides[0].chart.matrix, [
    [42, 58, 63],
    [50, 60, 70],
  ])
  assert.match(deck.slides[0].source, /deck-chart-grouped-bar/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses stacked bar deck charts as structured multi-series data', () => {
  const deck = parseDeckMarkdown(`# Segment composition

<deck-chart
  type="stacked-bar"
  title="Quarterly volume mix"
  series="New, Returning, Expansion"
  labels="Q1, Q2, Q3"
  values="20, 24, 30; 12, 15, 18; 4, 6, 9"
></deck-chart>
`)

  assert.equal(deck.slides[0].chart.chartType, 'stacked-bar')
  assert.deepEqual(deck.slides[0].chart.seriesNames, ['New', 'Returning', 'Expansion'])
  assert.deepEqual(deck.slides[0].chart.labels, ['Q1', 'Q2', 'Q3'])
  assert.deepEqual(deck.slides[0].chart.matrix, [
    [20, 24, 30],
    [12, 15, 18],
    [4, 6, 9],
  ])
  assert.match(deck.slides[0].source, /deck-chart-stacked-bar/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses doughnut deck charts as structured composition data', () => {
  const deck = parseDeckMarkdown(`# Portfolio mix

<deck-chart
  type="doughnut"
  title="Portfolio mix"
  series="Cases"
  labels="Digital, Branch, Contact centre"
  values="52, 31, 17"
></deck-chart>
`)

  assert.equal(deck.slides[0].chart.chartType, 'doughnut')
  assert.equal(deck.slides[0].chart.series, 'Cases')
  assert.deepEqual(deck.slides[0].chart.labels, ['Digital', 'Branch', 'Contact centre'])
  assert.deepEqual(deck.slides[0].chart.values, [52, 31, 17])
  assert.match(deck.slides[0].source, /deck-chart-doughnut/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses scatter deck charts as structured point data', () => {
  const deck = parseDeckMarkdown(`# Impact effort

<deck-chart
  type="scatter"
  title="Impact versus effort"
  series="Initiatives"
  x-axis="Effort"
  y-axis="Impact"
  points="2|8|Automate; 5|6|Consolidate; 8|3|Defer"
></deck-chart>
`)

  assert.equal(deck.slides[0].chart.chartType, 'scatter')
  assert.equal(deck.slides[0].chart.xAxisLabel, 'Effort')
  assert.equal(deck.slides[0].chart.yAxisLabel, 'Impact')
  assert.deepEqual(deck.slides[0].chart.points, [
    { x: 2, y: 8, label: 'Automate' },
    { x: 5, y: 6, label: 'Consolidate' },
    { x: 8, y: 3, label: 'Defer' },
  ])
  assert.match(deck.slides[0].source, /deck-chart-scatter/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses area deck charts from point rows', () => {
  const deck = parseDeckMarkdown(`# Adoption trend

<deck-chart
  type="area"
  title="Monthly adoption"
  series="Users"
  points="Jan:18, Feb:24, Mar:31, Apr:44"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'area')
  assert.deepEqual(deck.slides[0].chart.labels, ['Jan', 'Feb', 'Mar', 'Apr'])
  assert.deepEqual(deck.slides[0].chart.values, [18, 24, 31, 44])
  assert.match(deck.slides[0].source, /deck-chart-area/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses waterfall deck charts as sequential deltas', () => {
  const deck = parseDeckMarkdown(`# Monthly movement

<deck-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  labels="Opening, New cases, Exceptions, Recoveries"
  values="52000, 6400, -1200, 3750"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'waterfall')
  assert.deepEqual(deck.slides[0].chart.labels, ['Opening', 'New cases', 'Exceptions', 'Recoveries'])
  assert.deepEqual(deck.slides[0].chart.values, [52000, 6400, -1200, 3750])
  assert.match(deck.slides[0].source, /deck-chart-waterfall/)
  assert.match(deck.slides[0].source, /deck-chart-waterfall-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses bullet deck charts with target markers', () => {
  const deck = parseDeckMarkdown(`# SLA attainment

<deck-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  labels="Digital, Assisted, Exceptions"
  values="92, 84, 63"
  targets="95, 90, 75"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'bullet')
  assert.deepEqual(deck.slides[0].chart.labels, ['Digital', 'Assisted', 'Exceptions'])
  assert.deepEqual(deck.slides[0].chart.values, [92, 84, 63])
  assert.deepEqual(deck.slides[0].chart.targets, [95, 90, 75])
  assert.match(deck.slides[0].source, /deck-chart-bullet/)
  assert.match(deck.slides[0].source, /deck-chart-bullet-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses bubble deck charts as sized point data', () => {
  const deck = parseDeckMarkdown(`# Impact by effort

<deck-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-axis="Touches"
  y-axis="Completion"
  points="2:93:10,4:88:14,7:72:18,9:61:9"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'bubble')
  assert.deepEqual(deck.slides[0].chart.points, [
    { x: 2, y: 93, r: 10, label: '' },
    { x: 4, y: 88, r: 14, label: '' },
    { x: 7, y: 72, r: 18, label: '' },
    { x: 9, y: 61, r: 9, label: '' },
  ])
  assert.match(deck.slides[0].source, /deck-chart-bubble/)
  assert.match(deck.slides[0].source, /deck-chart-bubble-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses histogram deck charts as computed distribution data', () => {
  const deck = parseDeckMarkdown(`# Response time distribution

<deck-chart
  type="histogram"
  title="Response time distribution"
  series="Cases"
  values="1.2,1.8,2.1,2.4,2.8,3.3,3.7,4.1,4.6,5.2,5.8,6.3"
  bins="6"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'histogram')
  assert.equal(deck.slides[0].chart.binCount, 6)
  assert.deepEqual(deck.slides[0].chart.values, [1.2, 1.8, 2.1, 2.4, 2.8, 3.3, 3.7, 4.1, 4.6, 5.2, 5.8, 6.3])
  assert.match(deck.slides[0].source, /deck-chart-histogram/)
  assert.match(deck.slides[0].source, /deck-chart-histogram-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses boxplot deck charts as observation rows', () => {
  const deck = parseDeckMarkdown(`# Cycle time spread

<deck-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-axis="Days"
  labels="Digital, Assisted, Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'boxplot')
  assert.deepEqual(deck.slides[0].chart.labels, ['Digital', 'Assisted', 'Exceptions'])
  assert.deepEqual(deck.slides[0].chart.matrix, [
    [5, 6, 7, 7, 8, 10, 12],
    [8, 10, 11, 12, 14, 15, 18],
    [14, 16, 18, 21, 23, 24, 28],
  ])
  assert.match(deck.slides[0].source, /deck-chart-boxplot/)
  assert.match(deck.slides[0].source, /deck-chart-boxplot-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses pareto deck charts as ranked drivers', () => {
  const deck = parseDeckMarkdown(`# Exception drivers

<deck-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  labels="Identity, Address, Income, Consent"
  values="42, 18, 27, 13"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'pareto')
  assert.deepEqual(deck.slides[0].chart.labels, ['Identity', 'Address', 'Income', 'Consent'])
  assert.deepEqual(deck.slides[0].chart.values, [42, 18, 27, 13])
  assert.match(deck.slides[0].source, /deck-chart-pareto/)
  assert.match(deck.slides[0].source, /deck-chart-pareto-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses sankey deck charts as flow links', () => {
  const deck = parseDeckMarkdown(`# Journey flow

<deck-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  links="Opened>Started:4400, Started>Completed:3800, Started>Exception:380, Exception>Recovered:220"
></deck-chart>`)

  assert.equal(deck.slides[0].layout, 'chart')
  assert.equal(deck.slides[0].chart.chartType, 'sankey')
  assert.deepEqual(deck.slides[0].chart.links, [
    { source: 'Opened', target: 'Started', value: 4400 },
    { source: 'Started', target: 'Completed', value: 3800 },
    { source: 'Started', target: 'Exception', value: 380 },
    { source: 'Exception', target: 'Recovered', value: 220 },
  ])
  assert.match(deck.slides[0].source, /deck-chart-sankey/)
  assert.match(deck.slides[0].source, /deck-chart-sankey-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-chart/i)
})

test('parses deck-slide metadata as renderer-owned slide directives', () => {
  const deck = parseDeckMarkdown(`<deck-slide
  layout="content"
  surface="dark"
  eyebrow="Decision"
  takeaway="Use a governed pilot."
  html-skip="true"
  customer-logo="resource:logos/customer.svg"
  customer-name="Customer A"
/>

# Target journey

Body copy`)

  assert.equal(deck.slides[0].layout, 'content')
  assert.equal(deck.slides[0].surface, 'dark')
  assert.equal(deck.slides[0].eyebrow, 'Decision')
  assert.equal(deck.slides[0].takeaway, 'Use a governed pilot.')
  assert.equal(deck.slides[0].directives['html-skip'], 'true')
  assert.deepEqual(deck.slides[0].customerLogo, {
    src: 'resource:logos/customer.svg',
    alt: 'Customer A',
  })
  assert.doesNotMatch(deck.slides[0].source, /<deck-slide/)
})

test('parses deck-signal-bars as a structured premium slide component', () => {
  const deck = parseDeckMarkdown(`# Concentration

<deck-signal-bars
  metric="97%"
  metric-label="of volume is concentrated in the two largest segments."
  title="Volume split"
  subtitle="Structured component replaces hand-authored HTML."
  labels="Segment A, Segment B, Long tail"
  values="65, 32, 3"
  unit="%"
></deck-signal-bars>`)

  assert.equal(deck.slides[0].layout, 'signal-bars')
  assert.equal(deck.slides[0].signalBars.metric, '97%')
  assert.deepEqual(deck.slides[0].signalBars.labels, ['Segment A', 'Segment B', 'Long tail'])
  assert.deepEqual(deck.slides[0].signalBars.values, [65, 32, 3])
  assert.match(deck.slides[0].source, /class="deck-signal-bars/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-signal-bars/i)
})

test('parses deck-signal-board as a structured narrative signal component', () => {
  const deck = parseDeckMarkdown(`# Executive signal

<deck-signal-board
  title="Executive signal"
  body="The renderer output can carry dashboard, callout, and narrative reporting patterns."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Control, Effort"
  values="82, 74, 63"
></deck-signal-board>`)

  assert.equal(deck.slides[0].layout, 'signal-board')
  assert.equal(deck.slides[0].signalBoard.title, 'Executive signal')
  assert.deepEqual(deck.slides[0].signalBoard.tags, [
    'Revenue protection',
    'Journey speed',
    'Audit confidence',
  ])
  assert.deepEqual(deck.slides[0].signalBoard.labels, ['Speed', 'Control', 'Effort'])
  assert.deepEqual(deck.slides[0].signalBoard.values, [82, 74, 63])
  assert.match(deck.slides[0].source, /class="deck-signal-board/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-signal-board/i)
})

test('parses deck-orchestration as a structured channel-to-system component', () => {
  const deck = parseDeckMarkdown(`# What we do

<deck-orchestration
  upstream-label="Customer channels"
  upstream="Voice, Chat, Web"
  layer="Lightico"
  logo="company"
  tagline="the AI orchestration layer"
  capabilities="Identity & MFA, eSignatures, Compliance steps"
  downstream-label="Core systems"
  downstream="CRM, Billing, Document store"
  caption="One connected journey with compliance built into the flow."
></deck-orchestration>`)

  assert.equal(deck.slides[0].layout, 'orchestration')
  assert.equal(deck.slides[0].orchestration.layer, 'Lightico')
  assert.equal(deck.slides[0].orchestration.logo, true)
  assert.deepEqual(deck.slides[0].orchestration.upstream, ['Voice', 'Chat', 'Web'])
  assert.deepEqual(deck.slides[0].orchestration.capabilities, [
    'Identity & MFA',
    'eSignatures',
    'Compliance steps',
  ])
  assert.deepEqual(deck.slides[0].orchestration.downstream, ['CRM', 'Billing', 'Document store'])
  assert.match(deck.slides[0].source, /class="deck-orchestration/)
  assert.match(deck.slides[0].source, /class="deck-orchestration-layer-brand"/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-orchestration/i)
})

test('renderer-backed components do not emit nested deck section tags', () => {
  const deck = parseDeckMarkdown(`# Signal

<deck-signal-board
  title="Executive signal"
  body="Narrative signal body."
  labels="Speed, Control"
  values="82, 74"
></deck-signal-board>

---

# Swimlane

<deck-swimlane>
  <deck-lane title="Lane A"><deck-step title="Start"><p>Begin.</p></deck-step></deck-lane>
</deck-swimlane>

---

<deck-exec-title title="Executive story" subtitle="Renderer-owned title slide."></deck-exec-title>`)

  const compiledSource = deck.slides.map((slide) => slide.source).join('\n')
  assert.doesNotMatch(compiledSource, /<section class="deck-/)
  assert.match(compiledSource, /<div class="deck-signal-board/)
  assert.match(compiledSource, /<div class="deck-lane/)
  assert.match(compiledSource, /<div class="deck-exec deck-exec-title/)
})

test('parses deck-funnel as a structured funnel slide component', () => {
  const deck = parseDeckMarkdown(`# Conversion funnel

<deck-funnel
  title="Completion funnel"
  labels="Invited, Started, Completed"
  values="8420, 6568, 5136"
></deck-funnel>`)

  assert.equal(deck.slides[0].layout, 'funnel')
  assert.equal(deck.slides[0].funnel.title, 'Completion funnel')
  assert.deepEqual(deck.slides[0].funnel.labels, ['Invited', 'Started', 'Completed'])
  assert.deepEqual(deck.slides[0].funnel.values, [8420, 6568, 5136])
  assert.match(deck.slides[0].source, /class="deck-funnel/)
  assert.match(deck.slides[0].source, /class="deck-funnel-svg"/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-funnel/i)
})

test('parses deck-metric-trend as a structured metric trend component', () => {
  const deck = parseDeckMarkdown(`# Operating signal

<deck-metric-trend
  metric="92%"
  metric-label="completed within SLA"
  title="Weekly trend"
  labels="W1, W2, W3, W4, W5"
  values="70, 78, 76, 86, 92"
  unit="%"
></deck-metric-trend>`)

  assert.equal(deck.slides[0].layout, 'metric-trend')
  assert.equal(deck.slides[0].metricTrend.metric, '92%')
  assert.equal(deck.slides[0].metricTrend.metricLabel, 'completed within SLA')
  assert.deepEqual(deck.slides[0].metricTrend.labels, ['W1', 'W2', 'W3', 'W4', 'W5'])
  assert.deepEqual(deck.slides[0].metricTrend.values, [70, 78, 76, 86, 92])
  assert.match(deck.slides[0].source, /class="deck-metric-trend/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-metric-trend/i)
})

test('parses deck-heatmap as a structured heatmap component', () => {
  const deck = parseDeckMarkdown(`# Activity heatmap

<deck-heatmap
  title="Activity by hour"
  x-labels="08, 09, 10"
  y-labels="Mon, Tue"
  values="42, 58, 76; 35, 61, 88"
  unit=" cases"
></deck-heatmap>`)

  assert.equal(deck.slides[0].layout, 'heatmap')
  assert.equal(deck.slides[0].heatmap.title, 'Activity by hour')
  assert.deepEqual(deck.slides[0].heatmap.xLabels, ['08', '09', '10'])
  assert.deepEqual(deck.slides[0].heatmap.yLabels, ['Mon', 'Tue'])
  assert.deepEqual(deck.slides[0].heatmap.values, [[42, 58, 76], [35, 61, 88]])
  assert.match(deck.slides[0].source, /class="deck-heatmap/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-heatmap/i)
})

test('parses deck-impact-radar as a structured impact profile component', () => {
  const deck = parseDeckMarkdown(`# Operating model

<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
  radar-values="84, 76, 68, 91"
  caption="Renderer-owned SVG in HTML and static SVG in PPTX."
></deck-impact-radar>`)

  assert.equal(deck.slides[0].layout, 'impact-radar')
  assert.equal(deck.slides[0].impactRadar.barTitle, 'Workstream impact')
  assert.deepEqual(deck.slides[0].impactRadar.labels, ['Speed', 'Control', 'Effort', 'Visibility'])
  assert.deepEqual(deck.slides[0].impactRadar.values, [84, 76, 68, 91])
  assert.deepEqual(deck.slides[0].impactRadar.radarValues, [84, 76, 68, 91])
  assert.match(deck.slides[0].source, /class="deck-impact-radar/)
  assert.match(deck.slides[0].source, /class="deck-impact-radar-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-impact-radar/i)
})

test('parses deck-treemap as a structured treemap component', () => {
  const deck = parseDeckMarkdown(`# Portfolio treemap

<deck-treemap
  title="Portfolio mix"
  labels="Journey A, Journey B, Journey C, Journey D"
  values="5200, 1100, 860, 380"
  unit=" cases"
></deck-treemap>`)

  assert.equal(deck.slides[0].layout, 'treemap')
  assert.equal(deck.slides[0].treemap.title, 'Portfolio mix')
  assert.deepEqual(deck.slides[0].treemap.labels, ['Journey A', 'Journey B', 'Journey C', 'Journey D'])
  assert.deepEqual(deck.slides[0].treemap.values, [5200, 1100, 860, 380])
  assert.match(deck.slides[0].source, /class="deck-treemap/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-treemap/i)
})

test('parses deck-journey-map as a structured journey component', () => {
  const deck = parseDeckMarkdown(`# Customer journey

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start the secure journey."></deck-journey-step>
  <deck-journey-step label="02" title="Capture" body="Collect evidence and consent."></deck-journey-step>
  <deck-journey-step label="03" title="Review" body="Check completeness."></deck-journey-step>
</deck-journey-map>`)

  assert.equal(deck.slides[0].layout, 'journey-map')
  assert.equal(deck.slides[0].journeyMap.steps.length, 3)
  assert.equal(deck.slides[0].journeyMap.steps[1].title, 'Capture')
  assert.match(deck.slides[0].source, /class="deck-journey-map/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-journey-map/i)
})

test('parses deck-journey-path as a structured journey dashboard component', () => {
  const deck = parseDeckMarkdown(`# Journey signal

<deck-journey-path
  metric="42%"
  metric-label="of avoidable delay sits in two handoffs."
  labels="Invite, Evidence, Approval, Complete"
  notes="fast start, largest rework loop, decision queue, customer notified"
  hotspots="Evidence, Approval"
  callout-title="Recommended intervention"
  callout-body="Automated reminders plus controlled evidence checks"
></deck-journey-path>`)

  assert.equal(deck.slides[0].layout, 'journey-path')
  assert.equal(deck.slides[0].journeyPath.metric, '42%')
  assert.deepEqual(deck.slides[0].journeyPath.labels, ['Invite', 'Evidence', 'Approval', 'Complete'])
  assert.deepEqual(deck.slides[0].journeyPath.hotspots, ['Evidence', 'Approval'])
  assert.match(deck.slides[0].source, /class="deck-journey-path/)
  assert.match(deck.slides[0].source, /class="deck-journey-path-svg/)
  assert.doesNotMatch(deck.slides[0].source, /<deck-journey-path/i)
})

test('adds Marp defaults while preserving deck frontmatter', async () => {
  const source = await readFile(new URL('../samples/demo.md', import.meta.url), 'utf8')
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const markdown = buildMarpMarkdown(deck, { themeName: definitions.brand.themeName })

  assert.match(markdown, /marp: true/)
  assert.match(markdown, /theme: deckbuilder/)
  assert.match(markdown, /paginate: false/)
  assert.match(markdown, /title: Marp Deckbuilder Demo/)
})

test('configured brand theme wins over stale authored theme frontmatter', () => {
  const deck = parseDeckMarkdown(`---
title: Branded deck
theme: old-lightico-name
---

# Cover`)
  const markdown = buildMarpMarkdown(deck, { themeName: 'lightico-deck' })

  assert.match(markdown, /theme: lightico-deck/)
  assert.doesNotMatch(markdown, /old-lightico-name/)
})

test('preserves explicit pagination when requested', () => {
  const deck = parseDeckMarkdown(`---
title: Numbered deck
paginate: true
---

# Cover`)
  const markdown = buildMarpMarkdown(deck, { themeName: 'deckbuilder' })

  assert.match(markdown, /paginate: true/)
})

test('infers slide surfaces and customer logo chrome metadata', () => {
  const deck = parseDeckMarkdown(`---
companyLogo: resource:logos/lightico.svg
companyName: Lightico
customer:
  name: Customer A
  logo: resource:logos/customer-a.svg
---

# Cover

---

<!-- _class: light -->

# Content

<deck-slide customer-logo="resource:logos/inline.svg" customer-name="Inline customer" />

Body copy`)

  assert.equal(deck.slides[0].surface, 'dark')
  assert.equal(deck.slides[0].companyLogo.src, 'resource:logos/lightico.svg')
  assert.equal(deck.slides[0].companyLogo.alt, 'Lightico')
  assert.equal(deck.slides[0].customerLogo.src, 'resource:logos/customer-a.svg')
  assert.equal(deck.slides[0].customerLogo.alt, 'Customer A')
  assert.equal(deck.slides[1].surface, 'light')
  assert.equal(deck.slides[1].companyLogo.src, 'resource:logos/lightico.svg')
  assert.equal(deck.slides[1].customerLogo.src, 'resource:logos/inline.svg')
  assert.equal(deck.slides[1].customerLogo.alt, 'Inline customer')
})

test('defaults ordinary content slides to dark while allowing explicit light', () => {
  const deck = parseDeckMarkdown(`# Default content

Body copy

---

<deck-slide surface="light" />

# Light option

Body copy`)

  assert.equal(deck.slides[0].surface, 'dark')
  assert.equal(deck.slides[1].surface, 'light')
})

test('rejects deck-visual as a retired raw SVG escape hatch', () => {
  const source = `# Cover

---

# Visual report

<deck-visual title="Operating model" caption="Embedded as SVG in PPTX.">
  <svg viewBox="0 0 200 100" role="img" aria-label="Simple metric">
    <rect x="10" y="10" width="180" height="80" fill="#eef6fe"/>
    <text x="30" y="60">84%</text>
  </svg>
</deck-visual>`

  assert.throws(
    () => parseDeckMarkdown(source),
    /<deck-visual> is no longer supported because it allowed raw SVG authoring.*ask the skill maker/,
  )
})

test('parses compact comparison columns and rows attributes', () => {
  const deck = parseDeckMarkdown(`# Comparison

<deck-comparison
  columns="Bad assumption,Correct workflow"
  rows="Count status = created|Count cases first;Trust first result|Cross-check edge cases">
</deck-comparison>`)

  const comparison = deck.slides[0].comparison

  assert.equal(comparison.leftTitle, 'Bad assumption')
  assert.equal(comparison.rightTitle, 'Correct workflow')
  assert.deepEqual(comparison.rows, [
    { label: '', left: 'Count status = created', right: 'Count cases first' },
    { label: '', left: 'Trust first result', right: 'Cross-check edge cases' },
  ])
  assert.doesNotMatch(deck.slides[0].source, /Option A/)
  assert.doesNotMatch(deck.slides[0].source, /Option B/)
})

test('preserves deck-card icon and image references as card media', () => {
  const deck = parseDeckMarkdown(`# Card icons

<deck-card-grid columns="3">
  <deck-card title="Face scan" icon="product-face-scan"><p>Capture identity.</p></deck-card>
  <deck-card title="Document" image="icons/document-check.svg"><p>Check evidence.</p></deck-card>
  <deck-card title="Source alias" src="resource:icons/signed.svg" alt="Signed"><p>Sign the pack.</p></deck-card>
</deck-card-grid>`)

  assert.equal(deck.slides[0].cards.length, 3)
  assert.deepEqual(deck.slides[0].cards.map((card) => card.media?.src), [
    'resource:icons/product-face-scan',
    'resource:icons/document-check.svg',
    'resource:icons/signed.svg',
  ])
  assert.match(deck.slides[0].source, /deck-card-icon/)
  assert.match(deck.slides[0].source, /deck-card-image/)
  assert.doesNotMatch(deck.slides[0].source, /<p><\/p>/)
})

test('parses markdown subheadings and bullet lists for native PPTX content', () => {
  const deck = parseDeckMarkdown(`# Practical Takeaways

## What the group landed on

- Claude can be safe and useful at work.
- MCPs are the bridge between sandboxed AI and useful internal data.
- Skills are repeatable workflows, not just prompts with a fancy name.`)

  assert.equal(deck.slides[0].subtitle, 'What the group landed on')
  assert.deepEqual(deck.slides[0].bullets, [
    'Claude can be safe and useful at work.',
    'MCPs are the bridge between sandboxed AI and useful internal data.',
    'Skills are repeatable workflows, not just prompts with a fancy name.',
  ])
  assert.deepEqual(deck.slides[0].paragraphs, [])
})

test('fails loudly on invalid deck component Markdown', () => {
  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-card-grid columns="3">
  <deck-card title="Oops"><p>Body</p>
</deck-card-grid>`),
    /Invalid deck Markdown in slide 1, line 5: Mismatched deck component tags/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-card-grid columns="3">
</deck-card-grid>`),
    /deck-card-grid must include at least one deck-card/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart title="Bad" labels="A,B" values="10"></deck-chart>`),
    /deck-chart labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="gauge" title="Bad" labels="A,B" values="10,20"></deck-chart>`),
    /deck-chart type "gauge" is not available.*Supported types: bar, line, area, waterfall, bullet, grouped-bar, stacked-bar, doughnut, scatter, bubble, histogram, boxplot, pareto, radar, sankey/,
  )

  const radarDeck = parseDeckMarkdown(`# Balance

<deck-chart type="radar" title="Operating balance" labels="Speed,Control,Effort" values="84,76,68"></deck-chart>`)
  assert.equal(radarDeck.slides[0].chart.chartType, 'radar')
  assert.match(radarDeck.slides[0].source, /class="deck-chart deck-chart-radar"/)

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="grouped-bar" title="Bad" series="Current" labels="A,B" values="10,20"></deck-chart>`),
    /deck-chart type="grouped-bar" requires at least two series names/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="grouped-bar" title="Bad" series="Current,Target" labels="A,B" values="10,20"></deck-chart>`),
    /deck-chart grouped-bar series\/values row mismatch: 2 series name\(s\), 1 value row\(s\)/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="grouped-bar" title="Bad" series="Current,Target" labels="A,B" values="10,20;30"></deck-chart>`),
    /deck-chart grouped-bar row 2 length mismatch: 2 label\(s\), 1 value\(s\)/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="stacked-bar" title="Bad" series="Current,Target" labels="A,B" values="10,-20;30,40"></deck-chart>`),
    /deck-chart stacked-bar values must be zero or positive/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="stacked-bar" title="Bad" series="Current,Target" labels="A,B" values="0,20;0,40"></deck-chart>`),
    /deck-chart stacked-bar column "A" must sum to more than zero/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="doughnut" title="Bad" labels="A,B" values="10,-1"></deck-chart>`),
    /deck-chart doughnut values must be zero or positive/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="doughnut" title="Bad" labels="A,B" values="0,0"></deck-chart>`),
    /deck-chart doughnut values must sum to more than zero/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="area" points="Jan:10"></deck-chart>`),
    /deck-chart type="area" requires at least two labels\/values or points entries/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="bullet" labels="A" values="10"></deck-chart>`),
    /deck-chart type="bullet" requires targets or target-values/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="bullet" labels="A,B" values="10,20" targets="12"></deck-chart>`),
    /deck-chart type="bullet" labels\/targets length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="bullet" labels="A" values="-1" targets="10"></deck-chart>`),
    /deck-chart type="bullet" values and targets must be zero or positive/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="scatter"></deck-chart>`),
    /deck-chart type="scatter" requires points="x\|y\|Label;..." with at least one point/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="scatter" points="A|10|Bad"></deck-chart>`),
    /deck-chart scatter point 1 must use numeric x and y values/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="bubble"></deck-chart>`),
    /deck-chart type="bubble" requires points="x:y:r,\.\.\." with at least one point/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="bubble" points="1:2"></deck-chart>`),
    /deck-chart bubble point 1 must use numeric x, y, and r values/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="bubble" points="1:2:0"></deck-chart>`),
    /deck-chart bubble point 1 radius must be greater than zero/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="histogram"></deck-chart>`),
    /deck-chart type="histogram" requires non-empty numeric values/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="histogram" values="1,nope"></deck-chart>`),
    /deck-chart type="histogram" values must all be numeric/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="histogram" values="1,2" bins="1"></deck-chart>`),
    /deck-chart type="histogram" bins must be an integer between 2 and 30/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="boxplot" values="1|2|3|4|5"></deck-chart>`),
    /deck-chart type="boxplot" requires non-empty labels/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="boxplot" labels="A"></deck-chart>`),
    /deck-chart type="boxplot" requires matrix values in values, matrix, or series-values/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="boxplot" labels="A,B" values="1|2|3|4|5"></deck-chart>`),
    /deck-chart type="boxplot" labels\/rows length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="boxplot" labels="A" values="1|2|3|4"></deck-chart>`),
    /deck-chart type="boxplot" row 1 must include at least 5 numeric observations/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="boxplot" labels="A" values="1|2|3|4|nope"></deck-chart>`),
    /deck-chart type="boxplot" row 1 values must all be numeric/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="pareto"></deck-chart>`),
    /deck-chart type="pareto" requires non-empty labels and values/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="pareto" labels="A,B" values="10"></deck-chart>`),
    /deck-chart type="pareto" labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="pareto" labels="A,B" values="10,nope"></deck-chart>`),
    /deck-chart type="pareto" values must all be numeric/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="pareto" labels="A,B" values="10,-1"></deck-chart>`),
    /deck-chart pareto values must be zero or positive/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="pareto" labels="A,B" values="0,0"></deck-chart>`),
    /deck-chart pareto values must sum to more than zero/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="sankey"></deck-chart>`),
    /deck-chart type="sankey" requires non-empty links/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="sankey" links="A-B:10"></deck-chart>`),
    /deck-chart type="sankey" link 1 must use source>target:value syntax/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="sankey" links="A>B:nope"></deck-chart>`),
    /deck-chart type="sankey" link 1 value must be numeric/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="sankey" links="A>B:0"></deck-chart>`),
    /deck-chart type="sankey" link 1 value must be greater than zero/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="sankey" links="A>A:10"></deck-chart>`),
    /deck-chart type="sankey" link 1 cannot connect a node to itself/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart type="sankey" links="A>B:10,B>A:5"></deck-chart>`),
    /deck-chart type="sankey" links must not contain cycles/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-signal-bars metric="97%" metric-label="Too short" labels="A,B" values="10"></deck-signal-bars>`),
    /deck-signal-bars labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-signal-bars metric="97%" labels="A" values="10"></deck-signal-bars>`),
    /deck-signal-bars requires a metric-label attribute/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-signal-board title="Signal" body="Narrative" labels="A,B" values="10"></deck-signal-board>`),
    /deck-signal-board labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-signal-board title="Signal" labels="A" values="10"></deck-signal-board>`),
    /deck-signal-board requires a body attribute/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-impact-radar labels="Speed,Control" values="80,70"></deck-impact-radar>`),
    /deck-impact-radar requires at least 3 labels/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-impact-radar labels="Speed,Control,Effort" values="80,70"></deck-impact-radar>`),
    /deck-impact-radar labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-impact-radar labels="Speed,Control,Effort" values="80,70,105"></deck-impact-radar>`),
    /deck-impact-radar values and radar-values must be between 0 and 100/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-funnel labels="A,B" values="10"></deck-funnel>`),
    /deck-funnel labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-funnel labels="A" values="nope"></deck-funnel>`),
    /deck-funnel values must all be numeric/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-metric-trend metric="92%" labels="W1" values="92"></deck-metric-trend>`),
    /deck-metric-trend requires a metric-label attribute/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-metric-trend metric="92%" metric-label="SLA" labels="W1,W2" values="92"></deck-metric-trend>`),
    /deck-metric-trend labels\/values length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-metric-trend metric="92%" metric-label="SLA" labels="W1" values="nope"></deck-metric-trend>`),
    /deck-metric-trend values must all be numeric/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-heatmap y-labels="Mon" values="1,2"></deck-heatmap>`),
    /deck-heatmap requires x-labels/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-heatmap x-labels="08,09" y-labels="Mon,Tue" values="1,2"></deck-heatmap>`),
    /deck-heatmap values\/y-labels mismatch: 1 value row\(s\), 2 y-label\(s\)/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-heatmap x-labels="08,09" y-labels="Mon" values="1,nope"></deck-heatmap>`),
    /deck-heatmap row 1 contains a non-numeric value/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-treemap labels="A,B" values="1"></deck-treemap>`),
    /deck-treemap labels\/values length mismatch: 2 label\(s\), 1 value\(s\)/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-treemap labels="A,B" values="0,0"></deck-treemap>`),
    /deck-treemap values must sum to more than zero/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-journey-map></deck-journey-map>`),
    /deck-journey-map must include at least one deck-journey-step child/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-journey-step title="Orphan"></deck-journey-step>`),
    /<deck-journey-step> must be placed directly inside <deck-journey-map>/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-journey-map>
  <deck-journey-step body="Missing title"></deck-journey-step>
</deck-journey-map>`),
    /deck-journey-step 1 requires a title/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-journey-path metric="42%" metric-label="Delay" labels="Invite" notes="start"></deck-journey-path>`),
    /deck-journey-path requires labels="..." with 2 to 5 journey stages/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-journey-path metric="42%" metric-label="Delay" labels="Invite, Evidence" notes="start"></deck-journey-path>`),
    /deck-journey-path notes\/labels length mismatch/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-cardd title="Typo"></deck-cardd>`),
    /Deck component <deck-cardd> is not available\. Use a supported deck-\* component or ask the skill maker to add it/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-card-grid columns="3">
  <deck-card title="Oops" status="draft">Body</deck-card>
</deck-card-grid>`),
    /Unsupported <deck-card> attribute "status".*Supported attributes: title, header, icon, icon-alt, image, src, image-alt, alt/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-slide layout="content" background="blue"></deck-slide>`),
    /Unsupported <deck-slide> attribute "background".*Supported attributes:/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<script>window.bad = true</script>`),
    /Raw <script> is not supported in deck Markdown.*ask the skill maker/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<style scoped>.bad { color: red; }<\/style>`),
    /Raw <style> is not supported in deck Markdown.*ask the skill maker/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<canvas id="bad"></canvas>`),
    /Raw <canvas> is not supported in deck Markdown.*ask the skill maker/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<img src="resource:screenshots/workflow.png" alt="Workflow">`),
    /Raw <img> is not supported in deck Markdown.*ask the skill maker/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<div class="custom-layout">Do not hand-author layout HTML.</div>`),
    /Raw <div> is not supported in deck Markdown.*ask the skill maker/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<table><tr><td>Use a component instead.</td></tr></table>`),
    /Raw <table> is not supported in deck Markdown.*ask the skill maker/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<svg viewBox="0 0 100 60" role="img" aria-label="Raw SVG">
  <rect width="100" height="60"></rect>
</svg>`),
    /Raw <svg> is not supported in deck Markdown.*ask the skill maker/,
  )
})
