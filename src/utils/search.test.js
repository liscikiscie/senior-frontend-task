import { describe, it, expect } from 'vitest'
import { matchedSlugs } from './search.js'

const NODES = [
  { slug: 'pid',          title: 'PID Controller' },
  { slug: 'boiler',       title: 'Boiler' },
  { slug: 'pre-infusion', title: 'Pre-infusion' },
  { slug: 'channeling',   title: 'Channeling' },
  { slug: 'crema',        title: 'Crema' },
]

describe('matchedSlugs', () => {
  it('returns null for empty query', () => {
    expect(matchedSlugs(NODES, '')).toBeNull()
  })

  it('returns null for whitespace-only query', () => {
    expect(matchedSlugs(NODES, '   ')).toBeNull()
  })

  it('returns null for null/undefined query', () => {
    expect(matchedSlugs(NODES, null)).toBeNull()
    expect(matchedSlugs(NODES, undefined)).toBeNull()
  })

  it('matches case-insensitively', () => {
    const result = matchedSlugs(NODES, 'BOILER')
    expect(result).toEqual(new Set(['boiler']))
  })

  it('matches as substring, not just prefix', () => {
    const result = matchedSlugs(NODES, 'fusion')
    expect(result).toEqual(new Set(['pre-infusion']))
  })

  it('returns multiple slugs when several titles match', () => {
    const result = matchedSlugs(NODES, 'c')
    expect(result.has('pid')).toBe(true)        // "PID Controller"
    expect(result.has('channeling')).toBe(true) // "Channeling"
    expect(result.has('crema')).toBe(true)      // "Crema"
    expect(result.size).toBe(3)
  })

  it('returns empty Set when nothing matches', () => {
    const result = matchedSlugs(NODES, 'zzz')
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })

  it('trims surrounding whitespace from query', () => {
    expect(matchedSlugs(NODES, '  boiler  ')).toEqual(new Set(['boiler']))
  })

  it('skips nodes without a title (does not throw)', () => {
    const nodes = [{ slug: 'a' }, { slug: 'b', title: 'Boiler' }]
    expect(matchedSlugs(nodes, 'boiler')).toEqual(new Set(['b']))
  })
})
