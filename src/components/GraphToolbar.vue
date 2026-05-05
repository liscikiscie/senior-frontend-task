<template>
  <div class="graph-toolbar">
    <button
      type="button"
      :class="['path-toggle', { active: pathActive }]"
      :aria-pressed="pathActive"
      @click="$emit('toggle')"
    >
      {{ pathActive ? `✕ ${t('graph.pathMode')}` : t('graph.pathMode') }}
    </button>
    <span
      v-if="pathActive"
      class="path-hint"
      role="status"
      aria-live="polite"
    >
      {{ pathHint }}
    </span>
  </div>

  <div
    v-if="pathNoPathFound"
    class="no-path-overlay"
    role="alert"
    aria-live="assertive"
  >
    {{ t('graph.noPath') }}
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  pathActive:       { type: Boolean, required: true },
  pathHint:         { type: String,  default: '' },
  pathNoPathFound:  { type: Boolean, default: false },
})
defineEmits(['toggle'])

const { t } = useI18n()
</script>

<style scoped>
.graph-toolbar {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
}
.path-toggle {
  background: #2a2a3e;
  color: #ddd;
  border: 1px solid #3a3a52;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.path-toggle:hover {
  background: #34344a;
}
.path-toggle:focus-visible {
  outline: 2px solid #ffd166;
  outline-offset: 2px;
}
.path-toggle.active {
  background: #ffd166;
  color: #1a1a2e;
  border-color: #ffd166;
}
.path-hint {
  background: rgba(26, 26, 46, 0.85);
  color: #ddd;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}
.no-path-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(231, 76, 60, 0.92);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  pointer-events: none;
  z-index: 3;
}
</style>
