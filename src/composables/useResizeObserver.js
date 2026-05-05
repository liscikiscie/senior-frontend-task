import { onMounted, onUnmounted, toValue } from 'vue'

export function useResizeObserver(elementSource, handler) {
  let observer = null

  function start() {
    const el = toValue(elementSource)
    if (!el) return
    observer = new ResizeObserver(handler)
    observer.observe(el)
  }

  function stop() {
    observer?.disconnect()
    observer = null
  }

  onMounted(start)
  onUnmounted(stop)
}
