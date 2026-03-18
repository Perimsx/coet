const languageLabelMap: Record<string, string> = {
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  css: 'CSS',
  csharp: 'C#',
  cs: 'C#',
  diff: 'Diff',
  dockerfile: 'Dockerfile',
  go: 'Go',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  json: 'JSON',
  jsx: 'JSX',
  kotlin: 'Kotlin',
  markdown: 'Markdown',
  md: 'Markdown',
  plaintext: 'Text',
  powershell: 'PowerShell',
  py: 'Python',
  python: 'Python',
  rb: 'Ruby',
  rs: 'Rust',
  ruby: 'Ruby',
  rust: 'Rust',
  scss: 'SCSS',
  sh: 'Shell',
  shell: 'Shell',
  sql: 'SQL',
  swift: 'Swift',
  text: 'Text',
  ts: 'TypeScript',
  tsx: 'TSX',
  typescript: 'TypeScript',
  txt: 'Text',
  vue: 'Vue',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
}

function toFallbackLabel(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getCodeBlockLanguageLabel(className?: string | null) {
  const value = className?.trim()
  const match = value?.match(/(?:language-|lang-)([a-z0-9#+._-]+)/i)
  const rawLanguage = (match?.[1] || (value && /^[a-z0-9#+._-]+$/i.test(value) ? value : undefined))
    ?.toLowerCase()

  if (!rawLanguage) {
    return 'Code'
  }

  return languageLabelMap[rawLanguage] || toFallbackLabel(rawLanguage)
}
