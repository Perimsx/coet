'use client'

import { useEffect, useRef } from 'react'
import { getCodeBlockLanguageLabel } from '@/features/content/lib/code-block-language'
import { normalizeRenderedCodeBlock } from '@/features/content/lib/normalize-rendered-code-block'
import { toast } from '@/shared/hooks/use-toast'

function createDots() {
  const dots = document.createElement('div')
  dots.className = 'code-window-dots'
  dots.setAttribute('aria-hidden', 'true')

  ;['red', 'amber', 'emerald'].forEach((color) => {
    const dot = document.createElement('span')
    dot.className = `code-window-dot code-window-dot-${color}`
    dots.appendChild(dot)
  })

  return dots
}

function findAttachedTitle(wrapper: HTMLElement) {
  const previous = wrapper.previousElementSibling
  if (
    previous instanceof HTMLElement &&
    previous.matches('.code-block-title, .remark-code-title, [data-rehype-pretty-code-title]')
  ) {
    previous.dataset.codeTitleAttached = 'true'
    previous.setAttribute('aria-hidden', 'true')
    return previous.textContent?.trim() || null
  }

  return null
}

function ensureWrapper(pre: HTMLPreElement) {
  const existingWrapper = pre.parentElement
  if (existingWrapper?.classList.contains('code-block-wrapper')) {
    return existingWrapper
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'code-block-wrapper'
  pre.parentNode?.insertBefore(wrapper, pre)
  wrapper.appendChild(pre)
  return wrapper
}

function ensureHeader(wrapper: HTMLElement, languageLabel: string) {
  let header = wrapper.querySelector<HTMLElement>(':scope > .code-block-header')
  if (!header) {
    header = document.createElement('div')
    header.className = 'code-block-header'
    wrapper.insertBefore(header, wrapper.firstChild)
  }

  let meta = header.querySelector<HTMLElement>(':scope > .code-block-header-meta')
  if (!meta) {
    meta = document.createElement('div')
    meta.className = 'code-block-header-meta'
    header.prepend(meta)
  }

  const displayLabel = findAttachedTitle(wrapper) || languageLabel
  const label = document.createElement('span')
  label.className = 'code-block-language'
  label.textContent = displayLabel
  meta.replaceChildren(createDots(), label)

  return header
}

export default function HtmlMarkdownContent({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const labels = {
      copy: 'Copy',
      copied: 'Copied',
      failed: 'Error',
      toastSuccess: '\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f',
      toastError: '\u590d\u5236\u5931\u8d25',
    }

    const cleanups: Array<() => void> = []
    const blocks = container.querySelectorAll('pre')

    blocks.forEach((pre) => {
      if (pre.dataset.coetCopyBound === '1') return
      pre.dataset.coetCopyBound = '1'

      const wrapper = ensureWrapper(pre)
      const codeElement = wrapper.querySelector('code')
      const languageLabel = getCodeBlockLanguageLabel(
        codeElement instanceof HTMLElement
          ? codeElement.getAttribute('data-language') || codeElement.className
          : pre.getAttribute('data-language') || undefined
      )
      const header = ensureHeader(wrapper, languageLabel)
      normalizeRenderedCodeBlock(wrapper)

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy-code-btn'
      button.setAttribute('aria-label', labels.copy)
      button.textContent = labels.copy

      let timer: ReturnType<typeof setTimeout> | undefined

      const onClick = async () => {
        const currentCode = wrapper.querySelector('code')
        const textToCopy = (currentCode?.textContent || pre.textContent || '').replace(/\n$/, '')

        try {
          await navigator.clipboard.writeText(textToCopy)
          button.classList.add('copied')
          button.textContent = labels.copied
          toast(labels.toastSuccess, 'success')

          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            button.classList.remove('copied')
            button.textContent = labels.copy
          }, 1600)
        } catch {
          button.classList.remove('copied')
          button.textContent = labels.failed
          toast(labels.toastError, 'error')

          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            button.textContent = labels.copy
          }, 1600)
        }
      }

      button.addEventListener('click', onClick)
      header.appendChild(button)

      cleanups.push(() => {
        if (timer) clearTimeout(timer)
        button.removeEventListener('click', onClick)
        button.remove()
        delete pre.dataset.coetCopyBound
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [html])

  return (
    <div
      ref={containerRef}
      className="html-markdown-content w-full max-w-full overflow-hidden break-words [word-break:break-word]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
