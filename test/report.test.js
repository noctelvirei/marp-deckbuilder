import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { loadDefinitions } from '../src/brand.js'
import { renderReportHtml } from '../src/report.js'

const tmpDir = path.resolve('.tmp', 'report-tests', String(process.pid))

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

test('reports compile renderer-owned rich tags without author CSS or JS', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const source = `---
title: Renderer Owned Report
subtitle: Markdown and rich renderer components
surface: dark
---

# Executive summary

The report is a single scrolling HTML page. The source stays Markdown-first.

## Highlights

<deck-rich-stats eyebrow="Report metric rings" title="Operational|Highlights">
  <deck-rich-metric value="99.9" unit="%" label="Availability" progress="99.9" color="blue"></deck-rich-metric>
  <deck-rich-metric value="127" unit="k" label="Daily Users" progress="85" color="cyan"></deck-rich-metric>
  <deck-rich-metric value="2.8" unit="s" label="Avg Completion" progress="70" color="green"></deck-rich-metric>
</deck-rich-stats>

## Volume

<deck-rich-bars title="Journey|Volume" labels="Q1,Q2,Q3,Q4">
  <deck-rich-series name="Platform" values="65,72,68,85" color="blue"></deck-rich-series>
  <deck-rich-series name="Mobile" values="40,55,62,74" color="cyan"></deck-rich-series>
</deck-rich-bars>

## Mix

<deck-rich-donut title="Channel|Mix" total="486" total-label="Sessions">
  <deck-rich-segment label="Digital" value="45" color="blue"></deck-rich-segment>
  <deck-rich-segment label="Mobile" value="25" color="cyan"></deck-rich-segment>
  <deck-rich-segment label="Assisted" value="20" color="orange"></deck-rich-segment>
  <deck-rich-segment label="Partner" value="10" color="green"></deck-rich-segment>
</deck-rich-donut>

## Actions

1. Keep the report as Markdown.
2. Use renderer-owned rich tags for visual effects.
3. Print the generated HTML to PDF.
`

  const rendered = renderReportHtml(source, {
    resourcesDir: 'resources',
    definitions,
    inlineAssets: true,
  })

  assert.doesNotMatch(source, /<style[\s>]/i)
  assert.doesNotMatch(source, /<script[\s>]/i)
  assert.match(rendered.document, /deck-report report-dark/)
  assert.match(rendered.document, /class="report-toc"/)
  assert.match(rendered.document, /class="report-rich-block report-rich-stats"/)
  assert.match(rendered.document, /data-deck-rich-stats/)
  assert.match(rendered.document, /data-deck-rich-bars/)
  assert.match(rendered.document, /data-deck-rich-donut/)
  assert.match(rendered.document, /<script data-deckbuilder-rich-html>/)
  assert.match(rendered.document, /deck-rich-printing/)
  assert.doesNotMatch(rendered.document, /<deck-rich-stats\b/)
})

test('report mode rejects slide deck components', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))

  assert.throws(
    () =>
      renderReportHtml(
        `<deck-card-grid>
  <deck-card title="Slide card"><p>This is a slide component.</p></deck-card>
</deck-card-grid>`,
        { resourcesDir: 'resources', definitions },
      ),
    /Report mode supports Markdown plus renderer-owned rich HTML effect tags only/,
  )
})
