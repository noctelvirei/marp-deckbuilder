export function treemapRects(items, box, gap = 4) {
  const normalized = items
    .map((item, index) => ({
      ...item,
      index,
      value: Math.max(0, Number(item.value) || 0),
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  return binaryTreemap(normalized, box, gap).sort((a, b) => a.index - b.index)
}

function binaryTreemap(items, box, gap) {
  if (items.length === 0) return []
  if (items.length === 1) return [{ ...items[0], ...insetBox(box, gap / 2) }]

  const total = sumValues(items)
  const splitIndex = balancedSplitIndex(items, total)
  const leftItems = items.slice(0, splitIndex)
  const rightItems = items.slice(splitIndex)
  const leftTotal = sumValues(leftItems)
  const ratio = total > 0 ? leftTotal / total : 0.5

  if (box.w >= box.h) {
    const leftW = box.w * ratio
    return [
      ...binaryTreemap(leftItems, { ...box, w: leftW }, gap),
      ...binaryTreemap(rightItems, { x: box.x + leftW, y: box.y, w: box.w - leftW, h: box.h }, gap),
    ]
  }

  const topH = box.h * ratio
  return [
    ...binaryTreemap(leftItems, { ...box, h: topH }, gap),
    ...binaryTreemap(rightItems, { x: box.x, y: box.y + topH, w: box.w, h: box.h - topH }, gap),
  ]
}

function balancedSplitIndex(items, total) {
  let running = 0
  let bestIndex = 1
  let bestDelta = Number.POSITIVE_INFINITY
  for (let index = 1; index < items.length; index += 1) {
    running += items[index - 1].value
    const delta = Math.abs(total / 2 - running)
    if (delta < bestDelta) {
      bestDelta = delta
      bestIndex = index
    }
  }
  return bestIndex
}

function sumValues(items) {
  return items.reduce((sum, item) => sum + item.value, 0)
}

function insetBox(box, inset) {
  return {
    x: round(box.x + inset),
    y: round(box.y + inset),
    w: round(Math.max(0, box.w - inset * 2)),
    h: round(Math.max(0, box.h - inset * 2)),
  }
}

function round(value) {
  return Number(value.toFixed(2))
}
