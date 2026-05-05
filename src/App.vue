<template>
  <div class="app">
    <header class="app-header">
      <h1>Wiki Knowledge Graph</h1>
      <nav class="tabs">
        <button :class="['tab', { active: tab === 'graph' }]" @click="tab = 'graph'">Graph</button>
        <button :class="['tab', { active: tab === 'sources' }]" @click="tab = 'sources'">Source Files</button>
      </nav>
      <span v-if="tab === 'graph'" class="status">
        {{ graphData.nodes.length }} chunks · {{ graphData.links.length }} links
      </span>

      <!--
        TODO Task 3 — Live Graph Search
        Add a search <input> here. Pass the query string down to <Graph> as a
        new `filterQuery` prop. When the query is non-empty:
          • Nodes whose title matches (case-insensitive) render at full opacity.
          • All other nodes are dimmed to ~20% opacity inside nodeCanvasObject.
          • Show "N matches" count here and an × clear button.
        Keyboard: "/" focuses the input; Escape clears it.
        Hint: no re-init needed — the canvas loop already reads props every frame.
      -->
    </header>

    <div v-if="tab === 'graph'" class="app-body">
      <div class="graph-pane">
        <Graph
          :data="graphData"
          :selected-slug="selectedSlug"
          @select="onSelect"
        />
      </div>
      <div :class="['detail-pane', { open: panelOpen }]">
        <div v-if="chunkLoading" class="panel-loading">Loading…</div>
        <ChunkPanel
          v-else-if="chunk"
          :chunk="chunk"
          @navigate="selectedSlug = $event"
          @close="selectedSlug = null"
        />
        <div v-else class="empty-state">Select a node to explore</div>
      </div>
    </div>

    <SourcesView v-if="tab === 'sources'" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { graphData, getChunk } from './data/mock.js'
import Graph from './components/Graph.vue'
import ChunkPanel from './components/ChunkPanel.vue'
import SourcesView from './components/SourcesView.vue'

const PANEL_OPEN_DELAY_MS = 80
const CHUNK_LOAD_DELAY_MS = 80

const tab = ref('graph')
const selectedSlug = ref(null)
const chunk = ref(null)
const chunkLoading = ref(false)
const panelOpen = ref(false)
let panelOpenTimerId = null

function onSelect(slug) {
  selectedSlug.value = selectedSlug.value === slug ? null : slug
}

function cancelPanelOpenTimer() {
  if (panelOpenTimerId === null) return
  clearTimeout(panelOpenTimerId)
  panelOpenTimerId = null
}

function schedulePanelOpen() {
  panelOpenTimerId = setTimeout(function openPanel() {
    panelOpen.value = true
    panelOpenTimerId = null
  }, PANEL_OPEN_DELAY_MS)
}

function delay(ms) {
  return new Promise(function scheduleResolve(resolve) {
    setTimeout(resolve, ms)
  })
}

watch(selectedSlug, async function loadChunkForSlug(slug) {
  cancelPanelOpenTimer()
  if (!slug) {
    panelOpen.value = false
    chunk.value = null
    return
  }
  if (!panelOpen.value) schedulePanelOpen()
  chunkLoading.value = true
  await delay(CHUNK_LOAD_DELAY_MS)
  chunk.value = getChunk(slug)
  chunkLoading.value = false
})
</script>
