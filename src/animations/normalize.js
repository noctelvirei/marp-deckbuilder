import { getAnimation, supportedAnimationList } from './registry.js'

const validTriggers = new Set(['on-click', 'with-previous', 'after-previous'])
const validSequences = new Set(['together', 'stagger'])

export function normalizeSlideAnimation(directives = {}) {
  const rawName = clean(directives.animation)
  if (!rawName || isDisabled(rawName)) return null

  const definition = getAnimation(rawName)
  if (!definition) {
    throw new Error(
      `Unsupported deck-slide animation "${rawName}". Supported animations: ${supportedAnimationList()}.`,
    )
  }

  const direction = clean(directives['animation-direction'])
  if (direction) {
    throw new Error(`deck-slide animation "${definition.name}" does not support animation-direction.`)
  }

  const trigger = normalizeEnum(
    directives['animation-trigger'],
    'animation-trigger',
    validTriggers,
    'after-previous',
  )
  const sequence = normalizeEnum(
    directives['animation-sequence'],
    'animation-sequence',
    validSequences,
    'together',
  )

  return {
    name: definition.name,
    trigger,
    durationMs: normalizeDuration(directives['animation-duration']),
    delayMs: normalizeDelay(directives['animation-delay']),
    sequence,
    htmlClass: definition.htmlClass,
    htmlKeyframes: definition.htmlKeyframes,
    pptx: definition.pptx,
  }
}

function normalizeEnum(value, attribute, validValues, fallback) {
  const normalized = clean(value)
  if (!normalized) return fallback
  if (validValues.has(normalized)) return normalized
  throw new Error(
    `Unsupported deck-slide ${attribute} "${normalized}". Supported values: ${[...validValues].join(', ')}.`,
  )
}

function normalizeDuration(value) {
  if (value === undefined || value === null || String(value).trim() === '') return 500
  return normalizeMs(value, 'animation-duration', { min: 1, max: 60000 })
}

function normalizeDelay(value) {
  if (value === undefined || value === null || String(value).trim() === '') return 0
  return normalizeMs(value, 'animation-delay', { min: 0, max: 600000 })
}

function normalizeMs(value, attribute, { min, max }) {
  const raw = String(value).trim()
  if (!/^\d+$/.test(raw)) {
    throw new Error(`deck-slide ${attribute} must be a whole number of milliseconds.`)
  }
  const ms = Number.parseInt(raw, 10)
  if (ms < min || ms > max) {
    throw new Error(`deck-slide ${attribute} must be between ${min} and ${max} milliseconds.`)
  }
  return ms
}

function clean(value) {
  return String(value || '').trim().toLowerCase()
}

function isDisabled(value) {
  return ['none', 'off', 'false', 'no', '0'].includes(value)
}
