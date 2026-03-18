import { mkdirSync } from 'fs'
import path from 'path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import {
  ADMIN_BOOTSTRAP_STATE_KEY,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
} from '@/features/admin/lib/defaults'
import { hashPassword } from '@/features/admin/lib/password'

// 将 SQLite 文件放在 /data 外，避免 Contentlayer 监听 WAL/SHM 更新。
const rawDatabaseUrl = process.env.DATABASE_URL ?? './storage/db/blog.sqlite'

let baseDir = process.cwd()
// 自动修正 Next.js standalone 模式下的路径偏移
if (baseDir.includes(path.join('.next', 'standalone'))) {
  baseDir = path.resolve(baseDir, '..', '..')
}

const databaseUrl =
  rawDatabaseUrl === ':memory:' || rawDatabaseUrl.startsWith('file:')
    ? rawDatabaseUrl
    : path.isAbsolute(rawDatabaseUrl)
      ? rawDatabaseUrl
      : path.join(baseDir, rawDatabaseUrl)

if (databaseUrl !== ':memory:' && !databaseUrl.startsWith('file:')) {
  console.log('[DB Init] 正在连接数据库文件:', databaseUrl);
  mkdirSync(path.dirname(databaseUrl), { recursive: true })
}

const sqlite = new Database(databaseUrl, {
  timeout: 5000,
})
sqlite.pragma('busy_timeout = 5000')

try {
  sqlite.pragma('journal_mode = WAL')
} catch (error) {
  if (!(error instanceof Error) || !/database is locked/i.test(error.message)) {
    throw error
  }
}

sqlite.pragma('foreign_keys = ON')

function ensureCoreTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      post_id text NOT NULL,
      parent_id integer,
      qq text,
      avatar text,
      author_name text NOT NULL,
      content text NOT NULL,
      is_admin integer DEFAULT 0 NOT NULL,
      ip_address text,
      location text,
      user_agent text,
      browser text,
      os text,
      status text DEFAULT 'pending' NOT NULL,
      likes integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );
  `)
  try {
    sqlite.exec('ALTER TABLE comments ADD COLUMN likes integer DEFAULT 0 NOT NULL;');
  } catch {
    // 如果列已存在则忽略
  }
  sqlite.exec(`

    CREATE TABLE IF NOT EXISTS admin_users (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      username text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_logs (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      url text NOT NULL,
      source text DEFAULT 'manual' NOT NULL,
      note text,
      created_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS translation_cache (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      cache_key text NOT NULL UNIQUE,
      source_hash text NOT NULL,
      translated_text text NOT NULL,
      is_fallback integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL,
      expires_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      "key" text PRIMARY KEY NOT NULL,
      "value" text NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS friends (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      url text NOT NULL,
      avatar text,
      description text,
      qq text,
      status text DEFAULT 'published' NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      qq text NOT NULL,
      content text NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      admin_reply text,
      ip_address text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );
  `)
  try {
    sqlite.exec('ALTER TABLE friends ADD COLUMN qq text;');
  } catch {
    // 如果列已存在则忽略
  }
  try {
    sqlite.exec('ALTER TABLE suggestions ADD COLUMN admin_reply text;');
  } catch {
    // 忽略
  }

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS comments_post_status_created_idx
      ON comments (post_id, status, created_at);

    CREATE INDEX IF NOT EXISTS comments_post_parent_created_idx
      ON comments (post_id, parent_id, created_at);

    CREATE INDEX IF NOT EXISTS translation_cache_expires_idx
      ON translation_cache (expires_at);
  `)
}

ensureCoreTables()

export const db = drizzle(sqlite, { schema })

// 从 .env 自动同步管理员用户
function syncAdminUser() {
  try {
    const username = DEFAULT_ADMIN_USERNAME
    const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD
    const bootstrapState = sqlite
      .prepare('SELECT value FROM settings WHERE "key" = ?')
      .get(ADMIN_BOOTSTRAP_STATE_KEY) as { value?: string } | undefined

    if (bootstrapState?.value === 'done') {
      return
    }

    const passwordHash = hashPassword(password)
    const existingUser = sqlite.prepare('SELECT id FROM admin_users WHERE username = ?').get(username) as
      | { id: number }
      | undefined

    if (existingUser) {
      sqlite.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(passwordHash, existingUser.id)
    } else {
      sqlite.prepare('INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)').run(
        username,
        passwordHash,
        Date.now()
      )
    }

    sqlite.prepare(
      'INSERT INTO settings ("key", "value", updated_at) VALUES (?, ?, ?) ON CONFLICT("key") DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    ).run(ADMIN_BOOTSTRAP_STATE_KEY, 'done', Date.now())
  } catch (error) {
    console.error('[db:syncAdminUser] Failed to sync admin user credentials:', error)
  }
}

syncAdminUser()

