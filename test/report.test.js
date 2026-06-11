import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { loadDefinitions } from '../src/brand.js'
import { renderReportHtml } from '../src/report.js'

const tmpDir = path.resolve('.tmp', 'report-tests')

test('renders self-contained long-form report HTML', async () => {
  await mkdir(path.join(tmpDir, 'resources', 'images'), { recursive: true })
  await writeFile(path.join(tmpDir, 'resources', 'images', 'chart.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  await writeFile(path.join(tmpDir, 'resources', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          default: 'resource:logo.svg',
        },
      },
    },
  }
  const rendered = renderReportHtml(
    `---
title: Client Usage Report
subtitle: April overview
---

# Executive summary

The report can hold more detail than a slide deck.

![Chart](images/chart.svg)

| Metric | Value |
| --- | ---: |
| Cases | 115060 |
`,
    {
      resourcesDir: path.join(tmpDir, 'resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /deck-report/)
  assert.match(rendered.document, /Client Usage Report/)
  assert.match(rendered.document, /April overview/)
  assert.match(rendered.document, /@media print/)
  assert.match(rendered.document, /data:image\/svg\+xml;base64,/)
  assert.match(rendered.document, /report-logo/)
  assert.doesNotMatch(rendered.document, /resource:images\/chart\.svg/)
  assert.doesNotMatch(rendered.document, /resource:logo\.svg/)
})

test('expands report bar chart components into chart HTML and initializer', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Chart Component Report
---

# Volume

<report-chart
  type="bar"
  title="Cases by journey"
  series="Cases"
  labels="J0107,J0106,J0101"
  values="52208,11119,8648"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-bar"/)
  assert.match(rendered.document, /<canvas id="report-chart-1"/)
  assert.match(rendered.document, /data-report-component-script="chart"/)
  assert.match(rendered.document, /const canvas = document\.getElementById\("report-chart-1"\)/)
  assert.match(rendered.document, /new Chart\(canvas, /)
  assert.match(rendered.document, /labels:\s*\["J0107","J0106","J0101"\]/)
  assert.match(rendered.document, /data:\s*\[52208,11119,8648\]/)
})

test('assigns unique generated IDs to multiple report charts', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Multi-chart report

<report-chart title="First" labels="A,B" values="10,20"></report-chart>

<report-chart title="Second" labels="C,D" values="30,40"></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<canvas id="report-chart-1"/)
  assert.match(rendered.document, /<canvas id="report-chart-2"/)
  assert.match(rendered.document, /document\.getElementById\("report-chart-1"\)/)
  assert.match(rendered.document, /document\.getElementById\("report-chart-2"\)/)
})

test('applies dark report theme and generated navigation from frontmatter', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Dark Navigation Report
subtitle: Layout proof
reportTheme: dark
reportNav: true
---

## Executive Summary

This report uses generated dark report chrome.

## Volume Chart

<report-chart title="Cases by journey" labels="J0107,J0106" values="52208,11119"></report-chart>

## Next Steps

1. Review the dominant journey.
2. Track changes next month.
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<body class="report-theme-dark-page">/)
  assert.match(rendered.document, /<main class="deck-report report-theme-dark">/)
  assert.match(rendered.document, /<div class="report-layout">/)
  assert.match(rendered.document, /<aside class="report-sidebar"/)
  assert.match(rendered.document, /<a href="#executive-summary">Executive Summary<\/a>/)
  assert.match(rendered.document, /<a href="#volume-chart">Volume Chart<\/a>/)
  assert.match(rendered.document, /<h2 id="executive-summary">Executive Summary<\/h2>/)
  assert.match(rendered.document, /<div class="report-main">/)
  assert.doesNotMatch(rendered.document, /<report-chart/i)
})

test('expands report metric grid components into reusable metric cards', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Metric report

<report-metric-grid>
  <report-metric value="77,951" label="Total cases" sub="+12% vs prior"></report-metric>
  <report-metric value="94.3%" label="Completion rate" sub="-1.1 pp" direction="down"></report-metric>
</report-metric-grid>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-metric/i)
  assert.match(rendered.document, /class="report-metric-grid"/)
  assert.match(rendered.document, /<div class="report-metric-value">77,951<\/div>/)
  assert.match(rendered.document, /<div class="report-metric-label">Total cases<\/div>/)
  assert.match(rendered.document, /<div class="report-metric-sub">[+]12% vs prior<\/div>/)
  assert.match(rendered.document, /<div class="report-metric-sub down">-1\.1 pp<\/div>/)
})

test('report metric grids fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-metric-grid></report-metric-grid>', options),
    /report-metric-grid must include at least one report-metric/,
  )
  assert.throws(
    () => renderReportHtml('<report-metric value="1" label="Outside"></report-metric>', options),
    /<report-metric> must be placed directly inside <report-metric-grid>/,
  )
})

test('expands report rate bars with computed shares', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Rate bar report

<report-rate-bars
  title="Journey distribution"
  labels="J0107,J0106,J0101"
  values="52208,11119,8648"
></report-rate-bars>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-rate-bars/i)
  assert.match(rendered.document, /class="report-rate-bars"/)
  assert.match(rendered.document, /<div class="report-rate-bars-title">Journey distribution<\/div>/)
  assert.match(rendered.document, /<span class="report-rate-label">J0107<\/span>/)
  assert.match(rendered.document, /<div class="report-rate-fill" style="--report-rate-width:72\.5%;--report-rate-color:#0F82F5"><\/div>/)
  assert.match(rendered.document, /<span class="report-rate-value">52,208<\/span>/)
  assert.match(rendered.document, /<span class="report-rate-pct">72\.5%<\/span>/)
})

test('report rate bars support explicit shares and clamp widths', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Explicit share report

<report-rate-bars
  labels="Overflow,Small"
  values="120,8"
  shares="125,6.25"
  colors="FC5161,59D6FD"
></report-rate-bars>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /--report-rate-width:100%;--report-rate-color:#FC5161/)
  assert.match(rendered.document, /<span class="report-rate-pct">125%<\/span>/)
  assert.match(rendered.document, /--report-rate-width:6\.3%;--report-rate-color:#59D6FD/)
})

test('report rate bars fail clearly when data is malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-rate-bars labels="A,B" values="10"></report-rate-bars>', options),
    /report-rate-bars labels\/values length mismatch/,
  )
  assert.throws(
    () => renderReportHtml('<report-rate-bars labels="A" values="not-a-number"></report-rate-bars>', options),
    /report-rate-bars values must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-rate-bars labels="A,B" values="0,0"></report-rate-bars>', options),
    /report-rate-bars values must sum to more than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-rate-bars labels="A" values="1" shares="nope"></report-rate-bars>', options),
    /report-rate-bars shares must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-rate-bars labels="A" values="1" colors="javascript:bad"></report-rate-bars>', options),
    /report-rate-bars colors must be six-digit hex colors/,
  )
})

test('report chart components fail clearly when data is invalid', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-chart labels="A,B" values="10"></report-chart>', options),
    /report-chart labels\/values length mismatch/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart labels="A" values="not-a-number"></report-chart>', options),
    /report-chart values must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="area" labels="A" values="10"></report-chart>', options),
    /Unsupported report-chart type "area"/,
  )
  assert.throws(
    () => renderReportHtml('<report-unknown></report-unknown>', options),
    /Unknown report component <report-unknown>/,
  )
})

test('report rendering fails loudly on missing images', async () => {
  await mkdir(path.join(tmpDir, 'missing-resources'), { recursive: true })
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))

  assert.throws(
    () =>
      renderReportHtml('# Report\n\n![Missing](missing-chart.png)', {
        resourcesDir: path.join(tmpDir, 'missing-resources'),
        definitions,
        inlineAssets: true,
      }),
    /Resource not found: resource:missing-chart\.png/,
  )
})
