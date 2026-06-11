import { splitFrontmatter } from './markdown.js'
import { resolveSurfaceResourceFile } from './resources.js'
import { resolveResourceUrls } from './render.js'
import { prepareReportContent } from './report/content.js'
import { reportCustomerLogo, reportDocument, reportLogo, reportSurface } from './report/document.js'
import { reportCss } from './report/styles.js'
import { richHtmlRuntimeScript } from './rich-html-runtime.js'

export function renderReportHtml(source, options = {}) {
  const definitions = options.definitions || {}
  const brand = definitions.brand || {}
  const { frontmatter, body } = splitFrontmatter(source)
  const assetMap = options.collectResources ? new Map() : null
  const resolverOptions = {
    assetMap,
    inlineAssets: options.inlineAssets,
    assetUrlPrefix: options.assetUrlPrefix,
  }
  const { content, toc, titleFallback } = prepareReportContent(body, {
    resourcesDir: options.resourcesDir,
    resolverOptions,
  })
  const css = resolveResourceUrls(reportCss(brand, frontmatter, definitions.themeCss), options.resourcesDir, resolverOptions)
  const title = frontmatter.title || titleFallback || 'Report'
  const subtitle = frontmatter.subtitle || ''
  const surface = reportSurface(frontmatter)
  const logo = reportSurfaceResourceReference(reportLogo(brand, surface), options.resourcesDir, surface)
  const customerLogo = reportSurfaceResourceReference(reportCustomerLogo(frontmatter), options.resourcesDir, surface)
  const document = resolveResourceUrls(
    reportDocument({
      title,
      subtitle,
      content,
      css,
      logo,
      customerLogo,
      customerName: frontmatter.customerName || frontmatter.customer?.name || 'Customer',
      toc,
      surface,
      richHtmlJs: richHtmlRuntimeScript(),
      brandName: brand.name || 'Brand',
    }),
    options.resourcesDir,
    resolverOptions,
  )

  return {
    html: content,
    css,
    frontmatter,
    document,
    assets: assetMap
      ? [...assetMap.entries()].map(([relativePath, sourcePath]) => ({
          relativePath,
          sourcePath,
        }))
      : [],
  }
}

function reportSurfaceResourceReference(src, resourcesDir, surface) {
  if (!src || !resourcesDir) return src || ''
  try {
    return `resource:${resolveSurfaceResourceFile(src, resourcesDir, surface).relativePath}`
  } catch {
    return src
  }
}
