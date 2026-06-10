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
  const brand = {
    ...definitions.brand,
    layouts: {
      ...definitions.brand.layouts,
      header: {
        ...definitions.brand.layouts.header,
        title: {
          ...definitions.brand.layouts.header.title,
          color: 'lightblue',
        },
      },
    },
  }
  const deck = parseDeckMarkdown(`# Cover

---

# Content title

Body copy`)
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

  assert.deepEqual(
    warnings.filter((warning) => warning.includes('not a valid scheme color')),
    [],
  )
  assert.match(slideXml, /59D6FD/)
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
  assert.match(slideXml, /<a:spcPts val="\d+"/)
  assert.match(slideXml, /<a:off x="457200" y="4013200"/)
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
