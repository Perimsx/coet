# 序栈 CMS API

Go + SQLite 后端服务，负责管理员会话、内容、分类标签、站点设置、友链、SEO、审计、备份和系统任务。根目录 Next.js 应用提供前台与 Arco Design 管理后台。

## 启动

```powershell
# 先将 backend/.env 上传到本目录，可参考 .env.example
pnpm --dir .. dev:api
```

默认监听 `:8080`，数据库默认位于 `../storage/db/blog.sqlite`。SQLite 自动启用 WAL、外键约束和 `busy_timeout`。

## 首次导入

首次部署后，从 `backend/` 运行下列命令导入已有 Markdown、分类、标签、友链和站点基础信息。导入按 Slug 或 URL 幂等执行，不会覆盖已在后台修改的 SQLite 数据。

```powershell
go run ./cmd/import-content
```

## 前端代理

根目录 `.env` 设置 `CMS_API_PROXY_URL=http://127.0.0.1:8080` 后执行 `pnpm dev`。浏览器对 `/api/v1/*` 的请求会由 Next.js 转发到 Go 服务，以保持 Cookie 同源。

## 校验

```powershell
go test ./...
go vet ./...
```

## 后台自动更新

后台“检查更新”只执行 `git fetch`；“拉取并部署”会校验固定分支和干净工作区，创建 SQLite 备份，快进合并远程提交，然后运行仓库内置的 `scripts/deploy.mjs`。脚本先在临时目录完成依赖安装、Next.js standalone 构建和 Go 二进制构建，全部成功后才替换当前产物并重启前台 PM2 进程。

部署失败时，代码会自动恢复到更新前 Commit，构建产物也会恢复上一版，并在部署历史中记录失败原因。回滚按钮使用同一构建脚本重新生成指定稳定版本。Go API 不会在任务写入成功记录前重启；任务结束后由 PM2/systemd 自动拉起新版本。

首次部署需保证 Go API 已由带自动重启能力的进程管理器托管，并按实际路径确认下列配置：

```dotenv
CMS_REPOSITORY_DIR=..
CMS_DEPLOY_SCRIPT=scripts/deploy.mjs
CMS_ROLLBACK_SCRIPT=scripts/deploy.mjs
CMS_RESTART_AFTER_DEPLOY=true
CMS_PM2_WEB_NAME=xstack-core
CMS_WEB_PORT=3010
```

自定义脚本仍可通过 `CMS_DEPLOY_SCRIPT` / `CMS_ROLLBACK_SCRIPT` 覆盖，后台接口不会接收任意脚本路径或命令。

## 生产要求

- 反向代理将 `/api/` 转发到 Go API，其余请求转发到 Next.js。
- SQLite、备份和日志使用持久化本地磁盘，不使用网络盘。
- 管理员密码、会话密钥、Git 凭据及缓存刷新密钥只通过环境变量提供。
- 设置 `CMS_NEXT_REVALIDATE_URL` 与 `CMS_NEXT_REVALIDATE_SECRET` 后，内容发布或下线会异步刷新 Next.js 缓存和 Sitemap。
- `CMS_INDEXNOW_KEY` 与 `CMS_BAIDU_PUSH_TOKEN` 只通过环境变量提供；后台 SEO 页面可以写入 `CMS_ENV_FILE` 指向的 `.env`，只返回配置状态，不返回密钥内容，也不允许写入站点设置 JSON。
- 后台录入密钥时默认写入 `CMS_ENV_FILE` 指向的 `.env`（默认 `backend/.env`）；如果使用只读容器或平台托管环境变量，请直接在平台配置后刷新后台状态。
- Git 仓库、远程、分支及回滚脚本均由服务器环境变量固定；管理后台不允许填写命令或仓库地址。
