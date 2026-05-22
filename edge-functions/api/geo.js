/**
 * EdgeOne Pages Edge Function — IP 定位代理
 * 路由：/api/geo（由目录结构 edge-functions/api/geo.js 自动映射）
 *
 * 为什么需要代理：
 * - 微信/QQ 内置浏览器无法直接解析 ipapi.co 等境外域名（DNS 污染）
 * - 边缘函数运行在腾讯云全球节点，DNS 解析正常
 * - 客户端只需请求自身域名的 /api/geo，无需跨域
 */

// IP API 策略列表（按优先级，一个失败自动尝试下一个）
const IP_APIS = [
  {
    url: (ip) =>
      ip
        ? `https://ipapi.co/${ip}/json/?fields=city,region,country_code,latitude,longitude`
        : 'https://ipapi.co/json/?fields=city,region,country_code,latitude,longitude',
    parse: (data) => ({
      city: data.city,
      region: data.region,
      country: data.country_code,
      lat: data.latitude,
      lon: data.longitude,
    }),
  },
  {
    url: (ip) =>
      ip ? `https://api.ip.sb/geoip/${ip}` : 'https://api.ip.sb/geoip',
    parse: (data) => ({
      city: data.city,
      region: data.region,
      country: data.country_code,
      lat: data.latitude,
      lon: data.longitude,
    }),
  },
]

// 城市拼音 → 中文映射
const CITY_MAP = {
  beijing: '北京', shanghai: '上海', tianjin: '天津', chongqing: '重庆',
  'hong kong': '香港', macau: '澳门', taipei: '台北', taiwan: '台湾',
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

function normalizeCity(city) {
  if (!city) return ''
  const lower = city.toLowerCase().replace(/ city$/, '').replace(/ shi$/, '').trim()
  return CITY_MAP[lower] || city
}

function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    ''
  )
}

async function fetchGeo(ip) {
  for (const api of IP_APIS) {
    try {
      const res = await fetch(api.url(ip), {
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      })
      if (!res.ok) continue
      const data = await res.json()
      const result = api.parse(data)
      if (result.city) {
        result.city = normalizeCity(result.city)
        return result
      }
    } catch {
      continue
    }
  }
  return { city: '远方', region: '', country: '', lat: null, lon: null }
}

export default async function onRequest(context) {
  const ip = getClientIP(context.request)
  const geo = await fetchGeo(ip)
  const responseData = { ...geo, ip }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=1800',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
