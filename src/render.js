import { Marp } from '@marp-team/marp-core'
import { Element } from '@marp-team/marpit'
import { pathToFileURL } from 'node:url'

import {
  htmlAnimationClassNames,
  presentationAnimationCss,
  presentationAnimationScript,
} from './animations/html.js'
import { hasSlideBackgroundAsset, slideBackgroundAsset } from './brand.js'
import { buildMarpMarkdown } from './markdown.js'
import {
  normalizeResourceReference,
  resolveResourceFile,
  resolveSurfaceResourceFile,
  resourceToDataUri,
} from './resources.js'

export function renderDeckHtml(deck, options = {}) {
  const definitions = options.definitions
  const htmlDeck = {
    ...deck,
    slides: deck.slides
      .filter((slide) => !shouldSkipHtml(slide))
      .map((slide) => ({
        ...slide,
        source: prepareHtmlSource(applyHtmlBranding(slide, options.definitions?.brand, options.resourcesDir)),
      })),
  }
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
  const themeCss = resolveResourceUrls(
    [
      definitions.themeCss,
      brandBackgroundCss(definitions.brand),
      brandSurfaceCss(definitions.brand),
      brandLogoCss(definitions.brand),
      presentationAnimationCss(htmlDeck.slides),
    ]
      .filter(Boolean)
      .join('\n'),
    options.resourcesDir,
    resolverOptions,
  )
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
      deckbuilderCss: themeCss,
      comments,
      bespokeCss: definitions.bespokeCss,
      bespokeJs: definitions.bespokeJs,
      deckbuilderJs: presentationAnimationScript(htmlDeck.slides),
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

export function brandBackgroundCss(brand = {}) {
  const rules = [
    backgroundRule('section', slideBackgroundAsset(brand, 'content', 'dark')),
    lightBackgroundRule(slideBackgroundAsset(brand, 'content', 'light')),
    backgroundRule('section.cover', slideBackgroundAsset(brand, 'cover', 'dark')),
    backgroundRule(
      'section.deck-divider-slide, section:has(.deck-divider)',
      slideBackgroundAsset(brand, 'divider', 'dark'),
    ),
    backgroundRule(
      'section.deck-close-slide, section:has(.deck-close)',
      slideBackgroundAsset(brand, 'close', 'dark'),
    ),
  ].filter(Boolean)

  return rules.length ? rules.join('\n') : ''
}

export function brandLogoCss(brand = {}) {
  const companyBox = brand.layouts?.companyLogo || brand.layouts?.logo || { x: 36, y: 21, w: 98, h: 24 }
  const customerBox = brand.layouts?.customerLogo || { x: 828, y: 21, w: 98, h: 24 }
  return `.deck-brand-logo,
.deck-company-logo {
  position: absolute;
  left: ${ptToPxCss(brand, companyBox.x)};
  top: ${ptToPxCss(brand, companyBox.y)};
  width: ${ptToPxCss(brand, companyBox.w)};
  height: ${ptToPxCss(brand, companyBox.h)};
  display: block;
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
}

.deck-customer-logo-frame {
  position: absolute;
  left: ${ptToPxCss(brand, customerBox.x)};
  top: ${ptToPxCss(brand, customerBox.y)};
  width: ${ptToPxCss(brand, customerBox.w)};
  height: ${ptToPxCss(brand, customerBox.h)};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  object-fit: contain;
  z-index: 20;
  pointer-events: none;
}

${customerLogoBackplateEnabled(brand) ? `.deck-customer-logo-frame.deck-logo-on-dark {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 4px;
}` : ''}

.deck-customer-logo {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: none !important;
  mix-blend-mode: normal !important;
}`
}

export function brandSurfaceCss(brand = {}) {
  const darkBackground = cssColor(brand, 'backgroundDark', cssColor(brand, 'dark', '090909'))
  const lightBackground = cssColor(brand, 'backgroundLight', cssColor(brand, 'white', 'FFFFFF'))
  const darkText = readableDarkCssColor(brand, 'body', 'C8D8F0')
  const darkMuted = readableDarkCssColor(brand, 'muted', '8B9AB5')
  const darkHeading = readableDarkCssColor(brand, 'white', 'FFFFFF')
  const darkCard = cssColor(brand, 'cardDark', cssColor(brand, 'cardLight', '0D1D36'))
  const darkBorder = cssColor(brand, 'border', '1E3A5F')
  const darkAccent = cssColor(brand, 'blue', '0F82F5')
  const darkLightBlue = cssColor(brand, 'lightBlue', '59D6FD')
  const darkGreen = cssColor(brand, 'green', '2FC27D')
  const darkRed = cssColor(brand, 'red', 'FF5C7A')
  const darkOrange = cssColor(brand, 'orange', 'FF9F51')
  const darkPurple = cssColor(brand, 'purple', '5D4EE8')
  const lightHeading = cssColor(brand, 'headingLight', '090909')
  const lightText = cssColor(brand, 'bodyLight', '444444')
  const lightMuted = cssColor(brand, 'mutedLight', '666666')
  const lightCard = cssColor(brand, 'cardFillLight', 'FDFDFD')
  const lightBorder = cssColor(brand, 'borderLight', 'DEDEDE')
  const lightAccent = cssColor(brand, 'blue', '0F82F5')
  const lightBlue = cssColor(brand, 'lightBlue', '59D6FD')
  const lightGreen = cssColor(brand, 'green', '2FC27D')
  const lightRed = cssColor(brand, 'red', 'FF5C7A')
  const lightOrange = cssColor(brand, 'orange', 'FF9F51')
  const lightPurple = cssColor(brand, 'purple', '5D4EE8')
  const darkPanel = panelBackgroundCss(darkCard, hasSlideBackgroundAsset(brand, 'dark'), 0.86)
  const lightPanel = panelBackgroundCss(lightCard, hasSlideBackgroundAsset(brand, 'light'), 0.92)

  return `section.dark {
  background-color: ${darkBackground};
  color: ${darkText};
}

section.light {
  background-color: ${lightBackground};
}

section.dark h1,
section.dark h2,
section.dark h3,
section.dark .card-grid h2,
section.dark .deck-lane h2,
section.dark .deck-lane-steps h3,
section.dark .deck-chart figcaption,
section.dark .deck-funnel figcaption,
section.dark .deck-heatmap figcaption,
section.dark .deck-treemap figcaption,
section.dark .deck-journey-step h2 {
  color: ${darkHeading};
}

section.dark p,
section.dark li,
section.dark .card-grid p,
section.dark .deck-lane-steps p,
section.dark .deck-chart-label,
section.dark .deck-chart-legend-item,
section.dark .deck-chart-series-label,
section.dark .deck-chart-value,
section.dark .deck-chart-grouped-bar-row strong,
section.dark .deck-chart-stacked-row strong,
section.dark .deck-chart-doughnut-row strong,
section.dark .deck-chart-doughnut-ring strong,
section.dark .deck-journey-step p {
  color: ${darkText};
}

section.dark .deck-chart-track,
section.dark .deck-chart-stacked-track {
  background: ${panelBackgroundCss(darkBorder, hasSlideBackgroundAsset(brand, 'dark'), 0.72)};
}

section.dark .deck-chart-doughnut-ring::after {
  background: ${darkPanel};
}

section.dark .deck-chart-doughnut-ring > span,
section.dark .deck-chart-doughnut-percent {
  color: ${darkMuted};
}

section.dark .deck-chart-line-tick,
section.dark .deck-chart-line-point-value,
section.dark .deck-chart-area-tick,
section.dark .deck-chart-area-point-value,
section.dark .deck-chart-scatter-tick,
section.dark .deck-chart-scatter-axis-label {
  fill: ${darkMuted};
}

section.dark .deck-chart-line-grid,
section.dark .deck-chart-area-grid,
section.dark .deck-chart-scatter-grid {
  stroke: ${darkBorder};
}

section.dark .deck-chart-line-axis,
section.dark .deck-chart-area-axis,
section.dark .deck-chart-scatter-axis {
  stroke: ${darkMuted};
}

section.dark .deck-chart-line-path,
section.dark .deck-chart-area-path,
section.dark .deck-metric-trend-line {
  stroke: ${darkAccent};
}

section.dark .deck-chart-line-point,
section.dark .deck-chart-area-point,
section.dark .deck-metric-trend-dot {
  fill: ${darkAccent};
}

section.dark .deck-chart-area-fill {
  fill: ${cssRgba(darkAccent, 0.22)};
}

section.dark .deck-chart-waterfall {
  --deck-waterfall-grid: ${darkBorder};
  --deck-waterfall-axis: ${darkMuted};
  --deck-waterfall-text: ${darkMuted};
  --deck-waterfall-positive: ${darkGreen};
  --deck-waterfall-negative: ${darkRed};
  --deck-waterfall-connector: ${darkMuted};
}

section.dark .deck-chart-bullet {
  --deck-bullet-grid: ${darkBorder};
  --deck-bullet-axis: ${darkMuted};
  --deck-bullet-text: ${darkMuted};
  --deck-bullet-bar: ${darkAccent};
  --deck-bullet-on-bar: ${darkHeading};
  --deck-bullet-target: ${darkOrange};
  --deck-bullet-track: ${darkCard};
}

section.dark .deck-chart-histogram {
  --deck-histogram-grid: ${darkBorder};
  --deck-histogram-axis: ${darkMuted};
  --deck-histogram-text: ${darkMuted};
  --deck-histogram-bar: ${darkPurple};
  --deck-histogram-barBorder: ${darkAccent};
}

section.dark .deck-chart-boxplot {
  --deck-boxplot-grid: ${darkBorder};
  --deck-boxplot-axis: ${darkMuted};
  --deck-boxplot-text: ${darkMuted};
  --deck-boxplot-box: ${darkAccent};
  --deck-boxplot-fill: ${darkCard};
  --deck-boxplot-median: ${darkOrange};
}

section.dark .deck-chart-pareto {
  --deck-pareto-grid: ${darkBorder};
  --deck-pareto-axis: ${darkMuted};
  --deck-pareto-text: ${darkMuted};
  --deck-pareto-bar: ${darkAccent};
  --deck-pareto-bar-border: ${darkLightBlue};
  --deck-pareto-line: ${darkOrange};
  --deck-pareto-point: ${darkOrange};
}

section.dark .deck-chart-sankey {
  --deck-sankey-grid: ${darkBorder};
  --deck-sankey-text: ${darkHeading};
  --deck-sankey-muted: ${darkMuted};
  --deck-sankey-label-halo: ${darkPanel};
  --deck-sankey-linkOpacity: 0.5;
  --deck-sankey-node-0: ${darkLightBlue};
  --deck-sankey-node-1: ${darkAccent};
  --deck-sankey-node-2: ${darkPurple};
  --deck-sankey-node-3: ${darkOrange};
  --deck-sankey-node-4: ${darkGreen};
  --deck-sankey-node-5: ${darkRed};
}

section.dark .deck-chart-scatter-point text,
section.dark .deck-chart-bubble-point text {
  fill: ${darkText};
}

section.dark .deck-arrow,
section.dark .deck-heatmap-x-label,
section.dark .deck-heatmap-y-label,
section.dark .deck-heatmap-caption,
section.dark .deck-impact-radar-caption,
section.dark .deck-treemap-caption {
  color: ${darkMuted};
}

section.dark .card-grid article,
section.dark .deck-chart,
section.dark .deck-funnel,
section.dark .deck-heatmap,
section.dark .deck-treemap,
section.dark .deck-lane,
section.dark .deck-lane-steps article,
section.dark .deck-journey-step,
section.dark .deck-journey-path-summary,
section.dark .deck-proof,
section.dark .deck-logo-tile {
  background: ${darkPanel};
  border-color: ${darkBorder};
}

section.dark .deck-funnel {
  --deck-funnel-surface: ${darkPanel};
  --deck-funnel-border: ${darkBorder};
  --deck-funnel-heading: ${darkHeading};
  --deck-funnel-muted: ${darkMuted};
}

section.light h1,
section.light h2,
section.light h3,
section.light .card-grid h2,
section.light .deck-lane h2,
section.light .deck-lane-steps h3,
section.light .deck-chart figcaption,
section.light .deck-funnel figcaption,
section.light .deck-heatmap figcaption,
section.light .deck-treemap figcaption,
section.light .deck-journey-step h2 {
  color: ${lightHeading};
}

section.light p,
section.light li,
section.light .card-grid p,
section.light .deck-lane-steps p,
section.light .deck-chart-label,
section.light .deck-chart-legend-item,
section.light .deck-chart-series-label,
section.light .deck-chart-value,
section.light .deck-chart-grouped-bar-row strong,
section.light .deck-chart-stacked-row strong,
section.light .deck-chart-doughnut-row strong,
section.light .deck-chart-doughnut-ring strong,
section.light .deck-journey-step p {
  color: ${lightText};
}

section.light .deck-chart-track,
section.light .deck-chart-stacked-track {
  background: #eef6fe;
}

section.light .deck-chart-doughnut-ring::after {
  background: ${lightPanel};
}

section.light .deck-chart-doughnut-ring > span,
section.light .deck-chart-doughnut-percent {
  color: ${lightMuted};
}

section.light .deck-chart-line-tick,
section.light .deck-chart-line-point-value,
section.light .deck-chart-area-tick,
section.light .deck-chart-area-point-value,
section.light .deck-chart-scatter-tick,
section.light .deck-chart-scatter-axis-label {
  fill: ${lightMuted};
}

section.light .deck-chart-line-grid,
section.light .deck-chart-area-grid,
section.light .deck-chart-scatter-grid {
  stroke: #e8eef7;
}

section.light .deck-chart-line-axis,
section.light .deck-chart-area-axis,
section.light .deck-chart-scatter-axis {
  stroke: #9aa8bd;
}

section.light .deck-chart-line-path,
section.light .deck-chart-area-path,
section.light .deck-metric-trend-line {
  stroke: ${lightAccent};
}

section.light .deck-chart-line-point,
section.light .deck-chart-area-point,
section.light .deck-metric-trend-dot {
  fill: ${lightAccent};
}

section.light .deck-chart-area-fill {
  fill: ${cssRgba(lightAccent, 0.22)};
}

section.light .deck-chart-waterfall {
  --deck-waterfall-grid: #e8eef7;
  --deck-waterfall-axis: #9aa8bd;
  --deck-waterfall-text: ${lightMuted};
  --deck-waterfall-positive: ${lightGreen};
  --deck-waterfall-negative: ${lightRed};
  --deck-waterfall-connector: #9aa8bd;
}

section.light .deck-chart-bullet {
  --deck-bullet-grid: #e8eef7;
  --deck-bullet-axis: #9aa8bd;
  --deck-bullet-text: ${lightMuted};
  --deck-bullet-bar: ${lightAccent};
  --deck-bullet-on-bar: #ffffff;
  --deck-bullet-target: ${lightOrange};
  --deck-bullet-track: #eef6fe;
}

section.light .deck-chart-histogram {
  --deck-histogram-grid: #e8eef7;
  --deck-histogram-axis: #9aa8bd;
  --deck-histogram-text: ${lightMuted};
  --deck-histogram-bar: ${lightPurple};
  --deck-histogram-barBorder: ${lightAccent};
}

section.light .deck-chart-boxplot {
  --deck-boxplot-grid: #e8eef7;
  --deck-boxplot-axis: #9aa8bd;
  --deck-boxplot-text: ${lightMuted};
  --deck-boxplot-box: ${lightAccent};
  --deck-boxplot-fill: #bfe0ff;
  --deck-boxplot-median: ${lightOrange};
}

section.light .deck-chart-pareto {
  --deck-pareto-grid: #e8eef7;
  --deck-pareto-axis: #9aa8bd;
  --deck-pareto-text: ${lightMuted};
  --deck-pareto-bar: ${lightAccent};
  --deck-pareto-bar-border: ${lightBlue};
  --deck-pareto-line: ${lightOrange};
  --deck-pareto-point: ${lightOrange};
}

section.light .deck-chart-sankey {
  --deck-sankey-grid: #d8e2f0;
  --deck-sankey-text: ${lightText};
  --deck-sankey-muted: ${lightMuted};
  --deck-sankey-label-halo: ${lightPanel};
  --deck-sankey-linkOpacity: 0.36;
  --deck-sankey-node-0: ${lightAccent};
  --deck-sankey-node-1: ${lightBlue};
  --deck-sankey-node-2: ${lightPurple};
  --deck-sankey-node-3: ${lightOrange};
  --deck-sankey-node-4: ${lightGreen};
  --deck-sankey-node-5: ${lightRed};
}

section.light .deck-chart-scatter-point text,
section.light .deck-chart-bubble-point text {
  fill: ${lightText};
}

section.light .deck-arrow,
section.light .deck-heatmap-x-label,
section.light .deck-heatmap-y-label,
section.light .deck-heatmap-caption,
section.light .deck-impact-radar-caption,
section.light .deck-treemap-caption {
  color: ${lightMuted};
}

section.light .card-grid article,
section.light .deck-chart,
section.light .deck-funnel,
section.light .deck-heatmap,
section.light .deck-treemap,
section.light .deck-lane,
section.light .deck-lane-steps article,
section.light .deck-journey-step,
section.light .deck-journey-path-summary,
section.light .deck-proof,
section.light .deck-logo-tile {
  background: ${lightPanel};
  border-color: ${lightBorder};
}

section.light .deck-funnel {
  --deck-funnel-surface: ${lightPanel};
  --deck-funnel-border: ${lightBorder};
  --deck-funnel-heading: ${lightHeading};
  --deck-funnel-muted: ${lightMuted};
}

section.dark .deck-lane-blue .deck-lane-steps article,
section.dark .deck-lane-lightBlue .deck-lane-steps article,
section.dark .deck-lane-cyan .deck-lane-steps article,
section.dark .deck-lane-purple .deck-lane-steps article,
section.dark .deck-lane-green .deck-lane-steps article,
section.dark .deck-lane-orange .deck-lane-steps article,
section.dark .deck-lane-red .deck-lane-steps article,
section.dark .deck-lane-yellow .deck-lane-steps article {
  background: ${darkPanel};
}

section.dark .deck-lane-blue .deck-lane-steps article { border-left-color: ${cssColor(brand, 'blue', '0F82F5')}; }
section.dark .deck-lane-lightBlue .deck-lane-steps article,
section.dark .deck-lane-cyan .deck-lane-steps article { border-left-color: ${cssColor(brand, 'lightBlue', '59D6FD')}; }
section.dark .deck-lane-purple .deck-lane-steps article { border-left-color: ${cssColor(brand, 'purple', '5143D5')}; }
section.dark .deck-lane-green .deck-lane-steps article { border-left-color: ${cssColor(brand, 'green', '66CC8E')}; }
section.dark .deck-lane-orange .deck-lane-steps article { border-left-color: ${cssColor(brand, 'orange', 'F9935B')}; }
section.dark .deck-lane-red .deck-lane-steps article { border-left-color: ${cssColor(brand, 'red', 'FC5161')}; }
section.dark .deck-lane-yellow .deck-lane-steps article { border-left-color: ${cssColor(brand, 'yellow', 'FBC546')}; }

section.light .deck-lane-blue .deck-lane-steps article {
  background: #e8f4fe;
  border-left-color: ${cssColor(brand, 'blue', '0F82F5')};
}

section.light .deck-lane-lightBlue .deck-lane-steps article,
section.light .deck-lane-cyan .deck-lane-steps article {
  background: #e9f9ff;
  border-left-color: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-lane-purple .deck-lane-steps article {
  background: #f0edfe;
  border-left-color: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-lane-green .deck-lane-steps article {
  background: #ecf9f1;
  border-left-color: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-lane-orange .deck-lane-steps article {
  background: #fff3ea;
  border-left-color: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-lane-red .deck-lane-steps article {
  background: #fff0f2;
  border-left-color: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-lane-yellow .deck-lane-steps article {
  background: #fff8df;
  border-left-color: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-heatmap-cell {
  color: ${lightHeading};
  border-color: rgba(15, 130, 245, .22);
}

section.dark .deck-heatmap-cell {
  color: ${darkHeading};
  border-color: rgba(255, 255, 255, .16);
}

section.light .deck-heatmap,
section.dark .deck-heatmap {
  --deck-heatmap-accent: ${cssColor(brand, 'blue', '0F82F5')};
}

section.light .deck-treemap,
section.dark .deck-treemap {
  --deck-treemap-fill-0: ${cssColor(brand, 'blue', '0F82F5')};
  --deck-treemap-fill-1: ${cssColor(brand, 'lightBlue', '59D6FD')};
  --deck-treemap-fill-2: ${cssColor(brand, 'purple', '5143D5')};
  --deck-treemap-fill-3: ${cssColor(brand, 'green', '66CC8E')};
  --deck-treemap-fill-4: ${cssColor(brand, 'orange', 'F9935B')};
  --deck-treemap-fill-5: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-impact-radar {
  --deck-impact-radar-surface: ${lightBackground};
  --deck-impact-radar-panel: ${lightPanel};
  --deck-impact-radar-border: ${lightBorder};
  --deck-impact-radar-heading: ${lightHeading};
  --deck-impact-radar-body: ${lightText};
  --deck-impact-radar-muted: ${lightMuted};
  --deck-impact-radar-track: #eef6fe;
  --deck-impact-radar-radarGrid: ${lightBorder};
  --deck-impact-radar-radarFill: rgba(15, 130, 245, .20);
  --deck-impact-radar-radarStroke: ${cssColor(brand, 'blue', '0F82F5')};
}

section.dark .deck-impact-radar {
  --deck-impact-radar-surface: ${darkBackground};
  --deck-impact-radar-panel: ${darkPanel};
  --deck-impact-radar-border: ${darkBorder};
  --deck-impact-radar-heading: ${darkHeading};
  --deck-impact-radar-body: ${darkText};
  --deck-impact-radar-muted: ${darkMuted};
  --deck-impact-radar-track: #071228;
  --deck-impact-radar-radarGrid: ${darkBorder};
  --deck-impact-radar-radarFill: rgba(89, 214, 253, .22);
  --deck-impact-radar-radarStroke: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-impact-radar,
section.dark .deck-impact-radar {
  --deck-impact-radar-fill-0: ${cssColor(brand, 'blue', '0F82F5')};
  --deck-impact-radar-fill-1: ${cssColor(brand, 'purple', '5143D5')};
  --deck-impact-radar-fill-2: ${cssColor(brand, 'green', '66CC8E')};
  --deck-impact-radar-fill-3: ${cssColor(brand, 'lightBlue', '59D6FD')};
  --deck-impact-radar-fill-4: ${cssColor(brand, 'orange', 'F9935B')};
  --deck-impact-radar-fill-5: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-journey-path {
  --deck-journey-path-accent: ${cssColor(brand, 'blue', '0F82F5')};
  --deck-journey-path-body: ${lightText};
  --deck-journey-path-callout: #eef6fe;
  --deck-journey-path-heading: ${lightHeading};
  --deck-journey-path-hotspot: ${cssColor(brand, 'red', 'FC5161')};
  --deck-journey-path-surface: ${lightBackground};
}

section.dark .deck-journey-path {
  --deck-journey-path-accent: ${cssColor(brand, 'blue', '0F82F5')};
  --deck-journey-path-body: ${darkText};
  --deck-journey-path-callout: #102642;
  --deck-journey-path-heading: ${darkHeading};
  --deck-journey-path-hotspot: ${cssColor(brand, 'red', 'FC5161')};
  --deck-journey-path-surface: #071228;
}

section.light .deck-heatmap-accent-lightBlue,
section.dark .deck-heatmap-accent-lightBlue,
section.light .deck-heatmap-accent-cyan,
section.dark .deck-heatmap-accent-cyan {
  --deck-heatmap-accent: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-journey-path-accent-lightBlue,
section.dark .deck-journey-path-accent-lightBlue,
section.light .deck-journey-path-accent-cyan,
section.dark .deck-journey-path-accent-cyan {
  --deck-journey-path-accent: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-heatmap-accent-purple,
section.dark .deck-heatmap-accent-purple {
  --deck-heatmap-accent: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-journey-path-accent-purple,
section.dark .deck-journey-path-accent-purple {
  --deck-journey-path-accent: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-heatmap-accent-green,
section.dark .deck-heatmap-accent-green {
  --deck-heatmap-accent: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-journey-path-accent-green,
section.dark .deck-journey-path-accent-green {
  --deck-journey-path-accent: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-heatmap-accent-orange,
section.dark .deck-heatmap-accent-orange {
  --deck-heatmap-accent: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-journey-path-accent-orange,
section.dark .deck-journey-path-accent-orange {
  --deck-journey-path-accent: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-heatmap-accent-red,
section.dark .deck-heatmap-accent-red {
  --deck-heatmap-accent: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-journey-path-accent-red,
section.dark .deck-journey-path-accent-red {
  --deck-journey-path-accent: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-heatmap-accent-yellow,
section.dark .deck-heatmap-accent-yellow {
  --deck-heatmap-accent: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-journey-path-accent-yellow,
section.dark .deck-journey-path-accent-yellow {
  --deck-journey-path-accent: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-signal-bars,
section.dark .deck-signal-bars,
section.light .deck-signal-board,
section.dark .deck-signal-board {
  --deck-signal-accent: ${cssColor(brand, 'blue', '0F82F5')};
}

section.light .deck-signal-accent-lightBlue,
section.dark .deck-signal-accent-lightBlue,
section.light .deck-signal-accent-cyan,
section.dark .deck-signal-accent-cyan {
  --deck-signal-accent: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-signal-accent-purple,
section.dark .deck-signal-accent-purple {
  --deck-signal-accent: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-signal-accent-green,
section.dark .deck-signal-accent-green {
  --deck-signal-accent: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-signal-accent-orange,
section.dark .deck-signal-accent-orange {
  --deck-signal-accent: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-signal-accent-red,
section.dark .deck-signal-accent-red {
  --deck-signal-accent: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-signal-accent-yellow,
section.dark .deck-signal-accent-yellow {
  --deck-signal-accent: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-signal-board-panel h2,
section.dark .deck-signal-board-panel h2 {
  color: ${cssColor(brand, 'blue', '0F82F5')};
}

section.light .deck-signal-board.deck-signal-accent-lightBlue .deck-signal-board-panel h2,
section.dark .deck-signal-board.deck-signal-accent-lightBlue .deck-signal-board-panel h2,
section.light .deck-signal-board.deck-signal-accent-lightBlue .deck-signal-board-tag,
section.dark .deck-signal-board.deck-signal-accent-lightBlue .deck-signal-board-tag {
  color: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.light .deck-signal-board.deck-signal-accent-purple .deck-signal-board-panel h2,
section.dark .deck-signal-board.deck-signal-accent-purple .deck-signal-board-panel h2,
section.light .deck-signal-board.deck-signal-accent-purple .deck-signal-board-tag,
section.dark .deck-signal-board.deck-signal-accent-purple .deck-signal-board-tag {
  color: ${cssColor(brand, 'purple', '5143D5')};
}

section.light .deck-signal-board.deck-signal-accent-green .deck-signal-board-panel h2,
section.dark .deck-signal-board.deck-signal-accent-green .deck-signal-board-panel h2,
section.light .deck-signal-board.deck-signal-accent-green .deck-signal-board-tag,
section.dark .deck-signal-board.deck-signal-accent-green .deck-signal-board-tag {
  color: ${cssColor(brand, 'green', '66CC8E')};
}

section.light .deck-signal-board.deck-signal-accent-orange .deck-signal-board-panel h2,
section.dark .deck-signal-board.deck-signal-accent-orange .deck-signal-board-panel h2,
section.light .deck-signal-board.deck-signal-accent-orange .deck-signal-board-tag,
section.dark .deck-signal-board.deck-signal-accent-orange .deck-signal-board-tag {
  color: ${cssColor(brand, 'orange', 'F9935B')};
}

section.light .deck-signal-board.deck-signal-accent-red .deck-signal-board-panel h2,
section.dark .deck-signal-board.deck-signal-accent-red .deck-signal-board-panel h2,
section.light .deck-signal-board.deck-signal-accent-red .deck-signal-board-tag,
section.dark .deck-signal-board.deck-signal-accent-red .deck-signal-board-tag {
  color: ${cssColor(brand, 'red', 'FC5161')};
}

section.light .deck-signal-board.deck-signal-accent-yellow .deck-signal-board-panel h2,
section.dark .deck-signal-board.deck-signal-accent-yellow .deck-signal-board-panel h2,
section.light .deck-signal-board.deck-signal-accent-yellow .deck-signal-board-tag,
section.dark .deck-signal-board.deck-signal-accent-yellow .deck-signal-board-tag {
  color: ${cssColor(brand, 'yellow', 'FBC546')};
}

section.light .deck-signal-summary p,
section.dark .deck-signal-summary p,
section.light .deck-signal-board-panel p,
section.dark .deck-signal-board-panel p,
section.light .deck-metric-trend-summary span,
section.dark .deck-metric-trend-summary span,
section.light .deck-signal-label,
section.dark .deck-signal-label {
  color: #c8d8f0;
}

section.light .deck-signal-chart figcaption span,
section.dark .deck-signal-chart figcaption span,
section.light .deck-metric-trend-labels,
section.dark .deck-metric-trend-labels {
  color: #9fb5d9;
  fill: #9fb5d9;
}

section.light .deck-signal-chart figcaption strong,
section.dark .deck-signal-chart figcaption strong,
section.light .deck-signal-board-chart figcaption,
section.dark .deck-signal-board-chart figcaption,
section.light .deck-metric-trend-chart figcaption,
section.dark .deck-metric-trend-chart figcaption,
section.light .deck-metric-trend-final,
section.dark .deck-metric-trend-final,
section.light .deck-signal-row strong,
section.dark .deck-signal-row strong {
  color: #ffffff;
  fill: #ffffff;
}

section.dark .deck-signal-summary,
section.dark .deck-signal-chart,
section.light .deck-signal-summary,
section.light .deck-signal-chart,
section.dark .deck-metric-trend-summary,
section.dark .deck-metric-trend-chart,
section.light .deck-metric-trend-summary,
section.light .deck-metric-trend-chart {
  background: ${darkPanel};
  border-color: ${darkBorder};
}

section.dark .deck-signal-board-panel,
section.dark .deck-signal-board-chart {
  background: ${darkPanel};
  border-color: ${darkBorder};
  color: ${darkText};
}

section.light .deck-signal-board-panel,
section.light .deck-signal-board-chart {
  background: ${lightPanel};
  border-color: ${lightBorder};
  color: ${lightText};
}

section.dark .deck-signal-board-panel p,
section.dark .deck-signal-board .deck-signal-label {
  color: ${darkText};
}

section.light .deck-signal-board-panel p,
section.light .deck-signal-board .deck-signal-label {
  color: ${lightText};
}

section.dark .deck-signal-board-chart figcaption,
section.dark .deck-signal-board .deck-signal-row strong {
  color: ${darkHeading};
  fill: ${darkHeading};
}

section.light .deck-signal-board-chart figcaption,
section.light .deck-signal-board .deck-signal-row strong {
  color: ${lightHeading};
  fill: ${lightHeading};
}

section.light .deck-signal-board .deck-signal-track {
  background: #e8eef8;
}

section.dark .deck-signal-board .deck-signal-track {
  background: #071228;
}`
}

function backgroundRule(selector, resource) {
  if (!resource) return ''
  return `${selector} {
  background-image: url("${escapeCssUrl(resource)}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}`
}

function lightBackgroundRule(resource) {
  if (resource) {
    return backgroundRule('section.light', resource)
  }
  return `section.light {
  background-color: #ffffff;
  background-image: none;
}`
}

function applyHtmlBranding(slide, brand = {}, resourcesDir = 'resources') {
  const source = rewriteSurfaceLogoImages(
    stripCustomerLogoHtml(applyHtmlSlideClass(slide)),
    resourcesDir,
    slide.surface,
  )
  const logos = []
  const companyLogo = slide.companyLogo?.src
    ? surfaceResourceReference(slide.companyLogo.src, resourcesDir, slide.surface)
    : brandLogoForSlide(brand, slideKind(slide), slide.surface)
  const companyAlt = slide.companyLogo?.alt || `${brand.name || 'Brand'} logo`
  if (companyLogo && !/class=["'][^"']*\bdeck-brand-logo\b/i.test(source)) {
    logos.push(logoHtml(companyLogo, companyAlt, 'deck-brand-logo deck-company-logo'))
  }
  if (slide.customerLogo?.src) {
    logos.push(customerLogoHtml(
      surfaceResourceReference(slide.customerLogo.src, resourcesDir, slide.surface),
      slide.customerLogo.alt || 'Customer logo',
      slide.surface,
    ))
  }
  return logos.length ? insertLogoHtml(source, logos.join('\n')) : source
}

function applyHtmlSlideClass(slide) {
  const classNames = htmlClassNamesForSlide(slide)
  if (!classNames.length) return slide.source
  return mergeHtmlClassDirective(slide.source, classNames)
}

function insertLogoHtml(source, logo) {
  const lines = source.split(/\r?\n/)
  let insertAt = 0

  while (/^\s*<!--[\s\S]*?-->\s*$/.test(lines[insertAt] || '')) {
    insertAt += 1
  }

  return [...lines.slice(0, insertAt), logo, '', ...lines.slice(insertAt)].join('\n')
}

function prepareHtmlSource(source) {
  return normalizeLocalImageSources(compactRawSvgBlocks(source))
}

function stripCustomerLogoHtml(source) {
  return String(source || '').replace(
    /<img\b[^>]*\bclass=["'][^"']*\bdeck-customer-logo\b[^"']*["'][^>]*>\s*/gi,
    '',
  )
}

function compactRawSvgBlocks(source) {
  return String(source || '')
    .split(/(```[\s\S]*?```)/g)
    .map((part) => {
      if (part.startsWith('```')) return part
      return part.replace(/<svg\b[\s\S]*?<\/svg>/gi, (svg) =>
        svg
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .join('\n'),
      )
    })
    .join('')
}

function brandLogoForSlide(brand = {}, kind = 'content', surface = 'light') {
  const logo = brand.assets?.logo
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  if (surface === 'light') {
    return (
      logo.companyLight ||
      logo.contentLight ||
      logo.light ||
      logo[kind] ||
      logo.content ||
      logo.default ||
      ''
    )
  }
  return (
    logo.companyDark ||
    logo.dark ||
    logo[kind] ||
    (kind === 'divider' ? logo.cover : '') ||
    (kind === 'close' ? logo.cover : '') ||
    logo.default ||
    ''
  )
}

function logoHtml(src, alt, className) {
  return `<img class="${escapeHtmlAttr(className)}" src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}">`
}

function customerLogoHtml(src, alt, surface = 'light') {
  const surfaceClass = surface === 'dark' ? 'deck-logo-on-dark' : 'deck-logo-on-light'
  return `<span class="deck-customer-logo-frame ${surfaceClass}">${logoHtml(src, alt, 'deck-customer-logo')}</span>`
}

function rewriteSurfaceLogoImages(source, resourcesDir, surface) {
  return String(source || '').replace(
    /(<div\b[^>]*\bclass=["'][^"']*\bdeck-logo-tile\b[^"']*["'][^>]*>\s*<img\b[^>]*\bsrc=)(["'])([^"']+)\2/gi,
    (match, prefix, quote, src) => `${prefix}${quote}${surfaceResourceReference(src, resourcesDir, surface)}${quote}`,
  )
}

function surfaceResourceReference(src, resourcesDir, surface) {
  try {
    return `resource:${resolveSurfaceResourceFile(src, resourcesDir, surface).relativePath}`
  } catch {
    return src
  }
}

function slideKind(slide) {
  switch (slide.layout) {
    case 'cover':
      return 'cover'
    case 'divider':
      return 'divider'
    case 'close':
      return 'close'
    default:
      return 'content'
  }
}

function htmlClassForLayout(layout) {
  switch (layout) {
    case 'cover':
      return 'cover'
    case 'divider':
      return 'deck-divider-slide'
    case 'close':
      return 'deck-close-slide'
    default:
      return ''
  }
}

function htmlClassNamesForSlide(slide) {
  return [
    htmlClassForLayout(slide.layout) || slide.surface || '',
    ...htmlAnimationClassNames(slide),
  ].filter(Boolean)
}

function mergeHtmlClassDirective(source, classNames) {
  const uniqueClasses = (classes) => [...new Set(
    classes
      .join(' ')
      .split(/\s+/)
      .map((className) => className.trim())
      .filter(Boolean),
  )]
  const existingDirective = /<!--\s*_class\s*:\s*([\s\S]*?)\s*-->/i
  const match = String(source || '').match(existingDirective)
  if (match) {
    const merged = uniqueClasses([match[1], ...classNames]).join(' ')
    return source.replace(existingDirective, `<!-- _class: ${merged} -->`)
  }
  return `<!-- _class: ${uniqueClasses(classNames).join(' ')} -->\n${source}`
}

function customerLogoBackplateEnabled(brand = {}) {
  const value = brand.customerLogoBackplate ?? brand.assets?.customerLogoBackplate ?? false
  return value === true || ['true', 'yes', 'on', '1', 'chip', 'backplate'].includes(
    String(value || '').trim().toLowerCase(),
  )
}

export function shouldSkipHtml(slideModel) {
  const directives = slideModel?.directives || {}
  if (isTruthyDirective(directives['pptx-only'])) return true
  if (isTruthyDirective(directives['html-skip'])) return true
  return ['skip', 'omit', 'none', 'false', 'no', 'off'].includes(
    normalizeDirective(directives.html),
  )
}

export function htmlDocument({
  html,
  css,
  deckbuilderCss = '',
  comments = [],
  bespokeCss = '',
  bespokeJs = '',
  deckbuilderJs = '',
  title = 'Deck',
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
  <style data-deckbuilder-theme>${deckbuilderCss}</style>
  <style>${bespokeCss}</style>
</head>
<body>
${bespokeOsc()}
${html}
${renderNotes(comments)}
<script>${bespokeJs}</script>
<script>${deckbuilderJs}</script>
</body>
</html>
`
}

export function resolveResourceUrls(source, resourcesDir = 'resources', options = {}) {
  const resolvedSource = source.replace(/resource:([^)"'<\s]+)/g, (full, resourcePath) => {
    const resolved = resolveResourceFile(`resource:${resourcePath}`, resourcesDir)
    if (options.inlineAssets) return resourceToDataUri(resolved.path)
    if (options.assetMap) {
      options.assetMap.set(resolved.relativePath, resolved.path)
      return encodeURI(
        [options.assetUrlPrefix || 'resources', resolved.relativePath]
          .filter(Boolean)
          .join('/'),
      )
    }
    return pathToFileURL(resolved.path).href
  })
  const unresolved = resolvedSource.match(/resource:[^)"'<\s]+/g)
  if (unresolved?.length) {
    throw new Error(`Unresolved resource reference(s): ${[...new Set(unresolved)].join(', ')}`)
  }
  return resolvedSource
}

function normalizeLocalImageSources(source) {
  return String(source || '').replace(/<img\b[^>]*\bsrc=(["'])([^"']+)\1[^>]*>/gi, (tag, quote, src) => {
    const normalized = normalizeResourceReference(src)
    if (normalized === src) return tag
    return tag.replace(`src=${quote}${src}${quote}`, `src=${quote}${normalized}${quote}`)
  })
}

function escapeCssUrl(value) {
  return String(value).replace(/["\\\n\r\f]/g, '\\$&')
}

function cssColor(brand, keyOrHex, fallback = '') {
  const raw = brand.colors?.[keyOrHex] || keyOrHex || fallback
  const value = /^#?[0-9a-f]{6}$/i.test(String(raw)) ? raw : fallback
  if (!value) return ''
  return /^#/.test(String(value)) ? String(value) : `#${value}`
}

function panelBackgroundCss(colorValue, hasBackgroundImage, alpha) {
  if (!hasBackgroundImage) return colorValue
  return cssRgba(colorValue, alpha)
}

function cssRgba(colorValue, alpha) {
  const rgb = hexRgb(colorValue)
  if (!rgb) return colorValue
  return `rgba(${rgb.join(', ')}, ${alpha})`
}

function readableDarkCssColor(brand, token, fallback) {
  const value = cssColor(brand, token, fallback)
  return isDarkCssColor(value) ? `#${fallback}` : value
}

function isDarkCssColor(value) {
  const rgb = hexRgb(value)
  if (!rgb) return false
  return relativeLuminance(rgb) < 0.35
}

function hexRgb(value) {
  const match = String(value || '').match(/^#?([0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ptToPxCss(brand, value) {
  const pxToPt = brand.slide?.pxToPt || 0.75
  const numeric = Number(value || 0)
  return `${Number((numeric / pxToPt).toFixed(3))}px`
}

function isTruthyDirective(value) {
  return ['true', 'yes', 'on', '1'].includes(normalizeDirective(value))
}

function normalizeDirective(value) {
  return String(value || '').trim().toLowerCase()
}

function bespokeOsc() {
  return `<div class="bespoke-marp-osc">
  <button data-bespoke-marp-osc="prev" tabindex="-1" title="Previous slide">Previous slide</button>
  <span data-bespoke-marp-osc="page"></span>
  <button data-bespoke-marp-osc="next" tabindex="-1" title="Next slide">Next slide</button>
  <button data-bespoke-marp-osc="fullscreen" tabindex="-1" title="Toggle fullscreen (f)">Toggle fullscreen</button>
  <button data-bespoke-marp-osc="overview" tabindex="-1" title="Toggle overview view (o)">Toggle overview view</button>
  <button data-bespoke-marp-osc="presenter" tabindex="-1" title="Open presenter view (p)">Open presenter view</button>
</div>`
}

function renderNotes(comments = []) {
  return comments
    .map((notes, index) => {
      if (!notes?.length) return ''
      const paragraphs = notes
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('')
      return `<div class="bespoke-marp-note" data-index="${index}" tabindex="0">${paragraphs}</div>`
    })
    .join('\n')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
