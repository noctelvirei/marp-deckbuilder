import { pathToFileURL } from 'node:url'

import {
  resolveResourceFile,
  resourceToDataUri,
} from '../resources.js'

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
