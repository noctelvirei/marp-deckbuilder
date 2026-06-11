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

const tmpDir = path.resolve('.tmp', 'tests', String(process.pid))

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

test('renders rich HTML showcase with renderer-owned runtime and print fallbacks', async () => {
  const source = await readFile(new URL('../samples/rich-html-showcase.md', import.meta.url), 'utf8')
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /<script data-deckbuilder-rich-html>/)
  assert.match(rendered.document, /window\.deckRichHtml/)
  assert.match(rendered.document, /deck-rich-printing/)
  assert.match(rendered.document, /data-deck-rich-cover/)
  assert.match(rendered.document, /data-deck-rich-book/)
  assert.match(rendered.document, /book-print/)
  assert.match(rendered.document, /data-deck-rich-radar/)
  assert.match(rendered.document, /data-deck-rich-gauge/)
  assert.match(rendered.document, /data-deck-rich-close/)
  assert.match(rendered.document, /Renderer-owned rich HTML components/)
  assert.match(rendered.document, /\.deck-rich \{/)
  assert.match(rendered.document, /\.deck-rich \.book-scene/)
  assert.doesNotMatch(rendered.css, /deck-rich/)
  assert.doesNotMatch(rendered.css, /body\.deck-rich-printing/)
  assert.doesNotMatch(rendered.document, /<deck-rich-cover\b/)
  assert.doesNotMatch(rendered.document, /<deck-magazine-book\b/)
  assert.doesNotMatch(rendered.document, /<deck-rich-card\b/)
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

test('writes SVG visual components as embedded PPTX media', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const source = `# Cover

---

# Visual report

<deck-visual title="Operating model">
  <svg viewBox="0 0 200 100" role="img" aria-label="Simple metric">
    <rect x="10" y="10" width="180" height="80" fill="#eef6fe"/>
    <text x="30" y="60">84%</text>
  </svg>
</deck-visual>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const out = path.join(tmpDir, 'visual.pptx')

  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })

  const archive = await JSZip.loadAsync(await readFile(out))
  const mediaNames = Object.keys(archive.files).filter((name) => name.startsWith('ppt/media/'))
  assert.ok(mediaNames.some((name) => name.endsWith('.svg')))
  const slideXml = await archive.file('ppt/slides/slide2.xml').async('string')
  const visualXml = pictureXmlContaining(slideXml, 'Operating model')
  const extent = pictureExtent(visualXml)
  assert.ok(Math.abs(extent.cx / extent.cy - 2) < 0.01)
  assert.ok(extent.cx < 836 * 12700)
  assert.ok(extent.cy <= 292 * 12700)
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
        content: 'resource:content-bg.png',
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

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
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

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
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

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
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

test('renders multiline SVG visual components as live HTML SVG', async () => {
  const source = `# Cover

---

# Visual report

<deck-visual title="Operating model">
  <svg viewBox="0 0 200 100" role="img" aria-label="Simple metric">
    <rect x="10" y="10" width="180" height="80" fill="#eef6fe"/>

    <circle cx="100" cy="50" r="20" fill="#0f82f5"/>
    <text x="30" y="60">84%</text>
  </svg>
</deck-visual>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /<circle cx="100"/)
  assert.doesNotMatch(rendered.document, /&lt;circle/)
  assert.doesNotMatch(rendered.document, /&lt;text/)
})

test('renders raw SVG blocks with blank lines as valid HTML SVG', async () => {
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
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /<svg viewBox="0 0 100 60"/)
  assert.match(rendered.document, /<rect x="10"/)
  assert.match(rendered.document, /<text x="50"/)
  assert.doesNotMatch(rendered.document, /<p><rect/)
  assert.doesNotMatch(rendered.document, /<br \/>[\s\S]*<text x="50"/)
})

test('HTML component chrome constrains visuals and swimlanes inside the slide', async () => {
  const source = `# Cover

---

# Architecture

<deck-visual title="Oversized chart">
  <svg viewBox="0 0 2000 600" role="img" aria-label="Oversized chart">
    <rect width="2000" height="600" fill="#0f82f5"/>
  </svg>
</deck-visual>

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
  assert.match(rendered.document, /<style data-deckbuilder-theme>[\s\S]*section\s*\{[\s\S]*position:\s*relative/)
  assert.match(rendered.document, /section img\s*\{[^}]*max-width:\s*100%/)
  assert.match(rendered.document, /\.deck-visual-stage\s*\{[^}]*overflow:\s*hidden/)
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
    ...baseDefinitions,
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
    ...baseDefinitions,
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
    ...baseDefinitions,
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
customerName: HSBC
---

# Cover

---

# Content

<img class="deck-customer-logo" src="resource:logos/customer.svg" alt="HSBC">

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
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><rect width="40" height="24" fill="#DB0011"/><text x="45" y="18" fill="#000000">HSBC</text></svg>',
  )
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.dark.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><rect width="40" height="24" fill="#DB0011"/><text x="45" y="18" fill="#ffffff">HSBC</text></svg>',
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
  <deck-exec-card number="01" title="Dark surface" body="Readable dark content."></deck-exec-card>
</deck-exec-cards>

---

<deck-exec-cards surface="light" columns="2">
  <deck-exec-card number="01" title="Light surface" body="Readable light content."></deck-exec-card>
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
  await writeFile(
    path.join(tmpDir, 'resources', 'logos', 'customer.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="18">Customer</text></svg>',
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
      customerLogo: { x: 828, y: 21, w: 98, h: 24 },
    },
  }
  const deck = parseDeckMarkdown(`---
customerLogo: resource:logos/customer.svg
---

# Cover

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

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
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

test('splits premium HTML slides from editable PPTX fallback slides', async () => {
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const source = `# Cover

---

<!-- pptx: skip -->

# Browser-only animation

<div id="animated-demo"></div>
<script>
  window.deckbuilderDemoRan = true
</script>

---

<!-- html: skip -->

# Editable PowerPoint fallback

<deck-chart title="Editable fallback chart" labels="A,B" values="10,20"></deck-chart>`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /window\.deckbuilderDemoRan = true/)
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
