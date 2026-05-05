import { ref, computed, readonly, toValue } from 'vue'
import { findShortestPath } from '../utils/graph.js'

export function usePathMode(linksSource) {
  const active = ref(false)
  const start  = ref(null)
  const end    = ref(null)
  const result = ref(null)

  function getNoPathFound() {
    return active.value && start.value && end.value && result.value === null
  }

  function getHint() {
    if (!start.value) return 'Click a node to set START'
    if (!end.value)   return 'Click another node to set END'
    if (result.value) return `Path: ${result.value.nodeSlugs.size} nodes`
    return 'No path found — click again to retry'
  }

  const noPathFound = computed(getNoPathFound)
  const hint        = computed(getHint)

  function reset() {
    start.value  = null
    end.value    = null
    result.value = null
  }

  function toggle() {
    active.value = !active.value
    reset()
    return active.value
  }

  function pickNode(slug) {
    const queryComplete = start.value && end.value
    if (!start.value || queryComplete) {
      start.value  = slug
      end.value    = null
      result.value = null
      return
    }
    end.value    = slug
    result.value = findShortestPath(toValue(linksSource), start.value, end.value)
  }

  function isNodeOnPath(slug) {
    return result.value?.nodeSlugs.has(slug) ?? false
  }

  function isLinkOnPath(linkIdStr) {
    return result.value?.linkIds.has(linkIdStr) ?? false
  }

  function hasResult() {
    return result.value !== null
  }

  return {
    active: readonly(active),
    noPathFound,
    hint,
    toggle,
    pickNode,
    isNodeOnPath,
    isLinkOnPath,
    hasResult,
  }
}
