# 📜 脚本工具库 (Scripts)

包含用于自动化开发、构建、数据库管理及运维的工具脚本。

## 📂 核心任务

- **数据库管理**:
  - `seed-admin.ts`: 初始化管理员账户。
  - `seed-friends.ts`: 预填初始友链数据。
- **构建辅助**:
  - `postbuild.ts`: 编译后的清理与优化任务。
- **SEO 与同步**:
  - 包含主动向百度、Bing 等搜索引擎推送链接的自动化逻辑。

## 🚀 常用指令

```bash
# 执行特定脚本
pnpm tsx scripts/your-script.ts
```
