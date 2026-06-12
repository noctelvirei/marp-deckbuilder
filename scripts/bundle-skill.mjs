#!/usr/bin/env node
import { copyFile, cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const entryPoint = resolve(repoRoot, 'src', 'cli.js')
const outputDir = resolve(repoRoot, 'skills', 'marp-deckbuilder', 'tool', 'dist')
const deckToolDir = resolve(repoRoot, 'skills', 'marp-deckbuilder', 'tool')
const reportToolDir = resolve(repoRoot, 'skills', 'marp-report', 'tool')
const playwrightCorePackage = require('playwright-core/package.json')
const playwrightCoreRoot = dirname(require.resolve('playwright-core/package.json'))
const chromiumBidiPathAliases = new Map([
  ['chromium-bidi/lib/cjs/bidiMapper/BidiMapper', 'chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js'],
  ['chromium-bidi/lib/cjs/cdp/CdpConnection', 'chromium-bidi/lib/cjs/cdp/CdpConnection.js'],
])

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
    js: [
      'import { createRequire as __deckbuilderCreateRequire } from "node:module";',
      'import { fileURLToPath as __deckbuilderFileURLToPath } from "node:url";',
      'import { dirname as __deckbuilderDirname } from "node:path";',
      'const require = __deckbuilderCreateRequire(import.meta.url);',
      'const __filename = __deckbuilderFileURLToPath(import.meta.url);',
      'const __dirname = __deckbuilderDirname(__filename);',
    ].join('\n'),
  },
  plugins: [playwrightChromiumBidiResolver()],
  logLevel: 'info',
})

console.log(`Bundled skill CLI: ${resolve(outputDir, 'deckbuilder.mjs')}`)

await writeFile(
  resolve(outputDir, 'package.json'),
  JSON.stringify({ name: playwrightCorePackage.name, version: playwrightCorePackage.version }, null, 2),
  'utf8',
)
await copyFile(resolve(playwrightCoreRoot, 'browsers.json'), resolve(outputDir, 'browsers.json'))

await rm(reportToolDir, { recursive: true, force: true })
await cp(deckToolDir, reportToolDir, {
  recursive: true,
  filter: (source) => !source.endsWith('.zip'),
})
console.log(`Synced report skill tool: ${reportToolDir}`)

function playwrightChromiumBidiResolver() {
  return {
    name: 'playwright-chromium-bidi-resolver',
    setup(buildContext) {
      buildContext.onResolve({ filter: /^chromium-bidi\/lib\/cjs\/(?:bidiMapper\/BidiMapper|cdp\/CdpConnection)$/ }, (args) => ({
        path: require.resolve(chromiumBidiPathAliases.get(args.path)),
      }))
    },
  }
}
