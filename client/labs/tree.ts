export type Tree = { value: number; left: Tree; right: Tree } | null
export type TreeOperation = 'insert' | 'search' | 'delete' | 'in-order' | 'pre-order' | 'post-order'
export type TreeStep = { state: Tree; description: string; active?: number; stack?: number[]; output?: number[]; found?: number }

export const MAX_TREE_SIZE = 24
export const treeSize = (node: Tree): number => node ? 1 + treeSize(node.left) + treeSize(node.right) : 0

export function treeTrace(root: Tree, operation: TreeOperation, value = 0): TreeStep[] {
  const steps: TreeStep[] = [{ state: root, description: 'Start with the current tree.' }]
  const emit = (description: string, details: Partial<TreeStep> = {}) => steps.push({ state: root, description, ...details })
  if (operation === 'in-order' || operation === 'pre-order' || operation === 'post-order') {
    const stack: number[] = []
    const output: number[] = []
    const snapshot = (description: string, active?: number) => emit(description, { active, stack: [...stack], output: [...output] })
    function visit(node: Tree) {
      if (!node) return
      stack.push(node.value)
      snapshot(`Enter node ${node.value}.`, node.value)
      const record = () => {
        output.push(node.value)
        snapshot(`Add ${node.value} to the output.`, node.value)
      }
      if (operation === 'pre-order') record()
      visit(node.left)
      if (operation === 'in-order') record()
      visit(node.right)
      if (operation === 'post-order') record()
      stack.pop()
      snapshot(`Return from node ${node.value}.`)
    }
    visit(root)
    snapshot(root ? 'Traversal complete.' : 'The tree is empty.')
    return steps
  }

  function change(node: Tree): Tree {
    if (!node) {
      if (operation === 'insert') return { value, left: null, right: null }
      emit(`${value} was not found.`)
      return null
    }
    if (node.value !== value) {
      const direction = value < node.value ? 'left' : 'right'
      emit(`${value} is ${direction === 'left' ? 'less' : 'greater'} than ${node.value}. Go ${direction}.`, { active: node.value })
      return { ...node, [direction]: change(node[direction]) }
    }
    if (operation === 'search') emit(`Found ${value}.`, { active: value, found: value })
    if (operation === 'insert') emit(`${value} is already in the tree.`, { active: value, found: value })
    if (operation !== 'delete') return node
    emit(`Found ${value} to delete.`, { active: value })
    if (!node.left || !node.right) {
      const child = node.left ?? node.right
      emit(child ? `Promote the only child, ${child.value}.` : `Remove leaf ${value}.`, { active: value })
      return child
    }
    function removeMinimum(current: NonNullable<Tree>): { successor: number; remainder: Tree } {
      emit(`Inspect ${current.value} in the right subtree.`, { active: current.value })
      if (!current.left) return { successor: current.value, remainder: current.right }
      const { successor, remainder } = removeMinimum(current.left)
      return { successor, remainder: { ...current, left: remainder } }
    }
    const { successor, remainder } = removeMinimum(node.right)
    emit(`Replace ${value} with its in-order successor, ${successor}.`, { active: successor })
    return { value: successor, left: node.left, right: remainder }
  }
  const result = change(root)
  const last = steps[steps.length - 1]
  if (operation === 'insert' && last.found === undefined) emit(`Inserted ${value}.`, { state: result, found: value })
  if (operation === 'delete' && treeSize(result) !== treeSize(root)) emit(`Deleted ${value}.`, { state: result })
  return steps
}

export function buildTree(values: number[]) {
  return values.reduce<Tree>((tree, value) => treeTrace(tree, 'insert', value).at(-1)!.state, null)
}

export function layoutTree(root: Tree) {
  const nodes: { value: number; parent?: number; column: number; depth: number }[] = []
  function walk(node: Tree, depth: number, parent?: number) {
    if (!node) return
    walk(node.left, depth + 1, node.value)
    nodes.push({ value: node.value, parent, column: nodes.length, depth })
    walk(node.right, depth + 1, node.value)
  }
  walk(root, 0)
  return nodes
}
