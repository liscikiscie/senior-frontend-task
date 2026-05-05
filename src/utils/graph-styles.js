import { TYPE_COLORS, DEFAULT_COLOR } from './types.js'
import { GRAPH_COLORS, GRAPH_DIMS } from '../domain/graph/theme.js'

export function nodeColor(node, onPath) {
  if (onPath) return GRAPH_COLORS.pathNode
  return TYPE_COLORS[node.type] || DEFAULT_COLOR
}

export function linkColor(onPath, dim) {
  if (onPath) return GRAPH_COLORS.pathLink
  if (dim) return GRAPH_COLORS.dimLink
  return GRAPH_COLORS.idleLink
}

export function linkWidth(onPath) {
  return onPath ? GRAPH_DIMS.linkWidth.path : GRAPH_DIMS.linkWidth.idle
}
