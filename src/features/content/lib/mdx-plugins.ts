import type { Html, Image, Parent, Root } from 'mdast'
import { visit } from 'unist-util-visit'
import type { Node } from 'unist'
import { shouldProxyImageSrc as shouldProxyExternalImage, toProxiedImageSrc as toImageProxyUrl } from '@/shared/utils/image-proxy'

/**
 * Escapes HTML special characters in a string to prevent XSS.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function extractCodeBlockTitle(meta: string | undefined) {
  if (!meta) return undefined

  const patterns = [
    /\b(?:title|filename|file)="([^"]+)"/,
    /\b(?:title|filename|file)='([^']+)'/,
    /\b(?:title|filename|file)=([^\s]+)/,
  ]

  for (const pattern of patterns) {
    const match = meta.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return undefined
}

type MDExtraNode = Node & {
  type?: string
  name?: string
  attributes?: Array<{ type: string; name: string; value: unknown }>
  meta?: string | null
  data?: Record<string, unknown> & { hProperties?: Record<string, unknown> }
}

function visitChildren(node: Parent) {
  if (!node || !Array.isArray(node.children)) return

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index] as MDExtraNode

    if (child?.type === 'code') {
      const title = extractCodeBlockTitle(child.meta ?? undefined)
      if (title) {
        node.children.splice(index, 0, {
          type: 'html',
          value: `<div class="code-block-title">${escapeHtml(title)}</div>`,
        } satisfies Html)
        index += 1
      }
    }

    visitChildren(child as Parent)
  }
}

export function remarkCodeBlockTitle() {
  return (tree: Root) => {
    visitChildren(tree)
  }
}

export function remarkLazyLoadImages() {
  return (tree: Root) => {
    visit(tree, 'image', (node: Image) => {
      node.data = node.data || {}
      node.data.hProperties = node.data.hProperties || {}
      node.data.hProperties.loading = 'lazy'
    })
  }
}

function normalizePublicAssetPath(value?: string) {
  if (!value) return value
  return value.startsWith('./') ? `/${value.replace(/^\.\//, '')}` : value
}

export function remarkProxyExternalImages() {
  return (tree: Root) => {
    visit(tree, 'image', (node: Image) => {
      if (typeof node.url !== 'string') return

      if (shouldProxyExternalImage(node.url)) {
        node.url = toImageProxyUrl(node.url)
      } else {
        const normalized = normalizePublicAssetPath(node.url)
        node.url = normalized ?? node.url
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(
      tree,
      (node: any) => node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement',
      (node: any) => {
        if (!['img', 'AdaptiveImage'].includes(node.name ?? '')) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const srcAttr = (node.attributes as any[])?.find(
          (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'src'
        )
        if (!srcAttr || typeof srcAttr.value !== 'string') return

        if (shouldProxyExternalImage(srcAttr.value)) {
          srcAttr.value = toImageProxyUrl(srcAttr.value)
        } else {
          srcAttr.value = normalizePublicAssetPath(srcAttr.value)
        }

        if (node.name === 'img') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadingAttr = (node.attributes as any[])?.find(
            (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'loading'
          )
          if (!loadingAttr) {
            node.attributes = node.attributes || []
            node.attributes.push({
              type: 'mdxJsxAttribute',
              name: 'loading',
              value: 'lazy',
            })
          }
        }
      }
    )
  }
}
