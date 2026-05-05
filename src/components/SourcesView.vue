<!--
  Task 1 — Refactoring:
    • fmtTime() is duplicated here, in ChunkPanel.vue, and in PartPanel.vue.
      Extract to src/utils/format.js and import it.
-->
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

// Task 1: extract to src/utils/format.js (also in ChunkPanel.vue and PartPanel.vue)
function fmtTime(secs) {
  if (secs == null) return null
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

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
