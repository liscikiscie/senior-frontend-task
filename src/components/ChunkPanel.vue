<template>
  <div class="chunk-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span :class="`type-badge type-${chunk.type}`">{{ t(TYPE_LABELS[chunk.type]) }}</span>
        <h2>{{ chunk.title }}</h2>
        <p v-if="chunk.summary" class="summary">{{ chunk.summary }}</p>
      </div>
      <button class="close-btn" :title="t('chunkPanel.close')" @click="emit('close')">&#x2715;</button>
    </div>

    <div class="panel-body">
      <div v-if="chunk.body_markdown" class="markdown-content" v-html="parsedBody" />

      <section v-if="outLinks.length || inLinks.length" class="panel-section">
        <h3>{{ t('chunkPanel.relatedChunks') }}</h3>
        <div v-if="outLinks.length" class="link-group">
          <h4>{{ t('chunkPanel.linksTo') }}</h4>
          <ul class="link-list">
            <li v-for="l in outLinks" :key="l.slug">
              <button class="link-btn" @click="emit('navigate', l.slug)">{{ l.title }}</button>
              <span v-if="l.label" class="link-label">{{ l.label }}</span>
            </li>
          </ul>
        </div>
        <div v-if="inLinks.length" class="link-group">
          <h4>{{ t('chunkPanel.referencedBy') }}</h4>
          <ul class="link-list">
            <li v-for="l in inLinks" :key="l.slug">
              <button class="link-btn" @click="emit('navigate', l.slug)">{{ l.title }}</button>
              <span v-if="l.label" class="link-label">{{ l.label }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section v-if="chunk.sources.length" class="panel-section">
        <h3>{{ t('chunkPanel.sources') }}</h3>
        <ul class="source-list">
          <li v-for="(s, i) in chunk.sources" :key="i" class="source-item">
            <span class="source-name">{{ s.source_name }}</span>
            <span class="source-meta">
              {{ t('chunkPanel.part', { n: s.part_index }) }}{{ formatTimeRange(s.start_seconds, s.end_seconds) }}
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
import { useI18n } from 'vue-i18n'
import { formatTimeRange } from '../utils/format.js'
import { TYPE_LABELS } from '../utils/types.js'

const props = defineProps({
  chunk: { type: Object, required: true },
})
const emit = defineEmits(['navigate', 'close'])

const { t } = useI18n()

const outLinks    = computed(() => props.chunk.links.filter(l => l.direction === 'out'))
const inLinks     = computed(() => props.chunk.links.filter(l => l.direction === 'in'))
// `marked` does NOT sanitize HTML — we render its output via v-html. Safe
// today because body_markdown comes from the static mock dataset (T3, no
// user input). If this ever consumes server/CMS content, plug in DOMPurify
// (or marked's `sanitizer` hook) before mounting it back onto the DOM.
const parsedBody  = computed(() => marked.parse(props.chunk.body_markdown || ''))
</script>

<style src="./chunk-panel.css" scoped></style>

<style scoped>
.panel-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #0f3460;
}

.panel-section h3 {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: #aaa;
  margin-bottom: 10px;
}

.link-group { margin-bottom: 12px; }
.link-group h4 { font-size: 11px; font-weight: 600; color: #999; margin-bottom: 6px; }

.link-list { list-style: none; }
.link-list li { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }

.link-btn {
  background: #0f2a4a;
  border: 1px solid #2a5080;
  color: #f0f0f0;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.link-btn:hover { background: #1a3a6a; color: #fff; }

.link-label { font-size: 11px; color: #888; font-style: italic; }

.source-list { list-style: none; }

.source-item {
  padding: 8px 10px;
  margin-bottom: 6px;
  background: #0f1e38;
  border-left: 2px solid #0f3460;
  border-radius: 3px;
}

.source-name { display: block; font-size: 12px; font-weight: 600; color: #bbb; word-break: break-all; }
.source-meta { display: block; font-size: 11px; color: #9aa4b3; margin-top: 2px; }
.source-note { font-size: 12px; color: #888; margin-top: 4px; line-height: 1.4; }
</style>
