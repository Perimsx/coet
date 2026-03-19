# Coet

Coet is a Next.js 15 blog and admin workspace built for file-based publishing with a lightweight operational backend.

The content model stays split on purpose:

- Posts and the about page are stored as Markdown or MDX files.
- Operational data such as admin auth, comments, suggestions, settings, saved views, and link checks live in SQLite.

## Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS 4
- SQLite with `better-sqlite3`
- Drizzle ORM
- Contentlayer 2
- PM2 for production process management

## Main Features

- Public blog, archive, tags, friends, and about pages
- Protected admin workspace with dashboard, posts, comments, suggestions, links, about, and settings
- File-based post editing instead of database-backed articles
- SQLite-backed admin sessions, moderation data, templates, and saved filters
- Generated RSS, robots, sitemap, manifest, JSON-LD, and optional IndexNow key output
- Optional Baidu and IndexNow submission script

## Project Layout

- `content`: Markdown and MDX source content
- `public`: static assets, branding assets, generated SEO files
- `scripts`: build, seed, and SEO helper scripts
- `src/app`: app routes
- `src/features`: domain features for admin, content, SEO, friends, comments, and site UI
- `src/server`: SQLite access, mail, and settings services
- `storage`: SQLite database and runtime logs

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- SQLite support on the deployment target
- PM2 installed globally for the production deploy script

## Environment Variables

Use your own values instead of the defaults below.

```bash
# Core site identity
NEXT_PUBLIC_SITE_TITLE="Chen Guitao's Blog"
NEXT_PUBLIC_SITE_AUTHOR="Chen Guitao"
NEXT_PUBLIC_SITE_DESCRIPTION="Chen Guitao's tech notes and project records"
NEXT_PUBLIC_SITE_URL="https://chenguitao.com"
NEXT_PUBLIC_SITE_HEADER_TITLE="Chen Guitao's Blog"

# Optional public profile links
NEXT_PUBLIC_SITE_EMAIL=""
NEXT_PUBLIC_GITHUB_URL=""
NEXT_PUBLIC_X_URL=""
NEXT_PUBLIC_YUQUE_URL=""
NEXT_PUBLIC_SITE_REPO="https://github.com/kerntau/Coet"

# Runtime
BASE_PATH=""
DATABASE_URL="./storage/db/blog.sqlite"
ENABLE_ADMIN="true"
ADMIN_SESSION_SECRET="replace-with-a-long-random-string"
ADMIN_PASSWORD="replace-after-bootstrap"
ADMIN_BYPASS_LOGIN="0"
ADMIN_ALLOWED_ORIGINS=""
ADMIN_LOGIN_ENTRY="18671188011"

# Bootstrap-only defaults for a fresh admin user
ADMIN_BOOTSTRAP_USERNAME="admin"
ADMIN_BOOTSTRAP_PASSWORD="change-me-now"

# SEO and indexing
SITE_URL="https://chenguitao.com"
GOOGLE_SEARCH_CONSOLE=""
BAIDU_PUSH_TOKEN=""
INDEXNOW_KEY=""

# Optional integrations
NEXT_UMAMI_ID=""
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Useful checks:

```bash
pnpm typecheck
pnpm lint
```

Bootstrap helpers:

```bash
pnpm db:seed-admin
pnpm db:seed-friends
```

## Build and SEO Output

Production build:

```bash
pnpm build
```

The build step also runs `scripts/build/postbuild.ts`, which:

- syncs the branding favicon to `public/favicon.ico`
- generates RSS output
- writes `public/<INDEXNOW_KEY>.txt` when `INDEXNOW_KEY` is set

Optional manual URL submission:

```bash
pnpm exec tsx scripts/seo-push.ts
```

That script prepares URLs for the homepage, posts, archive, tags, categories, about, and friends pages, then submits them to Baidu and IndexNow when the required tokens are available.

## Production Deployment

`deploy.sh` is written for a server that already has the repository checked out.

What it does:

- checks required commands
- optionally runs `git pull --ff-only` when the worktree is clean
- installs dependencies with the lockfile
- runs `pnpm db:push` when a Drizzle config exists
- builds the standalone Next.js output
- copies `public` and `.next/static` into `.next/standalone`
- restarts the app through PM2
- performs a local health check

Run it on the server:

```bash
bash deploy.sh
```

Useful overrides:

```bash
APP_NAME="coet-blog" PORT="1021" NODE_BUILD_MEMORY="1024" bash deploy.sh
```

PM2 uses `ecosystem.config.cjs` and starts the standalone server at `./.next/standalone/server.js`.

## Notes

- Admin routes are hidden in production unless `ENABLE_ADMIN="true"`.
- The admin UI is protected by cookie-based access and refresh tokens.
- Post content is intentionally not moved into SQLite.
- Deletes stay as hard deletes; there is no trash layer.
