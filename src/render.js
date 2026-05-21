import { Marp } from '@marp-team/marp-core'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { buildMarpMarkdown } from './markdown.js'

export function renderDeckHtml(deck, options = {}) {
  const marp = new Marp({ html: true })
  const definitions = options.definitions
  marp.themeSet.add(definitions.themeCss)

  const markdown = resolveResourceUrls(
    buildMarpMarkdown(deck, { themeName: definitions.brand.themeName }),
    options.resourcesDir,
  )
  const { html, css, comments } = marp.render(markdown)

  return {
    html,
    css,
    comments,
    document: htmlDocument({ html, css, title: deck.frontmatter.title || 'Deck' }),
  }
}

export function htmlDocument({ html, css, title = 'Deck' }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
  <style>
    :root {
      --deck-scale: 1;
      --deck-progress: 0%;
    }
    html,
    body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #141414;
      color: #f5f5f5;
      font-family: "Aptos", "Segoe UI", Arial, sans-serif;
    }
    .marpit {
      width: 100%;
      height: 100dvh;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      scroll-behavior: smooth;
      scroll-snap-type: y mandatory;
      background: #141414;
    }
    .deck-slide-frame {
      min-height: 100dvh;
      box-sizing: border-box;
      display: grid;
      place-items: center;
      overflow: hidden;
      padding: clamp(18px, 4vmin, 44px);
      scroll-snap-align: start;
      scroll-snap-stop: always;
    }
    .deck-slide-frame > svg,
    .deck-slide-frame > section,
    .marpit > svg,
    .marpit > section {
      flex: none;
      width: 1280px;
      height: 720px;
      box-shadow: 0 28px 72px rgba(0, 0, 0, .42);
      transform: scale(var(--deck-scale));
      transform-origin: center center;
    }
    .deck-hud {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 20;
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 7px;
      border: 1px solid rgba(255, 255, 255, .16);
      background: rgba(20, 20, 20, .74);
      color: #ffffff;
      backdrop-filter: blur(16px);
    }
    .deck-hud button {
      min-width: 34px;
      height: 32px;
      border: 1px solid rgba(255, 255, 255, .22);
      background: rgba(255, 255, 255, .08);
      color: #ffffff;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .deck-hud button:hover {
      background: rgba(255, 255, 255, .18);
    }
    .deck-hud output {
      min-width: 54px;
      color: rgba(255, 255, 255, .84);
      font-size: 12px;
      text-align: center;
    }
    .deck-progress {
      position: fixed;
      left: 0;
      bottom: 0;
      z-index: 21;
      width: var(--deck-progress);
      height: 3px;
      background: #0f82f5;
      transition: width .18s ease;
    }
    @media print {
      html,
      body {
        height: auto;
        overflow: visible;
        background: #ffffff;
      }
      .marpit {
        height: auto;
        overflow: visible;
        scroll-snap-type: none;
        background: #ffffff;
      }
      .deck-slide-frame {
        min-height: auto;
        display: block;
        padding: 0;
        overflow: visible;
      }
      .deck-slide-frame > svg,
      .deck-slide-frame > section,
      .marpit > svg,
      .marpit > section {
        box-shadow: none;
        transform: none;
      }
      .deck-hud,
      .deck-progress {
        display: none;
      }
    }
  </style>
</head>
<body>
${html}
<script>
${presentationScript()}
</script>
</body>
</html>
`
}

export function resolveResourceUrls(source, resourcesDir = 'resources') {
  const root = path.resolve(resourcesDir)

  return source.replace(/resource:([^)"'<\s]+)/g, (full, resourcePath) => {
    const resolved = path.resolve(root, resourcePath)
    if (!existsSync(resolved)) return full
    return pathToFileURL(resolved).href
  })
}

function presentationScript() {
  return `(() => {
  const deck = document.querySelector('.marpit')
  if (!deck) return

  const slides = Array.from(deck.children).filter((element) => element.matches('svg[data-marpit-svg], section'))
  if (!slides.length) return

  slides.forEach((slide, index) => {
    const frame = document.createElement('div')
    frame.className = 'deck-slide-frame'
    const innerSection = slide.matches('section') ? slide : slide.querySelector('section')
    frame.id = innerSection?.id ? \`deck-frame-\${innerSection.id}\` : \`deck-frame-\${index + 1}\`
    frame.dataset.slide = String(index + 1)
    if (innerSection) innerSection.tabIndex = -1
    deck.insertBefore(frame, slide)
    frame.appendChild(slide)
  })

  const frames = Array.from(deck.querySelectorAll('.deck-slide-frame'))
  let activeIndex = 0

  const hud = document.createElement('nav')
  hud.className = 'deck-hud'
  hud.setAttribute('aria-label', 'Slide navigation')
  hud.innerHTML = '<button type="button" data-prev aria-label="Previous slide">Prev</button><output></output><button type="button" data-next aria-label="Next slide">Next</button><button type="button" data-fullscreen aria-label="Toggle full screen">Full</button>'
  document.body.appendChild(hud)

  const progress = document.createElement('div')
  progress.className = 'deck-progress'
  document.body.appendChild(progress)

  const output = hud.querySelector('output')
  const prevButton = hud.querySelector('[data-prev]')
  const nextButton = hud.querySelector('[data-next]')
  const fullscreenButton = hud.querySelector('[data-fullscreen]')

  function clamp(value) {
    return Math.max(0, Math.min(frames.length - 1, value))
  }

  function updateScale() {
    const firstSlide = frames[0].querySelector('svg[data-marpit-svg], section')
    const viewBox = firstSlide?.viewBox?.baseVal
    const slideWidth = viewBox?.width || firstSlide?.offsetWidth || 1280
    const slideHeight = viewBox?.height || firstSlide?.offsetHeight || 720
    const padX = Math.min(Math.max(window.innerWidth * 0.08, 36), 96)
    const padY = Math.min(Math.max(window.innerHeight * 0.08, 36), 96)
    const scale = Math.min(2, (window.innerWidth - padX) / slideWidth, (window.innerHeight - padY) / slideHeight)
    document.documentElement.style.setProperty('--deck-scale', String(Math.max(0.1, scale)))
  }

  function updateHud(index = activeIndex) {
    activeIndex = clamp(index)
    output.value = \`\${activeIndex + 1} / \${frames.length}\`
    prevButton.disabled = activeIndex === 0
    nextButton.disabled = activeIndex === frames.length - 1
    const percent = frames.length <= 1 ? 100 : ((activeIndex + 1) / frames.length) * 100
    document.documentElement.style.setProperty('--deck-progress', \`\${percent}%\`)
  }

  function goTo(index) {
    const nextIndex = clamp(index)
    frames[nextIndex].scrollIntoView({ block: 'start', behavior: 'smooth' })
    updateHud(nextIndex)
  }

  prevButton.addEventListener('click', () => goTo(activeIndex - 1))
  nextButton.addEventListener('click', () => goTo(activeIndex + 1))
  fullscreenButton.addEventListener('click', async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await document.documentElement.requestFullscreen()
    }
  })

  deck.addEventListener('scroll', () => {
    const index = Math.round(deck.scrollTop / Math.max(1, deck.clientHeight))
    updateHud(index)
  }, { passive: true })

  document.addEventListener('keydown', (event) => {
    const target = event.target
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return

    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault()
      goTo(activeIndex + 1)
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key)) {
      event.preventDefault()
      goTo(activeIndex - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      goTo(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      goTo(frames.length - 1)
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault()
      fullscreenButton.click()
    }
  })

  window.addEventListener('resize', updateScale)
  updateScale()
  updateHud(0)
})()`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
