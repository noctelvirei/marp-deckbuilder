import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { loadDefinitions } from '../src/brand.js'
import { buildMarpMarkdown, parseDeckMarkdown } from '../src/markdown.js'

test('parses frontmatter, directives, and all native components', async () => {
  const source = await readFile(new URL('../samples/demo.md', import.meta.url), 'utf8')
  const deck = parseDeckMarkdown(source)

  assert.equal(deck.frontmatter.title, 'Marp Deckbuilder Demo')
  assert.equal(deck.slides.length, 12)
  assert.equal(deck.slides[0].layout, 'cover')
  assert.deepEqual(deck.slides.map((slide) => slide.layout), [
    'cover',
    'divider',
    'three-stat',
    'cards',
    'chart',
    'comparison',
    'swimlane',
    'proof',
    'logo-wall',
    'next-steps',
    'divider',
    'close',
  ])
  assert.equal(deck.slides[2].stats.length, 3)
  assert.equal(deck.slides[2].takeaway.includes('Marp'), true)
  assert.equal(deck.slides[3].cards.length, 3)
  assert.equal(deck.slides[4].chart.title, 'Average completion time')
  assert.deepEqual(deck.slides[4].chart.values, [2.1, 3.8, 4.6, 6.2])
  assert.equal(deck.slides[5].comparison.rows.length, 4)
  assert.equal(deck.slides[6].swimlane.lanes.length, 2)
  assert.equal(deck.slides[7].proof.stats.length, 3)
  assert.equal(deck.slides[8].logoWall.logos.length, 12)
  assert.equal(deck.slides[9].nextSteps.steps.length, 3)
  assert.equal(deck.slides[11].close.title, 'Thank you')
})

test('adds Marp defaults while preserving deck frontmatter', async () => {
  const source = await readFile(new URL('../samples/demo.md', import.meta.url), 'utf8')
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(source)
  const markdown = buildMarpMarkdown(deck, { themeName: definitions.brand.themeName })

  assert.match(markdown, /marp: true/)
  assert.match(markdown, /theme: deckbuilder/)
  assert.match(markdown, /title: Marp Deckbuilder Demo/)
})
