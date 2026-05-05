<!--
  Task 1 — Refactoring:
    TYPE_COLORS below duplicates the same five keys as TYPE_LABELS in ChunkPanel.vue.
    Extract both into a unified src/utils/types.js config and import from there.

  Task 2 — Algorithm: see the TODO block inside <script setup>.
-->
<template>
  <div ref="containerEl" style="width:100%;height:100%" />
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import ForceGraph from 'force-graph'

// Task 1: unify with TYPE_LABELS in ChunkPanel.vue → src/utils/types.js
const TYPE_COLORS = {
  process_stage:   '#4f8ef7',
  machine_element: '#27ae60',
  machine_part:    '#16a085',
  procedure:       '#e67e22',
  concept:         '#8e44ad',
}
const DEFAULT_COLOR = '#95a5a6'

const props = defineProps({
  data:         { type: Object, default: () => ({ nodes: [], links: [] }) },
  selectedSlug: { type: String, default: null },
  // Task 3: add filterQuery prop here and use it in nodeCanvasObject
  // filterQuery: { type: String, default: '' },
})
const emit = defineEmits(['select'])

const containerEl = ref(null)
let fg = null

function nodeColor(node) {
  return TYPE_COLORS[node.type] || DEFAULT_COLOR
}

onMounted(() => {
  fg = ForceGraph()(containerEl.value)
    .graphData(props.data)
    .nodeId('slug')
    .nodeLabel('title')
    .linkColor(() => '#334455')
    .linkWidth(1)
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .linkLabel('label')
    .backgroundColor('#1a1a2e')
    .onNodeClick(node => emit('select', node.slug))
    .nodeCanvasObject((node, ctx, globalScale) => {
      const isSelected = node.slug === props.selectedSlug
      // Task 3: compute match opacity here using props.filterQuery
      // const isMatch = !props.filterQuery ||
      //   node.title.toLowerCase().includes(props.filterQuery.toLowerCase())
      // ctx.globalAlpha = isMatch ? 1 : 0.15

      const color = nodeColor(node)
      const r = isSelected ? 7 : 4

      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      if (globalScale >= 1.2) {
        const fontSize = Math.min(12 / globalScale, 3)
        ctx.font = `${fontSize}px Sans-Serif`
        ctx.fillStyle = 'rgba(220,220,220,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(node.title, node.x, node.y + r + fontSize + 1)
      }

      // Task 3: reset ctx.globalAlpha = 1 after drawing each node
    })
    .nodeCanvasObjectMode(() => 'replace')

  const { width, height } = containerEl.value.getBoundingClientRect()
  if (width && height) fg.width(width).height(height)

  const ro = new ResizeObserver(([e]) => {
    fg?.width(e.contentRect.width).height(e.contentRect.height)
  })
  ro.observe(containerEl.value)
  onUnmounted(() => ro.disconnect())
})

onUnmounted(() => {
  fg?.pauseAnimation()
  fg = null
})

watch(() => props.data, d => fg?.graphData(d))

watch(() => props.selectedSlug, slug => {
  if (!slug || !fg) return
  const node = fg.graphData().nodes.find(n => n.slug === slug)
  if (node?.x != null) fg.centerAt(node.x, node.y, 400)
})

// ─────────────────────────────────────────────────────────────────────────────
// TODO Task 2 — Shortest Path (BFS)
//
// Add a "Path" toggle button (above or overlaid on the graph). When active:
//
//   1. Track a `pathStart` and `pathEnd` slug via two successive node clicks.
//   2. Build an adjacency list from props.data.links (treat edges as undirected).
//   3. Run BFS from pathStart to pathEnd; record the predecessor map to
//      reconstruct the path.
//   4. Expose the path as a Set of slugs and a Set of link ids.
//   5. In nodeCanvasObject: full opacity + bright ring for path nodes;
//      dim (opacity 0.2) for all others.
//   6. In linkColor / linkWidth: highlight path edges; dim the rest.
//   7. If no path exists, show a "No path found" overlay.
//   8. Toggling Path Mode off resets all state.
//
// Constraints worth thinking about:
//   • force-graph mutates link objects (source/target become node refs).
//     Your adjacency list must handle both string slugs and node objects.
//   • BFS on the canvas thread is synchronous; keep it O(V + E).
// ─────────────────────────────────────────────────────────────────────────────
</script>
