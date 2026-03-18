type HNode = {
  type?: string
  tagName?: string
  children?: HNode[]
}

function removeFirstH1(node: HNode): boolean {
  if (!node.children || node.children.length === 0) return false

  for (let i = 0; i < node.children.length; i += 1) {
    const child = node.children[i]

    if (child.type === 'element' && child.tagName === 'h1') {
      node.children.splice(i, 1)
      return true
    }

    if (removeFirstH1(child)) {
      return true
    }
  }

  return false
}

export default function rehypeRemoveFirstH1() {
  return (tree: HNode) => {
    removeFirstH1(tree)
  }
}
