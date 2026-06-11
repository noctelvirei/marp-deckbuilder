import assert from 'node:assert/strict'
import { test } from 'node:test'

import { reportCss } from '../src/report/styles.js'

test('report style boundary owns report CSS and rich component print overrides', () => {
  const css = reportCss(
    {
      colors: {
        dark: '#010203',
        blue: '#123456',
      },
      fonts: {
        regular: 'Inter',
      },
      assets: {
        backgrounds: {
          content: 'resource:background.svg',
        },
      },
    },
    {},
    '/* Renderer-owned rich HTML components. */\n.deck-rich { color: white; }',
  )

  assert.match(css, /--report-dark: #010203/)
  assert.match(css, /font-family: "Inter"/)
  assert.match(css, /url\("resource:background\.svg"\)/)
  assert.match(css, /\.report-logo \{\s+position: absolute;\s+top: 34px;\s+left: 56px;/)
  assert.match(css, /\.report-customer-logo \{\s+position: absolute;\s+top: 34px;\s+right: 56px;/)
  assert.match(css, /Renderer-owned rich HTML components/)
  assert.match(css, /\.report-rich-block \.deck-rich/)
  assert.match(css, /@media print/)
})

test('dark report surfaces use readable dark-mode prose tokens', () => {
  const css = reportCss(
    {
      colors: {
        body: '444444',
        border: 'DEDEDE',
        muted: '888888',
      },
    },
    { surface: 'dark' },
  )

  assert.match(css, /--report-body: #C8D8F0/)
  assert.match(css, /--report-muted: #8B9AB5/)
  assert.match(css, /--report-border: #1E3A5F/)
})
