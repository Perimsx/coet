'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import BrandLogo from '@/shared/media/BrandLogo'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => setPhase(3), 1600)
    const timer = setTimeout(() => {
      setVisible(false)
      document.body.style.overflow = ''
    }, 2500)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        >
          {/* 背景光效 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]"
            />
          </div>

          <div className="relative flex flex-col items-center gap-5">
            {/* Logo + 序栈 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <BrandLogo className="h-11 w-11" alt="序栈" />
              <span
                className="flex items-start text-[1.7rem] font-black tracking-tight text-foreground"
                style={{ fontFamily: '"XuandongKaishu"' }}
              >
                序栈
                <span className="ml-0.5 mt-0.5 text-[11px] font-medium leading-none text-muted-foreground/40">©</span>
              </span>
            </motion.div>

            {/* 分割线 + Loading 组合 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center gap-3"
            >
              {/* 进度条 */}
              <div className="relative h-[2px] w-28 overflow-hidden rounded-full bg-muted/50">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: phase >= 3 ? '0%' : phase >= 2 ? '66%' : phase >= 1 ? '33%' : '0%' }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/80 to-primary/40"
                />
              </div>

              {/* Loading 文字 */}
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: phase >= 1 ? 0.35 : 0, y: phase >= 1 ? 0 : 4 }}
                transition={{ duration: 0.4 }}
                className="text-[11px] font-medium text-muted-foreground tracking-[0.25em] uppercase"
              >
                Loading
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
