# 📝 内容层 (Content)

此目录承载了博客的所有静态内容、元数据及多媒体资源。通过 Contentlayer 自动将这些 Markdown/MDX 文件转换为类型安全的 JSON 对象。

## 📂 目录结构

- `authors/`: 存放作者的个人简介（如 `default.md`）。包含头像、姓名、职位及社交链接。
- `blog/`: 核心文章存放地。支持 `.md` 或 `.mdx` 格式，支持前置元数据（Frontmatter）定义标题、日期、标签等。
- `projects/`: 以 JSON 或 Markdown 格式定义项目展示信息，用于“项目”页面。

## 💡 写作指南

1. **新建文章**: 在 `blog/` 下创建新文件，推荐命名格式：`YYYY-MM-DD-title.mdx`。
2. **前置元数据**: 必须包含 `title`, `date` 等必填字段。
3. **内容热更新**: 开发环境下修改此目录文件，Next.js 会自动触发热更新。

---
> [!TIP]
> 修改内容结构后，可能需要运行 `pnpm db:generate` 或重启开发服务以同步 Contentlayer 类型。
