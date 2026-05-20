#!/usr/bin/env node
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entryPoint = resolve(repoRoot, 'src', 'cli.js')
const outputFile = resolve(
  repoRoot,
  'skills',
  'marp-deckbuilder',
  'tool',
  'dist',
  'deckbuilder.cjs',
)

await mkdir(dirname(outputFile), { recursive: true })

await build({
  entryPoints: [entryPoint],
  outfile: outputFile,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  logLevel: 'info',
})

console.log(`Bundled skill CLI: ${outputFile}`)
