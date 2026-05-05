const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(str) {
  if (str == null) return ''
  return String(str).replace(/[&<>"']/g, function pickEscape(ch) {
    return ESCAPE_MAP[ch]
  })
}
