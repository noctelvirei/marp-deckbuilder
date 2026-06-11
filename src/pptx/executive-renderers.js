import { color, ptToIn } from '../brand.js'
import {
  addRect,
  addTextBox,
  normalizePptxColors,
} from './helpers.js'
import {
  addLargeTextBox,
  estimateWrappedLines,
  expandedTitleBox,
} from './layout.js'
import {
  addSlideChrome,
  execAccent,
  execBodyToken,
  execCardFill,
  execHeadingToken,
  execMutedToken,
  execSurface,
} from './surface.js'

export function addExecTitle(slide, model, brand, resourcesDir) {
  const execTitle = model.execTitle || {}
  addSlideChrome(slide, brand, resourcesDir, 'divider', execSurface(model) === 'light' ? 'white' : 'dark', model)
  if (execTitle.eyebrow) {
    addTextBox(slide, brand, execTitle.eyebrow.toUpperCase(), {
      x: 36,
      y: 132,
      w: 390,
      h: 26,
      font: 'regular',
      size: 20,
      color: execAccent(execTitle.accent || 'red'),
      margin: 0,
    })
  }
  const titleBox = expandedTitleBox(execTitle.title || model.title, {
    x: 36,
    y: 156,
    w: 720,
    h: 150,
    font: 'light',
    size: 68,
    color: execHeadingToken(brand, model),
    margin: 0,
  })
  addLargeTextBox(slide, brand, execTitle.title || model.title, titleBox)
  if (execTitle.subtitle) {
    const subtitleY = titleBox.y + titleBox.h + 22
    addTextBox(slide, brand, execTitle.subtitle, {
      x: 36,
      y: subtitleY,
      w: 760,
      h: Math.max(32, 405 - subtitleY),
      font: 'regular',
      size: 21,
      color: execMutedToken(brand, model),
      margin: 0,
      fit: 'shrink',
    })
  }
}

export function addExecRows(slide, model, brand, resourcesDir, fallbackContent = noop) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execRows = model.execRows
  if (!execRows) return fallbackContent(slide, model, brand, resourcesDir)

  const rows = execRows.rows.slice(0, 3)
  const rowX = 36
  const rowY = 160
  const rowGap = 14
  const rowH = 76
  const rowW = execRows.side ? 720 : 888

  rows.forEach((row, index) => {
    const y = rowY + index * (rowH + rowGap)
    const accent = execAccent(row.accent, index)
    addRect(slide, brand, rowX, y, rowW, rowH, execCardFill(brand, model), null)
    addRect(slide, brand, rowX, y, 6, rowH, color(brand, accent))
    addTextBox(slide, brand, row.label, execTextBox(60, y + 12, 88, 17, accent, 11, 'medium'))
    if (row.kicker) {
      addTextBox(slide, brand, row.kicker.toUpperCase(), execTextBox(60, y + 30, 92, 16, execMutedToken(brand, model), 8, 'medium'))
    }
    const titleLines = estimateWrappedLines(row.title, { w: 300, size: 18 })
    const titleH = Math.min(36, Math.max(22, titleLines * 21))
    addTextBox(slide, brand, row.title, execTextBox(170, y + 12, 300, titleH, execHeadingToken(brand, model), 18, 'medium', { fit: 'shrink' }))
    if (row.body) {
      const bodyY = y + 12 + titleH + 5
      addTextBox(slide, brand, row.body, execTextBox(170, bodyY, rowW - 220, Math.max(16, y + rowH - bodyY - 8), execMutedToken(brand, model), 12, 'regular', { fit: 'shrink' }))
    }
    if (row.note) {
      addTextBox(slide, brand, row.note, execTextBox(rowX + rowW - 105, y + 28, 90, 18, 'red', 10, 'regular', { italic: true }))
    }
  })

  if (execRows.side) addExecSide(slide, model, brand, execRows.side)
  addExecTakeaway(slide, model, brand, execRows.takeaway, execRows.takeawayAccent)
}

export function addExecCards(slide, model, brand, resourcesDir, fallbackContent = noop) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execCards = model.execCards
  if (!execCards) return fallbackContent(slide, model, brand, resourcesDir)

  if (execCards.intro) {
    addTextBox(slide, brand, execCards.intro, execTextBox(56, 132, 850, 24, execMutedToken(brand, model), 14, 'regular', { align: 'center' }))
  }

  const cards = execCards.cards.slice(0, execCards.columns === 4 ? 4 : execCards.columns === 2 ? 4 : 3)
  const columns = execCards.columns
  const grid = execCardGridGeometry(columns, execCards.variant)

  cards.forEach((card, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = grid.x + col * (grid.cardW + grid.gapX)
    const y = grid.y + row * (grid.cardH + grid.gapY)
    const accent = execAccent(card.accent, index)
    addRect(slide, brand, x, y, grid.cardW, grid.cardH, execCardFill(brand, model), null)
    addRect(slide, brand, x, y, 5, grid.cardH, color(brand, accent))
    addTextBox(slide, brand, card.label, execTextBox(x + 20, y + 18, 60, 20, accent, 12, 'medium'))
    if (card.title) {
      addTextBox(slide, brand, card.title, execTextBox(x + 28, y + 43, grid.cardW - 56, 32, execHeadingToken(brand, model), columns === 4 ? 18 : 20, 'medium', { align: columns === 4 ? 'center' : undefined, fit: 'shrink' }))
    }
    if (card.metric) {
      addTextBox(slide, brand, card.metric, execTextBox(x + 28, y + 90, grid.cardW - 56, 50, accent, columns === 4 ? 26 : 34, 'medium', { fit: 'shrink' }))
    }
    if (card.subtitle) {
      addTextBox(slide, brand, card.subtitle, execTextBox(x + 28, y + 138, grid.cardW - 56, 20, execMutedToken(brand, model), 10, 'regular', { fit: 'shrink' }))
    }
    if (card.body) {
      addTextBox(slide, brand, card.body, execTextBox(x + 28, y + (card.metric ? 164 : 90), grid.cardW - 56, grid.cardH - (card.metric ? 174 : 100), execBodyToken(brand, model), columns === 4 ? 13 : 15, 'regular', { fit: 'shrink', align: columns === 4 ? 'center' : undefined }))
    }
  })

  if (execCards.loopCaption) {
    addTextBox(slide, brand, execCards.loopCaption, execTextBox(36, 458, 888, 22, execMutedToken(brand, model), 11, 'regular', { italic: true, align: 'center', fit: 'shrink' }))
  }
  if (execCards.target) {
    addRect(slide, brand, 36, 448, 888, 60, color(brand, execAccent(execCards.targetAccent)), null)
    addTextBox(slide, brand, execCards.target, execTextBox(44, 464, 860, 30, 'dark', 22, 'medium', { fit: 'shrink' }))
  }
  addExecTakeaway(slide, model, brand, execCards.takeaway, execCards.takeawayAccent, execCards.target ? 488 : 445)
}

export function addExecTimeline(slide, model, brand, resourcesDir, fallbackContent = noop) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execTimeline = model.execTimeline
  if (!execTimeline) return fallbackContent(slide, model, brand, resourcesDir)

  const items = execTimeline.items.slice(0, 3)
  const xs = [50, 340, 630]
  addRect(slide, brand, 80, 240, 800, 2, color(brand, 'lightBlue'), null)

  items.forEach((item, index) => {
    const x = xs[index]
    const accent = execAccent(item.accent, index)
    addTextBox(slide, brand, item.year, execTextBox(x, 170, 260, 30, accent, 18, 'medium', { align: 'center' }))
    slide.addShape('ellipse', normalizePptxColors(brand, {
      x: ptToIn(x + 118),
      y: ptToIn(230),
      w: ptToIn(24),
      h: ptToIn(24),
      fill: { color: color(brand, accent) },
      line: { color: color(brand, accent), transparency: 100 },
    }))
    addTextBox(slide, brand, item.title, execTextBox(x, 270, 260, 28, execHeadingToken(brand, model), 17, 'medium'))
    addTextBox(slide, brand, item.body, execTextBox(x, 302, 250, 75, execMutedToken(brand, model), 12, 'regular', { fit: 'shrink' }))
  })

  addExecTakeaway(slide, model, brand, execTimeline.takeaway, execTimeline.takeawayAccent, 430, 64)
}

export function addExecMetrics(slide, model, brand, resourcesDir, fallbackContent = noop) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execMetrics = model.execMetrics
  if (!execMetrics) return fallbackContent(slide, model, brand, resourcesDir)

  const metrics = execMetrics.metrics.slice(0, 3)
  const metricW = 280
  const metricXs = [36, 340, 644]
  metrics.forEach((metric, index) => {
    const x = metricXs[index]
    const accent = execAccent(metric.accent, index)
    addRect(slide, brand, x, 150, metricW, 90, execCardFill(brand, model), null)
    addRect(slide, brand, x, 150, 4, 90, color(brand, accent))
    addTextBox(slide, brand, metric.value, execTextBox(x + 16, 162, metricW - 32, 46, accent === 'yellow' ? 'yellow' : execHeadingToken(brand, model), 34, 'medium', { fit: 'shrink' }))
    addTextBox(slide, brand, metric.label, execTextBox(x + 16, 210, metricW - 32, 22, execMutedToken(brand, model), 12, 'regular', { fit: 'shrink' }))
  })

  if (execMetrics.sectionTitle) {
    addTextBox(slide, brand, execMetrics.sectionTitle.toUpperCase(), execTextBox(36, 270, 400, 20, 'lightBlue', 10, 'medium'))
  }

  const panels = execMetrics.panels.slice(0, 2)
  panels.forEach((panel, index) => {
    const x = index === 0 ? 36 : 496
    const accent = execAccent(panel.accent, index)
    addRect(slide, brand, x, 300, 428, 150, execCardFill(brand, model), null)
    addRect(slide, brand, x, 300, 4, 150, color(brand, accent))
    if (panel.value) addTextBox(slide, brand, panel.value, execTextBox(x + 20, 316, 130, 50, accent, 30, 'medium', { fit: 'shrink' }))
    if (panel.title) addTextBox(slide, brand, panel.title, execTextBox(x + 160, 322, 250, 28, execHeadingToken(brand, model), 16, 'medium', { fit: 'shrink' }))
    if (panel.body) addTextBox(slide, brand, panel.body, execTextBox(x + 160, 354, 250, 56, execMutedToken(brand, model), 12, 'regular', { fit: 'shrink' }))
    if (panel.note) addTextBox(slide, brand, panel.note, execTextBox(x + 20, 410, 388, 24, execHeadingToken(brand, model), 10, 'regular', { fit: 'shrink', italic: true }))
  })

  addExecTakeaway(slide, model, brand, execMetrics.takeaway, execMetrics.takeawayAccent, 480)
}

function addExecutiveHeader(slide, model, brand, resourcesDir) {
  addSlideChrome(slide, brand, resourcesDir, 'content', execSurface(model) === 'light' ? 'white' : 'dark', model)
  const accent = execAccent(model.execTitle?.accent || model.execRows?.takeawayAccent || 'blue')
  addRect(slide, brand, 36, 50, 4, 56, color(brand, accent), null)
  if (model.eyebrow) {
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), execTextBox(56, 50, 400, 18, 'lightBlue', 10, 'medium'))
  }
  addTextBox(slide, brand, model.title, execTextBox(56, 70, 850, 50, execHeadingToken(brand, model), 28, 'medium', { fit: 'shrink' }))
}

function addExecSide(slide, model, brand, side) {
  addRect(slide, brand, 776, 160, 148, 256, execCardFill(brand, model), null)
  addRect(slide, brand, 776, 160, 4, 256, color(brand, execAccent(side.accent)), null)
  if (side.title) addTextBox(slide, brand, side.title.toUpperCase(), execTextBox(790, 178, 120, 21, execAccent(side.accent), 10, 'medium', { fit: 'shrink' }))
  if (side.value) addTextBox(slide, brand, side.value, execTextBox(790, 210, 120, 66, execAccent(side.accent), 38, 'medium', { fit: 'shrink' }))
  if (side.body) addTextBox(slide, brand, side.body, execTextBox(790, 290, 120, 86, execBodyToken(brand, model), 13, 'regular', { fit: 'shrink' }))
}

function addExecTakeaway(slide, model, brand, text, accent = 'blue', y = 445, h = 50) {
  if (!text) return
  addRect(slide, brand, 36, y, 888, h, execCardFill(brand, model), null)
  addRect(slide, brand, 36, y, 4, h, color(brand, execAccent(accent)), null)
  addTextBox(slide, brand, text, execTextBox(60, y + 12, 850, h - 18, execHeadingToken(brand, model), 13, 'regular', { italic: true, fit: 'shrink' }))
}

function execTextBox(x, y, w, h, textColor, size, fontName = 'regular', overrides = {}) {
  return {
    x,
    y,
    w,
    h,
    font: fontName,
    size,
    color: textColor,
    margin: 0,
    ...overrides,
  }
}

function execCardGridGeometry(columns, variant = 'cards') {
  if (columns === 4) {
    return { x: 36, y: 190, cardW: 200, cardH: 220, gapX: 22, gapY: 20 }
  }
  if (columns === 2 || variant === 'grid') {
    return { x: 36, y: 160, cardW: 426, cardH: 130, gapX: 16, gapY: 16 }
  }
  return { x: 50, y: 165, cardW: 268, cardH: 240, gapX: 24, gapY: 20 }
}

function noop() {}
