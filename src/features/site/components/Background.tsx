'use client'

import type { CSSProperties } from 'react'

const rainStreaks = [
  ['5%', '-8%', 76, 8.8, -1.4, 0.24],
  ['12%', '18%', 64, 10.4, -5.1, 0.2],
  ['18%', '-16%', 92, 11.8, -2.2, 0.18],
  ['24%', '35%', 56, 9.3, -6.7, 0.2],
  ['31%', '4%', 80, 10.9, -4.3, 0.18],
  ['39%', '30%', 96, 12.2, -8.2, 0.2],
  ['46%', '-10%', 68, 8.9, -3.4, 0.16],
  ['52%', '23%', 100, 11.6, -7.8, 0.18],
  ['59%', '0%', 74, 10.1, -1.9, 0.22],
  ['66%', '40%', 62, 9.8, -6.1, 0.16],
  ['74%', '-12%', 94, 12.7, -3.6, 0.18],
  ['83%', '20%', 78, 10.6, -9.4, 0.18],
  ['91%', '2%', 66, 9.4, -4.8, 0.16],
  ['96%', '33%', 98, 12.4, -7.2, 0.18],
] as const

export function InteractiveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-background" />

      <div className="cot-page-head-gradient" aria-hidden="true" />

      <div className="absolute inset-0 bg-grid bg-grid-mask opacity-55 dark:opacity-35" aria-hidden="true" />

      <div className="absolute inset-x-0 top-0 h-[62vh] bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--accent)_16%,transparent),transparent_64%)] opacity-75 dark:opacity-45" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-background via-background/70 to-transparent" />

      <div className="absolute inset-0 overflow-hidden opacity-70 dark:opacity-60" aria-hidden="true">
        {rainStreaks.map(([left, top, height, duration, delay, opacity], index) => (
          <span
            key={`${left}-${top}-${index}`}
            className={`shiro-rain-streak ${index > 7 ? 'hidden sm:block' : ''}`}
            style={
              {
                left,
                top,
                height: `${height}px`,
                '--rain-opacity': opacity,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.018] dark:mix-blend-screen" 
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
        aria-hidden="true" 
      />
    </div>
  )
}
