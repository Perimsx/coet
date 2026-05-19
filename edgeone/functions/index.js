/**
 * EdgeOne 边缘函数：IP 定位代理
 *
 * 核心价值：
 * - 微信/QQ 内置浏览器无法直接解析 ipapi.co 等域名（DNS 被污染）
 * - 边缘函数运行在腾讯云节点上，DNS 解析正常
 * - 客户端只需调用自身域名的 /api/geo，由边缘函数代理到第三方 API
 * - 结果可缓存，减少第三方 API 调用频率
 */

// IP API 策略列表（按优先级）
const IP_APIS = [
  {
    getUrl: (ip) => ip 
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
    getUrl: (ip) => ip 
      ? `https://api.ip.sb/geoip/${ip}` 
      : 'https://api.ip.sb/geoip',
    parse: (data) => ({
      city: data.city,
      region: data.region,
      country: data.country_code,
      lat: data.latitude,
      lon: data.longitude,
    }),
  },
];

// 城市拼音 → 中文映射
const CITY_MAP = {
  beijing: '北京', shanghai: '上海', guangzhou: '广州', shenzhen: '深圳',
  chengdu: '成都', hangzhou: '杭州', wuhan: '武汉', chongqing: '重庆',
  nanjing: '南京', tianjin: '天津', suzhou: '苏州', xian: '西安',
  'hong kong': '香港', macau: '澳门', taipei: '台北',
};

function normalizeCity(city) {
  if (!city) return '';
  const lower = city.toLowerCase().replace(/ city$/, '').replace(/ shi$/, '').trim();
  return CITY_MAP[lower] || city;
}

// 从请求中提取客户端真实 IP
function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    ''
  );
}

async function fetchGeo(ip) {
  for (const api of IP_APIS) {
    try {
      const url = api.getUrl(ip);
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const result = api.parse(data);
      if (result.city) {
        result.city = normalizeCity(result.city);
        return result;
      }
    } catch {
      continue;
    }
  }
  return { city: '远方', region: '', country: '', lat: null, lon: null };
}

async function handleGeoRequest(request) {
  const ip = getClientIP(request);
  const geo = await fetchGeo(ip);

  return new Response(JSON.stringify(geo), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=1800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// 处理请求
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 路由：/api/geo — IP 定位代理
  if (url.pathname === '/api/geo') {
    return handleGeoRequest(request);
  }

  // 其他请求直接返回（让 EdgeOne Pages 处理静态文件）
  return fetch(request);
}
