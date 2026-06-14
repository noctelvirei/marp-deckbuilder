import assert from 'node:assert/strict'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import JSZip from 'jszip'

import { loadDefinitions } from '../src/brand.js'
import { parseDeckMarkdown } from '../src/markdown.js'
import { renderDeckHtml } from '../src/render.js'
import { resolveSurfaceResourceFile } from '../src/resources.js'
import { writePptx } from '../src/pptx.js'

const tmpDir = path.resolve('.tmp', 'tests')

function withoutBrandLogo(definitions) {
  const { logo, ...assets } = definitions.brand.assets || {}
  return {
    ...definitions,
    brand: {
      ...definitions.brand,
      assets,
    },
  }
}

test('renders Marp Deckbuilder HTML', async () => {
  const source = await readFile(new URL('../samples/demo.md', import.meta.url), 'utf8')
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /id=":\$p"/)
  assert.match(rendered.document, /bespoke-marp-osc/)
  assert.match(rendered.document, /bespoke-marp-parent/)
  assert.match(rendered.document, /data-bespoke-marp-osc="overview"/)
  assert.match(rendered.document, /data-bespoke-marp-osc="presenter"/)
  assert.match(rendered.document, /bespoke\.js\.LICENSE/)
  assert.match(rendered.document, /Marp Deckbuilder Demo/)
  assert.match(rendered.document, /@page/)
  assert.match(rendered.document, /<style data-deckbuilder-theme>/)
})

test('writes editable fallback PPTX', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const source = await readFile(new URL('../samples/demo.md', import.meta.url), 'utf8')
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const out = path.join(tmpDir, 'fallback.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })

  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('writes renderer-owned SVG components as embedded PPTX media', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const source = `# Cover

---

# Operating model

<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
></deck-impact-radar>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const out = path.join(tmpDir, 'impact-radar-media.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })

  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/'))
  assert.ok(mediaNames.some((name) => name.endsWith('.svg')))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')
  const visualXml = pictureXmlContaining(slideXml, 'Scenario operating model')
  const extent = pictureExtent(visualXml)
  assert.ok(extent.cx > 700 * 12700)
  assert.ok(extent.cy > 250 * 12700)
})

test('writes configured brand backgrounds and logos into PPTX media', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3sqqwAAAABJRU5ErkJggg==',
    'base64',
  )
  await writeFile(path.join(tmpDir, 'resources', 'title-bg.png'), tinyPng)
  await writeFile(path.join(tmpDir, 'resources', 'content-bg.png'), tinyPng)
  await writeFile(
    path.join(tmpDir, 'resources', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#0f82f5"/></svg>',
  )

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    assets: {
      backgrounds: {
        cover: 'resource:title-bg.png',
        dark: 'resource:content-bg.png',
      },
      logo: {
        default: 'resource:logo.svg',
      },
    },
    layouts: {
      ...definitions.brand.layouts,
      logo: { x: 828, y: 21, w: 98, h: 24 },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

<deck-slide surface="dark" />

# Content

Body copy`)
  const out = path.join(tmpDir, 'brand-assets.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/'))
  assert.ok(mediaNames.length >= 3)
  assert.ok(mediaNames.some((name) => name.endsWith('.svg')))
  const slide2Xml = await archive.file('ppt/slides/slide2.xml').async('string')
  assert.ok((slide2Xml.match(/<p:pic>/g) || []).length >= 2)
})

test('writes branded chart area fills into PPTX charts', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    colors: {
      ...definitions.brand.colors,
      cardLight: '0D1D36',
      border: '1E3A5F',
      body: 'C8D8F0',
    },
    layouts: {
      ...definitions.brand.layouts,
      chart: {
        ...definitions.brand.layouts.chart,
        chartAreaFill: 'cardLight',
        plotAreaFill: 'cardLight',
        dataLabel: { font: 'regular', size: 9, color: 'body' },
      },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

<!-- _class: dark -->

# Chart

<deck-chart title="Volume" labels="A,B" values="10,20"></deck-chart>`)
  const out = path.join(tmpDir, 'chart-fill.pptx')

  await writePptx({ deck, outputPath: out, brand })

  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /0D1D36/)
  assert.match(chartXml, /C8D8F0/)
})

test('renders grouped bar deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Quarterly comparison

<deck-chart
  type="grouped-bar"
  title="Quarterly conversion"
  series="Current, Target"
  labels="Q1, Q2, Q3"
  values="42, 58, 63; 50, 60, 70"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-grouped-bar"/)
  assert.match(rendered.document, /class="deck-chart-legend"/)
  assert.match(rendered.document, /deck-chart-grouped-bar-row/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-track/)

  const out = path.join(tmpDir, 'grouped-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /Current/)
  assert.match(chartXml, /Target/)
  assert.match(chartXml, /Q1/)
  assert.match(chartXml, /Q3/)
})

test('renders line deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Completion rate trend

<deck-chart
  type="line"
  title="Weekly completion rate"
  series="Completion"
  labels="W1, W2, W3, W4"
  values="68, 72, 74, 79"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-line"/)
  assert.match(rendered.document, /class="deck-chart-line-svg"/)
  assert.match(rendered.document, /class="deck-chart-line-path"/)
  assert.match(rendered.document, /class="deck-chart-line-path"[^>]*fill="none"[^>]*stroke="#0f82f5"/)
  assert.match(rendered.document, /class="deck-chart-line-point"[^>]*fill="#0f82f5"[^>]*stroke="#ffffff"/)
  assert.match(rendered.document, /text-anchor="end">W4<\/text>/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-line-grid/)

  const out = path.join(tmpDir, 'line-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /lineChart/)
  assert.match(chartXml, /Completion/)
  assert.match(chartXml, /W4/)
})

test('renders area deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Adoption trend

<deck-chart
  type="area"
  title="Monthly adoption"
  series="Users"
  points="Jan:18, Feb:24, Mar:31, Apr:44"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-area"/)
  assert.match(rendered.document, /class="deck-chart-area-svg"/)
  assert.match(rendered.document, /class="deck-chart-area-fill"/)
  assert.match(rendered.document, /class="deck-chart-area-path"/)
  assert.match(rendered.document, /class="deck-chart-area-fill"[^>]*fill="rgba\(15, 130, 245, \.22\)"/)
  assert.match(rendered.document, /class="deck-chart-area-path"[^>]*fill="none"[^>]*stroke="#0f82f5"/)
  assert.match(rendered.document, /text-anchor="end">Apr<\/text>/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-area-grid/)

  const out = path.join(tmpDir, 'area-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /areaChart/)
  assert.match(chartXml, /Users/)
  assert.match(chartXml, /Apr/)
})

test('scales positive area charts around the data range in HTML', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Sessions

<deck-chart
  type="area"
  title="Cumulative digital sessions"
  series="Sessions"
  points="Jan:21400, Feb:20100, Mar:22300, Apr:23100, May:24800, Jun:26720"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const ticks = [...rendered.document.matchAll(/class="deck-chart-area-tick"[^>]*>([^<]+)<\/text>/g)]
    .map((match) => match[1])

  assert.equal(ticks.includes('0'), false)
  assert.ok(ticks.some((tick) => tick.startsWith('19,')))
  assert.match(rendered.document, /text-anchor="end">Jun<\/text>/)
})

test('renders waterfall deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Monthly movement

<deck-chart
  type="waterfall"
  title="Monthly movement"
  series="Cases"
  labels="Opening, New cases, Exceptions, Recoveries"
  values="52000, 6400, -1200, 3750"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-waterfall"/)
  assert.match(rendered.document, /class="deck-chart-waterfall-svg"/)
  assert.match(rendered.document, /deck-waterfall-bar-positive/)
  assert.match(rendered.document, /deck-waterfall-bar-negative/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-waterfall/)

  const out = path.join(tmpDir, 'waterfall-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/'))
  assert.ok(mediaNames.some((name) => name.endsWith('.svg')))
  const svgNames = mediaNames.filter((name) => name.endsWith('.svg'))
  const svgTexts = await Promise.all(svgNames.map((name) => archive.file(name).async('string')))
  assert.ok(svgTexts.some((svgText) => /deck-chart-waterfall-svg/.test(svgText)))
})

test('renders bullet deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# SLA attainment

<deck-chart
  type="bullet"
  title="SLA attainment"
  series="Actual"
  labels="Digital, Assisted, Exceptions"
  values="92, 84, 63"
  targets="95, 90, 75"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-bullet"/)
  assert.match(rendered.document, /class="deck-chart-bullet-svg"/)
  assert.match(rendered.document, /deck-bullet-bar/)
  assert.match(rendered.document, /deck-bullet-target/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-bullet/)

  const out = path.join(tmpDir, 'bullet-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/') && name.endsWith('.svg'))
  const svgTexts = await Promise.all(mediaNames.map((name) => archive.file(name).async('string')))
  assert.ok(svgTexts.some((svgText) => /deck-chart-bullet-svg/.test(svgText)))
})

test('renders bubble deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Impact by effort

<deck-chart
  type="bubble"
  title="Impact by effort"
  series="Journeys"
  x-axis="Touches"
  y-axis="Completion"
  points="2:93:10,4:88:14,7:72:18,9:61:9"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-bubble"/)
  assert.match(rendered.document, /class="deck-chart-bubble-svg"/)
  assert.match(rendered.document, /deck-chart-bubble-point/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-bubble-point text/)

  const out = path.join(tmpDir, 'bubble-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /bubbleChart/)
  assert.match(chartXml, /Journeys/)
})

test('renders histogram deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Response time distribution

<deck-chart
  type="histogram"
  title="Response time distribution"
  series="Cases"
  values="1.2,1.8,2.1,2.4,2.8,3.3,3.7,4.1,4.6,5.2,5.8,6.3"
  bins="6"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-histogram"/)
  assert.match(rendered.document, /class="deck-chart-histogram-svg"/)
  assert.match(rendered.document, /deck-histogram-bar/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-histogram/)

  const out = path.join(tmpDir, 'histogram-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/') && name.endsWith('.svg'))
  const svgTexts = await Promise.all(mediaNames.map((name) => archive.file(name).async('string')))
  assert.ok(svgTexts.some((svgText) => /deck-chart-histogram-svg/.test(svgText)))
})

test('renders boxplot deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Cycle time spread

<deck-chart
  type="boxplot"
  title="Cycle time spread"
  series="Days"
  y-axis="Days"
  labels="Digital, Assisted, Exceptions"
  values="5|6|7|7|8|10|12;8|10|11|12|14|15|18;14|16|18|21|23|24|28"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-boxplot"/)
  assert.match(rendered.document, /class="deck-chart-boxplot-svg"/)
  assert.match(rendered.document, /deck-boxplot-median/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-boxplot/)

  const out = path.join(tmpDir, 'boxplot-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/') && name.endsWith('.svg'))
  const svgTexts = await Promise.all(mediaNames.map((name) => archive.file(name).async('string')))
  assert.ok(svgTexts.some((svgText) => /deck-chart-boxplot-svg/.test(svgText)))
})

test('renders pareto deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Exception drivers

<deck-chart
  type="pareto"
  title="Exception drivers"
  series="Cases"
  labels="Identity, Address, Income, Consent"
  values="42, 18, 27, 13"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-pareto"/)
  assert.match(rendered.document, /class="deck-chart-pareto-svg"/)
  assert.match(rendered.document, /deck-pareto-line/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-pareto/)

  const out = path.join(tmpDir, 'pareto-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/') && name.endsWith('.svg'))
  const svgTexts = await Promise.all(mediaNames.map((name) => archive.file(name).async('string')))
  assert.ok(svgTexts.some((svgText) => /deck-chart-pareto-svg/.test(svgText)))
})

test('renders sankey deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Journey flow

<deck-chart
  type="sankey"
  title="Journey flow"
  series="Cases"
  links="Opened>Started:4400, Started>Completed:3800, Started>Exception:380, Exception>Recovered:220"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-sankey"/)
  assert.match(rendered.document, /class="deck-chart-sankey-svg"/)
  assert.match(rendered.document, /deck-sankey-link/)
  assert.match(rendered.document, /deck-sankey-node/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-sankey/)

  const out = path.join(tmpDir, 'sankey-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/') && name.endsWith('.svg'))
  const svgTexts = await Promise.all(mediaNames.map((name) => archive.file(name).async('string')))
  assert.ok(svgTexts.some((svgText) => /deck-chart-sankey-svg/.test(svgText)))
})

test('renders stacked bar deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Quarterly mix

<deck-chart
  type="stacked-bar"
  title="Quarterly volume mix"
  series="New, Returning, Expansion"
  labels="Q1, Q2, Q3"
  values="20, 24, 30; 12, 15, 18; 4, 6, 9"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-stacked-bar"/)
  assert.match(rendered.document, /class="deck-chart-stacked-row"/)
  assert.match(rendered.document, /deck-chart-stacked-segment/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-stacked-track/)

  const out = path.join(tmpDir, 'stacked-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /New/)
  assert.match(chartXml, /Returning/)
  assert.match(chartXml, /Expansion/)
  assert.match(chartXml, /Q3/)
})

test('renders doughnut deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Portfolio mix

<deck-chart
  type="doughnut"
  title="Portfolio mix"
  series="Cases"
  labels="Digital, Branch, Contact centre"
  values="52, 31, 17"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-doughnut"/)
  assert.match(rendered.document, /class="deck-chart-doughnut-ring"/)
  assert.match(rendered.document, /conic-gradient/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-doughnut-ring::after/)

  const out = path.join(tmpDir, 'doughnut-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /doughnutChart/)
  assert.match(chartXml, /Digital/)
  assert.match(chartXml, /Contact centre/)
})

test('renders scatter deck charts in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Impact effort

<deck-chart
  type="scatter"
  title="Impact versus effort"
  series="Initiatives"
  x-axis="Effort"
  y-axis="Impact"
  points="2|8|Automate; 5|6|Consolidate; 8|3|Defer"
></deck-chart>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-chart deck-chart-scatter"/)
  assert.match(rendered.document, /class="deck-chart-scatter-svg"/)
  assert.match(rendered.document, /Automate/)
  assert.doesNotMatch(rendered.document, /<deck-chart/i)
  assert.match(rendered.css, /section\.dark \.deck-chart-scatter-grid/)

  const out = path.join(tmpDir, 'scatter-chart.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const archive = await JSZip.loadAsync(await readFile(out))
  const chartNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/charts/chart'))
  assert.ok(chartNames.length >= 1)
  const chartXml = await archive.file(chartNames[0]).async('string')
  assert.match(chartXml, /scatterChart/)
  const slideXml = (
    await Promise.all(
      Object.keys(archive.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .map((name) => archive.file(name).async('string')),
    )
  ).join('\n')
  assert.match(slideXml, /Effort/)
  assert.match(slideXml, /Impact/)
})

test('renders deck-signal-bars in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
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
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-signal-bars/)
  assert.match(rendered.document, /class="deck-signal-row"/)
  assert.doesNotMatch(rendered.document, /<deck-signal-bars/i)
  assert.match(rendered.css, /--deck-signal-accent: #0f82f5/)
  assert.match(rendered.css, /section\.light \.deck-signal-bars/)
  assert.match(rendered.css, /section\.light \.deck-signal-summary p/)

  const out = path.join(tmpDir, 'signal-bars.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-signal-board in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Executive signal

<deck-signal-board
  title="Executive signal"
  body="The renderer output can carry dashboard, callout, and narrative reporting patterns."
  tags="Revenue protection, Journey speed, Audit confidence"
  chart-title="Signal strength"
  labels="Speed, Control, Effort"
  values="82, 74, 63"
></deck-signal-board>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-signal-board/)
  assert.match(rendered.document, /class="deck-signal-board-tag"/)
  assert.match(rendered.document, /Signal strength/)
  assert.doesNotMatch(rendered.document, /<deck-signal-board/i)
  assert.match(rendered.css, /deck-signal-board-panel/)
  assert.match(rendered.css, /deck-signal-board-panel :is\(h2, marp-h2\)/)
  assert.match(rendered.css, /deck-signal-fill-in/)
  assert.match(
    rendered.css,
    /section\.light \.deck-signal-board-panel,[^{]+section\.light \.deck-signal-board-chart\{background:#FDFDFD;border-color:#DEDEDE;color:#444444\}/,
  )
  assert.match(
    rendered.css,
    /section\.dark \.deck-signal-board-panel,[^{]+section\.dark \.deck-signal-board-chart\{background:#[0-9A-F]{6};border-color:#[0-9A-F]{6};color:#[0-9A-F]{6}\}/,
  )
  assert.match(
    rendered.css,
    /section\.light \.deck-signal-board-panel p,[^{]+section\.light \.deck-signal-board \.deck-signal-label\{color:#444444\}/,
  )

  const out = path.join(tmpDir, 'signal-board.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-funnel in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Conversion funnel

<deck-funnel
  title="Completion funnel"
  labels="Invited, Started, Completed"
  values="8420, 6568, 5136"
></deck-funnel>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-funnel/)
  assert.match(rendered.document, /class="deck-funnel-svg"/)
  assert.match(rendered.document, /class="deck-funnel-segment"/)
  assert.doesNotMatch(rendered.document, /<deck-funnel/i)
  assert.match(rendered.css, /section\.light \.deck-funnel/)

  const out = path.join(tmpDir, 'funnel.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)

  const archive = await JSZip.loadAsync(await readFile(out))
  const svgNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/') && name.endsWith('.svg'))
  const svgTexts = await Promise.all(svgNames.map((name) => archive.file(name).async('string')))
  const funnelSvg = svgTexts.find((svgText) => /deck-funnel-svg/.test(svgText))
  assert.ok(funnelSvg)
  assert.doesNotMatch(funnelSvg, /var\(--deck-funnel/)
  assert.match(funnelSvg, /fill:\s*#0f82f5/i)
  assert.match(funnelSvg, /deck-funnel-stage-label/)
  assert.match(funnelSvg, />Invited<\/text>/)
  assert.match(funnelSvg, /fill:\s*#ffffff/i)
})

test('renders deck-metric-trend in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Operating signal

<deck-metric-trend
  metric="92%"
  metric-label="completed within SLA"
  title="Weekly trend"
  labels="W1, W2, W3, W4, W5"
  values="70, 78, 76, 86, 92"
  unit="%"
></deck-metric-trend>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-metric-trend/)
  assert.match(rendered.document, /class="deck-metric-trend-line"/)
  assert.match(rendered.document, /class="deck-metric-trend-line"[^>]*fill="none"[^>]*stroke="#0f82f5"/)
  assert.match(rendered.document, /class="deck-metric-trend-dot"[^>]*fill="#0f82f5"[^>]*stroke="#ffffff"/)
  assert.match(rendered.document, /text-anchor="end">W5<\/text>/)
  assert.match(rendered.document, />92%<\/text>/)
  assert.doesNotMatch(rendered.document, /<deck-metric-trend/i)

  const out = path.join(tmpDir, 'metric-trend.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-heatmap in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Activity heatmap

<deck-heatmap
  title="Activity by hour"
  x-labels="08, 09, 10"
  y-labels="Mon, Tue"
  values="42, 58, 76; 35, 61, 88"
  unit=" cases"
  caption="Darker cells represent higher activity."
></deck-heatmap>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-heatmap/)
  assert.match(rendered.document, /--deck-heatmap-columns:3/)
  assert.match(rendered.document, /title="Tue 10: 88 cases"/)
  assert.doesNotMatch(rendered.document, /<deck-heatmap/i)

  const out = path.join(tmpDir, 'heatmap.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-impact-radar in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Operating profile

<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
  radar-values="84, 76, 68, 91"
  caption="Renderer-owned SVG in HTML and static SVG in PPTX."
></deck-impact-radar>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-impact-radar/)
  assert.match(rendered.document, /class="deck-impact-radar-svg/)
  assert.match(rendered.document, /deck-impact-radar-bar-fill/)
  assert.match(rendered.document, /deck-impact-radar-shape-animated/)
  assert.match(rendered.document, /Operating balance/)
  assert.doesNotMatch(rendered.document, /<deck-impact-radar/i)
  assert.match(rendered.css, /deck-impact-radar-fill-0/)

  const out = path.join(tmpDir, 'impact-radar.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-treemap in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Portfolio treemap

<deck-treemap
  title="Portfolio mix"
  labels="Journey A, Journey B, Journey C, Journey D"
  values="5200, 1100, 860, 380"
  unit=" cases"
  caption="Tile area is proportional to case volume."
></deck-treemap>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-treemap/)
  assert.match(rendered.document, /class="deck-treemap-svg"/)
  assert.match(rendered.document, /style="fill:var\(--deck-treemap-fill-0, #0f82f5\)"/)
  assert.match(rendered.document, /fill="#ffffff">Journey A<\/text>/)
  assert.doesNotMatch(rendered.document, /<deck-treemap/i)

  const out = path.join(tmpDir, 'treemap.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-journey-map in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Customer journey

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start the secure journey."></deck-journey-step>
  <deck-journey-step label="02" title="Capture" body="Collect evidence and consent."></deck-journey-step>
  <deck-journey-step label="03" title="Review" body="Check completeness."></deck-journey-step>
</deck-journey-map>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-journey-map/)
  assert.match(rendered.document, /class="deck-journey-step/)
  assert.doesNotMatch(rendered.document, /<deck-journey-map/i)

  const out = path.join(tmpDir, 'journey-map.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('renders deck-journey-path in HTML and PPTX outputs', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
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
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-journey-path/)
  assert.match(rendered.document, /class="deck-journey-path-svg/)
  assert.match(rendered.document, /viewBox="0 0 680 360" overflow="visible"/)
  assert.match(rendered.document, /journey-path-line/)
  assert.match(rendered.document, /@keyframes journey-path-draw/)
  assert.match(rendered.document, /x="24" y="308" text-anchor="start">Invite<\/text>/)
  assert.match(rendered.document, /x="656" y="55" text-anchor="end">Complete<\/text>/)
  assert.doesNotMatch(rendered.document, /<animate\b/i)
  assert.doesNotMatch(rendered.document, /<deck-journey-path/i)
  assert.match(rendered.css, /deck-journey-path-accent/)

  const out = path.join(tmpDir, 'journey-path.pptx')
  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })
  const info = await stat(out)
  assert.equal(info.isFile(), true)
  assert.ok(info.size > 1000)
})

test('normalizes brand colour tokens before writing PPTX XML', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const { lightBlue, yellow, ...colorsWithoutSemanticAliases } = definitions.brand.colors
  const brand = {
    ...definitions.brand,
    colors: colorsWithoutSemanticAliases,
    layouts: {
      ...definitions.brand.layouts,
      header: {
        ...definitions.brand.layouts.header,
        title: {
          ...definitions.brand.layouts.header.title,
          color: 'lightBlue',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

# Content title

Body copy

---

<deck-exec-metrics surface="dark">
  <deck-exec-metric value="2" label="Yellow accent" accent="yellow"></deck-exec-metric>
</deck-exec-metrics>`)
  const out = path.join(tmpDir, 'normalised-colours.pptx')
  const warnings = []
  const originalWarn = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    await writePptx({ deck, outputPath: out, brand })
  } finally {
    console.warn = originalWarn
  }

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')
  const execSlideXml = await archive.file('ppt/slides/slide3.xml').async('string')

  assert.deepEqual(
    warnings.filter((warning) => warning.includes('not a valid scheme color')),
    [],
  )
  assert.match(slideXml, /59D6FD/)
  assert.match(execSlideXml, /FBC546/)
})

test('writes markdown subheadings and bullets into native PPTX content slides', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Cover

---

# Practical Takeaways

## What the group landed on

- Claude can be safe and useful at work.
- MCPs are the bridge between sandboxed AI and useful internal data.
- Skills are repeatable workflows, not just prompts with a fancy name.`)
  const out = path.join(tmpDir, 'bullets.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')

  assert.match(slideXml, /What the group landed on/)
  assert.match(slideXml, /Claude can be safe and useful at work/)
  assert.match(slideXml, /MCPs are the bridge/)
  assert.match(slideXml, /Skills are repeatable workflows/)
})

test('rejects executive title copy that cannot fit the executive title layout', () => {
  assert.throws(
    () => parseDeckMarkdown(`# Cover

---

<deck-exec-title
  title="Real-time completion, built for regulated enterprise."
  subtitle="Lightico orchestrates consent, identity, documents, and signature into a single in-conversation experience across voice, digital, or branch."
></deck-exec-title>`),
    /Keep <deck-exec-title>; shorten title/,
  )
})

test('rejects executive row copy that would overlap inside fixed row cards', () => {
  assert.throws(
    () => parseDeckMarkdown(`# Cover

---

# Roadmap

<deck-exec-rows surface="light">
  <deck-exec-row label="01" kicker="Capture" title="Collect everything in one session" body="Identity, consent, documents, and payment captured in a single in-session flow with no portal redirect and no follow-up call."></deck-exec-row>
</deck-exec-rows>`),
    /Keep <deck-exec-rows>; shorten deck-exec-row\[1\]/,
  )
})

test('inlines extensionless deck-card icons into HTML', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'icons'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'icons', 'face-scan.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  )

  const definitions = withoutBrandLogo(await loadDefinitions(new URL('../resources/definitions', import.meta.url)))
  const deck = parseDeckMarkdown(`# Cover

---

# Cards

<deck-card-grid columns="3">
  <deck-card title="Face scan" icon="face-scan"><p>Capture identity.</p></deck-card>
</deck-card-grid>`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /deck-card-icon/)
  assert.match(rendered.document, /data:image\/svg\+xml;base64,/)
  assert.doesNotMatch(rendered.document, /resource:icons\/face-scan/)
})

test('throws when a referenced deck-card icon is missing', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })

  const definitions = withoutBrandLogo(await loadDefinitions(new URL('../resources/definitions', import.meta.url)))
  const deck = parseDeckMarkdown(`# Cover

---

# Cards

<deck-card-grid columns="3">
  <deck-card title="Missing" icon="not-there"><p>Should fail loudly.</p></deck-card>
</deck-card-grid>`)

  assert.throws(
    () =>
      renderDeckHtml(deck, {
        resourcesDir: path.join(tmpDir, 'resources'),
        definitions,
        inlineAssets: true,
      }),
    /Resource not found: resource:icons\/not-there/,
  )
})

test('writes deck-card icons into PPTX media', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'icons'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'icons', 'face-scan.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
  )

  const definitions = withoutBrandLogo(await loadDefinitions(new URL('../resources/definitions', import.meta.url)))
  const deck = parseDeckMarkdown(`# Cover

---

# Cards

<deck-card-grid columns="3">
  <deck-card title="Face scan" icon="face-scan"><p>Capture identity.</p></deck-card>
</deck-card-grid>`)
  const out = path.join(tmpDir, 'card-icon.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/'))
  assert.ok(mediaNames.some((name) => name.endsWith('.svg')))
})

test('spaces wrapped divider titles above subtitles in native PPTX', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`# Cover

---

<deck-divider
  act="THE ASK"
  title="Find One Workflow Worth Automating"
  subtitle="Not the biggest thing. The annoying thing you do often enough to resent.">
</deck-divider>`)
  const out = path.join(tmpDir, 'wrapped-divider.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')

  assert.match(slideXml, /Find One Workflow Worth Automating/)
  assert.match(slideXml, /Not the biggest thing/)
  const titleShape = shapeXmlContaining(slideXml, 'Find One Workflow Worth Automating')
  const subtitleShape = shapeXmlContaining(slideXml, 'Not the biggest thing')
  const titleOffset = shapeOffset(titleShape)
  const titleExtent = shapeExtent(titleShape)
  const subtitleOffset = shapeOffset(subtitleShape)
  assert.ok(subtitleOffset.y >= titleOffset.y + titleExtent.cy + 16 * 12700)
  assert.doesNotMatch(titleShape, /<a:spcPts/)
})

test('renders renderer-owned SVG components as live HTML SVG', async () => {
  const source = `# Cover

---

# Journey signal

<deck-journey-path
  metric="42%"
  metric-label="require attention"
  labels="Invite, Evidence, Approval, Complete"
  notes="fast start, largest rework loop, decision queue, customer notified"
  hotspots="Evidence, Approval"
></deck-journey-path>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-journey-path-svg"/)
  assert.match(rendered.document, /class="journey-path-line"/)
  assert.match(rendered.document, /@keyframes journey-path-draw/)
  assert.doesNotMatch(rendered.document, /<deck-journey-path/i)
})

test('rejects raw SVG blocks in deck Markdown', async () => {
  const source = `# Cover

---

# Raw SVG

<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Raw SVG">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#0F82F5"/>
      <stop offset="1" stop-color="#59D6FD"/>
    </linearGradient>
  </defs>

  <rect x="10" y="10" width="80" height="40" fill="url(#g)"/>
  <text x="50" y="35" text-anchor="middle">Claude</text>
</svg>`
  assert.throws(
    () => parseDeckMarkdown(source),
    /Raw <svg> is not supported in deck Markdown.*ask the skill maker/,
  )
})

test('HTML component chrome constrains structured components and swimlanes inside the slide', async () => {
  const source = `# Cover

---

# Architecture

<deck-impact-radar
  title="Scenario operating model"
  bar-title="Workstream impact"
  radar-title="Operating balance"
  labels="Speed, Control, Effort, Visibility"
  values="84, 76, 68, 91"
></deck-impact-radar>

<deck-swimlane>
  <deck-lane title="Initiate" color="blue">
    <deck-step title="Trigger">Agent or digital channel triggers a session.</deck-step>
  </deck-lane>
  <deck-lane title="Engage" color="cyan">
    <deck-step title="Connect">Customer receives a branded secure link.</deck-step>
  </deck-lane>
  <deck-lane title="Validate" color="purple">
    <deck-step title="Check">Rules engine checks completeness before review.</deck-step>
  </deck-lane>
</deck-swimlane>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="deck-swimlane deck-swimlane-3"/)
  assert.match(rendered.document, /class="deck-lane-steps deck-lane-steps-1"/)
  assert.match(rendered.document, /class="deck-impact-radar/)
  assert.match(rendered.document, /class="deck-impact-radar-svg/)
  assert.match(rendered.document, /<style data-deckbuilder-theme>[\s\S]*section\s*\{[\s\S]*position:\s*relative/)
  assert.match(rendered.document, /section img\s*\{[^}]*max-width:\s*100%/)
  assert.match(rendered.document, /\.deck-swimlane\s*\{[^}]*max-height:/)
  assert.match(rendered.document, /\.deck-lane-steps\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit/)
  assert.match(rendered.document, /section > p > img:not\(\.deck-brand-logo\)/)
  assert.match(rendered.document, /-webkit-line-clamp:\s*2/)
})

test('resolves resource URLs inside brand theme CSS', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })
  await writeFile(path.join(tmpDir, 'resources', 'cover-bg.png'), 'fake image')

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...withoutBrandLogo(baseDefinitions),
    themeCss: `${baseDefinitions.themeCss}
section.cover { background-image: url(resource:cover-bg.png); }`,
  }
  const deck = parseDeckMarkdown('# Cover')
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
  })

  assert.match(rendered.document, /background-image:url\(file:\/\//)
  assert.doesNotMatch(rendered.document, /resource:cover-bg\.png/)
})

test('can rewrite brand resources as portable HTML assets', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'images'), { recursive: true })
  await writeFile(path.join(tmpDir, 'resources', 'images', 'cover-bg.png'), 'fake image')

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...withoutBrandLogo(baseDefinitions),
    themeCss: `${baseDefinitions.themeCss}
section.cover { background-image: url(resource:images/cover-bg.png); }`,
  }
  const deck = parseDeckMarkdown('# Cover')
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    collectResources: true,
    assetUrlPrefix: 'resources',
  })

  assert.match(rendered.document, /background-image:url\(resources\/images\/cover-bg\.png\)/)
  assert.deepEqual(rendered.assets, [
    {
      relativePath: 'images/cover-bg.png',
      sourcePath: path.join(tmpDir, 'resources', 'images', 'cover-bg.png'),
    },
  ])
  assert.doesNotMatch(rendered.document, /resource:images/)
})

test('can inline brand resources as self-contained HTML assets', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#0f82f5"/></svg>',
  )

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...withoutBrandLogo(baseDefinitions),
    themeCss: `${baseDefinitions.themeCss}
section.cover { background-image: url(resource:logo.svg); }`,
  }
  const deck = parseDeckMarkdown('# Cover')
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /background-image:url\(data:image\/svg\+xml;base64,/)
  assert.deepEqual(rendered.assets, [])
  assert.doesNotMatch(rendered.document, /resource:logo\.svg/)
  assert.doesNotMatch(rendered.document, /file:\/\//)
})

test('applies brand background assets to self-contained HTML slides', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3sqqwAAAABJRU5ErkJggg==',
    'base64',
  )
  await writeFile(path.join(tmpDir, 'resources', 'title-bg.png'), tinyPng)
  await writeFile(path.join(tmpDir, 'resources', 'content-bg.png'), tinyPng)

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        backgrounds: {
          cover: 'resource:title-bg.png',
          divider: 'resource:title-bg.png',
          close: 'resource:title-bg.png',
          content: 'resource:content-bg.png',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

<deck-divider title="Section" subtitle="Transition"></deck-divider>

---

# Content

Body copy

---

<deck-close title="Thanks"></deck-close>`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /section\.cover/)
  assert.match(rendered.document, /deck-divider-slide/)
  assert.match(rendered.document, /deck-close-slide/)
  assert.match(rendered.document, /background-image:url\("data:image\/png;base64,/)
  assert.doesNotMatch(rendered.document, /resource:title-bg\.png/)
  assert.doesNotMatch(rendered.document, /resource:content-bg\.png/)
})

test('deck-slide surface metadata keeps branded background assets visible', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3sqqwAAAABJRU5ErkJggg==',
    'base64',
  )
  await writeFile(path.join(tmpDir, 'resources', 'dark-bg.png'), tinyPng)
  await writeFile(path.join(tmpDir, 'resources', 'light-bg.png'), tinyPng)

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        backgrounds: {
          dark: 'resource:dark-bg.png',
          light: 'resource:light-bg.png',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`<deck-slide layout="content" surface="dark" />

# Dark branded slide

Body copy

---

<deck-slide surface="light" />

# Light branded slide

Body copy`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /<section[^>]*class="dark"/)
  assert.match(rendered.document, /<section[^>]*class="light"/)
  assert.match(rendered.css, /section\{background-image:url\("data:image\/png;base64,/)
  assert.match(rendered.css, /section\.light\{background-image:url\("data:image\/png;base64,/)
  assert.doesNotMatch(rendered.css, /section\.light\{background-color:#ffffff;background-image:none\}/)
})

test('structured component panels preserve branded background imagery', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3sqqwAAAABJRU5ErkJggg==',
    'base64',
  )
  await writeFile(path.join(tmpDir, 'resources', 'dark-bg.png'), tinyPng)
  await writeFile(path.join(tmpDir, 'resources', 'light-bg.png'), tinyPng)

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        backgrounds: {
          dark: 'resource:dark-bg.png',
          light: 'resource:light-bg.png',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`<deck-slide surface="dark" />

# Dark funnel

<deck-funnel labels="Invited,Started" values="100,80"></deck-funnel>

---

<deck-slide surface="light" />

# Light funnel

<deck-funnel labels="Invited,Started" values="100,80"></deck-funnel>

---

<deck-slide surface="dark" />

# Dark journey

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start"></deck-journey-step>
  <deck-journey-step label="02" title="Approve" body="Finish"></deck-journey-step>
</deck-journey-map>

---

<deck-slide surface="light" />

# Light journey

<deck-journey-map>
  <deck-journey-step label="01" title="Invite" body="Start"></deck-journey-step>
  <deck-journey-step label="02" title="Approve" body="Finish"></deck-journey-step>
</deck-journey-map>

---

<deck-slide surface="dark" />

# Dark heatmap

<deck-heatmap x-labels="08,09" y-labels="Mon,Tue" values="10,20;30,40"></deck-heatmap>

---

<deck-slide surface="light" />

# Light heatmap

<deck-heatmap x-labels="08,09" y-labels="Mon,Tue" values="10,20;30,40"></deck-heatmap>

---

<deck-slide surface="dark" />

# Dark treemap

<deck-treemap labels="A,B,C" values="60,25,15"></deck-treemap>

---

<deck-slide surface="light" />

# Light treemap

<deck-treemap labels="A,B,C" values="60,25,15"></deck-treemap>`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(
    rendered.document,
    /section\.dark \.card-grid article,[\s\S]*section\.dark \.deck-funnel,[\s\S]*background: rgba\(29, 30, 41, 0\.86\);/,
  )
  assert.match(
    rendered.document,
    /section\.dark \.card-grid article,[\s\S]*section\.dark \.deck-journey-step,[\s\S]*background: rgba\(29, 30, 41, 0\.86\);/,
  )
  assert.match(
    rendered.document,
    /section\.dark \.card-grid article,[\s\S]*section\.dark \.deck-heatmap,[\s\S]*background: rgba\(29, 30, 41, 0\.86\);/,
  )
  assert.match(
    rendered.document,
    /section\.dark \.card-grid article,[\s\S]*section\.dark \.deck-treemap,[\s\S]*background: rgba\(29, 30, 41, 0\.86\);/,
  )
  assert.match(
    rendered.document,
    /section\.light \.card-grid article,[\s\S]*section\.light \.deck-funnel,[\s\S]*background: rgba\(253, 253, 253, 0\.92\);/,
  )
  assert.match(
    rendered.document,
    /section\.light \.card-grid article,[\s\S]*section\.light \.deck-journey-step,[\s\S]*background: rgba\(253, 253, 253, 0\.92\);/,
  )
  assert.match(
    rendered.document,
    /section\.light \.card-grid article,[\s\S]*section\.light \.deck-heatmap,[\s\S]*background: rgba\(253, 253, 253, 0\.92\);/,
  )
  assert.match(
    rendered.document,
    /section\.light \.card-grid article,[\s\S]*section\.light \.deck-treemap,[\s\S]*background: rgba\(253, 253, 253, 0\.92\);/,
  )
})

test('HTML divider and close slides use full dark surfaces without brand backgrounds', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-divider title="Section" subtitle="Transition"></deck-divider>

---

<deck-close title="Thanks" name="Jane Smith" role="VP Solutions"></deck-close>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(
    rendered.css,
    /section\.cover,\s*[^,{]*section\.deck-divider-slide,\s*[^,{]*section\.deck-close-slide\{padding:92px 48px;background:#090909;color:#ffffff\}/,
  )
  assert.doesNotMatch(rendered.css, /\.deck-divider,\s*[^,{]*\.deck-close\{[^}]*background:#090909/)
})

test('brand background assets target divider and close slide surfaces', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })

  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l3sqqwAAAABJRU5ErkJggg==',
    'base64',
  )
  await writeFile(path.join(tmpDir, 'resources', 'dark-bg.png'), tinyPng)

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        backgrounds: {
          cover: 'resource:dark-bg.png',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`<deck-divider title="Section"></deck-divider>

---

<deck-close title="Thanks"></deck-close>`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(
    rendered.css,
    /section\.deck-divider-slide,\s*[^,{]*section:has\(\.deck-divider\)\{background-image:url\("data:image\/png;base64,/,
  )
  assert.match(
    rendered.css,
    /section\.deck-close-slide,\s*[^,{]*section:has\(\.deck-close\)\{background-image:url\("data:image\/png;base64,/,
  )
  assert.doesNotMatch(rendered.css, /\.deck-close\{background-image:/)
})

test('applies brand logo assets to self-contained HTML slides', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logo.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Brand</text></svg>',
  )

  const baseDefinitions = await loadDefinitions(
    new URL('../resources/definitions', import.meta.url),
  )
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          default: 'resource:logo.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        logo: { x: 828, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

<deck-divider title="Section" subtitle="Transition"></deck-divider>

---

# Content

Body copy`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /deck-brand-logo/)
  assert.match(rendered.document, /data:image\/svg\+xml;base64,/)
  assert.match(rendered.document, /left:\s*1104px/)
  assert.match(rendered.document, /<h1[^>]*>Content<\/h1>/)
  assert.doesNotMatch(rendered.document, /# Content/)
  assert.doesNotMatch(rendered.document, /resource:logo\.svg/)
})

test('HTML branding owns company and customer logo chrome', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-light.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Light</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Customer</text></svg>',
  )

  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          dark: 'resource:logos/company-dark.svg',
          light: 'resource:logos/company-light.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        companyLogo: { x: 36, y: 21, w: 98, h: 24 },
        customerLogo: { x: 828, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/customer.svg
customerName: Customer A
---

# Cover

---

# Content

<deck-slide customer-logo="resource:logos/customer.svg" customer-name="Customer A" />

Body copy`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /deck-brand-logo deck-company-logo/)
  assert.match(rendered.document, /<style data-deckbuilder-theme>[\s\S]*\.deck-brand-logo,\s*[\r\n]+\.deck-company-logo\s*\{[\s\S]*position:\s*absolute/)
  assert.match(rendered.document, /<style data-deckbuilder-theme>[\s\S]*\.deck-customer-logo-frame\s*\{[\s\S]*position:\s*absolute/)
  assert.match(rendered.document, /<style data-deckbuilder-theme>[\s\S]*\.deck-customer-logo\s*\{[\s\S]*object-fit:\s*contain/)
  assert.match(rendered.document, /<section[^>]*class="light"/)
  assert.match(rendered.document, /deck-customer-logo-frame deck-logo-on-dark/)
  assert.match(rendered.document, /deck-customer-logo-frame deck-logo-on-light/)
  assert.doesNotMatch(rendered.document, /deck-customer-logo-frame\.deck-logo-on-dark\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.92\)/)
  assert.match(rendered.document, /left:\s*48px/)
  assert.match(rendered.document, /left:\s*1104px/)
  assert.equal((rendered.document.match(/<img class="deck-customer-logo"/g) || []).length, 2)
  assert.doesNotMatch(rendered.document, /<p>\s*<img class="deck-customer-logo"/)
  assert.doesNotMatch(rendered.document, /resource:logos\/customer\.svg/)
})

test('HTML branding honours frontmatter company logo before brand defaults', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  const authoredLogo =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Authored</text></svg>'
  const defaultLogo =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Default</text></svg>'
  await writeFile(path.join(tmpDir, 'resources', 'logos', 'company-authored.svg'), authoredLogo)
  await writeFile(path.join(tmpDir, 'resources', 'logos', 'company-default.svg'), defaultLogo)

  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          default: 'resource:logos/company-default.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        companyLogo: { x: 36, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`---
companyLogo: resource:logos/company-authored.svg
companyName: Authored Co
---

# Cover`)

  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /alt="Authored Co"/)
  assert.equal(rendered.document.includes(Buffer.from(authoredLogo).toString('base64')), true)
  assert.equal(rendered.document.includes(Buffer.from(defaultLogo).toString('base64')), false)
})

test('HTML branding uses surface-specific frontmatter company logo variants', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  const lightLogo =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Company light</text></svg>'
  const darkLogo =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Company dark</text></svg>'
  await writeFile(path.join(tmpDir, 'resources', 'logos', 'company.svg'), lightLogo)
  await writeFile(path.join(tmpDir, 'resources', 'logos', 'company.dark.svg'), darkLogo)

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`---
companyLogo: resource:logos/company.svg
---

<!-- _class: dark -->

# Dark cover`)

  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.equal(rendered.document.includes(Buffer.from(darkLogo).toString('base64')), true)
  assert.equal(rendered.document.includes(Buffer.from(lightLogo).toString('base64')), false)
})

test('HTML branding preserves customer logo colours while fitting the logo frame', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><rect width="40" height="24" fill="#DB0011"/><text x="45" y="18" fill="#000000">Customer A</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><rect width="40" height="24" fill="#DB0011"/><text x="45" y="18" fill="#ffffff">Customer A</text></svg>',
  )

  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    themeCss: `${baseDefinitions.themeCss}
.deck-customer-logo { filter: brightness(0) invert(1); }`,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          dark: 'resource:logos/company-dark.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        customerLogo: { x: 828, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/customer.svg
---

<!-- _class: dark -->

# Cover`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
  })

  assert.match(rendered.document, /customer\.dark\.svg/)
  assert.match(rendered.document, /deck-customer-logo\s*\{[^}]*max-width:\s*100%/)
  assert.match(rendered.document, /deck-customer-logo\s*\{[^}]*max-height:\s*100%/)
  assert.match(rendered.document, /deck-customer-logo\s*\{[^}]*object-fit:\s*contain/)
  assert.match(rendered.document, /deck-customer-logo\s*\{[^}]*filter:\s*none\s*!important/)
  assert.match(rendered.document, /deck-customer-logo\s*\{[^}]*mix-blend-mode:\s*normal\s*!important/)
})

test('customer logo backplate is opt-in for legacy assets', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Legacy</text></svg>',
  )

  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      customerLogoBackplate: true,
      assets: {
        logo: {
          dark: 'resource:logos/company-dark.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        customerLogo: { x: 828, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/customer.svg
---

# Cover`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: true,
  })

  assert.match(rendered.document, /deck-customer-logo-frame\.deck-logo-on-dark\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.92\)/)
})

test('surface resource resolver prefers matching logo variants across extensions', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Light</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.dark.png'),
    'fake png content',
  )

  const resolved = resolveSurfaceResourceFile(
    'resource:logos/customer.svg',
    path.join(tmpDir, 'resources'),
    'dark',
  )

  assert.equal(resolved.relativePath, 'logos/customer.dark.png')
})

test('HTML customer logo uses surface-specific sibling variants when present', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-light.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Light</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Black wordmark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">White wordmark</text></svg>',
  )

  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          dark: 'resource:logos/company-dark.svg',
          light: 'resource:logos/company-light.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        companyLogo: { x: 36, y: 21, w: 98, h: 24 },
        customerLogo: { x: 828, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/customer.svg
---

# Dark cover

---

# Light content`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: false,
  })

  assert.match(rendered.document, /customer\.dark\.svg/)
  assert.match(rendered.document, /customer\.svg/)
  assert.equal((rendered.document.match(/<span class="deck-customer-logo-frame/g) || []).length, 2)
})

test('HTML logo walls use surface-specific sibling variants when present', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'partner.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark text</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'partner.dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Light text</text></svg>',
  )

  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      assets: {
        logo: {
          dark: 'resource:logos/company-dark.svg',
        },
      },
      layouts: {
        ...baseDefinitions.brand.layouts,
        companyLogo: { x: 36, y: 21, w: 98, h: 24 },
      },
    },
  }
  const deck = parseDeckMarkdown(`<!-- surface: dark -->

# Trusted logos

<deck-logo-wall title="Trusted by enterprise leaders">
  <deck-logo name="Partner" image="resource:logos/partner.svg"></deck-logo>
</deck-logo-wall>`)
  const rendered = renderDeckHtml(deck, {
    resourcesDir: path.join(tmpDir, 'resources'),
    definitions,
    inlineAssets: false,
  })

  assert.match(rendered.document, /partner\.dark\.svg/)
  assert.doesNotMatch(rendered.document, /partner\.svg["')]/)
})

test('HTML light and dark surfaces emit fallback background colours', async () => {
  const baseDefinitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const definitions = {
    ...baseDefinitions,
    brand: {
      ...baseDefinitions.brand,
      colors: {
        ...baseDefinitions.brand.colors,
        backgroundDark: '101820',
        backgroundLight: 'FAFBFC',
      },
    },
  }
  const deck = parseDeckMarkdown(`<deck-exec-cards surface="dark" columns="2">
  <deck-exec-card label="01" title="Dark surface" body="Readable dark content."></deck-exec-card>
</deck-exec-cards>

---

<deck-exec-cards surface="light" columns="2">
  <deck-exec-card label="01" title="Light surface" body="Readable light content."></deck-exec-card>
</deck-exec-cards>`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.css, /section\.dark\s*\{\s*background-color:\s*#101820(?:;|\})/)
  assert.match(rendered.css, /section\.light\s*\{\s*background-color:\s*#FAFBFC(?:;|\})/)
  assert.match(rendered.document, /<section[^>]*class="dark"/)
  assert.match(rendered.document, /<section[^>]*class="light"/)
})

test('PPTX light content slides use light fills and both logo slots', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Dark</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-light.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Light</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Customer</text></svg>',
  )

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    colors: {
      ...definitions.brand.colors,
      cardLight: '1D1E29',
      border: '1E3A5F',
      body: 'C8D8F0',
    },
    assets: {
      logo: {
        dark: 'resource:logos/company-dark.svg',
        light: 'resource:logos/company-light.svg',
      },
    },
    layouts: {
      ...definitions.brand.layouts,
      companyLogo: { x: 36, y: 21, w: 98, h: 24 },
      customerLogo: { x: 828, y: 21, w: 98, h: 24 },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/customer.svg
---

# Cover

---

<!-- _class: light -->

# Content

<deck-card-grid columns="3">
  <deck-card title="Readable"><p>White page content should not inherit navy card fills.</p></deck-card>
</deck-card-grid>`)
  const out = path.join(tmpDir, 'light-branding.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const coverXml = await archive.file('ppt/slides/slide1.xml').async('string')
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')
  const slideRels = await archive.file('ppt/slides/_rels/slide2.xml.rels').async('string')

  assert.match(coverXml, /FFFFFF/)
  assert.match(slideXml, /FDFDFD/)
  assert.match(slideXml, /DEDEDE/)
  assert.doesNotMatch(slideXml, /1D1E29/)
  assert.ok((slideRels.match(/image/g) || []).length >= 2)
})

test('PPTX text boxes are clamped inside their filled card shapes', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    layouts: {
      ...definitions.brand.layouts,
      cards: {
        ...definitions.brand.layouts.cards,
        yTop: 120,
        yBottom: 240,
        body3: {
          ...definitions.brand.layouts.cards.body3,
          dy: 90,
          bottomPad: 20,
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

# Cards

<deck-card-grid columns="3">
  <deck-card title="Aligned"><p>Text that should stay inside the filled card shape.</p></deck-card>
</deck-card-grid>`)
  const out = path.join(tmpDir, 'card-text-clamp.pptx')

  await writePptx({ deck, outputPath: out, brand })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')

  assert.match(slideXml, /Text that should stay inside/)
  assert.match(slideXml, /cy="127000"/)
  assert.doesNotMatch(slideXml, /cy="1270000"/)
})

test('PPTX header eyebrow avoids the company logo slot', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'company-light.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Logo</text></svg>',
  )

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    assets: {
      logo: {
        light: 'resource:logos/company-light.svg',
      },
    },
    layouts: {
      ...definitions.brand.layouts,
      companyLogo: { x: 36, y: 21, w: 98, h: 24 },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

<!-- eyebrow: ARCHITECTURE -->

# A single real-time layer connects every channel and system in the enterprise

Body copy`)
  const out = path.join(tmpDir, 'header-logo-safe.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')
  const eyebrowShape = shapeXmlContaining(slideXml, 'ARCHITECTURE')
  const eyebrowX = shapeOffset(eyebrowShape).x

  assert.ok(eyebrowX >= 146 * 12700)
})

test('PPTX logo wall contains wide logos without stretching them', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'wide.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100"><rect width="800" height="100"/></svg>',
  )

  const definitions = withoutBrandLogo(await loadDefinitions(new URL('../resources/definitions', import.meta.url)))
  const deck = parseDeckMarkdown(`# Trusted logos

<deck-logo-wall>
  <deck-logo name="Wide" image="resource:logos/wide.svg"></deck-logo>
</deck-logo-wall>`)
  const out = path.join(tmpDir, 'logo-wall-contain.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide1.xml').async('string')

  assert.doesNotMatch(slideXml, /<a:ext cx="1955800" cy="482600"\/>/)
  assert.match(slideXml, /<a:ext cx="1955800" cy="244475"\/>/)
})

test('PPTX customer logo fits frame without changing aspect ratio', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'wide-customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100"><rect width="800" height="100" fill="#db0011"/></svg>',
  )

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    assets: {
      backgrounds: {},
      logo: {},
    },
    layouts: {
      ...definitions.brand.layouts,
      customerLogo: { x: 828, y: 21, w: 98, h: 24 },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/wide-customer.svg
---

# Customer logo fit`)
  const out = path.join(tmpDir, 'customer-logo-contain.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide1.xml').async('string')
  const customerLogoXml = pictureXmlContaining(slideXml, 'Customer logo')
  const offset = pictureOffset(customerLogoXml)
  const extent = pictureExtent(customerLogoXml)

  assert.equal(extent.cx, 98 * 12700)
  assert.equal(extent.cy, 12.25 * 12700)
  assert.equal(offset.x, 828 * 12700)
  assert.ok(Math.abs(offset.y - (26.875 * 12700)) <= 1)
})

test('PPTX company logo from frontmatter fits frame without changing aspect ratio', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(path.join(tmpDir, 'resources', 'logos'), { recursive: true })
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'wide-company.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100"><rect width="800" height="100" fill="#0f82f5"/></svg>',
  )

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    assets: {
      backgrounds: {},
      logo: {},
    },
    layouts: {
      ...definitions.brand.layouts,
      companyLogo: { x: 36, y: 21, w: 98, h: 24 },
    },
  }
  const deck = parseDeckMarkdown(`---
companyLogo: resource:logos/wide-company.svg
companyName: Frontmatter company
---

# Company logo fit`)
  const out = path.join(tmpDir, 'company-logo-contain.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand,
    resourcesDir: path.join(tmpDir, 'resources'),
  })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide1.xml').async('string')
  const companyLogoXml = pictureXmlContaining(slideXml, 'Frontmatter company')
  const offset = pictureOffset(companyLogoXml)
  const extent = pictureExtent(companyLogoXml)

  assert.equal(extent.cx, 98 * 12700)
  assert.equal(extent.cy, 12.25 * 12700)
  assert.equal(offset.x, 36 * 12700)
  assert.ok(Math.abs(offset.y - (26.875 * 12700)) <= 1)
})

test('PPTX swimlane steps fill available lane width and keep text readable', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    layouts: {
      ...definitions.brand.layouts,
      swimlane: {
        ...definitions.brand.layouts.swimlane,
        fills: {
          ...definitions.brand.layouts.swimlane.fills,
          blue: 'dark',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`<!-- _class: light -->
<!-- eyebrow: ARCHITECTURE -->

# A single real-time layer connects every channel and system in the enterprise

<deck-swimlane>
  <deck-lane title="Initiate" color="blue">
    <deck-step title="Trigger">Agent or digital channel triggers a Lightico session from any CRM, IVR, or web app.</deck-step>
  </deck-lane>
</deck-swimlane>`)
  const out = path.join(tmpDir, 'swimlane-step-fit.pptx')

  await writePptx({ deck, outputPath: out, brand })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideXml = await archive.file('ppt/slides/slide1.xml').async('string')
  const stepShape = shapeXmlContaining(slideXml, 'Trigger')

  assert.match(slideXml, /<a:ext cx="10515600" cy="/)
  assert.match(stepShape, /<a:srgbClr val="FFFFFF"\/>/)
  assert.doesNotMatch(stepShape, /<a:srgbClr val="090909"\/>/)

  const compactDeck = parseDeckMarkdown(`<!-- _class: light -->
<!-- eyebrow: ARCHITECTURE -->

# A single real-time layer connects every channel and system in the enterprise

<deck-swimlane>
  <deck-lane title="Customer" color="blue">
    <deck-step title="Receives link">Customer receives secure link; verifies identity, signs documents, and gives consent in one flow.</deck-step>
  </deck-lane>
  <deck-lane title="Agent" color="cyan">
    <deck-step title="Guides live">Agent sees real-time customer progress with no blind transfers and no callbacks.</deck-step>
  </deck-lane>
  <deck-lane title="Platform" color="purple">
    <deck-step title="Captures">Evidence is timestamped and stored automatically in the audit vault.</deck-step>
  </deck-lane>
</deck-swimlane>`)
  const compactOut = path.join(tmpDir, 'swimlane-compact-fit.pptx')
  await writePptx({ deck: compactDeck, outputPath: compactOut, brand })

  const compactArchive = await JSZip.loadAsync(await readFile(compactOut))
  const compactXml = await compactArchive.file('ppt/slides/slide1.xml').async('string')
  const compactBody = shapeXmlContaining(compactXml, 'Customer receives secure link')
  const compactTitle = shapeXmlContaining(compactXml, 'Receives link')
  const bodyOffset = shapeOffset(compactBody)
  const bodyExtent = shapeExtent(compactBody)
  const titleOffset = shapeOffset(compactTitle)
  assert.ok(bodyOffset.y > titleOffset.y)
  assert.ok(bodyExtent.cy >= 16 * 12700)
  assert.ok(bodyOffset.y + bodyExtent.cy < 445 * 12700)
})

test('writes executive layouts with independent light and dark surfaces in PPTX', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-exec-rows surface="light" takeaway="Light surface takeaway">
  <deck-exec-row title="Light executive row" body="Readable copy on a light card."></deck-exec-row>
</deck-exec-rows>

---

<deck-exec-rows surface="dark" takeaway="Dark surface takeaway">
  <deck-exec-row title="Dark executive row" body="Readable copy on a dark card."></deck-exec-row>
</deck-exec-rows>`)
  const out = path.join(tmpDir, 'exec-surfaces.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand })

  const archive = await JSZip.loadAsync(await readFile(out))
  const lightSlideXml = await archive.file('ppt/slides/slide1.xml').async('string')
  const darkSlideXml = await archive.file('ppt/slides/slide2.xml').async('string')
  const lightCardFill = definitions.brand.colors.execCardLight || definitions.brand.colors.cardFillLight || 'FDFDFD'
  const darkCardFill = definitions.brand.colors.execCard || definitions.brand.colors.execCardDark || definitions.brand.colors.cardDark || '13213D'

  assert.match(lightSlideXml, new RegExp(lightCardFill))
  assert.match(lightSlideXml, /090909/)
  assert.match(darkSlideXml, new RegExp(darkCardFill))
  assert.match(darkSlideXml, /FFFFFF/)
})

test('splits structured HTML slides from editable PPTX fallback slides', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const source = `# Cover

---

<deck-slide pptx-skip="true" />

# HTML-only structured emphasis

<deck-signal-bars metric="72%" metric-label="HTML signal" title="HTML-only structured signal" labels="A,B" values="72,28"></deck-signal-bars>

---

<deck-slide html-skip="true" />

# Editable PowerPoint fallback

<deck-chart title="Editable fallback chart" labels="A,B" values="10,20"></deck-chart>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /HTML-only structured signal/)
  assert.doesNotMatch(rendered.document, /Editable PowerPoint fallback/)

  const out = path.join(tmpDir, 'split-output.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideNames = Object.keys(archive.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name),
  )

  assert.equal(slideNames.length, 2)
})

function shapeXmlContaining(slideXml, text) {
  const textIndex = slideXml.indexOf(text)
  assert.notEqual(textIndex, -1, `Expected slide XML to contain "${text}"`)
  const shapeStart = slideXml.lastIndexOf('<p:sp>', textIndex)
  const shapeEnd = slideXml.indexOf('</p:sp>', textIndex)
  assert.notEqual(shapeStart, -1, `Expected "${text}" to be inside a shape`)
  assert.notEqual(shapeEnd, -1, `Expected "${text}" shape to close`)
  return slideXml.slice(shapeStart, shapeEnd + '</p:sp>'.length)
}

function shapeOffset(shapeXml) {
  const match = shapeXml.match(/<a:off x="(\d+)" y="(\d+)"\/>/)
  assert.ok(match, 'Expected shape XML to include an offset')
  return {
    x: Number(match[1]),
    y: Number(match[2]),
  }
}

function shapeExtent(shapeXml) {
  const match = shapeXml.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/)
  assert.ok(match, 'Expected shape XML to include an extent')
  return {
    cx: Number(match[1]),
    cy: Number(match[2]),
  }
}

function pictureXmlContaining(slideXml, altText) {
  const altIndex = slideXml.indexOf(`descr="${altText}"`)
  assert.notEqual(altIndex, -1, `Expected slide XML to contain picture alt text "${altText}"`)
  const pictureStart = slideXml.lastIndexOf('<p:pic>', altIndex)
  const pictureEnd = slideXml.indexOf('</p:pic>', altIndex)
  assert.notEqual(pictureStart, -1, `Expected "${altText}" to be inside a picture`)
  assert.notEqual(pictureEnd, -1, `Expected "${altText}" picture to close`)
  return slideXml.slice(pictureStart, pictureEnd + '</p:pic>'.length)
}

function pictureOffset(pictureXml) {
  const match = pictureXml.match(/<a:off x="(\d+)" y="(\d+)"\/>/)
  assert.ok(match, 'Expected picture XML to include an offset')
  return {
    x: Number(match[1]),
    y: Number(match[2]),
  }
}

function pictureExtent(pictureXml) {
  const match = pictureXml.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/)
  assert.ok(match, 'Expected picture XML to include an extent')
  return {
    cx: Number(match[1]),
    cy: Number(match[2]),
  }
}
