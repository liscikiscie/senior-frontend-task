<template>
  <div class="app">
    <a class="skip-link" href="#main-content">{{ t('app.skipToContent') }}</a>
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
          aria-describedby="search-shortcut"
          @keydown.escape="onSearchEscape"
        />
        <kbd v-if="!searchQuery" class="search-kbd" aria-hidden="true">/</kbd>
        <span id="search-shortcut" class="sr-only">{{ t('app.searchShortcutHint') }}</span>
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

    <main id="main-content" tabindex="-1">
      <div v-if="tab === 'graph'" class="app-body">
        <div class="graph-pane">
          <Graph
            :data="graphData"
            :selected-slug="selectedSlug"
            :filter-query="searchQuery"
            @select="onSelect"
            @path-mode-change="onPathModeChange"
          />
          <div
            v-if="searchActive && matchCount === 0"
            class="no-matches-overlay"
            role="status"
            aria-live="polite"
          >
            <p class="no-matches-text">{{ t('app.noMatchesFor', { query: searchQuery }) }}</p>
            <button type="button" class="no-matches-clear" @click="clearSearch">
              {{ t('app.clearSearch') }}
            </button>
          </div>
        </div>
        <aside
          :class="['detail-pane', { open: panelOpen }]"
          :aria-label="t('app.detailsAria')"
        >
          <div v-if="chunkLoading" class="panel-loading">{{ t('app.loading') }}</div>
          <ChunkPanel
            v-else-if="chunk"
            :chunk="chunk"
            @navigate="selectedSlug = $event"
            @close="selectedSlug = null"
          />
          <div v-else class="empty-state">{{ t('app.selectNode') }}</div>
        </aside>
      </div>

      <SourcesView v-if="tab === 'sources'" />
    </main>
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

// Token-guarded async watcher: a fast A → B click (within CHUNK_LOAD_DELAY_MS)
// would otherwise let A's awaited continuation overwrite B's result. Each
// invocation captures its own requestId; only the latest survives the await.
let chunkLoadRequestId = 0
watch(selectedSlug, async function loadChunkForSlug(slug) {
  const requestId = ++chunkLoadRequestId
  cancelPanelOpenTimer()
  if (!slug) {
    panelOpen.value = false
    chunkSlug.value = null
    chunkLoading.value = false
    return
  }
  if (!panelOpen.value) schedulePanelOpen()
  chunkLoading.value = true
  await delay(CHUNK_LOAD_DELAY_MS)
  if (requestId !== chunkLoadRequestId) return
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
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .app-header {
    gap: 10px;
    padding: 8px 12px;
  }
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
  min-height: 28px;
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
  min-width: 0;
  max-width: 100%;
}

@media (max-width: 768px) {
  .search-input {
    width: 160px;
  }
}
.search-input::placeholder {
  color: #9aa4b3;
}
.search-input:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}

.search-kbd {
  font-family: 'SF Mono', 'Fira Mono', monospace;
  font-size: 11px;
  background: #2a5080;
  color: #ccc;
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid #3a6090;
  line-height: 1;
  user-select: none;
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
  min-width: 28px;
  min-height: 28px;
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
  min-width: 32px;
  min-height: 28px;
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

.no-matches-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(15, 42, 74, 0.94);
  border: 1px solid #2a5080;
  color: #e8e8e8;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 80%;
  z-index: 3;
}

.no-matches-text {
  font-size: 14px;
  word-break: break-word;
  text-align: center;
}

.no-matches-clear {
  background: #ffd166;
  color: #1a1a2e;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.no-matches-clear:hover { background: #ffdd88; }
.no-matches-clear:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}
</style>
