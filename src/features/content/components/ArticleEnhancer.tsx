'use client'

import { useEffect } from 'react'
import { shouldProxyImageSrc as shouldProxyExternalImage, toProxiedImageSrc as toImageProxyUrl } from '@/shared/utils/image-proxy'

function extractYouTubeId(input: string): string {
  let videoId = input
  try {
    if (videoId.includes('youtube.com/watch')) {
      const url = new URL(videoId)
      videoId = url.searchParams.get('v') || ''
    } else if (videoId.includes('youtu.be/')) {
      videoId = videoId.split('youtu.be/')[1]?.split('?')[0] || ''
    } else if (videoId.includes('youtube.com/embed/')) {
      videoId = videoId.split('youtube.com/embed/')[1]?.split('?')[0] || ''
    }
  } catch {
    return input
  }
  return videoId
}

const YOUTUBE_SHORTCODE_PATTERN = /\{% youtube (https:\/\/[^\s]+|[a-zA-Z0-9_-]+) %\}/g

/**
 * 客户端增强：挂载后对 #article 做 DOM 后处理。
 * - 表格包裹为可横滚容器
 * - 防盗链图片加载失败时自动走代理
 * - 图片懒加载兜底
 * - 标题锚点链接
 * - YouTube 嵌入短代码处理
 */
export function ArticleEnhancer() {
  useEffect(() => {
    const article = document.getElementById('article')
    if (!article) return

    const cleanups: Array<() => void> = []

    // 1. 表格 → 横滚容器
    const tables = Array.from(article.querySelectorAll<HTMLTableElement>('table'))
    for (const table of tables) {
      if (table.parentElement?.classList.contains('table-scroll-wrapper')) continue
      const wrapper = document.createElement('div')
      wrapper.className = 'table-scroll-wrapper'
      table.parentNode?.insertBefore(wrapper, table)
      wrapper.appendChild(table)
    }

    // 2. 防盗链图片 fallback + 懒加载
    const images = Array.from(article.querySelectorAll<HTMLImageElement>('img'))
    for (const img of images) {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy')
      }

      const src = img.getAttribute('src') ?? ''
      if (src.startsWith('/api/image')) continue

      if (shouldProxyExternalImage(src)) {
        img.setAttribute('src', toImageProxyUrl(src))
        continue
      }

      if (src.startsWith('http')) {
        const errorHandler = () => {
          if (img.dataset.proxyRetried) return
          img.dataset.proxyRetried = '1'
          img.classList.add('img-loading-error')
          img.setAttribute('src', toImageProxyUrl(src))
        }
        img.addEventListener('error', errorHandler, { once: true })
        cleanups.push(() => img.removeEventListener('error', errorHandler))
      }
    }

    // 3. 标题锚点链接
    const headings = Array.from(article.querySelectorAll<HTMLElement>('h2, h3, h4, h5, h6'))
    for (const heading of headings) {
      if (heading.querySelector('.heading-link')) continue

      heading.classList.add('group')
      const link = document.createElement('a')
      link.className =
        'heading-link ml-2 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity'
      link.href = `#${heading.id}`

      const span = document.createElement('span')
      span.setAttribute('aria-hidden', 'true')
      span.textContent = '#'
      link.appendChild(span)
      heading.appendChild(link)
    }

    // 4. YouTube 嵌入短代码处理
    const paragraphs = article.querySelectorAll<HTMLParagraphElement>('p')
    paragraphs.forEach((paragraph) => {
      const text = (paragraph.textContent || '').trim()
      const videoMatch = text.match(/\{% youtube (https:\/\/[^\s]+|[a-zA-Z0-9_-]+) %\}/)
      if (!videoMatch?.[1]) return

      const videoId = extractYouTubeId(videoMatch[1])
      if (!videoId || !/^[a-zA-Z0-9_-]{1,11}$/.test(videoId)) return
      const container = document.createElement('div')
      container.className = 'youtube-embed-container'
      container.innerHTML = `
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/${videoId}"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `
      paragraph.replaceWith(container)
    })

    // Also check text nodes for remaining {% youtube %} shortcodes
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
    const textNodes: Node[] = []
    let node = walker.nextNode()
    while (node) {
      textNodes.push(node)
      node = walker.nextNode()
    }

    textNodes.forEach((textNode) => {
      const textContent = textNode.textContent
      if (!textContent?.includes('{% youtube ')) return

      let hasChanges = false
      const newHtml = textContent.replace(
        YOUTUBE_SHORTCODE_PATTERN,
        (_match, rawVideoId: string) => {
          hasChanges = true
          const videoId = extractYouTubeId(rawVideoId)
          if (!videoId || !/^[a-zA-Z0-9_-]{1,11}$/.test(videoId)) return ''
          return `<div class="youtube-embed-container">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/${videoId}"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>`
        }
      )

      if (!hasChanges) return

      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = newHtml

      const parent = textNode.parentNode
      if (!parent) return

      while (tempDiv.firstChild) {
        parent.insertBefore(tempDiv.firstChild, textNode)
      }
      parent.removeChild(textNode)
    })
    return () => cleanups.forEach(fn => fn())
  }, [])

  return null
}
