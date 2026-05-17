'use client'

import { Cloud, Sun, Moon, Coffee, Sunset } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GreetingState {
  text: string
  icon: React.ReactNode
}

function getSmartGreeting(): GreetingState {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 9) {
    return {
      text: '清晨好',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />
    }
  }
  if (hour >= 9 && hour < 12) {
    return {
      text: '上午好',
      icon: <Sun className="w-3.5 h-3.5 text-orange-500" />
    }
  }
  if (hour >= 12 && hour < 14) {
    return {
      text: '中午好',
      icon: <Sun className="w-3.5 h-3.5 text-red-400" />
    }
  }
  if (hour >= 14 && hour < 18) {
    return {
      text: '下午好',
      icon: <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
    }
  }
  if (hour >= 18 && hour < 22) {
    return {
      text: '晚上好',
      icon: <Sunset className="w-3.5 h-3.5 text-orange-400" />
    }
  }
  
  return {
    text: '夜深了',
    icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />
  }
}

export default function VisitorBubble() {
  const [location, setLocation] = useState('星辰大海')
  const [isLoaded, setIsLoaded] = useState(false)
  const greeting = useMemo(() => getSmartGreeting(), [])

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch('https://api.ip.sb/geoip', {
          // 增加一个较短的超时时间，防止气泡长时间显示默认
          signal: AbortSignal.timeout(3000)
        })
        const data = await res.json()
        if (data.city) {
          setLocation(data.city)
        } else if (data.region) {
          setLocation(data.region)
        } else if (data.country_code) {
          try {
            const regionNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
            setLocation(regionNames.of(data.country_code) || data.country || '远方')
          } catch (e) {
            setLocation(data.country || '远方')
          }
        }
      } catch (error) {
        // 请求失败保持默认
      } finally {
        setIsLoaded(true)
      }
    }
    
    fetchLocation()
  }, [])

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-md rounded-2xl text-zinc-600 dark:text-zinc-300 transition-all">
      <div className="flex shrink-0 items-center justify-center">
        {greeting.icon}
      </div>
      
      <span className="flex items-center text-[12.5px]">
        <span className="mr-1.5">{greeting.text}</span>
        <span className="text-muted-foreground/40 mx-1">·</span>
        <span className="text-zinc-500 dark:text-zinc-400">来自</span>
        
        <div className="relative inline-flex min-w-[2.5rem] justify-center ml-1">
          <AnimatePresence mode="wait">
            {!isLoaded ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </motion.div>
            ) : (
              <motion.span
                key="location"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bold text-primary transition-colors"
              >
                {location}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </span>
    </div>
  )
}
