import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  boxAfterHeader,
  boxAfterTitle,
  expandedTitleBox,
  fitBoxInsideBottom,
  inferLaneGap,
  swimlaneBottom,
} from '../src/pptx/layout.js'

test('pptx layout boundary owns text expansion and constrained boxes', () => {
  const title = expandedTitleBox('A deliberately long title that wraps across several projected lines', {
    x: 10,
    y: 20,
    w: 160,
    h: 30,
    size: 24,
  }, { maxH: 90 })

  assert.equal(title.h, 90)
  assert.deepEqual(boxAfterTitle(title, { x: 10, y: 70, w: 100, h: 20 }), {
    x: 10,
    y: 126,
    w: 100,
    h: 20,
  })
  assert.deepEqual(boxAfterHeader({ x: 10, y: 80, w: 100, h: 80 }, 110, 24), {
    x: 10,
    y: 110,
    w: 100,
    h: 50,
  })
  assert.deepEqual(fitBoxInsideBottom({ x: 0, y: 40, w: 100, h: 90 }, 100, 10, 12), {
    x: 0,
    y: 40,
    w: 100,
    h: 50,
  })
})

test('pptx layout boundary owns swimlane spacing and takeaway reservation', () => {
  assert.equal(inferLaneGap({ laneY: [100, 180], laneH: 60 }), 20)
  assert.equal(inferLaneGap({}), 18)
  assert.equal(swimlaneBottom(
    { takeaway: 'Next', footnote: true },
    { slide: { heightPt: 540 }, layouts: { takeaway: { footnoteY: 470, y: 490 } } },
    {},
  ), 454)
  assert.equal(swimlaneBottom(
    {},
    { slide: { heightPt: 540 }, layouts: {} },
    {},
  ), 498)
})
