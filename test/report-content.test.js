import assert from 'node:assert/strict'
import { test } from 'node:test'

import { prepareReportContent } from '../src/report/content.js'

test('prepares report content as a boundary around markdown and rich tags', () => {
  const prepared = prepareReportContent(
    `# Executive Summary

## Volume

<deck-rich-bars title="Journey|Volume" labels="Q1,Q2">
  <deck-rich-series name="Cases" values="65,72" color="blue"></deck-rich-series>
</deck-rich-bars>

## Volume

Markdown body remains report content.
`,
    { resourcesDir: 'resources' },
  )

  assert.equal(prepared.titleFallback, 'Executive Summary')
  assert.deepEqual(prepared.toc, [
    { id: 'executive-summary', label: 'Executive Summary' },
    { id: 'volume', label: 'Volume' },
    { id: 'volume-2', label: 'Volume' },
  ])
  assert.match(prepared.content, /class="report-rich-block report-rich-bars"/)
  assert.match(prepared.content, /data-deck-rich-bars/)
  assert.doesNotMatch(prepared.content, /<deck-rich-bars\b/)
})

test('report content boundary rejects slide-only deck components', () => {
  assert.throws(
    () =>
      prepareReportContent(`<deck-card-grid>
  <deck-card title="Slide card"><p>This is a slide component.</p></deck-card>
</deck-card-grid>`),
    /Report mode supports Markdown plus renderer-owned rich HTML effect tags only/,
  )
})
