import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import puppeteer from 'puppeteer-core'

import { cssColorToHex } from './brand.js'

const TEXT_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'li',
  'blockquote',
  'th',
  'td',
  '.stat-card strong',
  '.stat-card span',
  '.card-grid article h2',
  '.card-grid article p',
].join(',')

export async function renderSlideImagesAndText({
  html,
  browserPath,
  outputDir,
  brand,
  hideText = true,
}) {
  if (!browserPath) {
    throw new Error('A browser executable path is required for screenshot-backed PPTX output.')
  }

  await mkdir(outputDir, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: 'new',
    userDataDir: path.join(outputDir, 'browser-profile'),
    args: ['--allow-file-access-from-files', '--disable-gpu', '--no-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({
      width: brand.slide.widthPx,
      height: brand.slide.heightPx,
      deviceScaleFactor: 2,
    })
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const textBoxes = await extractEditableText(page)

    if (hideText) {
      await page.addStyleTag({ content: hiddenTextCss() })
    }

    const handles = await page.$$('svg[data-marpit-svg]')
    const images = []
    for (let i = 0; i < handles.length; i += 1) {
      const imagePath = path.join(outputDir, `slide-${String(i + 1).padStart(2, '0')}.png`)
      await handles[i].screenshot({ path: imagePath, omitBackground: false })
      images.push(imagePath)
    }

    return { images, textBoxes }
  } finally {
    await browser.close()
  }
}

async function extractEditableText(page) {
  const raw = await page.$$eval(
    'svg[data-marpit-svg] foreignObject section',
    (sections, selector) =>
      sections.map((section) => {
        const sectionRect = section.getBoundingClientRect()
        const elements = [...section.querySelectorAll(selector)]

        return elements
          .map((element) => {
            const text = element.textContent?.replace(/\s+/g, ' ').trim() || ''
            const rect = element.getBoundingClientRect()
            const style = window.getComputedStyle(element)
            const visible =
              text &&
              rect.width > 1 &&
              rect.height > 1 &&
              style.display !== 'none' &&
              style.visibility !== 'hidden'

            if (!visible) return null

            return {
              text,
              tag: element.tagName.toLowerCase(),
              x: rect.left - sectionRect.left,
              y: rect.top - sectionRect.top,
              w: rect.width,
              h: rect.height,
              color: style.color,
              fontSize: Number.parseFloat(style.fontSize) || 16,
              fontWeight: style.fontWeight,
              textAlign: style.textAlign,
            }
          })
          .filter(Boolean)
      }),
    TEXT_SELECTOR,
  )

  return raw.map((slideBoxes) =>
    slideBoxes.map((box) => ({
      ...box,
      color: cssColorToHex(box.color),
    })),
  )
}

function hiddenTextCss() {
  return `
    svg[data-marpit-svg] section h1,
    svg[data-marpit-svg] section h2,
    svg[data-marpit-svg] section h3,
    svg[data-marpit-svg] section h4,
    svg[data-marpit-svg] section p,
    svg[data-marpit-svg] section li,
    svg[data-marpit-svg] section blockquote,
    svg[data-marpit-svg] section th,
    svg[data-marpit-svg] section td,
    svg[data-marpit-svg] section .stat-card strong,
    svg[data-marpit-svg] section .stat-card span {
      color: transparent !important;
      text-shadow: none !important;
      -webkit-text-fill-color: transparent !important;
    }
  `
}
