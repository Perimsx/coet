'use client'

import { Sun, Moon, Coffee, Sunset } from 'lucide-react'
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

// 常见城市拼音到中文的映射，兜底外网 API 翻译不准的问题
const cityMap: Record<string, string> = {
  'beijing': '北京', 'shanghai': '上海', 'guangzhou': '广州', 'shenzhen': '深圳',
  'chengdu': '成都', 'hangzhou': '杭州', 'wuhan': '武汉', 'chongqing': '重庆',
  'nanjing': '南京', 'tianjin': '天津', 'suzhou': '苏州', 'xian': '西安',
  'changsha': '长沙', 'shenyang': '沈阳', 'qingdao': '青岛', 'zhengzhou': '郑州',
  'dalian': '大连', 'dongguan': '东莞', 'ningbo': '宁波', 'xiamen': '厦门',
  'fuzhou': '福州', 'wuxi': '无锡', 'hefei': '合肥', 'kunming': '昆明',
  'harbin': '哈尔滨', 'jinan': '济南', 'foshan': '佛山', 'changchun': '长春',
  'wenzhou': '温州', 'shijiazhuang': '石家庄', 'nanning': '南宁', 'changzhou': '常州',
  'quanzhou': '泉州', 'nantong': '南通', 'guiyang': '贵阳', 'taiyuan': '太原',
  'haikou': '海口', 'zhuhai': '珠海', 'zhongshan': '中山', 'lanzhou': '兰州',
  'hong kong': '香港', 'macau': '澳门', 'taipei': '台北'
}

function normalizeCityName(city: string) {
  if (!city) return ''
  const lower = city.toLowerCase().replace(/ city$/, '').replace(/ shi$/, '').trim()
  return cityMap[lower] || city
}

async function getWeather(lat: number, lon: number) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, { 
      signal: AbortSignal.timeout(4000) 
    })
    const data = await res.json()
    if (data?.current_weather) {
      const code = data.current_weather.weathercode
      const temp = Math.round(data.current_weather.temperature)
      
      let icon = '☁️'
      if (code === 0) icon = '☀️'
      else if (code === 1 || code === 2 || code === 3) icon = '⛅'
      else if (code >= 45 && code <= 48) icon = '🌫️'
      else if (code >= 51 && code <= 67) icon = '🌧️'
      else if (code >= 71 && code <= 77) icon = '❄️'
      else if (code >= 95 && code <= 99) icon = '⛈️'
      
      return `${icon} ${temp}°C`
    }
  } catch {}
  return null
}

export default function VisitorBubble() {
  const [locationStr, setLocationStr] = useState('星辰大海')
  const [isLoaded, setIsLoaded] = useState(false)
  const greeting = useMemo(() => getSmartGreeting(), [])

  useEffect(() => {
    const fetchData = async () => {
      let locName = '远方'
      let weatherStr = ''
      
      try {
        // 主用：ipwhois.app（加入经纬度）
        const res = await fetch('https://ipwhois.app/json/?lang=zh-CN&objects=city,region,country,country_code,latitude,longitude', {
          signal: AbortSignal.timeout(6000)
        })
        const data = await res.json()
        
        const rawCity = data.city || data.region || data.country
        locName = normalizeCityName(rawCity) || '远方'

        // 请求天气
        if (data.latitude && data.longitude) {
          const w = await getWeather(data.latitude, data.longitude)
          if (w && locName !== '远方') weatherStr = ` · ${w}`
        }
      } catch {
        // 备用：api.ip.sb
        try {
          const res = await fetch('https://api.ip.sb/geoip', {
            signal: AbortSignal.timeout(5000)
          })
          const data = await res.json()
          if (data.city) {
            locName = normalizeCityName(data.city) || '远方'
            if (data.latitude && data.longitude) {
              const w = await getWeather(data.latitude, data.longitude)
              if (w && locName !== '远方') weatherStr = ` · ${w}`
            }
          } else if (data.country_code) {
            try {
              const regionNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
              locName = regionNames.of(data.country_code) || data.country || '远方'
            } catch {
              locName = data.country || '远方'
            }
          }
        } catch {
          // 全部失败保持默认
        }
      } finally {
        setLocationStr(locName + weatherStr)
        setIsLoaded(true)
      }
    }
    
    fetchData()
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
                className="font-bold text-primary transition-colors whitespace-nowrap"
              >
                {locationStr}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </span>
    </div>
  )
}
