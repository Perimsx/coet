'use client'

import { Children, isValidElement, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { getCodeBlockLanguageLabel } from '@/features/content/lib/code-block-language'
import { normalizeRenderedCodeBlock } from '@/features/content/lib/normalize-rendered-code-block'
import { toast } from '@/shared/hooks/use-toast'
import { useNavLanguage } from '@/features/site/lib/nav-language'

const resetDelay = 1600

function isCodeTitleElement(element: Element | null): element is HTMLElement {
  return Boolean(
    element instanceof HTMLElement &&
      element.matches('.code-block-title, .remark-code-title, [data-rehype-pretty-code-title]')
  )
}

function extractLanguageClassName(node: ReactNode): string | undefined {
  const items = Children.toArray(node)

  for (const item of items) {
    if (!isValidElement<{ className?: string; children?: ReactNode; 'data-language'?: string }>(item)) {
      continue
    }

    if (typeof item.props['data-language'] === 'string' && item.props['data-language']) {
      return item.props['data-language']
    }

    if (typeof item.props.className === 'string' && item.props.className) {
      return item.props.className
    }

    const nested = extractLanguageClassName(item.props.children)
    if (nested) {
      return nested
    }
  }

  return undefined
}

export default function CodeBlockPre({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copied, setCopied] = useState(false)
  const [titleLabel, setTitleLabel] = useState<string | null>(null)
  const { dictionary } = useNavLanguage()
  const languageLabel = useMemo(
    () => getCodeBlockLanguageLabel(extractLanguageClassName(children)),
    [children]
  )
  const displayLabel = titleLabel || languageLabel

  useEffect(() => {
    const wrapper = containerRef.current
    if (!wrapper) return

    normalizeRenderedCodeBlock(wrapper)

    const previousElement = wrapper.previousElementSibling
    const titleElement = isCodeTitleElement(previousElement) ? previousElement : null

    if (!titleElement) {
      setTitleLabel(null)
      return
    }

    const title = titleElement.textContent?.trim()
    if (title) {
      setTitleLabel(title)
      titleElement.dataset.codeTitleAttached = 'true'
      titleElement.setAttribute('aria-hidden', 'true')
    }

    return () => {
      delete titleElement.dataset.codeTitleAttached
      titleElement.removeAttribute('aria-hidden')
    }
  }, [children])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    const codeElement = containerRef.current?.querySelector('code')
    const fallbackPre = containerRef.current?.querySelector('pre')
    const textToCopy = (codeElement?.textContent || fallbackPre?.textContent || '').replace(/\n$/, '')

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = textToCopy
        textArea.style.position = 'absolute'
        textArea.style.left = '-9999px'
        textArea.style.top = '0'
        textArea.setAttribute('readonly', '')
        document.body.appendChild(textArea)
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (!successful) throw new Error('copy failed')
      }

      setCopied(true)
      toast(dictionary.codeBlock.toastSuccess, 'success')

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        setCopied(false)
      }, resetDelay)
    } catch {
      setCopied(false)
      toast(dictionary.codeBlock.toastError, 'error')
    }
  }

  return (
    <div ref={containerRef} className="code-block-wrapper">
      <div className="code-block-header">
        <div className="code-block-header-meta">
          <div className="code-window-dots" aria-hidden="true">
            <span className="code-window-dot code-window-dot-red" />
            <span className="code-window-dot code-window-dot-amber" />
            <span className="code-window-dot code-window-dot-emerald" />
          </div>
          <span className="code-block-language">{displayLabel}</span>
        </div>
        <button
          type="button"
          aria-label={dictionary.codeBlock.copyCode}
          className={`copy-code-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? dictionary.codeBlock.copied : dictionary.codeBlock.copy}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  )
}
