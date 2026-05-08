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

let _labelScale = null
let _labelFontSize = 0
let _labelFontStr = ''

export function drawNodeLabel(ctx, node, globalScale, radius) {
  if (globalScale !== _labelScale) {
    _labelScale    = globalScale
    _labelFontSize = Math.min(12 / globalScale, 3)
    _labelFontStr  = `${_labelFontSize}px Sans-Serif`
  }
  ctx.font      = _labelFontStr
  ctx.fillStyle = 'rgba(220,220,220,0.85)'
  ctx.textAlign = 'center'
  ctx.fillText(node.title, node.x, node.y + radius + _labelFontSize + 1)
}
