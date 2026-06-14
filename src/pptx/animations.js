import { readFile, writeFile } from 'node:fs/promises'

import JSZip from 'jszip'

import { buildSlideTimingXml } from './animation-xml.js'
import { animationTargetIdsFromSlideXml } from './animation-targets.js'

export async function applyPptxAnimations(outputPath, plans = []) {
  const activePlans = plans.filter((plan) => plan?.animation)
  if (!activePlans.length) return

  const archive = await JSZip.loadAsync(await readFile(outputPath))

  for (const plan of activePlans) {
    const slidePath = `ppt/slides/slide${plan.slideNumber}.xml`
    const slideFile = archive.file(slidePath)
    if (!slideFile) continue

    const slideXml = await slideFile.async('string')
    const targetIds = animationTargetIdsFromSlideXml(
      slideXml,
      plan.contentStartIndex,
      plan.contentEndIndex,
    )
    const timingXml = buildSlideTimingXml({ animation: plan.animation, targetIds })
    if (!timingXml) continue

    archive.file(slidePath, withTimingXml(slideXml, timingXml))
  }

  await writeFile(outputPath, await archive.generateAsync({ type: 'nodebuffer' }))
}

function withTimingXml(slideXml, timingXml) {
  if (/<p:timing\b/.test(slideXml)) {
    return slideXml.replace(/<p:timing\b[\s\S]*<\/p:timing>/, timingXml)
  }
  return slideXml.replace('</p:sld>', `${timingXml}</p:sld>`)
}
