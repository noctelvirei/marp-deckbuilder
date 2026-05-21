import { color, font, ptToIn } from '../brand.js'
import {
  addCell,
  addRect,
  addTextBox,
  resolveResourcePath,
  svgToDataUri,
} from './helpers.js'

export function addCover(slide, model, frontmatter, brand) {
  const layout = brand.layouts.cover
  addRect(slide, brand, 0, 0, brand.slide.widthPt, brand.slide.heightPt, color(brand, 'dark'))
  addTextBox(slide, brand, model.title, layout.title)

  if (model.subtitle) addTextBox(slide, brand, model.subtitle, layout.subtitle)

  const presenter = frontmatter.presenter || {}
  if (presenter.name) addTextBox(slide, brand, presenter.name, layout.presenterName)
  if (presenter.role) addTextBox(slide, brand, presenter.role, layout.presenterRole)
}

export function addContent(slide, model, brand) {
  addBaseHeader(slide, model, brand)
  const body = model.paragraphs.join('\n\n')
  if (body) addTextBox(slide, brand, body, brand.layouts.body.paragraph, { breakLine: true })
  addTakeaway(slide, model, brand)
}

export function addDivider(slide, model, brand) {
  const layout = brand.layouts.divider
  const divider = model.divider || {}
  addRect(slide, brand, 0, 0, brand.slide.widthPt, brand.slide.heightPt, color(brand, 'dark'))
  if (divider.act) addTextBox(slide, brand, divider.act, layout.act)
  addTextBox(slide, brand, divider.title || model.title, layout.title, { fit: 'shrink' })
  if (divider.subtitle || model.subtitle) {
    addTextBox(slide, brand, divider.subtitle || model.subtitle, layout.subtitle, { fit: 'shrink' })
  }
}

export function addThreeStat(slide, model, brand) {
  addBaseHeader(slide, model, brand)
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

export function addCards(slide, model, brand) {
  addBaseHeader(slide, model, brand)

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

export function addChartSlide(pptx, slide, model, brand) {
  addBaseHeader(slide, model, brand)

  if (!model.chart) return addContent(slide, model, brand)

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
    chartColors: layout.colors.map((chartColor) => color(brand, chartColor)),
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

export function addVisual(slide, model, brand) {
  const visual = model.visual
  if (!visual?.svg) return addContent(slide, model, brand)

  addBaseHeader(slide, model, brand)

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

export function addComparison(slide, model, brand) {
  addBaseHeader(slide, model, brand)
  const comparison = model.comparison
  if (!comparison) return addContent(slide, model, brand)

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

export function addSwimlane(slide, model, brand) {
  addBaseHeader(slide, model, brand)
  const swimlane = model.swimlane
  if (!swimlane) return addContent(slide, model, brand)

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
  addBaseHeader(slide, model, brand)
  const proof = model.proof
  if (!proof) return addContent(slide, model, brand)

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

export function addNextSteps(slide, model, brand) {
  addBaseHeader(slide, model, brand)
  const nextSteps = model.nextSteps
  if (!nextSteps) return addContent(slide, model, brand)

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
  addBaseHeader(slide, model, brand)
  const logoWall = model.logoWall
  if (!logoWall) return addContent(slide, model, brand)

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

export function addClose(slide, model, frontmatter, brand) {
  const layout = brand.layouts.close
  const close = model.close || {}
  const presenter = frontmatter.presenter || {}
  addRect(slide, brand, 0, 0, brand.slide.widthPt, brand.slide.heightPt, color(brand, 'dark'))
  addTextBox(slide, brand, close.title || model.title || 'Thank you', layout.title, { fit: 'shrink' })
  const name = close.name || presenter.name
  const role = close.role || presenter.role
  if (name) addTextBox(slide, brand, name, layout.name)
  if (role) addTextBox(slide, brand, role, layout.role)
}

function addBaseHeader(slide, model, brand) {
  const layout = brand.layouts.header
  if (model.eyebrow) {
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), layout.eyebrow, { margin: 0 })
  }
  addTextBox(slide, brand, model.title, layout.title, { fit: 'shrink' })
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
