<p align="center">
  <img src="public/logo.jpg" width="120" height="120" style="border-radius: 50%;" alt="Coet Logo" />
</p>

<h1 align="center">Coet</h1>

<p align="center">
  基于 Next.js 15 的全栈个人博客系统，前台展示与后台管理一体化。
</p>

<p align="center">
  <a href="https://blog.coet.ink">在线演示</a> ·
  <a href="https://github.com/kerntau/Coet/issues">问题反馈</a> ·
  <a href="#快速开始">快速开始</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/SQLite-blue?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-AGPL--3.0-green" alt="License" />
</p>

---

## 项目简介

Coet 是一套将前台博客展示与后台内容管理整合在同一工程中的全栈系统。文章使用 Markdown/MDX 文件存储，评论、友链、站点设置等运营数据则由 SQLite 管理，兼顾了静态博客的简洁和动态系统的灵活。

### 设计理念

- **内容即文件** — 文章与关于页保存为 Markdown/MDX，方便 Git 版本管理
- **运营数据入库** — 评论、友链、建议、会话等数据存入 SQLite，轻量零运维
- **前后台同源** — 同一套 Next.js 工程交付前台站点与管理后台，统一部署
- **可迭代** — 不堆功能，保持可维护、可持续演进

## 功能概览

### 前台

| 模块 | 说明 |
|------|------|
| 首页 | Hero 主视觉、个人信息展示 |
| 博客 | 文章列表、分页、分类、标签筛选 |
| 文章详情 | 目录导航、代码高亮、阅读时间、SEO 元信息 |
| 归档 | 按时间线归档全部文章 |
| 友链 | 友链展示与申请入口 |
| 关于 | 个人资料、技术栈、社交信息 |
| 搜索 | 全站内容搜索 |
| 建议 | 访客反馈入口 |
| 订阅 | RSS Feed、Sitemap、Web Manifest |

### 后台

| 模块 | 说明 |
|------|------|
| 仪表盘 | 数据指标、趋势图表、快捷操作、系统状态 |
| 文章管理 | 列表筛选、保存视图、批量操作 |
| 文章编辑器 | 文件型编辑器，元数据侧栏，本地自动保存 |
| 评论审核 | 线程式审核、回复、删除、上下文查看 |
| 建议工单 | 工单流转、回复模板 |
| 友链管理 | 录入编辑、健康巡检、站点元信息抓取 |
| 关于页编辑 | 资料、社交项、技术栈、正文编辑 |
| 站点设置 | 站点信息、SEO、SMTP 邮件、安全配置 |

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router, Standalone) |
| 前端 | React 19, Tailwind CSS 4, Framer Motion |
| UI 组件 | Radix UI, Lucide Icons, shadcn/ui |
| 内容 | Contentlayer 2, MDX, Shiki, KaTeX |
| 数据库 | SQLite (better-sqlite3), Drizzle ORM |
| 状态管理 | Zustand, SWR |
| 邮件 | Nodemailer |
| 部署 | PM2, standalone output |
| 代码质量 | ESLint, Prettier, Husky, lint-staged |

## 目录结构

```
Coet/
├── content/
│   ├── authors/            # 作者与关于页内容
│   └── blog/               # 文章 Markdown/MDX
├── public/                 # 静态资源
├── scripts/                # 构建、初始化、SEO 推送脚本
├── src/
│   ├── app/                # Next.js 路由与页面
│   ├── components/         # 通用 UI 组件
│   ├── config/             # 站点配置
│   ├── features/           # 业务模块（按功能拆分）
│   │   ├── admin/          #   后台管理
│   │   ├── comments/       #   评论系统
│   │   ├── content/        #   内容渲染
│   │   ├── friends/        #   友链
│   │   ├── search/         #   搜索
│   │   ├── seo/            #   SEO / 结构化数据
│   │   ├── site/           #   站点公共组件
│   │   └── tags/           #   标签系统
│   ├── hooks/              # 自定义 Hooks
│   ├── server/             # 服务端逻辑（DB / 邮件 / 设置）
│   ├── shared/             # 共享工具函数
│   └── types/              # TypeScript 类型定义
├── storage/
│   ├── db/                 # SQLite 数据库文件
│   ├── logs/               # 运行日志
│   └── settings/           # 运行时 JSON 配置
├── deploy.sh               # 一键部署脚本
├── ecosystem.config.cjs    # PM2 配置
└── contentlayer.config.ts  # Contentlayer 配置
```

## 快速开始

### 环境要求

- Node.js ≥ 20
- pnpm ≥ 10

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/kerntau/Coet.git
cd Coet

# 安装依赖
pnpm install

# 复制环境变量模板并按需修改
cp .env.example .env

# 初始化管理员账号
pnpm db:seed-admin

# 启动开发服务器
pnpm dev
```

打开 `http://localhost:3000` 查看前台，通过配置的隐藏入口访问后台。

## 环境变量

```bash
# ─── 站点信息 ───────────────────────────────────
NEXT_PUBLIC_SITE_TITLE="你的博客标题"
NEXT_PUBLIC_SITE_AUTHOR="作者名"
NEXT_PUBLIC_SITE_DESCRIPTION="站点描述"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"

# ─── 社交信息 ───────────────────────────────────
NEXT_PUBLIC_SITE_EMAIL="your@email.com"
NEXT_PUBLIC_GITHUB_URL="https://github.com/username"

# ─── 后台与安全 ──────────────────────────────────
DATABASE_URL="./storage/db/blog.sqlite"
ENABLE_ADMIN="true"
ADMIN_LOGIN_ENTRY="your-secret-path"      # 后台隐藏入口路径
ADMIN_SESSION_SECRET="替换为随机字符串"      # 必须更换
ADMIN_PASSWORD="初始管理员密码"
ADMIN_BOOTSTRAP_USERNAME="admin"

# ─── SEO（可选）──────────────────────────────────
SITE_URL="https://your-domain.com"
BAIDU_PUSH_TOKEN=""
INDEXNOW_KEY=""

# ─── 统计（可选）─────────────────────────────────
NEXT_UMAMI_ID=""
```

> **注意**：`ADMIN_SESSION_SECRET` 必须替换为足够长的随机字符串，不可使用默认值上线。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm dev:clean` | 清理缓存后启动 |
| `pnpm build` | 生产构建（含 postbuild） |
| `pnpm start` | 生产模式启动 |
| `pnpm lint` | ESLint 检查与修复 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm analyze` | 构建体积分析 |
| `pnpm db:generate` | 生成 Drizzle 迁移 |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm db:push` | 推送 Schema 到 SQLite |
| `pnpm db:studio` | 打开 Drizzle Studio |
| `pnpm db:seed-admin` | 初始化管理员账号 |
| `pnpm db:seed-friends` | 初始化友链示例数据 |
| `pnpm seo:push` | 手动推送 SEO 收录 |

## 后台认证机制

后台采用"隐藏入口 + 内部登录页"的两步设计：

1. 访问 `ADMIN_LOGIN_ENTRY` 配置的隐藏路径（如 `/your-secret-path`）
2. 中间件将请求重写到 `/admin/login?__entry=1`
3. 生产环境直接访问 `/admin/login` 会被拦截

认证要点：
- HttpOnly Cookie 维护会话
- Access Token / Refresh Token 刷新链路
- 登录失败限流
- 支持无用户名模式（按库中管理员账号匹配密码）

## 邮件通知

以下场景会触发邮件（需启用并正确配置 SMTP）：

- 站长回复评论 → 通知被回复访客
- 回复建议工单 → 通知提交者
- 新友链申请 → 通知站长
- 友链审核通过 / 资料更新 / 删除 → 通知申请者

未配置 SMTP 时自动跳过，不阻塞主流程。

## 生产部署

项目提供了全流程部署脚本 `deploy.sh`，支持交互式与非交互式运行。

### 前提条件

- 服务器已安装 Node.js、pnpm、PM2
- 已克隆本仓库并配置好 `.env`

### 部署方式

```bash
# 交互式部署（会引导选择部署来源与数据库同步方式）
bash deploy.sh

# 非交互式部署
bash deploy.sh --yes

# 自定义参数
APP_NAME="coet-blog" PORT="1021" bash deploy.sh
```

脚本执行流程：

1. **环境检查** — 验证 Node、pnpm、PM2
2. **准备源码** — 支持当前仓库 / GitHub 归档 / 本地压缩包三种来源
3. **安装依赖**
4. **数据库同步** — 支持安全同步 / 强制同步 / 跳过
5. **构建应用** — Next.js standalone 构建并同步静态资源
6. **重启服务** — 通过 PM2 启动或热重启
7. **健康检查** — 验证服务可用性
8. **SEO 收录** — 自动推送 URL 到搜索引擎

### PM2 默认配置

| 项目 | 值 |
|------|------|
| 应用名 | `coet-blog` |
| 启动文件 | `.next/standalone/server.js` |
| 端口 | `1021` |
| 运行模式 | 单实例 fork |
| 内存上限 | 512M |

### 日志位置

```
storage/logs/
├── deploy.log      # 部署日志
├── pm2-out.log     # PM2 标准输出
└── pm2-error.log   # PM2 错误输出
```

## SEO

构建时 `postbuild` 脚本会自动生成：

- RSS Feed (`public/feed.xml`)
- 搜索索引 (`public/search.json`)
- 站点图标
- IndexNow 验证文件（如已配置）

手动推送收录：

```bash
pnpm seo:push
```

支持 Baidu 主动推送与 IndexNow（Bing 等），未配置对应 Token 时自动跳过。

## 数据存储策略

| 数据类型 | 存储方式 | 位置 |
|----------|----------|------|
| 文章内容 | Markdown/MDX 文件 | `content/blog/` |
| 关于页 | Markdown 文件 | `content/authors/` |
| 评论、建议、友链 | SQLite | `storage/db/blog.sqlite` |
| 站点设置、邮件配置 | JSON 文件 | `storage/settings/` |
| 分类配置 | JSON 文件 | `storage/settings/categories.json` |

## 注意事项

- `storage/settings/` 下的 JSON 配置为运行时文件，后台设置保存后自动更新
- 生产环境务必替换 `ADMIN_SESSION_SECRET` 和初始管理员密码
- Windows 下 Contentlayer 可能输出警告，通常不影响构建
- 邮件发送异常时，优先检查 SMTP 启用状态、主机端口、授权码
- 后台入口 404 时，确认 `ADMIN_LOGIN_ENTRY` 与反向代理配置是否一致

## License

本项目基于 [AGPL-3.0](./LICENSE) 许可证开源。
