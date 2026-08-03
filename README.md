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

## 首次部署：只上传一个脚本

Linux 服务器首次部署只需要上传仓库根目录的 [`install.sh`](install.sh)，然后执行：

```bash
bash install.sh
```

脚本会自动识别常见 Linux 包管理器，安装 Git、Node.js 20+、Go 1.26+、pnpm 和 PM2，拉取 `main` 分支到 `/srv/xuzhan`，安装依赖、构建前台和 Go API，并启动两个 PM2 进程。脚本只负责首次安装和启动，不配置 Nginx、Caddy 或其他反向代理。

如果执行脚本的当前目录已经有 `.env` 和 `backend/.env`，脚本会在拉取仓库后自动复制它们，并根据服务器实际 IP、端口、仓库路径和 PM2 配置同步更新运行字段。缺少任一文件时，脚本会自动生成，不需要手动填写；同时会生成共享密钥和随机管理员初始密码并在终端显示。管理员密码、SEO Token 等敏感值会保留已有配置，不会被自动覆盖。

默认仓库、分支和安装目录可以在执行前覆盖：

```bash
REPOSITORY_URL=https://github.com/你的账号/你的仓库.git \
BRANCH=main TARGET_DIR=/srv/xuzhan bash install.sh
```

首次部署完成后，后台代码更新使用仓库内置的 `scripts/deploy.mjs`，与 `install.sh` 是两个独立流程。

## 本地开发

### 前置要求

- Node.js `>= 20`
- pnpm `>= 9`
- Go `1.26`

### 启动前台与 CMS API

```powershell
# 先上传 .env 和 backend/.env，可分别参考 .env.example

# 首次安装、初始化环境文件并启动前台与 API
npm run bootstrap -- --no-pull

# 仅安装依赖和初始化，不启动服务
npm run setup

# 终端 1：Go API（默认 :8080）
pnpm dev:api

# 终端 2：Next.js（默认 :3000）
pnpm dev
```

在根目录 `.env` 设置 `CMS_API_PROXY_URL=http://127.0.0.1:8080` 后，浏览器对 `/api/v1/*` 的请求会被 Next.js 同源转发。首次使用可在 `backend/` 运行 `go run ./cmd/import-content`，将现有 Markdown、分类、标签、友链和站点基础设置幂等导入 SQLite。

`npm run setup` 是已拉取项目后的安装入口：执行前必须先上传根目录 `.env` 和 `backend/.env`，脚本会在缺少任一文件时停止并提示上传，不会自动生成默认密钥，也不会覆盖已有配置。通过检查后，它会按 `pnpm-lock.yaml` 安装前端依赖、下载 Go 模块，并创建运行时目录。全新 Linux 服务器请使用上面的单文件 `install.sh`。

`npm run bootstrap` 用于服务器或全新工作副本：默认检查工作区无未提交修改后快进拉取 `origin/main`，然后执行安装和初始化。需要在本地已有修改的副本运行时使用 `--no-pull`。安装完成后，`npm run dev:all` 会同时启动 Next.js 和 Go CMS API；也可以直接使用 `npm run bootstrap -- --no-pull` 完成初始化并启动。

### 环境变量与密钥

- 根目录 `.env` 负责 Next.js、构建脚本和站点地址；`backend/.env` 负责 Go CMS API。`pnpm dev:api` 会自动加载 `backend/.env`，命令行或部署平台已经提供的变量优先级更高。
- `CMS_NEXT_REVALIDATE_SECRET` 需要在根目录和 `backend/.env` 使用同一个随机值；它只用于 Go API 请求 Next.js 刷新缓存。
- `CMS_INDEXNOW_KEY` 与 `CMS_BAIDU_PUSH_TOKEN` 只放服务端环境变量。后台“SEO 推送”页可以安全写入 `CMS_ENV_FILE` 指向的 `.env`，不会显示原文；平台托管环境变量或只读容器则按变量名手动配置。
- IndexNow 的公开验证文件由构建脚本根据 `CMS_INDEXNOW_KEY` 生成到 `public/`，密钥本身不会写入站点设置 JSON。不要把任何密钥改成 `NEXT_PUBLIC_*`，也不要提交 `.env`。
- Google/Baidu Search Console 的“验证 Key”属于会输出到网页的站点验证信息，可在后台站点设置中编辑；它们与主动推送 Token 不是同一类凭据。

## 常用命令

| 命令                      | 说明                                         |
| ------------------------- | -------------------------------------------- |
| `npm run setup`           | 一句话安装前端/Go 依赖并初始化环境文件       |
| `npm run bootstrap`       | 快进拉取代码、安装依赖、初始化并启动开发环境 |
| `npm run dev:all`         | 同时启动 Next.js 与 Go CMS API               |
| `pnpm dev`                | 启动 Next.js 开发服务器并生成内容资产        |
| `pnpm dev:api`            | 启动 Go CMS API                              |
| `pnpm test:api`           | 执行 Go API 测试                             |
| `pnpm typecheck`          | 执行 TypeScript 类型检查                     |
| `pnpm build:standalone`   | 构建可部署的 Next.js 服务端产物              |
| `go -C backend vet ./...` | 执行 Go 静态检查                             |

## 部署边界

- 用 Nginx 或 Caddy 将 `/api/` 代理到 Go 服务，其他请求代理到 Next.js。
- `storage/` 必须放在持久化本地磁盘；SQLite 不应放在网络盘。
- 后台代码更新默认使用 `scripts/deploy.mjs`：更新前自动备份 SQLite，构建失败恢复原 Commit，成功后由进程管理器拉起新版 Go API。详细配置见 [backend/README.md](backend/README.md)。
- 首次部署使用根目录 `install.sh`：它只安装依赖、构建和启动项目，不负责反向代理；更新已有代码时使用后台的 Git 更新功能。
- 密码、会话密钥、Git 凭据、缓存刷新密钥和搜索引擎推送凭据只使用环境变量，禁止提交；后台站点设置接口会拒绝写入推送凭据。
- Git 更新只允许服务器环境变量固定的仓库、远程和 `main` 分支；后台不接收任意命令、仓库地址或分支。

## 许可

本项目使用 [GPL-3.0](LICENSE) 许可协议。
