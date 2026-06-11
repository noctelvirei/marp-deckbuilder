#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const entryPoint = resolve(repoRoot, 'src', 'cli.js')
const sourceResourcesDir = resolve(repoRoot, 'resources')
const outputDir = resolve(repoRoot, 'skills', 'marp-deckbuilder', 'tool', 'dist')
const deckToolDir = resolve(repoRoot, 'skills', 'marp-deckbuilder', 'tool')
const deckResourcesDir = resolve(deckToolDir, 'resources')
const reportToolDir = resolve(repoRoot, 'skills', 'marp-report', 'tool')
const richHtmlToolDir = resolve(repoRoot, 'skills', 'marp-rich-html', 'tool')

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

await renameGenericChunks(outputDir)

console.log(`Bundled skill CLI: ${resolve(outputDir, 'deckbuilder.mjs')}`)

await syncToolResources(deckResourcesDir)
console.log(`Synced deckbuilder skill resources: ${deckResourcesDir}`)

await rm(reportToolDir, { recursive: true, force: true })
await cp(deckToolDir, reportToolDir, {
  recursive: true,
  filter: (source) => !source.endsWith('.zip'),
})
console.log(`Synced report skill tool: ${reportToolDir}`)

await rm(richHtmlToolDir, { recursive: true, force: true })
await cp(deckToolDir, richHtmlToolDir, {
  recursive: true,
  filter: (source) => !source.endsWith('.zip'),
})
console.log(`Synced rich HTML skill tool: ${richHtmlToolDir}`)

async function renameGenericChunks(distDir) {
  const chunksDir = join(distDir, 'chunks')
  const entries = await readdir(chunksDir, { withFileTypes: true })
  const genericChunks = entries
    .filter((entry) => entry.isFile() && /^chunk-[A-Z0-9]+\.mjs$/.test(entry.name))
    .map((entry) => entry.name)

  if (genericChunks.length === 0) return

  const mapping = new Map()
  const unclassified = []
  for (const fileName of genericChunks) {
    const fullPath = join(chunksDir, fileName)
    const source = await readFile(fullPath, 'utf8')
    const role = chunkRole(source)
    if (!role) {
      unclassified.push(fileName)
      continue
    }

    const hash = fileName.match(/^chunk-([A-Z0-9]+)\.mjs$/)?.[1]
    if (!hash) continue
    mapping.set(fileName, `${role}-${hash}.mjs`)
  }

  if (unclassified.length > 0) {
    throw new Error(`Unhandled generic chunk(s): ${unclassified.join(', ')}. Add a semantic chunk role in scripts/bundle-skill.mjs.`)
  }

  if (mapping.size === 0) return

  for (const file of await collectMjsFiles(distDir)) {
    let source = await readFile(file, 'utf8')
    let updated = source
    for (const [oldName, newName] of mapping) {
      updated = updated.split(oldName).join(newName)
    }
    if (updated !== source) {
      await writeFile(file, updated, 'utf8')
    }
  }

  for (const [oldName, newName] of mapping) {
    await rename(join(chunksDir, oldName), join(chunksDir, newName))
  }

  const renamed = [...mapping.entries()]
    .map(([oldName, newName]) => `${oldName} -> ${newName}`)
    .join(', ')
  console.log(`Renamed generic chunks: ${renamed}`)
}

async function syncToolResources(targetDir) {
  await mkdir(targetDir, { recursive: true })
  await rm(join(targetDir, 'definitions'), { recursive: true, force: true })
  await rm(join(targetDir, 'templates'), { recursive: true, force: true })
  await rm(join(targetDir, 'README.md'), { force: true })
  await cp(sourceResourcesDir, targetDir, {
    recursive: true,
    filter: (source) => !source.endsWith('.zip'),
  })
  await assertVendorResources(targetDir)
}

async function assertVendorResources(targetDir) {
  for (const fileName of ['d3.min.js', 'plot.min.js', 'chart.min.js']) {
    await readFile(join(targetDir, 'vendor', fileName), 'utf8')
  }
}

function chunkRole(source) {
  if (source.includes('// src/components/') || source.includes('compileDeckComponents')) {
    return 'markdown-components'
  }
  if (source.includes('// src/render.js') || source.includes('renderDeckHtml')) {
    return 'html-renderer'
  }
  if (source.includes('// src/brand.js') || source.includes('loadDefinitions')) {
    return 'brand-definitions'
  }
  if (source.includes('// src/resources.js') || source.includes('resolveResourceFile')) {
    return 'resource-resolver'
  }
  if (source.includes('// node_modules/util-deprecate/node.js')) {
    return 'node-deprecate-shim'
  }
  if (source.includes('__commonJS') && source.includes('__toESM') && source.includes('Dynamic require')) {
    return 'module-interop'
  }
  return ''
}

async function collectMjsFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectMjsFiles(fullPath))
    } else if (entry.isFile() && basename(entry.name).endsWith('.mjs')) {
      files.push(fullPath)
    }
  }
  return files
}
