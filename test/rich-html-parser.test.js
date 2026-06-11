import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as cheerio from 'cheerio'

import { parseRichHtmlComponent } from '../src/components/rich-html-parser.js'

test('rich html parser boundary converts custom tags into renderer models', () => {
  const root = cheerio.load(`<root>
    <deck-comparison-reveal title="Compare" columns="Legacy,Lightico">
      <deck-rich-row feature="Digital completion" values="no,yes"></deck-rich-row>
    </deck-comparison-reveal>
    <deck-gauge value="91" label="CSAT">
      <deck-rich-metric value="88" unit="%" label="Resolution" progress="88" color="lightBlue"></deck-rich-metric>
    </deck-gauge>
  </root>`, { xmlMode: false })

  const comparison = parseRichHtmlComponent(root, root('deck-comparison-reveal').get(0), {
    slideNumber: 2,
    ordinal: 1,
  })
  const gauge = parseRichHtmlComponent(root, root('deck-gauge').get(0), {
    slideNumber: 2,
    ordinal: 2,
  })

  assert.equal(comparison.type, 'comparison-reveal')
  assert.deepEqual(comparison.columns, ['Legacy', 'Lightico'])
  assert.deepEqual(comparison.rows[0], { feature: 'Digital completion', values: ['no', 'yes'] })
  assert.equal(gauge.type, 'gauge')
  assert.equal(gauge.value, 91)
  assert.equal(gauge.metrics[0].color, 'cyan')
  assert.match(gauge.id, /^deck-rich-gauge-2-2$/)
})
