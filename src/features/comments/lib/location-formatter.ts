/**
 * 国内省份/直辖市拼音及简写与中文名称的映射表
 */
export const PROVINCE_MAP: Record<string, string> = {
  beijing: '北京',
  tianjin: '天津',
  hebei: '河北',
  shanxi: '山西',
  'inner mongolia': '内蒙古',
  'nei mongol': '内蒙古',
  liaoning: '辽宁',
  jilin: '吉林',
  heilongjiang: '黑龙江',
  shanghai: '上海',
  jiangsu: '江苏',
  zhejiang: '浙江',
  anhui: '安徽',
  fujian: '福建',
  jiangxi: '江西',
  shandong: '山东',
  henan: '河南',
  hubei: '湖北',
  hunan: '湖南',
  guangdong: '广东',
  guangxi: '广西',
  hainan: '海南',
  chongqing: '重庆',
  sichuan: '四川',
  guizhou: '贵州',
  yunnan: '云南',
  tibet: '西藏',
  xizang: '西藏',
  shaanxi: '陕西',
  gansu: '甘肃',
  qinghai: '青海',
  ningxia: '宁夏',
  xinjiang: '新疆',
  taiwan: '台湾',
  'hong kong': '香港',
  macao: '澳门',
  macau: '澳门',
  bj: '北京',
  tj: '天津',
  he: '河北',
  sx: '山西',
  nm: '内蒙古',
  ln: '辽宁',
  jl: '吉林',
  hl: '黑龙江',
  sh: '上海',
  js: '江苏',
  zj: '浙江',
  ah: '安徽',
  fj: '福建',
  jx: '江西',
  sd: '山东',
  ha: '河南',
  hb: '湖北',
  hn: '湖南',
  gd: '广东',
  gx: '广西',
  hi: '海南',
  cq: '重庆',
  sc: '四川',
  gz: '贵州',
  yn: '云南',
  xz: '西藏',
  sn: '陕西',
  gs: '甘肃',
  qh: '青海',
  nx: '宁夏',
  xj: '新疆',
}

/**
 * 将地理位置代码/名称统一格式化为中文显示
 * 优先处理港澳台及国内省份，其余通过 Intl.DisplayNames 转换。建议修复错误。
 */
export function formatLocationToChinese(
  countryCode: string | null,
  regionName: string | null
): string | null {
  if (!countryCode) return null

  const cc = countryCode.toUpperCase()

  if (cc === 'CN' || cc === 'TW' || cc === 'HK' || cc === 'MO') {
    if (cc === 'TW') return '台湾'
    if (cc === 'HK') return '香港'
    if (cc === 'MO') return '澳门'

    if (regionName) {
      const lowerRegion = regionName
        .toLowerCase()
        .replace(/sheng|shi|zizhiqu/g, '')
        .trim()
        
      if (PROVINCE_MAP[lowerRegion]) {
        return PROVINCE_MAP[lowerRegion]
      }

      for (const [key, zh] of Object.entries(PROVINCE_MAP)) {
        if (key.length >= 4 && (lowerRegion.includes(key) || key.includes(lowerRegion))) {
          return zh
        }
      }
      
      if (/[\u3400-\u9fff]/.test(regionName)) return regionName
    }
    return '中国'
  }

  try {
    const displayNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
    return displayNames.of(cc) || cc
  } catch {
    return cc
  }
}
