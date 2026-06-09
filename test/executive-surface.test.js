import assert from 'node:assert/strict'
import test from 'node:test'

import { parseDeckMarkdown } from '../src/markdown.js'

test('executive layouts inherit a deck-wide light surface', () => {
  const deck = parseDeckMarkdown(`---
title: Executive style
defaultSurface: light
---

<deck-exec-rows>
  <deck-exec-row title="Enterprise-only" body="Focused on large regulated customers."></deck-exec-row>
</deck-exec-rows>`)

  assert.equal(deck.slides[0].layout, 'exec-rows')
  assert.equal(deck.slides[0].surface, 'light')
})

test('executive layouts can be explicitly dark via directive', () => {
  const deck = parseDeckMarkdown(`---
title: Executive style
defaultSurface: light
---

<!-- surface: dark -->

<deck-exec-cards columns="3">
  <deck-exec-card title="Expansion" metric="[NRR%]" body="Existing base expands faster than churn."></deck-exec-card>
</deck-exec-cards>`)

  assert.equal(deck.slides[0].layout, 'exec-cards')
  assert.equal(deck.slides[0].surface, 'dark')
})

test('executive component surface attribute controls the slide surface', () => {
  const deck = parseDeckMarkdown(`---
title: Executive style
---

<deck-exec-title surface="light" eyebrow="What's next" title="From momentum to plan." subtitle="The growth vectors."></deck-exec-title>`)

  assert.equal(deck.slides[0].layout, 'exec-title')
  assert.equal(deck.slides[0].surface, 'light')
})
