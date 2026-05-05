import { ref, onMounted, onUnmounted, nextTick, toValue } from 'vue'
import ForceGraph from 'force-graph'
import { GRAPH_COLORS, GRAPH_DIMS } from '../domain/graph/theme.js'
import { useResizeObserver } from './useResizeObserver.js'

export function useForceGraph(containerSource, configure) {
  const graphReady = ref(false)
  let fg = null

  function getInstance() {
    return fg
  }

  function applyInitialSize(el) {
    const { width, height } = el.getBoundingClientRect()
    if (width && height) fg.width(width).height(height)
  }

  function handleContainerResize(entries) {
    if (!fg) return
    const [entry] = entries
    const { width, height } = entry.contentRect
    const currentW = fg.width()
    const currentH = fg.height()
    if (width <= currentW && height <= currentH) return
    fg.width(Math.max(width, currentW)).height(Math.max(height, currentH))
  }

  function revealFittedGraph() {
    if (graphReady.value || !fg) return
    fg.zoomToFit(GRAPH_DIMS.fitDurationMs, GRAPH_DIMS.fitPaddingPx)
    graphReady.value = true
  }

  function performFinalFit() {
    fg?.zoomToFit(GRAPH_DIMS.finalFitDurationMs, GRAPH_DIMS.fitPaddingPx)
  }

  useResizeObserver(containerSource, handleContainerResize)

  onMounted(async function setupGraph() {
    await nextTick()
    const el = toValue(containerSource)
    if (!el) return
    fg = ForceGraph()(el)
      .warmupTicks(GRAPH_DIMS.warmupTicks)
      .cooldownTicks(GRAPH_DIMS.cooldownTicks)
      .backgroundColor(GRAPH_COLORS.bg)
      .nodeId('slug')
      .onEngineStop(performFinalFit)
    configure(fg)
    applyInitialSize(el)
    setTimeout(revealFittedGraph, GRAPH_DIMS.revealDelayMs)
  })

  onUnmounted(function teardownGraph() {
    fg?.pauseAnimation()
    fg = null
    graphReady.value = false
  })

  return { graphReady, getInstance }
}
