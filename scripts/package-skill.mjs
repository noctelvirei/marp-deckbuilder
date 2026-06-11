#!/usr/bin/env node
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'

import JSZip from 'jszip'

const skills = [
  { name: 'marp-deckbuilder', root: resolve('skills', 'marp-deckbuilder') },
  { name: 'marp-rich-html', root: resolve('skills', 'marp-rich-html') },
  { name: 'marp-report', root: resolve('skills', 'marp-report') },
]

const outputDir = resolve('dist')
const maxUncompressedBytes = 30 * 1024 * 1024
const excludedDirs = new Set(['node_modules', '.npm-cache', '.tmp'])
const excludedDirPrefixes = ['output']

await mkdir(outputDir, { recursive: true })

for (const skill of skills) {
  await packageSkill(skill)
}

async function packageSkill(skill) {
  const outputPath = resolve(outputDir, `${skill.name}-skill.zip`)
  const zip = new JSZip()
  let uncompressedBytes = 0

  await rm(outputPath, { force: true })
  await addDirectory(skill.root)

  if (uncompressedBytes > maxUncompressedBytes) {
    throw new Error(
      `${skill.name} is ${(uncompressedBytes / 1024 / 1024).toFixed(2)} MB uncompressed; max is 30 MB.`,
    )
  }

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })
  await writeFile(outputPath, content)

  const archive = await stat(outputPath)
  console.log(`Skill source: ${skill.root}`)
  console.log(`Uncompressed: ${(uncompressedBytes / 1024 / 1024).toFixed(2)} MB`)
  console.log(`Zip: ${outputPath}`)
  console.log(`Zip size: ${(archive.size / 1024 / 1024).toFixed(2)} MB`)

  async function addDirectory(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (shouldExclude(entry)) continue

      const fullPath = join(directory, entry.name)
      const zipPath = relative(skill.root, fullPath).split(sep).join('/')

      if (entry.isDirectory()) {
        await addDirectory(fullPath)
      } else if (entry.isFile()) {
        const bytes = await readFile(fullPath)
        uncompressedBytes += bytes.byteLength
        zip.file(zipPath, bytes)
      }
    }
  }
}

function shouldExclude(entry) {
  if (entry.isFile() && entry.name.endsWith('.zip')) return true
  if (!entry.isDirectory()) return false
  return (
    excludedDirs.has(entry.name) ||
    excludedDirPrefixes.some((prefix) => entry.name === prefix || entry.name.startsWith(`${prefix}-`))
  )
}
