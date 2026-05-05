<!--
  Task 1 — Refactoring:
    • fmtTime() is duplicated here, in SourcesView.vue, and in PartPanel.vue.
      Extract to src/utils/format.js and import it.
    • TYPE_LABELS below duplicates the same five keys as TYPE_COLORS in Graph.vue.
      Unify into src/utils/types.js.
-->
<template>
  <div class="chunk-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span :class="`type-badge type-${chunk.type}`">{{ typeLabel }}</span>
        <h2>{{ chunk.title }}</h2>
        <p v-if="chunk.summary" class="summary">{{ chunk.summary }}</p>
      </div>
      <button class="close-btn" title="Close" @click="emit('close')">&#x2715;</button>
    </div>

    <div class="panel-body">
      <div v-if="chunk.body_markdown" class="markdown-content" v-html="parsedBody" />

      <section v-if="outLinks.length || inLinks.length" class="panel-section">
        <h3>Related Chunks</h3>
        <div v-if="outLinks.length" class="link-group">
          <h4>Links to</h4>
          <ul class="link-list">
            <li v-for="l in outLinks" :key="l.slug">
              <button class="link-btn" @click="emit('navigate', l.slug)">{{ l.title }}</button>
              <span v-if="l.label" class="link-label">{{ l.label }}</span>
            </li>
          </ul>
        </div>
        <div v-if="inLinks.length" class="link-group">
          <h4>Referenced by</h4>
          <ul class="link-list">
            <li v-for="l in inLinks" :key="l.slug">
              <button class="link-btn" @click="emit('navigate', l.slug)">{{ l.title }}</button>
              <span v-if="l.label" class="link-label">{{ l.label }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section v-if="chunk.sources.length" class="panel-section">
        <h3>Sources</h3>
        <ul class="source-list">
          <li v-for="(s, i) in chunk.sources" :key="i" class="source-item">
            <span class="source-name">{{ s.source_name }}</span>
            <span class="source-meta">
              Part {{ s.part_index }}{{ timeRange(s.start_seconds, s.end_seconds) }}
            </span>
            <p v-if="s.note" class="source-note">{{ s.note }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

// Task 1: extract to src/utils/types.js (also duplicated as TYPE_COLORS in Graph.vue)
const TYPE_LABELS = {
  process_stage:   'Process Stage',
  machine_element: 'Machine Element',
  machine_part:    'Machine Part',
  procedure:       'Procedure',
  concept:         'Concept',
}

// Task 1: extract to src/utils/format.js (also in SourcesView.vue and PartPanel.vue)
function fmtTime(secs) {
  if (secs == null) return null
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function timeRange(start, end) {
  const s = fmtTime(start)
  const e = fmtTime(end)
  return s ? ` · ${s} – ${e}` : ''
}

const props = defineProps({
  chunk: { type: Object, required: true },
})
const emit = defineEmits(['navigate', 'close'])

const typeLabel   = computed(() => TYPE_LABELS[props.chunk.type] || props.chunk.type)
const outLinks    = computed(() => props.chunk.links.filter(l => l.direction === 'out'))
const inLinks     = computed(() => props.chunk.links.filter(l => l.direction === 'in'))
const parsedBody  = computed(() => marked.parse(props.chunk.body_markdown || ''))
</script>
