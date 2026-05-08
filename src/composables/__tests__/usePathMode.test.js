import { describe, it, expect } from 'vitest'
import { usePathMode } from '../usePathMode.js'

const LINKS = [
  { source: 'a', target: 'b' },
  { source: 'b', target: 'c' },
  { source: 'd', target: 'e' }, // disconnected component
]

function fresh() {
  return usePathMode(() => LINKS)
}

describe('usePathMode', () => {
  it('starts inactive in pickStart state with no path size', () => {
    const m = fresh()
    expect(m.active.value).toBe(false)
    expect(m.state.value).toBe('pickStart')
    expect(m.pathSize.value).toBe(0)
    expect(m.hasResult()).toBe(false)
    expect(m.noPathFound.value).toBe(false)
  })

  it('toggle flips active and returns the new value', () => {
    const m = fresh()
    expect(m.toggle()).toBe(true)
    expect(m.active.value).toBe(true)
    expect(m.toggle()).toBe(false)
    expect(m.active.value).toBe(false)
  })

  it('first pickNode advances pickStart -> pickEnd, no result yet', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    expect(m.state.value).toBe('pickEnd')
    expect(m.hasResult()).toBe(false)
    expect(m.pathSize.value).toBe(0)
  })

  it('second pickNode resolves the path and exposes its size', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('c')
    expect(m.state.value).toBe('found')
    expect(m.hasResult()).toBe(true)
    expect(m.pathSize.value).toBe(3) // a, b, c
    expect(m.isNodeOnPath('a')).toBe(true)
    expect(m.isNodeOnPath('b')).toBe(true)
    expect(m.isNodeOnPath('c')).toBe(true)
    expect(m.isNodeOnPath('d')).toBe(false)
  })

  it('reports notFound when endpoints are in disconnected components', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('d')
    expect(m.state.value).toBe('notFound')
    expect(m.hasResult()).toBe(false)
    expect(m.noPathFound.value).toBe(true)
  })

  it('pathSlugs lists nodes from start to end', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('c')
    expect(m.pathSlugs.value).toEqual(['a', 'b', 'c'])
  })

  it('pathSlugs is empty when no path exists', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('d')
    expect(m.pathSlugs.value).toEqual([])
  })

  it('isLinkOnPath returns true for edges traversed by the BFS result', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('c')
    expect(m.isLinkOnPath('a->b')).toBe(true)
    expect(m.isLinkOnPath('b->c')).toBe(true)
    expect(m.isLinkOnPath('d->e')).toBe(false)
  })

  it('clicking a third node after a complete query restarts from pickEnd', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('c')
    expect(m.state.value).toBe('found')
    m.pickNode('b') // third click resets start to 'b'
    expect(m.state.value).toBe('pickEnd')
    expect(m.hasResult()).toBe(false)
  })

  it('toggle off clears state so reopening starts fresh', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('c')
    m.toggle() // off
    m.toggle() // on again
    expect(m.state.value).toBe('pickStart')
    expect(m.hasResult()).toBe(false)
    expect(m.pathSize.value).toBe(0)
  })

  it('noPathFound only flips while active', () => {
    const m = fresh()
    m.toggle()
    m.pickNode('a')
    m.pickNode('d')
    expect(m.noPathFound.value).toBe(true)
    m.toggle() // off
    expect(m.noPathFound.value).toBe(false)
  })
})
