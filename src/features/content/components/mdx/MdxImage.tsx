'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ImgHTMLAttributes,
  type MouseEventHandler,
  type ReactEventHandler,
  type WheelEventHandler,
} from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { getNavLanguage } from '@/features/site/lib/nav-language'
import { getImageSourceCandidates, normalizeImageSrc } from '@/shared/utils/image-proxy'
import { cn } from '@/shared/utils/utils'

type MdxImageProps = ImgHTMLAttributes<HTMLImageElement>
const zoomStep = 0.2
const minZoom = 1
const maxZoom = 3

function clampZoom(value: number) {
  return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(2))))
}

export default function MdxImage({
  src,
  alt = '',
  className,
  loading,
  decoding,
  onClick,
  onError,
  ...rest
}: MdxImageProps) {
  const { dictionary } = getNavLanguage()
  const normalizedSrc = useMemo(() => normalizeImageSrc(typeof src === 'string' ? src : ''), [src])
  const sourceCandidates = useMemo(() => getImageSourceCandidates(normalizedSrc), [normalizedSrc])
  const [sourceIndex, setSourceIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const renderSrc = sourceCandidates[sourceIndex] || normalizedSrc
  const caption = alt.trim()

  useEffect(() => {
    setSourceIndex(0)
    setFailed(false)
    setZoom(1)
  }, [normalizedSrc])

  if (!normalizedSrc) {
    return null
  }

  const handlePreviewTrigger: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (onClick) {
      onClick(event as unknown as Parameters<NonNullable<typeof onClick>>[0])
    }
    if (event.defaultPrevented) return
    event.preventDefault()
    event.stopPropagation()
    setOpen(true)
  }

  const handleError: ReactEventHandler<HTMLImageElement> = (event) => {
    onError?.(event)
    if (sourceIndex < sourceCandidates.length - 1) {
      setSourceIndex((current) => current + 1)
      return
    }
    setFailed(true)
  }

  const handleWheel: WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    const next = event.deltaY < 0 ? zoom + zoomStep : zoom - zoomStep
    setZoom(clampZoom(next))
  }

  const handlePreviewZoomIn = () => {
    setZoom((current) => clampZoom(current + zoomStep))
  }

  const handlePreviewZoomOut = () => {
    setZoom((current) => clampZoom(current - zoomStep))
  }

  const handlePreviewReset = () => {
    setZoom(1)
  }

  return (
    <span className="my-4 block text-center">
      {failed ? (
        <span className="inline-block rounded-xl border border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-100">
          <span className="block text-center">{dictionary.post.imageFailedToLoad}</span>
        </span>
      ) : (
        <>
            <button
              type="button"
              aria-label={dictionary.toc.open}
              onClick={handlePreviewTrigger}
              className="group relative inline-block overflow-hidden transition-all duration-500 rounded-xl bg-muted/40 dark:bg-gray-800/30"
            >
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/5 backdrop-blur-[2px]">
              <div className="p-2 rounded-full bg-background/80 dark:bg-gray-900/80 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </div>
            </div>
            <img
              {...rest}
              src={renderSrc}
              alt={alt}
              loading={loading ?? 'lazy'}
              decoding={decoding ?? 'async'}
              referrerPolicy="strict-origin-when-cross-origin"
              onError={handleError}
              className={cn('m-0 block w-full cursor-zoom-in border-0 transition-transform duration-700 group-hover:scale-[1.02]', className)}
            />
          </button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
              className="max-w-none w-screen h-screen border-none bg-white/10 dark:bg-black/20 backdrop-blur-3xl shadow-none p-0 outline-none flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 rounded-none sm:rounded-none overflow-hidden"
              onWheel={handleWheel}
              hideClose
            >
              <DialogTitle className="sr-only">预览: {alt}</DialogTitle>
              <div className="relative flex flex-col items-center justify-center w-full h-full p-4 sm:p-8 overflow-hidden">
                <div 
                  className="relative transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing flex items-center justify-center"
                  style={{ transform: `scale(${zoom})` }}
                  onDoubleClick={handlePreviewReset}
                >
                  <img
                    src={renderSrc}
                    alt={alt}
                    className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl select-none"
                  />
                </div>

                {/* 控制条 */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-xl bg-background/90 dark:bg-gray-900/90 border border-border/40 dark:border-white/10 rounded-full shadow-2xl">
                  <button 
                    onClick={handlePreviewZoomIn}
                    disabled={zoom >= maxZoom}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 text-gray-600 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  </button>
                  <span className="px-2 font-mono text-xs font-bold text-gray-500 w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={handlePreviewZoomOut}
                    disabled={zoom <= minZoom}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 text-gray-600 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  </button>
                  <div className="w-px h-3 bg-gray-200 dark:bg-gray-800 mx-1" />
                  <button 
                    onClick={handlePreviewReset}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
                  <div className="w-px h-3 bg-gray-200 dark:bg-gray-800 mx-1" />
                  <button 
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 text-gray-600 dark:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      {caption ? (
        <span className="mt-3 block text-center text-xs font-medium text-gray-500 dark:text-gray-400">
          {caption}
        </span>
      ) : null}
    </span>
  )
}

