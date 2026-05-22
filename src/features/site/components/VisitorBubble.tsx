'use client'

import { Sun, Moon, Coffee, Sunset } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavLanguage } from '@/features/site/lib/nav-language'

interface GreetingState {
  text: string
  icon: React.ReactNode
}

function getSmartGreeting(locale: string): GreetingState {
  const hour = new Date().getHours()
  const isEn = locale === 'en'

  if (hour >= 5 && hour < 9) {
    return {
      text: isEn ? 'Good Morning' : '清晨好',
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />
    }
  }
  if (hour >= 9 && hour < 12) {
    return {
      text: isEn ? 'Good Morning' : '上午好',
      icon: <Sun className="w-3.5 h-3.5 text-orange-500" />
    }
  }
  if (hour >= 12 && hour < 14) {
    return {
      text: isEn ? 'Good Noon' : '中午好',
      icon: <Sun className="w-3.5 h-3.5 text-red-400" />
    }
  }
  if (hour >= 14 && hour < 18) {
    return {
      text: isEn ? 'Good Afternoon' : '下午好',
      icon: <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
    }
  }
  if (hour >= 18 && hour < 22) {
    return {
      text: isEn ? 'Good Evening' : '晚上好',
      icon: <Sunset className="w-3.5 h-3.5 text-orange-400" />
    }
  }

  return {
    text: isEn ? 'Late Night' : '夜深了',
    icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />
  }
}

// 时区到城市的粗略映射，作为所有 API 失败的最终兜底
const timezoneMap: Record<string, { zh: string; en: string }> = {
  'Asia/Shanghai': { zh: '中国', en: 'China' },
  'Asia/Chongqing': { zh: '中国', en: 'China' },
  'Asia/Hong_Kong': { zh: '香港', en: 'Hong Kong' },
  'Asia/Macau': { zh: '澳门', en: 'Macau' },
  'Asia/Taipei': { zh: '台北', en: 'Taipei' },
  'Asia/Tokyo': { zh: '日本', en: 'Japan' },
  'Asia/Seoul': { zh: '韩国', en: 'Korea' },
  'Asia/Singapore': { zh: '新加坡', en: 'Singapore' },
  'America/New_York': { zh: '纽约', en: 'New York' },
  'America/Los_Angeles': { zh: '洛杉矶', en: 'Los Angeles' },
  'Europe/London': { zh: '伦敦', en: 'London' },
  'Europe/Paris': { zh: '巴黎', en: 'Paris' },
}

// 城市拼音 → 中文映射，确保前端获取地名能完美本土化
const CITY_ZH_MAP: Record<string, string> = {
  // 直辖市及特别行政区
  beijing: '北京', shanghai: '上海', tianjin: '天津', chongqing: '重庆',
  'hong kong': '香港', macau: '澳门', taipei: '台北', taiwan: '台湾',
  // 常用二三线及省会
  guangzhou: '广州', shenzhen: '深圳', dongguan: '东莞', foshan: '佛山',
  huizhou: '惠州', zhuhai: '珠海', shantou: '汕头', jiangmen: '江门',
  hangzhou: '杭州', ningbo: '宁波', wenzhou: '温州', shaoxing: '绍兴',
  jiaxing: '嘉兴', jinhua: '金华', taizhou: '台州',
  nanjing: '南京', suzhou: '苏州', wuxi: '无锡', changzhou: '常州',
  nantong: '南通', yangzhou: '扬州', xuzhou: '徐州',
  chengdu: '成都', mianyang: '绵阳', leshan: '乐山', nanchong: '南充',
  wuhan: '武汉', yichang: '宜昌', xiangyang: '襄阳',
  changsha: '长沙', zhuzhou: '株洲', hengyang: '衡阳', yueyang: '岳阳',
  zhengzhou: '郑州', luoyang: '洛阳', nanyang: '南阳', xinxiang: '新乡',
  xian: '西安', xianyang: '咸阳', baoji: '宝鸡',
  jinan: '济南', qingdao: '青岛', yantai: '烟台', weifang: '潍坊',
  zibo: '淄博', jining: '济宁', linyi: '临沂',
  hefei: '合肥', wuhu: '芜湖', anqing: '安庆',
  fuzhou: '福州', xiamen: '厦门', quanzhou: '泉州', zhangzhou: '漳州',
  nanchang: '南昌', ganzhou: '赣州', jiujiang: '九江',
  shijiazhuang: '石家庄', tangshan: '唐山', baoding: '保定', handan: '邯郸',
  taiyuan: '太原', datong: '大同', changzhi: '长治',
  shenyang: '沈阳', dalian: '大连', anshan: '鞍山',
  changchun: '长春', jilin: '吉林',
  harbin: '哈尔滨', daqing: '大庆', qiqihaer: '齐齐哈尔',
  kunming: '昆明', lijiang: '丽江', dali: '大理',
  guiyang: '贵阳', zunyi: '遵义',
  nanning: '南宁', guilin: '桂林', liuzhou: '柳州',
  haikou: '海口', sanya: '三亚',
  lhasa: '拉萨',
  lanzhou: '兰州', tianshui: '天水',
  xining: '西宁',
  yinchuan: '银川',
  urumqi: '乌鲁木齐',
  hohhot: '呼和浩特', baotou: '包头',
}

// 常见国家/地区翻译映射
const COUNTRY_ZH_MAP: Record<string, string> = {
  jp: '日本', japan: '日本',
  us: '美国', usa: '美国', 'united states': '美国',
  cn: '中国', china: '中国',
  hk: '香港', 'hong kong': '香港',
  mo: '澳门', macau: '澳门',
  tw: '台湾', taiwan: '台湾',
  sg: '新加坡', singapore: '新加坡',
  kr: '韩国', korea: '韩国', 'south korea': '韩国',
  gb: '英国', uk: '英国', 'united kingdom': '英国',
  fr: '法国', france: '法国',
  de: '德国', germany: '德国',
  ca: '加拿大', canada: '加拿大',
  au: '澳大利亚', australia: '澳大利亚',
  ru: '俄罗斯', russia: '俄罗斯',
}

function translateCityToZh(city: string): string {
  if (!city) return ''
  const clean = city.toLowerCase()
    .replace(/\s+city$/i, '')
    .replace(/\s+shi$/i, '')
    .trim()
  return CITY_ZH_MAP[clean] || COUNTRY_ZH_MAP[clean] || city
}

function getLocationFromTimezone(locale: string): string {
  const isEn = locale === 'en'
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const mapped = timezoneMap[tz]
    if (mapped) {
      return isEn ? mapped.en : mapped.zh
    }
    return isEn ? 'Afar' : '远方'
  } catch {
    return isEn ? 'Afar' : '远方'
  }
}

async function getWeather(lat: number, lon: number) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {
      signal: AbortSignal.timeout(4000)
    })
    if (!res.ok) return null
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

// ─── 内置浏览器检测（微信 / QQ / 钉钉 / 微博等） ───
// 覆盖所有已知变体，宁可误判也不漏判
function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /MicroMessenger|QQBrowser|MQQBrowser|QQ\//i.test(ua)
      || /QihooBrowser|Weibo|DingTalk|MiuiBrowser/i.test(ua)
}

// 优先通过 EdgeOne 边缘函数代理 IP 定位（解决微信/QQ 内置浏览器 DNS 问题）
// 边缘函数运行在腾讯云节点，DNS 正常，客户端只请求自身域名
async function fetchLocationData(locale: string): Promise<{
  city: string
  lat?: number
  lon?: number
}> {
  const isEn = locale === 'en'
  const inApp = isInAppBrowser()

  // 策略：EdgeOne 边缘函数代理（本地开发跳过请求以消除控制台 404 报错）
  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  if (!isLocal) {
    try {
      const res = await fetch('/api/geo', {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        const city = data.city || data.country || (isEn ? 'Unknown' : '未知')
        return { city, lat: data.lat, lon: data.lon }
      }
    } catch {}
  }

  // 内置浏览器至此截止，使用时区兜底
  if (inApp) {
    return { city: getLocationFromTimezone(locale) }
  }

  // 降级策略 2：api.ip.sb 探测
  try {
    const res = await fetch('https://api.ip.sb/geoip', {
      signal: AbortSignal.timeout(4000)
    })
    const data = await res.json()
    const city = data.city || data.country_code || (isEn ? 'Unknown' : '未知')
    return {
      city,
      lat: data.latitude,
      lon: data.longitude,
    }
  } catch {}

  // 降级策略 3：ip-api.com 探测
  try {
    const res = await fetch('https://ip-api.com/json/?fields=city,countryCode,lat,lon&lang=zh-CN', {
      signal: AbortSignal.timeout(4000)
    })
    const data = await res.json()
    const city = data.city || data.countryCode || (isEn ? 'Unknown' : '未知')
    return {
      city,
      lat: data.lat,
      lon: data.lon,
    }
  } catch {}

  // 最终兜底：时区推断
  return { city: getLocationFromTimezone(locale) }
}

export default function VisitorBubble() {
  const { locale } = useNavLanguage()
  const isEn = locale === 'en'
  const [mounted, setMounted] = useState(false)
  const [locationStr, setLocationStr] = useState(isEn ? 'Galaxy' : '星辰大海')
  const [isLoaded, setIsLoaded] = useState(false)
  const [greeting, setGreeting] = useState<GreetingState | null>(null)

  useEffect(() => {
    setMounted(true)
    setGreeting(getSmartGreeting(locale))

    // 内置浏览器：直接显示默认文案，完全不发起任何外部请求
    if (isInAppBrowser()) {
      setLocationStr(isEn ? 'Friend from afar' : '远方的朋友')
      setIsLoaded(true)
      return
    }

    const fetchData = async () => {
      let locName = isEn ? 'Afar' : '远方'
      let weatherStr = ''

      try {
        const locData = await fetchLocationData(locale)
        locName = locData.city || (isEn ? 'Afar' : '远方')
        if (!isEn && locName) {
          locName = translateCityToZh(locName)
        }

        // 请求天气
        if (locData.lat && locData.lon && locName !== (isEn ? 'Afar' : '远方')) {
          const w = await getWeather(locData.lat, locData.lon)
          if (w) weatherStr = ` · ${w}`
        }
      } catch {
        // 全部失败保持时区推断
        locName = getLocationFromTimezone(locale)
        if (!isEn && locName) {
          locName = translateCityToZh(locName)
        }
      } finally {
        setLocationStr(locName + weatherStr)
        setIsLoaded(true)
      }
    }

    fetchData()
  }, [locale, isEn])

  if (!mounted || !greeting) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-md rounded-2xl text-zinc-600 dark:text-zinc-300 min-h-[34px] w-[180px] animate-pulse" />
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-md rounded-2xl text-zinc-600 dark:text-zinc-300 transition-all">
      <div className="flex shrink-0 items-center justify-center">
        {greeting.icon}
      </div>

      <span className="flex items-center text-[12.5px]">
        <span className="mr-1.5">{greeting.text}</span>
        <span className="text-muted-foreground/40 mx-1">·</span>
        <span className="text-zinc-500 dark:text-zinc-400">{isEn ? 'from' : '来自'}</span>

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
