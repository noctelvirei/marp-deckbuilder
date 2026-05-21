import { color, font, ptToIn } from '../brand.js'
import {
  addCell,
  addRect,
  addResourceImage,
  addTextBox,
  resolveResourcePath,
  svgToDataUri,
} from './helpers.js'

export function addCover(slide, model, frontmatter, brand, resourcesDir) {
  const layout = brand.layouts.cover
  addSlideChrome(slide, brand, resourcesDir, 'cover', 'dark')
  addLargeTextBox(slide, brand, model.title, layout.title)

  if (model.subtitle) addTextBox(slide, brand, model.subtitle, layout.subtitle)

  const presenter = frontmatter.presenter || {}
  if (presenter.name) addTextBox(slide, brand, presenter.name, layout.presenterName)
  if (presenter.role) addTextBox(slide, brand, presenter.role, layout.presenterRole)
}

export function addContent(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const body = contentBody(model)
  if (body) {
    addTextBox(slide, brand, body, brand.layouts.body.paragraph, {
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

  addSlideChrome(slide, brand, resourcesDir, 'divider', 'dark')
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

    addTextBox(slide, brand, stats[i].value, { ...layout.value, x, align: 'center' })
    addTextBox(slide, brand, stats[i].label, {
      ...layout.label,
      x,
      y: layout.value.y + layout.label.dy,
      align: 'center',
      fit: 'shrink',
    })
  }

  const context = model.paragraphs[0]
  if (context) addTextBox(slide, brand, context, { ...layout.context, align: 'center' })
  addTakeaway(slide, model, brand)
}

export function addCards(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)

  const cards = model.cards.slice(0, 4)
  const count = cards.length <= 3 ? 3 : 4
  const layout = brand.layouts.cards
  const gap = count === 3 ? layout.gap3 : layout.gap4
  const cardW = (brand.slide.widthPt - layout.margin * 2 - gap * (count - 1)) / count
  const cardH = layout.yBottom - layout.yTop
  const header = count === 3 ? layout.header3 : layout.header4
  const body = count === 3 ? layout.body3 : layout.body4

  for (let i = 0; i < cards.length; i += 1) {
    const x = layout.margin + i * (cardW + gap)
    addRect(
      slide,
      brand,
      x,
      layout.yTop,
      cardW,
      cardH,
      color(brand, 'cardLight'),
      color(brand, 'border'),
      0.5,
    )
    addRect(slide, brand, x, layout.yTop, cardW, layout.topBarHeight, color(brand, 'blue'))
    addTextBox(slide, brand, cards[i].header, {
      ...header,
      x: x + header.dx,
      y: layout.yTop + header.dy,
      w: cardW - header.dx * 2,
      fit: 'shrink',
    })
    addTextBox(slide, brand, cards[i].body, {
      ...body,
      x: x + body.dx,
      y: layout.yTop + body.dy,
      w: cardW - body.dx * 2,
      h: cardH - body.bottomPad,
      fit: 'shrink',
    })
  }

  addTakeaway(slide, model, brand)
}

export function addChartSlide(pptx, slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)

  if (!model.chart) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.chart
  const chartType = model.chart.chartType === 'line' ? pptx.ChartType.line : pptx.ChartType.bar
  const chartData = [
    {
      name: model.chart.series || model.chart.title || 'Series 1',
      labels: model.chart.labels,
      values: model.chart.values,
    },
  ]

  slide.addChart(chartType, chartData, {
    x: ptToIn(layout.x),
    y: ptToIn(layout.y),
    w: ptToIn(layout.w),
    h: ptToIn(layout.h),
    showTitle: Boolean(model.chart.title),
    title: model.chart.title,
    titleFontFace: font(brand, layout.title.font),
    titleFontSize: layout.title.size,
    titleColor: color(brand, layout.title.color),
    chartArea: {
      fill: { color: color(brand, layout.chartAreaFill || 'cardLight') },
      border: { color: color(brand, layout.chartAreaBorder || 'border'), pt: 0.5 },
      roundedCorners: false,
    },
    plotArea: {
      fill: { color: color(brand, layout.plotAreaFill || layout.chartAreaFill || 'cardLight') },
      border: { color: color(brand, layout.plotAreaBorder || 'border'), pt: 0.25 },
    },
    chartColors: layout.colors.map((chartColor) => color(brand, chartColor)),
    dataLabelColor: color(brand, layout.dataLabel?.color || layout.valueAxis.color),
    dataLabelFontFace: font(brand, layout.dataLabel?.font || layout.valueAxis.font),
    dataLabelFontSize: layout.dataLabel?.size || layout.valueAxis.size,
    showLegend: false,
    showValue: true,
    showCategoryName: true,
    catAxisLabelFontFace: font(brand, layout.categoryAxis.font),
    catAxisLabelFontSize: layout.categoryAxis.size,
    catAxisLabelColor: color(brand, layout.categoryAxis.color),
    valAxisLabelFontFace: font(brand, layout.valueAxis.font),
    valAxisLabelFontSize: layout.valueAxis.size,
    valAxisLabelColor: color(brand, layout.valueAxis.color),
    valGridLine: { color: color(brand, layout.gridLineColor), transparency: 0 },
    catGridLine: { color: 'FFFFFF', transparency: 100 },
    showCatName: true,
    showValAxis: true,
    showCatAxis: true,
    showLeaderLines: false,
  })

  addTakeaway(slide, model, brand)
}

export function addVisual(slide, model, brand, resourcesDir) {
  const visual = model.visual
  if (!visual?.svg) return addContent(slide, model, brand, resourcesDir)

  addBaseHeader(slide, model, brand, resourcesDir)

  const layout = brand.layouts.visual || {
    x: 62,
    y: 126,
    w: 836,
    h: 292,
    caption: { x: 84, y: 418, w: 792, h: 20, font: 'regular', size: 8, color: 'muted' },
  }
  try {
    slide.addImage({
      data: svgToDataUri(visual.svg),
      x: ptToIn(layout.x),
      y: ptToIn(layout.y),
      w: ptToIn(layout.w),
      h: ptToIn(layout.h),
      altText: visual.alt || visual.title || model.title,
    })
  } catch {
    if (visual.fallback) {
      addTextBox(slide, brand, visual.fallback, brand.layouts.body.paragraph, { breakLine: true, fit: 'shrink' })
    }
  }

  if (visual.caption) {
    addTextBox(slide, brand, visual.caption, layout.caption, { fit: 'shrink' })
  }

  addTakeaway(slide, model, brand)
}

export function addComparison(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const comparison = model.comparison
  if (!comparison) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.comparison
  const x = layout.x
  const y = layout.y
  const headerH = layout.headerH
  const rowH = layout.rowH
  const colX = [x, x + layout.labelW, x + layout.labelW + layout.leftW]
  const colW = [layout.labelW, layout.leftW, layout.rightW]

  addCell(slide, brand, '', colX[0], y, colW[0], headerH, layout.headerFill, layout.headerText)
  addCell(slide, brand, comparison.leftTitle, colX[1], y, colW[1], headerH, layout.headerFill, layout.headerText)
  addCell(slide, brand, comparison.rightTitle, colX[2], y, colW[2], headerH, layout.headerFill, layout.headerText)

  comparison.rows.slice(0, 6).forEach((row, index) => {
    const rowY = y + headerH + index * rowH
    addCell(slide, brand, row.label, colX[0], rowY, colW[0], rowH, layout.rowFill, layout.labelText)
    addCell(slide, brand, row.left, colX[1], rowY, colW[1], rowH, layout.leftFill, {
      ...layout.cellText,
      color: layout.leftText,
    })
    addCell(slide, brand, row.right, colX[2], rowY, colW[2], rowH, layout.rightFill, {
      ...layout.cellText,
      color: layout.rightText,
    })
  })

  addTakeaway(slide, model, brand)
}

export function addSwimlane(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const swimlane = model.swimlane
  if (!swimlane) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.swimlane
  swimlane.lanes.slice(0, 2).forEach((lane, laneIndex) => {
    const laneY = layout.laneY[laneIndex]
    const fill = color(brand, layout.fills[lane.color] || layout.fills.blue)
    const accent = color(brand, layout.accents[lane.color] || layout.accents.blue)
    addRect(slide, brand, layout.x, laneY, layout.laneW, layout.laneH, 'FDFDFD', color(brand, 'border'), 0.5)
    addTextBox(slide, brand, lane.title, { ...layout.label, y: laneY + layout.label.dy })

    const steps = lane.steps.slice(0, 5)
    const stepW = (layout.laneW - layout.stepGap * 4 - 24) / 5
    const stepY = laneY + layout.stepYDy
    steps.forEach((step, stepIndex) => {
      const stepX = layout.x + 12 + stepIndex * (stepW + layout.stepGap)
      addRect(slide, brand, stepX, stepY, stepW, layout.stepH, fill, color(brand, 'border'), 0.4)
      addRect(slide, brand, stepX, stepY, 4, layout.stepH, accent)
      addTextBox(slide, brand, step.title, {
        ...layout.stepTitle,
        x: stepX + layout.stepPad,
        y: stepY + 9,
        w: stepW - layout.stepPad * 2,
        h: 18,
        fit: 'shrink',
      })
      if (step.body) {
        addTextBox(slide, brand, step.body, {
          ...layout.stepBody,
          x: stepX + layout.stepPad,
          y: stepY + 31,
          w: stepW - layout.stepPad * 2,
          h: 34,
          fit: 'shrink',
        })
      }
      if (stepIndex < steps.length - 1) {
        addTextBox(slide, brand, '>', {
          ...layout.arrow,
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
  addBaseHeader(slide, model, brand, resourcesDir)
  const proof = model.proof
  if (!proof) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.proof
  const logoPath = resolveResourcePath(proof.logo, resourcesDir)
  if (logoPath) {
    slide.addImage({
      path: logoPath,
      x: ptToIn(layout.logo.x),
      y: ptToIn(layout.logo.y),
      w: ptToIn(layout.logo.w),
      h: ptToIn(layout.logo.h),
    })
  } else if (proof.logoName) {
    addRect(slide, brand, layout.logo.x, layout.logo.y, layout.logo.w, layout.logo.h, color(brand, 'cardLight'), color(brand, 'border'), 0.5)
    addTextBox(slide, brand, proof.logoName, { ...layout.logo, align: 'center', fit: 'shrink' })
  }

  proof.stats.slice(0, 3).forEach((stat, index) => {
    const x = layout.stats.x[index]
    addTextBox(slide, brand, stat.value, { ...layout.stats.value, x, align: 'center' })
    addTextBox(slide, brand, stat.label, {
      ...layout.stats.label,
      x,
      y: layout.stats.value.y + layout.stats.label.dy,
      align: 'center',
      fit: 'shrink',
    })
  })

  if (proof.context) addTextBox(slide, brand, proof.context, { ...layout.context, fit: 'shrink' })
  if (proof.bridge) addTextBox(slide, brand, proof.bridge, { ...layout.bridge, fit: 'shrink' })
  addTakeaway(slide, model, brand)
}

export function addNextSteps(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const nextSteps = model.nextSteps
  if (!nextSteps) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.nextSteps
  nextSteps.steps.slice(0, 3).forEach((step, index) => {
    const rowY = layout.y + index * (layout.rowH + layout.gap)
    addRect(slide, brand, layout.x, rowY, layout.w, layout.rowH, color(brand, 'cardLight'), color(brand, 'border'), 0.5)
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
      ...layout.title,
      x: layout.x + layout.title.xDy,
      y: rowY + layout.title.yDy,
      fit: 'shrink',
    })
    addTextBox(slide, brand, step.body, {
      ...layout.body,
      x: layout.x + layout.body.xDy,
      y: rowY + layout.body.yDy,
      fit: 'shrink',
    })
  })

  addTakeaway(slide, model, brand)
}

export function addLogoWall(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const logoWall = model.logoWall
  if (!logoWall) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.logoWall
  logoWall.logos.slice(0, 12).forEach((logo, index) => {
    const col = index % layout.columns
    const row = Math.floor(index / layout.columns)
    const x = layout.x + col * (layout.tileW + layout.gapX)
    const y = layout.y + row * (layout.tileH + layout.gapY)
    addRect(slide, brand, x, y, layout.tileW, layout.tileH, color(brand, 'cardLight'), color(brand, 'border'), 0.5)
    const logoPath = resolveResourcePath(logo.image, resourcesDir)
    if (logoPath) {
      slide.addImage({
        path: logoPath,
        x: ptToIn(x + 18),
        y: ptToIn(y + 10),
        w: ptToIn(layout.tileW - 36),
        h: ptToIn(layout.tileH - 20),
      })
    } else {
      addTextBox(slide, brand, logo.name, {
        ...layout.text,
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

export function addClose(slide, model, frontmatter, brand, resourcesDir) {
  const layout = brand.layouts.close
  const close = model.close || {}
  const presenter = frontmatter.presenter || {}
  addSlideChrome(slide, brand, resourcesDir, 'close', 'dark')
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

function estimateWrappedLines(text, box) {
  const size = box.size || 48
  const charsPerLine = Math.max(8, Math.floor((box.w || 760) / (size * 0.5)))
  return String(text || '')
    .split(/\r?\n/)
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.trim().length / charsPerLine)), 0)
}

function addBaseHeader(slide, model, brand, resourcesDir) {
  addSlideChrome(slide, brand, resourcesDir, 'content', 'white')
  const layout = brand.layouts.header
  if (model.eyebrow) {
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), layout.eyebrow, { margin: 0 })
  }
  addTextBox(slide, brand, model.title, layout.title, { fit: 'shrink' })
}

function addSlideChrome(slide, brand, resourcesDir, kind, fallbackColor) {
  const background =
    brand.assets?.backgrounds?.[kind] ||
    (kind === 'divider' ? brand.assets?.backgrounds?.cover : '') ||
    (kind === 'close' ? brand.assets?.backgrounds?.cover : '') ||
    brand.assets?.backgrounds?.default

  addRect(slide, brand, 0, 0, brand.slide.widthPt, brand.slide.heightPt, color(brand, fallbackColor))
  addResourceImage(
    slide,
    background,
    resourcesDir,
    { x: 0, y: 0, w: brand.slide.widthPt, h: brand.slide.heightPt },
    `${brand.name || 'Deck'} ${kind} background`,
  )

  const logo =
    brand.assets?.logo?.[kind] ||
    (kind === 'divider' ? brand.assets?.logo?.cover : '') ||
    (kind === 'close' ? brand.assets?.logo?.cover : '') ||
    brand.assets?.logo?.default ||
    brand.assets?.logo
  const logoBox = brand.layouts.logo || { x: 828, y: 21, w: 98, h: 24 }
  addResourceImage(slide, logo, resourcesDir, logoBox, `${brand.name || 'Brand'} logo`)
}

function addTakeaway(slide, model, brand) {
  if (!model.takeaway) return

  const layout = brand.layouts.takeaway
  const y = model.footnote ? layout.footnoteY : layout.y
  addRect(slide, brand, 0, y, brand.slide.widthPt, layout.height, color(brand, 'takeawayFill'))
  addRect(slide, brand, 0, y, layout.accentWidth, layout.height, color(brand, 'blue'))
  addTextBox(slide, brand, model.takeaway, {
    ...layout.text,
    y: y + layout.text.dy,
    margin: 0,
    fit: 'shrink',
  })

  if (model.footnote) {
    addTextBox(slide, brand, model.footnote, {
      ...layout.footnote,
      y: y + layout.footnote.dy,
      margin: 0,
    })
  }
}
