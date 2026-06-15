import assert from 'node:assert/strict'
import { mkdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import JSZip from 'jszip'

import { loadDefinitions } from '../src/brand.js'
import { parseDeckMarkdown } from '../src/markdown.js'
import { renderDeckHtml } from '../src/render.js'
import { writePptx } from '../src/pptx.js'

const tmpRoot = path.resolve('.tmp', 'animation-tests')

test('parses enter-fade deck-slide animation metadata', () => {
  const deck = parseDeckMarkdown(`<deck-slide
  layout="content"
  animation="enter-fade"
  animation-trigger="after-previous"
  animation-duration="750"
  animation-delay="100"
  animation-sequence="stagger"
/>

# Fade in

Body copy`)

  assert.deepEqual(deck.slides[0].animation, {
    name: 'enter-fade',
    trigger: 'after-previous',
    durationMs: 750,
    delayMs: 100,
    sequence: 'stagger',
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
  })
  assert.doesNotMatch(deck.slides[0].source, /<deck-slide/i)
})

test('rejects unsupported controlled animation metadata', () => {
  assert.throws(
    () => parseDeckMarkdown(`# Broken

<deck-slide animation="enter-swivel" />`),
    /Unsupported deck-slide animation "enter-swivel".*Supported animations:/,
  )

  assert.throws(
    () => parseDeckMarkdown(`# Broken

<deck-slide animation="enter-fade" animation-trigger="hover" />`),
    /Unsupported deck-slide animation-trigger "hover"/,
  )

  assert.throws(
    () => parseDeckMarkdown(`# Broken

<deck-slide animation="enter-fade" animation-duration="fast" />`),
    /deck-slide animation-duration must be a whole number of milliseconds/,
  )

  assert.throws(
    () => parseDeckMarkdown(`# Broken

<deck-slide animation="enter-fade" animation-direction="left" />`),
    /deck-slide animation "enter-fade" does not support animation-direction/,
  )
})

test('writes enter-wipe HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('wipe')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-wipe"
  animation-duration="900"
  animation-delay="150"
/>

# Wipe proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-wipe.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-wipe/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-wipe/)
  assert.match(rendered.document, /clip-path: inset\(0 0 100% 0\)/)
  assert.match(timingXml, /presetID="22"/)
  assert.match(timingXml, /presetSubtype="4"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="wipe\(down\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
  assert.match(timingXml, /<p:cond delay="150"\/>/)
})

test('writes enter-zoom HTML and PPTX scale timing', async () => {
  const tmpDir = await resetTmp('zoom')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-zoom"
  animation-duration="900"
  animation-delay="150"
/>

# Zoom proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-zoom.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-zoom/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-zoom/)
  assert.match(rendered.document, /transform: scale\(0\)/)
  assert.match(timingXml, /presetID="23"/)
  assert.match(timingXml, /presetSubtype="16"/)
  assert.match(timingXml, /<p:attrName>ppt_w<\/p:attrName>/)
  assert.match(timingXml, /<p:attrName>ppt_h<\/p:attrName>/)
  assert.match(timingXml, /<p:fltVal val="0"\/>/)
  assert.match(timingXml, /<p:strVal val="#ppt_w"\/>/)
  assert.match(timingXml, /<p:strVal val="#ppt_h"\/>/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900" fill="hold"\/>/)
})

test('writes enter-split HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('split')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-split"
  animation-duration="900"
  animation-delay="150"
/>

# Split proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-split.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-split/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-split/)
  assert.match(rendered.document, /clip-path: inset\(0 50% 0 50%\)/)
  assert.match(timingXml, /presetID="16"/)
  assert.match(timingXml, /presetSubtype="21"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="barn\(inVertical\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-wheel HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('wheel')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-wheel"
  animation-duration="900"
  animation-delay="150"
/>

# Wheel proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-wheel.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-wheel/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-wheel/)
  assert.match(rendered.document, /polygon\(50% 50%, 50% 0/)
  assert.match(timingXml, /presetID="21"/)
  assert.match(timingXml, /presetSubtype="1"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="wheel\(1\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-box HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('box')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-box"
  animation-duration="900"
  animation-delay="150"
/>

# Box proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-box.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-box/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-box/)
  assert.match(rendered.document, /clip-path: inset\(50% 50% 50% 50%\)/)
  assert.match(timingXml, /presetID="4"/)
  assert.match(timingXml, /presetSubtype="16"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="box\(in\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-diamond HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('diamond')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-diamond"
  animation-duration="900"
  animation-delay="150"
/>

# Diamond proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-diamond.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-diamond/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-diamond/)
  assert.match(rendered.document, /polygon\(50% 50%, 50% 50%, 50% 50%, 50% 50%\)/)
  assert.match(timingXml, /presetID="8"/)
  assert.match(timingXml, /presetSubtype="16"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="diamond\(in\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-circle HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('circle')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-circle"
  animation-duration="900"
  animation-delay="150"
/>

# Circle proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-circle.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-circle/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-circle/)
  assert.match(rendered.document, /clip-path: circle\(0 at 50% 50%\)/)
  assert.match(timingXml, /presetID="6"/)
  assert.match(timingXml, /presetSubtype="16"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="circle\(in\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-blinds HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('blinds')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-blinds"
  animation-duration="900"
  animation-delay="150"
/>

# Blinds proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-blinds.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-blinds/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-blinds/)
  assert.match(rendered.document, /repeating-linear-gradient\(to bottom/)
  assert.match(timingXml, /presetID="3"/)
  assert.match(timingXml, /presetSubtype="10"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="blinds\(horizontal\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-checkerboard HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('checkerboard')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-checkerboard"
  animation-duration="900"
  animation-delay="150"
/>

# Checkerboard proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-checkerboard.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-checkerboard/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-checkerboard/)
  assert.match(rendered.document, /repeating-conic-gradient/)
  assert.match(timingXml, /presetID="5"/)
  assert.match(timingXml, /presetSubtype="10"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="checkerboard\(across\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-random-bars HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('random-bars')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-random-bars"
  animation-duration="900"
  animation-delay="150"
/>

# Random bars proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-random-bars.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-random-bars/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-random-bars/)
  assert.match(rendered.document, /--deck-anim-random-bars-open/)
  assert.match(timingXml, /presetID="14"/)
  assert.match(timingXml, /presetSubtype="10"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="randombar\(horizontal\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-dissolve HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('dissolve')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-dissolve"
  animation-duration="900"
  animation-delay="150"
/>

# Dissolve proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-dissolve.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-dissolve/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-dissolve/)
  assert.match(rendered.document, /filter: blur\(3px\)/)
  assert.match(timingXml, /presetID="9"/)
  assert.match(timingXml, /presetSubtype="0"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="dissolve">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-peek HTML and PPTX motion/filter timing', async () => {
  const tmpDir = await resetTmp('peek')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-peek"
  animation-duration="900"
  animation-delay="150"
/>

# Peek proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-peek.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-peek/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-peek/)
  assert.match(rendered.document, /translateY\(110%\)/)
  assert.match(timingXml, /presetID="12"/)
  assert.match(timingXml, /presetSubtype="4"/)
  assert.match(timingXml, /<p:attrName>ppt_y<\/p:attrName>/)
  assert.match(timingXml, /<p:strVal val="#ppt_y\+#ppt_h\*1\.125000"\/>/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="wipe\(up\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-strips HTML and PPTX filter timing', async () => {
  const tmpDir = await resetTmp('strips')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-strips"
  animation-duration="900"
  animation-delay="150"
/>

# Strips proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-strips.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-strips/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-strips/)
  assert.match(rendered.document, /polygon\(100% 0, 100% 0, 100% 0, 100% 0\)/)
  assert.match(rendered.document, /polygon\(0 0, 100% 0, 100% 100%, 0 100%\)/)
  assert.match(timingXml, /presetID="18"/)
  assert.match(timingXml, /presetSubtype="12"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="strips\(downLeft\)">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900"\/>/)
})

test('writes enter-fly HTML and PPTX motion timing', async () => {
  const tmpDir = await resetTmp('fly')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-fly"
  animation-duration="900"
  animation-delay="150"
/>

# Fly proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-fly.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-fly/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-fly/)
  assert.match(rendered.document, /translateY\(120vh\)/)
  assert.match(timingXml, /presetID="2"/)
  assert.match(timingXml, /presetSubtype="4"/)
  assert.match(timingXml, /<p:attrName>ppt_x<\/p:attrName>/)
  assert.match(timingXml, /<p:attrName>ppt_y<\/p:attrName>/)
  assert.match(timingXml, /<p:strVal val="1\+#ppt_h\/2"\/>/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="900" fill="hold"\/>/)
  assert.match(timingXml, /<p:cond delay="150"\/>/)
})

test('writes enter-appear as instant HTML and PPTX visibility timing', async () => {
  const tmpDir = await resetTmp('appear')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-appear"
  animation-duration="900"
  animation-delay="250"
/>

# Appear proof

Body copy`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'enter-appear.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)

  assert.match(rendered.document, /deck-anim-enter-appear/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-appear/)
  assert.match(rendered.document, /--deck-anim-keyframes: deck-presentation-enter-appear/)
  assert.match(timingXml, /presetID="1"/)
  assert.match(timingXml, /presetSubtype="0"/)
  assert.match(timingXml, /<p:attrName>style\.visibility<\/p:attrName>/)
  assert.doesNotMatch(timingXml, /<p:animEffect/)
  assert.doesNotMatch(timingXml, /<p:anim calcmode=/)
  assert.match(timingXml, /<p:cond delay="250"\/>/)
})

test('renders enter-fade HTML classes while preserving authored slide classes', async () => {
  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-fade"
  animation-trigger="on-click"
  animation-duration="750"
  animation-delay="100"
/>
<!-- _class: custom-slide -->

# Fade in

Body copy

---

# Component local animation remains

<deck-impact-radar
  title="Impact profile"
  labels="Speed, Control, Effort"
  values="80, 70, 60"
></deck-impact-radar>`)

  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })

  assert.match(rendered.document, /class="[^"]*custom-slide[^"]*deck-anim-enter-fade/)
  assert.match(rendered.document, /class="[^"]*custom-slide[^"]*deck-anim-controlled/)
  assert.match(rendered.document, /deck-anim-trigger-on-click/)
  assert.match(rendered.document, /deck-anim-item-played/)
  assert.match(rendered.document, /@keyframes deck-presentation-enter-fade/)
  assert.match(rendered.document, /\[data-deckbuilder-slide\]\.active > foreignObject > /)
  assert.match(rendered.document, /svg\.bespoke-marp-active > foreignObject > section\.deck-anim-controlled/)
  assert.match(rendered.document, /function isSlideActive\(slide\)/)
  assert.match(rendered.document, /function isInteractiveTarget\(target\)/)
  assert.match(rendered.document, /if \(isInteractiveTarget\(event\.target\)\) return/)
  assert.match(rendered.document, /candidate\.dataset\.deckAnimActive = 'false'/)
  assert.match(rendered.document, /slide\.dataset\.deckAnimActive === 'true'/)
  assert.match(rendered.document, /querySelectorAll\('\[data-deckbuilder-slide\], svg\[data-marpit-svg\], '/)
  assert.match(rendered.document, /deck-anim-sequence-stagger \.deck-anim-item-played/)
  assert.match(rendered.document, /deck-anim-item:not\(\.deck-anim-item-played\)/)
  assert.match(rendered.document, /armedSlide = null/)
  assert.match(rendered.document, /--deck-anim-duration: 750ms/)
  assert.match(rendered.document, /--deck-anim-delay: 100ms/)
  assert.match(rendered.document, /deck-anim-played/)
  assert.match(rendered.document, /deck-impact-radar-shape-animated/)
})

test('writes enter-fade PPTX timing XML for non-chrome slide content', async () => {
  const tmpDir = await resetTmp('content')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  animation="enter-fade"
  animation-duration="750"
  animation-delay="100"
/>

# Fade proof

Body copy`)
  const out = path.join(tmpDir, 'enter-fade.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const slideXml = await pptxSlideXml(out, 1)
  const timingXml = slideXml.match(/<p:timing[\s\S]*<\/p:timing>/)?.[0] || ''

  assert.match(timingXml, /presetID="10"/)
  assert.match(timingXml, /presetClass="entr"/)
  assert.match(timingXml, /nodeType="afterEffect"/)
  assert.match(timingXml, /<p:animEffect transition="in" filter="fade">/)
  assert.match(timingXml, /<p:cTn id="\d+" dur="750"\/>/)
  assert.match(timingXml, /<p:cond delay="100"\/>/)
  assert.doesNotMatch(timingXml, /spid="2"/)
  assert.doesNotMatch(timingXml, /spid="3"/)
  assert.match(timingXml, /<p:bldP spid="4" grpId="0" animBg="1"\/>/)
  assert.match(timingXml, /<p:bldP spid="5" grpId="0" animBg="1"\/>/)
})

test('writes on-click stagger markdown bullets as individual PPTX click effects', async () => {
  const tmpDir = await resetTmp('click-stagger-bullets')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide
  layout="content"
  animation="enter-fade"
  animation-trigger="on-click"
  animation-sequence="stagger"
  animation-duration="500"
  takeaway="PPTX takeaway should not become an extra click target."
/>

# Click build

- Confirm the decision path.
- Map the control evidence.
- Pilot with measured outcomes.`)
  const rendered = renderDeckHtml(deck, { resourcesDir: 'resources', definitions })
  const out = path.join(tmpDir, 'click-stagger-bullets.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const timingXml = await pptxSlideTiming(out, 1)
  const clickEffects = timingXml.match(/nodeType="clickEffect"/g) || []
  const builds = timingXml.match(/<p:bldP spid="\d+" grpId="0" animBg="1"\/>/g) || []
  const zeroDelayConditions = timingXml.match(/<p:cond delay="0"\/>/g) || []

  assert.match(rendered.document, /element\.matches\('h1'\)/)
  assert.match(rendered.document, /querySelectorAll\(':scope > li'\)/)
  assert.equal(clickEffects.length, 3)
  assert.equal(builds.length, 3)
  assert.equal(zeroDelayConditions.length >= 3, true)
  assert.doesNotMatch(timingXml, /delay="120"/)
  assert.doesNotMatch(timingXml, /delay="240"/)
})

test('writes enter-fade PPTX timing XML for native and SVG-backed chart slides', async () => {
  const tmpDir = await resetTmp('charts')

  const definitions = await loadDefinitions(new URL('../resources/definitions', import.meta.url))
  const deck = parseDeckMarkdown(`<deck-slide animation="enter-fade" />

# Native chart

<deck-chart type="bar" title="Volume" labels="A, B, C" values="10, 20, 30"></deck-chart>

---

<deck-slide animation="enter-fade" />

# SVG chart

<deck-chart type="waterfall" title="Bridge" labels="Start, Add, End" values="100, 20, -10"></deck-chart>`)
  const out = path.join(tmpDir, 'chart-enter-fade.pptx')

  await writePptx({
    deck,
    outputPath: out,
    brand: definitions.brand,
    resourcesDir: path.resolve('resources'),
  })

  const nativeChartTiming = await pptxSlideTiming(out, 1)
  const svgChartTiming = await pptxSlideTiming(out, 2)

  assert.match(nativeChartTiming, /<p:animEffect transition="in" filter="fade">/)
  assert.match(nativeChartTiming, /<p:bldP spid="\d+" grpId="0" animBg="1"\/>/)
  assert.match(svgChartTiming, /<p:animEffect transition="in" filter="fade">/)
  assert.match(svgChartTiming, /<p:bldP spid="\d+" grpId="0" animBg="1"\/>/)
})

async function resetTmp(name) {
  const tmpDir = path.join(tmpRoot, name)
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })
  return tmpDir
}

async function pptxSlideTiming(filePath, slideNumber) {
  const slideXml = await pptxSlideXml(filePath, slideNumber)
  return slideXml.match(/<p:timing[\s\S]*<\/p:timing>/)?.[0] || ''
}

async function pptxSlideXml(filePath, slideNumber) {
  const archive = await JSZip.loadAsync(await readFile(filePath))
  return archive.file(`ppt/slides/slide${slideNumber}.xml`).async('string')
}
