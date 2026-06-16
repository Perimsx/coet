<div align="center">

# 序栈

**[cot.wiki](https://cot.wiki)**

一个基于 Next.js 15 构建的个人技术主页与知识库。
博客、知识库、搜索、归档、标签、友链和 SEO 管线统一在一个 App Router 架构中，偏向内容沉淀与长期维护。

</div>

---

## 特性

- **混合内容引擎** — Contentlayer 2 管理博客/作者，Velite 管理知识库，MDX/Markdown 渲染与代码块增强
- **全文搜索** — FlexSearch 生成本地索引，KBar 弹层即时检索，支持中英文混合分词
- **SEO 全链路** — sitemap、robots.txt、RSS、JSON-LD 结构化数据、百度/IndexNow 推送脚本
- **多语言** — 中英文内容同源（`.en.md` 后缀约定），导航与 UI 文案国际化
- **响应式 UI** — Tailwind CSS 4 驱动，明暗主题切换，移动端适配
- **部署就绪** — PM2 + Nginx VPS 部署，GitHub Actions CI/CD，EdgeOne 边缘加速

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router), React 19 |
| 样式 | Tailwind CSS 4, Framer Motion, GSAP |
| 内容 | Contentlayer 2, Velite, MDX, Unified/Rehype/Remark |
| 搜索 | FlexSearch, KBar |
| UI 组件 | Radix UI, shadcn/ui, Lucide React, Vaul |
| 工具链 | TypeScript, ESLint, Prettier, pnpm, Husky |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（自动生成内容 + 热更新）
pnpm dev

# 清缓存后启动
pnpm dev:clean
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm dev:clean` | 清除缓存后启动开发服务器 |
| `pnpm build` | 生产构建（内容生成 → Velite → Next.js → RSS → SEO 推送） |
| `pnpm start` | 启动生产服务器（需先 build） |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint 自动修复 |
| `pnpm generate:kb-search` | 重新生成知识库搜索索引 |
| `pnpm analyze` | Bundle 体积分析 |

## 项目结构

```text
.
├── blog.config.ts              # 站点单源配置（标题、导航、SEO、展示）
├── contentlayer.config.ts      # 博客/作者内容模型与 MDX 插件链
├── velite.config.ts            # 知识库内容模型
├── content/
│   ├── authors/                # 作者信息（中英文）
│   ├── blog/                   # 博客文章（.md 中文 / .en.md 英文）
│   └── kb/                     # 知识库文档
├── public/                     # 静态资源、favicon、搜索索引、RSS
├── scripts/
│   ├── build/                  # 构建后处理（RSS、内容准备）
│   ├── build-search-index.js   # 知识库搜索索引生成
│   └── seo-push.ts             # 搜索引擎收录推送
├── src/
│   ├── app/                    # Next.js App Router 页面与 API
│   │   ├── (site)/             # 主站路由组（首页、博客、标签、归档、友链、关于）
│   │   ├── (app)/              # 知识库路由组
│   │   ├── (marketing)/        # 营销页面路由组
│   │   └── api/                # API 路由（搜索）
│   ├── components/             # 跨页面共享 UI 组件
│   ├── features/               # 业务功能模块
│   │   ├── site/               # 站点通用（导航、页脚、SEO、主题）
│   │   ├── content/            # 内容渲染（布局、MDX、代码块）
│   │   ├── search/             # 搜索 Provider 与 KBar 集成
│   │   ├── friends/            # 友链
│   │   └── seo/                # 搜索引擎推送
│   ├── kb/                     # 知识库专用组件与工具
│   ├── server/                 # 服务端配置读取
│   ├── shared/                 # 共享组件、上下文、工具函数
│   ├── hooks/                  # 自定义 Hooks
│   └── generated/              # 自动生成的 JSON 数据
└── storage/                    # 本地运行时配置（SQLite、站点设置）
```

## 配置

所有站点配置集中在 `blog.config.ts`：

- 站点标题、描述、作者、语言
- 导航菜单与社交链接
- 搜索引擎与分析配置
- ICP / 公安备案信息
- 首页 Hero、页脚、文章列表展示文案

## 内容约定

- 博客文章放在 `content/blog/`，中文用 `.md`，英文翻译用 `.en.md`
- 知识库文档放在 `content/kb/`，按分类建子目录
- 作者信息在 `content/authors/default.md`（`default.en.md` 为英文版）
- 标签和分类通过 frontmatter 的 `tags` 和 `categories` 字段定义

## 部署

项目通过 GitHub Actions 自动部署到 VPS：

```yaml
# .github/workflows/deploy.yml
# push 到 main 分支自动触发：git pull → pnpm install → pnpm build → pm2 reload
```

服务器要求：
- Node.js 18+
- pnpm 10+
- PM2（进程管理）
- Nginx 或 Caddy（反向代理，将 80/443 转发到 `localhost:3010`）

## 致谢

序栈的视觉与工程组织参考并吸收了这些项目的经验：

- [Shiro](https://github.com/innei/Shiro) — 极简个人网站，纸的纯粹与雪的清新
- [blog-v3](https://github.com/L33Z22L11/blog-v3)
- [ThriveX-Blog](https://github.com/LiuYuYang01/ThriveX-Blog)
- [Astro Gyoza](https://github.com/lxchapu/astro-gyoza)

## License

[GPL-3.0](./LICENSE)
