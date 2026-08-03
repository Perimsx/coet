# 序栈 CMS API

Go + SQLite 后端服务，负责管理员会话、内容、分类标签、站点设置、友链、SEO、审计、备份和系统任务。根目录 Next.js 应用提供前台与 Arco Design 管理后台。

## 启动

```powershell
Copy-Item .env.example .env
# 编辑 backend/.env：至少设置 CMS_ADMIN_PASSWORD；需要推送时再设置对应 CMS_* 凭据
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

## 生产要求

- 反向代理将 `/api/` 转发到 Go API，其余请求转发到 Next.js。
- SQLite、备份和日志使用持久化本地磁盘，不使用网络盘。
- 管理员密码、会话密钥、Git 凭据及缓存刷新密钥只通过环境变量提供。
- 设置 `CMS_NEXT_REVALIDATE_URL` 与 `CMS_NEXT_REVALIDATE_SECRET` 后，内容发布或下线会异步刷新 Next.js 缓存和 Sitemap。
- `CMS_INDEXNOW_KEY` 与 `CMS_BAIDU_PUSH_TOKEN` 只通过环境变量提供；后台 SEO 页面可以写入 `CMS_ENV_FILE` 指向的 `.env`，只返回配置状态，不返回密钥内容，也不允许写入站点设置 JSON。
- 后台录入密钥时默认写入 `CMS_ENV_FILE` 指向的 `.env`（默认 `backend/.env`）；如果使用只读容器或平台托管环境变量，请直接在平台配置后刷新后台状态。
- Git 仓库、远程、分支及回滚脚本均由服务器环境变量固定；管理后台不允许填写命令或仓库地址。
