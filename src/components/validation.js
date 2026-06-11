import { richHtmlTags } from './rich-html-definitions.js'
import { cleanText } from './utils.js'

const knownDeckTags = new Set([
  'deck-card',
  'deck-card-grid',
  'deck-chart',
  'deck-close',
  'deck-comparison',
  'deck-divider',
  'deck-exec-card',
  'deck-exec-cards',
  'deck-exec-metric',
  'deck-exec-metrics',
  'deck-exec-milestone',
  'deck-exec-panel',
  'deck-exec-row',
  'deck-exec-rows',
  'deck-exec-timeline',
  'deck-exec-title',
  'deck-lane',
  'deck-logo',
  'deck-logo-wall',
  'deck-next-steps',
  'deck-proof',
  'deck-row',
  'deck-stat',
  'deck-stat-grid',
  'deck-step',
  'deck-swimlane',
  'deck-takeaway',
  'deck-visual',
  ...richHtmlTags,
])

export function componentContext(options = {}) {
  return options.slideNumber ? `slide ${options.slideNumber}` : 'deck'
}

export function validateDeckComponentSyntax(source, context) {
  const stack = []
  const tagPattern = /<\/?\s*(deck-[a-z0-9-]+)\b[^>]*>/gi

  for (const match of source.matchAll(tagPattern)) {
    const raw = match[0]
    const tag = match[1].toLowerCase()
    const line = lineNumberAt(source, match.index)
    if (!knownDeckTags.has(tag)) fail(`Unknown deck component <${tag}>.`, context, line)

    const isClosing = /^<\s*\//.test(raw)
    const isSelfClosing = /\/\s*>$/.test(raw)
    if (isClosing) {
      const opened = stack.pop()
      if (!opened) fail(`Closing </${tag}> has no matching opening tag.`, context, line)
      if (opened.tag !== tag) {
        fail(
          `Mismatched deck component tags: opened <${opened.tag}> on line ${opened.line}, but found </${tag}>.`,
          context,
          line,
        )
      }
    } else if (!isSelfClosing) {
      stack.push({ tag, line })
    }
  }

  if (stack.length > 0) {
    const opened = stack[stack.length - 1]
    fail(`Unclosed deck component <${opened.tag}> opened on line ${opened.line}.`, context, opened.line)
  }
}

export function validateDeckComponentTree(root, context) {
  const parentRules = [
    ['deck-card', 'deck-card-grid'],
    ['deck-row', 'deck-comparison'],
    ['deck-lane', 'deck-swimlane'],
    ['deck-logo', 'deck-logo-wall'],
    ['deck-exec-row', 'deck-exec-rows'],
    ['deck-exec-card', 'deck-exec-cards'],
    ['deck-exec-milestone', 'deck-exec-timeline'],
    ['deck-exec-metric', 'deck-exec-metrics'],
    ['deck-exec-panel', 'deck-exec-metrics'],
  ]

  for (const [childTag, parentTag] of parentRules) {
    root(childTag).each((_, element) => {
      if (!root(element).parent().is(parentTag)) {
        fail(`<${childTag}> must be placed directly inside <${parentTag}>.`, context)
      }
    })
  }

  const multiParentRules = [
    ['deck-rich-item', ['deck-rich-agenda', 'deck-neon-title']],
    ['deck-rich-card', ['deck-tilt-cards', 'deck-glass-cards', 'deck-stagger-grid']],
    ['deck-rich-metric', ['deck-rich-stats', 'deck-metric-rings', 'deck-gauge']],
    ['deck-rich-series', ['deck-rich-bars', 'deck-rich-line']],
    ['deck-rich-segment', ['deck-rich-donut']],
    ['deck-rich-milestone', ['deck-rich-timeline']],
    ['deck-rich-phrase', ['deck-typewriter']],
    ['deck-rich-axis', ['deck-radar-chart']],
    ['deck-rich-column', ['deck-comparison-reveal']],
    ['deck-rich-row', ['deck-comparison-reveal']],
    ['deck-magazine-page', ['deck-magazine-book']],
  ]

  for (const [childTag, parentTags] of multiParentRules) {
    root(childTag).each((_, element) => {
      const parent = root(element).parent()
      if (!parentTags.some((parentTag) => parent.is(parentTag))) {
        fail(`<${childTag}> must be placed directly inside ${parentTags.map((tag) => `<${tag}>`).join(' or ')}.`, context)
      }
    })
  }

  root('deck-step').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('deck-lane') && !parent.is('deck-next-steps')) {
      fail('<deck-step> must be placed directly inside <deck-lane> or <deck-next-steps>.', context)
    }
  })

  root('deck-stat').each((_, element) => {
    const parent = root(element).parent()
    if (!parent.is('deck-stat-grid') && !parent.is('deck-proof')) {
      fail('<deck-stat> must be placed directly inside <deck-stat-grid> or <deck-proof>.', context)
    }
  })
}

export function validateChart(chart, context) {
  if (chart.labels.length === 0 || chart.values.length === 0) {
    fail('deck-chart requires non-empty labels and values attributes.', context)
  }
  if (chart.labels.length !== chart.values.length) {
    fail(
      `deck-chart labels/values length mismatch: ${chart.labels.length} label(s), ${chart.values.length} value(s).`,
      context,
    )
  }
  if (chart.values.some((value) => !Number.isFinite(value))) {
    fail('deck-chart values must all be numeric.', context)
  }
}

export function validateExecTitleCopy(model, context) {
  assertCopyFits({
    component: 'deck-exec-title',
    field: 'title',
    text: model.title,
    maxChars: 42,
    maxLines: 2,
    charsPerLine: 22,
    context,
  })
  if (model.subtitle) {
    assertCopyFits({
      component: 'deck-exec-title',
      field: 'subtitle',
      text: model.subtitle,
      maxChars: 110,
      maxLines: 2,
      charsPerLine: 58,
      context,
    })
  }
}

export function validateExecRowsCopy(model, context) {
  model.rows.forEach((row, index) => {
    const label = `deck-exec-row[${index + 1}]`
    assertCopyFits({
      component: 'deck-exec-rows',
      field: `${label}.title`,
      text: row.title,
      maxChars: 28,
      maxLines: 1,
      charsPerLine: 28,
      context,
    })
    if (row.body) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: `${label}.body`,
        text: row.body,
        maxChars: 105,
        maxLines: 2,
        charsPerLine: 58,
        context,
      })
    }
    if (row.note) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: `${label}.note`,
        text: row.note,
        maxChars: 16,
        maxLines: 1,
        charsPerLine: 16,
        context,
      })
    }
  })

  if (model.side) {
    if (model.side.value) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: 'side-value',
        text: model.side.value,
        maxChars: 8,
        maxLines: 1,
        charsPerLine: 8,
        context,
      })
    }
    if (model.side.body) {
      assertCopyFits({
        component: 'deck-exec-rows',
        field: 'side-body',
        text: model.side.body,
        maxChars: 62,
        maxLines: 4,
        charsPerLine: 18,
        context,
      })
    }
  }
}

export function validateExecCardsCopy(model, context) {
  const columns = model.columns || 3
  const titleChars = columns === 4 ? 22 : 30
  const metricChars = columns === 4 ? 10 : 14
  const bodyChars = columns === 4 ? 82 : 100

  model.cards.forEach((card, index) => {
    const label = `deck-exec-card[${index + 1}]`
    if (card.title) {
      assertCopyFits({
        component: 'deck-exec-cards',
        field: `${label}.title`,
        text: card.title,
        maxChars: titleChars,
        maxLines: 2,
        charsPerLine: columns === 4 ? 15 : 22,
        context,
      })
    }
    if (card.metric) {
      assertCopyFits({
        component: 'deck-exec-cards',
        field: `${label}.metric`,
        text: card.metric,
        maxChars: metricChars,
        maxLines: 1,
        charsPerLine: metricChars,
        context,
      })
    }
    if (card.body) {
      assertCopyFits({
        component: 'deck-exec-cards',
        field: `${label}.body`,
        text: card.body,
        maxChars: bodyChars,
        maxLines: columns === 4 ? 4 : 3,
        charsPerLine: columns === 4 ? 26 : 42,
        context,
      })
    }
  })
}

export function validateSwimlaneCopy(model, context) {
  model.lanes.forEach((lane, laneIndex) => {
    const stepCount = Math.max(1, lane.steps.length)
    const compact = model.lanes.length >= 3 || stepCount >= 3
    const bodyChars = stepCount >= 4 ? 88 : compact ? 105 : 116
    lane.steps.forEach((step, stepIndex) => {
      const label = `deck-lane[${laneIndex + 1}].deck-step[${stepIndex + 1}]`
      assertCopyFits({
        component: 'deck-swimlane',
        field: `${label}.title`,
        text: step.title,
        maxChars: 22,
        maxLines: 1,
        charsPerLine: 22,
        context,
      })
      if (step.body) {
        assertCopyFits({
          component: 'deck-swimlane',
          field: `${label}.body`,
          text: step.body,
          maxChars: bodyChars,
          maxLines: compact ? 2 : 3,
          charsPerLine: stepCount >= 4 ? 36 : compact ? 52 : 42,
          context,
        })
      }
    })
  })
}

export function validateDividerCopy(model, context) {
  assertCopyFits({
    component: 'deck-divider',
    field: 'title',
    text: model.title,
    maxChars: 82,
    maxLines: 3,
    charsPerLine: 30,
    context,
  })
  if (model.subtitle) {
    assertCopyFits({
      component: 'deck-divider',
      field: 'subtitle',
      text: model.subtitle,
      maxChars: 130,
      maxLines: 2,
      charsPerLine: 65,
      context,
    })
  }
}

export function fail(message, context = 'deck', line = 0) {
  throw new Error(`Invalid deck Markdown in ${context}${line ? `, line ${line}` : ''}: ${message}`)
}

function assertCopyFits({ component, field, text, maxChars, maxLines, charsPerLine, context }) {
  const normalized = cleanText(text)
  if (!normalized) return
  const lines = estimateCopyLines(normalized, charsPerLine)
  if (normalized.length <= maxChars && lines <= maxLines) return

  fail(
    `Keep <${component}>; shorten ${field} to fit this component (${normalized.length}/${maxChars} chars, ${lines}/${maxLines} estimated line(s)). Do not switch component type; reduce words or split the idea across another slide.`,
    context,
  )
}

function estimateCopyLines(text, charsPerLine) {
  return String(text || '')
    .split(/\r?\n/)
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.trim().length / Math.max(8, charsPerLine))), 0)
}

function lineNumberAt(source, index = 0) {
  return String(source || '').slice(0, index).split(/\r?\n/).length
}
