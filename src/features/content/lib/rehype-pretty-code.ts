import rehypePrettyCode, { type Options as RehypePrettyCodeOptions } from 'rehype-pretty-code'
import { visit } from 'unist-util-visit'

const emptyLinePlaceholder = {
  type: 'text',
  value: ' ',
} as const

export const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },
  defaultLang: {
    block: 'text',
    inline: 'text',
  },
  keepBackground: false,
  bypassInlineCode: true,
  onVisitLine(element) {
    if (element.children.length === 0) {
      element.properties = {
        ...(element.properties || {}),
        'data-empty-line': '',
      }
      element.children = [{ ...emptyLinePlaceholder }]
    }
  },
}

export function rehypeTrimPrettyCodeWhitespace() {
  return (tree: unknown) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'code' || !hasDataTheme(node.properties) || !Array.isArray(node.children)) {
        return
      }

      node.children = node.children.filter((child: any) => {
        if (child?.type !== 'text') {
          return true
        }

        return typeof child.value !== 'string' || child.value.trim().length > 0
      })

      while (node.children.length > 0 && isTrailingEmptyCodeLine(node.children[node.children.length - 1])) {
        node.children.pop()
      }
    })
  }
}

function hasDataTheme(properties: Record<string, unknown> | undefined) {
  return Boolean(properties && Object.prototype.hasOwnProperty.call(properties, 'data-theme'))
}

function hasDataLine(properties: Record<string, unknown> | undefined) {
  return Boolean(properties && Object.prototype.hasOwnProperty.call(properties, 'data-line'))
}

function hasDataEmptyLine(properties: Record<string, unknown> | undefined) {
  return Boolean(properties && Object.prototype.hasOwnProperty.call(properties, 'data-empty-line'))
}

function isTrailingEmptyCodeLine(node: any) {
  return (
    node?.type === 'element' &&
    hasDataLine(node.properties) &&
    (hasDataEmptyLine(node.properties) || getNodeTextContent(node).trim().length === 0)
  )
}

function getNodeTextContent(node: any): string {
  if (!node) {
    return ''
  }

  if (node.type === 'text') {
    return typeof node.value === 'string' ? node.value : ''
  }

  if (!Array.isArray(node.children)) {
    return ''
  }

  return node.children.map((child: any) => getNodeTextContent(child)).join('')
}

export default rehypePrettyCode
