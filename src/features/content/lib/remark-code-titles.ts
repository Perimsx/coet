import type { Root, Code, Parent } from 'mdast'
import { visit } from 'unist-util-visit'

export function remarkCodeTitles() {
  return (tree: Root) =>
    visit(tree, 'code', (node: Code, index, parent: Parent | undefined) => {
      const nodeLang = node.lang || ''
      let language = ''
      let title = ''

      if (nodeLang.includes(':')) {
        language = nodeLang.slice(0, nodeLang.search(':'))
        title = nodeLang.slice(nodeLang.search(':') + 1, nodeLang.length)
      }

      if (!title || typeof index !== 'number' || !parent) {
        return
      }

      const className = 'rehype-code-title'

      const titleNode = {
        type: 'html' as const,
        value: `<div class="${className}">${title}</div>`,
      }

      parent.children.splice(index, 0, titleNode)
      node.lang = language
    })
}
