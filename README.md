<div align="center">

# 序栈

**知行合一，缄默前行。**

一个面向个人创作的单用户技术 CMS：使用 Next.js 提供前台站点和 Arco Design 管理后台，Go + SQLite 负责内容、鉴权、任务和维护能力。

[在线访问](https://blog.cot.wiki) · [问题反馈](https://github.com/kerntau/blog/issues)

</div>

## 项目定位

序栈不是多租户 SaaS，也不是带媒体库的通用建站系统。它为一位站长设计：在一个清晰、安全的后台里完成写作、发布、站点维护和代码更新。

- 单管理员：仅管理员密码和安全会话，不提供角色、组织或多租户。
- 内容优先：文章和独立页面使用 Markdown / MDX；运行时内容以 SQLite 为准。
- 外链图片：封面、头像和正文图片直接使用图床 URL，不上传、不保存本地媒体文件。
- 代码与内容分离：Git 只更新程序代码；SQLite 中的 CMS 内容不会被拉取代码覆盖。

## 技术架构

```text
浏览器
  ├── Next.js 前台站点
  └── /admin（Next.js + Arco Design）
          │ 同源 Cookie /api/v1
          ▼
      Go CMS API
          ├── SQLite（内容、设置、会话、审计、任务）
          ├── 后台任务（备份、Git、SEO、缓存刷新）
          └── 外部图床链接（仅校验与引用）
```

| 层级          | 选型                             | 职责                                         |
| ------------- | -------------------------------- | -------------------------------------------- |
| 前台与后台 UI | Next.js 16、React 19、TypeScript | 内容展示、`/admin` 管理界面、缓存刷新入口    |
| 管理组件      | Arco Design                      | 后台布局、表单、表格、反馈与状态展示         |
| 业务 API      | Go 标准库                        | 鉴权、内容管理、审计、系统任务和公开内容接口 |
| 数据库        | SQLite（WAL）                    | CMS 的运行时数据唯一来源                     |
| 历史内容资产  | Markdown / MDX、Contentlayer     | 首次导入、兼容旧文章和构建期内容             |

## 已有功能

- 内容：文章、独立页面、分类、标签、草稿/发布/下线、Markdown / MDX 编辑。
- 站点：基础设置、导航、友链、SEO 配置、Sitemap / Robots / RSS / JSON-LD 开关。
- 系统：管理员会话、登录限流、操作审计、SQLite 备份、后台任务、固定仓库的 Git 检查、更新与回滚。
- 前台：从 Go API 读取已发布内容；保留 Contentlayer 兼容路径与离线搜索。
- 互动：后台已具备评论审核与建议收件箱的数据管理接口；前台提交界面尚未接入。

详细设计与目录索引见 [docs/README.md](docs/README.md)。

## 目录说明

```text
.
├── backend/                  # Go API、SQLite 访问、导入工具与后端说明
├── content/                  # 历史 Markdown / MDX 内容与首次导入数据
├── docs/                     # CMS 需求、设计规范、提交规范索引
├── public/                   # 前台静态资源
├── scripts/                  # 构建、生成和 SEO 脚本
├── src/
│   ├── app/                  # Next.js 路由：主站、/admin、内部缓存接口
│   ├── features/             # 内容、后台、站点、搜索等业务模块
│   └── shared/               # 跨模块组件、上下文和工具函数
├── storage/                  # 运行时目录；数据库、日志和备份均不提交
├── .env.example              # Next.js 环境变量示例
└── backend/.env.example      # Go API 环境变量示例
```

构建缓存（`.next*`、`.contentlayer`、`.velite`）、依赖和运行时数据均已被 Git 忽略，不属于项目源码。

## 本地开发

### 前置要求

- Node.js `>= 20`
- pnpm `>= 9`
- Go `1.26`

### 启动前台与 CMS API

```powershell
pnpm install
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env

# 终端 1：Go API（默认 :8080）
pnpm dev:api

# 终端 2：Next.js（默认 :3000）
pnpm dev
```

在根目录 `.env` 设置 `CMS_API_PROXY_URL=http://127.0.0.1:8080` 后，浏览器对 `/api/v1/*` 的请求会被 Next.js 同源转发。首次使用可在 `backend/` 运行 `go run ./cmd/import-content`，将现有 Markdown、分类、标签、友链和站点基础设置幂等导入 SQLite。

## 常用命令

| 命令                      | 说明                                  |
| ------------------------- | ------------------------------------- |
| `pnpm dev`                | 启动 Next.js 开发服务器并生成内容资产 |
| `pnpm dev:api`            | 启动 Go CMS API                       |
| `pnpm test:api`           | 执行 Go API 测试                      |
| `pnpm typecheck`          | 执行 TypeScript 类型检查              |
| `pnpm build:standalone`   | 构建可部署的 Next.js 服务端产物       |
| `go -C backend vet ./...` | 执行 Go 静态检查                      |

## 部署边界

- 用 Nginx 或 Caddy 将 `/api/` 代理到 Go 服务，其他请求代理到 Next.js。
- `storage/` 必须放在持久化本地磁盘；SQLite 不应放在网络盘。
- 密码、会话密钥、Git 凭据和缓存刷新密钥只使用环境变量，禁止提交。
- Git 更新只允许服务器环境变量固定的仓库、远程和 `main` 分支；后台不接收任意命令、仓库地址或分支。

## 许可

本项目使用 [GPL-3.0](LICENSE) 许可协议。
