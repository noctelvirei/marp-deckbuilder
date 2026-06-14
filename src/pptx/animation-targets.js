const contentStartKey = Symbol.for('deckbuilder.animationContentStart')
const contentEndKey = Symbol.for('deckbuilder.animationContentEnd')

export function markPptxChromeComplete(slide) {
  markPptxAnimationTargetsStart(slide)
}

export function markPptxAnimationTargetsStart(slide) {
  slide[contentStartKey] = slideObjectCount(slide)
}

export function markPptxAnimationTargetsEnd(slide) {
  slide[contentEndKey] = slideObjectCount(slide)
}

export function animationPlanForSlide(slideModel, slide, slideNumber) {
  if (!slideModel?.animation) return null

  return {
    slideNumber,
    animation: slideModel.animation,
    contentStartIndex: slide[contentStartKey] ?? 0,
    contentEndIndex: slide[contentEndKey],
  }
}

export function animationTargetIdsFromSlideXml(slideXml, contentStartIndex = 0, contentEndIndex = undefined) {
  const objectIds = [...String(slideXml || '').matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter((id) => Number.isFinite(id) && id > 1)

  return objectIds
    .slice(Math.max(0, contentStartIndex), Number.isInteger(contentEndIndex) ? contentEndIndex : undefined)
    .map((id) => String(id))
}

function slideObjectCount(slide) {
  return Array.isArray(slide?._slideObjects) ? slide._slideObjects.length : 0
}
