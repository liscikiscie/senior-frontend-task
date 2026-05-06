<template>
  <div class="app">
    <header class="app-header">
      <h1>{{ t('app.title') }}</h1>
      <nav class="tabs" :aria-label="t('app.tabs.aria')">
        <button
          type="button"
          :class="['tab', { active: tab === 'graph' }]"
          :aria-current="tab === 'graph' ? 'page' : undefined"
          @click="tab = 'graph'"
        >{{ t('app.tabs.graph') }}</button>
        <button
          type="button"
          :class="['tab', { active: tab === 'sources' }]"
          :aria-current="tab === 'sources' ? 'page' : undefined"
          @click="tab = 'sources'"
        >{{ t('app.tabs.sources') }}</button>
      </nav>

      <span v-if="tab === 'graph'" class="status">
        {{ t('app.chunksCount', graphData.nodes.length, { n: graphData.nodes.length }) }} ·
        {{ t('app.linksCount',  graphData.links.length, { n: graphData.links.length }) }}
      </span>

      <div v-if="tab === 'graph'" class="search">
        <input
          ref="searchInputEl"
          v-model="searchQuery"
          type="search"
          class="search-input"
          :placeholder="t('app.searchPlaceholder')"
          :aria-label="t('app.searchAria')"
          @keydown.escape="onSearchEscape"
        />
        <span v-if="searchActive" class="search-count" role="status" aria-live="polite">
          {{ t('app.matchesCount', matchCount, { n: matchCount }) }}
        </span>
        <button
          v-if="searchActive"
          type="button"
          class="search-clear"
          :aria-label="t('app.clearSearch')"
          @click="clearSearch"
        >
          ×
        </button>
      </div>

      <div class="lang-switcher" role="group" :aria-label="t('app.language')">
        <button
          v-for="code in SUPPORTED_LOCALES"
          :key="code"
          type="button"
          :class="['lang-btn', { active: locale === code }]"
          :aria-pressed="locale === code"
          :title="t('app.switchToLanguage', { name: t(`app.languageNames.${code}`) })"
          @click="setLocale(code)"
        >
          {{ code.toUpperCase() }}
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
          @path-mode-change="onPathModeChange"
        />
      </div>
      <div :class="['detail-pane', { open: panelOpen }]">
        <div v-if="chunkLoading" class="panel-loading">{{ t('app.loading') }}</div>
        <ChunkPanel
          v-else-if="chunk"
          :chunk="chunk"
          @navigate="selectedSlug = $event"
          @close="selectedSlug = null"
        />
        <div v-else class="empty-state">{{ t('app.selectNode') }}</div>
      </div>
    </div>

    <SourcesView v-if="tab === 'sources'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { translatedGraphData, translatedChunk } from './data/translated.js'
import { matchedSlugs } from './utils/search.js'
import { SUPPORTED_LOCALES, setLocale } from './i18n/index.js'
import Graph from './components/Graph.vue'
import ChunkPanel from './components/ChunkPanel.vue'
import SourcesView from './components/SourcesView.vue'

const PANEL_OPEN_DELAY_MS = 80
const CHUNK_LOAD_DELAY_MS = 80

const { t, locale } = useI18n()

const tab = ref('graph')
const selectedSlug = ref(null)
const chunkSlug = ref(null)
const chunkLoading = ref(false)
const panelOpen = ref(false)
const searchQuery = ref('')
const searchInputEl = ref(null)
let panelOpenTimerId = null

const graphData = computed(function buildGraphData() {
  void locale.value
  return translatedGraphData()
})

const chunk = computed(function buildChunk() {
  void locale.value
  if (!chunkSlug.value) return null
  return translatedChunk(chunkSlug.value)
})

const matched = computed(function computeMatched() {
  return matchedSlugs(graphData.value.nodes, searchQuery.value)
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

function onPathModeChange(active) {
  if (active) selectedSlug.value = null
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
    chunkSlug.value = null
    return
  }
  if (!panelOpen.value) schedulePanelOpen()
  chunkLoading.value = true
  await delay(CHUNK_LOAD_DELAY_MS)
  chunkSlug.value = slug
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
.tab:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}
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
  color: #9aa4b3;
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
  color: #9aa4b3;
  white-space: nowrap;
}

.lang-switcher {
  display: flex;
  gap: 2px;
}

.lang-btn {
  background: none;
  border: 1px solid #2a5080;
  color: #888;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.1s, background 0.1s;
}
.lang-btn:hover {
  color: #ccc;
  background: #1a3a6a;
}
.lang-btn.active {
  background: #0f3460;
  color: #e8e8e8;
}
.lang-btn:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}

.graph-pane {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #9aa4b3;
  font-size: 13px;
}
</style>
