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
       <div v-if="tab === 'graph'" class="search">
        <input
          ref="searchInputEl"
          v-model="searchQuery"
          type="search"
          class="search-input"
          placeholder="Search nodes…  (press /)"
          aria-label="Search nodes by title"
          @keydown.escape="onSearchEscape"
        />
        <span v-if="searchActive" class="search-count" role="status" aria-live="polite">
          {{ matchCount }} {{ matchCount === 1 ? 'match' : 'matches' }}
        </span>
        <button
          v-if="searchActive"
          type="button"
          class="search-clear"
          aria-label="Clear search"
          @click="clearSearch"
        >
          ×
        </button>
      </div>
    </header>

    <div v-if="tab === 'graph'" class="app-body">
      <div class="graph-pane">
        <Graph
          :data="graphData"
          :selected-slug="selectedSlug"
          :filter-query="searchQuery"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { graphData, getChunk } from './data/mock.js'
import { matchedSlugs } from './utils/search.js'
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
const searchQuery = ref('')
const searchInputEl = ref(null)
let panelOpenTimerId = null

const matched = computed(function computeMatched() {
  return matchedSlugs(graphData.nodes, searchQuery.value)
})
const searchActive = computed(function isSearchActive() {
  return matched.value !== null
})
const matchCount = computed(function countMatches() {
  return matched.value?.size ?? 0
})

function onSelect(slug) {
  selectedSlug.value = selectedSlug.value === slug ? null : slug
}

function clearSearch() {
  searchQuery.value = ''
}

function onSearchEscape() {
  if (searchQuery.value) clearSearch()
  searchInputEl.value?.blur()
}

function isTypingTarget(target) {
  if (!target) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function onWindowKeydown(event) {
  if (event.key === '/' && !isTypingTarget(event.target)) {
    event.preventDefault()
    searchInputEl.value?.focus()
    searchInputEl.value?.select()
  }
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

onMounted(function bindShortcuts() {
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(function unbindShortcuts() {
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 18px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
  flex-shrink: 0;
}

.app-header h1 {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 2px;
}

.tab {
  background: none;
  border: 1px solid transparent;
  color: #888;
  font-size: 13px;
  padding: 4px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.1s, background 0.1s;
}
.tab:hover { color: #ccc; }
.tab.active {
  background: #0f3460;
  border-color: #1a4a80;
  color: #e8e8e8;
}

.search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.search-input {
  background: #0f2a4a;
  color: #e8e8e8;
  border: 1px solid #2a5080;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  width: 240px;
}
.search-input::placeholder {
  color: #6a7a90;
}
.search-input:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}

.search-count {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.search-clear {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  line-height: 1;
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 3px;
}
.search-clear:hover {
  background: #1a3a6a;
  color: #fff;
}
.search-clear:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}

.status {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.graph-pane {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #555;
  font-size: 13px;
}
</style>
