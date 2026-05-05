import { onUnmounted, toValue } from 'vue'
import { GRAPH_DIMS } from '../domain/graph/theme.js'

export function useGraphCamera(fgSource, containerSource) {
  let lastFocusedSlug = null
  let actionTimerId = null

  function getFg() {
    return toValue(fgSource)
  }

  function getContainer() {
    return toValue(containerSource)
  }

  function findNodeBySlug(slug) {
    const fg = getFg()
    if (!fg) return null
    for (const node of fg.graphData().nodes) {
      if (node.slug === slug) return node
    }
    return null
  }

  function getVisibleOffset() {
    const fg = getFg()
    if (!fg) return { x: 0, y: 0 }
    const container = getContainer()
    const canvasW = fg.width()
    const canvasH = fg.height()
    const visibleW = container?.clientWidth ?? canvasW
    const visibleH = container?.clientHeight ?? canvasH
    const zoom = fg.zoom() || 1
    return {
      x: (canvasW - visibleW) / (2 * zoom),
      y: (canvasH - visibleH) / (2 * zoom),
    }
  }

  function centerOnSlug(slug) {
    const fg = getFg()
    if (!fg) return
    const node = findNodeBySlug(slug)
    if (node?.x == null) return
    const offset = getVisibleOffset()
    fg.centerAt(node.x + offset.x, node.y + offset.y, GRAPH_DIMS.centerDurationMs)
  }

  function fitToScreen() {
    getFg()?.zoomToFit(GRAPH_DIMS.closeFitDurationMs, GRAPH_DIMS.fitPaddingPx)
  }

  function cancelTimer() {
    if (actionTimerId === null) return
    clearTimeout(actionTimerId)
    actionTimerId = null
  }

  function schedule(action, delayMs) {
    cancelTimer()
    actionTimerId = setTimeout(function fire() {
      actionTimerId = null
      action()
    }, delayMs)
  }

  function focusSlug(slug) {
    cancelTimer()
    if (!slug) {
      if (lastFocusedSlug) {
        lastFocusedSlug = null
        schedule(fitToScreen, GRAPH_DIMS.closeFitDelayMs)
      }
      return
    }
    if (!getFg()) return
    lastFocusedSlug = slug
    schedule(function centerOnLastFocused() {
      if (lastFocusedSlug) centerOnSlug(lastFocusedSlug)
    }, GRAPH_DIMS.openCenterDelayMs)
  }

  function reset() {
    cancelTimer()
    lastFocusedSlug = null
  }

  onUnmounted(reset)

  return { focusSlug, reset }
}
