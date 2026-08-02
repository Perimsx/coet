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

## 生产边界

- Nginx/Caddy 应将 `/api/` 反向代理至 Go API，将其余请求代理至 Next.js。
- 数据库、备份与日志目录必须使用持久化磁盘；不要将 SQLite 放在网络盘。
- 管理员密码、Git 凭据和 Revalidate 密钥只放环境变量，不能提交入库。
