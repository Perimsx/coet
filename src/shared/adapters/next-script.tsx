import React, { useEffect } from 'react'

export interface ScriptProps
  extends Omit<React.ScriptHTMLAttributes<HTMLScriptElement>, 'onLoad' | 'onError'> {
  strategy?: 'afterInteractive' | 'beforeInteractive' | 'lazyOnload' | 'worker'
  onLoad?: (e: Event) => void
  onReady?: () => void
  onError?: (e: string | Event) => void
}

export function Script({
  src,
  dangerouslySetInnerHTML,
  strategy = 'afterInteractive',
  onLoad,
  onError,
  ...rest
}: ScriptProps) {
  useEffect(() => {
    if (!src) return

    const script = document.createElement('script')
    script.src = src
    script.async = strategy === 'lazyOnload' || strategy === 'afterInteractive'
    if (onLoad) script.onload = onLoad
    if (onError) script.onerror = onError

    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [src, strategy, onLoad, onError])

  if (dangerouslySetInnerHTML) {
    return (
      <script
        dangerouslySetInnerHTML={dangerouslySetInnerHTML}
        {...rest}
      />
    )
  }

  return null
}

export default Script
