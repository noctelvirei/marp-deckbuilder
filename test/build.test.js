import assert from 'node:assert/strict'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import JSZip from 'jszip'

import { loadDefinitions } from '../src/brand.js'
import { parseDeckMarkdown } from '../src/markdown.js'
import { renderDeckHtml } from '../src/render.js'
import { writePptx } from '../src/pptx.js'

const tmpDir = path.resolve('.tmp', 'tests')

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
  await writeFile(path.join(tmpDir, 'resources', 'logo.png'), tinyPng)

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const brand = {
    ...definitions.brand,
    assets: {
      backgrounds: {
        cover: 'resource:title-bg.png',
        content: 'resource:content-bg.png',
      },
      logo: {
        default: 'resource:logo.png',
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

test('keeps JavaScript in HTML-only slides and skips them in PPTX', async () => {
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

# Native summary

This slide should appear in PowerPoint.`
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'html-only.pptx')

  assert.match(rendered.document, /window\.deckbuilderDemoRan = true/)

  await writePptx({ deck, outputPath: out, brand: definitions.brand, mode: 'editable' })

  const archive = await JSZip.loadAsync(await readFile(out))
  const slideNames = Object.keys(archive.files).filter((name) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name),
  )

  assert.equal(slideNames.length, 2)
})
