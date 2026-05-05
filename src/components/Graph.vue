<template>
  <div class="graph-wrapper">
    <GraphToolbar
      :path-active="pathActive"
      :path-hint="pathHint"
      :path-no-path-found="pathNoPathFound"
      @toggle="onPathToggleClick"
    />

    <div
      ref="containerEl"
      :class="['graph-canvas', { ready: graphReady }]"
    />
  </div>
</template>

<script setup>
import { watch, ref, onMounted, onUnmounted } from 'vue'
import GraphToolbar from './GraphToolbar.vue'
import { linkId } from '../utils/graph.js'
import { escapeHtml } from '../utils/escape-html.js'
import { linkColor, linkWidth } from '../utils/graph-styles.js'
import { drawNode } from '../utils/graph-render.js'
import { usePathMode } from '../composables/usePathMode.js'
import { useGraphCamera } from '../composables/useGraphCamera.js'
import { useForceGraph } from '../composables/useForceGraph.js'

const props = defineProps({
  data:         { type: Object, default: () => ({ nodes: [], links: [] }) },
  selectedSlug: { type: String, default: null },
})
const emit = defineEmits(['select', 'path-mode-change'])

const containerEl = ref(null)

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
  emit('path-mode-change', togglePath())
}

function handleNodeClick(node) {
  if (!pathActive.value) {
    emit('select', node.slug)
    return
  }
  pickPathNode(node.slug)
}

function onWindowKeydown(event) {
  if (event.key === 'Escape' && pathActive.value) {
    emit('path-mode-change', togglePath())
  }
}

function isOnPath(node) {
  return isNodeOnPath(node.slug)
}

function isPathLink(link) {
  return isLinkOnPath(linkId(link))
}

function getNodeLabel(node)  { return escapeHtml(node.title) }
function getLinkLabel(link)  { return escapeHtml(link.label) }
function getLinkColor(link)  { return linkColor(isPathLink(link), pathActive.value && hasPathResult()) }
function getLinkWidth(link)  { return linkWidth(isPathLink(link)) }
function getNodeRenderMode() { return 'replace' }

function renderNode(node, ctx, globalScale) {
  const onPath = isOnPath(node)
  drawNode(ctx, node, globalScale, {
    isSelected: node.slug === props.selectedSlug,
    isOnPath:   onPath,
    shouldDim:  pathActive.value && hasPathResult() && !onPath,
  })
}

function configureForceGraph(fg) {
  fg
    .graphData(props.data)
    .nodeLabel(getNodeLabel)
    .linkLabel(getLinkLabel)
    .linkColor(getLinkColor)
    .linkWidth(getLinkWidth)
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .onNodeClick(handleNodeClick)
    .nodeCanvasObject(renderNode)
    .nodeCanvasObjectMode(getNodeRenderMode)
}

const { graphReady, getInstance } = useForceGraph(containerEl, configureForceGraph)
const camera = useGraphCamera(getInstance, containerEl)

watch(() => props.data,         function syncGraphData(next) { getInstance()?.graphData(next) })
watch(() => props.selectedSlug, camera.focusSlug)

onMounted(function bindKeydown() {
  window.addEventListener('keydown', onWindowKeydown)
})
onUnmounted(function unbindKeydown() {
  window.removeEventListener('keydown', onWindowKeydown)
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
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.25s ease-out;
}
.graph-canvas.ready {
  opacity: 1;
}
</style>
