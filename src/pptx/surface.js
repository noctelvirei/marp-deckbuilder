import { color } from '../brand.js'
import { addRect, addResourceImage, addSurfaceResourceImage } from './helpers.js'

export function addSlideChrome(slide, brand, resourcesDir, kind, fallbackColor, model = {}) {
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
}

export function execAccent(value = 'blue', index = 0) {
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

export function execSurface(model) {
  return isLightSurface(model) ? 'light' : 'dark'
}

export function execHeadingToken(brand, model) {
  if (isLightSurface(model)) return lightToken(brand, 'headingLight', '090909')
  return brand.colors?.execHeading ? 'execHeading' : brand.colors?.white ? 'white' : 'FFFFFF'
}

export function execCardFill(brand, model) {
  if (isLightSurface(model)) {
    return color(brand, brand.colors?.execCardLight ? 'execCardLight' : lightToken(brand, 'cardFillLight', 'FDFDFD'))
  }
  return color(brand, brand.colors?.execCard ? 'execCard' : brand.colors?.execCardDark ? 'execCardDark' : brand.colors?.cardDark ? 'cardDark' : '13213D')
}

export function execBodyToken(brand, model) {
  if (isLightSurface(model)) return lightToken(brand, 'bodyLight', '444444')
  return brand.colors?.execBody ? 'execBody' : brand.colors?.bodyOnDark ? 'bodyOnDark' : 'C9D2E8'
}

export function execMutedToken(brand, model) {
  if (isLightSurface(model)) return lightToken(brand, 'mutedLight', '666666')
  return brand.colors?.execMuted ? 'execMuted' : brand.colors?.mutedOnDark ? 'mutedOnDark' : '8A95A8'
}

export function isLightSurface(model) {
  return model?.surface === 'light'
}

export function lightToken(brand, key, fallback) {
  return brand.colors?.[key] ? key : fallback
}

export function surfaceTextColor(brand, model, current, role = 'body') {
  return color(brand, surfaceTextToken(brand, model, current, role))
}

export function surfaceBox(brand, model, box = {}, role = 'body') {
  if (!isLightSurface(model)) return box
  return {
    ...box,
    color: surfaceTextToken(brand, model, box.color, role),
  }
}

export function textBoxForFill(brand, model, box = {}, fill, role = 'body') {
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

export function surfaceFill(brand, model, current) {
  return color(brand, surfaceFillToken(brand, model, current))
}

export function surfaceLine(brand, model, current) {
  if (!isLightSurface(model)) return color(brand, current)
  return color(brand, lightToken(brand, 'borderLight', 'DEDEDE'))
}

export function surfaceCardFill(brand, model) {
  return color(brand, surfaceFillToken(brand, model, 'cardLight', 'cardFillLight', 'FDFDFD'))
}

export function surfaceBorder(brand, model) {
  return surfaceLine(brand, model, 'border')
}

export function swimlaneFill(brand, model, layout, laneColor = 'blue') {
  const normalizedColor = normalizeLaneColor(laneColor)
  const configured = layout.fills?.[normalizedColor] || layout.fills?.[laneColor]
  if (configured) return color(brand, configured)
  if (isLightSurface(model)) {
    const fallback = swimlaneFallbackFill(normalizedColor)
    if (fallback) return color(brand, fallback)
  }
  return surfaceCardFill(brand, model)
}

export function swimlaneAccent(brand, layout, laneColor = 'blue') {
  const normalizedColor = normalizeLaneColor(laneColor)
  const configured = layout.accents?.[normalizedColor] || layout.accents?.[laneColor] || normalizedColor || layout.accents?.blue || 'blue'
  return color(brand, configured)
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

function surfaceFillToken(brand, model, current, key = 'cardFillLight', fallback = 'FDFDFD') {
  if (!isLightSurface(model)) return current
  const token = String(current || '').toLowerCase()
  if (['blue', 'cyan', 'purple', 'green', 'red', 'orange', 'yellow', 'lightblue', 'primarypurple'].includes(token)) {
    return current
  }
  return lightToken(brand, key, fallback)
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
