export function fmtTime(secs) {
  if (secs == null) return null
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatTimeRange(start, end) {
  const s = fmtTime(start)
  const e = fmtTime(end)
  return s ? ` · ${s} – ${e}` : ''
}
