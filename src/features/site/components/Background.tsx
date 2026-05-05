'use client'

import { useEffect, useRef, useState } from 'react'

// ── 繁星生成逻辑 ──────────────────────────────
function generateStars(layer: number, count: number): string {
  const palettes = [
    ['#cbd5e1', '#94a3b8', '#3b82f6'],
    ['#94a3b8', '#64748b', '#2563eb'],
    ['#3b82f6', '#2563eb', '#1d4ed8'],
  ]
  const colors = palettes[layer]
  const layerAlpha = [0.35, 0.55, 0.85][layer]
  const layerGlow = [0.08, 0.15, 0.45][layer]
  const layerR = [[0.6, 1.2, 2.0], [0.3, 0.6, 1.0], [0.3, 0.6, 1.0]][layer]

  let html = ''
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 100
    const y = Math.random() * 100
    const r = Math.random() * layerR[1] + layerR[0]
    const alpha = Math.random() * 0.25 + layerAlpha
    const color = colors[Math.floor(Math.random() * colors.length)]
    const glow = Math.random() < layerGlow
    const dur = (Math.random() * 4 + 3).toFixed(2)
    const delay = (Math.random() * 6).toFixed(2)
    const size = r * 2
    const zIndex = layer + 1

    let boxShadow = 'none'
    if (layer === 1 && glow) {
      boxShadow = `0 0 ${r * 3}px ${color}55`
    } else if (layer === 2) {
      boxShadow = glow
        ? `0 0 ${r * 4}px ${color}, 0 0 ${r * 8}px ${color}44`
        : `0 0 ${r * 2}px ${color}88`
    }

    html += `<div class="star-far" style="
      position: absolute;
      border-radius: 50%;
      left:${x.toFixed(2)}%;
      top:${y.toFixed(2)}%;
      width:${size.toFixed(2)}px;
      height:${size.toFixed(2)}px;
      background:${color};
      --ta:${alpha.toFixed(3)};
      --tb:${(alpha * 0.15).toFixed(3)};
      opacity:var(--ta);
      z-index:${zIndex};
      box-shadow:${boxShadow};
      animation:twinkle ${dur}s ease-in-out ${delay}s infinite;
      will-change:opacity;
    "></div>`
  }
  return html
}

// ── 流星组件 ──────────────────────────────────
function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    const stars: any[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const fire = () => {
      const sx = Math.random() * 35 + 5
      const sy = Math.random() * 28 + 2
      const angle = -(Math.random() * 10 + 25)
      const len = Math.random() * 110 + 70
      const rad = (angle * Math.PI) / 180
      const ww = canvas.width
      const wh = canvas.height
      stars.push({
        sx: (sx * ww) / 100,
        sy: (sy * wh) / 100,
        ex: ((sx + Math.cos(rad) * len) * ww) / 100,
        ey: ((sy + Math.sin(rad) * len) * wh) / 100,
        progress: 0,
        speed: Math.random() * 0.008 + 0.005,
        width: Math.random() * 0.8 + 0.4,
        color: Math.random() > 0.3 ? '#94a3b8' : '#60a5fa',
        brightness: Math.random() * 0.2 + 0.5,
      })
    }

    const spawnId = setInterval(() => {
      if (Math.random() > 0.45) fire()
    }, 7000)

    const draw = () => {
      rafId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = stars.length - 1; i >= 0; i--) {
        const ss = stars[i]
        ss.progress += ss.speed
        if (ss.progress >= 1) {
          stars.splice(i, 1)
          continue
        }

        const x = ss.sx + (ss.ex - ss.sx) * ss.progress
        const y = ss.sy + (ss.ey - ss.sy) * ss.progress
        const trailStart = Math.max(0, ss.progress - 0.3)
        const endProgress = trailStart + 0.28

        const grad = ctx.createLinearGradient(ss.sx, ss.sy, x, y)
        grad.addColorStop(0, 'rgba(148,163,184,0)')
        grad.addColorStop(endProgress * 0.7, `rgba(59,130,246,${ss.brightness * 0.4})`)
        grad.addColorStop(endProgress, ss.color)
        grad.addColorStop(1, 'rgba(37,99,235, 0.4)')

        ctx.beginPath()
        ctx.moveTo(ss.sx, ss.sy)
        ctx.lineTo(x, y)
        ctx.strokeStyle = grad
        ctx.lineWidth = ss.width
        ctx.lineCap = 'round'
        ctx.stroke()

        const headAlpha = 1 - ss.progress * 0.25
        ctx.beginPath()
        ctx.arc(x, y, ss.width * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${headAlpha})`
        ctx.fill()
      }
    }

    draw()
    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(spawnId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
}

// ── 主背景组件 ────────────────────────────────
export function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [starsHTML, setStarsHTML] = useState('')

  useEffect(() => {
    // 仅在客户端生成随机繁星
    setStarsHTML(generateStars(0, 120) + generateStars(1, 80) + generateStars(2, 40))

    let lastX = 0.5, lastY = 0.5
    let targetX = 0.5, targetY = 0.5
    let rafId: number

    const handleMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth
      targetY = e.clientY / window.innerHeight
    }

    const update = () => {
      lastX += (targetX - lastX) * 0.08
      lastY += (targetY - lastY) * 0.08
      
      const time = Date.now() * 0.0005
      const roamX = Math.sin(time * 0.7) * 0.02 + lastX
      const roamY = Math.cos(time * 0.5) * 0.02 + lastY

      if (containerRef.current) {
        containerRef.current.style.setProperty('--mx', roamX.toFixed(4))
        containerRef.current.style.setProperty('--my', roamY.toFixed(4))
      }
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('mousemove', handleMove)
    update()
    
    return () => {
      window.removeEventListener('mousemove', handleMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="bg-base" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />
      <div className="bg-interactive" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      
      {/* 繁星层 - 仅在生成后渲染 */}
      {starsHTML && (
        <div 
          className="stars-layer absolute inset-[-5%] overflow-hidden" 
          aria-hidden="true" 
          dangerouslySetInnerHTML={{ __html: starsHTML }}
          style={{
            transform: 'translate(calc(var(--mx, 0.5) * -1.5%), calc(var(--my, 0.5) * -1.5%))',
            willChange: 'transform'
          }}
        />
      )}

      {/* 流星层 */}
      <ShootingStars />
    </div>
  )
}
