import { Marp } from '@marp-team/marp-core'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { buildMarpMarkdown } from './markdown.js'

export function renderDeckHtml(deck, options = {}) {
  const marp = new Marp({ html: true })
  const definitions = options.definitions
  marp.themeSet.add(definitions.themeCss)

  const markdown = resolveResourceUrls(
    buildMarpMarkdown(deck, { themeName: definitions.brand.themeName }),
    options.resourcesDir,
  )
  const { html, css, comments } = marp.render(markdown)

  return {
    html,
    css,
    comments,
    document: htmlDocument({ html, css }),
  }
}

export function htmlDocument({ html, css }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${css}</style>
  <style>
    body {
      margin: 0;
      background: #202020;
    }
    .marpit {
      display: grid;
      gap: 24px;
      padding: 24px;
      place-items: center;
    }
  </style>
</head>
<body>
${html}
</body>
</html>
`
}

export function resolveResourceUrls(source, resourcesDir = 'resources') {
  const root = path.resolve(resourcesDir)

  return source.replace(/resource:([^)"'<\s]+)/g, (full, resourcePath) => {
    const resolved = path.resolve(root, resourcePath)
    if (!existsSync(resolved)) return full
    return pathToFileURL(resolved).href
  })
}
