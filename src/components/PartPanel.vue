<template>
  <div class="chunk-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="type-badge type-procedure">Source Part</span>
        <h2>{{ part.title }}</h2>
        <p class="summary">
          {{ part.source_name }} · Part {{ part.part_index }}{{ timeRange }}{{ langSuffix }}
        </p>
      </div>
      <button class="close-btn" title="Close" @click="emit('close')">&#x2715;</button>
    </div>
    <div class="panel-body">
      <div class="markdown-content" v-html="parsedBody" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import { formatTimeRange } from '../utils/format.js'

const props = defineProps({
  part: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const timeRange  = computed(() => formatTimeRange(props.part.start_seconds, props.part.end_seconds))
const langSuffix = computed(() => props.part.language ? ` · ${props.part.language}` : '')
const parsedBody = computed(() => marked.parse(props.part.body_markdown || ''))
</script>
