import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'

import { loadDefinitions } from '../src/brand.js'
import { renderReportHtml } from '../src/report.js'
import { injectReportVendorScripts } from '../src/report-vendors.js'

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

test('report print CSS preserves dark backgrounds and print layout', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Print Report
reportTheme: dark
reportNav: true
---

## Summary

<report-chart title="Cases" labels="A,B" values="10,20"></report-chart>

<report-page-break label="Next"></report-page-break>

<report-callout variant="warning" title="Finding">Backgrounds must survive print.</report-callout>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.css, /@media print \{[\s\S]*print-color-adjust: exact;/)
  assert.match(rendered.css, /@page \{[\s\S]*size: A4;[\s\S]*margin: 12mm 14mm 16mm;[\s\S]*background: #071228;/)
  assert.match(rendered.css, /@bottom-right \{[\s\S]*content: "Page " counter\(page\) " of " counter\(pages\);/)
  assert.match(rendered.css, /-webkit-print-color-adjust: exact;/)
  assert.match(rendered.document, /<html lang="en" class="report-theme-dark-page">/)
  assert.match(rendered.css, /html\.report-theme-dark-page,[\s\S]*body\.report-theme-dark-page \{[\s\S]*background: var\(--bg, #060D18\) !important;/)
  assert.match(rendered.css, /body\.report-theme-dark-page::before \{[\s\S]*position: fixed;[\s\S]*background: var\(--bg-subtle, #071228\) !important;/)
  assert.match(rendered.css, /\.report-cover \{[\s\S]*padding: 10mm 0 12mm;/)
  assert.match(rendered.css, /\.report-body \{[\s\S]*padding: 10mm 0 0;/)
  assert.match(rendered.css, /\.report-layout \{[\s\S]*display: block;[\s\S]*padding: 0;/)
  assert.match(rendered.css, /\.report-sidebar \{[\s\S]*display: none !important;/)
  assert.match(rendered.css, /\.report-chart,[\s\S]*\.report-callout,[\s\S]*break-inside: avoid;/)
  assert.match(rendered.css, /\.report-body ol,[\s\S]*\.report-body ul,[\s\S]*break-inside: avoid;/)
  assert.match(rendered.css, /\.report-page-break \{[\s\S]*break-before: page;/)
  assert.match(rendered.css, /\.report-page-break \{[\s\S]*break-after: auto;/)
})

test('renders report legal notice from brand config', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Legal report
reportTheme: dark
---

# Summary
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions: {
        brand: {
          ...definitions.brand,
          report: {
            legal: {
              title: 'Legal notice',
              text: ['Confidential business report.', 'Do not distribute without approval.'],
            },
          },
        },
      },
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<footer class="report-legal" aria-label="Legal notice">/)
  assert.match(rendered.document, /<div class="report-legal-title">Legal notice<\/div>/)
  assert.match(rendered.document, /<p>Confidential business report\.<\/p>/)
  assert.match(rendered.document, /<p>Do not distribute without approval\.<\/p>/)
  assert.match(rendered.css, /\.report-legal \{[\s\S]*border-top:/)
  assert.match(rendered.css, /@media print \{[\s\S]*\.report-legal \{[\s\S]*break-inside: avoid;/)
})

test('report vendor injection strips CDN tags and is idempotent', async () => {
  const resourcesDir = path.join(tmpDir, 'vendor-injection')
  const vendorDir = path.join(resourcesDir, 'vendor')
  await mkdir(vendorDir, { recursive: true })
  await writeFile(path.join(vendorDir, 'd3.min.js'), 'window.d3 = {};')
  await writeFile(path.join(vendorDir, 'plot.min.js'), 'window.Plot = {};')
  await writeFile(path.join(vendorDir, 'chart.min.js'), 'window.Chart = function Chart() {};')

  const html = `<!doctype html><html><head>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script src="https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6"></script>
<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
</head><body><h1>Report</h1></body></html>`
  const first = await injectReportVendorScripts(html, resourcesDir)
  const second = await injectReportVendorScripts(first.html, resourcesDir)

  assert.equal(first.injected.length, 3)
  assert.equal(second.injected.length, 0)
  assert.doesNotMatch(first.html, /cdn\.jsdelivr\.net/)
  assert.equal([...first.html.matchAll(/data-marp-report-vendor=/g)].length, 3)
  assert.equal([...second.html.matchAll(/data-marp-report-vendor=/g)].length, 3)
  assert.ok(first.html.indexOf('data-marp-report-vendor="d3"') < first.html.indexOf('data-marp-report-vendor="observable-plot"'))
  assert.ok(first.html.indexOf('data-marp-report-vendor="observable-plot"') < first.html.indexOf('data-marp-report-vendor="chart.js"'))
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

test('report command accepts pdf option and fails clearly when browser is missing', async () => {
  const reportDir = path.join(tmpDir, 'cli-pdf-missing-browser')
  await mkdir(reportDir, { recursive: true })
  const inputPath = path.join(reportDir, 'report.md')
  const pdfPath = path.join(reportDir, 'report.pdf')
  await writeFile(inputPath, '# PDF report\n\nBody copy.')

  await assert.rejects(
    execFileAsync(
      process.execPath,
      [
        'src/cli.js',
        'report',
        inputPath,
        '--pdf',
        pdfPath,
        '--resources',
        'resources',
      ],
      {
        env: {
          ...process.env,
          MARP_REPORT_BROWSER_PATH: path.join(reportDir, 'missing-browser.exe'),
        },
      },
    ),
    /MARP_REPORT_BROWSER_PATH points to a browser that could not be found/,
  )
})

test('renders report metadata from frontmatter into cover chrome', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Metadata Report
subtitle: Operating pack
reportDate: 2026-06-11
preparedFor: Customer Operations
preparedBy: Analytics
classification: Confidential
version: v1.2
---

## Summary

Metadata should be renderer-owned.
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<dl class="report-cover-meta">/)
  assert.match(rendered.document, /<dt>Report date<\/dt>\s*<dd>2026-06-11<\/dd>/)
  assert.match(rendered.document, /<dt>Prepared for<\/dt>\s*<dd>Customer Operations<\/dd>/)
  assert.match(rendered.document, /<dt>Prepared by<\/dt>\s*<dd>Analytics<\/dd>/)
  assert.match(rendered.document, /<dt>Classification<\/dt>\s*<dd>Confidential<\/dd>/)
  assert.match(rendered.document, /<dt>Version<\/dt>\s*<dd>v1\.2<\/dd>/)
})

test('expands report page breaks into print-aware separators', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Page Break Report

## Summary

First page.

<report-page-break label="Appendix"></report-page-break>

## Appendix

Second page.
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-page-break/i)
  assert.match(rendered.document, /<div class="report-page-break" role="separator" aria-label="Appendix"><span>Appendix<\/span><\/div>/)
  assert.match(rendered.document, /page-break-before:\s*always/)
  assert.match(rendered.document, /page-break-after:\s*auto/)
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
  assert.match(rendered.document, /animation:\s*false/)
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

test('expands report funnel chart components into D3 funnel initializers', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Funnel chart report

<report-chart
  type="funnel"
  title="Completion funnel"
  value-suffix=" cases"
  labels="Opened,Started,Completed"
  values="52000,38000,27500"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-funnel"/)
  assert.match(rendered.document, /<div id="report-chart-1" class="report-chart-plot" role="img"/)
  assert.match(rendered.document, /const segmentHeight = Math\.max/)
  assert.match(rendered.document, /class", "report-funnel-segment"/)
  assert.match(rendered.document, /\.append\("text"\)/)
  assert.match(rendered.document, /class", "report-funnel-print-label"/)
  assert.match(rendered.css, /\.report-funnel-print-label \{[\s\S]*display: none;/)
  assert.match(rendered.css, /@media print \{[\s\S]*\.report-funnel-print-label \{[\s\S]*display: block;/)
  assert.match(rendered.document, /cell\.on\("mousemove"/)
  assert.match(rendered.document, /tooltip\.className = "report-chart-floating-tooltip"/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report sankey charts into D3 flow diagrams', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Sankey chart report

<report-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  value-suffix=" cases"
  links="Opened>Started:44120,Started>Completed:37980,Started>Exception:3751,Exception>Recovered:2160"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-sankey"/)
  assert.match(rendered.document, /<div id="report-chart-1" class="report-chart-plot" role="img"/)
  assert.match(rendered.document, /"source":"Opened","target":"Started","value":44120/)
  assert.match(rendered.document, /class", "report-sankey-link"/)
  assert.match(rendered.document, /class", "report-sankey-node"/)
  assert.match(rendered.document, /const linkScale = innerHeight \/ maxColumnWeight/)
  assert.match(
    rendered.document,
    /const maxLinkWidth = Math\.max\(2, Math\.min\(link\.source\.height, link\.target\.height, innerHeight \* 0\.24\)\)/,
  )
  assert.doesNotMatch(rendered.document, /Math\.max\(1, innerHeight \/ maxColumnWeight\)/)
  assert.match(rendered.document, /tooltip\.textContent = link\.source\.label \+ " -> " \+ link\.target\.label/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report grouped bar charts into Chart.js multi-dataset bars', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Grouped bar report

<report-chart
  type="grouped-bar"
  title="Weekly journey outcomes"
  value-suffix=" cases"
  labels="Week 1,Week 2,Week 3"
  series="Opened|Completed"
  values="17240|15020;18990|16880;20530|18030"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-grouped-bar"/)
  assert.match(rendered.document, /<canvas id="report-chart-1"/)
  assert.match(rendered.document, /new Chart\(canvas, /)
  assert.match(rendered.document, /type:\s*"bar"/)
  assert.match(rendered.document, /"label":"Opened","data":\[17240,18990,20530\]/)
  assert.match(rendered.document, /"label":"Completed","data":\[15020,16880,18030\]/)
  assert.match(rendered.document, /legend:\s*\{\s*display:\s*true,\s*position:\s*"top"/)
  assert.match(rendered.document, /stacked:\s*false/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report stacked bar charts into Chart.js stacked bars', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Stacked bar report

<report-chart
  type="stacked-bar"
  title="Weekly case composition"
  value-suffix=" cases"
  labels="Week 1,Week 2,Week 3"
  series="J0107|J0106|Other"
  values="12000|3200|2040;13000|3480|2510;14200|3770|2560"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-stacked-bar"/)
  assert.match(rendered.document, /"label":"J0107","data":\[12000,13000,14200\]/)
  assert.match(rendered.document, /"label":"J0106","data":\[3200,3480,3770\]/)
  assert.match(rendered.document, /stacked:\s*true/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report heatmap charts into D3 heatmap initializers', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Heatmap report

<report-chart
  type="heatmap"
  title="Journey weekday intensity"
  value-suffix=" cases"
  x-labels="Mon|Tue|Wed"
  y-labels="J0107|J0106"
  values="120|180|210;40|55|70"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-heatmap"/)
  assert.match(rendered.document, /<div id="report-chart-1" class="report-chart-plot" role="img"/)
  assert.match(rendered.document, /d3\.scaleSequential\(\)/)
  assert.match(rendered.document, /class", "report-heatmap-cell"/)
  assert.match(rendered.document, /tooltip\.textContent = cell\.y \+ " · " \+ cell\.x/)
  assert.match(rendered.document, /const valueSuffix = " cases"/)
})

test('expands report waterfall charts into Chart.js floating bars', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Waterfall chart report

<report-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  value-suffix=" cases"
  labels="Opening,New cases,Exceptions,Recoveries"
  values="52000,6400,-1200,3750"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-waterfall"/)
  assert.match(rendered.document, /new Chart\(canvas, /)
  assert.match(rendered.document, /data:\s*\[\[0,52000\],\[52000,58400\],\[57200,58400\],\[57200,60950\]\]/)
  assert.match(rendered.document, /const deltas = \[52000,6400,-1200,3750\]/)
  assert.match(rendered.document, /return "Change: " \+ formatTooltipValue\(delta\)/)
  assert.match(rendered.document, /borderSkipped:\s*false/)
})

test('expands report bullet charts into Chart.js target comparisons', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Bullet chart report

<report-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  value-suffix="%"
  labels="Digital,Assisted,Exceptions"
  values="92,84,63"
  targets="95,90,75"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-bullet"/)
  assert.match(rendered.document, /indexAxis:\s*"y"/)
  assert.match(rendered.document, /const targets = \[95,90,75\]/)
  assert.match(rendered.document, /id: "reportBulletTargetMarkers"/)
  assert.match(rendered.document, /xScale\.getPixelForValue\(target\)/)
  assert.match(rendered.document, /"Actual: " \+ formatTooltipValue\(context\.parsed\.x\)/)
  assert.match(rendered.document, /"Target: " \+ formatTooltipValue\(target\)/)
})

test('expands report scatter charts into Chart.js numeric point plots', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Scatter chart report

<report-chart
  type="scatter"
  title="Effort vs completion"
  series="Journeys"
  x-label="Touches"
  y-label="Completion"
  value-suffix="%"
  points="2:93,4:88,7:72,9:61"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-scatter"/)
  assert.match(rendered.document, /type: "scatter"/)
  assert.match(rendered.document, /data: \[\{"x":2,"y":93\},\{"x":4,"y":88\},\{"x":7,"y":72\},\{"x":9,"y":61\}\]/)
  assert.match(rendered.document, /text: "Touches"/)
  assert.match(rendered.document, /text: "Completion"/)
  assert.match(rendered.document, /"X: " \+ formatAxisValue\(context\.parsed\.x\) \+ ", Y: " \+ formatTooltipValue\(context\.parsed\.y\)/)
})

test('expands report bubble charts into Chart.js radius point plots', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Bubble chart report

<report-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-label="Touches"
  y-label="Completion"
  value-suffix="%"
  points="2:93:10,4:88:14,7:72:18,9:61:9"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-bubble"/)
  assert.match(rendered.document, /type: "bubble"/)
  assert.match(
    rendered.document,
    /data: \[\{"x":2,"y":93,"r":10\},\{"x":4,"y":88,"r":14\},\{"x":7,"y":72,"r":18\},\{"x":9,"y":61,"r":9\}\]/,
  )
  assert.match(rendered.document, /", Size: " \+ formatAxisValue\(raw\.r\)/)
})

test('expands report histogram charts into computed Chart.js bins', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Histogram chart report

<report-chart
  type="histogram"
  title="Cycle time distribution"
  series="Journeys"
  x-label="Days"
  y-label="Journeys"
  bins="3"
  values="10,12,13,18,22,25"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-histogram"/)
  assert.match(rendered.document, /const ranges = \["10-15","15-20","20-25"\]/)
  assert.match(rendered.document, /const counts = \[3,1,2\]/)
  assert.match(rendered.document, /label: "Journeys"/)
  assert.match(rendered.document, /title: \(items\) =>/)
  assert.match(rendered.document, /"Range: " \+ ranges\[index\]/)
  assert.match(rendered.document, /"Count: " \+ valueFormatter\.format\(context\.parsed\.y\)/)
})

test('expands report boxplot charts into Chart.js quartile plots', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Boxplot chart report

<report-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-label="Days"
  labels="Digital,Assisted"
  values="5|7|9|11|13;8|10|12|14|16"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-boxplot"/)
  assert.match(rendered.document, /id: "reportBoxplotWhiskers"/)
  assert.match(rendered.document, /"q1":7/)
  assert.match(rendered.document, /"median":9/)
  assert.match(rendered.document, /"q3":11/)
  assert.match(rendered.document, /data: stats\.map\(\(item\) => \[item\.q1, item\.q3\]\)/)
  assert.match(rendered.document, /"Median: " \+ formatTooltipValue\(item\.median\)/)
  assert.match(rendered.document, /borderSkipped:\s*false/)
})

test('expands report pareto charts into sorted bars and cumulative line', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Pareto chart report

<report-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  value-suffix=" cases"
  labels="Identity,Address,Income,Consent"
  values="42,18,27,13"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /class="report-chart report-chart-pareto"/)
  assert.match(rendered.document, /labels: \["Identity","Income","Address","Consent"\]/)
  assert.match(rendered.document, /data: \[42,27,18,13\]/)
  assert.match(rendered.document, /data: \[42,69,87,100\]/)
  assert.match(rendered.document, /yAxisID: "y",\s*order: 2/)
  assert.match(rendered.document, /yAxisID: "yPercent"/)
  assert.match(rendered.document, /yAxisID: "yPercent",\s*order: 1/)
  assert.match(rendered.document, /"Cumulative: " \+ valueFormatter\.format\(context\.parsed\.y\) \+ "%"/)
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

test('dark report inline code uses dark-theme contrast tokens', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Dark Code Report
reportTheme: dark
---

## Summary

The field \`CaseProductName\` should not render as a light chip on dark reports.
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<main class="deck-report report-theme-dark">/)
  assert.match(rendered.document, /<code>CaseProductName<\/code>/)
  assert.match(rendered.css, /\.deck-report\.report-theme-dark \.report-body code \{[\s\S]*background: rgba\(89, 214, 253, 0\.12\);[\s\S]*color: var\(--white\);/)
  assert.match(rendered.css, /\.deck-report\.report-theme-dark \.report-body pre code \{[\s\S]*background: transparent;[\s\S]*color: inherit;/)
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
  rows="J0107|52,208|67.1|Active;J0116|3,751|4.8|Review;J0999|0|0|Draft"
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
  assert.match(rendered.document, /<th scope="col" class="report-data-table-heading report-data-table-align-left">Journey<\/th>/)
  assert.match(
    rendered.document,
    /<td class="report-data-table-cell report-data-table-cell-number report-data-table-align-right">52,208<\/td>/,
  )
  assert.match(
    rendered.document,
    /<td class="report-data-table-cell report-data-table-cell-percent report-data-table-align-right">67\.1%<\/td>/,
  )
  assert.match(rendered.document, /<span class="report-badge report-badge-green">Active<\/span>/)
  assert.match(rendered.document, /<span class="report-badge report-badge-orange">Review<\/span>/)
  assert.match(rendered.document, /<span class="report-badge report-badge-muted">Draft<\/span>/)
  assert.match(
    rendered.document,
    /<span class="report-data-table-caption">Registered and unregistered journey volume\.<\/span>/,
  )
  assert.match(rendered.document, /<span class="report-data-table-source">Source: April journey export<\/span>/)
})

test('expands report datasets into referenced tables and charts', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Dataset report

<report-dataset
  id="journey-volume"
  columns="Journey|Cases|Target"
  rows="Digital|52208|55000;Assisted|11119|12000;Exceptions|3751|2500"
></report-dataset>

<report-data-table
  title="Dataset-backed table"
  data-ref="journey-volume"
  types="text|number|number"
  align="left|right|right"
></report-data-table>

<report-chart
  type="bar"
  title="Dataset-backed chart"
  series="Cases"
  data-ref="journey-volume"
  label-column="Journey"
  value-column="Cases"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-dataset/i)
  assert.doesNotMatch(rendered.document, /<report-data-table/i)
  assert.doesNotMatch(rendered.document, /<report-chart/i)
  assert.match(rendered.document, /<th scope="col" class="report-data-table-heading report-data-table-align-left">Journey<\/th>/)
  assert.match(rendered.document, /<td class="report-data-table-cell report-data-table-cell-number report-data-table-align-right">52,208<\/td>/)
  assert.match(rendered.document, /labels: \["Digital","Assisted","Exceptions"\]/)
  assert.match(rendered.document, /data: \[52208,11119,3751\]/)
})

test('expands report datasets into referenced grouped and stacked charts', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Multi-series dataset report

<report-dataset
  id="journey-outcomes"
  columns="Journey|Opened|Completed|Exceptions|Status"
  rows="Digital|44120|37980|1240|Active;Assisted|11850|9220|710|Watch"
></report-dataset>

<report-chart
  type="grouped-bar"
  title="Dataset grouped outcomes"
  data-ref="journey-outcomes"
  label-column="Journey"
  series-columns="Opened|Completed|Exceptions"
></report-chart>

<report-chart
  type="stacked-bar"
  title="Dataset stacked outcomes"
  data-ref="journey-outcomes"
  label-column="Journey"
></report-chart>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-dataset/i)
  assert.match(rendered.document, /class="report-chart report-chart-grouped-bar"/)
  assert.match(rendered.document, /class="report-chart report-chart-stacked-bar"/)
  assert.match(rendered.document, /labels: \["Digital","Assisted"\]/)
  assert.match(rendered.document, /"label":"Opened","data":\[44120,11850\]/)
  assert.match(rendered.document, /"label":"Completed","data":\[37980,9220\]/)
  assert.match(rendered.document, /"label":"Exceptions","data":\[1240,710\]/)
  assert.doesNotMatch(rendered.document, /"label":"Status"/)
})

test('expands enhanced report data table options', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Enhanced data table report

<report-data-table
  title="Operational summary"
  compact="true"
  columns="Journey|Cases|Share|Status"
  types="text|number|percent|status"
  align="left|right|right|center"
  rows="J0107|52208|67.1|Active;J0116|3751|4.8|Review"
  totals="Total|55959|71.9|"
  highlights="2:orange;1.3:green"
></report-data-table>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<figure class="report-data-table report-data-table-compact">/)
  assert.match(rendered.document, /<th scope="col" class="report-data-table-heading report-data-table-align-center">Status<\/th>/)
  assert.match(rendered.document, /<tr class="report-data-table-row report-data-table-highlight-orange">/)
  assert.match(
    rendered.document,
    /<td class="report-data-table-cell report-data-table-cell-percent report-data-table-align-right report-data-table-highlight-green">67\.1%<\/td>/,
  )
  assert.match(rendered.document, /<tfoot>/)
  assert.match(rendered.document, /<tr class="report-data-table-row report-data-table-total-row">/)
  assert.match(
    rendered.document,
    /<td class="report-data-table-cell report-data-table-cell-number report-data-table-align-right report-data-table-total-cell">55,959<\/td>/,
  )
  assert.doesNotMatch(rendered.document, /report-badge-muted"><\/span>/)
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
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A|B" rows="A|1" align="left"></report-data-table>', options),
    /report-data-table align\/columns length mismatch/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A|B" rows="A|1" totals="Total"></report-data-table>', options),
    /report-data-table totals row has 1 cell\(s\), but 2 column\(s\) were declared/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A" rows="A" totals="true"></report-data-table>', options),
    /report-data-table totals must be a pipe-separated footer row, not a boolean/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A" rows="A" highlights="2:orange"></report-data-table>', options),
    /report-data-table highlights must target an existing 1-based row number/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table columns="A" rows="A" highlights="1:purple"></report-data-table>', options),
    /report-data-table highlight "purple" is not available/,
  )
  assert.throws(
    () => renderReportHtml('<report-data-table data-ref="missing"></report-data-table>', options),
    /report-data-table data-ref "missing" does not match a report-dataset id/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="A|B" rows="A|1"></report-dataset><report-data-table data-ref="d" columns="A" rows="A"></report-data-table>',
        options,
      ),
    /report-data-table data-ref cannot be combined with columns or rows/,
  )
  assert.throws(
    () => renderReportHtml('<report-dataset columns="A|B" rows="A|1"></report-dataset>', options),
    /report-dataset requires an id attribute/,
  )
  assert.throws(
    () => renderReportHtml('<report-dataset id="bad id" columns="A|B" rows="A|1"></report-dataset>', options),
    /report-dataset id may contain only letters, numbers, hyphens, and underscores/,
  )
  assert.throws(
    () => renderReportHtml('<report-dataset id="d" rows="A|1"></report-dataset>', options),
    /report-dataset "d" requires columns or headers/,
  )
  assert.throws(
    () => renderReportHtml('<report-dataset id="d" columns="A|B"></report-dataset>', options),
    /report-dataset "d" requires at least one row/,
  )
  assert.throws(
    () => renderReportHtml('<report-dataset id="d" columns="A|B" rows="A|1|extra"></report-dataset>', options),
    /report-dataset "d" row 1 has 3 cell\(s\), but 2 column\(s\) were declared/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="A" rows="One"></report-dataset><report-dataset id="d" columns="A" rows="Two"></report-dataset>',
        options,
      ),
    /Duplicate report-dataset id "d"/,
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
  assert.throws(
    () =>
      renderReportHtml(
        '<report-key-values items="Scope: TD (T011)|Platform: v2|Period: 1 Jan - 11 Jun 2026"></report-key-values>',
        options,
      ),
    /report-key-values items must separate items with semicolons, not pipes/,
  )
  assert.doesNotThrow(() =>
    renderReportHtml(
      '<report-key-values items="Scope: TD (T011); Platform: v2; Period: 1 Jan - 11 Jun 2026"></report-key-values>',
      options,
    ),
  )
})

test('expands report insights into structured narrative blocks', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Insight report

<report-insight
  variant="warning"
  title="Journey concentration"
  finding="One journey dominates April volume."
  evidence="J0107 accounts for 67.1% of cases."
  impact="Monitoring thresholds should be calibrated around this journey."
  action="Tune operational alerts before the next monthly run."
></report-insight>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-insight/i)
  assert.match(rendered.document, /<article class="report-insight report-insight-warning" role="note">/)
  assert.match(rendered.document, /<div class="report-insight-title">Journey concentration<\/div>/)
  assert.match(rendered.document, /<dt>Finding<\/dt>/)
  assert.match(rendered.document, /<dd>One journey dominates April volume\.<\/dd>/)
  assert.match(rendered.document, /<dt>Action<\/dt>/)
  assert.match(rendered.document, /Tune operational alerts before the next monthly run/)
})

test('report insights fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-insight></report-insight>', options),
    /report-insight requires title, finding\/body text, evidence, impact, or action/,
  )
  assert.throws(
    () => renderReportHtml('<report-insight variant="purple" title="Finding"></report-insight>', options),
    /report-insight variant "purple" is not available/,
  )
})

test('expands report recommendations into owner action blocks', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Recommendation report

<report-recommendation
  title="Validate J0116"
  owner="Operations"
  priority="High"
  due="Week 1"
  status="Needs bespoke status"
>Confirm whether J0116 is a new journey or a data quality issue.</report-recommendation>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-recommendation/i)
  assert.match(rendered.document, /<article class="report-recommendation">/)
  assert.match(rendered.document, /<div class="report-recommendation-title">Validate J0116<\/div>/)
  assert.match(rendered.document, /<div class="report-recommendation-body">Confirm whether J0116 is a new journey or a data quality issue\.<\/div>/)
  assert.match(rendered.document, /<span class="report-recommendation-meta-item">Owner: Operations<\/span>/)
  assert.match(rendered.document, /<span class="report-recommendation-priority report-recommendation-priority-high">High<\/span>/)
  assert.match(rendered.document, /<span class="report-recommendation-meta-item">Due: Week 1<\/span>/)
  assert.match(rendered.document, /<span class="report-badge report-badge-muted">Needs bespoke status<\/span>/)
})

test('report recommendations fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-recommendation></report-recommendation>', options),
    /report-recommendation requires title or body text/,
  )
  assert.throws(
    () => renderReportHtml('<report-recommendation title="Action" priority="urgent"></report-recommendation>', options),
    /report-recommendation priority "urgent" is not available/,
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

test('expands report source lists and inline cites', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Sources report

Completion rates use the April extract <report-cite source="journey-export"></report-cite>.

<report-source-list title="Sources">
  <report-source id="journey-export" title="Journey export" publisher="Operations" date="April 2026" url="https://example.test/export">Completed journey records excluding test data.</report-source>
  <report-source id="quality-review" title="Quality review" publisher="Data team">Manual exception review.</report-source>
</report-source-list>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-source-list/i)
  assert.doesNotMatch(rendered.document, /<report-source\b/i)
  assert.doesNotMatch(rendered.document, /<report-cite/i)
  assert.match(rendered.document, /<a class="report-cite" href="#report-source-journey-export" aria-label="Source 1: Journey export">\[1\]<\/a>/)
  assert.match(rendered.document, /<section class="report-source-list" aria-label="Sources">/)
  assert.match(rendered.document, /<li id="report-source-journey-export">/)
  assert.match(rendered.document, /<span class="report-source-list-number">\[1\]<\/span>/)
  assert.match(rendered.document, /<span class="report-source-list-name">Journey export<\/span>/)
  assert.match(rendered.document, /<a href="https:\/\/example\.test\/export">https:\/\/example\.test\/export<\/a>/)
  assert.match(rendered.document, /<li id="report-source-quality-review">/)
})

test('report source lists render metadata-only sources without escaped closing tags', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Sources report

<report-source-list title="Sources">
  <report-source id="vdwh-case" title="VizWarehouse V_DWH_Case" date="2026-06-12"></report-source>
</report-source-list>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<li id="report-source-vdwh-case">[\s\S]*<span>2026-06-12<\/span>[\s\S]*<\/li>/)
  assert.doesNotMatch(rendered.document, /&lt;\/(?:div|li)&gt;/)
})

test('report source lists and cites fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-source id="orphan" title="Orphan"></report-source>', options),
    /<report-source> must be placed directly inside <report-source-list>/,
  )
  assert.throws(
    () => renderReportHtml('<report-source-list></report-source-list>', options),
    /report-source-list must include at least one report-source/,
  )
  assert.throws(
    () => renderReportHtml('<report-source-list><report-source title="Missing id"></report-source></report-source-list>', options),
    /report-source requires an id attribute/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-source-list><report-source id="vdwh-case" title="VizWarehouse V_DWH_Case" description="Primary case fact view." date="2026-06-12"></report-source></report-source-list>',
        options,
      ),
    /Unsupported <report-source> attribute "description". Use note="\.\.\." instead/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-source-list><report-source id="vdwh-case" title="VizWarehouse V_DWH_Case" summary="Primary case fact view."></report-source></report-source-list>',
        options,
      ),
    /Unsupported <report-source> attribute "summary"/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-metric-grid><report-metric value="77,951" label="Total cases" context="YTD"></report-metric></report-metric-grid>',
        options,
      ),
    /Unsupported <report-metric> attribute "context"/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-source-list><report-source id="a" title="A"></report-source><report-source id="a" title="B"></report-source></report-source-list>',
        options,
      ),
    /Duplicate report-source id "a"/,
  )
  assert.throws(
    () => renderReportHtml('<report-cite source="missing"></report-cite>', options),
    /report-cite source "missing" was not declared in a report-source-list/,
  )
})

test('expands report card grids into accent card layouts', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Card grid report

<report-card-grid title="Actions" columns="2">
  <report-card title="Monitor" accent="blue">Track the dominant journey daily.</report-card>
  <report-card title="Review" accent="orange">Validate the unregistered journey.</report-card>
</report-card-grid>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-card/i)
  assert.match(rendered.document, /<section class="report-card-grid report-card-grid-2"/)
  assert.match(rendered.document, /<div class="report-card-grid-title">Actions<\/div>/)
  assert.match(rendered.document, /class="report-card-grid-card report-card-grid-card-blue"/)
  assert.match(rendered.document, /<div class="report-card-grid-card-title">Monitor<\/div>/)
  assert.match(rendered.document, /<div class="report-card-grid-card-body">Track the dominant journey daily\.<\/div>/)
  assert.match(rendered.document, /class="report-card-grid-card report-card-grid-card-orange"/)
})

test('report card grids fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-card title="Outside"></report-card>', options),
    /<report-card> must be placed directly inside <report-card-grid>/,
  )
  assert.throws(
    () => renderReportHtml('<report-card-grid columns="5"><report-card title="A"></report-card></report-card-grid>', options),
    /report-card-grid columns must be between 1 and 4/,
  )
  assert.throws(
    () => renderReportHtml('<report-card-grid></report-card-grid>', options),
    /report-card-grid must include at least one report-card/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-card-grid><report-card accent="magenta">Body</report-card></report-card-grid>',
        options,
      ),
    /Unsupported report-card accent "magenta"/,
  )
  assert.throws(
    () => renderReportHtml('<report-card-grid><report-card></report-card></report-card-grid>', options),
    /report-card at position 1 must include title and\/or body text/,
  )
})

test('expands report timelines into ordered event layouts', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Timeline report

<report-timeline title="Delivery path">
  <report-event date="Week 1" title="Confirm" status="complete">Validate the journey mapping.</report-event>
  <report-event date="Week 2" title="Monitor" status="watch">Add trend monitoring.</report-event>
</report-timeline>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-timeline/i)
  assert.doesNotMatch(rendered.document, /<report-event/i)
  assert.match(rendered.document, /<section class="report-timeline"/)
  assert.match(rendered.document, /<div class="report-timeline-title">Delivery path<\/div>/)
  assert.match(rendered.document, /class="report-timeline-event report-timeline-event-green"/)
  assert.match(rendered.document, /class="report-timeline-event report-timeline-event-orange"/)
  assert.match(rendered.document, /<span class="report-timeline-date">Week 1<\/span>/)
  assert.match(rendered.document, /<div class="report-timeline-event-title">Confirm<\/div>/)
  assert.match(rendered.document, /<div class="report-timeline-event-body">Validate the journey mapping\.<\/div>/)
})

test('report timelines fail clearly when malformed', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const options = {
    resourcesDir: path.resolve('resources'),
    definitions,
    inlineAssets: true,
  }

  assert.throws(
    () => renderReportHtml('<report-event title="Outside"></report-event>', options),
    /<report-event> must be placed directly inside <report-timeline>/,
  )
  assert.throws(
    () => renderReportHtml('<report-timeline></report-timeline>', options),
    /report-timeline must include at least one report-event/,
  )
  assert.throws(
    () => renderReportHtml('<report-timeline><report-event status="purple">Body</report-event></report-timeline>', options),
    /Unsupported report-event status "purple"/,
  )
  assert.throws(
    () => renderReportHtml('<report-timeline><report-event></report-event></report-timeline>', options),
    /report-event at position 1 must include date, title, and\/or body text/,
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

test('expands self-closing report component tags before HTML parsing', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `# Self-closing report

<report-metric-grid>
  <report-metric value="77,951" label="Total cases" />
  <report-metric value="94.3%" label="Completion rate" />
</report-metric-grid>

<report-chart type="bar" labels="A" values="1" />

<report-data-table
  title="Status Breakdown"
  compact="true"
  columns="Status|Cases|Notes"
  types="text|number|text"
  rows="Created|11919|New case initiated;eDisclosure|2834|Disclosure step reached"
  caption="First-time status reached."
/>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.doesNotMatch(rendered.document, /<report-(metric|chart|data-table)/i)
  assert.equal((rendered.document.match(/class="report-metric(?:\s|")/g) || []).length, 2)
  assert.match(rendered.document, /<div class="report-metric-value">77,951<\/div>/)
  assert.match(rendered.document, /<div class="report-metric-value">94\.3%<\/div>/)
  assert.match(rendered.document, /class="report-chart report-chart-bar"/)
  assert.match(
    rendered.document,
    /<figure class="report-data-table report-data-table-compact">[\s\S]*<div class="report-data-table-scroll">[\s\S]*<table>[\s\S]*Created[\s\S]*<\/table>[\s\S]*<\/figure>/,
  )
  assert.doesNotMatch(rendered.document, /&lt;\/table&gt;/)
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

test('report badge colors use dark-theme contrast tokens', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const rendered = renderReportHtml(
    `---
title: Badge contrast
reportTheme: dark
---

# Badge report

<report-badge status="active">Active</report-badge>
<report-badge status="pending">Pending</report-badge>
`,
    {
      resourcesDir: path.resolve('resources'),
      definitions,
      inlineAssets: true,
    },
  )

  assert.match(rendered.document, /<main class="deck-report report-theme-dark">/)
  assert.match(rendered.css, /\.deck-report\.report-theme-dark \.report-badge-green \{[\s\S]*--report-badge-text: #DFFBEA;/)
  assert.match(rendered.css, /\.deck-report\.report-theme-dark \.report-badge-muted \{[\s\S]*--report-badge-text: #D7E2F2;/)
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
  assert.throws(
    () => renderReportHtml('<report-badge status="muted">fraudCreditCard</report-badge>', options),
    /report-badge label "fraudCreditCard" looks like a product, field, or identifier/,
  )
  assert.throws(
    () => renderReportHtml('<report-badge status="blue" label="case-product-name"></report-badge>', options),
    /Use plain Markdown text for named products and identifiers/,
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
    () => renderReportHtml('<report-chart type="bar" data-ref="missing"></report-chart>', options),
    /report-chart data-ref "missing" does not match a report-dataset id/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Value" rows="A|1"></report-dataset><report-chart type="treemap" data-ref="d"></report-chart>',
        options,
      ),
    /report-chart data-ref currently supports bar, line, doughnut, waterfall, bullet, pareto, grouped-bar, and stacked-bar charts/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Value" rows="A|1"></report-dataset><report-chart type="bar" data-ref="d" label-column="Missing"></report-chart>',
        options,
      ),
    /report dataset "d" does not include label-column "Missing"/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Value" rows="A|nope"></report-dataset><report-chart type="bar" data-ref="d"></report-chart>',
        options,
      ),
    /report-chart values must all be numeric/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Value" rows="A|10"></report-dataset><report-chart type="bullet" data-ref="d"></report-chart>',
        options,
      ),
    /report-chart data-ref requires target-column/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Opened|Closed" rows="A|10|9"></report-dataset><report-chart type="grouped-bar" data-ref="d" value-column="Opened"></report-chart>',
        options,
      ),
    /report-chart data-ref grouped-bar and stacked-bar charts use series-columns, not value-column/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Opened" rows="A|10"></report-dataset><report-chart type="grouped-bar" data-ref="d" series-columns="Opened|Opened"></report-chart>',
        options,
      ),
    /report-chart data-ref series-columns must not repeat dataset columns/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Opened" rows="A|10"></report-dataset><report-chart type="grouped-bar" data-ref="d" series-columns="Missing"></report-chart>',
        options,
      ),
    /report dataset "d" does not include series-columns "Missing"/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Opened|Closed" rows="A|10|9"></report-dataset><report-chart type="grouped-bar" data-ref="d" series-columns="Opened|Closed" series-labels="Only one"></report-chart>',
        options,
      ),
    /report-chart data-ref series-labels must match the number of selected series-columns/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Status" rows="A|Active"></report-dataset><report-chart type="stacked-bar" data-ref="d"></report-chart>',
        options,
      ),
    /report-chart data-ref grouped-bar and stacked-bar charts require series-columns or at least one numeric dataset column/,
  )
  assert.throws(
    () =>
      renderReportHtml(
        '<report-dataset id="d" columns="Label|Opened" rows="A|not-a-number"></report-dataset><report-chart type="stacked-bar" data-ref="d" series-columns="Opened"></report-chart>',
        options,
      ),
    /report-chart data-ref row 1 column "Opened" values must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="radar" labels="A" values="10"></report-chart>', options),
    /report-chart type "radar" is not available\. Supported types: bar, line, doughnut, area, treemap, funnel, grouped-bar, stacked-bar, heatmap, waterfall, bullet, scatter, bubble, histogram, boxplot, pareto, sankey\. Ask the skill maker to add missing chart types/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="sankey"></report-chart>', options),
    /report-chart type="sankey" requires non-empty links/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="sankey" links="A-B:10"></report-chart>', options),
    /report-chart type="sankey" link 1 must use source>target:value syntax/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="sankey" links="A>B:nope"></report-chart>', options),
    /report-chart type="sankey" link 1 value must be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="sankey" links="A>B:0"></report-chart>', options),
    /report-chart type="sankey" link 1 value must be greater than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="sankey" links="A>A:10"></report-chart>', options),
    /report-chart type="sankey" link 1 cannot connect a node to itself/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="sankey" links="A>B:10,B>A:5"></report-chart>', options),
    /report-chart type="sankey" links must not contain cycles/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="pareto" labels="A,B" values="10,-1"></report-chart>', options),
    /report-chart pareto values must be zero or positive/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="pareto" labels="A,B" values="0,0"></report-chart>', options),
    /report-chart pareto values must sum to more than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="boxplot" values="1|2|3|4|5"></report-chart>', options),
    /report-chart type="boxplot" requires non-empty labels/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="boxplot" labels="A"></report-chart>', options),
    /report-chart type="boxplot" requires matrix values in values, matrix, or series-values/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="boxplot" labels="A,B" values="1|2|3|4|5"></report-chart>', options),
    /report-chart type="boxplot" labels\/rows length mismatch/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="boxplot" labels="A" values="1|2|3|4"></report-chart>', options),
    /report-chart type="boxplot" row 1 must include at least 5 numeric observations/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="boxplot" labels="A" values="1|2|3|4|nope"></report-chart>', options),
    /report-chart type="boxplot" row 1 values must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="histogram"></report-chart>', options),
    /report-chart type="histogram" requires non-empty numeric values/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="histogram" values="1,nope"></report-chart>', options),
    /report-chart type="histogram" values must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="histogram" values="1,2" bins="1"></report-chart>', options),
    /report-chart type="histogram" bins must be an integer between 2 and 30/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bubble"></report-chart>', options),
    /report-chart type="bubble" requires non-empty points as numeric x:y:r triples/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bubble" points="1:2"></report-chart>', options),
    /report-chart type="bubble" points must be numeric x:y:r triples/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bubble" points="1:2:0"></report-chart>', options),
    /report-chart type="bubble" point radii must be greater than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="scatter"></report-chart>', options),
    /report-chart type="scatter" requires non-empty points or numeric labels\/values attributes/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="scatter" points="A:10"></report-chart>', options),
    /report-chart type="scatter" points must be numeric x:y pairs/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bullet" labels="A" values="10"></report-chart>', options),
    /report-chart type="bullet" requires targets or target-values/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bullet" labels="A,B" values="10,20" targets="12"></report-chart>', options),
    /report-chart type="bullet" labels\/targets length mismatch/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bullet" labels="A" values="10" targets="nope"></report-chart>', options),
    /report-chart type="bullet" targets must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="bullet" labels="A" values="-1" targets="10"></report-chart>', options),
    /report-chart type="bullet" values and targets must be zero or positive/,
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
    () => renderReportHtml('<report-chart type="funnel" labels="A,B" values="10,-1"></report-chart>', options),
    /report-chart funnel values must be zero or positive/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="funnel" labels="A,B" values="0,0"></report-chart>', options),
    /report-chart funnel values must sum to more than zero/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="grouped-bar" labels="A" values="10"></report-chart>', options),
    /report-chart type="grouped-bar" requires series names in the series attribute/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-chart type="grouped-bar" labels="A,B" series="X|Y" values="10|20"></report-chart>', options),
    /report-chart type="grouped-bar" labels\/rows length mismatch/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-chart type="grouped-bar" labels="A" series="X|Y" values="10|20|30"></report-chart>', options),
    /report-chart type="grouped-bar" row 1 has 3 value\(s\), but 2 series were declared/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-chart type="grouped-bar" labels="A" series="X|Y" values="10|nope"></report-chart>', options),
    /report-chart type="grouped-bar" row 1 values must all be numeric/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="stacked-bar" labels="A" values="10"></report-chart>', options),
    /report-chart type="stacked-bar" requires series names in the series attribute/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="heatmap" y-labels="A" values="10"></report-chart>', options),
    /report-chart type="heatmap" requires x-labels or columns/,
  )
  assert.throws(
    () => renderReportHtml('<report-chart type="heatmap" x-labels="A" values="10"></report-chart>', options),
    /report-chart type="heatmap" requires y-labels or rows/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-chart type="heatmap" x-labels="A|B" y-labels="R1|R2" values="1|2"></report-chart>', options),
    /report-chart type="heatmap" y-labels\/rows length mismatch/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-chart type="heatmap" x-labels="A|B" y-labels="R1" values="1|2|3"></report-chart>', options),
    /report-chart type="heatmap" row 1 has 3 value\(s\), but 2 x-label\(s\) were declared/,
  )
  assert.throws(
    () =>
      renderReportHtml('<report-chart type="heatmap" x-labels="A|B" y-labels="R1" values="1|nope"></report-chart>', options),
    /report-chart type="heatmap" row 1 values must all be numeric/,
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
