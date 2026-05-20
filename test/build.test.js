import assert from 'node:assert/strict'
import { mkdir, readFile, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

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

  assert.match(rendered.document, /class="marpit"/)
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
