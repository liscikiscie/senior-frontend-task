import { ref, computed, readonly, toValue } from 'vue'
import { findShortestPath } from '../utils/graph.js'

/**
 * Path-mode state machine for the shortest-path overlay.
 *
 * Exposes structured state instead of a pre-formatted hint string so the
 * consuming component can render translated copy through vue-i18n.
 *
 * `state` is one of:
 *   - 'pickStart'  — no start node chosen yet
 *   - 'pickEnd'    — start chosen, waiting for the second click
 *   - 'found'      — both endpoints set, BFS returned a path
 *   - 'notFound'   — both endpoints set, no path between them
 */
export function usePathMode(linksSource) {
  const active = ref(false)
  const start  = ref(null)
  const end    = ref(null)
  const result = ref(null)

  function getState() {
    if (!start.value) return 'pickStart'
    if (!end.value)   return 'pickEnd'
    if (result.value) return 'found'
    return 'notFound'
  }

  const state       = computed(getState)
  const pathSize    = computed(() => result.value?.nodeSlugs.size ?? 0)
  const noPathFound = computed(() => active.value && state.value === 'notFound')

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
    state,
    pathSize,
    noPathFound,
    toggle,
    pickNode,
    isNodeOnPath,
    isLinkOnPath,
    hasResult,
  }
}
