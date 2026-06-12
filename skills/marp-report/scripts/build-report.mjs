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
const parsed = parseArgs(args)
const input = parsed.input
const outDir = parsed.outDir || 'output'

if (!input) {
  console.error('Usage: node scripts/build-report.mjs report.md --out-dir output [--pdf]')
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
const pdfPath = parsed.pdfPath || join(outputDir, `${base}.pdf`)
const commandArgs = [
  bundledCli,
  'report',
  inputPath,
  '--html',
  htmlPath,
  '--resources',
  join(toolRoot, 'resources'),
]

if (parsed.pdf) commandArgs.push('--pdf', pdfPath)

await run(process.execPath, commandArgs)

console.log(`Markdown: ${inputPath}`)
console.log(`HTML:     ${htmlPath}`)
if (parsed.pdf) console.log(`PDF:      ${pdfPath}`)
else console.log('PDF:      Re-run with --pdf to generate a PDF, or use browser Print to PDF as fallback.')

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

function parseArgs(argv) {
  const parsedArgs = {
    input: '',
    outDir: '',
    pdf: false,
    pdfPath: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--out-dir') {
      parsedArgs.outDir = argv[index + 1] || ''
      index += 1
    } else if (arg === '--pdf') {
      parsedArgs.pdf = true
      const next = argv[index + 1] || ''
      if (next && !next.startsWith('-') && extname(next).toLowerCase() === '.pdf') {
        parsedArgs.pdfPath = resolve(next)
        index += 1
      }
    } else if (!arg.startsWith('-') && !parsedArgs.input) {
      parsedArgs.input = arg
    } else if (arg.startsWith('-')) {
      console.error(`Unsupported option: ${arg}`)
      process.exit(1)
    }
  }

  return parsedArgs
}
