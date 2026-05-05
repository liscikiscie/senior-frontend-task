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
import { watch, ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GraphToolbar from './GraphToolbar.vue'
import { linkId } from '../utils/graph.js'
import { escapeHtml } from '../utils/escape-html.js'
import { linkColor, linkWidth } from '../utils/graph-styles.js'
import { drawNode } from '../utils/graph-render.js'
import { matchedSlugs } from '../utils/search.js'
import { usePathMode } from '../composables/usePathMode.js'
import { useGraphCamera } from '../composables/useGraphCamera.js'
import { useForceGraph } from '../composables/useForceGraph.js'

const props = defineProps({
  data:         { type: Object, default: () => ({ nodes: [], links: [] }) },
  selectedSlug: { type: String, default: null },
  filterQuery:  { type: String, default: '' },
})
const emit = defineEmits(['select', 'path-mode-change'])

const containerEl = ref(null)

function getLinks() {
  return props.data.links
}

const searchMatches = computed(function computeSearchMatches() {
  return matchedSlugs(props.data.nodes, props.filterQuery)
})

function isSearchDimmed(node) {
  const matches = searchMatches.value
  return matches !== null && !matches.has(node.slug)
}

const { t } = useI18n()

const {
  active:       pathActive,
  state:        pathState,
  pathSize,
  noPathFound:  pathNoPathFound,
  toggle:       togglePath,
  pickNode:     pickPathNode,
  isNodeOnPath,
  isLinkOnPath,
  hasResult:    hasPathResult,
} = usePathMode(getLinks)

const pathHint = computed(function buildPathHint() {
  switch (pathState.value) {
    case 'pickStart': return t('graph.selectStart')
    case 'pickEnd':   return t('graph.selectEnd')
    case 'found':     return t('graph.stepsCount', pathSize.value, { n: pathSize.value })
    case 'notFound':  return t('graph.noPath')
    default:          return ''
  }
})

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
function getLinkColor(link)     { return linkColor(isPathLink(link), pathActive.value && hasPathResult()) }
function getLinkWidth(link)     { return linkWidth(isPathLink(link)) }
function getLinkParticles(link) { return isPathLink(link) ? 2 : 0 }
function getNodeRenderMode()    { return 'replace' }

function renderNode(node, ctx, globalScale) {
  const onPath    = isOnPath(node)
  const dimByPath = pathActive.value && hasPathResult() && !onPath
  drawNode(ctx, node, globalScale, {
    isSelected: node.slug === props.selectedSlug,
    isOnPath:   onPath,
    shouldDim:  dimByPath || isSearchDimmed(node),
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
    .linkDirectionalParticles(getLinkParticles)
    .linkDirectionalParticleWidth(3)
    .linkDirectionalParticleSpeed(0.008)
    .onNodeClick(handleNodeClick)
    .nodeCanvasObject(renderNode)
    .nodeCanvasObjectMode(getNodeRenderMode)
}

const { graphReady, getInstance } = useForceGraph(containerEl, configureForceGraph)
const camera = useGraphCamera(getInstance, containerEl)

watch(() => props.data,         function syncGraphData(next) { getInstance()?.graphData(next) })
watch(() => props.selectedSlug, camera.focusSlug)
// force-graph 1.x doesn't expose a public `refresh()` method, and after the
// physics engine cools down the canvas only repaints on user interaction
// (zoom, pan, hover). Without an explicit nudge, Vue state changes that
// affect the per-node dim/highlight (search filter, path-mode state) update
// the underlying refs but the canvas keeps showing the previous frame.
// Re-setting the camera at its current position with 0 ms duration is a
// no-op visually but reliably triggers a re-render.
function refreshGraphView() {
  const fg = getInstance()
  if (!fg) return
  // force-graph caches the resolved per-link particle count on first bind;
  // re-applying the setter forces it to walk the link list and pick up the
  // new isPathLink() values for the current path state.
  fg.linkDirectionalParticles(getLinkParticles)
  const center = fg.centerAt() ?? { x: 0, y: 0 }
  fg.centerAt(center.x, center.y, 0)
}

watch(() => props.filterQuery, refreshGraphView)
watch(pathActive,              refreshGraphView)
watch(pathState,               refreshGraphView)

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
