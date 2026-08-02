# COT CMS API

Go + SQLite 后端服务，负责管理员会话、文章、分类、标签、审计和系统健康检查。前台和 Arco 后台由根目录的 Next.js 应用提供。

## 本地启动

```powershell
Copy-Item .env.example .env
$env:CMS_ADMIN_PASSWORD = "your-strong-password"
go run ./cmd/server
```

默认监听 `:8080`，数据库默认位于 `../storage/db/blog.sqlite`。SQLite 会自动开启 WAL、外键约束和 `busy_timeout`。

## 本地前端代理

根目录设置 `CMS_API_PROXY_URL=http://127.0.0.1:8080` 后执行 `pnpm dev`，浏览器对 `/api/v1/*` 的请求会被 Next.js 转发到 Go 服务，保持 Cookie 同源。

## 校验

```powershell
go test ./...
go vet ./...
```

## 导入现有内容

首次部署完成后，在 `backend/` 目录运行以下命令，将现有 Markdown、分类、标签、友链和基础站点信息导入 SQLite。该命令只插入尚不存在的 Slug 或 URL，可安全重复执行，不会覆盖后台已编辑的内容：

```powershell
go run ./cmd/import-content
```

## 生产边界

- Nginx/Caddy 应将 `/api/` 反向代理至 Go API，将其余请求代理至 Next.js。
- 数据库、备份与日志目录必须使用持久化磁盘；不要将 SQLite 放在网络盘。
- 管理员密码、Git 凭据和 Revalidate 密钥只放环境变量，不能提交入库。
- 设置 `CMS_NEXT_REVALIDATE_URL` 和 `CMS_NEXT_REVALIDATE_SECRET` 后，文章或页面发布、下线会异步请求 Next 的 `/api/internal/revalidate`，刷新前台与 Sitemap 缓存。Next 进程须设置同名 `CMS_NEXT_REVALIDATE_SECRET`。
