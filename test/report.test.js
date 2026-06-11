import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'

import { loadDefinitions } from '../src/brand.js'
import { renderReportHtml } from '../src/report.js'

const tmpDir = path.resolve('.tmp', 'report-tests')
const execFileAsync = promisify(execFile)

function embeddedPayload(source) {
  return Buffer.from(source).toString('base64')
}

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

test('report command rejects copied sidecar assets', async () => {
  const reportDir = path.join(tmpDir, 'cli-inline')
  await mkdir(reportDir, { recursive: true })
  const inputPath = path.join(reportDir, 'report.md')
  await writeFile(inputPath, '# CLI report\n\nBody copy.')

  await assert.rejects(
    execFileAsync(process.execPath, [
      'src/cli.js',
      'report',
      inputPath,
      '--html',
      path.join(reportDir, 'report.html'),
      '--resources',
      'resources',
      '--html-assets',
      'copy',
    ]),
    /Report HTML is always self-contained/,
  )
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
  value-suffix=" cases"
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
  assert.match(rendered.document, /interaction:\s*\{\s*mode:\s*"index",\s*intersect:\s*false\s*\}/)
  assert.match(rendered.document, /tooltip:\s*\{[\s\S]*enabled:\s*true/)
  assert.match(rendered.document, /label:\s*\(context\)\s*=>\s*\{[\s\S]*formatTooltipValue\(parsedValue\)/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
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

test('expands report line chart components into Chart.js line initializers', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Line chart report

<report-chart
  type="line"
  title="Weekly cases"
  series="Cases"
  labels="Week 1,Week 2,Week 3"
  values="4200,5100,4800"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-line"/)
  assert.match(rendered.document, /type:\s*"line"/)
  assert.match(rendered.document, /borderColor:\s*"#0F82F5"/)
  assert.match(rendered.document, /pointHoverRadius:\s*6/)
  assert.match(rendered.document, /tension:\s*0\.35/)
  assert.match(rendered.document, /tooltip:\s*\{[\s\S]*enabled:\s*true/)
})

test('expands report doughnut chart components into Chart.js doughnut initializers', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Doughnut chart report

<report-chart
  type="doughnut"
  title="Journey mix"
  series="Cases"
  value-suffix=" cases"
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
  assert.match(rendered.document, /class="report-chart report-chart-doughnut"/)
  assert.match(rendered.document, /type:\s*"doughnut"/)
  assert.match(rendered.document, /hoverOffset:\s*8/)
  assert.match(rendered.document, /legend:\s*\{\s*display:\s*true,\s*position:\s*"right"/)
  assert.match(rendered.document, /const parsedValue = context\.parsed && typeof context\.parsed === "object"/)
  assert.doesNotMatch(rendered.document, /scales:\s*\{/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report area chart components into Observable Plot initializers', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Area chart report

<report-chart
  type="area"
  title="Daily volume"
  value-suffix=" cases"
  points="2026-04-01:1200,2026-04-02:1540,2026-04-03:1325"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-area"/)
  assert.match(rendered.document, /<div id="report-chart-1" class="report-chart-plot" role="img"/)
  assert.match(rendered.document, /target\.append\(Plot\.plot\(/)
  assert.match(rendered.document, /Plot\.areaY\(data, /)
  assert.match(rendered.document, /Plot\.lineY\(data, /)
  assert.match(rendered.document, /Plot\.tip\(data, Plot\.pointerX\(/)
  assert.match(rendered.document, /tooltip\.className = "report-chart-floating-tooltip"/)
  assert.match(rendered.document, /target\.addEventListener\("mousemove"/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report treemap chart components into D3 treemap initializers', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Treemap chart report

<report-chart
  type="treemap"
  title="Journey breakdown"
  value-suffix=" cases"
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
  assert.match(rendered.document, /class="report-chart report-chart-treemap"/)
  assert.match(rendered.document, /<div id="report-chart-1" class="report-chart-plot" role="img"/)
  assert.match(rendered.document, /d3\.hierarchy\(\{ children: data \}\)/)
  assert.match(rendered.document, /d3\.treemap\(\)/)
  assert.match(rendered.document, /svg\.selectAll\("g"\)/)
  assert.match(rendered.document, /tooltip\.className = "report-chart-floating-tooltip"/)
  assert.match(rendered.document, /cell\.on\("mousemove"/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('allows Chart.js, Observable Plot, and D3 report charts to coexist', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Mixed chart report

<report-chart title="Cases" labels="A,B" values="10,20"></report-chart>

<report-chart type="area" title="Trend" points="2026-04-01:10,2026-04-02:20"></report-chart>

<report-chart type="treemap" title="Mix" labels="A,B" values="10,20"></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<canvas id="report-chart-1"/)
  assert.match(rendered.document, /<div id="report-chart-2" class="report-chart-plot"/)
  assert.match(rendered.document, /<div id="report-chart-3" class="report-chart-plot"/)
  assert.match(rendered.document, /new Chart\(canvas, /)
  assert.match(rendered.document, /target\.append\(Plot\.plot\(/)
  assert.match(rendered.document, /d3\.treemap\(\)/)
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

test('dark report components preserve renderer-owned corporate logo', async () => {
  const logoDir = path.join(tmpDir, 'logo-retention', 'resources')
  await mkdir(logoDir, { recursive: true })
  await writeFile(path.join(logoDir, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><title>Logo</title></svg>')
  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      name: 'Acme',
      assets: {
        logo: {
          report: 'resource:logo.svg',
        },
      },
    },
  }
  const rendered = renderReportHtml(
    `---
title: Logo Retention Report
reportTheme: dark
reportNav: true
---

## Summary

<report-metric-grid>
  <report-metric value="42" label="Retained assets"></report-metric>
</report-metric-grid>

## Detail

The report body uses compact components while brand chrome remains renderer-owned.
`,
    {
      resourcesDir: logoDir,
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<body class="report-theme-dark-page">/)
  assert.match(rendered.document, /<img class="report-logo" src="data:image\/svg\+xml;base64,[^"]+" alt="Acme logo">/)
  assert.doesNotMatch(rendered.document, /resource:logo\.svg/)
  assert.doesNotMatch(rendered.document, /<report-metric/i)
})

test('report corporate logo follows dark and light report modes', async () => {
  const logoDir = path.join(tmpDir, 'logo-modes', 'resources')
  await mkdir(path.join(logoDir, 'logos'), { recursive: true })
  await writeFile(
    path.join(logoDir, 'logos', 'fake-logo-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"><text fill="#fff">Fake white text logo</text></svg>',
  )
  await writeFile(
    path.join(logoDir, 'logos', 'fake-logo-light.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"><text fill="#000">Fake black text logo</text></svg>',
  )
  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      name: 'Mode Test',
      assets: {
        logo: {
          dark: 'resource:logos/fake-logo-dark.svg',
          light: 'resource:logos/fake-logo-light.svg',
        },
      },
    },
  }
  const darkLogo = '<svg xmlns="http://www.w3.org/2000/svg"><text fill="#fff">Fake white text logo</text></svg>'
  const lightLogo = '<svg xmlns="http://www.w3.org/2000/svg"><text fill="#000">Fake black text logo</text></svg>'
  const darkRendered = renderReportHtml(
    `---
title: Dark Logo Report
reportTheme: dark
---

## Summary

Dark report content.
`,
    {
      resourcesDir: logoDir,
      definitions,
      inlineAssets: true,
    },
  )
  const lightRendered = renderReportHtml(
    `---
title: Light Logo Report
---

## Summary

Light report content.
`,
    {
      resourcesDir: logoDir,
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(darkRendered.document, /src="data:image\/svg\+xml;base64,[^"]+"/)
  assert.equal(darkRendered.document.includes(embeddedPayload(darkLogo)), true)
  assert.equal(darkRendered.document.includes(embeddedPayload(lightLogo)), false)
  assert.match(lightRendered.document, /src="data:image\/svg\+xml;base64,[^"]+"/)
  assert.equal(lightRendered.document.includes(embeddedPayload(lightLogo)), true)
  assert.equal(lightRendered.document.includes(embeddedPayload(darkLogo)), false)
  assert.doesNotMatch(darkRendered.document, /assets\/logos/)
  assert.doesNotMatch(lightRendered.document, /assets\/logos/)
})

test('report uses bundled brand json logo configuration', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const darkLogo = await readFile(path.resolve('resources', 'logos', 'sample-corporate.dark.svg'), 'utf8')
  const lightLogo = await readFile(path.resolve('resources', 'logos', 'sample-corporate.light.svg'), 'utf8')
  const rendered = renderReportHtml(
    `---
title: Brand Json Logo Report
reportTheme: dark
---

## Summary

The report logo is configured by brand JSON.
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<img class="report-logo" src="data:image\/svg\+xml;base64,[^"]+" alt="Deckbuilder logo">/)
  assert.equal(rendered.document.includes(embeddedPayload(darkLogo)), true)
  assert.equal(rendered.document.includes(embeddedPayload(lightLogo)), false)
  assert.doesNotMatch(rendered.document, /assets\/logos/)
  assert.deepEqual(rendered.assets, [])
})

test('report uses brand json colors fonts and background assets', async () => {
  const brandDir = path.join(tmpDir, 'brand-config', 'resources')
  await mkdir(path.join(brandDir, 'backgrounds'), { recursive: true })
  await writeFile(
    path.join(brandDir, 'backgrounds', 'report-cover.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#123abc"/></svg>',
  )
  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      colors: {
        ...baseDefinitions.brand.colors,
        dark: '010203',
        blue: '123ABC',
        cyan: '45CDEF',
      },
      fonts: {
        regular: 'CorpSans',
        fallback: 'CorpFallback',
      },
      assets: {
        backgrounds: {
          content: 'resource:backgrounds/report-cover.svg',
        },
      },
    },
  }
  const rendered = renderReportHtml(
    `---
title: Brand Config Report
---

## Summary

Branding comes from brand JSON.
`,
    {
      resourcesDir: brandDir,
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /--report-dark: #010203/)
  assert.match(rendered.document, /--report-blue: #123ABC/)
  assert.match(rendered.document, /--report-cyan: #45CDEF/)
  assert.match(rendered.document, /font-family: "CorpSans", "CorpFallback", Arial, sans-serif/)
  assert.match(rendered.document, /background-image:[\s\S]*data:image\/svg\+xml;base64,/)
})

test('expands report figure components into embedded images with captions', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const figureSource = await readFile(path.resolve('resources', 'images', 'journey-volume.svg'), 'utf8')
  const rendered = renderReportHtml(
    `# Figure report

<report-figure
  src="images/journey-volume.svg"
  alt="Sample journey volume snapshot"
  caption="Journey volume is concentrated in J0107."
  source="Source: April journey export"
  size="wide"
></report-figure>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-figure/i)
  assert.match(rendered.document, /<figure class="report-figure report-figure-wide">/)
  assert.match(rendered.document, /<img src="data:image\/svg\+xml;base64,[^"]+" alt="Sample journey volume snapshot">/)
  assert.equal(rendered.document.includes(embeddedPayload(figureSource)), true)
  assert.match(rendered.document, /<span class="report-figure-caption">Journey volume is concentrated in J0107\.<\/span>/)
  assert.match(rendered.document, /<span class="report-figure-source">Source: April journey export<\/span>/)
  assert.doesNotMatch(rendered.document, /resource:images\/journey-volume\.svg/)
})

test('report figures fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-figure alt="Missing source"></report-figure>', options),
    /report-figure requires a src attribute/,
  )
  assert.throws(
    () => renderReportHtml('<report-figure src="images\/journey-volume.svg"></report-figure>', options),
    /report-figure requires an alt attribute for accessibility/,
  )
  assert.throws(
    () => renderReportHtml('<report-figure src="images\/journey-volume.svg" alt="Snapshot" size="giant"></report-figure>', options),
    /report-figure size must be narrow, normal, or wide/,
  )
})

test('expands report data tables into formatted table components', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Data table report

<report-data-table
  title="Journey breakdown"
  columns="Journey|Cases|Share|Status"
  types="text|number|percent|status"
  rows="J0107|52,208|67.1|Active;J0116|3,751|4.8|Review"
  caption="Registered and unregistered journey volume."
  source="Source: April journey export"
></report-data-table>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-data-table/i)
  assert.match(rendered.document, /<figure class="report-data-table">/)
  assert.match(rendered.document, /<div class="report-data-table-title">Journey breakdown<\/div>/)
  assert.match(rendered.document, /<th scope="col">Journey<\/th>/)
  assert.match(rendered.document, /<td class="report-data-table-cell report-data-table-cell-number">52,208<\/td>/)
  assert.match(rendered.document, /<td class="report-data-table-cell report-data-table-cell-percent">67\.1%<\/td>/)
  assert.match(rendered.document, /<span class="report-badge report-badge-green">Active<\/span>/)
  assert.match(rendered.document, /<span class="report-badge report-badge-orange">Review<\/span>/)
  assert.match(
    rendered.document,
    /<span class="report-data-table-caption">Registered and unregistered journey volume\.<\/span>/,
  )
  assert.match(rendered.document, /<span class="report-data-table-source">Source: April journey export<\/span>/)
})

test('report data tables fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-data-table rows="A|1"></report-data-table>', options),
    /report-data-table requires columns or headers/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A|B"></report-data-table>', options),
    /report-data-table requires at least one row/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A|B" types="text" rows="A|1"></report-data-table>', options),
    /report-data-table types\/columns length mismatch/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-data-table columns="A|B" types="text|number" rows="A|1|extra"></report-data-table>',
        options,
      ),
    /report-data-table row 1 has 3 cell\(s\), but 2 column\(s\) were declared/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-data-table columns="A" types="currency" rows="1"></report-data-table>', options),
    /report-data-table type "currency" is not available\. Supported types: text, number, percent, status\. Ask the skill maker to add missing table cell types/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-data-table columns="A" types="number" rows="not-a-number"></report-data-table>', options),
    /report-data-table row 1 column "A" must be numeric/,
  )
})

test('expands report key values into definition-list summaries', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Key values report

<report-key-values
  title="Report context"
  columns="3"
  items="Period: April 2026; Source: Journey export; Owner=Operations"
></report-key-values>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-key-values/i)
  assert.match(rendered.document, /<section class="report-key-values report-key-values-3"/)
  assert.match(rendered.document, /<div class="report-key-values-title">Report context<\/div>/)
  assert.match(rendered.document, /<dt>Period<\/dt>/)
  assert.match(rendered.document, /<dd>April 2026<\/dd>/)
  assert.match(rendered.document, /<dt>Owner<\/dt>/)
  assert.match(rendered.document, /<dd>Operations<\/dd>/)
})

test('report key values fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-key-values></report-key-values>', options),
    /report-key-values requires at least one item/,
  )
  assert.throws(
    () => renderReportHtml('<report-key-values columns="5" items="Period: April"></report-key-values>', options),
    /report-key-values columns must be between 1 and 4/,
  )
  assert.throws(
    () => renderReportHtml('<report-key-values items="Period only"></report-key-values>', options),
    /report-key-values item 1 must use "Label: Value" or "Label=Value"/,
  )
})

test('expands report source notes into renderer-owned asides', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Source note report

<report-source-note
  title="Methodology"
  source="Journey export"
  date="April 2026"
>Cases exclude test journeys and duplicate retries.</report-source-note>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-source-note/i)
  assert.match(rendered.document, /<aside class="report-source-note" role="note">/)
  assert.match(rendered.document, /<div class="report-source-note-title">Methodology<\/div>/)
  assert.match(
    rendered.document,
    /<div class="report-source-note-body">Cases exclude test journeys and duplicate retries\.<\/div>/,
  )
  assert.match(rendered.document, /<span>Source: Journey export<\/span>/)
  assert.match(rendered.document, /<span>Date: April 2026<\/span>/)
})

test('report source notes fail clearly when empty', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-source-note></report-source-note>', options),
    /report-source-note requires title, body text, source, or date/,
  )
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

test('expands report callouts into reusable finding blocks', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Callout report

<report-callout variant="warning" title="Action & review">
J0116 generated meaningful volume & needs review.
</report-callout>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-callout/i)
  assert.match(rendered.document, /class="report-callout report-callout-warning"/)
  assert.match(rendered.document, /<div class="report-callout-title">Action &amp; review<\/div>/)
  assert.match(rendered.document, /<div class="report-callout-body">J0116 generated meaningful volume &amp; needs review\.<\/div>/)
})

test('report callouts fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-callout variant="urgent">Check this.</report-callout>', options),
    /Unsupported report-callout variant "urgent"/,
  )
  assert.throws(
    () => renderReportHtml('<report-callout variant="info"></report-callout>', options),
    /report-callout requires title and\/or text content/,
  )
})

test('expands report accent cards into reusable accent blocks', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Accent card report

<report-accent-card accent="green" title="Recommendation & owner">
Prioritise the dominant journey & review the long-tail cases.
</report-accent-card>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-accent-card/i)
  assert.match(rendered.document, /class="report-accent-card report-accent-card-green"/)
  assert.match(rendered.document, /<div class="report-accent-card-title">Recommendation &amp; owner<\/div>/)
  assert.match(
    rendered.document,
    /<div class="report-accent-card-body">Prioritise the dominant journey &amp; review the long-tail cases\.<\/div>/,
  )
})

test('report accent cards fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-accent-card accent="magenta">Check this.</report-accent-card>', options),
    /Unsupported report-accent-card accent "magenta"/,
  )
  assert.throws(
    () => renderReportHtml('<report-accent-card accent="green"></report-accent-card>', options),
    /report-accent-card requires title and\/or text content/,
  )
})

test('expands report badges inside markdown tables', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Badge report

| Journey | Status |
| --- | --- |
| J0107 | <report-badge variant="green">Active & live</report-badge> |
| J0116 | <report-badge status="review" label="Review"></report-badge> |
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-badge/i)
  assert.match(rendered.document, /<span class="report-badge report-badge-green">Active &amp; live<\/span>/)
  assert.match(rendered.document, /<span class="report-badge report-badge-orange">Review<\/span>/)
  assert.match(rendered.document, /<table>/)
})

test('report badges fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-badge variant="purple">Unknown</report-badge>', options),
    /Unsupported report-badge variant "purple"/,
  )
  assert.throws(
    () => renderReportHtml('<report-badge variant="green"></report-badge>', options),
    /report-badge requires label or text content/,
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
    () => renderReportHtml('<report-chart type="radar" labels="A" values="10"></report-chart>', options),
    /report-chart type "radar" is not available\. Supported types: bar, line, doughnut, area, treemap\. Ask the skill maker to add missing chart types/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="doughnut" labels="A,B" values="10,-1"></report-chart>', options),
    /report-chart doughnut values must be zero or positive/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="doughnut" labels="A,B" values="0,0"></report-chart>', options),
    /report-chart doughnut values must sum to more than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="area" points="2026-04-01:nope"></report-chart>', options),
    /report-chart area points must be x:y pairs with numeric y values/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="treemap" labels="A,B" values="10,-1"></report-chart>', options),
    /report-chart treemap values must be zero or positive/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="treemap" labels="A,B" values="0,0"></report-chart>', options),
    /report-chart treemap values must sum to more than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-unknown></report-unknown>', options),
    /Report component <report-unknown> is not available\. Use a supported report-\* component or ask the skill maker to add it/,
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
