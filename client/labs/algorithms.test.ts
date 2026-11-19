import { describe, expect, it } from 'vitest'
import { arrayTrace, parseArray } from './array'
import { buildHashTable, hashTrace } from './hash'
import type { HashMode } from './hash'
import { buildTree, layoutTree, treeTrace } from './tree'

describe('array traces', () => {
  it.each(['bubble', 'merge'] as const)('sorts negatives and duplicates with %s snapshots', (algorithm) => {
    const input = [5, -3, 5, 0]
    const steps = arrayTrace(input, algorithm)
    expect(steps[0].state).toEqual(input)
    expect(steps.at(-1)?.state).toEqual([-3, 0, 5, 5])
    expect(steps.some((step) => step.active?.length)).toBe(true)
    expect(steps.some((step) => step.description.includes(algorithm === 'bubble' ? 'Swap' : 'Split'))).toBe(true)
    expect(input).toEqual([5, -3, 5, 0])
  })

  it('reports binary-search windows, hits, and misses', () => {
    expect(arrayTrace([-4, 0, 7], 'binary', 7).at(-1)?.found).toBe(2)
    expect(arrayTrace([-4, 0, 7], 'binary', 1).at(-1)?.description).toContain('not found')
    expect(arrayTrace([-4, 0, 7], 'binary', 7).some((step) => step.window?.low === 2)).toBe(true)
    expect(() => arrayTrace([5, 0], 'binary')).toThrow()
    expect(parseArray('1,,2')).toBeNull()
    expect(parseArray(' 0, -2.5 ')).toEqual([0, -2.5])
  })
})

describe('tree traces', () => {
  const tree = buildTree([8, 3, 11, 1, 6, 9, 12, 10])

  it('emits insertion and search decisions and preserves duplicate inserts', () => {
    expect(treeTrace(tree, 'insert', 6).at(-1)?.state).toEqual(tree)
    expect(treeTrace(tree, 'insert', 2).at(-1)?.found).toBe(2)
    expect(treeTrace(tree, 'search', 10).some((step) => step.description.includes('Go left'))).toBe(true)
    expect(treeTrace(tree, 'search', 17).at(-1)?.description).toContain('not found')
  })

  it.each([1, 9, 8])('deletes %s and preserves BST ordering', (value) => {
    const result = treeTrace(tree, 'delete', value).at(-1)?.state ?? null
    expect(layoutTree(result).map((node) => node.value)).toEqual([1, 3, 6, 8, 9, 10, 11, 12].filter((v) => v !== value))
    if (value === 8) expect(result?.value).toBe(9)
  })

  it('tracks the live stack and all three traversal orders', () => {
    const small = buildTree([2, 1, 3])
    const cases = [['in-order', [1, 2, 3]], ['pre-order', [2, 1, 3]], ['post-order', [1, 3, 2]]] as const
    for (const [operation, output] of cases) {
      const steps = treeTrace(small, operation)
      expect(steps.some((step) => step.stack?.join(',') === '2,1')).toBe(true)
      expect(steps.at(-1)?.output).toEqual(output)
    }
  })
})

describe('hash table traces', () => {
  const entries = [{ key: 'a', value: 'Apple' }, { key: 'h', value: 'Honey' }]

  it.each(['chain', 'probe'] as HashMode[])('handles collisions and duplicate keys in %s mode', (mode) => {
    const table = buildHashTable(entries, 7, mode)!
    const search = hashTrace(table, 'search', entries[1])
    expect(search.at(-1)?.description).toContain('Honey')
    expect(search.some((step) => step.calculation?.index === 6)).toBe(true)
    expect(search.at(-1)?.bucket).toBe(mode === 'chain' ? 6 : 0)
    const updated = hashTrace(table, 'insert', { key: ' h ', value: 'Herbs' }).at(-1)!.state
    expect(hashTrace(updated, 'search', entries[1]).at(-1)?.description).toContain('Herbs')
    expect(updated.buckets.flat().length).toBe(2)
  })

  it('keeps displaced keys searchable across tombstones and reuses them on insert', () => {
    const table = buildHashTable(entries, 7, 'probe')!
    const removed = hashTrace(table, 'delete', entries[0]).at(-1)!.state
    expect(removed.buckets[6]).toBe('deleted')
    expect(hashTrace(removed, 'search', entries[1]).at(-1)?.bucket).toBe(0)
    const replaced = hashTrace(removed, 'insert', { key: 'o', value: 'Oats' }).at(-1)!.state
    expect(replaced.buckets[6]).toEqual([{ key: 'o', value: 'Oats' }])
    expect(buildHashTable(entries, 11, 'probe')?.size).toBe(11)
    const full = buildHashTable(Array.from({ length: 7 }, (_, i) => ({ key: String(i), value: String(i) })), 7, 'probe')!
    expect(hashTrace(full, 'insert', { key: 'next', value: 'full' }).at(-1)?.description).toContain('table is full')
  })
})
