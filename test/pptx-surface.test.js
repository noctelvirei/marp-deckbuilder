import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  execAccent,
  execSurface,
  lightToken,
  surfaceBox,
  surfaceCardFill,
  surfaceLine,
  swimlaneAccent,
  swimlaneFill,
  textBoxForFill,
} from '../src/pptx/surface.js'

const brand = {
  colors: {
    cardFillLight: 'FAFBFC',
    borderLight: 'DDEEFF',
    headingLight: '101010',
    bodyLight: '333333',
    mutedLight: '777777',
    blue: '0F82F5',
    border: '1E3A5F',
    cardDark: '0D1D36',
    white: 'FFFFFF',
    bodyOnDark: 'C8D8F0',
  },
}

test('pptx surface boundary owns light-surface color decisions', () => {
  const model = { surface: 'light' }

  assert.equal(execSurface(model), 'light')
  assert.equal(execAccent('cyan'), 'lightBlue')
  assert.equal(execAccent('', 2), 'yellow')
  assert.equal(lightToken(brand, 'headingLight', '090909'), 'headingLight')
  assert.deepEqual(surfaceBox(brand, model, { color: 'body' }, 'heading'), { color: 'headingLight' })
  assert.equal(surfaceCardFill(brand, model), 'FAFBFC')
  assert.equal(surfaceLine(brand, model, 'border'), 'DDEEFF')
})

test('pptx surface boundary adapts text to filled swimlane cells', () => {
  const model = { surface: 'light' }
  const layout = {
    fills: {},
    accents: {
      blue: 'blue',
    },
  }

  assert.equal(swimlaneFill(brand, model, layout, 'cyan'), 'E9F9FF')
  assert.equal(swimlaneAccent(brand, layout, 'cyan'), '59D6FD')
  assert.deepEqual(textBoxForFill(brand, model, { color: 'body' }, '0D1D36', 'body'), {
    color: 'bodyOnDark',
  })
})
