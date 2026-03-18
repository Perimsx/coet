/**
 * Remark 插件：修复 MDX 解析时块级 HTML 标签嵌套在 <p> 中的问题
 *
 * 问题背景：
 * 语雀导出的 Markdown 中使用了 HTML 标签如 <h1 id="...">, <h3 id="...">
 * 来书写标题。MDX 解析器会将这些标签作为 mdxJsxFlowElement，但当它们
 * 周围有其他内联内容时，可能被包裹在 <p> 标签中，导致无效的 HTML 嵌套
 * （如 <p><h1>...</h1></p>），从而引发 React 水合错误。
 *
 * 解决方案：
 * 遍历 AST，检查 paragraph 节点中是否包含块级 JSX 元素（h1-h6, figure, div 等），
 * 如果是，将 paragraph 拆分，把块级元素提升到 paragraph 外部。
 */
import { visit } from 'unist-util-visit'

// 块级 HTML 元素列表（不能嵌套在 <p> 中）
const BLOCK_ELEMENTS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'figure', 'figcaption', 'blockquote',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody',
  'tr', 'th', 'td', 'pre', 'hr', 'section',
  'article', 'aside', 'header', 'footer', 'nav',
  'form', 'fieldset', 'details', 'summary',
])

function isBlockElement(node: any): boolean {
  // mdxJsxFlowElement 或 mdxJsxTextElement 且标签名是块级元素
  if (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    typeof node.name === 'string' &&
    BLOCK_ELEMENTS.has(node.name.toLowerCase())
  ) {
    return true
  }
  return false
}

export function remarkUnwrapBlockElements() {
  return (tree: any) => {
    visit(tree, 'paragraph', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent || !Array.isArray(node.children)) return

      // 检查此段落中是否有块级元素子节点
      const hasBlockChild = node.children.some(isBlockElement)
      if (!hasBlockChild) return

      // 将段落子节点拆分为多个组：
      // - 连续的内联节点 → 保持在 paragraph 中
      // - 块级节点 → 提升到父级
      const newNodes: any[] = []
      let inlineBuffer: any[] = []

      const flushInlineBuffer = () => {
        if (inlineBuffer.length > 0) {
          // 过滤掉纯空白文本节点
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

      // 替换原始段落节点
      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes)
        // 返回 index 以便 visit 重新处理新插入的节点
        return index
      }
    })
  }
}
