/**
 * Returns a Set of node slugs whose title case-insensitively contains `query`,
 * or `null` when `query` is empty / whitespace.
 *
 * `null` (not an empty Set) is the "no filter active" sentinel — callers can
 * branch on it without touching set semantics.
 */
export function matchedSlugs(nodes, query) {
  const needle = query?.trim().toLowerCase()
  if (!needle) return null
  const out = new Set()
  for (const node of nodes) {
    if (node.title?.toLowerCase().includes(needle)) out.add(node.slug)
  }
  return out
}
