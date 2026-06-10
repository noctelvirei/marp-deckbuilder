import { color, font, ptToIn } from '../brand.js'
import {
  addCell,
  addRect,
  addResourceImage,
  addSurfaceResourceImage,
  addTextBox,
  normalizePptxColors,
  svgToDataUri,
} from './helpers.js'

export function addCover(slide, model, frontmatter, brand, resourcesDir) {
  const layout = brand.layouts.cover
  addSlideChrome(slide, brand, resourcesDir, 'cover', 'dark', model)
  addLargeTextBox(slide, brand, model.title, layout.title)

  if (model.subtitle) addTextBox(slide, brand, model.subtitle, layout.subtitle)

  const presenter = frontmatter.presenter || {}
  if (presenter.name) addTextBox(slide, brand, presenter.name, layout.presenterName)
  if (presenter.role) addTextBox(slide, brand, presenter.role, layout.presenterRole)
}

export function addContent(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const body = contentBody(model)
  if (body) {
    const paragraphBox = boxAfterHeader(brand.layouts.body.paragraph, header.contentTop, 44)
    addTextBox(slide, brand, body, surfaceBox(brand, model, paragraphBox, 'body'), {
      breakLine: true,
      fit: 'shrink',
    })
  }
  addTakeaway(slide, model, brand)
}

function contentBody(model) {
  const parts = []
  if (model.subtitle) parts.push(model.subtitle)
  parts.push(...(model.paragraphs || []))
  if (model.bullets?.length) {
    parts.push(model.bullets.map((bullet) => `• ${bullet}`).join('\n'))
  }
  return parts.filter(Boolean).join('\n\n')
}

export function addDivider(slide, model, brand, resourcesDir) {
  const layout = brand.layouts.divider
  const divider = model.divider || {}
  const title = divider.title || model.title
  const subtitle = divider.subtitle || model.subtitle
  const titleBox = expandedTitleBox(title, layout.title)
  const subtitleBox = subtitle ? boxAfterTitle(titleBox, layout.subtitle) : layout.subtitle

  addSlideChrome(slide, brand, resourcesDir, 'divider', 'dark', model)
  if (divider.act) addTextBox(slide, brand, divider.act, layout.act)
  addLargeTextBox(slide, brand, title, titleBox)
  if (subtitle) {
    addTextBox(slide, brand, subtitle, subtitleBox, { fit: 'shrink' })
  }
}

export function addThreeStat(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const stats = model.stats.slice(0, 3)
  const layout = brand.layouts.stats

  for (let i = 0; i < stats.length; i += 1) {
    const x = layout.x[i]
    if (i > 0) {
      addRect(
        slide,
        brand,
        x - layout.dividerOffset,
        layout.divider.y,
        layout.divider.w,
        layout.divider.h,
        color(brand, layout.divider.color),
      )
    }

    addTextBox(slide, brand, stats[i].value, surfaceBox(brand, model, { ...layout.value, x, align: 'center' }, 'accent'))
    addTextBox(slide, brand, stats[i].label, {
      ...surfaceBox(brand, model, layout.label, 'body'),
      x,
      y: layout.value.y + layout.label.dy,
      align: 'center',
      fit: 'shrink',
    })
  }

  const context = model.paragraphs[0]
  if (context) addTextBox(slide, brand, context, surfaceBox(brand, model, { ...layout.context, align: 'center' }, 'body'))
  addTakeaway(slide, model, brand)
}

export function addCards(slide, model, brand, resourcesDir) {
  const headerInfo = addBaseHeader(slide, model, brand, resourcesDir)

  const cards = model.cards.slice(0, 4)
  const count = cards.length <= 3 ? 3 : 4
  const layout = brand.layouts.cards
  const gap = count === 3 ? layout.gap3 : layout.gap4
  const cardW = (brand.slide.widthPt - layout.margin * 2 - gap * (count - 1)) / count
  const yTop = Math.max(layout.yTop, headerInfo.contentTop)
  const cardH = Math.max(72, layout.yBottom - yTop)
  const header = count === 3 ? layout.header3 : layout.header4
  const body = count === 3 ? layout.body3 : layout.body4

  for (let i = 0; i < cards.length; i += 1) {
    const x = layout.margin + i * (cardW + gap)
    addRect(
      slide,
      brand,
      x,
      yTop,
      cardW,
      cardH,
      surfaceCardFill(brand, model),
      surfaceBorder(brand, model),
      0.5,
    )
    addRect(slide, brand, x, yTop, cardW, layout.topBarHeight, color(brand, 'blue'))
    const mediaBox = cardMediaBox(cards[i], x, yTop, header)
    if (mediaBox) {
      addResourceImage(slide, cards[i].media.src, resourcesDir, mediaBox, cards[i].media.alt || cards[i].header, { fit: 'contain' })
    }
    const headerXOffset = mediaBox ? mediaBox.w + 9 : 0
    addTextBox(slide, brand, cards[i].header, {
      ...surfaceBox(brand, model, header, 'heading'),
      x: x + header.dx + headerXOffset,
      y: yTop + header.dy,
      w: cardW - header.dx * 2 - headerXOffset,
      fit: 'shrink',
    })
    addTextBox(slide, brand, cards[i].body, {
      ...fitBoxInsideBottom(
        {
          ...surfaceBox(brand, model, body, 'body'),
          x: x + body.dx,
          y: yTop + body.dy,
          w: cardW - body.dx * 2,
        },
        yTop + cardH,
        body.bottomPad ?? 14,
      ),
      fit: 'shrink',
    })
  }

  addTakeaway(slide, model, brand)
}

function cardMediaBox(card, x, y, header) {
  if (!card?.media?.src) return null
  const isIcon = card.media.kind === 'icon'
  const size = isIcon ? 28 : 34
  return {
    x: x + header.dx,
    y: y + header.dy + 1,
    w: size,
    h: size,
  }
}

export function addChartSlide(pptx, slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)

  if (!model.chart) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.chart
  const chartBox = boxAfterHeader(layout, header.contentTop, 120)
  const chartType = model.chart.chartType === 'line' ? pptx.ChartType.line : pptx.ChartType.bar
  const chartData = [
    {
      name: model.chart.series || model.chart.title || 'Series 1',
      labels: model.chart.labels,
      values: model.chart.values,
    },
  ]

  slide.addChart(chartType, chartData, normalizePptxColors(brand, {
    x: ptToIn(chartBox.x),
    y: ptToIn(chartBox.y),
    w: ptToIn(chartBox.w),
    h: ptToIn(chartBox.h),
    showTitle: Boolean(model.chart.title),
    title: model.chart.title,
    titleFontFace: font(brand, layout.title.font),
    titleFontSize: layout.title.size,
    titleColor: surfaceTextColor(brand, model, layout.title.color, 'heading'),
    chartArea: {
      fill: { color: surfaceFill(brand, model, layout.chartAreaFill || 'cardLight') },
      border: { color: surfaceLine(brand, model, layout.chartAreaBorder || 'border'), pt: 0.5 },
      roundedCorners: false,
    },
    plotArea: {
      fill: { color: surfaceFill(brand, model, layout.plotAreaFill || layout.chartAreaFill || 'cardLight') },
      border: { color: surfaceLine(brand, model, layout.plotAreaBorder || 'border'), pt: 0.25 },
    },
    chartColors: layout.colors.map((chartColor) => color(brand, chartColor)),
    dataLabelColor: surfaceTextColor(brand, model, layout.dataLabel?.color || layout.valueAxis.color, 'body'),
    dataLabelFontFace: font(brand, layout.dataLabel?.font || layout.valueAxis.font),
    dataLabelFontSize: layout.dataLabel?.size || layout.valueAxis.size,
    showLegend: false,
    showValue: true,
    showCategoryName: true,
    catAxisLabelFontFace: font(brand, layout.categoryAxis.font),
    catAxisLabelFontSize: layout.categoryAxis.size,
    catAxisLabelColor: surfaceTextColor(brand, model, layout.categoryAxis.color, 'body'),
    valAxisLabelFontFace: font(brand, layout.valueAxis.font),
    valAxisLabelFontSize: layout.valueAxis.size,
    valAxisLabelColor: surfaceTextColor(brand, model, layout.valueAxis.color, 'muted'),
    valGridLine: { color: surfaceLine(brand, model, layout.gridLineColor), transparency: 0 },
    catGridLine: { color: 'FFFFFF', transparency: 100 },
    showCatName: true,
    showValAxis: true,
    showCatAxis: true,
    showLeaderLines: false,
  }))

  addTakeaway(slide, model, brand)
}

export function addVisual(slide, model, brand, resourcesDir) {
  const visual = model.visual
  if (!visual?.svg) return addContent(slide, model, brand, resourcesDir)

  const header = addBaseHeader(slide, model, brand, resourcesDir)

  const layout = brand.layouts.visual || {
    x: 62,
    y: 126,
    w: 836,
    h: 292,
    caption: { x: 84, y: 418, w: 792, h: 20, font: 'regular', size: 8, color: 'muted' },
  }
  const visualBox = boxAfterHeader(layout, header.contentTop, 120)
  try {
    slide.addImage({
      data: svgToDataUri(visual.svg),
      x: ptToIn(visualBox.x),
      y: ptToIn(visualBox.y),
      w: ptToIn(visualBox.w),
      h: ptToIn(visualBox.h),
      altText: visual.alt || visual.title || model.title,
    })
  } catch {
    if (visual.fallback) {
      addTextBox(slide, brand, visual.fallback, surfaceBox(brand, model, brand.layouts.body.paragraph, 'body'), { breakLine: true, fit: 'shrink' })
    }
  }

  if (visual.caption) {
    const captionBox = {
      ...layout.caption,
      y: Math.max(layout.caption.y, visualBox.y + visualBox.h + 8),
    }
    addTextBox(slide, brand, visual.caption, surfaceBox(brand, model, captionBox, 'muted'), { fit: 'shrink' })
  }

  addTakeaway(slide, model, brand)
}

export function addComparison(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const comparison = model.comparison
  if (!comparison) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.comparison
  const x = layout.x
  const y = Math.max(layout.y, header.contentTop)
  const headerH = layout.headerH
  const rowH = layout.rowH
  const colX = [x, x + layout.labelW, x + layout.labelW + layout.leftW]
  const colW = [layout.labelW, layout.leftW, layout.rightW]
  const rowFill = isLightSurface(model) ? lightToken(brand, 'rowFillLight', 'FDFDFD') : layout.rowFill
  const leftFill = isLightSurface(model) ? lightToken(brand, 'leftFillLight', 'FFF0F0') : layout.leftFill
  const rightFill = isLightSurface(model) ? lightToken(brand, 'rightFillLight', 'EEF6FE') : layout.rightFill
  const leftText = isLightSurface(model) ? lightToken(brand, 'leftTextLight', 'CC3333') : layout.leftText
  const rightText = isLightSurface(model) ? lightToken(brand, 'rightTextLight', '0A5FAB') : layout.rightText

  addCell(slide, brand, '', colX[0], y, colW[0], headerH, layout.headerFill, layout.headerText)
  addCell(slide, brand, comparison.leftTitle, colX[1], y, colW[1], headerH, layout.headerFill, layout.headerText)
  addCell(slide, brand, comparison.rightTitle, colX[2], y, colW[2], headerH, layout.headerFill, layout.headerText)

  comparison.rows.slice(0, 6).forEach((row, index) => {
    const rowY = y + headerH + index * rowH
    addCell(slide, brand, row.label, colX[0], rowY, colW[0], rowH, rowFill, surfaceBox(brand, model, layout.labelText, 'heading'))
    addCell(slide, brand, row.left, colX[1], rowY, colW[1], rowH, leftFill, {
      ...surfaceBox(brand, model, layout.cellText, 'body'),
      color: leftText,
    })
    addCell(slide, brand, row.right, colX[2], rowY, colW[2], rowH, rightFill, {
      ...surfaceBox(brand, model, layout.cellText, 'body'),
      color: rightText,
    })
  })

  addTakeaway(slide, model, brand)
}

export function addSwimlane(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const swimlane = model.swimlane
  if (!swimlane) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.swimlane
  const laneCount = Math.min(swimlane.lanes.length, layout.maxLanes || 4)
  const laneGap = layout.laneGap ?? inferLaneGap(layout)
  const contentTop = Math.max(header?.contentTop || 0, layout.laneY?.[0] || 0)
  const contentBottom = swimlaneBottom(model, brand, layout)
  const laneH = Math.max(
    layout.minLaneH || 56,
    Math.min(layout.laneH, (contentBottom - contentTop - laneGap * Math.max(0, laneCount - 1)) / Math.max(1, laneCount)),
  )

  swimlane.lanes.slice(0, laneCount).forEach((lane, laneIndex) => {
    const laneY = contentTop + laneIndex * (laneH + laneGap)
    const fill = swimlaneFill(brand, model, layout, lane.color)
    const accent = swimlaneAccent(brand, layout, lane.color)
    addRect(slide, brand, layout.x, laneY, layout.laneW, laneH, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
    addTextBox(slide, brand, lane.title, surfaceBox(brand, model, { ...layout.label, y: laneY + layout.label.dy }, 'heading'))

    const steps = lane.steps.slice(0, layout.maxSteps || 5)
    const stepCount = Math.max(1, steps.length)
    const stepW = (layout.laneW - 24 - layout.stepGap * (stepCount - 1)) / stepCount
    const stepY = laneY + Math.min(layout.stepYDy, Math.max(28, laneH - (layout.stepH || 74) - 12))
    const stepH = Math.max(layout.minStepH || 36, laneY + laneH - stepY - 12)
    steps.forEach((step, stepIndex) => {
      const stepX = layout.x + 12 + stepIndex * (stepW + layout.stepGap)
      addRect(slide, brand, stepX, stepY, stepW, stepH, fill, color(brand, 'border'), 0.4)
      addRect(slide, brand, stepX, stepY, 4, stepH, accent)
      const titleY = stepY + layout.stepPad + 1
      const titleH = Math.min(22, Math.max(12, stepH - layout.stepPad * 2))
      const bodyY = titleY + titleH + 5
      addTextBox(slide, brand, step.title, {
        ...fitBoxInsideBottom(
          {
            ...textBoxForFill(brand, model, layout.stepTitle, fill, 'heading'),
            x: stepX + layout.stepPad,
            y: titleY,
            w: stepW - layout.stepPad * 2,
            h: titleH,
          },
          stepY + stepH,
          8,
        ),
        fit: 'shrink',
      })
      if (step.body) {
        addTextBox(slide, brand, step.body, {
          ...fitBoxInsideBottom(
            {
              ...textBoxForFill(brand, model, layout.stepBody, fill, 'body'),
              x: stepX + layout.stepPad,
              y: bodyY,
              w: stepW - layout.stepPad * 2,
              h: Math.max(12, stepY + stepH - bodyY - layout.stepPad),
            },
            stepY + stepH,
            8,
          ),
          fit: 'shrink',
        })
      }
      if (stepIndex < steps.length - 1) {
        addTextBox(slide, brand, '>', {
          ...surfaceBox(brand, model, layout.arrow, 'muted'),
          x: stepX + stepW + 1,
          y: stepY + 25,
          w: layout.stepGap,
          h: 18,
          align: 'center',
        })
      }
    })
  })

  addTakeaway(slide, model, brand)
}

export function addProof(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const proof = model.proof
  if (!proof) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.proof
  const logoBox = boxAfterHeader(layout.logo, header.contentTop, 40)
  if (!addResourceImage(slide, proof.logo, resourcesDir, logoBox, proof.logoName || 'Proof logo', { fit: 'contain' }) && proof.logoName) {
    addRect(slide, brand, logoBox.x, logoBox.y, logoBox.w, logoBox.h, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
    addTextBox(slide, brand, proof.logoName, surfaceBox(brand, model, { ...logoBox, align: 'center', fit: 'shrink' }, 'heading'))
  }

  proof.stats.slice(0, 3).forEach((stat, index) => {
    const x = layout.stats.x[index]
    const valueBox = boxAfterHeader({ ...layout.stats.value, x, align: 'center' }, header.contentTop, 24)
    addTextBox(slide, brand, stat.value, surfaceBox(brand, model, valueBox, 'accent'))
    addTextBox(slide, brand, stat.label, {
      ...surfaceBox(brand, model, layout.stats.label, 'body'),
      x,
      y: valueBox.y + layout.stats.label.dy,
      align: 'center',
      fit: 'shrink',
    })
  })

  if (proof.context) addTextBox(slide, brand, proof.context, surfaceBox(brand, model, { ...boxAfterHeader(layout.context, header.contentTop, 40), fit: 'shrink' }, 'body'))
  if (proof.bridge) addTextBox(slide, brand, proof.bridge, surfaceBox(brand, model, { ...boxAfterHeader(layout.bridge, header.contentTop, 24), fit: 'shrink' }, 'body'))
  addTakeaway(slide, model, brand)
}

export function addNextSteps(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const nextSteps = model.nextSteps
  if (!nextSteps) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.nextSteps
  const startY = Math.max(layout.y, header.contentTop)
  nextSteps.steps.slice(0, 3).forEach((step, index) => {
    const rowY = startY + index * (layout.rowH + layout.gap)
    addRect(slide, brand, layout.x, rowY, layout.w, layout.rowH, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
    addRect(slide, brand, layout.x, rowY, layout.accentWidth, layout.rowH, color(brand, 'blue'))
    addRect(
      slide,
      brand,
      layout.x + layout.badge.xDy,
      rowY + layout.badge.yDy,
      layout.badge.w,
      layout.badge.h,
      color(brand, 'blue'),
    )
    addTextBox(slide, brand, String(index + 1), {
      ...layout.badge,
      x: layout.x + layout.badge.xDy,
      y: rowY + layout.badge.yDy + 5,
      align: 'center',
    })
    addTextBox(slide, brand, step.title, {
      ...fitBoxInsideBottom(
        {
          ...surfaceBox(brand, model, layout.title, 'heading'),
          x: layout.x + layout.title.xDy,
          y: rowY + layout.title.yDy,
        },
        rowY + layout.rowH,
        8,
      ),
      fit: 'shrink',
    })
    addTextBox(slide, brand, step.body, {
      ...fitBoxInsideBottom(
        {
          ...surfaceBox(brand, model, layout.body, 'body'),
          x: layout.x + layout.body.xDy,
          y: rowY + layout.body.yDy,
        },
        rowY + layout.rowH,
        8,
      ),
      fit: 'shrink',
    })
  })

  addTakeaway(slide, model, brand)
}

export function addLogoWall(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const logoWall = model.logoWall
  if (!logoWall) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.logoWall
  const startY = Math.max(layout.y, header.contentTop)
  logoWall.logos.slice(0, 12).forEach((logo, index) => {
    const col = index % layout.columns
    const row = Math.floor(index / layout.columns)
    const x = layout.x + col * (layout.tileW + layout.gapX)
    const y = startY + row * (layout.tileH + layout.gapY)
    addRect(slide, brand, x, y, layout.tileW, layout.tileH, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
    if (!addSurfaceResourceImage(
      slide,
      logo.image,
      resourcesDir,
      model.surface,
      { x: x + 18, y: y + 10, w: layout.tileW - 36, h: layout.tileH - 20 },
      logo.name,
      { fit: 'contain' },
    )) {
      addTextBox(slide, brand, logo.name, {
        ...surfaceBox(brand, model, layout.text, 'heading'),
        x: x + 12,
        y: y + 18,
        w: layout.tileW - 24,
        h: 24,
        align: 'center',
        fit: 'shrink',
      })
    }
  })

  addTakeaway(slide, model, brand)
}

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

export function addExecRows(slide, model, brand, resourcesDir) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execRows = model.execRows
  if (!execRows) return addContent(slide, model, brand, resourcesDir)

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

export function addExecCards(slide, model, brand, resourcesDir) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execCards = model.execCards
  if (!execCards) return addContent(slide, model, brand, resourcesDir)

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

export function addExecTimeline(slide, model, brand, resourcesDir) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execTimeline = model.execTimeline
  if (!execTimeline) return addContent(slide, model, brand, resourcesDir)

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

export function addExecMetrics(slide, model, brand, resourcesDir) {
  addExecutiveHeader(slide, model, brand, resourcesDir)
  const execMetrics = model.execMetrics
  if (!execMetrics) return addContent(slide, model, brand, resourcesDir)

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

export function addClose(slide, model, frontmatter, brand, resourcesDir) {
  const layout = brand.layouts.close
  const close = model.close || {}
  const presenter = frontmatter.presenter || {}
  addSlideChrome(slide, brand, resourcesDir, 'close', 'dark', model)
  addLargeTextBox(slide, brand, close.title || model.title || 'Thank you', expandedTitleBox(close.title || model.title || 'Thank you', layout.title))
  const name = close.name || presenter.name
  const role = close.role || presenter.role
  if (name) addTextBox(slide, brand, name, layout.name)
  if (role) addTextBox(slide, brand, role, layout.role)
}

function addLargeTextBox(slide, brand, text, box, options = {}) {
  const size = box.size || 48
  addTextBox(slide, brand, text, box, {
    breakLine: true,
    fit: 'shrink',
    lineSpacing: Math.ceil(size * 1.16),
    paraSpaceAfter: 0,
    ...options,
  })
}

function expandedTitleBox(text, box) {
  const lines = estimateWrappedLines(text, box)
  const lineHeight = Math.ceil((box.size || 48) * 1.16)
  return {
    ...box,
    h: Math.max(box.h, lines * lineHeight),
  }
}

function boxAfterTitle(titleBox, box) {
  return {
    ...box,
    y: Math.max(box.y, titleBox.y + titleBox.h + 16),
  }
}

function boxAfterHeader(box, contentTop, minHeight = 18) {
  const y = Math.max(box.y, contentTop)
  const originalBottom = box.y + box.h
  return {
    ...box,
    y,
    h: Math.max(minHeight, originalBottom - y),
  }
}

function estimateWrappedLines(text, box) {
  const size = box.size || 48
  const charsPerLine = Math.max(8, Math.floor((box.w || 760) / (size * 0.5)))
  return String(text || '')
    .split(/\r?\n/)
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0)
}

function addBaseHeader(slide, model, brand, resourcesDir) {
  addSlideChrome(slide, brand, resourcesDir, 'content', isLightSurface(model) ? 'white' : 'dark', model)
  const layout = brand.layouts.header
  const logoBox = brand.layouts.companyLogo || brand.layouts.logo || { x: 36, y: 21, w: 98, h: 24 }
  const titleBox = expandedTitleBox(model.title, layout.title)
  let contentTop = titleBox.y + titleBox.h + 18
  if (model.eyebrow) {
    const eyebrowBox = avoidBoxOverlap(layout.eyebrow, logoBox, 12)
    contentTop = Math.max(contentTop, eyebrowBox.y + eyebrowBox.h + 18)
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), surfaceBox(brand, model, eyebrowBox, 'accent'), { margin: 0 })
  }
  addTextBox(slide, brand, model.title, surfaceBox(brand, model, titleBox, 'heading'), { fit: 'shrink' })
  return { contentTop }
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

function execAccent(value = 'blue', index = 0) {
  const raw = String(value || '').trim()
  const alias = {
    cyan: 'lightBlue',
    lightblue: 'lightBlue',
    pink: 'red',
    magenta: 'red',
  }[raw.toLowerCase()]
  if (alias) return alias
  if (raw) return raw
  return index === 2 ? 'yellow' : 'blue'
}

function execSurface(model) {
  return isLightSurface(model) ? 'light' : 'dark'
}

function execHeadingToken(brand, model) {
  if (isLightSurface(model)) return lightToken(brand, 'headingLight', '090909')
  return brand.colors?.execHeading ? 'execHeading' : brand.colors?.white ? 'white' : 'FFFFFF'
}

function execCardFill(brand, model) {
  if (isLightSurface(model)) {
    return color(brand, brand.colors?.execCardLight ? 'execCardLight' : lightToken(brand, 'cardFillLight', 'FDFDFD'))
  }
  return color(brand, brand.colors?.execCard ? 'execCard' : brand.colors?.execCardDark ? 'execCardDark' : brand.colors?.cardDark ? 'cardDark' : '13213D')
}

function execBodyToken(brand, model) {
  if (isLightSurface(model)) return lightToken(brand, 'bodyLight', '444444')
  return brand.colors?.execBody ? 'execBody' : brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C9D2E8'
}

function execMutedToken(brand, model) {
  if (isLightSurface(model)) return lightToken(brand, 'mutedLight', '666666')
  return brand.colors?.execMuted ? 'execMuted' : brand.colors?.mutedOnDark ? 'mutedOnDark' : '8A95A8'
}

function addSlideChrome(slide, brand, resourcesDir, kind, fallbackColor, model = {}) {
  const surface = model.surface || (['cover', 'divider', 'close'].includes(kind) ? 'dark' : 'light')
  const background = backgroundForSurface(brand, kind, surface)

  addRect(slide, brand, 0, 0, brand.slide.widthPt, brand.slide.heightPt, surfaceBackgroundColor(brand, surface, fallbackColor))
  addResourceImage(
    slide,
    background,
    resourcesDir,
    { x: 0, y: 0, w: brand.slide.widthPt, h: brand.slide.heightPt },
    `${brand.name || 'Deck'} ${kind} background`,
  )

  const logoBox = brand.layouts.companyLogo || brand.layouts.logo || { x: 36, y: 21, w: 98, h: 24 }
  if (model.companyLogo?.src) {
    addSurfaceResourceImage(
      slide,
      model.companyLogo.src,
      resourcesDir,
      surface,
      logoBox,
      model.companyLogo.alt || `${brand.name || 'Brand'} logo`,
      { fit: 'contain' },
    )
  } else {
    const logo = brandLogoForSurface(brand, kind, surface)
    addResourceImage(slide, logo, resourcesDir, logoBox, `${brand.name || 'Brand'} logo`, { fit: 'contain' })
  }

  if (model.customerLogo?.src) {
    const customerLogoBox = brand.layouts.customerLogo || { x: 828, y: 21, w: 98, h: 24 }
    if (surface === 'dark' && customerLogoBackplateEnabled(brand)) {
      const backplate = logoBackplateBox(customerLogoBox)
      addRect(slide, brand, backplate.x, backplate.y, backplate.w, backplate.h, color(brand, 'white'))
    }
    addSurfaceResourceImage(
      slide,
      model.customerLogo.src,
      resourcesDir,
      surface,
      customerLogoBox,
      model.customerLogo.alt || 'Customer logo',
      { fit: 'contain' },
    )
  }
}

function avoidBoxOverlap(box, reservedBox, gap = 12) {
  if (!box || !reservedBox || !rectsOverlap(box, reservedBox)) return box
  const right = box.x + box.w
  const x = reservedBox.x + reservedBox.w + gap
  return {
    ...box,
    x,
    w: Math.max(24, right - x),
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

function isLightSurface(model) {
  return model?.surface === 'light'
}

function fitBoxInsideBottom(box, bottom, bottomPad = 8, minHeight = 10) {
  const maxHeight = Math.max(minHeight, bottom - box.y - bottomPad)
  return {
    ...box,
    h: Math.max(minHeight, Math.min(box.h ?? maxHeight, maxHeight)),
  }
}

function logoBackplateBox(box, padX = 6, padY = 3) {
  return {
    x: box.x - padX,
    y: box.y - padY,
    w: box.w + padX * 2,
    h: box.h + padY * 2,
  }
}

function customerLogoBackplateEnabled(brand = {}) {
  const value = brand.customerLogoBackplate ?? brand.assets?.customerLogoBackplate ?? false
  return value === true || ['true', 'yes', 'on', '1', 'chip', 'backplate'].includes(
    String(value || '').trim().toLowerCase(),
  )
}

function lightToken(brand, key, fallback) {
  return brand.colors?.[key] ? key : fallback
}

function surfaceTextToken(brand, model, current, role = 'body') {
  const key = String(current || '').toLowerCase()
  if (['blue', 'cyan', 'purple', 'green', 'red', 'orange', 'yellow', 'lightblue', 'primarypurple'].includes(key)) {
    return current
  }

  if (isLightSurface(model)) {
    if (role === 'accent') return current || 'blue'
    if (role === 'muted' || key === 'muted' || key === 'footnote') {
      return lightToken(brand, 'mutedLight', '666666')
    }
    if (role === 'heading' || isLightColor(color(brand, current))) {
      return lightToken(brand, 'headingLight', '090909')
    }
    return lightToken(brand, 'bodyLight', '444444')
  }

  if (role === 'accent') return current || 'blue'
  if (role === 'muted' || key === 'muted' || key === 'footnote') {
    return readableDarkSurfaceToken(brand, current, 'muted', 'C8D8F0')
  }
  if (role === 'heading') {
    return readableDarkSurfaceToken(brand, current, 'white', 'FFFFFF')
  }
  return readableDarkSurfaceToken(brand, current, 'body', 'C8D8F0')
}

function surfaceTextColor(brand, model, current, role = 'body') {
  return color(brand, surfaceTextToken(brand, model, current, role))
}

function surfaceBox(brand, model, box = {}, role = 'body') {
  if (!isLightSurface(model)) return box
  return {
    ...box,
    color: surfaceTextToken(brand, model, box.color, role),
  }
}

function textBoxForFill(brand, model, box = {}, fill, role = 'body') {
  const base = surfaceBox(brand, model, box, role)
  if (isDarkColor(fill)) {
    return {
      ...base,
      color: role === 'heading'
        ? (brand.colors?.white ? 'white' : 'FFFFFF')
        : (brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0'),
    }
  }
  if (isLightColor(fill)) {
    return {
      ...base,
      color: role === 'heading'
        ? lightToken(brand, 'headingLight', '090909')
        : lightToken(brand, 'bodyLight', '444444'),
    }
  }
  return base
}

function surfaceFillToken(brand, model, current, key = 'cardFillLight', fallback = 'FDFDFD') {
  if (!isLightSurface(model)) return current
  const token = String(current || '').toLowerCase()
  if (['blue', 'cyan', 'purple', 'green', 'red', 'orange', 'yellow', 'lightblue', 'primarypurple'].includes(token)) {
    return current
  }
  return lightToken(brand, key, fallback)
}

function surfaceFill(brand, model, current) {
  return color(brand, surfaceFillToken(brand, model, current))
}

function surfaceLine(brand, model, current) {
  if (!isLightSurface(model)) return color(brand, current)
  return color(brand, lightToken(brand, 'borderLight', 'DEDEDE'))
}

function surfaceCardFill(brand, model) {
  return color(brand, surfaceFillToken(brand, model, 'cardLight', 'cardFillLight', 'FDFDFD'))
}

function surfaceBorder(brand, model) {
  return surfaceLine(brand, model, 'border')
}

function surfaceBackgroundColor(brand, surface, fallbackColor) {
  if (surface === 'light') return color(brand, lightToken(brand, 'backgroundLight', 'FFFFFF'))
  return color(brand, fallbackColor)
}

function backgroundForSurface(brand, kind, surface) {
  const backgrounds = brand.assets?.backgrounds || {}
  if (surface === 'light') return backgrounds.light || backgrounds.contentLight || ''
  return (
    backgrounds[kind] ||
    (kind === 'divider' ? backgrounds.cover : '') ||
    (kind === 'close' ? backgrounds.cover : '') ||
    backgrounds.default ||
    ''
  )
}

function brandLogoForSurface(brand, kind, surface) {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  if (surface === 'light') {
    return logo.companyLight || logo.contentLight || logo.light || logo[kind] || logo.content || logo.default || ''
  }
  return (
    logo.companyDark ||
    logo.dark ||
    logo[kind] ||
    (kind === 'divider' ? logo.cover : '') ||
    (kind === 'close' ? logo.cover : '') ||
    logo.default ||
    ''
  )
}

function swimlaneFill(brand, model, layout, laneColor = 'blue') {
  const normalizedColor = normalizeLaneColor(laneColor)
  const configured = layout.fills?.[normalizedColor] || layout.fills?.[laneColor]
  if (configured) return color(brand, configured)
  return surfaceCardFill(brand, model)
}

function swimlaneAccent(brand, layout, laneColor = 'blue') {
  const normalizedColor = normalizeLaneColor(laneColor)
  const configured = layout.accents?.[normalizedColor] || layout.accents?.[laneColor] || (brand.colors?.[normalizedColor] ? normalizedColor : '') || layout.accents?.blue || 'blue'
  return color(brand, configured)
}

function normalizeLaneColor(laneColor = 'blue') {
  const token = String(laneColor || 'blue').trim()
  if (token === 'cyan') return 'lightBlue'
  return token
}

function inferLaneGap(layout) {
  if (layout.laneY?.length >= 2) {
    return Math.max(10, layout.laneY[1] - layout.laneY[0] - layout.laneH)
  }
  return 18
}

function swimlaneBottom(model, brand, layout) {
  if (layout.bottom) return layout.bottom
  const takeaway = brand.layouts?.takeaway
  if (model.takeaway && takeaway) return (model.footnote ? takeaway.footnoteY : takeaway.y) - 16
  return brand.slide.heightPt - 42
}

function readableDarkSurfaceToken(brand, current, preferredToken, fallbackHex) {
  if (!current || isDarkColor(color(brand, current))) {
    const preferred = brand.colors?.[preferredToken] ? preferredToken : fallbackHex
    return isDarkColor(color(brand, preferred)) ? fallbackHex : preferred
  }
  return current
}

function isDarkColor(value) {
  const rgb = hexRgb(value)
  if (!rgb) return false
  return relativeLuminance(rgb) < 0.35
}

function isLightColor(value) {
  const rgb = hexRgb(value)
  if (!rgb) return false
  return relativeLuminance(rgb) > 0.72
}

function hexRgb(value) {
  const match = String(value || '').match(/^#?([0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function addTakeaway(slide, model, brand) {
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
