import {
  graphData as rawGraphData,
  getChunk  as rawGetChunk,
  sources   as rawSources,
  getPart   as rawGetPart,
} from './mock.js'
import { i18n } from '../i18n/index.js'

/**
 * Locale-aware overlays on top of the static mock data. mock.js is treated
 * as immutable (per README) — these wrappers read from it and substitute the
 * translatable fields with values from the active locale's `data.*` block,
 * falling back to the original mock string when a key is missing.
 *
 * Each wrapper reads the i18n functions through the global instance so the
 * helpers stay independent of any specific component context.
 */

function partKey(sourceName, partIndex) {
  return `${sourceName.replace(/\./g, '_')}__${partIndex}`
}

function tOr(key, fallback) {
  const { t, te } = i18n.global
  return te(key) ? t(key) : fallback
}

export function translatedGraphData() {
  return {
    nodes: rawGraphData.nodes.map(function translateNode(node) {
      return { ...node, title: tOr(`data.nodeTitles.${node.slug}`, node.title) }
    }),
    links: rawGraphData.links.map(function translateLink(link) {
      return { ...link, label: tOr(`data.linkLabels.${link.label}`, link.label) }
    }),
  }
}

export function translatedChunk(slug) {
  const chunk = rawGetChunk(slug)
  if (!chunk) return null
  return {
    ...chunk,
    title:         tOr(`data.nodeTitles.${slug}`,    chunk.title),
    summary:       tOr(`data.summaries.${slug}`,     chunk.summary),
    body_markdown: tOr(`data.bodyMarkdown.${slug}`,  chunk.body_markdown),
    links: chunk.links.map(function translateChunkLink(link) {
      return {
        ...link,
        title: tOr(`data.nodeTitles.${link.slug}`,  link.title),
        label: tOr(`data.linkLabels.${link.label}`, link.label),
      }
    }),
    sources: chunk.sources.map(function translateChunkSource(src, index) {
      return { ...src, note: tOr(`data.sourceNotes.${slug}__${index}`, src.note) }
    }),
  }
}

export function translatedSources() {
  return rawSources.map(function translateSource(src) {
    return {
      ...src,
      parts: src.parts.map(function translatePart(part) {
        return {
          ...part,
          title: tOr(`data.partTitles.${partKey(src.source_name, part.part_index)}`, part.title),
        }
      }),
    }
  })
}

export function translatedPart(sourceName, partIndex) {
  const part = rawGetPart(sourceName, partIndex)
  if (!part) return null
  const key = partKey(sourceName, partIndex)
  return {
    ...part,
    title:         tOr(`data.partTitles.${key}`, part.title),
    body_markdown: tOr(`data.partBodies.${key}`, part.body_markdown),
  }
}
