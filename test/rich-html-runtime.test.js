import assert from 'node:assert/strict'
import { test } from 'node:test'

import { richHtmlRuntimeScript } from '../src/rich-html-runtime.js'

test('rich html runtime composer emits one valid browser script', () => {
  const script = richHtmlRuntimeScript()

  assert.doesNotThrow(() => new Function(script))
  assert.match(script, /window\.deckRichHtml/)
  assert.match(script, /function initBook/)
  assert.match(script, /function initGauge/)
  assert.match(script, /function enterPrintMode/)
})
