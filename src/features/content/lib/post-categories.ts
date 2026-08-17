import { slug } from "github-slugger";
import categoryLabels from "@/generated/content/category-labels.json";

const FALLBACK_CATEGORY = "general";

// 正向字典：slug -> 显示名
export const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  general: { zh: "综合", en: "General" },
  frontend: { zh: "前端开发", en: "Frontend" },
  backend: { zh: "后端架构", en: "Backend" },
  database: { zh: "数据存储", en: "Database" },
  devops: { zh: "运维工程", en: "DevOps" },
  security: { zh: "安全攻防", en: "Security" },
  "artificial-intelligence": { zh: "人工智能", en: "Artificial Intelligence" },
  "cyber-security": { zh: "网络安全", en: "Cyber Security" },
  "penetration-testing": { zh: "渗透测试", en: "Penetration Testing" },
  algorithms: { zh: "算法详解", en: "Algorithms" },
  "project-practice": { zh: "项目实践", en: "Project Practice" },
  "system-design": { zh: "系统设计", en: "System Design" },
  "coet-dev": { zh: "工作站开发", en: "Xuzhan Development" },
  ...(categoryLabels as Record<string, { zh: string; en: string }>),
};

// 别名字典：中文/英文变体 -> 标准 slug (保障路由为英文)
const CATEGORY_ALIASES: Record<string, string> = {
  // 中文别名
  前端: "frontend",
  前端开发: "frontend",
  后端: "backend",
  后端开发: "backend",
  后端架构: "backend",
  数据库: "database",
  数据存储: "database",
  运维: "devops",
  运维工程: "devops",
  系统设计: "system-design",
  工作站开发: "coet-dev",
  coet: "coet-dev",
  项目开发: "project-practice",
  项目实践: "project-practice",
  渗透测试: "penetration-testing",
  渗透: "penetration-testing",
  算法详解: "algorithms",
  算法: "algorithms",
  网络安全: "cyber-security",
  安全: "security",
  安全攻防: "security",
  人工智能: "artificial-intelligence",
  ai: "artificial-intelligence",
  综合: "general",
  // 英文别名（.en.md frontmatter 变体）
  "project development": "project-practice",
  "penetration testing": "penetration-testing",
  "detailed explanation of algorithm": "algorithms",
};

export function normalizeCategoryToSlug(category: string): string {
  if (!category) return FALLBACK_CATEGORY;
  const trimmed = String(category).trim();

  // 1. 优先命中中文到英文 slug 的翻译映射
  if (CATEGORY_ALIASES[trimmed]) {
    return CATEGORY_ALIASES[trimmed];
  }

  // 2. 对于不在字典中的新分类，尝试 slugify
  const sluggified = slug(trimmed);
  return sluggified || FALLBACK_CATEGORY;
}

// ─── 标签别名字典：中文标签 -> 英文 slug（保障标签路由为纯英文） ───
const TAG_ALIASES: Record<string, string> = {
  // 基础 & 核心技术
  "C/C++": "c-cpp",
  "c/c++": "c-cpp",
  "Node.js": "nodejs",
  "Next.js": "nextjs",
  "Vue.js": "vuejs",
  "UI/UX": "ui-ux",
  "CI/CD": "cicd",
  "中间件": "middleware",
  "云原生": "cloud-native",
  "云计算": "cloud-computing",
  "分布式事务": "distributed-transaction",
  "分布式系统": "distributed-systems",
  "分库分表": "database-sharding",
  "前端": "frontend",
  "前端工程化": "frontend-engineering",
  "前端开发": "frontend-development",
  "前端架构": "frontend-architecture",
  "前端框架": "frontend-frameworks",
  "可观测性": "observability",
  "后端开发": "backend-development",
  "图形学": "computer-graphics",
  "多租户": "multi-tenancy",
  "大数据": "big-data",
  "安全": "security",
  "实时通信": "realtime-communication",
  "并发": "concurrency",
  "异步编程": "async-programming",
  "微前端": "micro-frontends",
  "微服务": "microservices",
  "性能优化": "performance-optimization",
  "性能调优": "performance-tuning",
  "操作系统": "operating-system",
  "数据库": "database",
  "架构": "architecture",
  "架构设计": "architecture-design",
  "测试": "testing",
  "消息队列": "message-queue",
  "深度学习": "deep-learning",
  "移动端": "mobile",
  "系统编程": "systems-programming",
  "系统架构": "system-architecture",
  "系统设计": "system-design",
  "缓存": "cache",
  "网络优化": "network-optimization",
  "网络安全": "cyber-security",
  "自动化": "automation",
  "计算机底座": "computing-foundation",
  "计算机原理": "computer-architecture",
  "跨平台": "cross-platform",
  "身份认证": "authentication",
  "雪花算法": "snowflake-algorithm",
  "零信任": "zero-trust",
  "音视频": "audio-video",
  "高并发": "high-concurrency",
  "API网关": "api-gateway",
  "API设计": "api-design",
  "SQL优化": "sql-optimization",
  "SQL注入": "sql-injection",
  "Web安全": "web-security",
  "Web开发": "web-development",
  "Web技术": "web-technology",
  "Web框架": "web-frameworks",
  "Web设计": "web-design",
  "无服务": "serverless",
  "算法": "algorithms",
  "租户隔离": "tenant-isolation",
  "容器化": "containerization",

  // 渗透测试 / 安全方向
  后渗透: "post-exploitation",
  反弹shell: "reverse-shell",
  反弹Shell: "reverse-shell",
  持久化: "persistence",
  漏洞利用: "exploit",
  服务攻击: "service-exploitation",
  票据攻击: "ticket-attack",
  提权: "privilege-escalation",
  uac绕过: "uac-bypass",
  UAC绕过: "uac-bypass",
  令牌窃取: "token-theft",
  信息收集: "recon",
  smb枚举: "smb-enumeration",
  SMB枚举: "smb-enumeration",
  侦察: "reconnaissance",
  域渗透: "domain-exploitation",
  横向移动: "lateral-movement",
  内核漏洞: "kernel-exploit",

  // AI / 算法方向
  ai分析: "ai-analysis",
  AI分析: "ai-analysis",
  动态规划: "dynamic-programming",
  编程: "programming",
  排序: "sorting",
  性能分析: "performance-analysis",
  图论: "graph-theory",
  最短路径: "shortest-path",
  全栈架构: "fullstack-architecture",
  工程化: "engineering",

  // 工具 / 平台
  Metasploit: "metasploit",
  Meterpreter: "meterpreter",
  LeetCode: "leetcode",

  // 英文别名（.en.md frontmatter 变体）
  "post penetration": "post-exploitation",
  "Bounce Shell": "reverse-shell",
  "Service attack": "service-exploitation",
  "Elevate privileges": "privilege-escalation",
  "Information collection": "recon",
  "Full stack architecture": "fullstack-architecture",
  sort: "sorting",
  "domain penetration": "domain-exploitation",
  "kernel vulnerability": "kernel-exploit",
  "module-federation": "module-federation",
  "Module Federation": "module-federation",
  "deep-learning": "deep-learning",
  "Deep Learning": "deep-learning",
};

// ─── 标签正向字典：英文 slug -> 显示名（用于标签页展示） ───
const TAG_LABELS: Record<string, { zh: string; en: string }> = {
  // 核心标签
  "c-cpp": { zh: "C/C++", en: "C/C++" },
  "api-gateway": { zh: "API网关", en: "API Gateway" },
  "api-design": { zh: "API设计", en: "API Design" },
  "sql-optimization": { zh: "SQL优化", en: "SQL Optimization" },
  "sql-injection": { zh: "SQL注入", en: "SQL Injection" },
  "web-security": { zh: "Web安全", en: "Web Security" },
  "web-development": { zh: "Web开发", en: "Web Development" },
  "web-technology": { zh: "Web技术", en: "Web Technology" },
  "web-frameworks": { zh: "Web框架", en: "Web Frameworks" },
  "web-design": { zh: "Web设计", en: "Web Design" },
  middleware: { zh: "中间件", en: "Middleware" },
  "cloud-native": { zh: "云原生", en: "Cloud Native" },
  "cloud-computing": { zh: "云计算", en: "Cloud Computing" },
  "distributed-transaction": { zh: "分布式事务", en: "Distributed Transaction" },
  "distributed-systems": { zh: "分布式系统", en: "Distributed Systems" },
  "database-sharding": { zh: "分库分表", en: "Database Sharding" },
  frontend: { zh: "前端", en: "Frontend" },
  "frontend-engineering": { zh: "前端工程化", en: "Frontend Engineering" },
  "frontend-development": { zh: "前端开发", en: "Frontend Development" },
  "frontend-architecture": { zh: "前端架构", en: "Frontend Architecture" },
  "frontend-frameworks": { zh: "前端框架", en: "Frontend Frameworks" },
  observability: { zh: "可观测性", en: "Observability" },
  "backend-development": { zh: "后端开发", en: "Backend Development" },
  "computer-graphics": { zh: "图形学", en: "Computer Graphics" },
  "multi-tenancy": { zh: "多租户", en: "Multi-Tenancy" },
  "big-data": { zh: "大数据", en: "Big Data" },
  security: { zh: "安全", en: "Security" },
  "realtime-communication": { zh: "实时通信", en: "Real-time Communication" },
  concurrency: { zh: "并发", en: "Concurrency" },
  "async-programming": { zh: "异步编程", en: "Async Programming" },
  "micro-frontends": { zh: "微前端", en: "Micro Frontends" },
  microservices: { zh: "微服务", en: "Microservices" },
  "performance-optimization": { zh: "性能优化", en: "Performance Optimization" },
  "performance-tuning": { zh: "性能调优", en: "Performance Tuning" },
  "operating-system": { zh: "操作系统", en: "Operating System" },
  database: { zh: "数据库", en: "Database" },
  architecture: { zh: "架构", en: "Architecture" },
  "architecture-design": { zh: "架构设计", en: "Architecture Design" },
  testing: { zh: "测试", en: "Testing" },
  "message-queue": { zh: "消息队列", en: "Message Queue" },
  "deep-learning": { zh: "深度学习", en: "Deep Learning" },
  mobile: { zh: "移动端", en: "Mobile" },
  "systems-programming": { zh: "系统编程", en: "Systems Programming" },
  "system-architecture": { zh: "系统架构", en: "System Architecture" },
  "system-design": { zh: "系统设计", en: "System Design" },
  cache: { zh: "缓存", en: "Cache" },
  "network-optimization": { zh: "网络优化", en: "Network Optimization" },
  "cyber-security": { zh: "网络安全", en: "Cyber Security" },
  automation: { zh: "自动化", en: "Automation" },
  "computing-foundation": { zh: "计算机底座", en: "Computing Foundation" },
  "computer-architecture": { zh: "计算机原理", en: "Computer Architecture" },
  "cross-platform": { zh: "跨平台", en: "Cross Platform" },
  authentication: { zh: "身份认证", en: "Authentication" },
  "snowflake-algorithm": { zh: "雪花算法", en: "Snowflake Algorithm" },
  "zero-trust": { zh: "零信任", en: "Zero Trust" },
  "audio-video": { zh: "音视频", en: "Audio & Video" },
  "high-concurrency": { zh: "高并发", en: "High Concurrency" },
  serverless: { zh: "无服务", en: "Serverless" },
  algorithms: { zh: "算法", en: "Algorithms" },
  "tenant-isolation": { zh: "租户隔离", en: "Tenant Isolation" },
  containerization: { zh: "容器化", en: "Containerization" },
  "module-federation": { zh: "Module Federation", en: "Module Federation" },
  designsystem: { zh: "Design System", en: "Design System" },
  "ui-ux": { zh: "UI/UX", en: "UI/UX" },
  cicd: { zh: "CI/CD", en: "CI/CD" },
  clickhouse: { zh: "ClickHouse", en: "ClickHouse" },
  elasticsearch: { zh: "Elasticsearch", en: "Elasticsearch" },
  shardingsphere: { zh: "ShardingSphere", en: "ShardingSphere" },
  kubernetes: { zh: "Kubernetes", en: "Kubernetes" },
  docker: { zh: "Docker", en: "Docker" },
  argocd: { zh: "ArgoCD", en: "ArgoCD" },
  gitops: { zh: "GitOps", en: "GitOps" },
  apisix: { zh: "APISIX", en: "APISIX" },
  axum: { zh: "Axum", en: "Axum" },
  cdn: { zh: "CDN", en: "CDN" },
  cpu: { zh: "CPU", en: "CPU" },
  css: { zh: "CSS", en: "CSS" },
  devops: { zh: "DevOps", en: "DevOps" },
  ebpf: { zh: "eBPF", en: "eBPF" },
  faas: { zh: "FaaS", en: "FaaS" },
  flutter: { zh: "Flutter", en: "Flutter" },
  go: { zh: "Go", en: "Go" },
  graphql: { zh: "GraphQL", en: "GraphQL" },
  grpc: { zh: "gRPC", en: "gRPC" },
  http3: { zh: "HTTP3", en: "HTTP3" },
  https: { zh: "HTTPS", en: "HTTPS" },
  indexeddb: { zh: "IndexedDB", en: "IndexedDB" },
  istio: { zh: "Istio", en: "Istio" },
  jaeger: { zh: "Jaeger", en: "Jaeger" },
  javascript: { zh: "JavaScript", en: "JavaScript" },
  kafka: { zh: "Kafka", en: "Kafka" },
  linux: { zh: "Linux", en: "Linux" },
  llm: { zh: "LLM", en: "LLM" },
  mongodb: { zh: "MongoDB", en: "MongoDB" },
  nextjs: { zh: "Next.js", en: "Next.js" },
  nginx: { zh: "Nginx", en: "Nginx" },
  nosql: { zh: "NoSQL", en: "NoSQL" },
  oauth2: { zh: "OAuth2", en: "OAuth2" },
  opentelemetry: { zh: "OpenTelemetry", en: "OpenTelemetry" },
  playwright: { zh: "Playwright", en: "Playwright" },
  postgresql: { zh: "PostgreSQL", en: "PostgreSQL" },
  protobuf: { zh: "Protobuf", en: "Protobuf" },
  pwa: { zh: "PWA", en: "PWA" },
  python: { zh: "Python", en: "Python" },
  pytorch: { zh: "PyTorch", en: "PyTorch" },
  raft: { zh: "Raft", en: "Raft" },
  rag: { zh: "RAG", en: "RAG" },
  react: { zh: "React", en: "React" },
  redis: { zh: "Redis", en: "Redis" },
  rust: { zh: "Rust", en: "Rust" },
  saas: { zh: "SaaS", en: "SaaS" },
  saml: { zh: "SAML", en: "SAML" },
  servicemesh: { zh: "ServiceMesh", en: "ServiceMesh" },
  shell: { zh: "Shell", en: "Shell" },
  solidjs: { zh: "SolidJS", en: "SolidJS" },
  sonarqube: { zh: "SonarQube", en: "SonarQube" },
  sso: { zh: "SSO", en: "SSO" },
  tailwindcss: { zh: "TailwindCSS", en: "TailwindCSS" },
  typescript: { zh: "TypeScript", en: "TypeScript" },
  v8: { zh: "V8", en: "V8" },
  vitest: { zh: "Vitest", en: "Vitest" },
  webassembly: { zh: "WebAssembly", en: "WebAssembly" },
  webgpu: { zh: "WebGPU", en: "WebGPU" },
  webrtc: { zh: "WebRTC", en: "WebRTC" },
  windows: { zh: "Windows", en: "Windows" },
  xss: { zh: "XSS", en: "XSS" },
  ai: { zh: "AI", en: "AI" },

  // 渗透测试 / 安全
  "post-exploitation": { zh: "后渗透", en: "Post-Exploitation" },
  "reverse-shell": { zh: "反弹Shell", en: "Reverse Shell" },
  persistence: { zh: "持久化", en: "Persistence" },
  exploit: { zh: "漏洞利用", en: "Exploit" },
  "service-exploitation": { zh: "服务攻击", en: "Service Exploitation" },
  "ticket-attack": { zh: "票据攻击", en: "Ticket Attack" },
  "privilege-escalation": { zh: "提权", en: "Privilege Escalation" },
  "uac-bypass": { zh: "UAC绕过", en: "UAC Bypass" },
  "token-theft": { zh: "令牌窃取", en: "Token Theft" },
  recon: { zh: "信息收集", en: "Recon" },
  "smb-enumeration": { zh: "SMB枚举", en: "SMB Enumeration" },
  reconnaissance: { zh: "侦察", en: "Reconnaissance" },
  "domain-exploitation": { zh: "域渗透", en: "Domain Exploitation" },
  "lateral-movement": { zh: "横向移动", en: "Lateral Movement" },
  "kernel-exploit": { zh: "内核漏洞", en: "Kernel Exploit" },
  "ai-analysis": { zh: "AI分析", en: "AI Analysis" },
  "dynamic-programming": { zh: "动态规划", en: "Dynamic Programming" },
  programming: { zh: "编程", en: "Programming" },
  sorting: { zh: "排序", en: "Sorting" },
  "performance-analysis": { zh: "性能分析", en: "Performance Analysis" },
  "graph-theory": { zh: "图论", en: "Graph Theory" },
  "shortest-path": { zh: "最短路径", en: "Shortest Path" },
  "fullstack-architecture": { zh: "全栈架构", en: "Fullstack Architecture" },
  engineering: { zh: "工程化", en: "Engineering" },
  metasploit: { zh: "Metasploit", en: "Metasploit" },
  meterpreter: { zh: "Meterpreter", en: "Meterpreter" },
  nmap: { zh: "Nmap", en: "Nmap" },
  osint: { zh: "OSINT", en: "OSINT" },
  mimikatz: { zh: "Mimikatz", en: "Mimikatz" },
  kerberos: { zh: "Kerberos", en: "Kerberos" },
  smb: { zh: "SMB", en: "SMB" },
  rdp: { zh: "RDP", en: "RDP" },
  winrm: { zh: "WinRM", en: "WinRM" },
  suid: { zh: "SUID", en: "SUID" },
  "active-directory": { zh: "Active Directory", en: "Active Directory" },
  leetcode: { zh: "LeetCode", en: "LeetCode" },
  mdx: { zh: "MDX", en: "MDX" },
};

export function normalizeTagToSlug(tag: string): string {
  if (!tag) return "";
  const trimmed = String(tag).trim();
  if (TAG_ALIASES[trimmed]) return TAG_ALIASES[trimmed];
  // 英文标签直接 slugify（小写、连字符）
  return slug(trimmed);
}

export function getTagLabel(tag: string, locale: "zh" | "en" = "zh"): string {
  const tagSlug = normalizeTagToSlug(tag);
  if (TAG_LABELS[tagSlug]) return TAG_LABELS[tagSlug][locale];
  const hasChinese = /[\u4e00-\u9fa5]/.test(tag);
  if (hasChinese) return tag;
  return toTitleCase(tag.replace(/-/g, " "));
}

function normalizeSourcePath(sourcePath: string) {
  return sourcePath.replace(/\\/g, "/").toLowerCase();
}

function toTitleCase(input: string) {
  return input.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function inferCategoryFromPath(sourcePath: string) {
  const normalizedPath = normalizeSourcePath(sourcePath);
  const segments = normalizedPath.split("/").filter(Boolean);

  for (let index = segments.length - 2; index >= 0; index -= 1) {
    const candidate = normalizeCategoryToSlug(segments[index]);
    if (!candidate || candidate === "blog" || candidate === "content") {
      continue;
    }

    if (CATEGORY_LABELS[candidate]) {
      return candidate;
    }
  }

  return FALLBACK_CATEGORY;
}

export function resolvePostCategories(
  categories: string[] | undefined,
  sourcePath: string,
) {
  const normalized = (categories || [])
    .map((category) => normalizeCategoryToSlug(category))
    .filter(Boolean);

  if (normalized.length) {
    return [...new Set(normalized)];
  }

  return [inferCategoryFromPath(sourcePath)];
}

export function getCategoryLabel(category: string, locale: "zh" | "en" = "zh") {
  if (!category) {
    return (
      CATEGORY_LABELS[FALLBACK_CATEGORY]?.[locale] ||
      (locale === "en" ? "Other" : "其他")
    );
  }

  // 1. 尝试从映射表找 (针对英文 slug 映射中文)
  const categorySlug = normalizeCategoryToSlug(category);
  if (CATEGORY_LABELS[categorySlug]) {
    return CATEGORY_LABELS[categorySlug][locale];
  }

  // 2. 如果本身就是中文，直接返回
  const hasChinese = /[\u4e00-\u9fa5]/.test(category);
  if (hasChinese) {
    return category;
  }

  // 3. 兜底处理 (Title Case)
  return toTitleCase(category.replace(/-/g, " "));
}

export const getLocalizedCategoryLabel = getCategoryLabel;
