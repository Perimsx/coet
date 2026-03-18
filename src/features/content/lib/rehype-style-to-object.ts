import { visit } from 'unist-util-visit'

/**
 * 将 HTML 字符串格式的 style 属性转换为 React 对象格式。
 *
 * 解决从语雀等平台导出的 Markdown 中包含
 * `<font style="color:rgb(79, 79, 79);">` 这类原始 HTML 时，
 * React 渲染报错的问题：
 * "The `style` prop expects a mapping from style properties to values, not a string."
 */
function parseStyleString(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {}
  if (!styleString || typeof styleString !== 'string') return styles

  // 按分号分割，处理每一条样式声明
  const declarations = styleString.split(';')
  for (const declaration of declarations) {
    const trimmed = declaration.trim()
    if (!trimmed) continue

    // 找到第一个冒号作为属性名和值的分界
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const property = trimmed.slice(0, colonIndex).trim()
    const value = trimmed.slice(colonIndex + 1).trim()

    if (!property || !value) continue

    // 将 CSS 属性名转换为 camelCase (如 background-color -> backgroundColor)
    const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    styles[camelCaseProperty] = value
  }
  return styles
}

export default function rehypeStyleToObject() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.properties && typeof node.properties.style === 'string') {
        node.properties.style = parseStyleString(node.properties.style as string)
      }
    })
  }
}
