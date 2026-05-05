import { Fragment, type ReactNode } from 'react'
import { cn } from '@/shared/utils/utils'

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'code'; content: string }

function isSafeHref(url: string) {
  return /^(https?:\/\/|mailto:)/i.test(url)
}

function renderTextWithBreaks(text: string, key: string) {
  const parts = text.split('\n')
  return parts.map((part, index) => (
    <Fragment key={`${key}-line-${index}`}>
      {part}
      {index < parts.length - 1 ? <br /> : null}
    </Fragment>
  ))
}

/**
 * 渲染行内 Markdown 标记（如粗体、代码块、链接等）
 */
function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const tokenPattern =
    /(`[^`\n]+`|\*\*[^*\n]+\*\*|~~[^~\n]+~~|\*[^*\n]+\*|\[[^\]\n]+\]\((?:https?:\/\/|mailto:)[^)]+\))/g

  const nodes: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0

  for (const match of text.matchAll(tokenPattern)) {
    const full = match[0]
    const index = match.index ?? 0

    if (index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-text-${matchIndex}`}>
          {renderTextWithBreaks(text.slice(lastIndex, index), `${keyPrefix}-text-${matchIndex}`)}
        </Fragment>
      )
      matchIndex += 1
    }

    if (full.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${matchIndex}`}
          className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10"
        >
          {full.slice(1, -1)}
        </code>
      )
    } else if (full.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-strong-${matchIndex}`} className="font-semibold">
          {full.slice(2, -2)}
        </strong>
      )
    } else if (full.startsWith('~~')) {
      nodes.push(
        <del key={`${keyPrefix}-del-${matchIndex}`} className="opacity-75">
          {full.slice(2, -2)}
        </del>
      )
    } else if (full.startsWith('*')) {
      nodes.push(
        <em key={`${keyPrefix}-em-${matchIndex}`} className="italic">
          {full.slice(1, -1)}
        </em>
      )
    } else {
      const linkMatch = full.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      const label = linkMatch?.[1] ?? full
      const href = linkMatch?.[2] ?? ''

      if (!isSafeHref(href)) {
        nodes.push(<Fragment key={`${keyPrefix}-link-text-${matchIndex}`}>{full}</Fragment>)
      } else {
        nodes.push(
          <a
            key={`${keyPrefix}-link-${matchIndex}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-300 underline underline-offset-2"
          >
            {label}
          </a>
        )
      }
    }

    lastIndex = index + full.length
    matchIndex += 1
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tail`}>
        {renderTextWithBreaks(text.slice(lastIndex), `${keyPrefix}-tail`)}
      </Fragment>
    )
  }

  if (!nodes.length) {
    return [<Fragment key={`${keyPrefix}-plain`}>{renderTextWithBreaks(text, keyPrefix)}</Fragment>]
  }

  return nodes
}

/**
 * 解析 Markdown 文本为结构化的块级元素（段落、列表、引用等）
 */
function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  const isBlockBoundary = (line: string) =>
    /^```/.test(line) ||
    /^#{1,4}\s+/.test(line) ||
    /^>\s?/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    line.trim() === ''

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (/^```/.test(trimmed)) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', content: codeLines.join('\n') })
      continue
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/)
    if (headingMatch) {
      const levelRaw = headingMatch[1].length
      const level = (levelRaw === 1 ? 2 : levelRaw) as 2 | 3 | 4
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() })
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n').trim() })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, '').trim())
        index += 1
      }
      blocks.push({ type: 'unordered-list', items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, '').trim())
        index += 1
      }
      blocks.push({ type: 'ordered-list', items })
      continue
    }

    const paragraphLines: string[] = [line]
    index += 1
    while (index < lines.length && !isBlockBoundary(lines[index])) {
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n').trim() })
  }

  return blocks
}

/**
 * 评论专用 Markdown 渲染组件 (CommentMarkdown)
 * 提供轻量、安全的 Markdown 渲染逻辑，支持基础样式和 Emoji。建议修复错误。
 */
export default function CommentMarkdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const blocks = parseMarkdownBlocks(content)

  if (!blocks.length) {
    return null
  }

  return (
    <div
      className={cn('space-y-2.5 text-sm leading-6 text-gray-700 dark:text-gray-200', className)}
    >
      {blocks.map((block, index) => {
        const key = `md-block-${index}`

        if (block.type === 'heading') {
          if (block.level === 2) {
            return (
              <h2 key={key} className="text-base font-semibold">
                {renderInlineMarkdown(block.text, key)}
              </h2>
            )
          }

          if (block.level === 3) {
            return (
              <h3 key={key} className="text-sm font-semibold">
                {renderInlineMarkdown(block.text, key)}
              </h3>
            )
          }

          return (
            <h4 key={key} className="text-sm font-medium">
              {renderInlineMarkdown(block.text, key)}
            </h4>
          )
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={key}
              className="border-border/70 bg-muted/30 text-muted-foreground rounded-md border-l-2 px-3 py-2"
            >
              {renderInlineMarkdown(block.text, key)}
            </blockquote>
          )
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={key} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`}>
                  {renderInlineMarkdown(item, `${key}-item-${itemIndex}`)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={key} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`}>
                  {renderInlineMarkdown(item, `${key}-item-${itemIndex}`)}
                </li>
              ))}
            </ol>
          )
        }

        if (block.type === 'code') {
          return (
            <pre
              key={key}
              className="bg-muted/40 overflow-x-auto rounded-md px-3 py-2 text-xs leading-5 whitespace-pre-wrap"
            >
              <code>{block.content}</code>
            </pre>
          )
        }

        return <p key={key}>{renderInlineMarkdown(block.text, key)}</p>
      })}
    </div>
  )
}
