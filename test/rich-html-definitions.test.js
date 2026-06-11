import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  richHtmlLayout,
  richHtmlParentTags,
  richHtmlTags,
  richHtmlTypeForTag,
} from '../src/components/rich-html-definitions.js'

test('rich html definitions expose tag aliases and layout mapping', () => {
  assert.equal(richHtmlTypeForTag('deck-rich-stats'), 'rich-stats')
  assert.equal(richHtmlTypeForTag('deck-metric-rings'), 'rich-stats')
  assert.equal(richHtmlTypeForTag('deck-rich-card'), '')
  assert.equal(richHtmlTags.has('deck-rich-card'), true)
  assert.equal(richHtmlParentTags.has('deck-rich-card'), false)
  assert.equal(richHtmlLayout({ rich: true, type: 'rich-cover' }), 'rich-cover')
  assert.equal(richHtmlLayout({ rich: true, type: 'gauge' }), 'rich-html')
  assert.equal(richHtmlLayout({ rich: true, type: 'rich-close' }), 'rich-close')
})
