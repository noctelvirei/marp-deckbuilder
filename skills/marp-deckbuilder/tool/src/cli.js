#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { renderSlideImagesAndText } from './browser.js'
import { loadDefinitions } from './brand.js'
import { parseDeckMarkdown } from './markdown.js'
import { renderDeckHtml } from './render.js'
import { writePptx } from './pptx.js'

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('marp-deckbuilder')
    .command(
      'build <input>',
      'Build Deckbuilder HTML and PPTX slides from Marp-flavored Markdown.',
      (command) =>
        command
          .positional('input', {
            describe: 'Input Markdown file.',
            type: 'string',
            demandOption: true,
          })
          .option('html', {
            describe: 'Write rich HTML output.',
            type: 'string',
          })
          .option('pptx', {
            describe: 'Write PPTX output.',
            type: 'string',
          })
          .option('images', {
            describe: 'Directory for rendered slide images.',
            type: 'string',
          })
          .option('resources', {
            describe: 'Resource folder for template, logos, fonts, and images.',
            type: 'string',
            default: 'resources',
          })
          .option('definitions', {
            describe: 'Folder containing brand.json and theme.css.',
            type: 'string',
          })
          .option('browser', {
            describe: 'Chromium-family browser executable for hybrid PPTX rendering.',
            type: 'string',
          })
          .option('mode', {
            describe: 'PPTX mode.',
            choices: ['native', 'hybrid', 'editable', 'image'],
            default: 'native',
          })
          .option('backdrop', {
            describe: 'Use rendered image backdrops in PPTX when a browser is provided.',
            type: 'boolean',
            default: true,
          }),
      buildCommand,
    )
    .demandCommand(1)
    .strict()
    .help()
    .parseAsync()
}

async function buildCommand(argv) {
  const inputPath = path.resolve(argv.input)
  const projectRoot = process.cwd()
  const resourcesDir = path.resolve(projectRoot, argv.resources)
  const definitionsDir = path.resolve(
    projectRoot,
    argv.definitions || path.join(argv.resources, 'definitions'),
  )
  const definitions = await loadDefinitions(definitionsDir)
  const markdown = await readFile(inputPath, 'utf8')
  const deck = parseDeckMarkdown(markdown)
  const rendered = renderDeckHtml(deck, { resourcesDir, definitions })

  if (argv.html) {
    const htmlPath = path.resolve(argv.html)
    await mkdir(path.dirname(htmlPath), { recursive: true })
    await writeFile(htmlPath, rendered.document, 'utf8')
    console.log(`HTML written to ${htmlPath}`)
  }

  if (argv.pptx) {
    const pptxPath = path.resolve(argv.pptx)
    await mkdir(path.dirname(pptxPath), { recursive: true })

    let images = []
    let textBoxes = []
    const nativeMode = argv.mode === 'native' || argv.mode === 'editable'
    const wantsRenderedBackdrops = !nativeMode && argv.backdrop

    if (wantsRenderedBackdrops && argv.browser) {
      const imageDir = path.resolve(
        argv.images || path.join(projectRoot, '.tmp', 'marp-deckbuilder-images'),
      )
      await resetWorkingDir(imageDir, projectRoot)
      const renderedSlides = await renderSlideImagesAndText({
        html: rendered.document,
        browserPath: path.resolve(argv.browser),
        outputDir: imageDir,
        brand: definitions.brand,
        hideText: argv.mode === 'hybrid',
      })
      images = renderedSlides.images
      textBoxes = renderedSlides.textBoxes
      console.log(`Rendered ${images.length} slide image(s) to ${imageDir}`)
    } else if (wantsRenderedBackdrops && !argv.browser) {
      console.warn('No --browser provided; building native editable PPTX without image backdrops.')
    }

    await writePptx({
      deck,
      outputPath: pptxPath,
      brand: definitions.brand,
      resourcesDir,
      images,
      textBoxes,
      mode: argv.mode,
    })
    console.log(`PPTX written to ${pptxPath}`)
  }

  if (!argv.html && !argv.pptx) {
    console.log(rendered.document)
  }
}

async function resetWorkingDir(targetDir, projectRoot) {
  const resolvedTarget = path.resolve(targetDir)
  const resolvedRoot = path.resolve(projectRoot)
  const relative = path.relative(resolvedRoot, resolvedTarget)

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to reset a working directory outside the project: ${resolvedTarget}`)
  }

  await rm(resolvedTarget, { recursive: true, force: true })
  await mkdir(resolvedTarget, { recursive: true })
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
