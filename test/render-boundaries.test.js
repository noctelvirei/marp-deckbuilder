import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { test } from 'node:test'

import { brandBackgroundCss, brandLogoCss, brandSurfaceCss } from '../src/render/brand-css.js'
import { prepareDeckForHtml, shouldSkipHtml } from '../src/render/branding.js'
import { htmlDocument } from '../src/render/document.js'
import { resolveResourceUrls } from '../src/render/resource-urls.js'

test('render document boundary owns shell escaping and notes', () => {
  const html = htmlDocument({
    title: 'Q2 <Deck>',
    html: '<section>Body</section>',
    css: '.marp{}',
    deckbuilderCss: '.brand{}',
    bespokeCss: '.bespoke{}',
    bespokeJs: 'window.deck = true;',
    richHtmlJs: 'window.rich = true;',
    comments: [['Speaker & note']],
  })

  assert.match(html, /<title>Q2 &lt;Deck&gt;<\/title>/)
  assert.match(html, /data-deckbuilder-theme>\.brand/)
  assert.match(html, /class="bespoke-marp-note"/)
  assert.match(html, /Speaker &amp; note/)
  assert.match(html, /window.rich = true;/)
})

test('render branding boundary prepares slide chrome and skip directives', () => {
  const deck = {
    slides: [
      {
        layout: 'cover',
        surface: 'dark',
        source: '# Hello\n<img src="logo.svg">',
        directives: {},
        customerLogo: { src: 'customer.svg', alt: 'Customer' },
      },
      {
        layout: 'content',
        surface: 'light',
        source: '# Skip me',
        directives: { html: 'skip' },
      },
    ],
  }
  const prepared = prepareDeckForHtml(deck, { name: 'Lightico', assets: { logo: { cover: 'cover.svg' } } }, 'resources')

  assert.equal(prepared.slides.length, 1)
  assert.match(prepared.slides[0].source, /<!-- _class: cover -->/)
  assert.match(prepared.slides[0].source, /deck-brand-logo deck-company-logo/)
  assert.match(prepared.slides[0].source, /deck-customer-logo-frame deck-logo-on-dark/)
  assert.match(prepared.slides[0].source, /src="resource:logo.svg"/)
  assert.equal(shouldSkipHtml({ directives: { 'pptx-only': 'true' } }), true)
})

test('render brand css boundary emits backgrounds, surfaces, and logo frames', () => {
  const brand = {
    slide: { pxToPt: 1 },
    colors: { dark: '000000', body: '111111', blue: '123456' },
    assets: { backgrounds: { content: 'resource:bg.svg' }, customerLogoBackplate: true },
    layouts: { companyLogo: { x: 1, y: 2, w: 3, h: 4 } },
  }

  assert.match(brandBackgroundCss(brand), /background-image: url\("resource:bg.svg"\)/)
  assert.match(brandLogoCss(brand), /left: 1px/)
  assert.match(brandLogoCss(brand), /deck-logo-on-dark/)
  assert.match(brandSurfaceCss(brand), /section.dark/)
  assert.match(brandSurfaceCss(brand), /#C8D8F0/)
})

test('render resource resolver boundary can collect portable assets', async (t) => {
  const dir = join(process.cwd(), '.tmp', 'render-boundary-test')
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
  t.after(async () => {
    await import('node:fs/promises').then(({ rm }) => rm(dir, { recursive: true, force: true }))
  })

  const assetMap = new Map()
  const resolved = resolveResourceUrls('url(resource:logo.svg)', dir, {
    assetMap,
    assetUrlPrefix: 'assets',
  })

  assert.equal(resolved, 'url(assets/logo.svg)')
  assert.equal(assetMap.get('logo.svg'), join(dir, 'logo.svg'))
})
