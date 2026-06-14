export const animationAttributes = [
  'animation',
  'animation-trigger',
  'animation-duration',
  'animation-delay',
  'animation-direction',
  'animation-sequence',
]

const registry = new Map([
  ['enter-appear', {
    name: 'enter-appear',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-appear',
    htmlKeyframes: 'deck-presentation-enter-appear',
    pptx: {
      presetId: 1,
      presetClass: 'entr',
      presetSubtype: 0,
      behaviors: [],
    },
  }],
  ['enter-fade', {
    name: 'enter-fade',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-fade',
    htmlKeyframes: 'deck-presentation-enter-fade',
    pptx: {
      presetId: 10,
      presetClass: 'entr',
      presetSubtype: 0,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'fade' },
      ],
    },
  }],
  ['enter-fly', {
    name: 'enter-fly',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-fly',
    htmlKeyframes: 'deck-presentation-enter-fly',
    pptx: {
      presetId: 2,
      presetClass: 'entr',
      presetSubtype: 4,
      behaviors: [
        {
          type: 'animate',
          attribute: 'ppt_x',
          additive: 'base',
          fill: 'hold',
          values: [
            { time: 0, value: '#ppt_x' },
            { time: 100000, value: '#ppt_x' },
          ],
        },
        {
          type: 'animate',
          attribute: 'ppt_y',
          additive: 'base',
          fill: 'hold',
          values: [
            { time: 0, value: '1+#ppt_h/2' },
            { time: 100000, value: '#ppt_y' },
          ],
        },
      ],
    },
  }],
  ['enter-wipe', {
    name: 'enter-wipe',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-wipe',
    htmlKeyframes: 'deck-presentation-enter-wipe',
    pptx: {
      presetId: 22,
      presetClass: 'entr',
      presetSubtype: 4,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'wipe(down)' },
      ],
    },
  }],
  ['enter-zoom', {
    name: 'enter-zoom',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-zoom',
    htmlKeyframes: 'deck-presentation-enter-zoom',
    pptx: {
      presetId: 23,
      presetClass: 'entr',
      presetSubtype: 16,
      behaviors: [
        {
          type: 'animate',
          attribute: 'ppt_w',
          fill: 'hold',
          values: [
            { time: 0, value: 0, valueType: 'float' },
            { time: 100000, value: '#ppt_w' },
          ],
        },
        {
          type: 'animate',
          attribute: 'ppt_h',
          fill: 'hold',
          values: [
            { time: 0, value: 0, valueType: 'float' },
            { time: 100000, value: '#ppt_h' },
          ],
        },
      ],
    },
  }],
  ['enter-split', {
    name: 'enter-split',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-split',
    htmlKeyframes: 'deck-presentation-enter-split',
    pptx: {
      presetId: 16,
      presetClass: 'entr',
      presetSubtype: 21,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'barn(inVertical)' },
      ],
    },
  }],
  ['enter-wheel', {
    name: 'enter-wheel',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-wheel',
    htmlKeyframes: 'deck-presentation-enter-wheel',
    pptx: {
      presetId: 21,
      presetClass: 'entr',
      presetSubtype: 1,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'wheel(1)' },
      ],
    },
  }],
  ['enter-box', {
    name: 'enter-box',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-box',
    htmlKeyframes: 'deck-presentation-enter-box',
    pptx: {
      presetId: 4,
      presetClass: 'entr',
      presetSubtype: 16,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'box(in)' },
      ],
    },
  }],
  ['enter-diamond', {
    name: 'enter-diamond',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-diamond',
    htmlKeyframes: 'deck-presentation-enter-diamond',
    pptx: {
      presetId: 8,
      presetClass: 'entr',
      presetSubtype: 16,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'diamond(in)' },
      ],
    },
  }],
  ['enter-circle', {
    name: 'enter-circle',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-circle',
    htmlKeyframes: 'deck-presentation-enter-circle',
    pptx: {
      presetId: 6,
      presetClass: 'entr',
      presetSubtype: 16,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'circle(in)' },
      ],
    },
  }],
  ['enter-blinds', {
    name: 'enter-blinds',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-blinds',
    htmlKeyframes: 'deck-presentation-enter-blinds',
    pptx: {
      presetId: 3,
      presetClass: 'entr',
      presetSubtype: 10,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'blinds(horizontal)' },
      ],
    },
  }],
  ['enter-checkerboard', {
    name: 'enter-checkerboard',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-checkerboard',
    htmlKeyframes: 'deck-presentation-enter-checkerboard',
    pptx: {
      presetId: 5,
      presetClass: 'entr',
      presetSubtype: 10,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'checkerboard(across)' },
      ],
    },
  }],
  ['enter-random-bars', {
    name: 'enter-random-bars',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-random-bars',
    htmlKeyframes: 'deck-presentation-enter-random-bars',
    pptx: {
      presetId: 14,
      presetClass: 'entr',
      presetSubtype: 10,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'randombar(horizontal)' },
      ],
    },
  }],
  ['enter-dissolve', {
    name: 'enter-dissolve',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-dissolve',
    htmlKeyframes: 'deck-presentation-enter-dissolve',
    pptx: {
      presetId: 9,
      presetClass: 'entr',
      presetSubtype: 0,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'dissolve' },
      ],
    },
  }],
  ['enter-peek', {
    name: 'enter-peek',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-peek',
    htmlKeyframes: 'deck-presentation-enter-peek',
    pptx: {
      presetId: 12,
      presetClass: 'entr',
      presetSubtype: 4,
      behaviors: [
        {
          type: 'animate',
          attribute: 'ppt_y',
          additive: 'base',
          values: [
            { time: 0, value: '#ppt_y+#ppt_h*1.125000' },
            { time: 100000, value: '#ppt_y' },
          ],
        },
        { type: 'filter', transition: 'in', filter: 'wipe(up)' },
      ],
    },
  }],
  ['enter-strips', {
    name: 'enter-strips',
    kind: 'entrance',
    htmlClass: 'deck-anim-enter-strips',
    htmlKeyframes: 'deck-presentation-enter-strips',
    pptx: {
      presetId: 18,
      presetClass: 'entr',
      presetSubtype: 12,
      behaviors: [
        { type: 'filter', transition: 'in', filter: 'strips(downLeft)' },
      ],
    },
  }],
])

export function getAnimation(name) {
  return registry.get(String(name || '').trim().toLowerCase()) || null
}

export function supportedAnimationNames() {
  return [...registry.keys()]
}

export function supportedAnimations() {
  return [...registry.values()]
}

export function supportedAnimationList() {
  return supportedAnimationNames().join(', ')
}
