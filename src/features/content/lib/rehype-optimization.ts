/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from 'unist-util-visit'

export default function rehypeOptimization() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      // 适配 a 标签，优化外部链接在新标签页打开，并且添加防盗链和安全属性
      if (node.tagName === 'a') {
        node.properties = node.properties || {}
        const href = node.properties.href
        if (typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'))) {
          node.properties.target = '_blank'
          node.properties.rel = 'noopener noreferrer'
        }
      }
      
      // 适配 img 标签，添加防盗链（referrerPolicy）以及性能优化（lazy loading & async decoding）
      if (node.tagName === 'img') {
        node.properties = node.properties || {}
        node.properties.referrerPolicy = 'no-referrer'
        node.properties.loading = 'lazy'
        node.properties.decoding = 'async'
      }
    })
  }
}
