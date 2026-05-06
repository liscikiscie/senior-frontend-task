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
    <span class="sr-only" aria-live="polite">{{ pathRouteAnnouncement }}</span>
  </div>

  <div
    v-if="pathNoPathFound"
    class="no-path-toast"
    role="alert"
    aria-live="assertive"
  >
    <div class="no-path-text">
      <strong>{{ t('graph.noPath') }}</strong>
      <span class="no-path-hint">{{ t('graph.noPathHint') }}</span>
    </div>
    <button
      type="button"
      class="no-path-dismiss"
      :aria-label="t('graph.dismissNoPath')"
      @click="$emit('dismiss-no-path')"
    >&#x2715;</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  pathActive:             { type: Boolean, required: true },
  pathHint:               { type: String,  default: '' },
  pathRouteAnnouncement:  { type: String,  default: '' },
  pathNoPathFound:        { type: Boolean, default: false },
})
defineEmits(['toggle', 'dismiss-no-path'])

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
.no-path-toast {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(231, 76, 60, 0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 3;
  max-width: calc(100% - 24px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.no-path-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.no-path-text strong {
  font-weight: 600;
}
.no-path-hint {
  font-size: 11px;
  opacity: 0.9;
}

.no-path-dismiss {
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 6px;
  min-width: 28px;
  min-height: 28px;
  border-radius: 3px;
}
.no-path-dismiss:hover { background: rgba(255, 255, 255, 0.15); }
.no-path-dismiss:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 1px;
}
</style>
