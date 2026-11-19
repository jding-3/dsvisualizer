export type HashMode = 'chain' | 'probe'
export type Entry = { key: string; value: string }
type Bucket = Entry[] | 'deleted'
export type HashTable = { mode: HashMode; size: number; buckets: Bucket[] }
export type HashOperation = 'insert' | 'search' | 'delete'
export type HashStep = {
  state: HashTable
  description: string
  calculation?: { hash: number; index: number; key: string }
  bucket?: number
  entry?: number
}

export function hashKey(key: string) {
  let hash = 0
  for (const character of key) hash = (Math.imul(hash, 31) + character.codePointAt(0)!) >>> 0
  return hash
}

export function hashTrace(table: HashTable, operation: HashOperation, input: Entry): HashStep[] {
  const key = input.key.trim()
  const hash = hashKey(key)
  const index = hash % table.size
  const calculation = { hash, index, key }
  const steps: HashStep[] = [{ state: table, description: 'Start with the current hash table.' }]
  function emit(description: string, bucket = index, entry?: number, state = table) {
    steps.push({ state, description, calculation, bucket, entry })
  }
  function replace(bucket: number, content: Bucket) {
    return { ...table, buckets: table.buckets.map((old, i) => i === bucket ? content : old) }
  }
  emit(`Hash “${key}” to ${hash}. Start at bucket ${index}.`)
  function match(bucket: number, entries: Entry[], position: number) {
    const existing = entries[position]
    if (operation === 'search') return emit(`Found “${key}” with value “${existing.value}”.`, bucket, position)
    const remaining = entries.filter((_, i) => i !== position)
    if (operation === 'delete') {
      return emit(`Deleted “${key}”.`, bucket, undefined, replace(bucket, table.mode === 'probe' ? 'deleted' : remaining))
    }
    const updated = entries.map((entry, i) => i === position ? { key, value: input.value } : entry)
    emit(`Updated the value for “${key}”.`, bucket, position, replace(bucket, updated))
  }
  if (table.mode === 'chain') {
    const bucket = table.buckets[index]
    const entries = bucket === 'deleted' ? [] : bucket
    for (const [position, entry] of entries.entries()) {
      emit(`Compare with “${entry.key}” in the chain.`, index, position)
      if (entry.key === key) {
        match(index, entries, position)
        return steps
      }
    }
    if (operation === 'insert') emit(`Add “${key}” to bucket ${index}.`, index, entries.length, replace(index, [...entries, { key, value: input.value }]))
    else emit(`“${key}” was not found in the chain.`)
    return steps
  }

  let free: number | undefined
  for (let offset = 0; offset < table.size; offset++) {
    const bucket = (index + offset) % table.size
    const entries = table.buckets[bucket]
    if (entries === 'deleted') {
      free ??= bucket
      emit(`Probe bucket ${bucket}. Its deleted marker keeps the search going.`, bucket)
    } else if (!entries.length) {
      free ??= bucket
      emit(`Probe bucket ${bucket}. This slot is empty.`, bucket)
      break
    } else {
      emit(`Probe bucket ${bucket} and compare with “${entries[0].key}”.`, bucket, 0)
      if (entries[0].key === key) {
        match(bucket, entries, 0)
        return steps
      }
    }
  }
  if (operation !== 'insert') emit(`“${key}” was not found.`)
  else if (free === undefined) emit('The table is full. Increase its size or delete an entry.')
  else emit(`Insert “${key}” at bucket ${free}.`, free, 0, replace(free, [{ key, value: input.value }]))
  return steps
}

export function buildHashTable(entries: Entry[], size: number, mode: HashMode): HashTable | null {
  if (mode === 'probe' && entries.length > size) return null
  return entries.reduce<HashTable>((table, entry) => hashTrace(table, 'insert', entry).at(-1)!.state, {
    mode, size, buckets: Array.from({ length: size }, () => []),
  })
}
