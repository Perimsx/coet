'use client'

import type { CSSProperties } from 'react'

const rainStreaks = [
  ['6%', '-8%', 70, 9.2, -1.4, 0.16],
  ['15%', '18%', 60, 10.8, -5.1, 0.14],
  ['25%', '35%', 50, 9.6, -6.7, 0.14],
  ['38%', '30%', 85, 12.4, -8.2, 0.15],
  ['55%', '23%', 90, 11.8, -7.8, 0.14],
  ['70%', '-12%', 80, 12.9, -3.6, 0.14],
  ['85%', '20%', 70, 10.8, -9.4, 0.14],
  ['94%', '33%', 88, 12.6, -7.2, 0.15],
] as const

export function InteractiveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* 基础纸面底色 */}
      <div className="absolute inset-0 bg-paper" />

      {/* 顶部微弱柔光 */}
      <div className="absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--accent)_8%,transparent),transparent_65%)] opacity-60 dark:opacity-30" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper via-paper/80 to-transparent" />

      {/* 宁静雨丝微动效 */}
      <div className="absolute inset-0 overflow-hidden opacity-40 dark:opacity-30" aria-hidden="true">
        {rainStreaks.map(([left, top, height, duration, delay, opacity], index) => (
          <span
            key={`${left}-${top}-${index}`}
            className="shiro-rain-streak"
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

      {/* 真实纸质纸张颗粒纹理 (Paper texture) */}
      <div 
        className="absolute inset-0 opacity-[0.032] mix-blend-multiply dark:opacity-[0.015] dark:mix-blend-screen" 
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
        aria-hidden="true" 
      />
    </div>
  )
}
