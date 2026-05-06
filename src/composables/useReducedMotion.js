import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Reactive `prefers-reduced-motion` flag.
 *
 * `matchMedia` is queried on mount and again whenever the OS-level
 * preference flips, so consumers can drop animations, particles or
 * camera fly-throughs at runtime without reloading the page.
 *
 * Returns a `ref<boolean>` rather than a plain boolean so it can drive
 * watchers and computed properties. Always defaults to `false` in non-
 * browser environments (SSR / unit tests without a JSDOM media query).
 */
export function useReducedMotion() {
  const reduced = ref(false)
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return reduced
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  function sync(event) { reduced.value = event.matches }

  onMounted(function bindReducedMotion() {
    reduced.value = mq.matches
    mq.addEventListener('change', sync)
  })

  onUnmounted(function unbindReducedMotion() {
    mq.removeEventListener('change', sync)
  })

  return reduced
}
