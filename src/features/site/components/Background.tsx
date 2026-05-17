'use client'

export function InteractiveBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* 极简高级质感底层 */}
      <div className="absolute inset-0 bg-background" />
      
      {/* 极柔和的顶部漫射光源，营造温暖的纸质空间感 */}
      <div className="absolute inset-x-0 -top-[40%] h-[90%] opacity-10 dark:opacity-15 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
      </div>
      
      {/* 静态噪点层，提供纸张般的高级材质感 */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] mix-blend-overlay pointer-events-none" 
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
        aria-hidden="true" 
      />
    </div>
  )
}
