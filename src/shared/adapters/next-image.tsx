/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react'

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'loading'> {
  src: string | { src: string; height?: number; width?: number; blurDataURL?: string }
  alt?: string
  width?: number | `${number}`
  height?: number | `${number}`
  fill?: boolean
  quality?: number | `${number}`
  priority?: boolean
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  unoptimized?: boolean
  sizes?: string
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  props,
  ref
) {
  const {
    src,
    alt = '',
    width,
    height,
    fill,
    priority,
    loading,
    placeholder: _p,
    blurDataURL: _b,
    unoptimized: _u,
    className,
    style,
    ...rest
  } = props
  void _p
  void _b
  void _u
  const imageSrc = typeof src === 'string' ? src : src?.src || ''
  const computedLoading = priority ? 'eager' : loading || 'lazy'

  const computedStyle: React.CSSProperties = {
    ...style,
    ...(fill
      ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          objectFit: style?.objectFit || 'cover',
        }
      : {}),
  }

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={computedLoading}
      decoding="async"
      className={className}
      style={computedStyle}
      {...rest}
    />
  )
})

export default Image
