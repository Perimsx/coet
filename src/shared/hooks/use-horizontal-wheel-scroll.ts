'use client'

import { useEffect, type RefObject } from 'react'

export function useHorizontalWheelScroll(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const rail = ref.current
    if (!rail) return

    const onWheel = (event: WheelEvent) => {
      if (!window.matchMedia('(pointer: fine)').matches) return
      if (rail.scrollWidth <= rail.clientWidth) return

      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (delta === 0) return

      rail.scrollLeft += delta
      event.preventDefault()
    }

    rail.addEventListener('wheel', onWheel, { passive: false })
    return () => rail.removeEventListener('wheel', onWheel)
  }, [ref])
}
