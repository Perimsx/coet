import { ReactNode, DetailedHTMLProps, HTMLAttributes } from 'react'
import { CopyButton } from './CopyButton'

interface PreProps extends DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement> {
  children?: ReactNode
  'data-raw'?: string
}

export const Pre = ({ children, ...props }: PreProps) => {
  const rawText = props['data-raw'] || ''
  
  return (
    <div className="code-block-wrapper relative group">
      <pre {...props} className="overflow-x-auto custom-scrollbar">
        {children}
      </pre>
      <CopyButton text={rawText} />
    </div>
  )
}
