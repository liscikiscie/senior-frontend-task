function endpointSlug(endpoint) {
  return typeof endpoint === 'string' ? endpoint : endpoint?.slug
}

function buildAdjacency(links) {
  const adj = new Map()
  for (const link of links) {
    const a = endpointSlug(link.source)
    const b = endpointSlug(link.target)
    if (a == null || b == null) continue
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a).push({ neighbor: b, link })
    adj.get(b).push({ neighbor: a, link })
  }
  return adj
}

function linkId(link) {
  const a = endpointSlug(link.source)
  const b = endpointSlug(link.target)
  return `${a}->${b}`
}

export function findShortestPath(links, startSlug, endSlug) {
  if (!startSlug || !endSlug) return null

  if (startSlug === endSlug) {
    return { nodeSlugs: new Set([startSlug]), linkIds: new Set() }
  }

  const adj = buildAdjacency(links)
  if (!adj.has(startSlug) || !adj.has(endSlug)) return null

  const predecessor = new Map([[startSlug, null]])
  const queue = [startSlug]
  let head = 0

  while (head < queue.length) {
    const current = queue[head++]
    if (current === endSlug) break

    for (const { neighbor, link } of adj.get(current) ?? []) {
      if (predecessor.has(neighbor)) continue
      predecessor.set(neighbor, { from: current, link })
      queue.push(neighbor)
    }
  }

  if (!predecessor.has(endSlug)) return null

  const nodeSlugs = new Set()
  const linkIds = new Set()
  let cursor = endSlug
  while (cursor != null) {
    nodeSlugs.add(cursor)
    const step = predecessor.get(cursor)
    if (!step) break
    linkIds.add(linkId(step.link))
    cursor = step.from
  }

  return { nodeSlugs, linkIds }
}

export { linkId }
