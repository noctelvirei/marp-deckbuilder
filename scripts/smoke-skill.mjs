#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const smokeRoot = resolve(repoRoot, '.tmp', 'skill-smoke')

await rm(smokeRoot, { recursive: true, force: true })
await mkdir(smokeRoot, { recursive: true })

await smokeDeckSkill()
await smokeRichHtmlSkill()
await smokeReportSkill()

console.log(`Skill smoke passed: ${smokeRoot}`)

async function smokeDeckSkill() {
  const sourceRoot = resolve(repoRoot, 'skills', 'marp-deckbuilder')
  const skillRoot = join(smokeRoot, 'marp-deckbuilder')
  const outputDir = join(skillRoot, 'output')
  await copySkill(sourceRoot, skillRoot)

  await run(process.execPath, [
    'scripts/build-deck.mjs',
    'examples/example.md',
    '--out-dir',
    'output',
  ], skillRoot)

  const htmlPath = join(outputDir, 'example.html')
  await assertFile(htmlPath, 1000)
  await assertFile(join(outputDir, 'example.pptx'), 1000)
  await assertVendorInjection(htmlPath, 'data-marp-deckbuilder-vendor')
}

async function smokeReportSkill() {
  const sourceRoot = resolve(repoRoot, 'skills', 'marp-report')
  const skillRoot = join(smokeRoot, 'marp-report')
  const outputDir = join(skillRoot, 'output')
  await copySkill(sourceRoot, skillRoot)

  await run(process.execPath, [
    'scripts/build-report.mjs',
    'examples/example.md',
    '--out-dir',
    'output',
  ], skillRoot)

  const htmlPath = join(outputDir, 'example.html')
  await assertFile(htmlPath, 1000)
  const html = await stat(htmlPath)
  if (html.size < 500000) {
    throw new Error(`Expected report HTML to include offline vendor scripts: ${htmlPath}`)
  }
  await assertVendorInjection(htmlPath, 'data-marp-report-vendor')
  await assertRichComponentCss(htmlPath)
}

async function smokeRichHtmlSkill() {
  const sourceRoot = resolve(repoRoot, 'skills', 'marp-rich-html')
  const skillRoot = join(smokeRoot, 'marp-rich-html')
  const outputDir = join(skillRoot, 'output')
  await copySkill(sourceRoot, skillRoot)

  await run(process.execPath, [
    'scripts/build-rich-html.mjs',
    'examples/example.md',
    '--out-dir',
    'output',
  ], skillRoot)

  const htmlPath = join(outputDir, 'example.html')
  await assertFile(htmlPath, 1000)
  await assertVendorInjection(htmlPath, 'data-marp-rich-html-vendor')
  await assertRichComponentCss(htmlPath)
}

async function copySkill(sourceRoot, targetRoot) {
  await cp(sourceRoot, targetRoot, {
    recursive: true,
    filter: (source) => {
      if (source.endsWith('.zip')) return false
      if (source.includes(`${resolve(sourceRoot, 'output')}`)) return false
      if (source.includes(`${resolve(sourceRoot, '.npm-cache')}`)) return false
      if (source.includes(`${resolve(sourceRoot, '.tmp')}`)) return false
      return true
    },
  })

  if (existsSync(join(targetRoot, 'node_modules'))) {
    throw new Error(`Skill smoke copy unexpectedly contains node_modules: ${targetRoot}`)
  }
}

async function run(command, commandArgs, cwd) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: 'inherit',
      shell: false,
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${command} exited with code ${code}`))
    })
  })
}

async function assertFile(path, minBytes) {
  const info = await stat(path)
  if (!info.isFile() || info.size < minBytes) {
    throw new Error(`Expected smoke output ${path} to be a file larger than ${minBytes} bytes.`)
  }
}

async function assertVendorInjection(path, markerAttribute) {
  const html = await readFile(path, 'utf8')
  const lower = html.toLowerCase()
  const headClose = lower.lastIndexOf('</head>')
  const d3 = html.indexOf(`${markerAttribute}="d3"`)
  const plot = html.indexOf(`${markerAttribute}="observable-plot"`)
  const chart = html.indexOf(`${markerAttribute}="chart.js"`)

  if (headClose < 0) throw new Error(`Expected ${path} to include a closing </head> tag.`)
  if (d3 < 0 || plot < 0 || chart < 0) {
    throw new Error(`Expected ${path} to include d3, observable-plot, and chart.js vendor scripts.`)
  }
  if (!(d3 < plot && plot < chart)) {
    throw new Error(`Expected vendor injection order d3 -> observable-plot -> chart.js in ${path}.`)
  }
  if (!(chart < headClose)) {
    throw new Error(`Expected all vendor scripts to be injected before the structural </head> in ${path}.`)
  }
  if (/cdn\.jsdelivr\.net|<script\s+src=/i.test(html)) {
    throw new Error(`Expected ${path} to be offline-safe with no CDN script tags.`)
  }
}

async function assertRichComponentCss(path) {
  const html = await readFile(path, 'utf8')
  if (!html.includes('Renderer-owned rich HTML components')) {
    throw new Error(`Expected ${path} to include renderer-owned rich component CSS.`)
  }
  if (!/\.deck-rich\s*\{/.test(html) || !html.includes('.deck-rich .book-scene')) {
    throw new Error(`Expected ${path} to include raw deck-rich component selectors.`)
  }
}
