import { escapeAttr, escapeHtml } from './utils.js'

const PRESETS = {
  2: [
    { x: 70, y: 292 },
    { x: 610, y: 96 },
  ],
  3: [
    { x: 58, y: 300 },
    { x: 340, y: 136 },
    { x: 626, y: 96 },
  ],
  4: [
    { x: 50, y: 300 },
    { x: 260, y: 150 },
    { x: 470, y: 150 },
    { x: 630, y: 95 },
  ],
  5: [
    { x: 50, y: 300 },
    { x: 205, y: 210 },
    { x: 340, y: 128 },
    { x: 500, y: 170 },
    { x: 630, y: 95 },
  ],
}

export function renderJourneyPathSvg(journeyPath, options = {}) {
  const animate = options.animate !== false
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const colors = journeyPathColors(mode)
  const color = (name) => useVariables ? `var(--deck-journey-path-${name}, ${colors[name]})` : colors[name]
  const points = PRESETS[Math.min(Math.max(journeyPath.labels.length, 2), 5)]
  const path = pathFromPoints(points)
  const hotspotSet = new Set(journeyPath.hotspots.map((hotspot) => hotspot.toLowerCase()))
  const nodes = journeyPath.labels
    .map((label, index) => {
      const point = points[index]
      const note = journeyPath.notes[index] || ''
      const isHotspot = hotspotSet.has(label.toLowerCase()) || hotspotSet.has(String(index + 1))
      const labelY = point.y > 220 ? point.y + 52 : point.y - 48
      const noteY = labelY + 20
      const hotspot = isHotspot
        ? `<g class="journey-path-hotspot-marker" transform="translate(${point.x} ${point.y})">
  <title>Attention hotspot</title>
  <circle r="8"></circle>
  <text y="1" text-anchor="middle" dominant-baseline="middle">!</text>
</g>`
        : ''
      return `<g>
  <circle class="journey-path-node" cx="${point.x}" cy="${point.y}" r="22"></circle>
  ${hotspot}
  <text class="journey-path-label" x="${point.x}" y="${labelY}" text-anchor="middle">${escapeHtml(label)}</text>
  ${note ? `<text class="journey-path-note" x="${point.x}" y="${noteY}" text-anchor="middle">${escapeHtml(note)}</text>` : ''}
</g>`
    })
    .join('\n')
  const callout = renderCallout(journeyPath)
  const lineAnimation = animate
    ? ' stroke-dashoffset: 980; animation: journey-path-draw 1.4s ease-out 0.1s forwards;'
    : ' stroke-dashoffset: 0;'
  const animationCss = animate
    ? `
    @keyframes journey-path-draw { to { stroke-dashoffset: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .journey-path-line { animation: none; stroke-dashoffset: 0; }
    }`
    : ''

  return `<svg class="deck-journey-path-svg" viewBox="0 0 680 390" role="img" aria-label="${escapeAttr(journeyPath.title || 'Journey path')}">
  <style>
    .journey-path-line { fill: none; stroke: ${color('accent')}; stroke-width: 10; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 980;${lineAnimation} }
    .journey-path-node { fill: ${color('surface')}; stroke: ${color('accent')}; stroke-width: 5; }
    .journey-path-hotspot-marker circle { fill: ${color('hotspot')}; stroke: ${color('surface')}; stroke-width: 3; }
    .journey-path-hotspot-marker text { fill: #ffffff; font: 700 11px "Poppins", "Aptos", sans-serif; }
    .journey-path-label { fill: ${color('heading')}; font: 500 17px "Poppins", "Aptos", sans-serif; }
    .journey-path-callout-title { font-weight: 600; }
    .journey-path-note { fill: ${color('body')}; font: 13px "Poppins", "Aptos", sans-serif; }
    .journey-path-callout rect { fill: ${color('callout')}; stroke: ${color('accent')}; }
    ${animationCss}
  </style>
  <path class="journey-path-line" d="${escapeAttr(path)}"></path>
  ${nodes}
  ${callout}
</svg>`
}

function renderCallout(journeyPath) {
  if (!journeyPath.calloutTitle) return ''

  const x = 330
  const y = 238
  const width = 318
  const titleLines = wrapSvgLines(journeyPath.calloutTitle, 28, 2)
  const bodyLines = wrapSvgLines(journeyPath.calloutBody, 38, 3)
  const height = Math.max(84, 44 + titleLines.length * 19 + (bodyLines.length ? 10 + bodyLines.length * 17 : 0))
  const titleText = titleLines
    .map((line, index) => `<text class="journey-path-label journey-path-callout-title" x="${x + 20}" y="${y + 31 + index * 19}">${escapeHtml(line)}</text>`)
    .join('\n  ')
  const bodyStartY = y + 34 + titleLines.length * 19 + 10
  const bodyText = bodyLines
    .map((line, index) => `<text class="journey-path-note" x="${x + 20}" y="${bodyStartY + index * 17}">${escapeHtml(line)}</text>`)
    .join('\n  ')

  return `<g class="journey-path-callout">
  <rect x="${x}" y="${y}" width="${width}" height="${height}"></rect>
  ${titleText}
  ${bodyText}
</g>`
}

function wrapSvgLines(value, maxChars, maxLines) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length <= maxChars) {
      line = next
      continue
    }
    if (line) lines.push(line)
    line = word
    if (lines.length === maxLines - 1) break
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

function pathFromPoints(points) {
  const [first, ...rest] = points
  return rest.reduce((path, point, index) => {
    const previous = index === 0 ? first : rest[index - 1]
    const dx = point.x - previous.x
    const control1 = {
      x: previous.x + dx * 0.42,
      y: previous.y - 92 + index * 34,
    }
    const control2 = {
      x: point.x - dx * 0.42,
      y: point.y + 92 - index * 28,
    }
    return `${path} C ${round(control1.x)} ${round(control1.y)}, ${round(control2.x)} ${round(control2.y)}, ${point.x} ${point.y}`
  }, `M ${first.x} ${first.y}`)
}

function journeyPathColors(mode) {
  if (mode === 'dark') {
    return {
      accent: '#0f82f5',
      body: '#c8d8f0',
      callout: '#102642',
      heading: '#ffffff',
      hotspot: '#fc5161',
      surface: '#071228',
    }
  }
  return {
    accent: '#0f82f5',
    body: '#444444',
    callout: '#eef6fe',
    heading: '#090909',
    hotspot: '#fc5161',
    surface: '#ffffff',
  }
}

function round(value) {
  return Math.round(value * 10) / 10
}
