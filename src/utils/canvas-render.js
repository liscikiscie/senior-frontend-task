export function drawNodeCircle(ctx, node, radius, fillColor) {
  ctx.beginPath()
  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = fillColor
  ctx.fill()
}

export function drawHighlightRing(ctx, node, radius, strokeColor, lineWidth) {
  ctx.beginPath()
  ctx.arc(node.x, node.y, radius + 2.5, 0, 2 * Math.PI)
  ctx.strokeStyle = strokeColor
  ctx.lineWidth   = lineWidth
  ctx.stroke()
}

export function drawNodeLabel(ctx, node, globalScale, radius) {
  const fontSize = Math.min(12 / globalScale, 3)
  ctx.font      = `${fontSize}px Sans-Serif`
  ctx.fillStyle = 'rgba(220,220,220,0.85)'
  ctx.textAlign = 'center'
  ctx.fillText(node.title, node.x, node.y + radius + fontSize + 1)
}
