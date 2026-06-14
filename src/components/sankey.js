import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

const DEFAULT_COLORS = {
  light: {
    grid: '#d8e2f0',
    text: '#333333',
    muted: '#666666',
    'label-halo': '#fdfdfd',
    linkOpacity: '0.36',
    nodes: ['#0f82f5', '#4cc9f0', '#5d4ee8', '#ff9f51', '#2fc27d', '#ff5c7a'],
  },
  dark: {
    grid: '#31557e',
    text: '#f4f8ff',
    muted: '#c8d8f0',
    'label-halo': '#1d1e29',
    linkOpacity: '0.48',
    nodes: ['#59d6fd', '#0f82f5', '#8b7cff', '#ff9f51', '#66cc8e', '#ff5c7a'],
  },
}

export function renderSankeySvg(chart, options = {}) {
  const useVariables = options.cssVariables !== false
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const defaults = DEFAULT_COLORS[mode]
  const colors = {
    grid: options.gridColor || defaults.grid,
    text: options.textColor || defaults.text,
    muted: options.mutedColor || options.textColor || defaults.muted,
    'label-halo': options.labelHaloColor || defaults['label-halo'],
    linkOpacity: options.linkOpacity || defaults.linkOpacity,
    nodes: options.palette?.length ? options.palette : defaults.nodes,
  }
  const color = (name) => useVariables ? `var(--deck-sankey-${name}, ${colors[name]})` : colors[name]
  const nodeColor = (index) => {
    const fallback = colors.nodes[index % colors.nodes.length]
    return useVariables ? `var(--deck-sankey-node-${index % 6}, ${fallback})` : fallback
  }
  const geometry = sankeyGeometry(chart)
  const links = geometry.links
    .map((link) => `<path class="deck-sankey-link deck-sankey-link-${link.source.index % 6}" d="${linkPath(link, geometry.nodeWidth)}" stroke="${nodeColor(link.source.index)}" stroke-width="${round(link.width)}">
    <title>${escapeHtml(link.source.label)} to ${escapeHtml(link.target.label)}: ${escapeHtml(formatNumber(link.value))}</title>
  </path>`)
    .join('\n  ')
  const nodes = geometry.nodes
    .map((node) => {
      const labelAnchor = node.depth === geometry.maxDepth ? 'end' : 'start'
      const labelX = node.depth === geometry.maxDepth ? -8 : geometry.nodeWidth + 8
      return `<g class="deck-sankey-node deck-sankey-node-${node.index % 6}" transform="translate(${round(node.x)} ${round(node.y)})">
    <rect class="deck-sankey-node-rect" width="${geometry.nodeWidth}" height="${round(node.height)}" rx="5" fill="${nodeColor(node.index)}"><title>${escapeHtml(node.label)}: in ${escapeHtml(formatNumber(node.incoming))}, out ${escapeHtml(formatNumber(node.outgoing))}</title></rect>
    <text class="deck-sankey-label" x="${labelX}" y="${round(Math.max(12, node.height / 2))}" dy="0.35em" text-anchor="${labelAnchor}">${escapeHtml(truncateLabel(node.label))}</text>
  </g>`
    })
    .join('\n  ')

  return `<svg class="deck-chart-sankey-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Sankey chart')}">
  <style>
    .deck-sankey-link { fill: none; stroke-linecap: round; opacity: ${color('linkOpacity')}; }
    .deck-sankey-node-rect { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-sankey-label, .deck-sankey-caption { fill: ${color('text')}; font: 700 12px "Poppins", "Aptos", sans-serif; }
    .deck-sankey-label { paint-order: stroke; stroke: ${color('label-halo')}; stroke-width: 5; stroke-linejoin: round; }
    .deck-sankey-caption { fill: ${color('muted')}; font-weight: 500; }
  </style>
  <g class="deck-sankey-links">
  ${links}
  </g>
  <g class="deck-sankey-nodes">
  ${nodes}
  </g>
  <text class="deck-sankey-caption" x="${geometry.margin.left}" y="${geometry.height - 4}">${escapeHtml(chart.series || 'Flow')}</text>
</svg>`
}

export function sankeyRows(chart) {
  return chart.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.value,
  }))
}

function sankeyGeometry(chart) {
  const width = 760
  const height = 330
  const nodeWidth = 18
  const margin = { top: 24, right: 118, bottom: 24, left: 34 }
  const innerHeight = Math.max(120, height - margin.top - margin.bottom)
  const innerWidth = Math.max(220, width - margin.left - margin.right - nodeWidth)
  const nodeMap = new Map()
  const addNode = (label) => {
    if (!nodeMap.has(label)) {
      nodeMap.set(label, {
        label,
        index: nodeMap.size,
        incoming: 0,
        outgoing: 0,
        depth: 0,
        sourceLinks: [],
        targetLinks: [],
      })
    }
    return nodeMap.get(label)
  }

  const links = sankeyRows(chart).map((link) => {
    const source = addNode(link.source)
    const target = addNode(link.target)
    source.outgoing += link.value
    target.incoming += link.value
    const resolved = { ...link, source, target }
    source.sourceLinks.push(resolved)
    target.targetLinks.push(resolved)
    return resolved
  })

  for (let pass = 0; pass < nodeMap.size; pass += 1) {
    links.forEach((link) => {
      link.target.depth = Math.max(link.target.depth, link.source.depth + 1)
    })
  }

  const nodes = Array.from(nodeMap.values())
  const maxDepth = Math.max(...nodes.map((node) => node.depth), 1)
  const columns = groupBy(nodes, (node) => node.depth)
  columns.forEach((column) => {
    column.sort((a, b) => Math.max(b.incoming, b.outgoing) - Math.max(a.incoming, a.outgoing))
    const gap = column.length > 1 ? 12 : 0
    const available = Math.max(24, innerHeight - gap * Math.max(0, column.length - 1))
    const totalWeight = column.reduce((sum, node) => sum + Math.max(node.incoming, node.outgoing, 1), 0)
    const minHeight = column.length * 16 <= available ? 16 : Math.max(6, available / Math.max(1, column.length))
    let y = margin.top
    column.forEach((node) => {
      const weight = Math.max(node.incoming, node.outgoing, 1)
      node.x = margin.left + (node.depth / maxDepth) * innerWidth
      node.y = y
      node.height = Math.max(minHeight, (weight / Math.max(totalWeight, 1)) * available)
      y += node.height + gap
    })
  })

  const maxColumnWeight = Math.max(
    ...Array.from(columns.values(), (column) =>
      column.reduce((sum, node) => sum + Math.max(node.incoming, node.outgoing, 1), 0),
    ),
    1,
  )
  const linkScale = innerHeight / maxColumnWeight
  links.forEach((link) => {
    const maxLinkWidth = Math.max(2, Math.min(link.source.height, link.target.height, innerHeight * 0.24))
    link.width = Math.min(maxLinkWidth, Math.max(2, link.value * linkScale))
  })
  nodes.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y)
    node.targetLinks.sort((a, b) => a.source.y - b.source.y)
    let sourceOffset = Math.max(0, (node.height - totalLinkWidth(node.sourceLinks)) / 2)
    node.sourceLinks.forEach((link) => {
      link.y0 = node.y + Math.min(node.height - link.width / 2, sourceOffset + link.width / 2)
      sourceOffset += link.width
    })
    let targetOffset = Math.max(0, (node.height - totalLinkWidth(node.targetLinks)) / 2)
    node.targetLinks.forEach((link) => {
      link.y1 = node.y + Math.min(node.height - link.width / 2, targetOffset + link.width / 2)
      targetOffset += link.width
    })
  })

  return {
    width,
    height,
    margin,
    nodeWidth,
    maxDepth,
    nodes,
    links,
  }
}

function linkPath(link, nodeWidth) {
  const x0 = link.source.x + nodeWidth
  const x1 = link.target.x
  const mid = x0 + (x1 - x0) * 0.5
  return `M${round(x0)},${round(link.y0)}C${round(mid)},${round(link.y0)} ${round(mid)},${round(link.y1)} ${round(x1)},${round(link.y1)}`
}

function totalLinkWidth(links) {
  return links.reduce((sum, link) => sum + link.width, 0)
}

function groupBy(items, keyFor) {
  const groups = new Map()
  items.forEach((item) => {
    const key = keyFor(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return groups
}

function truncateLabel(label) {
  const value = String(label || '')
  return value.length > 18 ? `${value.slice(0, 16).trim()}...` : value
}

function round(value) {
  return Math.round(value * 10) / 10
}
