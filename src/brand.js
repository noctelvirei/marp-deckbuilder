import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export async function loadDefinitions(definitionsDir) {
  const root =
    definitionsDir instanceof URL ? fileURLToPath(definitionsDir) : path.resolve(definitionsDir)
  const brandPath = path.join(root, 'brand.json')
  const themePath = path.join(root, 'theme.css')
  const templateRoot = path.resolve(root, '..', 'templates')
  const bespokeCssPath = path.join(templateRoot, 'bespoke.css')
  const bespokeJsPath = path.join(templateRoot, 'bespoke.js')

  const [brandRaw, themeCss] = await Promise.all([
    readFile(brandPath, 'utf8'),
    readFile(themePath, 'utf8'),
  ])
  const brand = JSON.parse(brandRaw)
  validateBrand(brand, brandPath)

  return {
    root,
    brand,
    themeCss,
    bespokeCss: existsSync(bespokeCssPath) ? await readFile(bespokeCssPath, 'utf8') : '',
    bespokeJs: existsSync(bespokeJsPath) ? await readFile(bespokeJsPath, 'utf8') : '',
  }
}

export function ptToIn(value) {
  return value / 72
}

export function pxToIn(value, slide) {
  return ptToIn(value * slide.pxToPt)
}

export function color(brand, keyOrHex) {
  if (!keyOrHex) return brand.colors.dark
  return brand.colors[keyOrHex] || keyOrHex
}

export function font(brand, keyOrName = 'regular') {
  return brand.fonts[keyOrName] || keyOrName
}

export function cssColorToHex(value, fallback = '090909') {
  if (!value) return fallback

  const hex = value.trim().match(/^#?([0-9a-f]{6})$/i)
  if (hex) return hex[1].toUpperCase()

  const rgb = value
    .trim()
    .match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i)
  if (!rgb) return fallback
  if (rgb[4] !== undefined && Number(rgb[4]) === 0) return fallback

  return [rgb[1], rgb[2], rgb[3]]
    .map((part) => Number(part).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function validateBrand(brand, brandPath) {
  const required = [
    ['themeName', brand.themeName],
    ['slide.widthIn', brand.slide?.widthIn],
    ['slide.heightIn', brand.slide?.heightIn],
    ['slide.pxToPt', brand.slide?.pxToPt],
    ['colors.dark', brand.colors?.dark],
    ['fonts.regular', brand.fonts?.regular],
    ['layouts.header.title', brand.layouts?.header?.title],
  ]
  const missing = required
    .filter(([, value]) => value === undefined || value === null || value === '')
    .map(([name]) => name)

  if (missing.length) {
    throw new Error(`${brandPath} is missing required definition(s): ${missing.join(', ')}`)
  }
}
