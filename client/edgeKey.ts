export function edgeKey(source: string, target: string, directed: boolean) {
  return directed || source <= target ? `${source}:${target}` : `${target}:${source}`
}
