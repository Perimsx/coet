# 🎯 快捷路径 (@)

此目录利用 TypeScript Path Mapping 映射，作为一个特殊的“快捷入口”，方便开发者快速触达最常用的底层资源。

## 📂 作用

通常映射到 `src/shared/` 或 `src/config/` 等频繁调用的位置，旨在缩短 `import` 语句长度并保持代码整洁。

- `hooks/`: 核心业务或底层 UI Hooks。
- `components/`: 基础 UI 组件库。

---
> [!NOTE]
> 具体的映射关系请参考根目录下的 `tsconfig.json` 文件。
