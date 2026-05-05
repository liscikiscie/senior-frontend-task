import { describe, it, expect } from 'vitest'
import { findShortestPath, linkId } from './graph.js'

describe('findShortestPath', () => {
  it('finds direct A→B path', () => {
    const links = [{ source: 'a', target: 'b' }]
    const result = findShortestPath(links, 'a', 'b')
    expect(result).not.toBeNull()
    expect([...result.nodeSlugs]).toEqual(['b', 'a'])
    expect(result.linkIds.has(linkId(links[0]))).toBe(true)
  })

  it('finds 3-hop path A→B→C→D', () => {
    const links = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
    ]
    const result = findShortestPath(links, 'a', 'd')
    expect(result.nodeSlugs.size).toBe(4)
    expect(result.linkIds.size).toBe(3)
    expect(result.nodeSlugs.has('a')).toBe(true)
    expect(result.nodeSlugs.has('d')).toBe(true)
  })

  it('treats edges as undirected (B→A finds path even when only A→B exists)', () => {
    const links = [{ source: 'a', target: 'b' }]
    const result = findShortestPath(links, 'b', 'a')
    expect(result).not.toBeNull()
    expect(result.nodeSlugs.size).toBe(2)
  })

  it('returns single-node path when start === end', () => {
    const links = [{ source: 'a', target: 'b' }]
    const result = findShortestPath(links, 'a', 'a')
    expect(result.nodeSlugs.size).toBe(1)
    expect(result.linkIds.size).toBe(0)
  })

  it('returns null when no path exists (disconnected graph)', () => {
    const links = [
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ]
    expect(findShortestPath(links, 'a', 'd')).toBeNull()
  })

  it('returns null for non-existent slug', () => {
    const links = [{ source: 'a', target: 'b' }]
    expect(findShortestPath(links, 'a', 'zzz')).toBeNull()
    expect(findShortestPath(links, 'zzz', 'a')).toBeNull()
  })

  it('handles mutated links (source/target as node objects, not strings)', () => {
    const nodeA = { slug: 'a' }
    const nodeB = { slug: 'b' }
    const nodeC = { slug: 'c' }
    const links = [
      { source: nodeA, target: nodeB },
      { source: nodeB, target: nodeC },
    ]
    const result = findShortestPath(links, 'a', 'c')
    expect(result).not.toBeNull()
    expect(result.nodeSlugs.size).toBe(3)
  })

  it('returns single-node path for isolated node when start === end', () => {
    const links = [{ source: 'a', target: 'b' }]
    const result = findShortestPath(links, 'isolated', 'isolated')
    expect(result).not.toBeNull()
    expect(result.nodeSlugs.size).toBe(1)
    expect(result.linkIds.size).toBe(0)
    expect(result.nodeSlugs.has('isolated')).toBe(true)
  })

  it('picks the shortest path when multiple exist', () => {
    const links = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
      { source: 'a', target: 'd' },
    ]
    const result = findShortestPath(links, 'a', 'd')
    expect(result.nodeSlugs.size).toBe(2)
    expect(result.linkIds.size).toBe(1)
  })
})
