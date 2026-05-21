#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toolRoot = join(skillRoot, 'tool')
const bundledCli = join(toolRoot, 'dist', 'deckbuilder.mjs')

const args = process.argv.slice(2)
const input = args.find((arg) => !arg.startsWith('-'))
const outDir = readOption(args, '--out-dir') || 'output'
const mode = readOption(args, '--mode') || 'native'

if (!input) {
  console.error('Usage: node scripts/build-deck.mjs deck.md --out-dir output [--mode native]')
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
const pptxPath = join(outputDir, `${base}.pptx`)

await run(process.execPath, [
  bundledCli,
  'build',
  inputPath,
  '--html',
  htmlPath,
  '--pptx',
  pptxPath,
  '--mode',
  mode,
  '--resources',
  join(toolRoot, 'resources'),
])

console.log(`Markdown: ${inputPath}`)
console.log(`HTML:     ${htmlPath}`)
console.log(`PPTX:     ${pptxPath}`)

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
