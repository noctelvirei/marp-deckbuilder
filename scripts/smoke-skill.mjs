#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillRoot = resolve(repoRoot, 'skills', 'marp-deckbuilder')
const smokeRoot = resolve(repoRoot, '.tmp', 'skill-smoke')
const outputDir = join(smokeRoot, 'output')
const htmlPath = join(outputDir, 'example.html')
const pptxPath = join(outputDir, 'example.pptx')

await rm(smokeRoot, { recursive: true, force: true })
await mkdir(smokeRoot, { recursive: true })
await cp(skillRoot, smokeRoot, {
  recursive: true,
  filter: (source) => !source.includes(`${resolve(skillRoot, 'output')}`),
})

if (existsSync(join(smokeRoot, 'node_modules'))) {
  throw new Error('Skill smoke copy unexpectedly contains node_modules.')
}

await run(process.execPath, [
  'scripts/build-deck.mjs',
  'examples/example.md',
  '--out-dir',
  'output',
])

await assertFile(htmlPath, 1000)
await assertFile(pptxPath, 1000)
console.log(`Skill smoke passed: ${smokeRoot}`)

async function run(command, commandArgs) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: smokeRoot,
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
