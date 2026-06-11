import { color, font, ptToIn } from '../brand.js'
import {
  addCell,
  addRect,
  addResourceImage,
  addSurfaceResourceImage,
  addTextBox,
  containBox,
  normalizePptxColors,
  svgIntrinsicSize,
  svgToDataUri,
} from './helpers.js'
import {
  addBaseHeader,
  addLargeTextBox,
  addTakeaway,
  boxAfterHeader,
  boxAfterTitle,
  expandedTitleBox,
  fitBoxInsideBottom,
  inferLaneGap,
  swimlaneBottom,
} from './layout.js'
import {
  addExecCards as addExecCardsRenderer,
  addExecMetrics as addExecMetricsRenderer,
  addExecRows as addExecRowsRenderer,
  addExecTimeline as addExecTimelineRenderer,
  addExecTitle as addExecTitleRenderer,
} from './executive-renderers.js'
import {
  addSlideChrome,
  isLightSurface,
  lightToken,
  surfaceBorder,
  surfaceBox,
  surfaceCardFill,
  surfaceFill,
  surfaceLine,
  surfaceTextColor,
  swimlaneAccent,
  swimlaneFill,
  textBoxForFill,
} from './surface.js'

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
  const titleBox = expandedTitleBox(title, layout.title, { maxH: subtitle ? 190 : 250 })
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
  const renderedBox = containSvgBox(visual.svg, visualBox)
  try {
    slide.addImage({
      data: svgToDataUri(visual.svg),
      x: ptToIn(renderedBox.x),
      y: ptToIn(renderedBox.y),
      w: ptToIn(renderedBox.w),
      h: ptToIn(renderedBox.h),
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
      y: Math.max(layout.caption.y, renderedBox.y + renderedBox.h + 8),
    }
    addTextBox(slide, brand, visual.caption, surfaceBox(brand, model, captionBox, 'muted'), { fit: 'shrink' })
  }

  addTakeaway(slide, model, brand)
}

function containSvgBox(svg, box) {
  const size = svgIntrinsicSize(svg)
  if (!size?.width || !size?.height) return box
  return containBox(box, size.width, size.height)
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
  const compact = laneCount >= 3
  const laneGap = compact ? Math.min(layout.laneGap ?? inferLaneGap(layout), 14) : (layout.laneGap ?? inferLaneGap(layout))
  const stepGap = compact ? Math.min(layout.stepGap || 12, 10) : (layout.stepGap || 12)
  const stepPad = compact ? Math.min(layout.stepPad || 8, 7) : (layout.stepPad || 8)
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
    const stepW = (layout.laneW - 24 - stepGap * (stepCount - 1)) / stepCount
    const preferredStepH = compact ? Math.max(50, Math.min(layout.stepH || 74, laneH - 34)) : (layout.stepH || 74)
    const stepTopDy = compact ? Math.min(layout.stepYDy ?? 38, 28) : (layout.stepYDy ?? 38)
    const stepBottomPad = compact ? 8 : 12
    const stepY = laneY + Math.min(stepTopDy, Math.max(24, laneH - preferredStepH - stepBottomPad))
    const stepH = Math.max(layout.minStepH || 36, laneY + laneH - stepY - stepBottomPad)
    steps.forEach((step, stepIndex) => {
      const stepX = layout.x + 12 + stepIndex * (stepW + stepGap)
      addRect(slide, brand, stepX, stepY, stepW, stepH, fill, color(brand, 'border'), 0.4)
      addRect(slide, brand, stepX, stepY, 4, stepH, accent)
      const titleY = stepY + stepPad + 1
      const titleH = Math.min(compact ? 15 : 22, Math.max(12, stepH - stepPad * 2))
      const bodyY = titleY + titleH + (compact ? 3 : 5)
      addTextBox(slide, brand, step.title, {
        ...fitBoxInsideBottom(
          {
            ...textBoxForFill(brand, model, layout.stepTitle, fill, 'heading'),
            x: stepX + stepPad,
            y: titleY,
            w: stepW - stepPad * 2,
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
              x: stepX + stepPad,
              y: bodyY,
              w: stepW - stepPad * 2,
              h: Math.max(16, stepY + stepH - bodyY - stepPad),
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
          w: stepGap,
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
  return addExecTitleRenderer(slide, model, brand, resourcesDir)
}

export function addExecRows(slide, model, brand, resourcesDir) {
  return addExecRowsRenderer(slide, model, brand, resourcesDir, addContent)
}

export function addExecCards(slide, model, brand, resourcesDir) {
  return addExecCardsRenderer(slide, model, brand, resourcesDir, addContent)
}

export function addExecTimeline(slide, model, brand, resourcesDir) {
  return addExecTimelineRenderer(slide, model, brand, resourcesDir, addContent)
}

export function addExecMetrics(slide, model, brand, resourcesDir) {
  return addExecMetricsRenderer(slide, model, brand, resourcesDir, addContent)
}

export function addClose(slide, model, frontmatter, brand, resourcesDir) {
  const layout = brand.layouts.close
  const close = model.close || {}
  const presenter = frontmatter.presenter || {}
  addSlideChrome(slide, brand, resourcesDir, 'close', 'dark', model)
  addLargeTextBox(slide, brand, close.title || model.title || 'Thank you', expandedTitleBox(close.title || model.title || 'Thank you', layout.title, { maxH: 180 }))
  const name = close.name || presenter.name
  const role = close.role || presenter.role
  if (name) addTextBox(slide, brand, name, layout.name)
  if (role) addTextBox(slide, brand, role, layout.role)
}
