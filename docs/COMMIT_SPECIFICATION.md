# Git Commit 规范

基于 **Conventional Commits** 标准，统一提交格式，便于追溯变更、自动生成 Changelog。

---

## 格式

```text
<type>(<scope>): <subject>

<body>

<footer>
```

> Header 必填，长度建议 50-72 字符。Body 和 Footer 可选。

---

## Header

格式：`<type>(<scope>): <subject>`

### Type

| Type | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响逻辑，非 CSS） |
| `refactor` | 重构（不修 Bug 也不加功能） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |
| `ci` | CI/CD 配置变更 |
| `revert` | 回滚提交 |

### Scope（可选）

受影响的模块名，如：`auth`、`search`、`deploy`、`ui`、`content`。

### Subject

- 祈使句、现在时："add" 而非 "added"
- 首字母小写
- 末尾不加句号

---

## Body（可选）

说明**为什么**做这个修改以及**实现**了什么逻辑。适用于复杂架构变更、重构、业务逻辑调整。

---

## Footer（可选）

1. **Breaking Change**：以 `BREAKING CHANGE:` 开头，描述破坏性变更及迁移步骤
2. **Issue 引用**：`Closes #123`、`Fixes #456`

---

## 示例

```text
feat(search): 直接 fetch 静态搜索索引，支持静态导出模式
```

```text
fix(deploy): 修复 pnpm 版本兼容性

从 package.json packageManager 字段读取精确版本安装，
避免 pnpm 11 与 Node.js 20 不兼容导致部署失败。
```

```text
refactor(content): 抽取 getPostSourcePath 共享工具函数

将 4 处完全相同的 getPostSourcePath 定义合并到 post-utils.ts。
调用方统一从 @/features/content/lib/post-utils 导入。
```

```text
refactor(api): 重构文章数据 Schema

BREAKING CHANGE: authorInfo 字段已废弃，合并至 user 对象。
前端组件需从 data.authorInfo.name 迁移至 data.user.name。
```

---

## 自动化校验

### commitlint + husky

```bash
pnpm add -D @commitlint/config-conventional @commitlint/cli husky
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Commitizen 交互式提交

```bash
pnpm add -D commitizen cz-conventional-changelog
```

`package.json` 中添加：

```json
"config": {
  "commitizen": {
    "path": "./node_modules/cz-conventional-changelog"
  }
}
```

使用 `npx cz` 替代 `git commit`，交互式引导选择 type、scope、subject。
