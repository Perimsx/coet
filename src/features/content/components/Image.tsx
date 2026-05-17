'use client'

import { useState } from 'react'
import NextImage, { ImageProps } from 'next/image'
import { normalizeImageSrc, toProxiedImageSrc } from '@/shared/utils/image-proxy'
import { cn } from '@/shared/utils/utils'

function normalizeSrc(src: ImageProps['src']) {
  if (typeof src !== 'string') {
    return src
  }
  return toProxiedImageSrc(normalizeImageSrc(src))
}

export default function Image({ src, className, ...rest }: ImageProps) {
  const [isLoading, setLoading] = useState(true)

  return (
    <div className={cn("relative overflow-hidden w-full h-full bg-zinc-100/50 dark:bg-zinc-900/40", isLoading && "animate-pulse")}>
      <NextImage
        src={normalizeSrc(src)}
        className={cn(
          "transition-all duration-700 ease-out",
          isLoading ? "scale-[1.04] blur-md opacity-40" : "scale-100 blur-0 opacity-100",
          className
        )}
        onLoad={() => setLoading(false)}
        {...rest}
      />
    </div>
  )
}
