import { Marp } from '@marp-team/marp-core'
import { Element } from '@marp-team/marpit'

import { buildMarpMarkdown } from './markdown.js'
import { brandBackgroundCss, brandLogoCss, brandSurfaceCss } from './render/brand-css.js'
import { htmlDocument } from './render/document.js'
import { prepareDeckForHtml } from './render/branding.js'
import { resolveResourceUrls } from './render/resource-urls.js'
import { splitRichHtmlCss } from './render/rich-css.js'
import { richHtmlRuntimeScript } from './rich-html-runtime.js'

export { brandBackgroundCss, brandLogoCss, brandSurfaceCss } from './render/brand-css.js'
export { htmlDocument } from './render/document.js'
export { shouldSkipHtml } from './render/branding.js'
export { resolveResourceUrls } from './render/resource-urls.js'
export { richHtmlCssEndMarker, richHtmlCssMarker, splitRichHtmlCss } from './render/rich-css.js'

export function renderDeckHtml(deck, options = {}) {
  const definitions = options.definitions
  const htmlDeck = prepareDeckForHtml(deck, definitions.brand, options.resourcesDir)
  const marp = new Marp({
    html: true,
    container: new Element('div', { id: ':$p' }),
    inlineSVG: true,
    slideContainer: [],
  })
  const assetMap = options.collectResources ? new Map() : null
  const resolverOptions = {
    assetMap,
    inlineAssets: options.inlineAssets,
    assetUrlPrefix: options.assetUrlPrefix,
  }
  const splitTheme = splitRichHtmlCss(definitions.themeCss)
  const themeCss = resolveResourceUrls(
    [
      splitTheme.themeCss,
      brandBackgroundCss(definitions.brand),
      brandSurfaceCss(definitions.brand),
      brandLogoCss(definitions.brand),
    ]
      .filter(Boolean)
      .join('\n'),
    options.resourcesDir,
    resolverOptions,
  )
  const richHtmlCss = resolveResourceUrls(splitTheme.richHtmlCss, options.resourcesDir, resolverOptions)
  const deckbuilderCss = [themeCss, richHtmlCss].filter(Boolean).join('\n')
  marp.themeSet.add(themeCss)

  const markdown = resolveResourceUrls(
    buildMarpMarkdown(htmlDeck, { themeName: definitions.brand.themeName }),
    options.resourcesDir,
    resolverOptions,
  )
  const { html, css, comments } = marp.render(markdown)

  return {
    html,
    css,
    comments,
    document: htmlDocument({
      html,
      css,
      deckbuilderCss,
      comments,
      bespokeCss: definitions.bespokeCss,
      bespokeJs: definitions.bespokeJs,
      richHtmlJs: richHtmlRuntimeScript(),
      title: deck.frontmatter.title || 'Deck',
    }),
    assets: assetMap
      ? [...assetMap.entries()].map(([relativePath, sourcePath]) => ({
          relativePath,
          sourcePath,
        }))
      : [],
  }
}
