<template>
  <div class="graph-wrapper">
    <div class="graph-toolbar">
      <button
        type="button"
        :class="['path-toggle', { active: pathActive }]"
        :aria-pressed="pathActive"
        aria-label="Toggle shortest-path mode"
        @click="onPathToggleClick"
      >
        {{ pathActive ? '✕ Path' : 'Path' }}
      </button>
      <span
        v-if="pathActive"
        class="path-hint"
        role="status"
        aria-live="polite"
      >
        {{ pathHint }}
      </span>
    </div>

    <div
      ref="containerEl"
      :class="['graph-canvas', { ready: graphReady }]"
    />

    <div
      v-if="pathNoPathFound"
      class="no-path-overlay"
      role="alert"
      aria-live="assertive"
    >
      No path found
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ForceGraph from 'force-graph'
import { TYPE_COLORS, DEFAULT_COLOR } from '../utils/types.js'
import { linkId } from '../utils/graph.js'
import { drawNodeCircle, drawHighlightRing, drawNodeLabel } from '../utils/canvas-render.js'
import { usePathMode } from '../composables/usePathMode.js'
import { useResizeObserver } from '../composables/useResizeObserver.js'
import { GRAPH_COLORS, GRAPH_DIMS } from '../domain/graph/theme.js'

const props = defineProps({
  data:         { type: Object, default: () => ({ nodes: [], links: [] }) },
  selectedSlug: { type: String, default: null },
})
const emit = defineEmits(['select', 'path-mode-change'])

const containerEl = ref(null)
const graphReady = ref(false)
let fg = null
let lastFocusedSlug = null
let resizeApplyTimerId = null
let pendingResizeRect = null

function getDataProp() {
  return props.data
}

function getSelectedSlugProp() {
  return props.selectedSlug
}

function getLinks() {
  return props.data.links
}

const {
  active:       pathActive,
  hint:         pathHint,
  noPathFound:  pathNoPathFound,
  toggle:       togglePath,
  pickNode:     pickPathNode,
  isNodeOnPath,
  isLinkOnPath,
  hasResult:    hasPathResult,
} = usePathMode(getLinks)

function onPathToggleClick() {
  const active = togglePath()
  emit('path-mode-change', active)
}

function handleNodeClick(node) {
  if (!pathActive.value) {
    emit('select', node.slug)
    return
  }
  pickPathNode(node.slug)
}

function exitPathMode() {
  togglePath()
  emit('path-mode-change', false)
}

function onWindowKeydown(event) {
  if (event.key === 'Escape' && pathActive.value) {
    exitPathMode()
  }
}

function isOnPath(node) {
  return isNodeOnPath(node.slug)
}

function isPathLink(link) {
  return isLinkOnPath(linkId(link))
}

function shouldDimNode(node) {
  return pathActive.value && hasPathResult() && !isOnPath(node)
}

function nodeColor(node) {
  if (isOnPath(node)) return GRAPH_COLORS.pathNode
  return TYPE_COLORS[node.type] || DEFAULT_COLOR
}

function buildLinkColor(link) {
  if (isPathLink(link)) return GRAPH_COLORS.pathLink
  if (pathActive.value && hasPathResult()) return GRAPH_COLORS.dimLink
  return GRAPH_COLORS.idleLink
}

function buildLinkWidth(link) {
  return isPathLink(link) ? GRAPH_DIMS.linkWidth.path : GRAPH_DIMS.linkWidth.idle
}

function getNodeLabel(node) {
  return node.title
}

function getLinkLabel(link) {
  return link.label
}

function getNodeRenderMode() {
  return 'replace'
}

function renderNode(node, ctx, globalScale) {
  const isSelected    = node.slug === props.selectedSlug
  const onPath        = isOnPath(node)
  const isHighlighted = isSelected || onPath
  const radius        = isHighlighted ? GRAPH_DIMS.nodeRadius.highlight : GRAPH_DIMS.nodeRadius.default

  ctx.globalAlpha = shouldDimNode(node) ? GRAPH_DIMS.dimNodeAlpha : 1

  drawNodeCircle(ctx, node, radius, nodeColor(node))

  if (isHighlighted) {
    const ringColor = onPath ? GRAPH_COLORS.pathNode : GRAPH_COLORS.selectedRing
    const ringWidth = onPath ? GRAPH_DIMS.ringWidth.path : GRAPH_DIMS.ringWidth.selected
    drawHighlightRing(ctx, node, radius, ringColor, ringWidth)
  }

  if (globalScale >= GRAPH_DIMS.labelVisibleScale) {
    drawNodeLabel(ctx, node, globalScale, radius)
  }

  ctx.globalAlpha = 1
}

function findNodeBySlug(slug) {
  if (!fg) return null
  for (const node of fg.graphData().nodes) {
    if (node.slug === slug) return node
  }
  return null
}

function syncGraphData(nextData) {
  fg?.graphData(nextData)
}

function centerOnSlug(slug) {
  const node = findNodeBySlug(slug)
  if (node?.x != null) fg.centerAt(node.x, node.y, GRAPH_DIMS.centerDurationMs)
}

function fitGraphToScreen() {
  if (!fg) return
  fg.zoomToFit(GRAPH_DIMS.closeFitDurationMs, GRAPH_DIMS.fitPaddingPx)
}

function focusOnSelectedNode(slug) {
  if (!slug) {
    if (lastFocusedSlug) {
      lastFocusedSlug = null
      fitGraphToScreen()
    }
    return
  }
  if (!fg) return
  lastFocusedSlug = slug
  centerOnSlug(slug)
}

function revealFittedGraph() {
  if (graphReady.value || !fg) return
  fg.zoomToFit(GRAPH_DIMS.fitDurationMs, GRAPH_DIMS.fitPaddingPx)
  graphReady.value = true
}

function performFinalFit() {
  if (!fg) return
  fg.zoomToFit(GRAPH_DIMS.finalFitDurationMs, GRAPH_DIMS.fitPaddingPx)
}

function initForceGraph() {
  fg = ForceGraph()(containerEl.value)
    .warmupTicks(GRAPH_DIMS.warmupTicks)
    .cooldownTicks(GRAPH_DIMS.cooldownTicks)
    .graphData(props.data)
    .nodeId('slug')
    .nodeLabel(getNodeLabel)
    .linkColor(buildLinkColor)
    .linkWidth(buildLinkWidth)
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .linkLabel(getLinkLabel)
    .backgroundColor(GRAPH_COLORS.bg)
    .onNodeClick(handleNodeClick)
    .onEngineStop(performFinalFit)
    .nodeCanvasObject(renderNode)
    .nodeCanvasObjectMode(getNodeRenderMode)
}

function applyInitialSize() {
  const { width, height } = containerEl.value.getBoundingClientRect()
  if (width && height) fg.width(width).height(height)
}

function applyPendingResize() {
  resizeApplyTimerId = null
  if (!fg || !pendingResizeRect) return
  fg.width(pendingResizeRect.width).height(pendingResizeRect.height)
  if (props.selectedSlug && lastFocusedSlug) centerOnSlug(lastFocusedSlug)
  pendingResizeRect = null
}

function handleContainerResize(entries) {
  if (!fg) return
  pendingResizeRect = entries[0].contentRect
  if (resizeApplyTimerId !== null) return
  resizeApplyTimerId = setTimeout(applyPendingResize, GRAPH_DIMS.resizeDebounceMs)
}

function teardownForceGraph() {
  if (resizeApplyTimerId !== null) {
    clearTimeout(resizeApplyTimerId)
    resizeApplyTimerId = null
  }
  pendingResizeRect = null
  fg?.pauseAnimation()
  fg = null
  lastFocusedSlug = null
  graphReady.value = false
}

watch(getDataProp, syncGraphData)
watch(getSelectedSlugProp, focusOnSelectedNode)

useResizeObserver(containerEl, handleContainerResize)

onMounted(async function setupGraph() {
  await nextTick()
  initForceGraph()
  applyInitialSize()
  setTimeout(revealFittedGraph, GRAPH_DIMS.revealDelayMs)
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(function teardownGraph() {
  window.removeEventListener('keydown', onWindowKeydown)
  teardownForceGraph()
})
</script>

<style scoped>
.graph-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
.graph-canvas {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.25s ease-out;
}
.graph-canvas.ready {
  opacity: 1;
}
.graph-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
}
.path-toggle {
  background: #2a2a3e;
  color: #ddd;
  border: 1px solid #3a3a52;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.path-toggle:hover {
  background: #34344a;
}
.path-toggle:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}
.path-toggle.active {
  background: #ffd166;
  color: #1a1a2e;
  border-color: #ffd166;
}
.path-hint {
  background: rgba(26, 26, 46, 0.85);
  color: #ddd;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}
.no-path-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(231, 76, 60, 0.92);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  pointer-events: none;
  z-index: 3;
}
</style>
