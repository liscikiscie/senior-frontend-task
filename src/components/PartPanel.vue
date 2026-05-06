<template>
  <div class="chunk-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="type-badge type-procedure">{{ t('partPanel.sourcePart') }}</span>
        <h2>{{ part.title }}</h2>
        <p class="summary">
          {{ part.source_name }} · {{ t('chunkPanel.part', { n: part.part_index }) }}{{ timeRange }}{{ langSuffix }}
        </p>
      </div>
      <button
        type="button"
        class="close-btn"
        :title="t('partPanel.close')"
        :aria-label="t('partPanel.close')"
        @click="emit('close')"
      >&#x2715;</button>
    </div>
    <div class="panel-body">
      <div class="markdown-content" v-html="parsedBody" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { useI18n } from 'vue-i18n'
import { formatTimeRange } from '../utils/format.js'

const props = defineProps({
  part: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const { t } = useI18n()

const timeRange  = computed(() => formatTimeRange(props.part.start_seconds, props.part.end_seconds))
const langSuffix = computed(() => props.part.language ? ` · ${props.part.language}` : '')
// `marked` does NOT sanitize HTML — we render its output via v-html. Safe
// today because body_markdown comes from the static mock dataset (T3, no
// user input). If this ever consumes server/CMS content, plug in DOMPurify
// (or marked's `sanitizer` hook) before mounting it back onto the DOM.
const parsedBody = computed(() => marked.parse(props.part.body_markdown || ''))
</script>

<style src="./chunk-panel.css" scoped></style>
