#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const toolRoot = join(skillRoot, 'tool')

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
await ensureDependencies()

const base = basename(inputPath, extname(inputPath))
const htmlPath = join(outputDir, `${base}.html`)
const pptxPath = join(outputDir, `${base}.pptx`)

await run(process.execPath, [
  join(toolRoot, 'src', 'cli.js'),
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

async function ensureDependencies() {
  const nodeModules = join(toolRoot, 'node_modules')
  if (existsSync(nodeModules)) return

  await mkdir(join(skillRoot, '.npm-cache'), { recursive: true })
  await mkdir(join(skillRoot, '.tmp'), { recursive: true })

  const packageLock = join(toolRoot, 'package-lock.json')
  const installArgs = existsSync(packageLock) ? ['ci', '--omit=dev'] : ['install', '--omit=dev']
  await run(npmCommand(), installArgs, { cwd: toolRoot })
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

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}
