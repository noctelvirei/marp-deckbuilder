import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { color, font, ptToIn } from '../brand.js'
import { resolveResourceFile, resolveSurfaceResourceFile } from '../resources.js'

export function addTextBox(slide, brand, text, box, options = {}) {
  slide.addText(text || '', normalizePptxColors(brand, {
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
  }))
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
  const fillOptions = pptxFill(brand, fill)
  const fillColor = fillOptions.color
  const lineColor = pptxColor(brand, line)
  slide.addShape('rect', {
    x: ptToIn(x),
    y: ptToIn(y),
    w: ptToIn(w),
    h: ptToIn(h),
    fill: fillOptions,
    line: lineColor ? { color: lineColor, width: lineWidth || 0.5 } : { color: fillColor, transparency: 100 },
  })
}

function pptxFill(brand, fill) {
  if (fill && typeof fill === 'object') {
    return normalizePptxColors(brand, fill)
  }
  return { color: pptxColor(brand, fill) }
}

export function normalizePptxColors(brand, value, key = '') {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePptxColors(brand, item, key))
  }
  if (!value || typeof value !== 'object') {
    return shouldNormalizeColorKey(key) ? pptxColor(brand, value) : value
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      normalizePptxColors(brand, entryValue, entryKey),
    ]),
  )
}

export function pptxColor(brand, value) {
  if (typeof value !== 'string') return value
  return color(brand, value)
}

function shouldNormalizeColorKey(key) {
  return key === 'color' || /Color$/i.test(key) || key === 'chartColors'
}

export function addResourceImage(slide, resource, resourcesDir, box, altText = '', options = {}) {
  const imagePath = resolveResourcePath(resource, resourcesDir)
  if (!imagePath) return false

  const image = path.extname(imagePath).toLowerCase() === '.svg'
    ? { data: svgToDataUri(readFileSync(imagePath, 'utf8')) }
    : { path: imagePath }
  const imageBox = resolveImageBox(imagePath, box, options)

  slide.addImage({
    ...image,
    x: ptToIn(imageBox.x),
    y: ptToIn(imageBox.y),
    w: ptToIn(imageBox.w),
    h: ptToIn(imageBox.h),
    altText,
  })
  return true
}

export function addSurfaceResourceImage(slide, resource, resourcesDir, surface, box, altText = '', options = {}) {
  const imagePath = resolveSurfaceResourcePath(resource, resourcesDir, surface)
  if (!imagePath) return false

  const image = path.extname(imagePath).toLowerCase() === '.svg'
    ? { data: svgToDataUri(readFileSync(imagePath, 'utf8')) }
    : { path: imagePath }
  const imageBox = resolveImageBox(imagePath, box, options)

  slide.addImage({
    ...image,
    x: ptToIn(imageBox.x),
    y: ptToIn(imageBox.y),
    w: ptToIn(imageBox.w),
    h: ptToIn(imageBox.h),
    altText,
  })
  return true
}

export function resolveResourcePath(value, resourcesDir) {
  if (!value || !resourcesDir) return ''
  return resolveResourceFile(value, resourcesDir).path
}

export function resolveSurfaceResourcePath(value, resourcesDir, surface = '') {
  if (!value || !resourcesDir) return ''
  return resolveSurfaceResourceFile(value, resourcesDir, surface).path
}

export function svgToDataUri(svg) {
  const normalized = ensureSvgNamespace(svg.trim())
  return `image/svg+xml;base64,${Buffer.from(normalized, 'utf8').toString('base64')}`
}

function ensureSvgNamespace(svg) {
  if (!/^<svg\b/i.test(svg) || /\sxmlns=/.test(svg)) return svg
  return svg.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"')
}

function resolveImageBox(imagePath, box, options = {}) {
  if (options.fit !== 'contain') return box
  const size = intrinsicImageSize(imagePath)
  if (!size?.width || !size?.height) return box
  return containBox(box, size.width, size.height)
}

export function containBox(box, imageW, imageH) {
  const imageRatio = imageW / imageH
  const boxRatio = box.w / box.h
  if (!Number.isFinite(imageRatio) || imageRatio <= 0 || !Number.isFinite(boxRatio) || boxRatio <= 0) return box

  if (imageRatio > boxRatio) {
    const h = box.w / imageRatio
    return {
      ...box,
      y: box.y + (box.h - h) / 2,
      h,
    }
  }

  const w = box.h * imageRatio
  return {
    ...box,
    x: box.x + (box.w - w) / 2,
    w,
  }
}

function intrinsicImageSize(imagePath) {
  const ext = path.extname(imagePath).toLowerCase()
  try {
    if (ext === '.svg') return svgSize(readFileSync(imagePath, 'utf8'))
    const bytes = readFileSync(imagePath)
    if (ext === '.png') return pngSize(bytes)
    if (ext === '.jpg' || ext === '.jpeg') return jpegSize(bytes)
  } catch {
    return null
  }
  return null
}

export function svgIntrinsicSize(svg) {
  return svgSize(svg)
}

function svgSize(svg) {
  const viewBox = svg.match(/\bviewBox\s*=\s*["']\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\s*["']/i)
  if (viewBox) {
    return {
      width: Number.parseFloat(viewBox[3]),
      height: Number.parseFloat(viewBox[4]),
    }
  }

  const width = parseSvgLength(svg.match(/\bwidth\s*=\s*["']\s*([^"']+)["']/i)?.[1])
  const height = parseSvgLength(svg.match(/\bheight\s*=\s*["']\s*([^"']+)["']/i)?.[1])
  if (!width || !height) return null
  return { width, height }
}

function parseSvgLength(value) {
  const match = String(value || '').trim().match(/^([+-]?\d*\.?\d+)/)
  return match ? Number.parseFloat(match[1]) : 0
}

function pngSize(bytes) {
  if (bytes.length < 24) return null
  if (bytes.readUInt32BE(0) !== 0x89504e47 || bytes.readUInt32BE(4) !== 0x0d0a1a0a) return null
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

function jpegSize(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    if (marker === 0xd9 || marker === 0xda) return null
    const length = bytes.readUInt16BE(offset + 2)
    if (isJpegStartOfFrame(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      }
    }
    offset += 2 + length
  }
  return null
}

function isJpegStartOfFrame(marker) {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  )
}
