import { Marp } from '@marp-team/marp-core'
import { Element } from '@marp-team/marpit'
import * as cheerio from 'cheerio'
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
  const htmlWithInlineHeadingColors = inlineDarkImageHeadingColors(
    html,
    htmlDeck.slides,
    definitions.brand,
  )
  const htmlWithDeckShell = prepareHtmlDeckShell(htmlWithInlineHeadingColors)
  const deckbuilderJs = [
    presentationAnimationScript(htmlDeck.slides),
    htmlDeckEnhancementScript(definitions.brand),
    htmlDeckNavigationScript(),
    htmlDeckChartScript(),
  ].filter(Boolean).join('\n')

  return {
    html: htmlWithDeckShell,
    css,
    comments,
    document: htmlDocument({
      html: htmlWithDeckShell,
      css,
      deckbuilderCss: themeCss,
      comments,
      deckbuilderHtmlCss: htmlDeckShellCss(definitions.brand),
      deckbuilderJs,
      slideCount: htmlDeck.slides.length,
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

section.dark .deck-swimlane {
  --deck-swimlane-step-title-color: ${darkHeading};
  --deck-swimlane-step-body-color: ${darkText};
}

section.light .deck-swimlane {
  --deck-swimlane-step-title-color: ${lightHeading};
  --deck-swimlane-step-body-color: ${lightText};
}

section.dark h1,
section.dark h2,
section.dark h3,
section.dark .card-grid h2,
section.dark .deck-lane h2,
section.dark .deck-lane-steps h3,
section.dark .deck-lane-step-title,
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
section.dark .deck-lane-step-body,
section.dark .deck-chart-label,
section.dark .deck-chart-legend-item,
section.dark .deck-chart-series-label,
section.dark .deck-chart-value,
section.dark .deck-chart-row strong,
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

.deck-funnel {
  --deck-funnel-stage-0: ${cssColor(brand, 'blue', '0F82F5')};
  --deck-funnel-stage-1: ${cssColor(brand, 'cyan', '59D6FD')};
  --deck-funnel-stage-2: ${cssColor(brand, 'purple', '5143D5')};
  --deck-funnel-stage-3: ${cssColor(brand, 'orange', 'F9935B')};
  --deck-funnel-stage-4: ${cssColor(brand, 'green', '66CC8E')};
  --deck-funnel-stage-5: ${cssColor(brand, 'red', 'FC5161')};
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
section.light .deck-lane-step-title,
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
section.light .deck-lane-step-body,
section.light .deck-chart-label,
section.light .deck-chart-legend-item,
section.light .deck-chart-series-label,
section.light .deck-chart-value,
section.light .deck-chart-row strong,
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

section.dark .deck-orchestration,
section.light .deck-orchestration {
  --deck-orchestration-accent: ${darkAccent};
}

section.dark .deck-orchestration-accent-lightBlue,
section.dark .deck-orchestration-accent-cyan,
section.light .deck-orchestration-accent-lightBlue,
section.light .deck-orchestration-accent-cyan {
  --deck-orchestration-accent: ${darkLightBlue};
}

section.dark .deck-orchestration-accent-purple,
section.light .deck-orchestration-accent-purple {
  --deck-orchestration-accent: ${darkPurple};
}

section.dark .deck-orchestration-accent-green,
section.light .deck-orchestration-accent-green {
  --deck-orchestration-accent: ${darkGreen};
}

section.dark .deck-orchestration-accent-orange,
section.light .deck-orchestration-accent-orange {
  --deck-orchestration-accent: ${darkOrange};
}

section.dark .deck-orchestration-accent-red,
section.light .deck-orchestration-accent-red {
  --deck-orchestration-accent: ${darkRed};
}

section.dark .deck-orchestration {
  --deck-orchestration-node-bg: ${darkPanel};
  --deck-orchestration-node-border: ${darkBorder};
  --deck-orchestration-node-text: ${darkText};
  --deck-orchestration-muted: ${darkMuted};
  --deck-orchestration-heading: ${darkHeading};
  --deck-orchestration-body: ${darkText};
  --deck-orchestration-layer-bg: linear-gradient(180deg, ${cssRgba(darkAccent, 0.16)}, ${cssRgba(darkLightBlue, 0.06)});
  --deck-orchestration-layer-border: ${cssRgba(darkLightBlue, 0.35)};
  --deck-orchestration-sweep: rgba(255, 255, 255, .14);
}

section.light .deck-orchestration {
  --deck-orchestration-node-bg: rgba(255, 255, 255, .78);
  --deck-orchestration-node-border: ${lightBorder};
  --deck-orchestration-node-text: ${lightText};
  --deck-orchestration-muted: ${lightMuted};
  --deck-orchestration-heading: ${lightHeading};
  --deck-orchestration-body: ${lightText};
  --deck-orchestration-layer-bg: linear-gradient(180deg, ${cssRgba(lightAccent, 0.12)}, ${cssRgba(lightBlue, 0.06)});
  --deck-orchestration-layer-border: ${cssRgba(lightAccent, 0.26)};
  --deck-orchestration-sweep: rgba(15, 130, 245, .1);
}

.deck-orchestration {
  display: flex;
  flex-direction: column;
  gap: clamp(14px, 2.4vh, 26px);
  margin-top: clamp(26px, 4vh, 46px);
}

.deck-orchestration-tier-label {
  margin-bottom: 10px;
  color: var(--deck-orchestration-muted);
  font-size: clamp(9px, .95vw, 12px);
  font-weight: 600;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.deck-orchestration-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(8px, 1vw, 12px);
}

.deck-orchestration-node {
  border: 1px solid var(--deck-orchestration-node-border);
  border-radius: 12px;
  background: var(--deck-orchestration-node-bg);
  color: var(--deck-orchestration-node-text);
  padding: .6em 1.05em;
  font-size: clamp(12px, 1.2vw, 15px);
  font-weight: 400;
}

.deck-orchestration-layer {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--deck-orchestration-layer-border);
  border-radius: 16px;
  background: var(--deck-orchestration-layer-bg);
  box-shadow: 0 0 0 1px ${cssRgba(darkLightBlue, 0.06)}, 0 14px 50px -16px ${cssRgba(darkAccent, 0.6)};
  padding: clamp(18px, 2.6vh, 26px) clamp(20px, 2.6vw, 30px);
}

.deck-orchestration-layer::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -45%;
  width: 40%;
  background: linear-gradient(90deg, transparent, var(--deck-orchestration-sweep), transparent);
  pointer-events: none;
  animation: deckbuilder-sweep 4.5s cubic-bezier(.22, .61, .36, 1) infinite;
}

.deck-orchestration-layer > * {
  position: relative;
  z-index: 1;
}

.deck-orchestration-layer-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.deck-orchestration-layer-brand {
  display: inline-flex;
  align-items: center;
  min-height: 1.12em;
  color: var(--deck-orchestration-heading);
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 500;
  line-height: 1;
}

.deck-orchestration-layer-brand .deck-inline-brand {
  height: 1.2em;
  margin: 0;
}

.deck-orchestration-layer-brand .deck-inline-brand img {
  height: 1.1em;
  max-width: 8.5em;
}

.deck-orchestration-layer-tag {
  color: var(--deck-orchestration-accent);
  font-size: clamp(11px, 1.1vw, 14px);
  font-weight: 500;
  letter-spacing: .04em;
}

.deck-orchestration-caps {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(8px, 1vw, 16px);
  margin-top: 14px;
}

.deck-orchestration-cap {
  display: flex;
  align-items: center;
  gap: .5em;
  color: var(--deck-orchestration-heading);
  font-size: clamp(11px, 1.15vw, 15px);
  font-weight: 400;
}

.deck-orchestration-cap b {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--deck-orchestration-accent);
  box-shadow: 0 0 10px ${darkLightBlue};
}

.deck-orchestration-caption {
  max-width: 60ch;
  margin: 0;
  color: var(--deck-orchestration-body);
  font-size: clamp(14px, 1.5vw, 18px);
  font-weight: 300;
  line-height: 1.45;
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

section.light .deck-chart-radar {
  --deck-radar-grid: ${lightBorder};
  --deck-radar-text: ${lightHeading};
  --deck-radar-muted: ${lightMuted};
  --deck-radar-fill: rgba(15, 130, 245, .18);
  --deck-radar-stroke: ${cssColor(brand, 'blue', '0F82F5')};
  --deck-radar-point: ${cssColor(brand, 'lightBlue', '59D6FD')};
}

section.dark .deck-chart-radar {
  --deck-radar-grid: ${darkBorder};
  --deck-radar-text: ${darkHeading};
  --deck-radar-muted: ${darkMuted};
  --deck-radar-fill: rgba(89, 214, 253, .20);
  --deck-radar-stroke: ${cssColor(brand, 'lightBlue', '59D6FD')};
  --deck-radar-point: ${cssColor(brand, 'blue', '0F82F5')};
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
  --deckbuilder-title-bg-image: url("${escapeCssUrl(resource)}");
  background-image: url("${escapeCssUrl(resource)}");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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

function inlineDarkImageHeadingColors(html, slides = [], brand = {}) {
  const headingLayouts = new Set(['cover', 'divider', 'close'])
  if (!slides.some((slide) => headingLayouts.has(slide.layout))) return html

  const root = cheerio.load(`<root>${html}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: false,
  })
  root('section').each((index, section) => {
    const slide = slides[index]
    if (!headingLayouts.has(slide?.layout)) return

    const heading = root(section).find('h1, marp-h1').first()
    if (!heading.length) return
    const titleColor = brand.layouts?.[slide.layout]?.title?.color || 'blue'
    const headingColor = cssColor(brand, titleColor, '0F82F5')
    mergeInlineStyle(heading, 'color', headingColor)
  })

  return root('root').html() || html
}

function prepareHtmlDeckShell(html) {
  const root = cheerio.load(`<root>${html}</root>`, {
    decodeEntities: false,
    lowerCaseAttributeNames: false,
  })

  root('svg[data-marpit-svg]').each((index, svg) => {
    const slide = root(svg)
    slide.addClass('deckbuilder-slide')
    slide.attr('data-deckbuilder-slide', String(index))
    slide.attr('aria-hidden', index === 0 ? 'false' : 'true')
    if (index === 0) slide.addClass('active bespoke-marp-active')
  })

  return root('root').html() || html
}

function mergeInlineStyle(element, property, value) {
  const normalized = property.toLowerCase()
  const declarations = String(element.attr('style') || '')
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .filter((declaration) => declaration.split(':', 1)[0]?.trim().toLowerCase() !== normalized)
  declarations.push(`${property}: ${value}`)
  element.attr('style', declarations.join('; '))
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
    /(<div\b[^>]*\bclass=["'][^"']*\b(?:deck-logo-tile|deck-proof-logo)\b[^"']*["'][^>]*>\s*<img\b[^>]*\bsrc=)(["'])([^"']+)\2/gi,
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
    case 'takeaway':
      return 'deck-takeaway-slide'
    default:
      return ''
  }
}

function htmlClassNamesForSlide(slide) {
  const layoutClass = htmlClassForLayout(slide.layout)
  return [
    layoutClass || slide.surface || '',
    slide.layout === 'takeaway' ? slide.surface || '' : '',
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
  deckbuilderHtmlCss = '',
  comments = [],
  deckbuilderJs = '',
  slideCount = 0,
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
  <style data-deckbuilder-html>${deckbuilderHtmlCss}</style>
</head>
<body>
${deckbuilderChrome(slideCount)}
${html}
${renderNotes(comments)}
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

function deckbuilderChrome(slideCount = 0) {
  const total = Math.max(0, Number(slideCount) || 0)
  const navMode = total > 24 ? 'scroll' : 'dots'
  const dots = Array.from({ length: total }, (_, index) =>
    `<button type="button" data-deckbuilder-jump="${index}" aria-label="Go to slide ${index + 1}" title="Slide ${index + 1}"></button>`,
  ).join('')
  return `<div class="deckbuilder-progress" aria-hidden="true"><span data-deckbuilder-progress-bar></span></div>
<div class="deckbuilder-topbar" aria-hidden="true">
  <div></div>
  <div class="deckbuilder-counter"><b data-deckbuilder-current>01</b> / ${pad2(total)}</div>
</div>
<nav class="deckbuilder-nav" data-deckbuilder-slide-count="${total}" data-deckbuilder-nav-mode="${navMode}" aria-label="Slide navigation">
  <button type="button" class="deckbuilder-prev" data-deckbuilder-prev aria-label="Previous slide">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6"></path></svg>
  </button>
  <span class="deckbuilder-dots">${dots}</span>
  <button type="button" class="deckbuilder-next" data-deckbuilder-next aria-label="Next slide">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>
  </button>
</nav>
<div class="deckbuilder-hint" aria-hidden="true">Swipe or tap</div>`
}

function pad2(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, '0')
}

function htmlDeckShellCss(brand = {}) {
  const background = cssColor(brand, 'backgroundDark', cssColor(brand, 'dark', '060D18'))
  const surface = cssColor(brand, 'cardDark', '0D1D36')
  const blue = cssColor(brand, 'blue', '0F82F5')
  const cyan = cssColor(brand, 'lightBlue', '59D6FD')
  const border = cssColor(brand, 'border', '1E3A5F')
  const white = cssColor(brand, 'white', 'FFFFFF')
  const body = readableDarkCssColor(brand, 'body', 'C8D8F0')
  const muted = readableDarkCssColor(brand, 'muted', '8B9AB5')

  return `@media screen {
  :root {
    --deckbuilder-bg: ${background};
    --deckbuilder-surface-dark: linear-gradient(180deg, #0b1d37 0%, #081428 48%, ${background} 100%);
    --deckbuilder-surface: ${surface};
    --deckbuilder-blue: ${blue};
    --deckbuilder-cyan: ${cyan};
    --deckbuilder-border: ${border};
    --deckbuilder-white: ${white};
    --deckbuilder-body: ${body};
    --deckbuilder-muted: ${muted};
    --deckbuilder-accent: linear-gradient(90deg, ${blue} 0%, ${cyan} 100%);
    --deckbuilder-ease: cubic-bezier(.22, .61, .36, 1);
  }

  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: var(--deckbuilder-bg);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior: none;
    user-select: none;
  }

  body {
    position: fixed;
    inset: 0;
    color: var(--deckbuilder-white);
    touch-action: none;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: var(--deckbuilder-surface-dark);
  }

  .deckbuilder-backdrop {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    background-image: none;
  }

  [id=":$p"] {
    position: fixed;
    inset: 0;
    z-index: 1;
  }

  [data-deckbuilder-slide] {
    position: absolute !important;
    inset: 0 !important;
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: 1;
    transform: scale(1.012);
    transition: opacity .6s var(--deckbuilder-ease), transform .6s var(--deckbuilder-ease), visibility 0s linear .6s;
  }

  [data-deckbuilder-slide].active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    z-index: 2;
    transform: scale(1);
    transition: opacity .7s var(--deckbuilder-ease), transform .7s var(--deckbuilder-ease), visibility 0s;
  }

  [data-deckbuilder-slide]:not(.active) * {
    view-transition-name: none !important;
  }

  @keyframes deckbuilder-reveal {
    from { opacity: 0; transform: translateY(22px); }
    to { opacity: 1; transform: translateY(0); }
  }

  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame) {
    animation: deckbuilder-reveal .7s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :nth-child(1) { animation-delay: .1s; }
  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :nth-child(2) { animation-delay: .2s; }
  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :nth-child(3) { animation-delay: .32s; }
  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :nth-child(4) { animation-delay: .44s; }
  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :nth-child(5) { animation-delay: .56s; }
  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :nth-child(6) { animation-delay: .68s; }

  @keyframes deckbuilder-sweep {
    0% { left: -48%; }
    54% { left: 122%; }
    100% { left: 122%; }
  }

  section.dark {
    background: var(--deckbuilder-surface-dark) !important;
  }

  /* Image-backed slides are transparent so the full-viewport .deckbuilder-backdrop
     layer (painted by JS from this slide's --deckbuilder-title-bg-image) shows through.
     The backdrop covers the whole window at screen aspect ratio; the slide content
     itself stays contained (letterboxed) so nothing is cropped or stretched. */
  section.cover,
  section.deck-divider-slide,
  section.deck-close-slide,
  section:has(.deck-divider),
  section:has(.deck-close) {
    background: transparent !important;
    color: var(--deckbuilder-white) !important;
  }

  section.dark::before,
  section.cover::before,
  section.deck-divider-slide::before,
  section.deck-close-slide::before,
  section:has(.deck-divider)::before,
  section:has(.deck-close)::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: .5;
    background-image: radial-gradient(rgba(255, 255, 255, .045) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: radial-gradient(120% 120% at 50% 40%, #000 30%, transparent 80%);
    -webkit-mask-image: radial-gradient(120% 120% at 50% 40%, #000 30%, transparent 80%);
  }

  section.light {
    background:
      radial-gradient(120% 90% at 12% 8%, rgba(15, 130, 245, .07) 0%, transparent 52%),
      radial-gradient(90% 80% at 100% 100%, rgba(89, 214, 253, .08) 0%, transparent 48%),
      #ffffff !important;
  }

  section.cover,
  section.deck-divider-slide,
  section.deck-close-slide,
  section:has(.deck-divider),
  section:has(.deck-close),
  section:has(.deck-takeaway-hero),
  section:has(.deck-exec-title) {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    box-sizing: border-box !important;
    padding: 92px 72px 78px !important;
  }

  section.cover > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame),
  section .deck-divider,
  section .deck-close,
  section .deck-takeaway-hero,
  section .deck-exec-title {
    position: relative !important;
    inset: auto !important;
    z-index: 1;
    display: block !important;
    align-content: normal !important;
    height: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    width: min(760px, calc(100% - 360px));
    max-width: 760px;
    margin-left: clamp(250px, 26%, 340px) !important;
    margin-right: auto !important;
  }

  section.cover h1,
  section .deck-divider h1,
  section .deck-close h1,
  section .deck-takeaway-hero h1,
  section .deck-exec-title h1 {
    margin: 0 !important;
    max-width: none !important;
    color: var(--deckbuilder-white) !important;
    font-family: "Poppins", "Aptos", "Segoe UI", sans-serif !important;
    font-size: 60px !important;
    font-weight: 300 !important;
    line-height: 1.04 !important;
    letter-spacing: 0 !important;
    text-wrap: balance;
  }

  section.cover h1 b,
  section.cover h1 strong,
  section .deck-divider h1 b,
  section .deck-divider h1 strong,
  section .deck-close h1 b,
  section .deck-close h1 strong,
  section .deck-takeaway-hero h1 b,
  section .deck-takeaway-hero h1 strong,
  section .deck-exec-title h1 b,
  section .deck-exec-title h1 strong {
    background: var(--deckbuilder-accent);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    font-weight: 700 !important;
  }

  section.cover p,
  section .deck-divider p,
  section .deck-close p,
  section .deck-takeaway-hero p,
  section .deck-exec-title p {
    color: var(--deckbuilder-body) !important;
    font-family: "Poppins", "Aptos", "Segoe UI", sans-serif !important;
    font-size: 18px !important;
    font-weight: 300 !important;
    line-height: 1.5 !important;
    max-width: 44ch;
  }

  section.cover p:not(.eyebrow),
  section .deck-divider p:not(.eyebrow),
  section .deck-close p:not(.eyebrow),
  section .deck-takeaway-hero p:not(.eyebrow),
  section .deck-exec-title p:not(.deck-exec-eyebrow) {
    margin-top: 24px !important;
  }

  section.cover .eyebrow,
  section .deck-divider .eyebrow,
  section .deck-takeaway-hero .eyebrow,
  section .deck-exec-title .deck-exec-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: .7em;
    margin: 0 0 24px !important;
    color: var(--deckbuilder-cyan) !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    letter-spacing: .22em !important;
    line-height: 1.2 !important;
    text-transform: uppercase;
  }

  section.cover .eyebrow::before,
  section .deck-divider .eyebrow::before,
  section .deck-takeaway-hero .eyebrow::before,
  section .deck-exec-title .deck-exec-eyebrow::before {
    content: "";
    width: 30px;
    height: 2px;
    border-radius: 2px;
    background: var(--deckbuilder-accent);
    box-shadow: 0 0 16px ${cssRgba(cyan, 0.36)};
  }

  section .deck-close p strong {
    color: var(--deckbuilder-white) !important;
    font-weight: 500 !important;
  }

  section .deck-close p span {
    color: var(--deckbuilder-muted) !important;
    font-size: 15px !important;
    letter-spacing: .04em;
  }

  section.dark h1,
  section.dark h2 {
    color: var(--deckbuilder-white) !important;
    font-family: "Poppins", "Aptos", "Segoe UI", sans-serif !important;
    font-weight: 300 !important;
    line-height: 1.06 !important;
    letter-spacing: 0 !important;
    text-wrap: balance;
  }

  section.dark h1 b,
  section.dark h2 b,
  section.dark h1 strong,
  section.dark h2 strong {
    background: var(--deckbuilder-accent);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }

  section.dark .lead,
  section.dark p.lead,
  section.dark > p,
  section.dark > ul,
  section.dark > ol {
    color: var(--deckbuilder-body) !important;
  }

  section.dark .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: .75em;
    color: var(--deckbuilder-cyan);
    font-weight: 600;
    letter-spacing: .18em;
    text-transform: uppercase;
  }

  section.dark .eyebrow::before {
    content: "";
    width: 3.5em;
    height: 1px;
    border-radius: 999px;
    background: var(--deckbuilder-accent);
    box-shadow: 0 0 16px ${cssRgba(cyan, 0.36)};
  }

  .deck-inline-brand {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 1em;
    margin: 0 .08em;
    vertical-align: -.1em;
  }

  .deck-inline-brand img {
    display: block;
    width: auto;
    max-width: 5.6em;
    height: .72em;
    object-fit: contain;
  }

  section.dark .stat-card {
    min-height: 0 !important;
    padding: 18px 0 0 !important;
    border-right: 0 !important;
    border-bottom: 0 !important;
    border-left: 0 !important;
    border-top: 2px solid transparent !important;
    border-image-source: var(--deckbuilder-accent) !important;
    border-image-slice: 1 !important;
    text-align: left !important;
  }

  section.dark .stat-grid .stat-card {
    border-right-width: 0 !important;
    border-right-color: transparent !important;
  }

  section.dark .stat-card strong {
    background: var(--deckbuilder-accent);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    font-size: 58px !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
  }

  section.dark .stat-card :is(span, marp-span) {
    max-width: 24ch !important;
    margin: 12px 0 0 !important;
    color: var(--deckbuilder-body) !important;
    font-size: 16px !important;
    font-weight: 300 !important;
    line-height: 1.35 !important;
  }

  section.light .stat-card :is(span, marp-span) {
    color: #3b4a5f !important;
  }

  .deck-comparison {
    border-collapse: separate !important;
    border-spacing: 0 !important;
    overflow: hidden !important;
  }

  section.dark .deck-comparison :is(th, td) {
    border-color: ${cssRgba(cyan, 0.16)} !important;
  }

  /* Marp core's default theme paints a light background on every table row
     (var(--bgColor-default) / --bgColor-muted). The comparison cells only set a
     translucent background, so that light row colour bleeds through and washes the
     cells out. Reset the row background; the cells own their own appearance. */
  .deck-comparison tr {
    background: transparent !important;
  }

  section.dark .deck-comparison th {
    background: linear-gradient(180deg, ${cssRgba(blue, 0.18)}, ${cssRgba(cyan, 0.07)}) !important;
    color: var(--deckbuilder-white) !important;
    font-weight: 500 !important;
  }

  section.dark .deck-comparison td {
    background: ${cssRgba(surface, 0.28)} !important;
    color: var(--deckbuilder-body) !important;
  }

  section.dark .deck-comparison tbody tr:nth-child(even) td {
    background: ${cssRgba(surface, 0.42)} !important;
  }

  section.dark .deck-next-steps li {
    color: var(--deckbuilder-body) !important;
  }

  section.dark .deck-next-steps li strong {
    color: var(--deckbuilder-white) !important;
    font-weight: 500 !important;
  }

  section.dark .deck-next-steps li span {
    color: var(--deckbuilder-body) !important;
    font-weight: 300 !important;
  }

  section.dark .deck-logo-tile,
  section.dark .deck-proof-logo {
    background: ${cssRgba(surface, 0.58)} !important;
    border-color: ${cssRgba(cyan, 0.28)} !important;
    border-radius: 16px !important;
    color: var(--deckbuilder-white) !important;
    box-shadow: 0 18px 50px -28px rgba(0, 0, 0, .55) !important;
  }

  section.dark .deck-logo-tile span,
  section.dark .deck-proof-logo span {
    color: var(--deckbuilder-white) !important;
  }

  section.dark .deck-logo-tile img,
  section.dark .deck-proof-logo img {
    opacity: .95;
  }

  section.dark .deck-chart-row strong {
    color: var(--deckbuilder-white) !important;
  }

  section.light .deck-chart-row strong {
    color: #090909 !important;
  }

  section.dark .card-grid article,
  section.dark .deck-chart,
  section.dark .deck-comparison,
  section.dark .deck-funnel,
  section.dark .deck-heatmap,
  section.dark .deck-impact-radar,
  section.dark .deck-treemap,
  section.dark .deck-lane,
  section.dark .deck-lane-steps article,
  section.dark .deck-journey-step,
  section.dark .deck-journey-path-summary,
  section.dark .deck-proof,
  section.dark .deck-logo-tile,
  section.dark .deck-orchestration-node,
  section.dark .deck-next-steps li,
  section.dark .deck-signal-summary,
  section.dark .deck-signal-chart,
  section.dark .deck-signal-board-panel,
  section.dark .deck-signal-board-chart,
  section.dark .deck-metric-trend-summary,
  section.dark .deck-metric-trend-chart,
  section.dark .deck-exec-row,
  section.dark .deck-exec-card,
  section.dark .deck-exec-side,
  section.dark .deck-exec-timeline-item,
  section.dark .deck-exec-panel,
  section.dark .deck-exec-metric {
    background: ${cssRgba(surface, 0.58)} !important;
    border-color: ${cssRgba(cyan, 0.28)} !important;
  }

  section.light .card-grid article,
  section.light .deck-chart,
  section.light .deck-comparison,
  section.light .deck-funnel,
  section.light .deck-heatmap,
  section.light .deck-impact-radar,
  section.light .deck-treemap,
  section.light .deck-lane,
  section.light .deck-lane-steps article,
  section.light .deck-journey-step,
  section.light .deck-journey-path-summary,
  section.light .deck-proof,
  section.light .deck-logo-tile,
  section.light .deck-orchestration-node,
  section.light .deck-next-steps li,
  section.light .deck-signal-summary,
  section.light .deck-signal-chart,
  section.light .deck-signal-board-panel,
  section.light .deck-signal-board-chart,
  section.light .deck-metric-trend-summary,
  section.light .deck-metric-trend-chart,
  section.light .deck-exec-row,
  section.light .deck-exec-card,
  section.light .deck-exec-side,
  section.light .deck-exec-timeline-item,
  section.light .deck-exec-panel,
  section.light .deck-exec-metric {
    background: rgba(255, 255, 255, .72) !important;
    border-color: rgba(15, 130, 245, .16) !important;
  }

  .card-grid article,
  .deck-chart,
  .deck-comparison,
  .deck-funnel,
  .deck-heatmap,
  .deck-impact-radar,
  .deck-treemap,
  .deck-lane,
  .deck-lane-steps article,
  .deck-journey-step,
  .deck-journey-path-summary,
  .deck-proof,
  .deck-logo-tile,
  .deck-orchestration-node,
  .deck-orchestration-layer,
  .deck-next-steps li,
  .deck-signal-summary,
  .deck-signal-chart,
  .deck-signal-board-panel,
  .deck-signal-board-chart,
  .deck-metric-trend-summary,
  .deck-metric-trend-chart,
  .deck-exec-row,
  .deck-exec-card,
  .deck-exec-side,
  .deck-exec-timeline-item,
  .deck-exec-panel,
  .deck-exec-metric {
    border-style: solid !important;
    border-width: 1px !important;
    border-top-width: 1px !important;
    border-radius: 16px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 18px 50px -28px rgba(0, 0, 0, .55);
  }

  section.dark .deck-logo-wall .deck-logo-tile,
  section.dark .deck-proof .deck-proof-logo {
    background: ${cssRgba(surface, 0.58)} !important;
    border-color: ${cssRgba(cyan, 0.28)} !important;
    border-radius: 16px !important;
    color: var(--deckbuilder-white) !important;
    box-shadow: 0 18px 50px -28px rgba(0, 0, 0, .55) !important;
  }

  section.dark .deck-logo-wall .deck-logo-tile span,
  section.dark .deck-proof .deck-proof-logo span {
    color: var(--deckbuilder-white) !important;
  }

  section.dark .deck-logo-wall .deck-logo-tile img,
  section.dark .deck-proof .deck-proof-logo img {
    opacity: .95;
  }

  .deck-signal-board-panel,
  .deck-orchestration-layer,
  .deck-signal-summary,
  .deck-metric-trend-summary,
  .deck-journey-path-summary,
  .deck-exec-panel,
  .deck-proof {
    position: relative;
    overflow: hidden;
  }

  .deck-signal-board-panel > *,
  .deck-orchestration-layer > *,
  .deck-signal-summary > *,
  .deck-metric-trend-summary > *,
  .deck-journey-path-summary > *,
  .deck-exec-panel > *,
  .deck-proof > * {
    position: relative;
    z-index: 1;
  }

  section.dark .deck-signal-board-panel::after,
  section.dark .deck-orchestration-layer::after,
  section.dark .deck-signal-summary::after,
  section.dark .deck-metric-trend-summary::after,
  section.dark .deck-journey-path-summary::after,
  section.dark .deck-exec-panel::after,
  section.dark .deck-proof::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -48%;
    z-index: 0;
    width: 42%;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, ${cssRgba(white, 0.14)}, transparent);
    animation: deckbuilder-sweep 4.8s var(--deckbuilder-ease) infinite;
  }

  section.light .deck-signal-board-panel::after,
  section.light .deck-orchestration-layer::after,
  section.light .deck-signal-summary::after,
  section.light .deck-metric-trend-summary::after,
  section.light .deck-journey-path-summary::after,
  section.light .deck-exec-panel::after,
  section.light .deck-proof::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -48%;
    z-index: 0;
    width: 42%;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(15, 130, 245, .1), transparent);
    animation: deckbuilder-sweep 5.6s var(--deckbuilder-ease) infinite;
  }

  .deck-signal-board-tag,
  .deck-signal-tag,
  .deck-journey-path-hotspot,
  .deck-lane-label {
    border-radius: 999px;
    box-shadow: 0 0 0 1px ${cssRgba(cyan, 0.16)}, 0 12px 34px -24px ${cssRgba(cyan, 0.7)};
  }

  .deck-chart-track,
  .deck-chart-stacked-track {
    border-radius: 999px;
    overflow: hidden;
  }

  .deck-chart-fill,
  .deck-chart-stacked-fill {
    background: var(--deckbuilder-accent) !important;
  }

  .deck-chart-js-frame {
    display: none;
    position: relative;
    width: 100%;
    min-height: 245px;
    height: min(38vh, 340px);
  }

  .deck-chart-js[data-deck-chart-enhanced="true"] .deck-chart-js-frame {
    display: block;
  }

  .deck-chart-js[data-deck-chart-enhanced="true"] .deck-chart-js-fallback {
    display: none;
  }

  .deck-chart-js-canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    opacity: 1;
    transition: opacity .18s var(--deckbuilder-ease);
  }

  .deck-chart-js[data-deck-chart-animating="scheduled"] .deck-chart-js-canvas {
    opacity: 0;
    visibility: hidden;
  }

  .deck-chart-js[data-deck-chart-animating="scheduled"] .deck-chart-js-frame,
  .deck-chart-js[data-deck-chart-animating="scheduled"] .deck-chart-js-fallback {
    visibility: hidden;
  }

  @keyframes deckbuilder-chart-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes deckbuilder-chart-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes deckbuilder-chart-draw-stroke {
    from { stroke-dashoffset: var(--deck-chart-dash, 260); }
    to { stroke-dashoffset: 0; }
  }

  @keyframes deckbuilder-boxplot-grow {
    from { opacity: 0; transform: scaleY(.08); }
    to { opacity: 1; transform: scaleY(1); }
  }

  @keyframes deckbuilder-chart-scale-x {
    from { opacity: .35; transform: scaleX(0); }
    to { opacity: 1; transform: scaleX(1); }
  }

  @keyframes deckbuilder-chart-pop {
    from { opacity: 0; transform: scale(.82); }
    to { opacity: 1; transform: scale(1); }
  }

  [data-deckbuilder-slide]:not(.active) .deck-chart-boxplot-svg :is(.deck-boxplot-whisker, .deck-boxplot-box, .deck-boxplot-median, .deck-boxplot-grid, .deck-boxplot-axis, .deck-boxplot-label, .deck-boxplot-tick, .deck-boxplot-axis-label) {
    opacity: 0;
  }

  [data-deckbuilder-slide].active .deck-chart-boxplot-svg :is(.deck-boxplot-grid, .deck-boxplot-axis) {
    animation: deckbuilder-chart-fade-up .42s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active .deck-chart-boxplot-svg .deck-boxplot-whisker {
    --deck-chart-dash: 240;
    stroke-dasharray: var(--deck-chart-dash);
    stroke-dashoffset: var(--deck-chart-dash);
    animation: deckbuilder-chart-draw-stroke .72s var(--deckbuilder-ease) .18s both;
  }

  [data-deckbuilder-slide].active .deck-chart-boxplot-svg .deck-boxplot-box {
    transform-box: fill-box;
    transform-origin: center bottom;
    animation: deckbuilder-boxplot-grow .7s var(--deckbuilder-ease) .22s both;
  }

  [data-deckbuilder-slide].active .deck-chart-boxplot-svg .deck-boxplot-median {
    --deck-chart-dash: 110;
    stroke-dasharray: var(--deck-chart-dash);
    stroke-dashoffset: var(--deck-chart-dash);
    animation: deckbuilder-chart-draw-stroke .44s var(--deckbuilder-ease) .58s both;
  }

  [data-deckbuilder-slide].active .deck-chart-boxplot-svg :is(.deck-boxplot-label, .deck-boxplot-tick, .deck-boxplot-axis-label) {
    animation: deckbuilder-chart-fade-up .52s var(--deckbuilder-ease) .5s both;
  }

  [data-deckbuilder-slide]:not(.active) .deck-chart-sankey-svg :is(.deck-sankey-link, .deck-sankey-node, .deck-sankey-caption) {
    opacity: 0;
  }

  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-link {
    --deck-chart-dash: 900;
    stroke-dasharray: var(--deck-chart-dash);
    stroke-dashoffset: var(--deck-chart-dash);
    animation: deckbuilder-chart-draw-stroke .92s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-link:nth-child(2) { animation-delay: .08s; }
  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-link:nth-child(3) { animation-delay: .16s; }
  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-link:nth-child(4) { animation-delay: .24s; }
  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-link:nth-child(5) { animation-delay: .32s; }
  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-link:nth-child(6) { animation-delay: .4s; }

  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-node {
    animation: deckbuilder-chart-fade-in .5s var(--deckbuilder-ease) .46s both;
  }

  [data-deckbuilder-slide].active .deck-chart-sankey-svg .deck-sankey-caption {
    animation: deckbuilder-chart-fade-in .45s var(--deckbuilder-ease) .72s both;
  }

  [data-deckbuilder-slide]:not(.active) .deck-impact-radar-svg :is(.deck-impact-radar-bar-fill, .deck-impact-radar-shape-animated) {
    opacity: 0;
  }

  [data-deckbuilder-slide].active .deck-impact-radar-svg .deck-impact-radar-bar-fill {
    animation: deckbuilder-chart-scale-x .82s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active .deck-impact-radar-svg .deck-impact-radar-shape-animated {
    animation: deckbuilder-chart-pop .72s var(--deckbuilder-ease) .36s both;
  }

  [data-deckbuilder-slide]:not(.active) :is(.deck-funnel-stage, .deck-heatmap-cell, .deck-treemap-cell, .deck-metric-trend-line, .deck-metric-trend-dot, .deck-metric-trend-final, .deck-signal-fill, .deck-chart-fill, .deck-chart-stacked-fill) {
    opacity: 0;
  }

  [data-deckbuilder-slide].active .deck-funnel-stage {
    transform-box: fill-box;
    transform-origin: center;
    animation: deckbuilder-chart-pop .56s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active .deck-funnel-stage:nth-child(2) { animation-delay: .08s; }
  [data-deckbuilder-slide].active .deck-funnel-stage:nth-child(3) { animation-delay: .16s; }
  [data-deckbuilder-slide].active .deck-funnel-stage:nth-child(4) { animation-delay: .24s; }
  [data-deckbuilder-slide].active .deck-funnel-stage:nth-child(5) { animation-delay: .32s; }
  [data-deckbuilder-slide].active .deck-funnel-stage:nth-child(6) { animation-delay: .4s; }

  [data-deckbuilder-slide].active .deck-heatmap-cell {
    transform-origin: center;
    animation: deckbuilder-chart-pop .42s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active .deck-heatmap-cell:nth-of-type(3n + 1) { animation-delay: .06s; }
  [data-deckbuilder-slide].active .deck-heatmap-cell:nth-of-type(3n + 2) { animation-delay: .12s; }
  [data-deckbuilder-slide].active .deck-heatmap-cell:nth-of-type(3n + 3) { animation-delay: .18s; }

  [data-deckbuilder-slide].active .deck-treemap-cell {
    transform-box: fill-box;
    transform-origin: center;
    animation: deckbuilder-chart-pop .58s var(--deckbuilder-ease) both;
  }

  [data-deckbuilder-slide].active .deck-treemap-cell:nth-child(2) { animation-delay: .08s; }
  [data-deckbuilder-slide].active .deck-treemap-cell:nth-child(3) { animation-delay: .16s; }
  [data-deckbuilder-slide].active .deck-treemap-cell:nth-child(4) { animation-delay: .24s; }
  [data-deckbuilder-slide].active .deck-treemap-cell:nth-child(5) { animation-delay: .32s; }

  [data-deckbuilder-slide].active .deck-metric-trend-line {
    --deck-chart-dash: 700;
    stroke-dasharray: var(--deck-chart-dash);
    stroke-dashoffset: var(--deck-chart-dash);
    animation: deckbuilder-chart-draw-stroke .82s var(--deckbuilder-ease) .12s both;
  }

  [data-deckbuilder-slide].active :is(.deck-metric-trend-dot, .deck-metric-trend-final) {
    transform-box: fill-box;
    transform-origin: center;
    animation: deckbuilder-chart-pop .46s var(--deckbuilder-ease) .68s both;
  }

  [data-deckbuilder-slide].active :is(.deck-signal-fill, .deck-chart-fill, .deck-chart-stacked-fill) {
    transform-origin: left center;
    animation: deckbuilder-chart-scale-x .72s var(--deckbuilder-ease) .16s both;
  }

  section.dark .deck-impact-radar {
    --deck-impact-radar-surface: transparent !important;
    --deck-impact-radar-panel: ${cssRgba(surface, 0.32)} !important;
    --deck-impact-radar-border: ${cssRgba(cyan, 0.24)} !important;
    --deck-impact-radar-track: ${cssRgba(border, 0.52)} !important;
    --deck-impact-radar-radarGrid: ${cssRgba(cyan, 0.24)} !important;
    --deck-impact-radar-radarFill: ${cssRgba(cyan, 0.2)} !important;
    --deck-impact-radar-radarStroke: var(--deckbuilder-cyan) !important;
  }

  section.light .deck-impact-radar {
    --deck-impact-radar-surface: transparent !important;
    --deck-impact-radar-panel: rgba(255, 255, 255, .5) !important;
    --deck-impact-radar-border: rgba(15, 130, 245, .16) !important;
    --deck-impact-radar-track: rgba(15, 130, 245, .1) !important;
    --deck-impact-radar-radarGrid: rgba(15, 130, 245, .18) !important;
    --deck-impact-radar-radarFill: rgba(15, 130, 245, .16) !important;
    --deck-impact-radar-radarStroke: var(--deckbuilder-blue) !important;
  }

  .deck-impact-radar-svg {
    position: relative;
    z-index: 1;
  }

  .deckbuilder-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: clamp(20px, 3vw, 40px) clamp(28px, 5vw, 72px);
    pointer-events: none;
  }

  .deckbuilder-counter {
    color: var(--deckbuilder-muted);
    font-family: "Poppins", "Aptos", "Segoe UI", sans-serif;
    font-size: clamp(11px, 1.1vw, 14px);
    font-weight: 500;
    letter-spacing: .18em;
  }

  .deckbuilder-counter b {
    color: var(--deckbuilder-white);
    font-weight: 600;
  }

  .deckbuilder-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 7;
    height: 3px;
    pointer-events: none;
  }

  .deckbuilder-progress span {
    display: block;
    width: 0;
    height: 100%;
    background: var(--deckbuilder-accent);
    box-shadow: 0 0 12px ${cssRgba(cyan, 0.6)};
    transition: width .6s var(--deckbuilder-ease);
  }

  .deckbuilder-nav {
    position: fixed;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(14px, 2.4vh, 28px));
    z-index: 7;
    display: flex;
    align-items: center;
    gap: clamp(6px, .8vw, 10px);
    max-width: calc(100vw - 32px);
    padding: 5px 7px;
    border: 1px solid rgba(255, 255, 255, .08);
    border-radius: 999px;
    background: rgba(3, 10, 22, .34);
    box-shadow: 0 14px 38px -24px rgba(0, 0, 0, .7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transform: translateX(-50%);
  }

  .deckbuilder-nav button {
    appearance: none;
    border: 0;
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .deckbuilder-nav > button {
    width: clamp(34px, 3.5vw, 40px);
    height: clamp(34px, 3.5vw, 40px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--deckbuilder-white);
    border: 1px solid rgba(255, 255, 255, .14);
    border-radius: 50%;
    background: rgba(13, 29, 54, .6);
    box-shadow: 0 12px 32px -22px rgba(0, 0, 0, .7);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    transition: border-color .3s var(--deckbuilder-ease), background .3s var(--deckbuilder-ease), transform .3s var(--deckbuilder-ease), opacity .3s var(--deckbuilder-ease);
  }

  .deckbuilder-nav > button:hover {
    border-color: var(--deckbuilder-cyan);
    background: rgba(15, 130, 245, .18);
  }

  .deckbuilder-nav > button:active {
    transform: scale(.92);
  }

  .deckbuilder-nav > button:disabled {
    cursor: default;
    opacity: .3;
  }

  .deckbuilder-nav svg {
    width: 42%;
    height: 42%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .deckbuilder-dots {
    flex: 0 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .deckbuilder-dots button {
    position: relative;
    flex: 0 0 18px;
    width: 18px;
    height: 24px;
    padding: 0;
    border-radius: 999px;
    background: transparent;
    transition: flex-basis .35s var(--deckbuilder-ease);
  }

  .deckbuilder-dots button::before {
    content: "";
    display: block;
    width: 6px;
    height: 6px;
    margin: auto;
    border-radius: 50%;
    background: var(--deckbuilder-border);
    opacity: .86;
    transition: width .35s var(--deckbuilder-ease), border-radius .35s var(--deckbuilder-ease), background .35s var(--deckbuilder-ease), opacity .35s var(--deckbuilder-ease);
  }

  .deckbuilder-dots button[aria-current=true]::before {
    width: 20px;
    border-radius: 4px;
    background: var(--deckbuilder-accent);
    opacity: 1;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] {
    max-width: min(68vw, 520px);
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots {
    width: min(34vw, 300px);
    max-width: calc(100vw - 116px);
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-padding-inline: 24px;
    scrollbar-width: none;
    touch-action: pan-x;
    mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 12%, #000 88%, transparent 100%);
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots::-webkit-scrollbar {
    display: none;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots button {
    flex-basis: 11px;
    width: 11px;
    height: 24px;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots button::before {
    width: 4.5px;
    height: 4.5px;
    opacity: .54;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots button[aria-current=true] {
    flex-basis: 22px;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots button[aria-current=true]::before {
    width: 18px;
    height: 6px;
    opacity: 1;
  }

  .deckbuilder-hint {
    position: fixed;
    right: clamp(24px, 4vw, 48px);
    bottom: clamp(20px, 3.2vh, 38px);
    z-index: 6;
    color: var(--deckbuilder-muted);
    font-family: "Poppins", "Aptos", "Segoe UI", sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: .16em;
    text-transform: uppercase;
    pointer-events: none;
    opacity: .7;
    animation: deckbuilder-hint-fade 4s ease 3s forwards;
  }

  @keyframes deckbuilder-hint-fade {
    to { opacity: 0; }
  }

  .bespoke-marp-note {
    display: none;
  }
}

@media screen and (max-width: 760px), screen and (orientation: portrait) {
  .deckbuilder-topbar {
    padding: clamp(18px, 5vw, 30px) clamp(24px, 7vw, 48px);
  }

  .deckbuilder-dots {
    max-width: 46vw;
    overflow: hidden;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots {
    width: min(42vw, 280px);
    max-width: 42vw;
  }

  .deckbuilder-hint {
    display: none;
  }
}

@media screen and (pointer: coarse) {
  .deckbuilder-nav {
    gap: 6px;
    padding: 6px 8px;
  }

  .deckbuilder-nav > button {
    width: 46px;
    height: 46px;
  }

  .deckbuilder-dots button {
    width: 24px;
    height: 30px;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots button {
    flex-basis: 15px;
    width: 15px;
    height: 30px;
  }

  .deckbuilder-nav[data-deckbuilder-nav-mode="scroll"] .deckbuilder-dots button[aria-current=true] {
    flex-basis: 26px;
  }
}

@media screen and (prefers-reduced-motion: reduce) {
  body::after,
  .deck-signal-board-panel::after,
  .deck-orchestration-layer::after,
  .deck-signal-summary::after,
  .deck-metric-trend-summary::after,
  .deck-journey-path-summary::after,
  .deck-exec-panel::after,
  .deck-proof::after,
  .deckbuilder-hint {
    animation: none !important;
  }

  [data-deckbuilder-slide],
  [data-deckbuilder-slide].active {
    transition-duration: .001s !important;
  }

  [data-deckbuilder-slide].active > foreignObject > section:not(.deck-anim-controlled) > :not(.deck-brand-logo):not(.deck-company-logo):not(.deck-customer-logo-frame) {
    animation: none !important;
  }
}`
}

function htmlInlineLogoTerms(brand = {}) {
  const explicit =
    brand.html?.inlineLogoWords ||
    brand.inlineLogoWords ||
    brand.inlineBrandWords ||
    brand.logoWords ||
    brand.logoTextWords
  const candidates = explicit
    ? Array.isArray(explicit)
      ? explicit
      : String(explicit).split(',')
    : [brand.companyName, brand.brandName, brand.displayName, brand.name]
  const reserved = new Set(['brand', 'company', 'deck', 'deckbuilder'])
  const terms = candidates
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => explicit || !reserved.has(value.toLowerCase()))
  return [...new Set(terms)].sort((a, b) => b.length - a.length)
}

function htmlDeckEnhancementScript(brand = {}) {
  const brandTerms = JSON.stringify(htmlInlineLogoTerms(brand))
  return `(() => {
  const configuredBrandTerms = ${brandTerms}
  const targetSelector = [
    'section h1',
    'section h2',
    'section h3',
    'section .eyebrow',
    'section .deck-orchestration-layer-brand',
    'section .deck-signal-board-panel',
    'section .deck-signal-summary',
    'section .deck-metric-trend-summary',
    'section .deck-journey-path-summary',
    'section .deck-exec-panel',
    'section .deck-proof'
  ].join(', ')

  function logoFor(element) {
    const sectionLogo = element.closest('section')?.querySelector?.('.deck-company-logo')
    return sectionLogo || document.querySelector('.deck-company-logo')
  }

  function escapeRegExp(value) {
    return String(value).split('').map((char) => {
      if ('^$\\\\.*+?()[]{}|/'.includes(char) || char === '-') return '\\\\' + char
      return char
    }).join('')
  }

  function brandPatterns() {
    const terms = configuredBrandTerms
      .map((term) => String(term || '').trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
    if (!terms.length) return null
    const source = '\\\\b(?:' + terms.map(escapeRegExp).join('|') + ')\\\\b'
    return {
      split: new RegExp('(' + source + ')', 'gi'),
      test: new RegExp(source, 'i')
    }
  }

  function shouldSkipTextNode(node, patterns) {
    if (!patterns?.test.test(node.nodeValue || '')) return true
    const parent = node.parentElement
    if (!parent) return true
    if (parent.closest('.deck-inline-brand, script, style')) return true
    return parent.namespaceURI === 'http://www.w3.org/2000/svg'
  }

  function brandNode(logo, label) {
    const wrapper = document.createElement('span')
    const image = document.createElement('img')
    wrapper.className = 'deck-inline-brand'
    wrapper.setAttribute('aria-label', label)
    image.src = logo.currentSrc || logo.src
    image.alt = label
    image.decoding = 'async'
    wrapper.append(image)
    return wrapper
  }

  function enhanceInlineBrand() {
    document.querySelectorAll(targetSelector).forEach((element) => {
      if (element.dataset.deckInlineBrandEnhanced === 'true') return
      const logo = logoFor(element)
      if (!logo?.src && !logo?.currentSrc) return
      if (element.dataset.deckInlineLogo === 'company') {
        const label = element.textContent.trim() || logo.alt || 'Company'
        element.replaceChildren(brandNode(logo, label))
        element.dataset.deckInlineBrandEnhanced = 'true'
        return
      }
      const patterns = brandPatterns()
      if (!patterns) return
      const walker = document.createTreeWalker(element, 4, {
        acceptNode(node) {
          return shouldSkipTextNode(node, patterns) ? 2 : 1
        }
      })
      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)
      nodes.forEach((node) => {
        const parts = node.nodeValue.split(patterns.split)
        const fragment = document.createDocumentFragment()
        parts.forEach((part) => {
          if (patterns.test.test(part)) {
            fragment.append(brandNode(logo, part))
          } else if (part) {
            fragment.append(document.createTextNode(part))
          }
        })
        node.replaceWith(fragment)
      })
      element.dataset.deckInlineBrandEnhanced = 'true'
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceInlineBrand, { once: true })
  } else {
    enhanceInlineBrand()
  }
})();`
}

function htmlDeckNavigationScript() {
  return `(() => {
  const slides = Array.from(document.querySelectorAll('[data-deckbuilder-slide]'))
  const dots = Array.from(document.querySelectorAll('[data-deckbuilder-jump]'))
  const dotRail = document.querySelector('.deckbuilder-dots')
  const progress = document.querySelector('[data-deckbuilder-progress-bar]')
  const current = document.querySelector('[data-deckbuilder-current]')
  const prev = document.querySelector('[data-deckbuilder-prev]')
  const next = document.querySelector('[data-deckbuilder-next]')
  if (!slides.length || !prev || !next) return

  // Full-viewport backdrop: paints the active slide's brand background image
  // (--deckbuilder-title-bg-image) across the whole window at screen aspect ratio
  // (cover, no stretch). Slide content stays contained, so only the image scales.
  const backdrop = document.createElement('div')
  backdrop.className = 'deckbuilder-backdrop'
  document.body.insertBefore(backdrop, document.body.firstChild)
  function updateBackdrop() {
    const section = slides[index] && slides[index].querySelector('foreignObject > section')
    const img = section ? getComputedStyle(section).getPropertyValue('--deckbuilder-title-bg-image').trim() : ''
    backdrop.style.backgroundImage = (img && img !== 'none') ? img : 'none'
  }

  // ponytail: one tiny navigator beats owning a second presenter framework.
  let index = 0
  let wheelX = 0
  let wheelY = 0
  let wheelAt = 0
  let wheelLockedUntil = 0
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  const pad = (value) => String(value).padStart(2, '0')
  const nextKeys = new Set(['ArrowRight', 'ArrowDown', ' ', 'Spacebar', 'PageDown', 'Enter', 'n', 'N'])
  const prevKeys = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P'])

  function isInteractiveTarget(target) {
    return Boolean(target?.closest?.('button, a, input, select, textarea, video, audio, [contenteditable="true"], .deckbuilder-nav'))
  }

  function activeClickRevealSlide() {
    return slides[index]?.querySelector?.('foreignObject > section.deck-anim-controlled.deck-anim-trigger-on-click')
  }

  function hasPendingClickReveal() {
    const slide = activeClickRevealSlide()
    if (!slide) return false
    if (slide.classList.contains('deck-anim-sequence-stagger')) {
      return Boolean(slide.querySelector('.deck-anim-item:not(.deck-anim-item-played)'))
    }
    return !slide.classList.contains('deck-anim-played')
  }

  function centerActiveDot() {
    const activeDot = dots[index]
    if (!dotRail || !activeDot) return
    const schedule = window.requestAnimationFrame || ((callback) => setTimeout(callback, 0))
    schedule(() => {
      if (dotRail.scrollWidth <= dotRail.clientWidth) return
      const left = Math.max(0, activeDot.offsetLeft - dotRail.clientWidth / 2 + activeDot.offsetWidth / 2)
      try {
        dotRail.scrollTo({ left, behavior: reduceMotion?.matches ? 'auto' : 'smooth' })
      } catch {
        dotRail.scrollLeft = left
      }
    })
  }

  function prepareEnteringSlide(slide) {
    slide?.querySelectorAll?.('.deck-chart-js[data-deck-chart-type]').forEach((figure) => {
      figure.dataset.deckChartAnimating = 'scheduled'
    })
  }

  function go(nextIndex) {
    if (nextIndex < 0 || nextIndex >= slides.length || nextIndex === index) return
    slides[index].classList.remove('active', 'bespoke-marp-active')
    slides[index].setAttribute('aria-hidden', 'true')
    dots[index]?.removeAttribute('aria-current')
    index = nextIndex
    prepareEnteringSlide(slides[index])
    sync()
  }

  function sync() {
    prepareEnteringSlide(slides[index])
    slides[index].classList.add('active', 'bespoke-marp-active')
    slides[index].setAttribute('aria-hidden', 'false')
    dots[index]?.setAttribute('aria-current', 'true')
    if (current) current.textContent = pad(index + 1)
    if (progress) progress.style.width = slides.length > 1 ? (index / (slides.length - 1) * 100) + '%' : '0'
    prev.disabled = index === 0
    next.disabled = index === slides.length - 1
    centerActiveDot()
    updateBackdrop()
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      document.documentElement.requestFullscreen?.()
    }
  }

  function wheelDelta(value, mode) {
    if (mode === 1) return value * 16
    if (mode === 2) return value * window.innerHeight
    return value
  }

  function consumeWheel(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || isInteractiveTarget(event.target)) return
    const now = Date.now()
    const dx = wheelDelta(event.deltaX || 0, event.deltaMode)
    const dy = wheelDelta(event.deltaY || 0, event.deltaMode)
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    event.preventDefault()
    if (now < wheelLockedUntil) return
    if (now - wheelAt > 260) {
      wheelX = 0
      wheelY = 0
    }
    wheelX += dx
    wheelY += dy
    wheelAt = now
    const absX = Math.abs(wheelX)
    const absY = Math.abs(wheelY)
    if (absX > 78 && absX > absY * 1.1) {
      go(index + (wheelX > 0 ? 1 : -1))
      wheelLockedUntil = now + 620
      wheelX = 0
      wheelY = 0
    } else if (absY > 110 && absY > absX * 1.2) {
      go(index + (wheelY > 0 ? 1 : -1))
      wheelLockedUntil = now + 620
      wheelX = 0
      wheelY = 0
    }
  }

  prev.addEventListener('click', (event) => {
    event.stopPropagation()
    go(index - 1)
  })
  next.addEventListener('click', (event) => {
    event.stopPropagation()
    go(index + 1)
  })
  dots.forEach((dot) => {
    dot.addEventListener('click', (event) => {
      event.stopPropagation()
      go(Number(dot.dataset.deckbuilderJump))
    })
  })

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target
    if (target?.closest?.('input, select, textarea, [contenteditable="true"]')) return
    if ((event.key === ' ' || event.key === 'Enter') && target?.closest?.('button, a')) return
    if (event.key === 'f' || event.key === 'F') {
      toggleFullscreen()
      event.preventDefault()
    } else if (nextKeys.has(event.key)) {
      go(index + 1)
      event.preventDefault()
    } else if (prevKeys.has(event.key)) {
      go(index - 1)
      event.preventDefault()
    } else if (event.key === 'Home') {
      go(0)
      event.preventDefault()
    } else if (event.key === 'End') {
      go(slides.length - 1)
      event.preventDefault()
    }
  })
  document.addEventListener('wheel', consumeWheel, { passive: false })

  let start = null
  document.addEventListener('pointerdown', (event) => {
    if (isInteractiveTarget(event.target)) {
      start = null
      return
    }
    start = { x: event.clientX, y: event.clientY, time: Date.now(), target: event.target }
  }, { passive: true })
  document.addEventListener('pointercancel', () => {
    start = null
  }, { passive: true })
  document.addEventListener('pointerup', (event) => {
    if (!start || event.defaultPrevented) return
    if (isInteractiveTarget(event.target) || isInteractiveTarget(start.target)) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      go(index + (dx < 0 ? 1 : -1))
      return
    }
    if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8 && Date.now() - start.time < 350 && !hasPendingClickReveal()) {
      go(index + (event.clientX > window.innerWidth * .5 ? 1 : -1))
    }
  }, { passive: true })

  if (!window.PointerEvent) {
    let touchStart = null
    document.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        touchStart = null
        return
      }
      const touch = event.touches[0]
      touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now(), target: event.target }
    }, { passive: true })
    document.addEventListener('touchend', (event) => {
      if (!touchStart || event.changedTouches.length !== 1) return
      if (isInteractiveTarget(event.target) || isInteractiveTarget(touchStart.target)) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - touchStart.x
      const dy = touch.clientY - touchStart.y
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        go(index + (dx < 0 ? 1 : -1))
      } else if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8 && Date.now() - touchStart.time < 350 && !hasPendingClickReveal()) {
        go(index + (touch.clientX > window.innerWidth * .5 ? 1 : -1))
      }
      touchStart = null
    }, { passive: true })
    document.addEventListener('touchcancel', () => {
      touchStart = null
    }, { passive: true })
  }

  sync()
})();`
}

function htmlDeckChartScript() {
  return `(() => {
  const chartFigures = Array.from(document.querySelectorAll('.deck-chart-js[data-deck-chart-type]'))
  if (!chartFigures.length || !window.Chart) return

  const rootStyle = getComputedStyle(document.documentElement)
  const rootValue = (name, fallback) => rootStyle.getPropertyValue(name).trim() || fallback
  const formatNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
  const activationDelay = 520

  function readConfig(canvas) {
    try {
      return JSON.parse(canvas.getAttribute('data-deck-chart-config') || '{}')
    } catch {
      return null
    }
  }

  function themeFor(figure) {
    const section = figure.closest('section')
    const isLight = section?.classList.contains('light')
    return {
      primary: rootValue('--deckbuilder-blue', '#0f82f5'),
      secondary: rootValue('--deckbuilder-cyan', '#59d6fd'),
      text: isLight ? '#102034' : rootValue('--deckbuilder-body', '#c8d8f0'),
      muted: isLight ? '#5a6a80' : rootValue('--deckbuilder-muted', '#8b9ab5'),
      grid: isLight ? 'rgba(15, 130, 245, .14)' : 'rgba(89, 214, 253, .16)',
      border: isLight ? 'rgba(15, 130, 245, .22)' : 'rgba(89, 214, 253, .24)',
      tooltipBg: isLight ? 'rgba(255, 255, 255, .96)' : 'rgba(6, 13, 24, .94)',
      tooltipText: isLight ? '#102034' : rootValue('--deckbuilder-white', '#ffffff'),
      tooltipMuted: isLight ? '#5a6a80' : rootValue('--deckbuilder-body', '#c8d8f0'),
    }
  }

  function gradientFor(context, theme) {
    const chart = context.chart
    const area = chart.chartArea
    if (!area) return theme.primary
    const gradient = chart.ctx.createLinearGradient(area.left, 0, area.right, 0)
    gradient.addColorStop(0, theme.primary)
    gradient.addColorStop(1, theme.secondary)
    return gradient
  }

  function paletteFor(theme) {
    return [theme.primary, theme.secondary, '#5d4ee8', '#ff9f51', '#2fc27d', '#ff5c7a']
  }

  function formatDelta(value) {
    const number = Number(value || 0)
    const formatted = formatNumber.format(Math.abs(number))
    if (number > 0) return '+' + formatted
    if (number < 0) return '-' + formatted
    return formatted
  }

  const valueLabelPlugin = {
    id: 'deckbuilderBarValueLabels',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      if (!theme) return
      const dataset = chart.data.datasets[0]
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = theme.text
      ctx.font = '600 12px Inter, Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      meta.data.forEach((bar, index) => {
        const raw = Number(dataset.data[index] ?? 0)
        const position = bar.tooltipPosition()
        const x = Math.min(chart.chartArea.right - 46, position.x + 10)
        ctx.fillText(formatNumber.format(raw), x, position.y)
      })
      ctx.restore()
    },
  }

  const verticalBarValueLabelPlugin = {
    id: 'deckbuilderVerticalBarValueLabels',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      if (!theme) return
      const dataset = chart.data.datasets[0]
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = theme.text
      ctx.font = '700 12px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      meta.data.forEach((bar, index) => {
        const raw = Number(dataset.data[index] ?? 0)
        const position = bar.tooltipPosition()
        ctx.fillText(formatNumber.format(raw), position.x, Math.max(chart.chartArea.top + 14, position.y - 8))
      })
      ctx.restore()
    },
  }

  const pointValueLabelPlugin = {
    id: 'deckbuilderPointValueLabels',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      if (!theme) return
      const dataset = chart.data.datasets[0]
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      const mode = chart.$deckbuilderPointLabelMode || 'value'
      ctx.save()
      ctx.fillStyle = theme.text
      ctx.font = '600 12px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      meta.data.forEach((point, index) => {
        const raw = dataset.data[index] ?? 0
        const label = typeof raw === 'object' && raw
          ? (raw.label || formatNumber.format(Number(raw.y ?? 0)))
          : formatNumber.format(Number(raw))
        const position = point.tooltipPosition()
        ctx.fillText(label, position.x, Math.max(chart.chartArea.top + 14, position.y - 10))
        if (mode !== 'point-detail' || typeof raw !== 'object' || !raw) return
        const detail = '(' + formatNumber.format(Number(raw.x ?? 0)) + ', ' + formatNumber.format(Number(raw.y ?? 0)) + ')'
        ctx.fillStyle = theme.muted
        ctx.font = '500 10px Inter, Arial, sans-serif'
        ctx.textBaseline = 'top'
        ctx.fillText(detail, position.x, Math.min(chart.chartArea.bottom - 12, position.y + 10))
        ctx.fillStyle = theme.text
        ctx.font = '600 12px Inter, Arial, sans-serif'
        ctx.textBaseline = 'bottom'
      })
      ctx.restore()
    },
  }

  const multiBarValueLabelPlugin = {
    id: 'deckbuilderMultiBarValueLabels',
    afterDatasetsDraw(chart, _args, pluginOptions) {
      const theme = chart.$deckbuilderTheme || pluginOptions.theme
      const mode = chart.$deckbuilderValueMode || pluginOptions.mode
      if (!theme || !mode) return
      const ctx = chart.ctx
      ctx.save()
      ctx.font = '600 11px Inter, Arial, sans-serif'
      ctx.textBaseline = 'middle'

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex)
        meta.data.forEach((bar, dataIndex) => {
          const raw = Number(dataset.data[dataIndex] ?? 0)
          const label = formatNumber.format(raw)
          const width = Math.abs((bar.x ?? 0) - (bar.base ?? 0))
          const position = bar.tooltipPosition()
          if (mode === 'stacked') {
            if (width < 32) return
            ctx.fillStyle = '#ffffff'
            ctx.textAlign = 'center'
            ctx.fillText(label, ((bar.x ?? position.x) + (bar.base ?? position.x)) / 2, position.y)
            return
          }
          ctx.fillStyle = theme.text
          ctx.textAlign = 'left'
          ctx.fillText(label, Math.min(chart.chartArea.right - 34, position.x + 7), position.y)
        })
      })

      if (mode === 'stacked') {
        ctx.fillStyle = theme.text
        ctx.textAlign = 'left'
        chart.data.labels.forEach((_, dataIndex) => {
          const total = chart.data.datasets.reduce((sum, dataset) => sum + Number(dataset.data[dataIndex] ?? 0), 0)
          const firstMeta = chart.getDatasetMeta(0)
          const firstBar = firstMeta.data[dataIndex]
          if (!firstBar) return
          const x = chart.scales.x.getPixelForValue(total)
          ctx.fillText(formatNumber.format(total), Math.min(chart.chartArea.right - 34, x + 8), firstBar.y)
        })
      }
      ctx.restore()
    },
  }

  const doughnutValueLabelPlugin = {
    id: 'deckbuilderDoughnutValueLabels',
    afterDatasetsDraw(chart, _args, pluginOptions) {
      const theme = chart.$deckbuilderTheme || pluginOptions.theme
      if (!theme) return
      const dataset = chart.data.datasets[0]
      const values = dataset.data.map((value) => Number(value || 0))
      const total = values.reduce((sum, value) => sum + value, 0)
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 12px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      meta.data.forEach((arc, index) => {
        const value = values[index] || 0
        const percent = total > 0 ? Math.round((value / total) * 100) : 0
        if (percent < 8) return
        const position = arc.tooltipPosition()
        ctx.fillText(String(percent) + '%', position.x, position.y)
      })
      ctx.restore()
    },
  }

  const waterfallBuildPlugin = {
    id: 'deckbuilderWaterfallBuild',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      const deltas = chart.$deckbuilderDeltas || []
      if (!theme) return
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      const yScale = chart.scales.y

      ctx.save()
      ctx.strokeStyle = theme.muted
      ctx.lineWidth = 1.4
      ctx.setLineDash([5, 5])
      ctx.globalAlpha = .78
      meta.data.slice(0, -1).forEach((bar, index) => {
        const next = meta.data[index + 1]
        const raw = chart.data.datasets[0].data[index]
        if (!next || !Array.isArray(raw)) return
        const end = Number(raw[1] || 0)
        const y = yScale.getPixelForValue(end)
        const half = Math.abs(bar.width || 0) / 2
        const nextHalf = Math.abs(next.width || 0) / 2
        ctx.beginPath()
        ctx.moveTo(bar.x + half, y)
        ctx.lineTo(next.x - nextHalf, y)
        ctx.stroke()
      })

      ctx.setLineDash([])
      ctx.globalAlpha = 1
      ctx.fillStyle = theme.text
      ctx.font = '700 12px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      meta.data.forEach((bar, index) => {
        const delta = Number(deltas[index] || 0)
        const top = Math.min(bar.y, bar.base)
        const bottom = Math.max(bar.y, bar.base)
        const y = delta < 0
          ? Math.min(chart.chartArea.bottom - 8, bottom + 18)
          : Math.max(chart.chartArea.top + 14, top - 8)
        ctx.fillText(formatDelta(delta), bar.x, y)
      })
      ctx.restore()
    },
  }

  const bulletTargetPlugin = {
    id: 'deckbuilderBulletTargets',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      const targets = chart.$deckbuilderTargets || []
      if (!theme || !targets.length) return
      const meta = chart.getDatasetMeta(0)
      const xScale = chart.scales.x
      const ctx = chart.ctx
      ctx.save()
      ctx.strokeStyle = '#ff9f51'
      ctx.fillStyle = theme.text
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.font = '600 10px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      meta.data.forEach((bar, index) => {
        const target = Number(targets[index] || 0)
        if (!Number.isFinite(target)) return
        const x = xScale.getPixelForValue(target)
        const markerHeight = Math.min(34, Math.max(18, Math.abs(bar.height || 24) + 10))
        ctx.beginPath()
        ctx.moveTo(x, bar.y - markerHeight / 2)
        ctx.lineTo(x, bar.y + markerHeight / 2)
        ctx.stroke()
        ctx.fillText('T ' + formatNumber.format(target), x, Math.max(chart.chartArea.top + 12, bar.y - markerHeight / 2 - 4))
      })
      ctx.restore()
    },
  }

  const paretoLabelPlugin = {
    id: 'deckbuilderParetoLabels',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      if (!theme) return
      const ctx = chart.ctx
      ctx.save()

      const barDataset = chart.data.datasets[0]
      const barMeta = chart.getDatasetMeta(0)
      ctx.fillStyle = theme.text
      ctx.font = '700 11px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      barMeta.data.forEach((bar, index) => {
        const raw = Number(barDataset.data[index] ?? 0)
        const y = Math.max(chart.chartArea.top + 13, bar.y - 7)
        ctx.fillText(formatNumber.format(raw), bar.x, y)
      })

      const lineDataset = chart.data.datasets[1]
      const lineMeta = chart.getDatasetMeta(1)
      ctx.fillStyle = '#ff9f51'
      ctx.font = '700 11px Inter, Arial, sans-serif'
      lineMeta.data.forEach((point, index) => {
        const raw = Number(lineDataset.data[index] ?? 0)
        const y = Math.max(chart.chartArea.top + 13, point.y - 8)
        ctx.fillText(Math.round(raw) + '%', point.x, y)
      })

      ctx.restore()
    },
  }

  const radarValueLabelPlugin = {
    id: 'deckbuilderRadarValueLabels',
    afterDatasetsDraw(chart) {
      const theme = chart.$deckbuilderTheme
      if (!theme) return
      const dataset = chart.data.datasets[0]
      const meta = chart.getDatasetMeta(0)
      const ctx = chart.ctx
      ctx.save()
      ctx.fillStyle = theme.text
      ctx.font = '700 11px Inter, Arial, sans-serif'
      ctx.textBaseline = 'middle'
      meta.data.forEach((point, index) => {
        const raw = Number(dataset.data[index] ?? 0)
        const position = point.tooltipPosition()
        const scale = chart.scales?.r
        const centerX = Number(scale?.xCenter ?? chart.chartArea.left + chart.chartArea.width / 2)
        const centerY = Number(scale?.yCenter ?? chart.chartArea.top + chart.chartArea.height / 2)
        const dx = position.x - centerX
        const dy = position.y - centerY
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const labelX = position.x + (dx / distance) * 16
        const labelY = position.y + (dy / distance) * 16
        ctx.textAlign = dx < -8 ? 'right' : dx > 8 ? 'left' : 'center'
        ctx.fillText(formatNumber.format(raw), labelX, labelY)
      })
      ctx.restore()
    },
  }

  function initBarChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="bar"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values)) return
    const theme = themeFor(figure)
    const label = config.series || config.title || 'Series 1'
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: config.labels,
        datasets: [{
          label,
          data: config.values,
          backgroundColor: (context) => gradientFor(context, theme),
          borderColor: theme.primary,
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 26,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'nearest',
          axis: 'y',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              label: (context) => label + ': ' + formatNumber.format(Number(context.parsed.x ?? context.raw ?? 0)),
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
          y: {
            ticks: {
              color: theme.text,
              font: { weight: '600' },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
      plugins: [valueLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initLineChart(figure, options = {}) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const chartType = options.type || 'line'
    const canvas = figure.querySelector('canvas[data-deck-chartjs="' + chartType + '"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values)) return
    const theme = themeFor(figure)
    const label = config.series || config.title || 'Series 1'
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: config.labels,
        datasets: [{
          label,
          data: config.values,
          borderColor: theme.primary,
          backgroundColor: options.fill ? 'rgba(89, 214, 253, .2)' : 'rgba(89, 214, 253, .14)',
          pointBackgroundColor: theme.secondary,
          pointBorderColor: theme.tooltipBg,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0.36,
          fill: Boolean(options.fill),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 950,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              label: (context) => label + ': ' + formatNumber.format(Number(context.parsed.y ?? context.raw ?? 0)),
            },
          },
        },
        scales: {
          x: {
            ticks: { color: theme.muted },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
          y: {
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
        },
      },
      plugins: [pointValueLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initMultiBarChart(figure, options = {}) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const chartType = options.type || 'grouped-bar'
    const canvas = figure.querySelector('canvas[data-deck-chartjs="' + chartType + '"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.seriesNames) || !Array.isArray(config.matrix)) return
    const theme = themeFor(figure)
    const colors = paletteFor(theme)
    const valueMode = options.stacked ? 'stacked' : 'grouped'
    const dataMax = options.stacked
      ? Math.max(...config.labels.map((_, dataIndex) => config.matrix.reduce((sum, row) => sum + Number(row?.[dataIndex] || 0), 0)))
      : Math.max(...config.matrix.flatMap((row) => Array.isArray(row) ? row.map((value) => Number(value || 0)) : []))
    const suggestedMax = dataMax > 0 ? dataMax * 1.14 : undefined
    const datasets = config.seriesNames.map((series, index) => ({
      label: series,
      data: Array.isArray(config.matrix[index]) ? config.matrix[index] : [],
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length],
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 18,
    }))
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: config.labels,
        datasets,
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: options.stacked ? 58 : 46 },
        },
        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          axis: 'y',
          intersect: false,
        },
        plugins: {
          deckbuilderMultiBarValueLabels: {
            theme,
            mode: valueMode,
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: theme.text,
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: true,
            padding: 12,
            callbacks: {
              label: (context) => context.dataset.label + ': ' + formatNumber.format(Number(context.parsed.x ?? context.raw ?? 0)),
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            stacked: Boolean(options.stacked),
            suggestedMax,
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
          y: {
            stacked: Boolean(options.stacked),
            ticks: {
              color: theme.text,
              font: { weight: '600' },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
      plugins: [multiBarValueLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    chart.$deckbuilderValueMode = valueMode
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initPointChart(figure, options = {}) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const chartType = options.type || 'scatter'
    const canvas = figure.querySelector('canvas[data-deck-chartjs="' + chartType + '"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.points)) return
    const theme = themeFor(figure)
    const label = config.series || config.title || 'Series 1'
    const colors = paletteFor(theme)
    const points = config.points
      .map((point) => ({
        x: Number(point.x),
        y: Number(point.y),
        r: options.bubble ? Math.max(5, Number(point.r || 0)) : undefined,
        label: point.label || '',
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    const radii = points.map((point) => Number(point.r || 0)).filter((value) => Number.isFinite(value))
    const maxRadius = Math.max(...radii, 1)
    const chart = new Chart(canvas, {
      type: options.bubble ? 'bubble' : 'scatter',
      data: {
        datasets: [{
          label,
          data: points,
          backgroundColor: (context) => colors[context.dataIndex % colors.length] + (options.bubble ? 'cc' : 'ee'),
          borderColor: (context) => colors[context.dataIndex % colors.length],
          borderWidth: 1.5,
          pointRadius: options.bubble ? undefined : 6,
          pointHoverRadius: options.bubble ? undefined : 9,
          hoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 22, right: 22, bottom: 8, left: 4 },
        },
        animation: {
          duration: 950,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              title: (items) => items[0]?.raw?.label || label,
              label: (context) => {
                const raw = context.raw || {}
                const base = (config.xAxisLabel || 'X') + ': ' + formatNumber.format(Number(raw.x ?? 0)) + ', ' + (config.yAxisLabel || 'Y') + ': ' + formatNumber.format(Number(raw.y ?? 0))
                return options.bubble ? base + ', Size: ' + formatNumber.format(Number(raw.r ?? 0)) : base
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: Boolean(config.xAxisLabel),
              text: config.xAxisLabel,
              color: theme.text,
              font: { weight: '600' },
            },
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
          y: {
            title: {
              display: Boolean(config.yAxisLabel),
              text: config.yAxisLabel,
              color: theme.text,
              font: { weight: '600' },
            },
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
        },
      },
      plugins: [pointValueLabelPlugin],
    })
    if (options.bubble && chart.data.datasets[0]) {
      chart.data.datasets[0].data = points.map((point) => ({
        ...point,
        r: Math.max(6, Math.min(25, 6 + (Number(point.r || 0) / maxRadius) * 19)),
      }))
    }
    chart.$deckbuilderTheme = theme
    chart.$deckbuilderPointLabelMode = 'point-detail'
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initHistogramChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="histogram"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values)) return
    const theme = themeFor(figure)
    const label = config.series || config.title || 'Count'
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: config.labels,
        datasets: [{
          label,
          data: config.values,
          backgroundColor: 'rgba(93, 78, 232, .82)',
          borderColor: '#9aa3ff',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 54,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, right: 14 },
        },
        animation: {
          duration: 920,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              label: (context) => label + ': ' + formatNumber.format(Number(context.parsed.y ?? context.raw ?? 0)),
            },
          },
        },
        scales: {
          x: {
            title: {
              display: Boolean(config.xAxisLabel),
              text: config.xAxisLabel,
              color: theme.text,
              font: { weight: '600' },
            },
            ticks: {
              color: theme.muted,
              maxRotation: 0,
              autoSkip: true,
              autoSkipPadding: 12,
            },
            grid: { display: false },
            border: { color: theme.border },
          },
          y: {
            beginAtZero: true,
            title: {
              display: Boolean(config.yAxisLabel),
              text: config.yAxisLabel,
              color: theme.text,
              font: { weight: '600' },
            },
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
              precision: 0,
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
        },
      },
      plugins: [verticalBarValueLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initWaterfallChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="waterfall"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.ranges)) return
    const theme = themeFor(figure)
    const positiveColor = '#2fc27d'
    const negativeColor = '#ff5c7a'
    const label = config.series || config.title || 'Change'
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: config.labels,
        datasets: [{
          label,
          data: config.ranges,
          backgroundColor: (context) => {
            const raw = context.raw
            const delta = Array.isArray(raw) ? Number(raw[1] || 0) - Number(raw[0] || 0) : 0
            return delta < 0 ? negativeColor : positiveColor
          },
          borderColor: (context) => {
            const raw = context.raw
            const delta = Array.isArray(raw) ? Number(raw[1] || 0) - Number(raw[0] || 0) : 0
            return delta < 0 ? negativeColor : positiveColor
          },
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 62,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 22, right: 18 },
        },
        animation: {
          duration: 950,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              label: (context) => label + ': ' + formatDelta(config.deltas?.[context.dataIndex] || 0),
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: theme.text,
              font: { weight: '600' },
              maxRotation: 0,
              autoSkip: true,
            },
            grid: { display: false },
            border: { color: theme.border },
          },
          y: {
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
        },
      },
      plugins: [waterfallBuildPlugin],
    })
    chart.$deckbuilderTheme = theme
    chart.$deckbuilderDeltas = Array.isArray(config.deltas) ? config.deltas : []
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initBulletChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="bullet"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values)) return
    const theme = themeFor(figure)
    const targets = Array.isArray(config.targets) ? config.targets.map((value) => Number(value || 0)) : []
    const values = config.values.map((value) => Number(value || 0))
    const dataMax = Math.max(...values, ...targets, 1)
    const label = config.series || config.title || 'Actual'
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: config.labels,
        datasets: [{
          label,
          data: values,
          backgroundColor: (context) => gradientFor(context, theme),
          borderColor: theme.primary,
          borderWidth: 1,
          borderRadius: 7,
          borderSkipped: false,
          maxBarThickness: 24,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, right: 64 },
        },
        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'nearest',
          axis: 'y',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              label: (context) => {
                const target = targets[context.dataIndex]
                const targetText = Number.isFinite(target) ? ', target ' + formatNumber.format(target) : ''
                return label + ': ' + formatNumber.format(Number(context.parsed.x ?? context.raw ?? 0)) + targetText
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: dataMax * 1.12,
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
          y: {
            ticks: {
              color: theme.text,
              font: { weight: '600' },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
      plugins: [valueLabelPlugin, bulletTargetPlugin],
    })
    chart.$deckbuilderTheme = theme
    chart.$deckbuilderTargets = targets
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initParetoChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="pareto"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values) || !Array.isArray(config.cumulativePercent)) return
    const theme = themeFor(figure)
    const label = config.series || config.title || 'Value'
    const chart = new Chart(canvas, {
      data: {
        labels: config.labels,
        datasets: [
          {
            type: 'bar',
            label,
            data: config.values,
            backgroundColor: theme.primary,
            borderColor: theme.secondary,
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            maxBarThickness: 48,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Cumulative %',
            data: config.cumulativePercent,
            borderColor: '#ff9f51',
            backgroundColor: '#ff9f51',
            pointBackgroundColor: '#ff9f51',
            pointBorderColor: theme.tooltipBg,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 3,
            tension: 0.28,
            yAxisID: 'percent',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 22, right: 14 },
        },
        animation: {
          duration: 980,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: theme.text,
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: true,
            padding: 12,
            callbacks: {
              label: (context) => context.dataset.label + ': ' + (context.dataset.yAxisID === 'percent'
                ? Math.round(Number(context.raw ?? 0)) + '%'
                : formatNumber.format(Number(context.raw ?? 0))),
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: theme.text,
              font: { weight: '600' },
              maxRotation: 0,
              autoSkip: true,
            },
            grid: { display: false },
            border: { color: theme.border },
          },
          y: {
            beginAtZero: true,
            title: {
              display: Boolean(config.yAxisLabel),
              text: config.yAxisLabel,
              color: theme.text,
              font: { weight: '600' },
            },
            ticks: {
              color: theme.muted,
              callback: (value) => formatNumber.format(Number(value)),
            },
            grid: { color: theme.grid },
            border: { color: theme.border },
          },
          percent: {
            beginAtZero: true,
            position: 'right',
            min: 0,
            max: 100,
            ticks: {
              color: theme.muted,
              callback: (value) => Number(value) + '%',
            },
            grid: { drawOnChartArea: false },
            border: { color: theme.border },
          },
        },
      },
      plugins: [paretoLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initRadarChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="radar"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values)) return
    const theme = themeFor(figure)
    const label = config.series || config.title || 'Series 1'
    const maxValue = Math.max(...config.values.map((value) => Number(value || 0)), 1)
    const suggestedMax = maxValue <= 100
      ? 100
      : Math.ceil((maxValue * 1.12) / 10) * 10
    const chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: config.labels,
        datasets: [{
          label,
          data: config.values,
          backgroundColor: 'rgba(89, 214, 253, .18)',
          borderColor: theme.secondary,
          pointBackgroundColor: theme.primary,
          pointBorderColor: theme.tooltipBg,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 22, right: 22, bottom: 10, left: 22 },
        },
        animation: {
          duration: 980,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'nearest',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: false,
            padding: 12,
            callbacks: {
              label: (context) => label + ': ' + formatNumber.format(Number(context.raw ?? 0)),
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            max: suggestedMax,
            ticks: {
              backdropColor: 'transparent',
              color: theme.muted,
              callback: (value) => Number(value) === suggestedMax ? '' : formatNumber.format(Number(value)),
              stepSize: suggestedMax <= 100 ? 25 : undefined,
              maxTicksLimit: 5,
            },
            angleLines: { color: theme.grid },
            grid: { color: theme.grid },
            pointLabels: {
              color: theme.text,
              font: { weight: '600', size: 12 },
            },
          },
        },
      },
      plugins: [radarValueLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initDoughnutChart(figure) {
    if (figure.__deckbuilderChart) {
      figure.__deckbuilderChart.resize()
      return
    }
    const canvas = figure.querySelector('canvas[data-deck-chartjs="doughnut"]')
    if (!canvas) return
    const config = readConfig(canvas)
    if (!config || !Array.isArray(config.labels) || !Array.isArray(config.values)) return
    const theme = themeFor(figure)
    const colors = paletteFor(theme)
    const total = config.values.reduce((sum, value) => sum + Number(value || 0), 0)
    const chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: config.labels,
        datasets: [{
          label: config.series || config.title || 'Series 1',
          data: config.values,
          backgroundColor: config.labels.map((_, index) => colors[index % colors.length]),
          borderColor: theme.tooltipBg,
          borderWidth: 2,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 900,
          easing: 'easeOutQuart',
        },
        plugins: {
          deckbuilderDoughnutValueLabels: {
            theme,
          },
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: theme.text,
              boxWidth: 10,
              boxHeight: 10,
              padding: 14,
              generateLabels(chart) {
                const dataset = chart.data.datasets[0]
                const values = dataset.data.map((value) => Number(value || 0))
                const total = values.reduce((sum, value) => sum + value, 0)
                return chart.data.labels.map((label, index) => {
                  const value = values[index] || 0
                  const percent = total > 0 ? Math.round((value / total) * 100) : 0
                  const fillStyle = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[index] : dataset.backgroundColor
                  const strokeStyle = Array.isArray(dataset.borderColor) ? dataset.borderColor[index] : dataset.borderColor
                  return {
                    text: String(label) + ': ' + formatNumber.format(value) + ' (' + percent + '%)',
                    fillStyle,
                    fontColor: theme.text,
                    strokeStyle: strokeStyle || fillStyle,
                    lineWidth: 0,
                    hidden: chart.getDataVisibility ? !chart.getDataVisibility(index) : false,
                    index,
                  }
                })
              },
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: theme.tooltipBg,
            titleColor: theme.tooltipText,
            bodyColor: theme.tooltipMuted,
            borderColor: theme.border,
            borderWidth: 1,
            displayColors: true,
            padding: 12,
            callbacks: {
              label: (context) => {
                const value = Number(context.raw ?? 0)
                const percent = total > 0 ? Math.round((value / total) * 100) : 0
                return context.label + ': ' + formatNumber.format(value) + ' (' + percent + '%)'
              },
            },
          },
        },
      },
      plugins: [doughnutValueLabelPlugin],
    })
    chart.$deckbuilderTheme = theme
    figure.__deckbuilderChart = chart
    figure.dataset.deckChartEnhanced = 'true'
  }

  function initChart(figure) {
    const type = figure.getAttribute('data-deck-chart-type')
    if (type === 'bar') initBarChart(figure)
    if (type === 'line') initLineChart(figure)
    if (type === 'area') initLineChart(figure, { type: 'area', fill: true })
    if (type === 'grouped-bar') initMultiBarChart(figure, { type: 'grouped-bar', stacked: false })
    if (type === 'stacked-bar') initMultiBarChart(figure, { type: 'stacked-bar', stacked: true })
    if (type === 'scatter') initPointChart(figure, { type: 'scatter' })
    if (type === 'bubble') initPointChart(figure, { type: 'bubble', bubble: true })
    if (type === 'histogram') initHistogramChart(figure)
    if (type === 'waterfall') initWaterfallChart(figure)
    if (type === 'bullet') initBulletChart(figure)
    if (type === 'pareto') initParetoChart(figure)
    if (type === 'radar') initRadarChart(figure)
    if (type === 'doughnut') initDoughnutChart(figure)
  }

  function resetChart(figure) {
    const chart = figure.__deckbuilderChart
    if (!chart) return
    try {
      chart.stop()
      chart.reset()
      chart.render()
    } catch {
      chart.resize()
    }
  }

  function replayChart(figure) {
    const chart = figure.__deckbuilderChart
    if (!chart) return
    try {
      chart.update()
    } catch {
      chart.resize()
    }
  }

  function activateChart(figure) {
    window.clearTimeout(figure.__deckbuilderChartTimer)
    figure.dataset.deckChartAnimating = 'scheduled'
    initChart(figure)
    if (!figure.__deckbuilderChart) return
    resetChart(figure)
    figure.__deckbuilderChartTimer = window.setTimeout(() => {
      figure.dataset.deckChartAnimating = 'true'
      replayChart(figure)
      window.setTimeout(() => {
        if (figure.dataset.deckChartAnimating === 'true') figure.dataset.deckChartAnimating = 'complete'
      }, 980)
    }, activationDelay)
  }

  function activateChartsForSlide(slide) {
    const figures = slide
      ? chartFigures.filter((figure) => figure.closest('[data-deckbuilder-slide]') === slide)
      : chartFigures.filter((figure) => !figure.closest('[data-deckbuilder-slide]'))
    figures.forEach(activateChart)
  }

  function initActiveCharts() {
    const activeSlides = slides.filter((slide) => slide.classList.contains('active'))
    activeSlides.forEach(activateChartsForSlide)
    activateChartsForSlide(null)
  }

  const slides = Array.from(document.querySelectorAll('[data-deckbuilder-slide]'))
  const observer = new MutationObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target.classList.contains('active')) activateChartsForSlide(entry.target)
    })
  })
  slides.forEach((slide) => observer.observe(slide, { attributes: true, attributeFilter: ['class'] }))
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initActiveCharts, { once: true })
  } else {
    initActiveCharts()
  }
})();`
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
