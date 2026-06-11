import assert from 'node:assert/strict'
import { test } from 'node:test'

import * as cheerio from 'cheerio'

import {
  componentContext,
  validateChart,
  validateDeckComponentSyntax,
  validateDeckComponentTree,
  validateExecTitleCopy,
} from '../src/components/validation.js'

test('component validation boundary accepts known native and rich tags', () => {
  assert.doesNotThrow(() =>
    validateDeckComponentSyntax(
      `<deck-card-grid><deck-card title="A"></deck-card></deck-card-grid>
<deck-rich-stats><deck-rich-metric value="42"></deck-rich-metric></deck-rich-stats>`,
      componentContext({ slideNumber: 3 }),
    ),
  )
})

test('component validation boundary reports syntax and tree errors', () => {
  assert.throws(
    () => validateDeckComponentSyntax('<deck-card-grid><deck-card></deck-card-grid>', 'slide 1'),
    /Invalid deck Markdown in slide 1, line 1: Mismatched deck component tags/,
  )

  const root = cheerio.load('<root><deck-rich-card title="Outside"></deck-rich-card></root>', {
    decodeEntities: false,
    lowerCaseAttributeNames: true,
  })
  assert.throws(
    () => validateDeckComponentTree(root, 'slide 1'),
    /<deck-rich-card> must be placed directly inside <deck-tilt-cards> or <deck-glass-cards> or <deck-stagger-grid>/,
  )
})

test('component validation boundary owns chart and copy-fit checks', () => {
  assert.throws(
    () => validateChart({ labels: ['A', 'B'], values: [1] }, 'slide 2'),
    /deck-chart labels\/values length mismatch/,
  )
  assert.throws(
    () =>
      validateExecTitleCopy(
        {
          title: 'This executive title is deliberately much too long for the fixed title layout',
          subtitle: '',
        },
        'slide 4',
      ),
    /Keep <deck-exec-title>; shorten title to fit this component/,
  )
})
