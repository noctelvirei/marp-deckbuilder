import { existsSync } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { chromium } from 'playwright-core'

export async function writeReportPdf({ html, outputPath, browserPath = '', env = process.env }) {
  const executablePath = await resolveReportBrowserExecutable({ browserPath, env })
  const pageErrors = []
  let browser

  try {
    await mkdir(tmpdir(), { recursive: true })
    browser = await chromium.launch({
      executablePath,
      headless: true,
    })
    const page = await browser.newPage({
      viewport: { width: 1240, height: 1754 },
      deviceScaleFactor: 1,
    })
    page.on('pageerror', (error) => {
      pageErrors.push(error)
    })

    await page.emulateMedia({ media: 'print' })
    await page.setContent(html, { waitUntil: 'load' })
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
      if (window.__marpReportComponentsReady) await window.__marpReportComponentsReady
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })

    if (pageErrors.length) {
      throw new Error(`Report PDF render failed: ${pageErrors[0].message}`)
    }

    await mkdir(path.dirname(outputPath), { recursive: true })
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    if (browser) await browser.close()
  }
}

export async function resolveReportBrowserExecutable({ browserPath = '', env = process.env } = {}) {
  const requested = browserPath || env.MARP_REPORT_BROWSER_PATH || ''
  if (requested) {
    if (await isExecutableFile(requested)) return requested
    throw new Error(
      `MARP_REPORT_BROWSER_PATH points to a browser that could not be found: ${requested}. Set MARP_REPORT_BROWSER_PATH to a Chrome, Edge, or Chromium executable.`,
    )
  }

  for (const candidate of reportBrowserCandidates(env)) {
    if (await isExecutableFile(candidate)) return candidate
  }

  throw new Error(
    'PDF export requires a local Chrome, Edge, or Chromium executable. Install one, or set MARP_REPORT_BROWSER_PATH to the browser executable path.',
  )
}

export function reportBrowserCandidates(env = process.env) {
  const candidates = []
  if (process.platform === 'win32') {
    const roots = [
      env.PROGRAMFILES,
      env['PROGRAMFILES(X86)'],
      env.LOCALAPPDATA,
    ].filter(Boolean)
    for (const root of roots) {
      candidates.push(
        path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(root, 'Chromium', 'Application', 'chrome.exe'),
      )
    }
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    )
  } else {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
      '/snap/bin/chromium',
    )
  }
  return [...new Set(candidates)]
}

async function isExecutableFile(candidate) {
  if (!candidate || !existsSync(candidate)) return false
  try {
    return (await stat(candidate)).isFile()
  } catch {
    return false
  }
}
