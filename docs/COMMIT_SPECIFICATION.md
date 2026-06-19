# Git Commit Specification

Based on **Conventional Commits**. Unified format for traceability and automated changelog generation.

---

## Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

> Header is required, 50-72 characters. Body and Footer are optional.

---

## Header

Format: `<type>(<scope>): <subject>`

### Type

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Code formatting (no logic change, not CSS) |
| `refactor` | Refactor (no bug fix, no feature) |
| `perf` | Performance optimization |
| `test` | Tests |
| `chore` | Build / tooling / dependencies |
| `ci` | CI/CD configuration |
| `revert` | Revert commit |

### Scope (optional)

Module name, e.g.: `auth`, `search`, `deploy`, `ui`, `content`.

### Subject

- Imperative, present tense: "add" not "added"
- No capitalization on first letter
- No period at the end

---

## Body (optional)

Explain **why** the change was made and **what** logic was implemented.

---

## Footer (optional)

1. **Breaking Change**: Start with `BREAKING CHANGE:`, describe the breaking change and migration steps
2. **Issue reference**: `Closes #123`, `Fixes #456`

---

## Examples

```text
feat(search): fetch static search index directly for static export support
```

```text
fix(deploy): resolve pnpm version compatibility

Read exact version from package.json packageManager field to avoid
pnpm 11 incompatibility with Node.js 20 on deployment.
```

```text
refactor(content): extract getPostSourcePath to shared utility

Consolidate 4 identical getPostSourcePath definitions into post-utils.ts.
All consumers now import from @/features/content/lib/post-utils.
```

```text
refactor(api): restructure post data schema

BREAKING CHANGE: authorInfo field deprecated, merged into user object.
Frontend components must migrate from data.authorInfo.name to data.user.name.
```

---

## Enforcement

### commitlint + husky

```bash
pnpm add -D @commitlint/config-conventional @commitlint/cli husky
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Commitizen interactive prompt

```bash
pnpm add -D commitizen cz-conventional-changelog
```

Add to `package.json`:

```json
"config": {
  "commitizen": {
    "path": "./node_modules/cz-conventional-changelog"
  }
}
```

Use `npx cz` instead of `git commit` for guided type / scope / subject selection.
