import pptxgen from 'pptxgenjs'

import {
  addCards,
  addChartSlide,
  addClose,
  addComparison,
  addContent,
  addCover,
  addDivider,
  addLogoWall,
  addNextSteps,
  addProof,
  addSwimlane,
  addThreeStat,
  addVisual,
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

  for (const slideModel of deck.slides) {
    if (shouldSkipPptx(slideModel)) continue
    const slide = pptx.addSlide()
    addNativeSlide(pptx, slide, slideModel, deck.frontmatter, brand, resourcesDir)
  }

  await pptx.writeFile({ fileName: outputPath })
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
      return addCover(slide, model, frontmatter, brand)
    case 'divider':
      return addDivider(slide, model, brand)
    case 'three-stat':
      return addThreeStat(slide, model, brand)
    case 'cards':
      return addCards(slide, model, brand)
    case 'chart':
      return addChartSlide(pptx, slide, model, brand)
    case 'visual':
      return addVisual(slide, model, brand)
    case 'comparison':
      return addComparison(slide, model, brand)
    case 'swimlane':
      return addSwimlane(slide, model, brand)
    case 'proof':
      return addProof(slide, model, brand, resourcesDir)
    case 'next-steps':
      return addNextSteps(slide, model, brand)
    case 'logo-wall':
      return addLogoWall(slide, model, brand, resourcesDir)
    case 'close':
      return addClose(slide, model, frontmatter, brand)
    default:
      return addContent(slide, model, brand)
  }
}
