/**
 * Remark 插件：将 MDX 节点中的 HTML style 字符串属性转换为 JSX 对象表达式
 *
 * 问题背景：
 * 语雀导出的 Markdown 中包含 <font style="color:red"> 等 HTML 标签。
 * MDX 编译器将这些解析为 JSX，但 React 要求 style 必须是对象而非字符串，
 * 导致运行时报错："The `style` prop expects a mapping from style properties to values, not a string."
 *
 * 解决方案：
 * 遍历 MDX AST 中的 mdxJsxFlowElement 和 mdxJsxTextElement 节点，
 * 找到 style 属性为字符串的情况，将其转换为 mdxJsxAttributeValueExpression（JSX 对象表达式）。
 */
import { visit } from 'unist-util-visit'

/**
 * 将 CSS 属性名转换为 camelCase（如 background-color → backgroundColor）
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * 将 CSS 字符串解析为键值对对象
 * 例如 "color:rgba(0,0,0,0.9);background-color:red" → { color: "rgba(0,0,0,0.9)", backgroundColor: "red" }
 */
function parseCssString(css: string): Record<string, string> {
  const result: Record<string, string> = {}
  // 按分号分割，但要注意值中可能包含分号（如 url 中），这里用简单分割即可
  const pairs = css.split(';').filter((s) => s.trim())
  for (const pair of pairs) {
    const colonIdx = pair.indexOf(':')
    if (colonIdx === -1) continue
    const prop = pair.slice(0, colonIdx).trim()
    const value = pair.slice(colonIdx + 1).trim()
    if (prop && value) {
      result[toCamelCase(prop)] = value
    }
  }
  return result
}

/**
 * 构建 estree AST 表示一个对象表达式 { key1: "value1", key2: "value2" }
 */
function buildObjectEstree(obj: Record<string, string>): any {
  return {
    type: 'Program',
    sourceType: 'module',
    comments: [],
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'ObjectExpression',
          properties: Object.entries(obj).map(([key, value]) => ({
            type: 'Property',
            key: { type: 'Identifier', name: key },
            value: { type: 'Literal', value, raw: JSON.stringify(value) },
            kind: 'init' as const,
            method: false,
            shorthand: false,
            computed: false,
          })),
        },
      },
    ],
  }
}

export function remarkStyleToJsx() {
  return (tree: any) => {
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node: any) => {
      if (!node.attributes || !Array.isArray(node.attributes)) return

      for (const attr of node.attributes) {
        if (
          attr.type === 'mdxJsxAttribute' &&
          attr.name === 'style' &&
          typeof attr.value === 'string'
        ) {
          // 解析 CSS 字符串为对象
          const styleObj = parseCssString(attr.value)

          // 构建 JSX 表达式字符串，如 {color: "red", backgroundColor: "blue"}
          const exprStr = `{${Object.entries(styleObj)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(', ')}}`

          // 将字符串值替换为 MDX JSX 属性值表达式
          attr.value = {
            type: 'mdxJsxAttributeValueExpression',
            value: exprStr,
            data: {
              estree: buildObjectEstree(styleObj),
            },
          }
        }
      }
    })
  }
}
