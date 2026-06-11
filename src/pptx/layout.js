import { color } from '../brand.js'
import {
  addRect,
  addTextBox,
} from './helpers.js'
import {
  addSlideChrome,
  isLightSurface,
  lightToken,
  surfaceBox,
} from './surface.js'

export function addLargeTextBox(slide, brand, text, box, options = {}) {
  addTextBox(slide, brand, text, box, {
    breakLine: true,
    fit: 'shrink',
    paraSpaceAfter: 0,
    ...options,
  })
}

export function expandedTitleBox(text, box, options = {}) {
  const lines = estimateWrappedLines(text, box)
  const lineHeight = Math.ceil((box.size || 48) * 1.16)
  const expandedHeight = Math.max(box.h, lines * lineHeight)
  return {
    ...box,
    h: options.maxH ? Math.min(options.maxH, expandedHeight) : expandedHeight,
  }
}

export function boxAfterTitle(titleBox, box) {
  return {
    ...box,
    y: Math.max(box.y, titleBox.y + titleBox.h + 16),
  }
}

export function boxAfterHeader(box, contentTop, minHeight = 18) {
  const y = Math.max(box.y, contentTop)
  const originalBottom = box.y + box.h
  return {
    ...box,
    y,
    h: Math.max(minHeight, originalBottom - y),
  }
}

export function estimateWrappedLines(text, box) {
  const size = box.size || 48
  const charsPerLine = Math.max(8, Math.floor((box.w || 760) / (size * 0.5)))
  return String(text || '')
    .split(/\r?\n/)
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0)
}

export function addBaseHeader(slide, model, brand, resourcesDir) {
  addSlideChrome(slide, brand, resourcesDir, 'content', isLightSurface(model) ? 'white' : 'dark', model)
  const layout = brand.layouts.header
  const logoBox = brand.layouts.companyLogo || brand.layouts.logo || { x: 36, y: 21, w: 98, h: 24 }
  const titleBox = expandedTitleBox(model.title, layout.title, { maxH: 116 })
  let contentTop = titleBox.y + titleBox.h + 18
  if (model.eyebrow) {
    const eyebrowBox = avoidBoxOverlap(layout.eyebrow, logoBox, 12)
    contentTop = Math.max(contentTop, eyebrowBox.y + eyebrowBox.h + 18)
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), surfaceBox(brand, model, eyebrowBox, 'accent'), { margin: 0 })
  }
  addTextBox(slide, brand, model.title, surfaceBox(brand, model, titleBox, 'heading'), { breakLine: true, fit: 'shrink' })
  return { contentTop }
}

export function avoidBoxOverlap(box, reservedBox, gap = 12) {
  if (!box || !reservedBox || !rectsOverlap(box, reservedBox)) return box
  const right = box.x + box.w
  const x = reservedBox.x + reservedBox.w + gap
  return {
    ...box,
    x,
    w: Math.max(24, right - x),
  }
}

export function fitBoxInsideBottom(box, bottom, bottomPad = 8, minHeight = 10) {
  const maxHeight = Math.max(minHeight, bottom - box.y - bottomPad)
  return {
    ...box,
    h: Math.max(minHeight, Math.min(box.h ?? maxHeight, maxHeight)),
  }
}

export function inferLaneGap(layout) {
  if (layout.laneY?.length >= 2) {
    return Math.max(10, layout.laneY[1] - layout.laneY[0] - layout.laneH)
  }
  return 18
}

export function swimlaneBottom(model, brand, layout) {
  if (layout.bottom) return layout.bottom
  const takeaway = brand.layouts?.takeaway
  if (model.takeaway && takeaway) return (model.footnote ? takeaway.footnoteY : takeaway.y) - 16
  return brand.slide.heightPt - 42
}

export function addTakeaway(slide, model, brand) {
  if (!model.takeaway) return

  const layout = brand.layouts.takeaway
  const y = model.footnote ? layout.footnoteY : layout.y
  const takeawayFill = isLightSurface(model) ? lightToken(brand, 'takeawayFillLight', 'F0F4FA') : 'takeawayFill'
  addRect(slide, brand, 0, y, brand.slide.widthPt, layout.height, color(brand, takeawayFill))
  addRect(slide, brand, 0, y, layout.accentWidth, layout.height, color(brand, 'blue'))
  addTextBox(slide, brand, model.takeaway, {
    ...surfaceBox(brand, model, layout.text, 'heading'),
    y: y + layout.text.dy,
    margin: 0,
    fit: 'shrink',
  })

  if (model.footnote) {
    addTextBox(slide, brand, model.footnote, {
      ...surfaceBox(brand, model, layout.footnote, 'muted'),
      y: y + layout.footnote.dy,
      margin: 0,
    })
  }
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}
