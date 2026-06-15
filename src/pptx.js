import pptxgen from 'pptxgenjs'

import { applyPptxAnimations } from './pptx/animations.js'
import { animationPlanForSlide } from './pptx/animation-targets.js'
import {
  addCards,
  addChartSlide,
  addClose,
  addComparison,
  addContent,
  addCover,
  addDivider,
  addExecCards,
  addExecMetrics,
  addExecRows,
  addExecTimeline,
  addExecTitle,
  addFunnel,
  addHeatmap,
  addImpactRadar,
  addJourneyMap,
  addJourneyPath,
  addLogoWall,
  addMetricTrend,
  addNextSteps,
  addOrchestration,
  addProof,
  addSignalBars,
  addSignalBoard,
  addSwimlane,
  addTakeawayHero,
  addThreeStat,
  addTreemap,
} from './pptx/renderers.js'
import { font } from './brand.js'

export async function writePptx({
  deck,
  outputPath,
  brand,
  resourcesDir,
}) {
  const pptx = new pptxgen()
  pptx.author = `${brand.name} Marp`
  pptx.company = brand.name
  pptx.subject = deck.frontmatter.title || `${brand.name} deck`
  pptx.title = deck.frontmatter.title || `${brand.name} deck`
  pptx.lang = 'en-GB'
  pptx.defineLayout({
    name: brand.themeName.toUpperCase(),
    width: brand.slide.widthIn,
    height: brand.slide.heightIn,
  })
  pptx.layout = brand.themeName.toUpperCase()
  pptx.theme = {
    headFontFace: font(brand, 'regular'),
    bodyFontFace: font(brand, 'regular'),
    lang: 'en-GB',
  }

  const animationPlans = []
  let pptxSlideNumber = 0

  for (const slideModel of deck.slides) {
    if (shouldSkipPptx(slideModel)) continue
    const slide = pptx.addSlide()
    pptxSlideNumber += 1
    addNativeSlide(pptx, slide, slideModel, deck.frontmatter, brand, resourcesDir)
    const animationPlan = animationPlanForSlide(slideModel, slide, pptxSlideNumber)
    if (animationPlan) animationPlans.push(animationPlan)
  }

  await pptx.writeFile({ fileName: outputPath })
  await applyPptxAnimations(outputPath, animationPlans)
}

export function shouldSkipPptx(slideModel) {
  const directives = slideModel?.directives || {}
  if (isTruthyDirective(directives['html-only'])) return true
  if (isTruthyDirective(directives['pptx-skip'])) return true
  return ['skip', 'omit', 'none', 'false', 'no', 'off'].includes(
    normalizeDirective(directives.pptx),
  )
}

function isTruthyDirective(value) {
  return ['true', 'yes', 'on', '1'].includes(normalizeDirective(value))
}

function normalizeDirective(value) {
  return String(value || '').trim().toLowerCase()
}

function addNativeSlide(pptx, slide, model, frontmatter, brand, resourcesDir) {
  switch (model.layout) {
    case 'cover':
      return addCover(slide, model, frontmatter, brand, resourcesDir)
    case 'divider':
      return addDivider(slide, model, brand, resourcesDir)
    case 'three-stat':
      return addThreeStat(slide, model, brand, resourcesDir)
    case 'cards':
      return addCards(slide, model, brand, resourcesDir)
    case 'chart':
      return addChartSlide(pptx, slide, model, brand, resourcesDir)
    case 'signal-bars':
      return addSignalBars(slide, model, brand, resourcesDir)
    case 'orchestration':
      return addOrchestration(slide, model, brand, resourcesDir)
    case 'signal-board':
      return addSignalBoard(slide, model, brand, resourcesDir)
    case 'funnel':
      return addFunnel(slide, model, brand, resourcesDir)
    case 'metric-trend':
      return addMetricTrend(pptx, slide, model, brand, resourcesDir)
    case 'heatmap':
      return addHeatmap(slide, model, brand, resourcesDir)
    case 'impact-radar':
      return addImpactRadar(slide, model, brand, resourcesDir)
    case 'treemap':
      return addTreemap(slide, model, brand, resourcesDir)
    case 'journey-map':
      return addJourneyMap(slide, model, brand, resourcesDir)
    case 'journey-path':
      return addJourneyPath(slide, model, brand, resourcesDir)
    case 'comparison':
      return addComparison(slide, model, brand, resourcesDir)
    case 'swimlane':
      return addSwimlane(slide, model, brand, resourcesDir)
    case 'proof':
      return addProof(slide, model, brand, resourcesDir)
    case 'next-steps':
      return addNextSteps(slide, model, brand, resourcesDir)
    case 'logo-wall':
      return addLogoWall(slide, model, brand, resourcesDir)
    case 'exec-title':
      return addExecTitle(slide, model, brand, resourcesDir)
    case 'exec-rows':
      return addExecRows(slide, model, brand, resourcesDir)
    case 'exec-cards':
      return addExecCards(slide, model, brand, resourcesDir)
    case 'exec-timeline':
      return addExecTimeline(slide, model, brand, resourcesDir)
    case 'exec-metrics':
      return addExecMetrics(slide, model, brand, resourcesDir)
    case 'close':
      return addClose(slide, model, frontmatter, brand, resourcesDir)
    case 'takeaway':
      return addTakeawayHero(slide, model, brand, resourcesDir)
    default:
      return addContent(slide, model, brand, resourcesDir)
  }
}
