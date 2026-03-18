export function normalizeRenderedCodeBlock(root: ParentNode | null | undefined) {
  if (!root || typeof Node === 'undefined') {
    return
  }

  const codeElement = root.querySelector('code[data-theme], pre > code')
  if (!(codeElement instanceof HTMLElement)) {
    return
  }

  stripDirectWhitespaceTextNodes(codeElement)
  trimTrailingEmptyCodeLines(codeElement)
}

function stripDirectWhitespaceTextNodes(container: HTMLElement) {
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      node.remove()
    }
  })
}

function trimTrailingEmptyCodeLines(container: HTMLElement) {
  const lines = Array.from(container.children)

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (!(line instanceof HTMLElement)) {
      continue
    }

    const isEmptyLine =
      line.hasAttribute('data-empty-line') ||
      (line.hasAttribute('data-line') && !line.textContent?.trim())

    if (!isEmptyLine) {
      break
    }

    line.remove()
  }
}
