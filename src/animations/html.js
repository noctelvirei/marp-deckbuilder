import { getAnimation } from './registry.js'

export function htmlAnimationClassNames(slide) {
  const animation = slide?.animation
  if (!animation) return []
  return [
    'deck-anim-controlled',
    animation.htmlClass,
    `deck-anim-slide-${Number(slide.index || 0) + 1}`,
    `deck-anim-trigger-${animation.trigger}`,
    `deck-anim-sequence-${animation.sequence}`,
  ]
}

export function presentationAnimationCss(slides = []) {
  const animatedSlides = slides.filter((slide) => slide.animation)
  if (!animatedSlides.length) return ''

  return `${baseAnimationCss()}
${animatedSlides.map(slideAnimationVariables).join('\n')}`
}

export function presentationAnimationScript(slides = []) {
  if (!slides.some((slide) => slide.animation?.trigger === 'on-click')) return ''

  return `(() => {
  const selector = 'section.deck-anim-controlled.deck-anim-trigger-on-click'
  const chromeSelector = '.deck-brand-logo,.deck-company-logo,.deck-customer-logo-frame'
  let armedSlide = null

  function prepare(slide) {
    if (!slide) return
    animationTargets(slide).forEach((target) => target.classList.add('deck-anim-item'))
  }

  function arm(slide) {
    if (!slide) return
    if (slide.classList.contains('deck-anim-played')) {
      slide.classList.remove('deck-anim-played')
    }
    slide.querySelectorAll('.deck-anim-item-played').forEach((target) => {
      target.classList.remove('deck-anim-item-played')
    })
  }

  function activeSlide() {
    return document.querySelector('svg.bespoke-marp-active > foreignObject > ' + selector) ||
      document.querySelector(selector + '.bespoke-active') ||
      document.querySelector(selector + '.bespoke-marp-active')
  }

  document.querySelectorAll(selector).forEach((slide) => {
    prepare(slide)
    arm(slide)
  })

  function animationTargets(slide) {
    const targets = []
    Array.from(slide.children).forEach((element) => {
      if (element.matches(chromeSelector)) return
      if (element.matches('h1')) return
      if (element.matches('ul,ol')) {
        targets.push(...element.querySelectorAll(':scope > li'))
        return
      }
      targets.push(element)
    })
    return targets
  }

  function syncActiveSlide() {
    const slide = activeSlide()
    if (!slide) {
      armedSlide = null
      return
    }
    if (slide === armedSlide) return
    prepare(slide)
    arm(slide)
    armedSlide = slide
  }

  const observer = new MutationObserver(syncActiveSlide)
  document.querySelectorAll('svg[data-marpit-svg], ' + selector).forEach((element) => {
    observer.observe(element, { attributes: true, attributeFilter: ['class'] })
  })
  window.addEventListener('hashchange', () => setTimeout(syncActiveSlide, 0))
  setTimeout(syncActiveSlide, 0)

  function play(event) {
    const slide = activeSlide()
    if (!slide) return
    if (slide.classList.contains('deck-anim-sequence-stagger')) {
      const next = animationTargets(slide).find((target) =>
        !target.classList.contains('deck-anim-item-played')
      )
      if (!next) return
      next.classList.add('deck-anim-item-played')
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (slide.classList.contains('deck-anim-played')) return
    slide.classList.add('deck-anim-played')
    event.preventDefault()
    event.stopPropagation()
  }

  document.addEventListener('click', play, true)
  document.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') play(event)
  }, true)
})()`
}

function baseAnimationCss() {
  return `@keyframes deck-presentation-enter-appear {
  from { opacity: 0; visibility: hidden; }
  to { opacity: 1; visibility: visible; }
}

@keyframes deck-presentation-enter-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes deck-presentation-enter-fly {
  from { transform: translateY(120vh); }
  to { transform: translateY(0); }
}

@keyframes deck-presentation-enter-wipe {
  from { clip-path: inset(0 0 100% 0); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes deck-presentation-enter-zoom {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

@keyframes deck-presentation-enter-split {
  from { clip-path: inset(0 50% 0 50%); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes deck-presentation-enter-wheel {
  0% { clip-path: polygon(50% 50%, 50% 0, 50% 0, 50% 50%); }
  25% { clip-path: polygon(50% 50%, 50% 0, 100% 0, 100% 50%, 50% 50%); }
  50% { clip-path: polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 50% 100%, 50% 50%); }
  75% { clip-path: polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%); }
  100% { clip-path: inset(0 0 0 0); }
}

@keyframes deck-presentation-enter-box {
  from { clip-path: inset(50% 50% 50% 50%); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes deck-presentation-enter-diamond {
  from { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
  to { clip-path: polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%); }
}

@keyframes deck-presentation-enter-circle {
  from { clip-path: circle(0 at 50% 50%); }
  to { clip-path: circle(75% at 50% 50%); }
}

@property --deck-anim-blinds-open {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@keyframes deck-presentation-enter-blinds {
  from { --deck-anim-blinds-open: 0px; }
  to { --deck-anim-blinds-open: 16px; }
}

@keyframes deck-presentation-enter-checkerboard {
  0% {
    opacity: 0;
    -webkit-mask-image: repeating-conic-gradient(#000 0 25%, transparent 0 50%);
    mask-image: repeating-conic-gradient(#000 0 25%, transparent 0 50%);
    -webkit-mask-size: 24px 24px;
    mask-size: 24px 24px;
  }
  70% {
    opacity: 1;
    -webkit-mask-image: repeating-conic-gradient(#000 0 25%, transparent 0 50%);
    mask-image: repeating-conic-gradient(#000 0 25%, transparent 0 50%);
    -webkit-mask-size: 24px 24px;
    mask-size: 24px 24px;
  }
  100% {
    opacity: 1;
    -webkit-mask-image: none;
    mask-image: none;
  }
}

@property --deck-anim-random-bars-open {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@keyframes deck-presentation-enter-random-bars {
  0% { --deck-anim-random-bars-open: 0px; opacity: 0; }
  30% { --deck-anim-random-bars-open: 5px; opacity: 1; }
  65% { --deck-anim-random-bars-open: 13px; opacity: 1; }
  100% { --deck-anim-random-bars-open: 18px; opacity: 1; }
}

@keyframes deck-presentation-enter-dissolve {
  from { opacity: 0; filter: blur(3px); }
  to { opacity: 1; filter: blur(0); }
}

@keyframes deck-presentation-enter-peek {
  from {
    transform: translateY(110%);
    clip-path: inset(100% 0 0 0);
  }
  to {
    transform: translateY(0);
    clip-path: inset(0 0 0 0);
  }
}

@keyframes deck-presentation-enter-strips {
  from { clip-path: polygon(100% 0, 100% 0, 100% 0, 100% 0); }
  70% { clip-path: polygon(100% -40%, 140% 0, 0 140%, -40% 100%); }
  to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}

section.deck-anim-controlled {
  --deck-anim-duration: 500ms;
  --deck-anim-delay: 0ms;
  --deck-anim-easing: ease;
  --deck-anim-effective-duration: var(--deck-anim-duration);
  --deck-anim-keyframes: deck-presentation-enter-fade;
}

section.deck-anim-enter-appear {
  --deck-anim-effective-duration: 1ms;
  --deck-anim-easing: step-end;
}

section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(1) { --deck-anim-stagger-offset: 0ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(2) { --deck-anim-stagger-offset: 120ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(3) { --deck-anim-stagger-offset: 240ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(4) { --deck-anim-stagger-offset: 360ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(5) { --deck-anim-stagger-offset: 480ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(6) { --deck-anim-stagger-offset: 600ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(7) { --deck-anim-stagger-offset: 720ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(8) { --deck-anim-stagger-offset: 840ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(9) { --deck-anim-stagger-offset: 960ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(10) { --deck-anim-stagger-offset: 1080ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(11) { --deck-anim-stagger-offset: 1200ms; }
section.deck-anim-controlled.deck-anim-sequence-stagger > :nth-child(12) { --deck-anim-stagger-offset: 1320ms; }

section.deck-anim-controlled.bespoke-active:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-controlled.bespoke-marp-active:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
svg.bespoke-marp-active > foreignObject > section.deck-anim-controlled:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-controlled.deck-anim-trigger-on-click.deck-anim-played > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
svg.bespoke-marp-active > foreignObject > section.deck-anim-controlled.deck-anim-trigger-on-click.deck-anim-played > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-controlled.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item-played,
svg.bespoke-marp-active > foreignObject > section.deck-anim-controlled.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item-played {
  animation-name: var(--deck-anim-keyframes);
  animation-duration: var(--deck-anim-effective-duration);
  animation-timing-function: var(--deck-anim-easing);
  animation-fill-mode: both;
  animation-delay: calc(var(--deck-anim-delay) + var(--deck-anim-stagger-offset, 0ms));
  transform-origin: center;
}

section.deck-anim-controlled.deck-anim-trigger-on-click:not(.deck-anim-played):not(.deck-anim-sequence-stagger) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-controlled.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item:not(.deck-anim-item-played) {
  opacity: 0;
  visibility: hidden;
}

section.deck-anim-enter-blinds.bespoke-active:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-enter-blinds.bespoke-marp-active:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
svg.bespoke-marp-active > foreignObject > section.deck-anim-enter-blinds:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-enter-blinds.deck-anim-trigger-on-click.deck-anim-played > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
svg.bespoke-marp-active > foreignObject > section.deck-anim-enter-blinds.deck-anim-trigger-on-click.deck-anim-played > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-enter-blinds.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item-played,
svg.bespoke-marp-active > foreignObject > section.deck-anim-enter-blinds.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item-played {
  -webkit-mask-image: repeating-linear-gradient(to bottom, #000 0 var(--deck-anim-blinds-open), transparent var(--deck-anim-blinds-open) 16px);
  mask-image: repeating-linear-gradient(to bottom, #000 0 var(--deck-anim-blinds-open), transparent var(--deck-anim-blinds-open) 16px);
}

section.deck-anim-enter-random-bars.bespoke-active:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-enter-random-bars.bespoke-marp-active:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
svg.bespoke-marp-active > foreignObject > section.deck-anim-enter-random-bars:not(.deck-anim-trigger-on-click) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-enter-random-bars.deck-anim-trigger-on-click.deck-anim-played > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
svg.bespoke-marp-active > foreignObject > section.deck-anim-enter-random-bars.deck-anim-trigger-on-click.deck-anim-played > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
section.deck-anim-enter-random-bars.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item-played,
svg.bespoke-marp-active > foreignObject > section.deck-anim-enter-random-bars.deck-anim-trigger-on-click.deck-anim-sequence-stagger .deck-anim-item-played {
  -webkit-mask-image: repeating-linear-gradient(to right, #000 0 var(--deck-anim-random-bars-open), transparent var(--deck-anim-random-bars-open) 18px);
  mask-image: repeating-linear-gradient(to right, #000 0 var(--deck-anim-random-bars-open), transparent var(--deck-anim-random-bars-open) 18px);
}`
}

function slideAnimationVariables(slide) {
  const className = `deck-anim-slide-${Number(slide.index || 0) + 1}`
  const definition = getAnimation(slide.animation.name)
  return `section.${className} {
  --deck-anim-duration: ${slide.animation.durationMs}ms;
  --deck-anim-delay: ${slide.animation.delayMs}ms;
  --deck-anim-keyframes: ${definition?.htmlKeyframes || slide.animation.htmlKeyframes};
}`
}
