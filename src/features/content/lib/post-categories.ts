import { slug } from 'github-slugger'

const FALLBACK_CATEGORY = 'general'

// 正向字典：slug -> 显示名
export const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  "general": { "zh": "综合", "en": "General" },
  "artificial-intelligence": { "zh": "人工智能", "en": "Artificial Intelligence" },
  "cyber-security": { "zh": "网络安全", "en": "Cyber Security" },
  "penetration-testing": { "zh": "渗透测试", "en": "Penetration Testing" },
  "algorithms": { "zh": "算法详解", "en": "Algorithms" },
  "project-practice": { "zh": "项目实践", "en": "Project Practice" },
  "system-design": { "zh": "系统设计", "en": "System Design" },
  "coet-dev": { "zh": "工作站开发", "en": "Coet Development" },
}

// 别名字典：乱写的中文分类 / 变体 -> 标准 slug (保障路由为英文)
const CATEGORY_ALIASES: Record<string, string> = {
  "系统设计": "system-design",
  "工作站开发": "coet-dev",
  "coet": "coet-dev",
  "项目开发": "project-practice",
  "项目实践": "project-practice",
  "渗透测试": "penetration-testing",
  "渗透": "penetration-testing",
  "算法详解": "algorithms",
  "算法": "algorithms",
  "网络安全": "cyber-security",
  "安全": "cyber-security",
  "人工智能": "artificial-intelligence",
  "ai": "artificial-intelligence",
  "综合": "general",
}

export function normalizeCategoryToSlug(category: string): string {
  if (!category) return FALLBACK_CATEGORY
  const trimmed = String(category).trim()
  
  // 1. 优先命中中文到英文 slug 的翻译映射
  if (CATEGORY_ALIASES[trimmed]) {
    return CATEGORY_ALIASES[trimmed]
  }
  
  // 2. 对于不在字典中的新分类，尝试 slugify
  const sluggified = slug(trimmed)
  return sluggified || FALLBACK_CATEGORY
}

// ─── 标签别名字典：中文标签 -> 英文 slug（保障标签路由为纯英文） ───
const TAG_ALIASES: Record<string, string> = {
  // 渗透测试方向
  "后渗透": "post-exploitation",
  "反弹shell": "reverse-shell",
  "反弹Shell": "reverse-shell",
  "持久化": "persistence",
  "漏洞利用": "exploit",
  "服务攻击": "service-exploitation",
  "票据攻击": "ticket-attack",
  "提权": "privilege-escalation",
  "uac绕过": "uac-bypass",
  "UAC绕过": "uac-bypass",
  "令牌窃取": "token-theft",
  "信息收集": "recon",
  "smb枚举": "smb-enumeration",
  "SMB枚举": "smb-enumeration",
  "侦察": "reconnaissance",
  "域渗透": "domain-exploitation",
  "横向移动": "lateral-movement",
  "内核漏洞": "kernel-exploit",
  // AI / 算法方向
  "ai分析": "ai-analysis",
  "AI分析": "ai-analysis",
  "深度学习": "deep-learning",
  "动态规划": "dynamic-programming",
  "编程": "programming",
  "排序": "sorting",
  "性能分析": "performance-analysis",
  "图论": "graph-theory",
  "最短路径": "shortest-path",
  // 工程方向
  "全栈架构": "fullstack-architecture",
  "工程化": "engineering",
  // 工具
  "Metasploit": "metasploit",
  "Meterpreter": "meterpreter",
  "LeetCode": "leetcode",
}

// ─── 标签正向字典：英文 slug -> 显示名（用于标签页展示） ───
const TAG_LABELS: Record<string, { zh: string; en: string }> = {
  "post-exploitation": { zh: "后渗透", en: "Post-Exploitation" },
  "reverse-shell": { zh: "反弹Shell", en: "Reverse Shell" },
  "persistence": { zh: "持久化", en: "Persistence" },
  "exploit": { zh: "漏洞利用", en: "Exploit" },
  "service-exploitation": { zh: "服务攻击", en: "Service Exploitation" },
  "ticket-attack": { zh: "票据攻击", en: "Ticket Attack" },
  "privilege-escalation": { zh: "提权", en: "Privilege Escalation" },
  "uac-bypass": { zh: "UAC绕过", en: "UAC Bypass" },
  "token-theft": { zh: "令牌窃取", en: "Token Theft" },
  "recon": { zh: "信息收集", en: "Recon" },
  "smb-enumeration": { zh: "SMB枚举", en: "SMB Enumeration" },
  "reconnaissance": { zh: "侦察", en: "Reconnaissance" },
  "domain-exploitation": { zh: "域渗透", en: "Domain Exploitation" },
  "lateral-movement": { zh: "横向移动", en: "Lateral Movement" },
  "kernel-exploit": { zh: "内核漏洞", en: "Kernel Exploit" },
  "ai-analysis": { zh: "AI分析", en: "AI Analysis" },
  "deep-learning": { zh: "深度学习", en: "Deep Learning" },
  "dynamic-programming": { zh: "动态规划", en: "Dynamic Programming" },
  "programming": { zh: "编程", en: "Programming" },
  "sorting": { zh: "排序", en: "Sorting" },
  "performance-analysis": { zh: "性能分析", en: "Performance Analysis" },
  "graph-theory": { zh: "图论", en: "Graph Theory" },
  "shortest-path": { zh: "最短路径", en: "Shortest Path" },
  "fullstack-architecture": { zh: "全栈架构", en: "Fullstack Architecture" },
  "engineering": { zh: "工程化", en: "Engineering" },
  "linux": { zh: "Linux", en: "Linux" },
  "windows": { zh: "Windows", en: "Windows" },
  "metasploit": { zh: "Metasploit", en: "Metasploit" },
  "meterpreter": { zh: "Meterpreter", en: "Meterpreter" },
  "nmap": { zh: "Nmap", en: "Nmap" },
  "osint": { zh: "OSINT", en: "OSINT" },
  "mimikatz": { zh: "Mimikatz", en: "Mimikatz" },
  "kerberos": { zh: "Kerberos", en: "Kerberos" },
  "smb": { zh: "SMB", en: "SMB" },
  "rdp": { zh: "RDP", en: "RDP" },
  "winrm": { zh: "WinRM", en: "WinRM" },
  "suid": { zh: "SUID", en: "SUID" },
  "active-directory": { zh: "Active Directory", en: "Active Directory" },
  "leetcode": { zh: "LeetCode", en: "LeetCode" },
  "nextjs": { zh: "Next.js", en: "Next.js" },
  "mdx": { zh: "MDX", en: "MDX" },
}

export function normalizeTagToSlug(tag: string): string {
  if (!tag) return ''
  const trimmed = String(tag).trim()
  if (TAG_ALIASES[trimmed]) return TAG_ALIASES[trimmed]
  // 英文标签直接 slugify（小写、连字符）
  return slug(trimmed)
}

export function getTagLabel(tag: string, locale: 'zh' | 'en' = 'zh'): string {
  const tagSlug = normalizeTagToSlug(tag)
  if (TAG_LABELS[tagSlug]) return TAG_LABELS[tagSlug][locale]
  const hasChinese = /[\u4e00-\u9fa5]/.test(tag)
  if (hasChinese) return tag
  return toTitleCase(tag.replace(/-/g, ' '))
}

function normalizeSourcePath(sourcePath: string) {
  return sourcePath.replace(/\\/g, '/').toLowerCase()
}

function toTitleCase(input: string) {
  return input.replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

function inferCategoryFromPath(sourcePath: string) {
  const normalizedPath = normalizeSourcePath(sourcePath)
  const segments = normalizedPath.split('/').filter(Boolean)

  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const candidate = normalizeCategoryToSlug(segments[index])
    if (!candidate || candidate === 'blog' || candidate === 'content') {
      continue
    }

    if (CATEGORY_LABELS[candidate]) {
      return candidate
    }
  }

  return FALLBACK_CATEGORY
}

export function resolvePostCategories(categories: string[] | undefined, sourcePath: string) {
  const normalized = (categories || [])
    .map((category) => normalizeCategoryToSlug(category))
    .filter(Boolean)

  if (normalized.length) {
    return [...new Set(normalized)]
  }

  return [inferCategoryFromPath(sourcePath)]
}

export function getCategoryLabel(category: string, locale: 'zh' | 'en' = 'zh') {
  if (!category) {
    return CATEGORY_LABELS[FALLBACK_CATEGORY]?.[locale] || (locale === 'en' ? 'Other' : '其他')
  }
  
  // 1. 尝试从映射表找 (针对英文 slug 映射中文)
  const categorySlug = normalizeCategoryToSlug(category)
  if (CATEGORY_LABELS[categorySlug]) {
    return CATEGORY_LABELS[categorySlug][locale]
  }

  // 2. 如果本身就是中文，直接返回
  const hasChinese = /[\u4e00-\u9fa5]/.test(category)
  if (hasChinese) {
    return category
  }

  // 3. 兜底处理 (Title Case)
  return toTitleCase(category.replace(/-/g, ' '))
}
