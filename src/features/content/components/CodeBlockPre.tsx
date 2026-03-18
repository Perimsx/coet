'use client'

import { Children, isValidElement, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { getCodeBlockLanguageLabel } from '@/features/content/lib/code-block-language'
import { normalizeRenderedCodeBlock } from '@/features/content/lib/normalize-rendered-code-block'
import { toast } from '@/shared/hooks/use-toast'

const resetDelay = 1600
const copyLabel = '\u590d\u5236'
const copiedLabel = '\u5df2\u590d\u5236'

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 11-18 0 9 9 0 0118 0Z"
      />
    </svg>
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
  const languageLabel = useMemo(
    () => getCodeBlockLanguageLabel(extractLanguageClassName(children)),
    [children]
  )

  useEffect(() => {
    normalizeRenderedCodeBlock(containerRef.current)
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
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast('\u5df2\u590d\u5236\u5230\u526a\u8d34\u677f', 'success')

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        setCopied(false)
      }, resetDelay)
    } catch {
      setCopied(false)
      toast('\u590d\u5236\u5931\u8d25', 'error')
    }
  }

  return (
    <div ref={containerRef} className="code-block-wrapper">
      <div className="code-block-header">
        <div className="code-block-header-meta">
          <span className="code-block-language">{languageLabel}</span>
        </div>
        <button
          type="button"
          aria-label="\u590d\u5236\u4ee3\u7801"
          className={`copy-code-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  )
}
