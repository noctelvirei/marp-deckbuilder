import { color, font, hasSlideBackgroundAsset, ptToIn, slideBackgroundAsset } from '../brand.js'
import { renderBarChartSvg, renderGroupedBarChartSvg, renderStackedBarChartSvg } from '../charts-svg/bar.js'
import { renderDoughnutChartSvg } from '../charts-svg/doughnut.js'
import { renderAreaChartSvg, renderLineChartSvg } from '../charts-svg/line.js'
import { renderBubbleChartSvg, renderScatterChartSvg } from '../charts-svg/point.js'
import { selfContainedSvg } from '../charts-svg/styles.js'
import { renderBoxplotSvg } from '../components/boxplot.js'
import { renderBulletSvg } from '../components/bullet.js'
import { renderFunnelSvg, funnelPalette } from '../components/funnel.js'
import { renderHistogramSvg } from '../components/histogram.js'
import { renderImpactRadarSvg } from '../components/impact-radar.js'
import { renderJourneyPathSvg } from '../components/journey-path.js'
import { renderParetoSvg } from '../components/pareto.js'
import { renderRadarSvg } from '../components/radar.js'
import { renderSankeySvg } from '../components/sankey.js'
import { treemapRects } from '../components/treemap.js'
import { renderWaterfallSvg } from '../components/waterfall.js'
import {
  markPptxAnimationTargetsEnd,
  markPptxAnimationTargetsStart,
  markPptxChromeComplete,
} from './animation-targets.js'
import {
  addCell,
  addRect,
  addResourceImage,
  addSurfaceResourceImage,
  addTextBox,
  normalizePptxColors,
  svgIntrinsicSize,
  svgToDataUri,
} from './helpers.js'
import { DEFAULT_THEME } from '../charts-svg/core.js'

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
  if (isClickStaggerAnimation(model)) {
    addClickStaggerContent(slide, model, brand, header)
    return
  }

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

export function addTakeawayHero(slide, model, brand, resourcesDir) {
  addSlideChrome(slide, brand, resourcesDir, 'content', isLightSurface(model) ? 'white' : 'dark', model)
  const text = model.takeawayHero?.text || model.takeaway || model.title
  if (model.eyebrow) {
    addTextBox(slide, brand, model.eyebrow.toUpperCase(), surfaceBox(brand, model, {
      x: 120,
      y: 158,
      w: 720,
      h: 20,
      font: 'medium',
      size: 10,
      color: 'blue',
      align: 'center',
    }, 'accent'), { margin: 0 })
  }
  addLargeTextBox(slide, brand, text, surfaceBox(brand, model, {
    x: 112,
    y: 194,
    w: 736,
    h: 184,
    font: 'light',
    size: 38,
    color: isLightSurface(model) ? 'dark' : 'white',
    align: 'center',
    margin: 0,
    fit: 'shrink',
  }, 'heading'))
}

function addClickStaggerContent(slide, model, brand, header) {
  const entries = contentBodyEntries(model)
  if (!entries.length) {
    addTakeaway(slide, model, brand)
    return
  }

  const bodyBox = surfaceBox(
    brand,
    model,
    boxAfterHeader(brand.layouts.body.paragraph, header.contentTop, 44),
    'body',
  )
  const fontSize = bodyBox.size || 18
  const lineHeight = Math.ceil(fontSize * 1.35)
  const bottom = bodyBox.y + bodyBox.h
  let y = bodyBox.y

  markPptxAnimationTargetsStart(slide)
  for (const entry of entries) {
    const lines = estimateWrappedLines(entry.text, { ...bodyBox, size: fontSize })
    const h = Math.max(lineHeight, Math.min(bottom - y, lines * lineHeight))
    if (h <= 0) break
    addTextBox(slide, brand, entry.text, {
      ...bodyBox,
      y,
      h,
      margin: 0,
      fit: 'shrink',
    }, {
      breakLine: entry.type !== 'bullet',
    })
    y += h + (entry.type === 'bullet' ? 7 : 12)
    if (y >= bottom) break
  }
  markPptxAnimationTargetsEnd(slide)

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

function contentBodyEntries(model) {
  const entries = []
  if (model.subtitle) entries.push({ type: 'paragraph', text: model.subtitle })
  for (const paragraph of model.paragraphs || []) {
    entries.push({ type: 'paragraph', text: paragraph })
  }
  for (const bullet of model.bullets || []) {
    entries.push({ type: 'bullet', text: `• ${bullet}` })
  }
  return entries.filter((entry) => entry.text)
}

function isClickStaggerAnimation(model) {
  return model.animation?.trigger === 'on-click' && model.animation.sequence === 'stagger'
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
  const isGroupedBar = model.chart.chartType === 'grouped-bar'
  const isStackedBar = model.chart.chartType === 'stacked-bar'
  const isMultiSeriesBar = isGroupedBar || isStackedBar
  const isDoughnut = model.chart.chartType === 'doughnut'
  const isScatter = model.chart.chartType === 'scatter'
  const isBubble = model.chart.chartType === 'bubble'
  const isArea = model.chart.chartType === 'area'
  const isWaterfall = model.chart.chartType === 'waterfall'
  const isBullet = model.chart.chartType === 'bullet'
  const isHistogram = model.chart.chartType === 'histogram'
  const isBoxplot = model.chart.chartType === 'boxplot'
  const isPareto = model.chart.chartType === 'pareto'
  const isRadar = model.chart.chartType === 'radar'
  const isSankey = model.chart.chartType === 'sankey'
  // All chart types now render through the shared SSR-SVG renderers, embedded as
  // native vector SVG (crisp at any scale, matches the HTML deck). The native
  // pptxgenjs addChart path below remains only as a fallback for unknown types.
  const svgChartTypes = new Set([
    'line', 'area', 'bar', 'grouped-bar', 'stacked-bar', 'scatter', 'bubble', 'doughnut',
    'waterfall', 'bullet', 'histogram', 'boxplot', 'pareto', 'radar', 'sankey',
  ])
  const svgType = model.chart.chartType || 'bar'
  if (svgChartTypes.has(svgType)) {
    addSvgChartImage(slide, model, brand, layout, chartBox, svgType)
    addTakeaway(slide, model, brand)
    return
  }
  const chartType = model.chart.chartType === 'line'
    ? pptx.ChartType.line
    : isArea
      ? pptx.ChartType.area
      : isDoughnut
        ? pptx.ChartType.doughnut
        : isBubble
          ? pptx.ChartType.bubble
          : isScatter
            ? pptx.ChartType.scatter
        : pptx.ChartType.bar
  const chartData = isMultiSeriesBar
    ? model.chart.seriesNames.map((series, index) => ({
      name: series,
      labels: model.chart.labels,
      values: model.chart.matrix[index],
    }))
    : isBubble
      ? [
        {
          name: model.chart.xAxisLabel || 'X values',
          values: model.chart.points.map((point) => point.x),
        },
        {
          name: model.chart.series || model.chart.title || 'Series 1',
          values: model.chart.points.map((point) => point.y),
          sizes: model.chart.points.map((point) => point.r),
        },
      ]
      : isScatter
      ? [
        // pptxgenjs scatter: first series supplies the shared X values, the
        // next series the Y values (same shape as bubble above). A single
        // series with `labels` leaves no X data -> a blank/white chart.
        {
          name: model.chart.xAxisLabel || 'X',
          values: model.chart.points.map((point) => point.x),
        },
        {
          name: model.chart.series || model.chart.title || 'Series 1',
          values: model.chart.points.map((point) => point.y),
        },
      ]
    : [
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
    showLegend: isMultiSeriesBar || isDoughnut,
    showValue: !isMultiSeriesBar && !isDoughnut,
    showPercent: isDoughnut,
    showCategoryName: !isMultiSeriesBar && !isDoughnut,
    lineDataSymbol: isScatter ? 'circle' : undefined,
    lineDataSymbolSize: isScatter ? 8 : undefined,
    holeSize: isDoughnut ? 55 : undefined,
    barGrouping: isStackedBar ? 'stacked' : isGroupedBar ? 'clustered' : undefined,
    barOverlapPct: isMultiSeriesBar ? 0 : undefined,
    catAxisLabelFontFace: font(brand, layout.categoryAxis.font),
    catAxisLabelFontSize: layout.categoryAxis.size,
    catAxisLabelColor: surfaceTextColor(brand, model, layout.categoryAxis.color, 'body'),
    catAxisTitle: isScatter || isBubble ? model.chart.xAxisLabel || 'X' : undefined,
    catAxisTitleFontFace: font(brand, layout.categoryAxis.font),
    catAxisTitleFontSize: layout.categoryAxis.size,
    catAxisTitleColor: surfaceTextColor(brand, model, layout.categoryAxis.color, 'body'),
    valAxisLabelFontFace: font(brand, layout.valueAxis.font),
    valAxisLabelFontSize: layout.valueAxis.size,
    valAxisLabelColor: surfaceTextColor(brand, model, layout.valueAxis.color, 'muted'),
    valAxisTitle: isScatter || isBubble ? model.chart.yAxisLabel || 'Y' : undefined,
    valAxisTitleFontFace: font(brand, layout.valueAxis.font),
    valAxisTitleFontSize: layout.valueAxis.size,
    valAxisTitleColor: surfaceTextColor(brand, model, layout.valueAxis.color, 'body'),
    valGridLine: { color: surfaceLine(brand, model, layout.gridLineColor), transparency: 0 },
    catGridLine: { color: 'FFFFFF', transparency: 100 },
    showCatName: true,
    showValAxis: true,
    showCatAxis: true,
    showLeaderLines: false,
  }))

  if (isScatter || isBubble) {
    addScatterAxisLabels(slide, model, brand, layout, chartBox)
  }

  addTakeaway(slide, model, brand)
}

const NEW_SVG_CHART_TYPES = new Set([
  'line', 'area', 'bar', 'grouped-bar', 'stacked-bar', 'scatter', 'bubble', 'doughnut',
])

function addSvgChartImage(slide, model, brand, layout, chartBox, type) {
  const isNew = NEW_SVG_CHART_TYPES.has(type)
  const light = isLightSurface(model)
  const mode = light ? 'light' : 'dark'
  // New charts paint their own surface (DEFAULT_THEME) and are fitted at native
  // aspect; the card fill matches so card+chart are seamless and match the deck.
  // Old SVG charts keep their existing card + full-box sizing (unchanged).
  const fill = isNew
    ? DEFAULT_THEME[mode].surface.replace('#', '')
    : surfaceFill(brand, model, layout.chartAreaFill || 'cardLight')
  const line = surfaceLine(brand, model, layout.chartAreaBorder || 'border')
  addRect(slide, brand, chartBox.x, chartBox.y, chartBox.w, chartBox.h, fill, line, 0.5)

  const titleH = model.chart.title ? 28 : 0
  if (model.chart.title) {
    addTextBox(slide, brand, model.chart.title, {
      x: chartBox.x + 22,
      y: chartBox.y + 18,
      w: chartBox.w - 44,
      h: titleH,
      font: layout.title.font,
      size: layout.title.size,
      color: isNew && !light ? 'white' : layout.title.color,
      margin: 0,
      fit: 'shrink',
    })
  }

  const svgTop = chartBox.y + (model.chart.title ? 58 : 18)
  const sharedOptions = {
    cssVariables: false,
    mode,
    gridColor: svgColor(surfaceLine(brand, model, layout.gridLineColor || 'border')),
    axisColor: svgColor(surfaceTextColor(brand, model, layout.valueAxis.color, 'muted')),
    textColor: svgColor(surfaceTextColor(brand, model, layout.valueAxis.color, 'muted')),
  }
  const svg = renderSvgChartByType(type, model.chart, brand, model, layout, sharedOptions)

  const availW = chartBox.w - 36
  const availH = Math.max(150, chartBox.y + chartBox.h - svgTop - 18)
  let drawX = chartBox.x + 18
  let drawY = svgTop
  let drawW = availW
  let drawH = availH
  if (isNew) {
    // Fit the SVG at its native aspect ratio (no stretch), centred in the card.
    const size = svgIntrinsicSize(svg)
    const aspect = (size && size.width && size.height) ? size.width / size.height : availW / availH
    drawW = availW
    drawH = availW / aspect
    if (drawH > availH) { drawH = availH; drawW = availH * aspect }
    drawX = chartBox.x + 18 + (availW - drawW) / 2
    drawY = svgTop + (availH - drawH) / 2
  }
  slide.addImage({
    data: svgToDataUri(svg),
    x: ptToIn(drawX),
    y: ptToIn(drawY),
    w: ptToIn(drawW),
    h: ptToIn(drawH),
    altText: model.chart.title || model.title,
  })
}

function renderSvgChartByType(type, chart, brand, model, layout, sharedOptions) {
  // New shared SSR-SVG renderers: theme via mode + brand palette (matches the
  // deck), title suppressed (addSvgChartImage draws the title box), and the
  // structural CSS inlined so the SVG stands alone inside the PPTX.
  const mode = sharedOptions.mode
  const noTitle = { ...chart, title: '' }
  // background:true makes the SVG paint its own deck-matching surface, so it is
  // fully self-contained inside the PPTX picture frame.
  const opts = { cssVariables: false, mode, brand, background: true }
  if (type === 'line') return selfContainedSvg(renderLineChartSvg(noTitle, opts))
  if (type === 'area') return selfContainedSvg(renderAreaChartSvg(noTitle, opts))
  if (type === 'bar') return selfContainedSvg(renderBarChartSvg(noTitle, opts))
  if (type === 'grouped-bar') return selfContainedSvg(renderGroupedBarChartSvg(noTitle, opts))
  if (type === 'stacked-bar') return selfContainedSvg(renderStackedBarChartSvg(noTitle, opts))
  if (type === 'scatter') return selfContainedSvg(renderScatterChartSvg(noTitle, opts))
  if (type === 'bubble') return selfContainedSvg(renderBubbleChartSvg(noTitle, opts))
  if (type === 'doughnut') return selfContainedSvg(renderDoughnutChartSvg(noTitle, opts))
  if (type === 'waterfall') {
    return renderWaterfallSvg(chart, {
      ...sharedOptions,
      connectorColor: svgColor(surfaceTextColor(brand, model, layout.valueAxis.color, 'muted')),
      positiveColor: svgColor(color(brand, 'green')),
      negativeColor: svgColor(color(brand, 'red')),
    })
  }
  if (type === 'bullet') {
    return renderBulletSvg(chart, {
      ...sharedOptions,
      barColor: svgColor(color(brand, 'blue')),
      onBarColor: svgColor(color(brand, 'white')),
      targetColor: svgColor(color(brand, 'orange')),
      trackColor: svgColor(surfaceFill(brand, model, layout.plotAreaFill || layout.chartAreaFill || 'cardLight')),
    })
  }
  if (type === 'histogram') {
    return renderHistogramSvg(chart, {
      ...sharedOptions,
      barColor: svgColor(color(brand, 'purple')),
      barBorderColor: svgColor(color(brand, 'blue')),
    })
  }
  if (type === 'boxplot') {
    return renderBoxplotSvg(chart, {
      ...sharedOptions,
      boxColor: svgColor(color(brand, 'blue')),
      fillColor: svgColor(surfaceFill(brand, model, layout.plotAreaFill || layout.chartAreaFill || 'cardLight')),
      medianColor: svgColor(color(brand, 'orange')),
    })
  }
  if (type === 'pareto') {
    return renderParetoSvg(chart, {
      ...sharedOptions,
      barColor: svgColor(color(brand, 'blue')),
      barBorderColor: svgColor(color(brand, 'lightBlue')),
      lineColor: svgColor(color(brand, 'orange')),
      pointColor: svgColor(color(brand, 'orange')),
    })
  }
  if (type === 'radar') {
    return renderRadarSvg(chart, {
      ...sharedOptions,
      gridColor: svgColor(surfaceLine(brand, model, layout.plotAreaBorder || 'border')),
      fillColor: 'rgba(89, 214, 253, .20)',
      strokeColor: svgColor(color(brand, 'lightBlue')),
      pointColor: svgColor(color(brand, 'blue')),
    })
  }
  if (type === 'sankey') {
    return renderSankeySvg(chart, {
      ...sharedOptions,
      mutedColor: svgColor(surfaceTextColor(brand, model, layout.valueAxis.color, 'muted')),
      labelHaloColor: svgColor(surfaceFill(brand, model, layout.chartAreaFill || 'cardLight')),
      palette: layout.colors.map((chartColor) => svgColor(color(brand, chartColor))),
      linkOpacity: '0.52',
    })
  }
  throw new Error(`Unsupported SVG chart type: ${type}`)
}

function svgColor(value) {
  return typeof value === 'string' && /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : value
}

function addScatterAxisLabels(slide, model, brand, layout, chartBox) {
  const xAxisLabel = model.chart.xAxisLabel || 'X'
  const yAxisLabel = model.chart.yAxisLabel || 'Y'
  addTextBox(slide, brand, xAxisLabel, {
    x: chartBox.x + chartBox.w * 0.35,
    y: chartBox.y + chartBox.h - 14,
    w: chartBox.w * 0.3,
    h: 16,
    font: layout.categoryAxis.font,
    size: layout.categoryAxis.size,
    color: layout.categoryAxis.color,
    align: 'center',
    fit: 'shrink',
  })
  addTextBox(slide, brand, yAxisLabel, {
    x: chartBox.x + 4,
    y: chartBox.y + 8,
    w: chartBox.w * 0.24,
    h: 16,
    font: layout.valueAxis.font,
    size: layout.valueAxis.size,
    color: layout.valueAxis.color,
    align: 'left',
    fit: 'shrink',
  })
}

export function addSignalBars(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const signalBars = model.signalBars
  if (!signalBars) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 56,
    y: 138,
    leftW: 318,
    rightW: 530,
    h: 266,
    gap: 22,
    pad: 22,
    labelW: 96,
    valueW: 58,
    barH: 24,
    rowGap: 28,
    ...(brand.layouts.signalBars || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const panelFill = panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = color(brand, layout.panelBorder || '1E3A5F')
  const trackFill = color(brand, layout.trackFill || '071228')
  const accent = color(brand, signalBars.accent || layout.accent || 'blue')
  const bodyOnPanel = brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0'
  const mutedOnPanel = brand.colors?.mutedOnDark ? 'mutedOnDark' : '8A95A8'

  addRect(slide, brand, layout.x, y, layout.leftW, layout.h, panelFill, panelBorder, 0.5)
  addTextBox(slide, brand, signalBars.metric, {
    x: layout.x + layout.pad,
    y: y + 34,
    w: layout.leftW - layout.pad * 2,
    h: 62,
    font: 'medium',
    size: 48,
    color: signalBars.accent || 'blue',
    margin: 0,
    fit: 'shrink',
  })
  addTextBox(slide, brand, signalBars.metricLabel, {
    x: layout.x + layout.pad,
    y: y + 106,
    w: layout.leftW - layout.pad * 2,
    h: layout.h - 128,
    font: 'regular',
    size: 15,
    color: bodyOnPanel,
    margin: 0,
    breakLine: true,
    fit: 'shrink',
  })

  const rightX = layout.x + layout.leftW + layout.gap
  addRect(slide, brand, rightX, y, layout.rightW, layout.h, panelFill, panelBorder, 0.5)
  if (signalBars.title) {
    addTextBox(slide, brand, signalBars.title, {
      x: rightX + layout.pad,
      y: y + 30,
      w: layout.rightW - layout.pad * 2,
      h: 26,
      font: 'medium',
      size: 18,
      color: 'white',
      margin: 0,
      fit: 'shrink',
    })
  }
  if (signalBars.subtitle) {
    addTextBox(slide, brand, signalBars.subtitle, {
      x: rightX + layout.pad,
      y: y + 60,
      w: layout.rightW - layout.pad * 2,
      h: 30,
      font: 'regular',
      size: 11,
      color: mutedOnPanel,
      margin: 0,
      fit: 'shrink',
    })
  }

  const max = Math.max(...signalBars.values, 1)
  const rows = signalBars.labels.slice(0, 5)
  const rowStartY = y + (signalBars.title || signalBars.subtitle ? 108 : 54)
  const availableRowH = Math.max(layout.barH, y + layout.h - rowStartY - 22)
  const preferredRowStep = layout.barH + layout.rowGap
  const rowStep = rows.length > 1
    ? Math.min(preferredRowStep, (availableRowH - layout.barH) / (rows.length - 1))
    : preferredRowStep
  const barX = rightX + layout.pad + layout.labelW
  const barW = layout.rightW - layout.pad * 2 - layout.labelW - layout.valueW
  rows.forEach((label, index) => {
    const rowY = rowStartY + index * rowStep
    const value = signalBars.values[index] || 0
    const fillW = Math.max(3, Math.round((value / max) * barW))
    addTextBox(slide, brand, label, {
      x: rightX + layout.pad,
      y: rowY + 1,
      w: layout.labelW - 10,
      h: layout.barH,
      font: 'regular',
      size: 12,
      color: bodyOnPanel,
      margin: 0,
      fit: 'shrink',
    })
    addRect(slide, brand, barX, rowY, barW, layout.barH, trackFill, null)
    addRect(slide, brand, barX, rowY, fillW, layout.barH, accent, null)
    addTextBox(slide, brand, `${formatPptxNumber(value)}${signalBars.unit}`, {
      x: barX + fillW + 8,
      y: rowY + 2,
      w: Math.max(32, layout.valueW - 8),
      h: layout.barH - 2,
      font: 'medium',
      size: 12,
      color: 'white',
      margin: 0,
      fit: 'shrink',
    })
  })

  addTakeaway(slide, model, brand)
}

export function addOrchestration(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const orchestration = model.orchestration
  if (!orchestration) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 68,
    y: 140,
    w: 824,
    tierH: 56,
    layerH: 94,
    captionH: 44,
    gap: 16,
    pad: 20,
    nodeH: 24,
    nodeGap: 8,
    ...(brand.layouts.orchestration || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const lightSurface = isLightSurface(model)
  const panelFill = lightSurface ? surfaceCardFill(brand, model) : panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const nodeFill = lightSurface ? surfaceCardFill(brand, model) : panelFillForSurface(brand, model, layout.nodeFill || '0D1D36')
  const border = lightSurface ? surfaceBorder(brand, model) : color(brand, layout.panelBorder || '1E3A5F')
  const accent = color(brand, orchestration.accent || layout.accent || 'blue')
  const heading = lightSurface ? lightToken(brand, 'headingLight', '090909') : (brand.colors?.white ? 'white' : 'FFFFFF')
  const body = lightSurface ? lightToken(brand, 'bodyLight', '444444') : (brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0')
  const muted = lightSurface ? lightToken(brand, 'mutedLight', '666666') : (brand.colors?.mutedOnDark ? 'mutedOnDark' : '9FB5D9')

  const addTier = (label, nodes, tierY) => {
    addTextBox(slide, brand, label.toUpperCase(), {
      x: layout.x,
      y: tierY,
      w: layout.w,
      h: 14,
      font: 'medium',
      size: 8,
      color: muted,
      margin: 0,
      fit: 'shrink',
    })
    const nodeCount = Math.max(nodes.length, 1)
    const nodeW = Math.min(150, (layout.w - layout.nodeGap * (nodeCount - 1)) / nodeCount)
    nodes.forEach((node, index) => {
      const nodeX = layout.x + index * (nodeW + layout.nodeGap)
      addRect(slide, brand, nodeX, tierY + 24, nodeW, layout.nodeH, nodeFill, border, 0.5)
      addTextBox(slide, brand, node, {
        x: nodeX + 8,
        y: tierY + 29,
        w: nodeW - 16,
        h: 12,
        font: 'regular',
        size: 9,
        color: body,
        margin: 0,
        align: 'center',
        fit: 'shrink',
      })
    })
  }

  addTier(orchestration.upstreamLabel, orchestration.upstream, y)

  const layerY = y + layout.tierH + layout.gap
  addRect(slide, brand, layout.x, layerY, layout.w, layout.layerH, panelFill, accent, 0.5)
  addTextBox(slide, brand, orchestration.layer, {
    x: layout.x + layout.pad,
    y: layerY + 18,
    w: 190,
    h: 28,
    font: 'medium',
    size: 18,
    color: heading,
    margin: 0,
    fit: 'shrink',
  })
  addTextBox(slide, brand, orchestration.tagline, {
    x: layout.x + layout.pad + 205,
    y: layerY + 22,
    w: layout.w - layout.pad * 2 - 205,
    h: 20,
    font: 'regular',
    size: 12,
    color: orchestration.accent || 'blue',
    margin: 0,
    fit: 'shrink',
  })
  const capY = layerY + 56
  const caps = orchestration.capabilities.slice(0, 6)
  const capW = Math.min(190, (layout.w - layout.pad * 2 - layout.nodeGap * (caps.length - 1)) / Math.max(caps.length, 1))
  caps.forEach((capability, index) => {
    const capX = layout.x + layout.pad + index * (capW + layout.nodeGap)
    addRect(slide, brand, capX, capY, capW, 22, nodeFill, accent, 0.5)
    addTextBox(slide, brand, capability, {
      x: capX + 7,
      y: capY + 5,
      w: capW - 14,
      h: 12,
      font: 'regular',
      size: 8,
      color: heading,
      margin: 0,
      align: 'center',
      fit: 'shrink',
    })
  })

  const downstreamY = layerY + layout.layerH + layout.gap
  addTier(orchestration.downstreamLabel, orchestration.downstream, downstreamY)
  if (orchestration.caption) {
    addTextBox(slide, brand, orchestration.caption, {
      x: layout.x,
      y: downstreamY + layout.tierH + 8,
      w: layout.w * 0.72,
      h: layout.captionH,
      font: 'regular',
      size: 13,
      color: body,
      margin: 0,
      fit: 'shrink',
      breakLine: true,
    })
  }

  addTakeaway(slide, model, brand)
}

export function addSignalBoard(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const signalBoard = model.signalBoard
  if (!signalBoard) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 56,
    y: 138,
    leftW: 380,
    rightW: 468,
    h: 266,
    gap: 22,
    pad: 22,
    labelW: 96,
    valueW: 58,
    barH: 24,
    rowGap: 28,
    ...(brand.layouts.signalBoard || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const panelFill = panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = color(brand, layout.panelBorder || '1E3A5F')
  const trackFill = color(brand, layout.trackFill || '071228')
  const accent = color(brand, signalBoard.accent || layout.accent || 'blue')
  const headingOnPanel = brand.colors?.white ? 'white' : 'FFFFFF'
  const bodyOnPanel = brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0'
  const mutedOnPanel = brand.colors?.mutedOnDark ? 'mutedOnDark' : '8A95A8'

  addRect(slide, brand, layout.x, y, layout.leftW, layout.h, panelFill, panelBorder, 0.5)
  addTextBox(slide, brand, signalBoard.title, {
    x: layout.x + layout.pad,
    y: y + 28,
    w: layout.leftW - layout.pad * 2,
    h: 42,
    font: 'medium',
    size: 22,
    color: signalBoard.accent || 'blue',
    margin: 0,
    fit: 'shrink',
  })
  addTextBox(slide, brand, signalBoard.body, {
    x: layout.x + layout.pad,
    y: y + 82,
    w: layout.leftW - layout.pad * 2,
    h: 92,
    font: 'regular',
    size: 14,
    color: bodyOnPanel,
    margin: 0,
    breakLine: true,
    fit: 'shrink',
  })

  const tags = signalBoard.tags.slice(0, 5)
  const tagCols = tags.length > 2 ? 2 : 1
  const tagGap = 8
  const tagW = (layout.leftW - layout.pad * 2 - tagGap * (tagCols - 1)) / tagCols
  tags.forEach((tag, index) => {
    const row = Math.floor(index / tagCols)
    const col = index % tagCols
    const tagX = layout.x + layout.pad + col * (tagW + tagGap)
    const tagY = y + 188 + row * 30
    addRect(slide, brand, tagX, tagY, tagW, 22, color(brand, '071228'), accent, 0.5)
    addTextBox(slide, brand, tag, {
      x: tagX + 8,
      y: tagY + 4,
      w: tagW - 16,
      h: 14,
      font: 'medium',
      size: 8,
      color: headingOnPanel,
      margin: 0,
      fit: 'shrink',
      align: 'center',
    })
  })

  const rightX = layout.x + layout.leftW + layout.gap
  addRect(slide, brand, rightX, y, layout.rightW, layout.h, panelFill, panelBorder, 0.5)
  addTextBox(slide, brand, signalBoard.chartTitle, {
    x: rightX + layout.pad,
    y: y + 30,
    w: layout.rightW - layout.pad * 2,
    h: 26,
    font: 'medium',
    size: 18,
    color: headingOnPanel,
    margin: 0,
    fit: 'shrink',
  })

  const max = Math.max(...signalBoard.values, 1)
  const rows = signalBoard.labels.slice(0, 5)
  const rowStartY = y + 76
  const availableRowH = Math.max(layout.barH, y + layout.h - rowStartY - 22)
  const preferredRowStep = layout.barH + layout.rowGap
  const rowStep = rows.length > 1
    ? Math.min(preferredRowStep, (availableRowH - layout.barH) / (rows.length - 1))
    : preferredRowStep
  const barX = rightX + layout.pad + layout.labelW
  const barW = layout.rightW - layout.pad * 2 - layout.labelW - layout.valueW
  rows.forEach((label, index) => {
    const rowY = rowStartY + index * rowStep
    const value = signalBoard.values[index] || 0
    const fillW = Math.max(3, Math.round((value / max) * barW))
    addTextBox(slide, brand, label, {
      x: rightX + layout.pad,
      y: rowY + 1,
      w: layout.labelW - 10,
      h: layout.barH,
      font: 'regular',
      size: 12,
      color: bodyOnPanel,
      margin: 0,
      fit: 'shrink',
    })
    addRect(slide, brand, barX, rowY, barW, layout.barH, trackFill, null)
    addRect(slide, brand, barX, rowY, fillW, layout.barH, accent, null)
    addTextBox(slide, brand, `${formatPptxNumber(value)}${signalBoard.unit}`, {
      x: barX + barW + 8,
      y: rowY + 2,
      w: Math.max(32, layout.valueW - 8),
      h: layout.barH - 2,
      font: 'medium',
      size: 12,
      color: headingOnPanel,
      margin: 0,
      fit: 'shrink',
    })
  })

  addTakeaway(slide, model, brand)
}

export function addFunnel(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const funnel = model.funnel
  if (!funnel) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 74,
    y: 138,
    w: 812,
    h: 300,
    pad: 24,
    ...(brand.layouts.funnel || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const cardFill = surfaceCardFill(brand, model)
  const border = surfaceBorder(brand, model)
  const accent = color(brand, funnel.accent || 'blue')
  const lightSurface = isLightSurface(model)

  addRect(slide, brand, layout.x, y, layout.w, layout.h, cardFill, border, 0.5)

  const titleH = funnel.title ? 30 : 0
  if (funnel.title) {
    addTextBox(slide, brand, funnel.title, {
      ...surfaceBox(brand, model, {
        x: layout.x + layout.pad,
        y: y + 22,
        w: layout.w - layout.pad * 2,
        h: titleH,
        font: 'medium',
        size: 16,
        color: 'dark',
        margin: 0,
      }, 'heading'),
      fit: 'shrink',
    })
  }

  const svgY = y + layout.pad + titleH + (funnel.title ? 10 : 0)
  const svgH = Math.max(150, y + layout.h - svgY - layout.pad)
  const cardColorValue = cardFill && typeof cardFill === 'object' ? cardFill.color : cardFill
  const cardIsLight = isLightColor(cardColorValue)
  const svg = renderFunnelSvg(funnel, {
    cssVariables: false,
    mode: lightSurface ? 'light' : 'dark',
    accentColor: accent,
    onAccentColor: isLightColor(accent) ? color(brand, 'dark') : color(brand, 'white'),
    palette: funnelPalette(brand),
    // key labels render on the card surface: contrast against the actual card fill
    headingColor: cardIsLight ? color(brand, 'dark') : color(brand, 'white'),
    mutedColor: cardIsLight ? '6B7A90' : '8A95A8',
  })
  slide.addImage({
    data: svgToDataUri(svg),
    x: ptToIn(layout.x + layout.pad),
    y: ptToIn(svgY),
    w: ptToIn(layout.w - layout.pad * 2),
    h: ptToIn(svgH),
    altText: funnel.title || model.title,
  })

  addTakeaway(slide, model, brand)
}

export function addMetricTrend(pptx, slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const metricTrend = model.metricTrend
  if (!metricTrend) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 56,
    y: 138,
    leftW: 318,
    rightW: 530,
    h: 266,
    gap: 22,
    pad: 22,
    chartTop: 72,
    chartBottomPad: 24,
    ...(brand.layouts.metricTrend || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const panelFill = panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = color(brand, layout.panelBorder || '1E3A5F')
  const accent = color(brand, metricTrend.accent || layout.accent || 'blue')
  const bodyOnPanel = brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0'
  const mutedOnPanel = brand.colors?.mutedOnDark ? 'mutedOnDark' : '8A95A8'

  addRect(slide, brand, layout.x, y, layout.leftW, layout.h, panelFill, panelBorder, 0.5)
  addTextBox(slide, brand, metricTrend.metric, {
    x: layout.x + layout.pad,
    y: y + 48,
    w: layout.leftW - layout.pad * 2,
    h: 68,
    font: 'medium',
    size: 50,
    color: metricTrend.accent || 'blue',
    margin: 0,
    fit: 'shrink',
  })
  addTextBox(slide, brand, metricTrend.metricLabel, {
    x: layout.x + layout.pad,
    y: y + 126,
    w: layout.leftW - layout.pad * 2,
    h: layout.h - 148,
    font: 'regular',
    size: 15,
    color: bodyOnPanel,
    margin: 0,
    breakLine: true,
    fit: 'shrink',
  })

  const rightX = layout.x + layout.leftW + layout.gap
  addRect(slide, brand, rightX, y, layout.rightW, layout.h, panelFill, panelBorder, 0.5)
  addTextBox(slide, brand, metricTrend.title || 'Trend', {
    x: rightX + layout.pad,
    y: y + 30,
    w: layout.rightW - layout.pad * 2,
    h: 26,
    font: 'medium',
    size: 18,
    color: 'white',
    margin: 0,
    fit: 'shrink',
  })

  slide.addChart(pptx.ChartType.line, [
    {
      name: metricTrend.title || metricTrend.metricLabel || 'Trend',
      labels: metricTrend.labels,
      values: metricTrend.values,
    },
  ], normalizePptxColors(brand, {
    x: ptToIn(rightX + layout.pad),
    y: ptToIn(y + layout.chartTop),
    w: ptToIn(layout.rightW - layout.pad * 2),
    h: ptToIn(layout.h - layout.chartTop - layout.chartBottomPad),
    showTitle: false,
    chartArea: {
      fill: { color: '0D1D36', transparency: 100 },
      border: { color: '0D1D36', transparency: 100 },
    },
    plotArea: {
      fill: { color: '0D1D36', transparency: 100 },
      border: { color: '1E3A5F', transparency: 55 },
    },
    chartColors: [accent],
    showLegend: false,
    showValue: false,
    showCategoryName: true,
    catAxisLabelFontFace: font(brand, 'regular'),
    catAxisLabelFontSize: 8,
    catAxisLabelColor: color(brand, mutedOnPanel),
    valAxisLabelFontFace: font(brand, 'regular'),
    valAxisLabelFontSize: 8,
    valAxisLabelColor: color(brand, mutedOnPanel),
    valGridLine: { color: '1E3A5F', transparency: 25 },
    catGridLine: { color: 'FFFFFF', transparency: 100 },
    showCatAxis: true,
    showValAxis: true,
    showLeaderLines: false,
  }))

  addTextBox(slide, brand, `${formatPptxNumber(metricTrend.values.at(-1) || 0)}${metricTrend.unit}`, {
    x: rightX + layout.rightW - layout.pad - 82,
    y: y + 34,
    w: 82,
    h: 22,
    font: 'medium',
    size: 13,
    color: metricTrend.accent || 'blue',
    margin: 0,
    fit: 'shrink',
    align: 'right',
  })

  addTakeaway(slide, model, brand)
}

export function addHeatmap(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const heatmap = model.heatmap
  if (!heatmap) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 68,
    y: 136,
    w: 824,
    h: 284,
    pad: 18,
    labelW: 56,
    columnLabelH: 18,
    gap: 4,
    titleH: 22,
    ...(brand.layouts.heatmap || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const lightSurface = isLightSurface(model)
  const panelFill = lightSurface ? surfaceCardFill(brand, model) : panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = lightSurface ? surfaceBorder(brand, model) : color(brand, layout.panelBorder || '1E3A5F')
  const headingToken = lightSurface ? lightToken(brand, 'headingLight', '090909') : 'white'
  const mutedToken = lightSurface ? lightToken(brand, 'mutedLight', '666666') : (brand.colors?.mutedOnDark ? 'mutedOnDark' : '9FB5D9')
  const cellTextToken = lightSurface ? lightToken(brand, 'headingLight', '090909') : 'white'
  const accent = color(brand, heatmap.accent || 'blue')
  const values = heatmap.values.flat()
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const titleOffset = heatmap.title ? layout.titleH + 14 : 0
  const gridX = layout.x + layout.pad
  const gridY = y + layout.pad + titleOffset
  const gridW = layout.w - layout.pad * 2
  const gridH = layout.h - layout.pad * 2 - titleOffset - (heatmap.caption ? 24 : 0)
  const columnCount = heatmap.xLabels.length
  const rowCount = heatmap.yLabels.length
  const cellW = (gridW - layout.labelW - layout.gap * columnCount) / columnCount
  const cellH = (gridH - layout.columnLabelH - layout.gap * rowCount) / rowCount

  addRect(slide, brand, layout.x, y, layout.w, layout.h, panelFill, panelBorder, 0.5)

  if (heatmap.title) {
    addTextBox(slide, brand, heatmap.title, {
      x: layout.x + layout.pad,
      y: y + layout.pad,
      w: layout.w - layout.pad * 2,
      h: layout.titleH,
      font: 'medium',
      size: 14,
      color: headingToken,
      margin: 0,
      fit: 'shrink',
    })
  }

  heatmap.xLabels.forEach((label, columnIndex) => {
    const x = gridX + layout.labelW + layout.gap + columnIndex * (cellW + layout.gap)
    addTextBox(slide, brand, label, {
      x,
      y: gridY,
      w: cellW,
      h: layout.columnLabelH,
      font: 'medium',
      size: 7,
      color: mutedToken,
      margin: 0,
      align: 'center',
      fit: 'shrink',
    })
  })

  heatmap.yLabels.forEach((label, rowIndex) => {
    const rowY = gridY + layout.columnLabelH + layout.gap + rowIndex * (cellH + layout.gap)
    addTextBox(slide, brand, label, {
      x: gridX,
      y: rowY + Math.max(0, (cellH - 12) / 2),
      w: layout.labelW - 6,
      h: 12,
      font: 'medium',
      size: 7,
      color: mutedToken,
      margin: 0,
      align: 'right',
      fit: 'shrink',
    })
    heatmap.values[rowIndex].forEach((value, columnIndex) => {
      const x = gridX + layout.labelW + layout.gap + columnIndex * (cellW + layout.gap)
      addRect(
        slide,
        brand,
        x,
        rowY,
        cellW,
        cellH,
        { color: accent, transparency: heatmapCellTransparency(value, min, range) },
        lightSurface ? color(brand, lightToken(brand, 'borderLight', 'DEDEDE')) : 'FFFFFF',
        0.25,
      )
      addTextBox(slide, brand, `${formatPptxNumber(value)}${heatmap.unit}`, {
        x: x + 2,
        y: rowY + Math.max(0, (cellH - 10) / 2),
        w: cellW - 4,
        h: 10,
        font: 'medium',
        size: 6,
        color: cellTextToken,
        margin: 0,
        align: 'center',
        fit: 'shrink',
      })
    })
  })

  if (heatmap.caption) {
    addTextBox(slide, brand, heatmap.caption, {
      x: layout.x + layout.pad,
      y: y + layout.h - layout.pad - 12,
      w: layout.w - layout.pad * 2,
      h: 12,
      font: 'regular',
      size: 7,
      color: mutedToken,
      margin: 0,
      fit: 'shrink',
    })
  }

  addTakeaway(slide, model, brand)
}

export function addTreemap(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const treemap = model.treemap
  if (!treemap) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 68,
    y: 136,
    w: 824,
    h: 284,
    pad: 18,
    titleH: 22,
    gap: 5,
    ...(brand.layouts.treemap || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const lightSurface = isLightSurface(model)
  const panelFill = lightSurface ? surfaceCardFill(brand, model) : panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = lightSurface ? surfaceBorder(brand, model) : color(brand, layout.panelBorder || '1E3A5F')
  const headingToken = lightSurface ? lightToken(brand, 'headingLight', '090909') : 'white'
  const mutedToken = lightSurface ? lightToken(brand, 'mutedLight', '666666') : (brand.colors?.mutedOnDark ? 'mutedOnDark' : '9FB5D9')
  const fills = treemapFillColors(brand)
  const titleOffset = treemap.title ? layout.titleH + 14 : 0
  const mapBox = {
    x: layout.x + layout.pad,
    y: y + layout.pad + titleOffset,
    w: layout.w - layout.pad * 2,
    h: layout.h - layout.pad * 2 - titleOffset - (treemap.caption ? 24 : 0),
  }
  const rects = treemapRects(
    treemap.labels.map((label, index) => ({ label, value: treemap.values[index] || 0 })),
    mapBox,
    layout.gap,
  )

  addRect(slide, brand, layout.x, y, layout.w, layout.h, panelFill, panelBorder, 0.5)

  if (treemap.title) {
    addTextBox(slide, brand, treemap.title, {
      x: layout.x + layout.pad,
      y: y + layout.pad,
      w: layout.w - layout.pad * 2,
      h: layout.titleH,
      font: 'medium',
      size: 14,
      color: headingToken,
      margin: 0,
      fit: 'shrink',
    })
  }

  rects.forEach((rect, index) => {
    const fill = fills[index % fills.length]
    addRect(slide, brand, rect.x, rect.y, rect.w, rect.h, fill, 'FFFFFF', 0.5)
    if (rect.w < 54 || rect.h < 24) return
    addTextBox(slide, brand, rect.label, {
      x: rect.x + 8,
      y: rect.y + 8,
      w: rect.w - 16,
      h: Math.min(24, rect.h - 12),
      font: 'medium',
      size: rect.w < 90 ? 8 : 10,
      color: 'white',
      margin: 0,
      fit: 'shrink',
    })
    if (rect.w >= 92 && rect.h >= 44) {
      addTextBox(slide, brand, `${formatPptxNumber(rect.value)}${treemap.unit}`, {
        x: rect.x + 8,
        y: rect.y + Math.min(rect.h - 18, 34),
        w: rect.w - 16,
        h: 14,
        font: 'regular',
        size: rect.w < 90 ? 7 : 8,
        color: 'white',
        margin: 0,
        fit: 'shrink',
      })
    }
  })

  if (treemap.caption) {
    addTextBox(slide, brand, treemap.caption, {
      x: layout.x + layout.pad,
      y: y + layout.h - layout.pad - 12,
      w: layout.w - layout.pad * 2,
      h: 12,
      font: 'regular',
      size: 7,
      color: mutedToken,
      margin: 0,
      fit: 'shrink',
    })
  }

  addTakeaway(slide, model, brand)
}

export function addImpactRadar(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const impactRadar = model.impactRadar
  if (!impactRadar) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 68,
    y: 132,
    w: 824,
    h: 322,
    ...(brand.layouts.impactRadar || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const lightSurface = isLightSurface(model)
  const svg = renderImpactRadarSvg(impactRadar, {
    animate: false,
    cssVariables: false,
    mode: lightSurface ? 'light' : 'dark',
  })

  slide.addImage({
    data: svgToDataUri(svg),
    x: ptToIn(layout.x),
    y: ptToIn(y),
    w: ptToIn(layout.w),
    h: ptToIn(layout.h),
    altText: impactRadar.title || model.title,
  })

  addTakeaway(slide, model, brand)
}

export function addJourneyMap(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const journeyMap = model.journeyMap
  if (!journeyMap) return addContent(slide, model, brand, resourcesDir)

  const steps = journeyMap.steps.slice(0, 6)
  const layout = {
    x: 56,
    y: 146,
    w: 848,
    h: 232,
    gap: 12,
    pad: 12,
    topBarH: 4,
    ...(brand.layouts.journeyMap || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const count = Math.max(steps.length, 1)
  const cardW = (layout.w - layout.gap * (count - 1)) / count
  const lightSurface = isLightSurface(model)
  const panelFill = lightSurface ? surfaceCardFill(brand, model) : panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = lightSurface ? surfaceBorder(brand, model) : color(brand, layout.panelBorder || '1E3A5F')
  const headingOnSurface = lightSurface ? lightToken(brand, 'headingLight', '090909') : 'white'
  const headingOnPanel = lightSurface ? lightToken(brand, 'headingLight', '090909') : 'white'
  const bodyOnPanel = lightSurface
    ? lightToken(brand, 'bodyLight', '444444')
    : (brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0')

  if (journeyMap.title) {
    addTextBox(slide, brand, journeyMap.title, {
      x: layout.x,
      y: y - 28,
      w: layout.w,
      h: 20,
      font: 'medium',
      size: 14,
      color: headingOnSurface,
      margin: 0,
      fit: 'shrink',
    })
  }

  steps.forEach((step, index) => {
    const x = layout.x + index * (cardW + layout.gap)
    const accent = color(brand, step.accent || 'blue')
    addRect(slide, brand, x, y, cardW, layout.h, panelFill, panelBorder, 0.5)
    addRect(slide, brand, x, y, cardW, layout.topBarH, accent, null)
    addTextBox(slide, brand, step.label, {
      x: x + layout.pad,
      y: y + 18,
      w: cardW - layout.pad * 2,
      h: 16,
      font: 'medium',
      size: 8,
      color: step.accent || 'blue',
      margin: 0,
      fit: 'shrink',
    })
    addTextBox(slide, brand, step.title, {
      x: x + layout.pad,
      y: y + 46,
      w: cardW - layout.pad * 2,
      h: 42,
      font: 'medium',
      size: count > 5 ? 10 : 11,
      color: headingOnPanel,
      margin: 0,
      fit: 'shrink',
      breakLine: true,
    })
    addTextBox(slide, brand, step.body, {
      x: x + layout.pad,
      y: y + 96,
      w: cardW - layout.pad * 2,
      h: layout.h - 112,
      font: 'regular',
      size: count > 5 ? 8 : 9,
      color: bodyOnPanel,
      margin: 0,
      breakLine: true,
      fit: 'shrink',
    })
  })

  addTakeaway(slide, model, brand)
}

export function addJourneyPath(slide, model, brand, resourcesDir) {
  const header = addBaseHeader(slide, model, brand, resourcesDir)
  const journeyPath = model.journeyPath
  if (!journeyPath) return addContent(slide, model, brand, resourcesDir)

  const layout = {
    x: 56,
    y: 138,
    leftW: 318,
    rightW: 530,
    h: 278,
    gap: 22,
    pad: 24,
    ...(brand.layouts.journeyPath || {}),
  }
  const y = Math.max(layout.y, header.contentTop)
  const lightSurface = isLightSurface(model)
  const panelFill = lightSurface ? surfaceCardFill(brand, model) : panelFillForSurface(brand, model, layout.panelFill || '0D1D36')
  const panelBorder = lightSurface ? surfaceBorder(brand, model) : color(brand, layout.panelBorder || '1E3A5F')
  const headingToken = lightSurface ? lightToken(brand, 'headingLight', '090909') : 'white'
  const bodyToken = lightSurface
    ? lightToken(brand, 'bodyLight', '444444')
    : (brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C8D8F0')

  addRect(slide, brand, layout.x, y, layout.leftW, layout.h, panelFill, panelBorder, 0.5)
  addTextBox(slide, brand, journeyPath.metric, {
    x: layout.x + layout.pad,
    y: y + 48,
    w: layout.leftW - layout.pad * 2,
    h: 70,
    font: 'medium',
    size: 50,
    color: journeyPath.accent || 'blue',
    margin: 0,
    fit: 'shrink',
  })
  addTextBox(slide, brand, journeyPath.metricLabel, {
    x: layout.x + layout.pad,
    y: y + 126,
    w: layout.leftW - layout.pad * 2,
    h: layout.h - 150,
    font: 'regular',
    size: 14,
    color: bodyToken,
    margin: 0,
    breakLine: true,
    fit: 'shrink',
  })

  const svg = renderJourneyPathSvg(journeyPath, {
    animate: false,
    cssVariables: false,
    mode: lightSurface ? 'light' : 'dark',
  })
  const rightX = layout.x + layout.leftW + layout.gap
  addRect(slide, brand, rightX, y, layout.rightW, layout.h, lightSurface ? color(brand, 'white') : panelFill, panelBorder, 0.5)
  slide.addImage({
    data: svgToDataUri(svg),
    x: ptToIn(rightX + 8),
    y: ptToIn(y + 8),
    w: ptToIn(layout.rightW - 16),
    h: ptToIn(layout.h - 16),
    altText: journeyPath.title || model.title,
  })
  if (journeyPath.title) {
    addTextBox(slide, brand, journeyPath.title, {
      x: rightX + layout.pad,
      y: y - 24,
      w: layout.rightW,
      h: 18,
      font: 'medium',
      size: 11,
      color: headingToken,
      margin: 0,
      fit: 'shrink',
    })
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
  addLargeTextBox(slide, brand, close.title || model.title || 'Thank you', expandedTitleBox(close.title || model.title || 'Thank you', layout.title, { maxH: 180 }))
  const name = close.name || presenter.name
  const role = close.role || presenter.role
  if (name) addTextBox(slide, brand, name, layout.name)
  if (role) addTextBox(slide, brand, role, layout.role)
}

function addLargeTextBox(slide, brand, text, box, options = {}) {
  addTextBox(slide, brand, text, box, {
    breakLine: true,
    fit: 'shrink',
    paraSpaceAfter: 0,
    ...options,
  })
}

function expandedTitleBox(text, box, options = {}) {
  const lines = estimateWrappedLines(text, box)
  const lineHeight = Math.ceil((box.size || 48) * 1.16)
  const expandedHeight = Math.max(box.h, lines * lineHeight)
  return {
    ...box,
    h: options.maxH ? Math.min(options.maxH, expandedHeight) : expandedHeight,
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

function formatPptxNumber(value) {
  if (!Number.isFinite(value)) return ''
  return Number.isInteger(value)
    ? value.toLocaleString('en-GB')
    : value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}

function heatmapCellTransparency(value, min, range) {
  return Math.round(78 - ((value - min) / range) * 58)
}

function treemapFillColors(brand) {
  return [
    color(brand, 'blue'),
    color(brand, 'lightBlue'),
    color(brand, 'purple'),
    color(brand, 'green'),
    color(brand, 'orange'),
    color(brand, 'yellow'),
  ]
}

function addBaseHeader(slide, model, brand, resourcesDir) {
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

  markPptxChromeComplete(slide)
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
  const fill = color(brand, surfaceFillToken(brand, model, 'cardLight', 'cardFillLight', 'FDFDFD'))
  const transparency = surfacePanelTransparency(brand, model)
  return transparency ? { color: fill, transparency } : fill
}

function panelFillForSurface(brand, model, fill) {
  const resolved = color(brand, fill)
  const transparency = surfacePanelTransparency(brand, model)
  return transparency ? { color: resolved, transparency } : resolved
}

function surfaceBorder(brand, model) {
  return surfaceLine(brand, model, 'border')
}

function surfaceBackgroundColor(brand, surface, fallbackColor) {
  if (surface === 'light') return color(brand, lightToken(brand, 'backgroundLight', 'FFFFFF'))
  return color(brand, fallbackColor)
}

function backgroundForSurface(brand, kind, surface) {
  return slideBackgroundAsset(brand, kind, surface)
}

function surfacePanelTransparency(brand, model) {
  const surface = isLightSurface(model) ? 'light' : 'dark'
  if (!hasSlideBackgroundAsset(brand, surface)) return 0
  return surface === 'light' ? 8 : 14
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
  if (isLightSurface(model)) {
    const fallback = swimlaneFallbackFill(normalizedColor)
    if (fallback) return color(brand, fallback)
  }
  return surfaceCardFill(brand, model)
}

function swimlaneAccent(brand, layout, laneColor = 'blue') {
  const normalizedColor = normalizeLaneColor(laneColor)
  const configured = layout.accents?.[normalizedColor] || layout.accents?.[laneColor] || normalizedColor || layout.accents?.blue || 'blue'
  return color(brand, configured)
}

function normalizeLaneColor(laneColor = 'blue') {
  const token = String(laneColor || 'blue').trim()
  const lower = token.toLowerCase()
  if (lower === 'cyan' || lower === 'lightblue') return 'lightBlue'
  return token
}

function swimlaneFallbackFill(laneColor = 'blue') {
  const fills = {
    blue: 'E8F4FE',
    lightBlue: 'E9F9FF',
    cyan: 'E9F9FF',
    purple: 'F0EDFE',
    green: 'ECF9F1',
    orange: 'FFF3EA',
    red: 'FFF0F2',
    yellow: 'FFF8DF',
  }
  return fills[laneColor] || ''
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
