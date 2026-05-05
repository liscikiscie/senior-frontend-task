<template>
  <div class="app-body">
    <div class="sources-view">
      <div class="sources-header">{{ sources.length }} source file{{ sources.length !== 1 ? 's' : '' }}</div>
      <div class="sources-list">
        <div v-for="s in sources" :key="s.source_name" class="source-card">
          <button class="source-card-header" @click="toggle(s.source_name)">
            <div class="source-card-title">
              <span class="source-card-name">{{ s.source_name }}</span>
              <span class="source-card-meta">
                {{ s.source_part_count }} part{{ s.source_part_count !== 1 ? 's' : '' }}
                <template v-if="s.processor"> · {{ s.processor }} {{ s.processor_version }}</template>
                · {{ fmtDate(s.processed_at) }}
              </span>
            </div>
            <span class="source-card-chevron">{{ expanded[s.source_name] ? '▲' : '▼' }}</span>
          </button>

          <div v-if="expanded[s.source_name]" class="source-card-body">
            <div class="source-meta-grid">
              <template v-if="s.source_path">
                <span class="meta-label">Path</span>
                <span class="meta-value">{{ s.source_path }}</span>
              </template>
              <template v-if="s.source_sha256">
                <span class="meta-label">SHA-256</span>
                <span class="meta-value mono">{{ s.source_sha256 }}</span>
              </template>
            </div>

            <table v-if="s.parts.length" class="parts-table">
              <thead>
                <tr>
                  <th>#</th><th>Title</th><th>Start</th><th>End</th><th>Duration</th><th>Lang</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in s.parts"
                  :key="p.part_index"
                  :class="['part-row', { selected: isPartSelected(s.source_name, p.part_index) }]"
                  @click="selectPart(s.source_name, p.part_index)"
                >
                  <td class="mono">{{ p.part_index }}</td>
                  <td>{{ p.title }}</td>
                  <td class="mono">{{ fmtTime(p.start_seconds) ?? '—' }}</td>
                  <td class="mono">{{ fmtTime(p.end_seconds) ?? '—' }}</td>
                  <td class="mono">{{ fmtTime(p.duration_seconds) ?? '—' }}</td>
                  <td>{{ p.language ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div :class="['detail-pane', { open: !!selectedPart }]">
      <div v-if="partLoading" class="panel-loading">Loading…</div>
      <PartPanel
        v-else-if="partData"
        :part="partData"
        @close="selectedPart = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { sources, getPart } from '../data/mock.js'
import PartPanel from './PartPanel.vue'
import { fmtTime } from '../utils/format.js'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

const expanded    = ref({})
const selectedPart = ref(null)
const partData    = ref(null)
const partLoading = ref(false)

function toggle(name) {
  expanded.value[name] = !expanded.value[name]
}

function isPartSelected(sourceName, partIndex) {
  return selectedPart.value?.source_name === sourceName
    && selectedPart.value?.part_index === partIndex
}

function selectPart(sourceName, partIndex) {
  if (isPartSelected(sourceName, partIndex)) {
    selectedPart.value = null
  } else {
    selectedPart.value = { source_name: sourceName, part_index: partIndex }
  }
}

watch(selectedPart, async (sp) => {
  if (!sp) { partData.value = null; return }
  partLoading.value = true
  await new Promise(r => setTimeout(r, 80))
  partData.value = getPart(sp.source_name, sp.part_index)
  partLoading.value = false
})
</script>

<style scoped>
.sources-view {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.sources-loading {
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.sources-header {
  font-size: 12px;
  color: #666;
  margin-bottom: 14px;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 6px;
  overflow: hidden;
}

.source-card-header {
  width: 100%;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  text-align: left;
  gap: 12px;
}
.source-card-header:hover { background: #1a2a50; }

.source-card-title { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.source-card-name { font-size: 14px; font-weight: 600; color: #e8e8e8; word-break: break-all; }
.source-card-meta { font-size: 11px; color: #888; }
.source-card-chevron { font-size: 10px; color: #666; flex-shrink: 0; }

.source-card-body {
  padding: 0 16px 14px;
  border-top: 1px solid #0f3460;
}

.source-meta-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 14px;
  padding: 10px 0 12px;
  font-size: 12px;
}

.meta-label { color: #888; white-space: nowrap; }
.meta-value { color: #ccc; word-break: break-all; }

.mono { font-family: 'SF Mono', 'Fira Mono', monospace; font-size: 11px; }

.parts-table { width: 100%; border-collapse: collapse; font-size: 12px; }

.parts-table th {
  text-align: left;
  color: #888;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 5px 10px 5px 0;
  border-bottom: 1px solid #0f3460;
}

.parts-table td {
  padding: 5px 10px 5px 0;
  color: #ccc;
  border-bottom: 1px solid #0a1830;
  vertical-align: top;
}

.parts-table tr:last-child td { border-bottom: none; }
.part-row { cursor: pointer; }
.part-row:hover td { background: #1a2a50; }
.part-row.selected td { background: #0f3460; }
</style>
