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
  assert.match(markdown, /paginate: false/)
  assert.match(markdown, /title: Marp Deckbuilder Demo/)
})

test('configured brand theme wins over stale authored theme frontmatter', () => {
  const deck = parseDeckMarkdown(`---
title: Branded deck
theme: old-lightico-name
---

# Cover`)
  const markdown = buildMarpMarkdown(deck, { themeName: 'lightico-deck' })

  assert.match(markdown, /theme: lightico-deck/)
  assert.doesNotMatch(markdown, /old-lightico-name/)
})

test('preserves explicit pagination when requested', () => {
  const deck = parseDeckMarkdown(`---
title: Numbered deck
paginate: true
---

# Cover`)
  const markdown = buildMarpMarkdown(deck, { themeName: 'deckbuilder' })

  assert.match(markdown, /paginate: true/)
})

test('infers slide surfaces and customer logo chrome metadata', () => {
  const deck = parseDeckMarkdown(`---
customer:
  name: HSBC
  logo: resource:logos/hsbc.svg
---

# Cover

---

<!-- _class: light -->

# Content

<img class="deck-customer-logo" src="resource:logos/inline.svg" alt="Inline customer">

Body copy`)

  assert.equal(deck.slides[0].surface, 'dark')
  assert.equal(deck.slides[0].customerLogo.src, 'resource:logos/hsbc.svg')
  assert.equal(deck.slides[0].customerLogo.alt, 'HSBC')
  assert.equal(deck.slides[1].surface, 'light')
  assert.equal(deck.slides[1].customerLogo.src, 'resource:logos/inline.svg')
  assert.equal(deck.slides[1].customerLogo.alt, 'Inline customer')
})

test('parses SVG visual components for rich HTML and PPTX image output', () => {
  const source = `# Cover

---

<!-- takeaway: Use the source Markdown for edits. -->

# Visual report

<deck-visual title="Operating model" caption="Embedded as SVG in PPTX.">
  <svg viewBox="0 0 200 100" role="img" aria-label="Simple metric">
    <rect x="10" y="10" width="180" height="80" fill="#eef6fe"/>
    <text x="30" y="60">84%</text>
  </svg>
</deck-visual>`

  const deck = parseDeckMarkdown(source)

  assert.equal(deck.slides[1].layout, 'visual')
  assert.equal(deck.slides[1].visual.title, 'Operating model')
  assert.equal(deck.slides[1].visual.caption, 'Embedded as SVG in PPTX.')
  assert.match(deck.slides[1].visual.svg, /<svg/)
  assert.match(deck.slides[1].source, /deck-visual-stage/)
})

test('parses compact comparison columns and rows attributes', () => {
  const deck = parseDeckMarkdown(`# Comparison

<deck-comparison
  columns="Bad assumption,Correct workflow"
  rows="Count status = created|Count cases first;Trust first result|Cross-check edge cases">
</deck-comparison>`)

  const comparison = deck.slides[0].comparison

  assert.equal(comparison.leftTitle, 'Bad assumption')
  assert.equal(comparison.rightTitle, 'Correct workflow')
  assert.deepEqual(comparison.rows, [
    { label: '', left: 'Count status = created', right: 'Count cases first' },
    { label: '', left: 'Trust first result', right: 'Cross-check edge cases' },
  ])
  assert.doesNotMatch(deck.slides[0].source, /Option A/)
  assert.doesNotMatch(deck.slides[0].source, /Option B/)
})

test('preserves deck-card icon and image references as card media', () => {
  const deck = parseDeckMarkdown(`# Card icons

<deck-card-grid columns="3">
  <deck-card title="Face scan" icon="product-face-scan"><p>Capture identity.</p></deck-card>
  <deck-card title="Document" image="icons/document-check.svg"><p>Check evidence.</p></deck-card>
  <deck-card title="Child image"><img src="resource:icons/signed.svg" alt="Signed"><p>Sign the pack.</p></deck-card>
</deck-card-grid>`)

  assert.equal(deck.slides[0].cards.length, 3)
  assert.deepEqual(deck.slides[0].cards.map((card) => card.media?.src), [
    'resource:icons/product-face-scan',
    'resource:icons/document-check.svg',
    'resource:icons/signed.svg',
  ])
  assert.match(deck.slides[0].source, /deck-card-icon/)
  assert.match(deck.slides[0].source, /deck-card-image/)
  assert.doesNotMatch(deck.slides[0].source, /<p><\/p>/)
})

test('parses markdown subheadings and bullet lists for native PPTX content', () => {
  const deck = parseDeckMarkdown(`# Practical Takeaways

## What the group landed on

- Claude can be safe and useful at work.
- MCPs are the bridge between sandboxed AI and useful internal data.
- Skills are repeatable workflows, not just prompts with a fancy name.`)

  assert.equal(deck.slides[0].subtitle, 'What the group landed on')
  assert.deepEqual(deck.slides[0].bullets, [
    'Claude can be safe and useful at work.',
    'MCPs are the bridge between sandboxed AI and useful internal data.',
    'Skills are repeatable workflows, not just prompts with a fancy name.',
  ])
  assert.deepEqual(deck.slides[0].paragraphs, [])
})

test('fails loudly on invalid deck component Markdown', () => {
  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-card-grid columns="3">
  <deck-card title="Oops"><p>Body</p>
</deck-card-grid>`),
    /Invalid deck Markdown in slide 1, line 5: Mismatched deck component tags/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-card-grid columns="3">
</deck-card-grid>`),
    /deck-card-grid must include at least one deck-card/,
  )

  assert.throws(
    () =>
      parseDeckMarkdown(`# Broken

<deck-chart title="Bad" labels="A,B" values="10"></deck-chart>`),
    /deck-chart labels\/values length mismatch/,
  )
})
