#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toolRoot = join(skillRoot, 'tool')
const bundledCli = join(toolRoot, 'dist', 'deckbuilder.mjs')

const args = process.argv.slice(2)
const input = args.find((arg) => !arg.startsWith('-'))
const outDir = readOption(args, '--out-dir') || 'output'

if (!input) {
  console.error('Usage: node scripts/build-rich-html.mjs deck.md --out-dir output')
  process.exit(1)
}

const inputPath = resolve(input)
const outputDir = resolve(outDir)
await mkdir(outputDir, { recursive: true })
if (!existsSync(bundledCli)) {
  console.error(`Bundled CLI not found: ${bundledCli}`)
  console.error('Rebuild the skill package before sharing it.')
  process.exit(1)
}

const base = basename(inputPath, extname(inputPath))
const htmlPath = join(outputDir, `${base}.html`)

await run(process.execPath, [
  bundledCli,
  'build',
  inputPath,
  '--html',
  htmlPath,
  '--resources',
  join(toolRoot, 'resources'),
])

await injectVendorScripts(htmlPath)

console.log(`Markdown: ${inputPath}`)
console.log(`HTML:     ${htmlPath}`)

async function injectVendorScripts(htmlFile) {
  if (!existsSync(htmlFile)) return
  let html = await readFile(htmlFile, 'utf8')
  html = stripKnownCdnTags(html)

  if (html.includes('data-marp-rich-html-vendor')) {
    await writeFile(htmlFile, html, 'utf8')
    return
  }

  const vendorDir = join(toolRoot, 'resources', 'vendor')
  const vendors = [
    { file: 'd3.min.js', label: 'd3' },
    { file: 'plot.min.js', label: 'observable-plot' },
    { file: 'chart.min.js', label: 'chart.js' },
  ]

  const scripts = []
  for (const { file, label } of vendors) {
    const vendorPath = join(vendorDir, file)
    if (!existsSync(vendorPath)) continue
    const source = await readFile(vendorPath, 'utf8')
    scripts.push(`<script data-marp-rich-html-vendor="${label}">\n${source}\n</script>`)
    console.log(`${label}: injected into <head> (offline-safe)`)
  }

  if (scripts.length === 0) return
  html = injectBeforeClosingHead(html, `${scripts.join('\n')}\n`)
  await writeFile(htmlFile, html, 'utf8')
}

function injectBeforeClosingHead(html, injection) {
  const headCloseIndex = html.toLowerCase().lastIndexOf('</head>')
  if (headCloseIndex < 0) return `${injection}${html}`
  return `${html.slice(0, headCloseIndex)}${injection}${html.slice(headCloseIndex)}`
}

function stripKnownCdnTags(html) {
  return html
    .replace(/<script\s+src=["']https?:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js@[^"']*["']\s*><\/script>\s*/gi, '')
    .replace(/<script\s+src=["']https?:\/\/cdn\.jsdelivr\.net\/npm\/@observablehq\/plot@[^"']*["']\s*><\/script>\s*/gi, '')
    .replace(/<script\s+src=["']https?:\/\/cdn\.jsdelivr\.net\/npm\/d3@[^"']*["']\s*><\/script>\s*/gi, '')
}

async function run(command, commandArgs, options = {}) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: options.cwd || skillRoot,
      env: {
        ...process.env,
        npm_config_cache: join(skillRoot, '.npm-cache'),
        TMP: join(skillRoot, '.tmp'),
        TEMP: join(skillRoot, '.tmp'),
      },
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

function readOption(argv, name) {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] : ''
}
