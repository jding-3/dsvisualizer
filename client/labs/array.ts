export type ArrayAlgorithm = 'binary' | 'bubble' | 'merge'
export type ArrayStep = {
  state: number[]
  description: string
  active?: number[]
  window?: { low: number; mid: number; high: number }
  range?: [number, number]
  split?: number
  found?: number
}

export const MAX_ARRAY_SIZE = 24
export const isAscending = (values: number[]) => values.every((value, i) => !i || values[i - 1] <= value)
export const sortedCopy = (values: number[]) => [...values].sort((a, b) => a - b)

export function parseArray(input: string) {
  const tokens = input.split(',').map((token) => token.trim())
  const values = tokens.map(Number)
  return tokens.length <= MAX_ARRAY_SIZE && tokens.every(Boolean) && values.every(Number.isFinite) ? values : null
}

export function arrayTrace(input: number[], algorithm: ArrayAlgorithm, target = 0): ArrayStep[] {
  const values = [...input]
  const steps: ArrayStep[] = []
  const emit = (description: string, details: Partial<Omit<ArrayStep, 'state' | 'description'>> = {}) => {
    steps.push({ state: [...values], description, ...details })
  }
  emit('Start with the current array.')
  if (algorithm === 'binary') {
    if (!isAscending(values)) throw new RangeError('Binary search requires ascending input.')
    let low = 0
    let high = values.length - 1
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const window = { low, mid, high }
      const value = values[mid]
      emit(`Compare ${target} with ${value} at index ${mid}.`, { window, active: [mid] })
      if (value === target) {
        emit(`Found ${target} at index ${mid}.`, { window, found: mid })
        return steps
      }
      if (value < target) {
        emit('The target is larger. Move low to the index after mid.', { window })
        low = mid + 1
      } else {
        emit('The target is smaller. Move high to the index before mid.', { window })
        high = mid - 1
      }
    }
    emit(`${target} was not found. The search window is empty.`)
    return steps
  }
  if (algorithm === 'bubble') {
    for (let end = values.length - 1; end > 0; end--) {
      let swapped = false
      for (let index = 0; index < end; index++) {
        const active = [index, index + 1]
        emit(`Compare ${values[index]} and ${values[index + 1]}.`, { active })
        if (values[index] <= values[index + 1]) continue
        ;[values[index], values[index + 1]] = [values[index + 1], values[index]]
        swapped = true
        emit('Swap the neighboring values.', { active })
      }
      if (!swapped) break
    }
  } else {
    function sort(start: number, end: number) {
      if (start >= end) return
      const mid = Math.floor((start + end) / 2)
      const range: [number, number] = [start, end]
      emit(`Split indices ${start}–${end} after index ${mid}.`, { range, split: mid, active: [mid, mid + 1] })
      sort(start, mid)
      sort(mid + 1, end)
      const left = values.slice(start, mid + 1)
      const right = values.slice(mid + 1, end + 1)
      const merged: number[] = []
      let l = 0
      let r = 0
      while (l < left.length && r < right.length) {
        emit(`Compare ${left[l]} and ${right[r]} while merging.`, { range, active: [start + l, mid + 1 + r] })
        merged.push(left[l] <= right[r] ? left[l++] : right[r++])
      }
      merged.push(...left.slice(l), ...right.slice(r))
      values.splice(start, merged.length, ...merged)
      emit(`Merged indices ${start}–${end} in ascending order.`, { range })
    }
    sort(0, values.length - 1)
  }
  emit('The array is sorted in ascending order.')
  return steps
}
