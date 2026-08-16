import type { Image, Root } from 'mdast'
import { visit } from 'unist-util-visit'
import type { Node } from 'unist'
import { shouldProxyImageSrc as shouldProxyExternalImage, toProxiedImageSrc as toImageProxyUrl } from '@/shared/utils/image-proxy'

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

type MDExtraNode = Node & {
  type?: string
  name?: string
  attributes?: Array<{ type: string; name: string; value: unknown }>
  meta?: string | null
  data?: Record<string, unknown> & { hProperties?: Record<string, unknown> }
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

    visit(
      tree,
      (node: Node): node is MDExtraNode =>
        node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement',
      (node: MDExtraNode) => {
        if (!['img', 'AdaptiveImage'].includes(node.name ?? '')) return

        const srcAttr = node.attributes?.find(
          (attr) => attr.type === 'mdxJsxAttribute' && attr.name === 'src'
        )
        if (!srcAttr || typeof srcAttr.value !== 'string') return

        if (shouldProxyExternalImage(srcAttr.value)) {
          srcAttr.value = toImageProxyUrl(srcAttr.value)
        } else {
          srcAttr.value = normalizePublicAssetPath(srcAttr.value)
        }

        if (node.name === 'img') {
          const loadingAttr = node.attributes?.find(
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
