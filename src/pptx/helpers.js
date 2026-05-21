import { Buffer } from 'node:buffer'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { color, font, ptToIn } from '../brand.js'

export function addTextBox(slide, brand, text, box, options = {}) {
  slide.addText(text || '', {
    x: ptToIn(box.x),
    y: ptToIn(box.y),
    w: ptToIn(box.w),
    h: ptToIn(box.h),
    fontFace: font(brand, box.font || 'regular'),
    fontSize: box.size || 14,
    color: color(brand, box.color || 'dark'),
    bold: false,
    margin: box.margin ?? 0.03,
    valign: 'top',
    align: box.align,
    fit: box.fit,
    ...options,
  })
}

export function addCell(slide, brand, text, x, y, w, h, fill, textStyle) {
  addRect(slide, brand, x, y, w, h, color(brand, fill), color(brand, 'border'), 0.4)
  addTextBox(slide, brand, text, {
    ...textStyle,
    x: x + 8,
    y: y + 8,
    w: w - 16,
    h: h - 12,
    fit: 'shrink',
  })
}

export function addRect(slide, brand, x, y, w, h, fill, line, lineWidth) {
  slide.addShape('rect', {
    x: ptToIn(x),
    y: ptToIn(y),
    w: ptToIn(w),
    h: ptToIn(h),
    fill: { color: fill },
    line: line ? { color: line, width: lineWidth || 0.5 } : { color: fill, transparency: 100 },
  })
}

export function addResourceImage(slide, resource, resourcesDir, box, altText = '') {
  const imagePath = resolveResourcePath(resource, resourcesDir)
  if (!imagePath) return false

  const image = path.extname(imagePath).toLowerCase() === '.svg'
    ? { data: svgToDataUri(readFileSync(imagePath, 'utf8')) }
    : { path: imagePath }

  slide.addImage({
    ...image,
    x: ptToIn(box.x),
    y: ptToIn(box.y),
    w: ptToIn(box.w),
    h: ptToIn(box.h),
    altText,
  })
  return true
}

export function resolveResourcePath(value, resourcesDir) {
  if (!value || !resourcesDir) return ''
  const raw = value.startsWith('resource:') ? value.slice('resource:'.length) : value
  const candidate = path.isAbsolute(raw) ? raw : path.resolve(resourcesDir, raw)
  return existsSync(candidate) ? candidate : ''
}

export function svgToDataUri(svg) {
  const normalized = ensureSvgNamespace(svg.trim())
  return `image/svg+xml;base64,${Buffer.from(normalized, 'utf8').toString('base64')}`
}

function ensureSvgNamespace(svg) {
  if (!/^<svg\b/i.test(svg) || /\sxmlns=/.test(svg)) return svg
  return svg.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
}
