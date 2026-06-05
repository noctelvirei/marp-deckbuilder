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
  addSlideChrome(slide, brand, resourcesDir, 'cover', 'dark', model)
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
    addTextBox(slide, brand, body, surfaceBox(brand, model, brand.layouts.body.paragraph, 'body'), {
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
      surfaceCardFill(brand, model),
      surfaceBorder(brand, model),
      0.5,
    )
    addRect(slide, brand, x, layout.yTop, cardW, layout.topBarHeight, color(brand, 'blue'))
    const mediaBox = cardMediaBox(cards[i], x, layout.yTop, header)
    if (mediaBox) {
      addResourceImage(slide, cards[i].media.src, resourcesDir, mediaBox, cards[i].media.alt || cards[i].header)
    }
    const headerXOffset = mediaBox ? mediaBox.w + 9 : 0
    addTextBox(slide, brand, cards[i].header, {
      ...surfaceBox(brand, model, header, 'heading'),
      x: x + header.dx + headerXOffset,
      y: layout.yTop + header.dy,
      w: cardW - header.dx * 2 - headerXOffset,
      fit: 'shrink',
    })
    addTextBox(slide, brand, cards[i].body, {
      ...surfaceBox(brand, model, body, 'body'),
      x: x + body.dx,
      y: layout.yTop + body.dy,
      w: cardW - body.dx * 2,
      h: cardH - body.bottomPad,
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
      addTextBox(slide, brand, visual.fallback, surfaceBox(brand, model, brand.layouts.body.paragraph, 'body'), { breakLine: true, fit: 'shrink' })
    }
  }

  if (visual.caption) {
    addTextBox(slide, brand, visual.caption, surfaceBox(brand, model, layout.caption, 'muted'), { fit: 'shrink' })
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
  addBaseHeader(slide, model, brand, resourcesDir)
  const swimlane = model.swimlane
  if (!swimlane) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.swimlane
  const laneCount = Math.min(swimlane.lanes.length, layout.laneY?.length || 2)
  swimlane.lanes.slice(0, laneCount).forEach((lane, laneIndex) => {
    const laneY = layout.laneY[laneIndex]
    const fill = swimlaneFill(brand, model, layout, lane.color)
    const accent = swimlaneAccent(brand, layout, lane.color)
    addRect(slide, brand, layout.x, laneY, layout.laneW, layout.laneH, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
    addTextBox(slide, brand, lane.title, surfaceBox(brand, model, { ...layout.label, y: laneY + layout.label.dy }, 'heading'))

    const steps = lane.steps.slice(0, 5)
    const stepW = (layout.laneW - layout.stepGap * 4 - 24) / 5
    const stepY = laneY + layout.stepYDy
    steps.forEach((step, stepIndex) => {
      const stepX = layout.x + 12 + stepIndex * (stepW + layout.stepGap)
      addRect(slide, brand, stepX, stepY, stepW, layout.stepH, fill, color(brand, 'border'), 0.4)
      addRect(slide, brand, stepX, stepY, 4, layout.stepH, accent)
      addTextBox(slide, brand, step.title, {
        ...surfaceBox(brand, model, layout.stepTitle, 'heading'),
        x: stepX + layout.stepPad,
        y: stepY + 9,
        w: stepW - layout.stepPad * 2,
        h: 18,
        fit: 'shrink',
      })
      if (step.body) {
        addTextBox(slide, brand, step.body, {
          ...surfaceBox(brand, model, layout.stepBody, 'body'),
          x: stepX + layout.stepPad,
          y: stepY + 31,
          w: stepW - layout.stepPad * 2,
          h: 34,
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
    addRect(slide, brand, layout.logo.x, layout.logo.y, layout.logo.w, layout.logo.h, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
    addTextBox(slide, brand, proof.logoName, surfaceBox(brand, model, { ...layout.logo, align: 'center', fit: 'shrink' }, 'heading'))
  }

  proof.stats.slice(0, 3).forEach((stat, index) => {
    const x = layout.stats.x[index]
    addTextBox(slide, brand, stat.value, surfaceBox(brand, model, { ...layout.stats.value, x, align: 'center' }, 'accent'))
    addTextBox(slide, brand, stat.label, {
      ...surfaceBox(brand, model, layout.stats.label, 'body'),
      x,
      y: layout.stats.value.y + layout.stats.label.dy,
      align: 'center',
      fit: 'shrink',
    })
  })

  if (proof.context) addTextBox(slide, brand, proof.context, surfaceBox(brand, model, { ...layout.context, fit: 'shrink' }, 'body'))
  if (proof.bridge) addTextBox(slide, brand, proof.bridge, surfaceBox(brand, model, { ...layout.bridge, fit: 'shrink' }, 'body'))
  addTakeaway(slide, model, brand)
}

export function addNextSteps(slide, model, brand, resourcesDir) {
  addBaseHeader(slide, model, brand, resourcesDir)
  const nextSteps = model.nextSteps
  if (!nextSteps) return addContent(slide, model, brand, resourcesDir)

  const layout = brand.layouts.nextSteps
  nextSteps.steps.slice(0, 3).forEach((step, index) => {
    const rowY = layout.y + index * (layout.rowH + layout.gap)
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
      ...surfaceBox(brand, model, layout.title, 'heading'),
      x: layout.x + layout.title.xDy,
      y: rowY + layout.title.yDy,
      fit: 'shrink',
    })
    addTextBox(slide, brand, step.body, {
      ...surfaceBox(brand, model, layout.body, 'body'),
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
    addRect(slide, brand, x, y, layout.tileW, layout.tileH, surfaceCardFill(brand, model), surfaceBorder(brand, model), 0.5)
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
  if (model.eyebrow) {
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), surfaceBox(brand, model, layout.eyebrow, 'accent'), { margin: 0 })
  }
  addTextBox(slide, brand, model.title, surfaceBox(brand, model, layout.title, 'heading'), { fit: 'shrink' })
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

  const logo = brandLogoForSurface(brand, kind, surface)
  const logoBox = brand.layouts.companyLogo || brand.layouts.logo || { x: 36, y: 21, w: 98, h: 24 }
  addResourceImage(slide, logo, resourcesDir, logoBox, `${brand.name || 'Brand'} logo`)

  if (model.customerLogo?.src) {
    const customerLogoBox = brand.layouts.customerLogo || { x: 828, y: 21, w: 98, h: 24 }
    addResourceImage(slide, model.customerLogo.src, resourcesDir, customerLogoBox, model.customerLogo.alt || 'Customer logo')
  }
}

function isLightSurface(model) {
  return model?.surface === 'light'
}

function lightToken(brand, key, fallback) {
  return brand.colors?.[key] ? key : fallback
}

function surfaceTextToken(brand, model, current, role = 'body') {
  if (!isLightSurface(model)) return current
  const key = String(current || '').toLowerCase()
  if (['blue', 'cyan', 'purple', 'green', 'red', 'orange', 'yellow', 'lightblue', 'primarypurple'].includes(key)) {
    return current
  }
  if (role === 'accent') return current || 'blue'
  if (role === 'muted' || key === 'muted' || key === 'footnote') {
    return lightToken(brand, 'mutedLight', '666666')
  }
  if (role === 'heading' || key === 'white' || key === 'dark') {
    return lightToken(brand, 'headingLight', '090909')
  }
  return lightToken(brand, 'bodyLight', '444444')
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
  const configured = layout.fills?.[laneColor] || (brand.colors?.[laneColor] ? laneColor : '')
  if (configured) return color(brand, configured)
  return surfaceCardFill(brand, model)
}

function swimlaneAccent(brand, layout, laneColor = 'blue') {
  const configured = layout.accents?.[laneColor] || (brand.colors?.[laneColor] ? laneColor : '') || layout.accents?.blue || 'blue'
  return color(brand, configured)
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
