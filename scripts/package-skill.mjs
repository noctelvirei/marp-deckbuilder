#!/usr/bin/env node
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'

import JSZip from 'jszip'

const skillRoot = resolve('skills', 'marp-deckbuilder')
const outputPath = resolve('dist', 'marp-deckbuilder-skill.zip')
const maxUncompressedBytes = 30 * 1024 * 1024
const excludedDirs = new Set(['node_modules', '.npm-cache', '.tmp'])
const excludedDirPrefixes = ['output']
const zip = new JSZip()

let uncompressedBytes = 0

await mkdir(dirname(outputPath), { recursive: true })
await rm(outputPath, { force: true })
await addDirectory(skillRoot)

if (uncompressedBytes > maxUncompressedBytes) {
  throw new Error(
    `Skill is ${(uncompressedBytes / 1024 / 1024).toFixed(2)} MB uncompressed; max is 30 MB.`,
  )
}

const content = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
})
await writeFile(outputPath, content)

const archive = await stat(outputPath)
console.log(`Skill source: ${skillRoot}`)
console.log(`Uncompressed: ${(uncompressedBytes / 1024 / 1024).toFixed(2)} MB`)
console.log(`Zip: ${outputPath}`)
console.log(`Zip size: ${(archive.size / 1024 / 1024).toFixed(2)} MB`)

async function addDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (shouldExclude(entry)) continue

    const fullPath = join(directory, entry.name)
    const zipPath = relative(skillRoot, fullPath).split(sep).join('/')

    if (entry.isDirectory()) {
      await addDirectory(fullPath)
    } else if (entry.isFile()) {
      const bytes = await readFile(fullPath)
      uncompressedBytes += bytes.byteLength
      zip.file(zipPath, bytes)
    }
  }
}

function shouldExclude(entry) {
  if (!entry.isDirectory()) return false
  return (
    excludedDirs.has(entry.name) ||
    excludedDirPrefixes.some((prefix) => entry.name === prefix || entry.name.startsWith(`${prefix}-`))
  )
}
