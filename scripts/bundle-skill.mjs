#!/usr/bin/env node
import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entryPoint = resolve(repoRoot, 'src', 'cli.js')
const outputDir = resolve(repoRoot, 'skills', 'marp-deckbuilder', 'tool', 'dist')
const deckToolDir = resolve(repoRoot, 'skills', 'marp-deckbuilder', 'tool')
const reportToolDir = resolve(repoRoot, 'skills', 'marp-report', 'tool')

await rm(outputDir, { recursive: true, force: true })
await mkdir(outputDir, { recursive: true })

await build({
  entryPoints: [{ in: entryPoint, out: 'deckbuilder' }],
  outdir: outputDir,
  bundle: true,
  platform: 'node',
  format: 'esm',
  splitting: true,
  target: 'node18',
  outExtension: { '.js': '.mjs' },
  chunkNames: 'chunks/[name]-[hash]',
  banner: {
    js: 'import { createRequire as __deckbuilderCreateRequire } from "node:module";\nconst require = __deckbuilderCreateRequire(import.meta.url);',
  },
  logLevel: 'info',
})

console.log(`Bundled skill CLI: ${resolve(outputDir, 'deckbuilder.mjs')}`)

await rm(reportToolDir, { recursive: true, force: true })
await cp(deckToolDir, reportToolDir, {
  recursive: true,
  filter: (source) => !source.endsWith('.zip'),
})
console.log(`Synced report skill tool: ${reportToolDir}`)
