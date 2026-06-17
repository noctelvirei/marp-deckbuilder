import { escapeAttr, escapeHtml, formatNumber } from './utils.js'

let sankeySeq = 0

const DEFAULT_COLORS = {
  light: {
    grid: '#d8e2f0',
    text: '#333333',
    muted: '#666666',
    'label-halo': '#fdfdfd',
    linkOpacity: '0.55',
    nodes: ['#0f82f5', '#4cc9f0', '#5d4ee8', '#ff9f51', '#2fc27d', '#ff5c7a'],
  },
  dark: {
    grid: '#31557e',
    text: '#f4f8ff',
    muted: '#c8d8f0',
    'label-halo': '#1d1e29',
    linkOpacity: '0.6',
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
  const uid = `sankey-${(sankeySeq += 1)}`
  // Per-link gradient: source-node colour flows into target-node colour.
  const linkDefs = geometry.links
    .map((link, i) => {
      const x0 = link.source.x + geometry.nodeWidth
      const x1 = link.target.x
      return `<linearGradient id="${uid}-l${i}" gradientUnits="userSpaceOnUse" x1="${round(x0)}" y1="0" x2="${round(x1)}" y2="0">
      <stop offset="0" style="stop-color:${nodeColor(link.source.index)}"/>
      <stop offset="1" style="stop-color:${nodeColor(link.target.index)}"/>
    </linearGradient>`
    })
    .join('\n    ')
  const links = geometry.links
    .map((link, i) => `<path class="deck-sankey-link deck-sankey-link-${link.source.index % 6}" d="${linkPath(link, geometry.nodeWidth)}" stroke="url(#${uid}-l${i})" stroke-width="${round(link.width)}">
    <title>${escapeHtml(link.source.label)} to ${escapeHtml(link.target.label)}: ${escapeHtml(formatNumber(link.value))}</title>
  </path>`)
    .join('\n  ')
  const nodes = geometry.nodes
    .map((node) => {
      const label = nodeLabel(node, geometry)
      const nodeValue = Math.max(node.incoming, node.outgoing)
      return `<g class="deck-sankey-node deck-sankey-node-${node.index % 6}" transform="translate(${round(node.x)} ${round(node.y)})">
    <rect class="deck-sankey-node-rect" width="${geometry.nodeWidth}" height="${round(node.height)}" rx="5" fill="${nodeColor(node.index)}"><title>${escapeHtml(node.label)}: in ${escapeHtml(formatNumber(node.incoming))}, out ${escapeHtml(formatNumber(node.outgoing))}</title></rect>
    <text class="deck-sankey-label" x="${label.x}" y="${label.y}" text-anchor="${label.anchor}">${escapeHtml(truncateLabel(node.label))}</text>
    <text class="deck-sankey-value" x="${label.x}" y="${label.y + 15}" text-anchor="${label.anchor}">${escapeHtml(formatNumber(nodeValue))}</text>
  </g>`
    })
    .join('\n  ')

  return `<svg class="deck-chart-sankey-svg" viewBox="0 0 ${geometry.width} ${geometry.height}" role="img" aria-label="${escapeAttr(chart.title || 'Sankey chart')}">
  <style>
    .deck-sankey-link { fill: none; stroke-linecap: butt; opacity: ${color('linkOpacity')}; }
    .deck-sankey-node-rect { stroke: ${color('grid')}; stroke-width: 1; }
    .deck-sankey-label, .deck-sankey-value, .deck-sankey-caption { fill: ${color('text')}; font: 700 12px "Poppins", "Aptos", sans-serif; }
    .deck-sankey-label { paint-order: stroke; stroke: ${color('label-halo')}; stroke-width: 5; stroke-linejoin: round; }
    .deck-sankey-value { fill: ${color('muted')}; font-size: 10.5px; font-weight: 600; paint-order: stroke; stroke: ${color('label-halo')}; stroke-width: 4; stroke-linejoin: round; }
    .deck-sankey-caption { fill: ${color('muted')}; font-weight: 500; }
  </style>
  <defs>
    ${linkDefs}
  </defs>
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
  const nodeWidth = 16
  const margin = { top: 48, right: 86, bottom: 34, left: 86 }
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
  const maxNodeWeight = Math.max(...nodes.map((node) => Math.max(node.incoming, node.outgoing, 1)), 1)
  columns.forEach((column, depth) => {
    column.sort((a, b) => Math.max(b.incoming, b.outgoing) - Math.max(a.incoming, a.outgoing) || a.index - b.index)
    const gap = column.length > 1 ? 44 : 0
    const heights = column.map((node) => {
      const weight = Math.max(node.incoming, node.outgoing, 1)
      return clamp(28 + Math.sqrt(weight / maxNodeWeight) * 42, 30, 72)
    })
    const totalHeight = heights.reduce((sum, value) => sum + value, 0) + gap * Math.max(0, column.length - 1)
    let y = margin.top + Math.max(0, (innerHeight - totalHeight) / 2)
    column.forEach((node) => {
      node.x = margin.left + (depth / maxDepth) * innerWidth
      node.y = y
      node.height = heights[column.indexOf(node)]
      y += node.height + gap
    })
  })

  const maxLinkValue = Math.max(...links.map((link) => link.value), 1)
  links.forEach((link) => {
    link.width = clamp(5 + Math.sqrt(link.value / maxLinkValue) * 33, 7, 38)
  })
  nodes.forEach((node) => {
    node.sourceLinks.sort((a, b) => a.target.y - b.target.y)
    node.targetLinks.sort((a, b) => a.source.y - b.source.y)
    spreadAnchors(node, node.sourceLinks, 'y0')
    spreadAnchors(node, node.targetLinks, 'y1')
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
  const mid = x0 + (x1 - x0) * 0.46
  return `M${round(x0)},${round(link.y0)}C${round(mid)},${round(link.y0)} ${round(mid)},${round(link.y1)} ${round(x1)},${round(link.y1)}`
}

function spreadAnchors(node, links, key) {
  if (!links.length) return
  const center = node.y + node.height / 2
  const spacing = links.length > 1 ? Math.min(24, node.height / Math.max(1, links.length - 0.25)) : 0
  const start = center - spacing * (links.length - 1) / 2
  links.forEach((link, index) => {
    link[key] = start + spacing * index
  })
}

function nodeLabel(node, geometry) {
  if (node.depth === 0) {
    return {
      x: -12,
      y: round(node.height / 2 - 2),
      anchor: 'end',
    }
  }
  if (node.depth === geometry.maxDepth) {
    return {
      x: geometry.nodeWidth + 12,
      y: round(node.height / 2 - 2),
      anchor: 'start',
    }
  }
  return {
    x: round(geometry.nodeWidth / 2),
    y: -10,
    anchor: 'middle',
  }
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function round(value) {
  return Math.round(value * 10) / 10
}
