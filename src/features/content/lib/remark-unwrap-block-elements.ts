/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Remark 插件：修复 MDX 解析时块级 HTML 标签嵌套在 <p> 中的问题
 */
import { visit } from 'unist-util-visit'

const BLOCK_ELEMENTS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'figure', 'figcaption', 'blockquote',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody',
  'tr', 'th', 'td', 'pre', 'hr', 'section',
  'article', 'aside', 'header', 'footer', 'nav',
  'form', 'fieldset', 'details', 'summary',
])

function isBlockElement(node: any): boolean {
  return (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    typeof node.name === 'string' &&
    BLOCK_ELEMENTS.has(node.name.toLowerCase())
  )
}

export function remarkUnwrapBlockElements() {
  return (tree: any) => {
    visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent || !Array.isArray(node.children)) return

      if (!node.children.some(isBlockElement)) return

      const newNodes: any[] = []
      let inlineBuffer: any[] = []

      const flushInlineBuffer = () => {
        if (inlineBuffer.length === 0) return

        const meaningful = inlineBuffer.filter(
          (child) => !(child.type === 'text' && !child.value.trim())
        )

        if (meaningful.length > 0) {
          newNodes.push({
            type: 'paragraph',
            children: [...inlineBuffer],
            position: node.position,
          })
        }

        inlineBuffer = []
      }

      for (const child of node.children) {
        if (isBlockElement(child)) {
          flushInlineBuffer()
          newNodes.push(child)
        } else {
          inlineBuffer.push(child)
        }
      }

      flushInlineBuffer()

      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes)
        return index
      }
    })
  }
}
