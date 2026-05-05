import { drawNodeCircle, drawHighlightRing, drawNodeLabel } from './canvas-render.js'
import { GRAPH_COLORS, GRAPH_DIMS } from '../domain/graph/theme.js'
import { nodeColor } from './graph-styles.js'

export function drawNode(ctx, node, globalScale, state) {
  const { isSelected, isOnPath, shouldDim } = state
  const isHighlighted = isSelected || isOnPath
  const radius = isHighlighted ? GRAPH_DIMS.nodeRadius.highlight : GRAPH_DIMS.nodeRadius.default

  ctx.globalAlpha = shouldDim ? GRAPH_DIMS.dimNodeAlpha : 1
  drawNodeCircle(ctx, node, radius, nodeColor(node, isOnPath))

  if (isHighlighted) {
    const ringColor = isOnPath ? GRAPH_COLORS.pathNode : GRAPH_COLORS.selectedRing
    const ringWidth = isOnPath ? GRAPH_DIMS.ringWidth.path : GRAPH_DIMS.ringWidth.selected
    drawHighlightRing(ctx, node, radius, ringColor, ringWidth)
  }

  if (globalScale >= GRAPH_DIMS.labelVisibleScale) {
    const labelRadius = isHighlighted ? radius + GRAPH_DIMS.ringClearance : radius
    drawNodeLabel(ctx, node, globalScale, labelRadius)
  }

  ctx.globalAlpha = 1
}
