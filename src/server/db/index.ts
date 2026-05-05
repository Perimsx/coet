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

const rawDatabaseUrl = process.env.DATABASE_URL ?? './storage/db/blog.sqlite'

let baseDir = process.cwd()
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
  console.log('[DB Init] 正在连接数据库文件:', databaseUrl)
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

function safeAlter(sqlText: string) {
  try {
    sqlite.exec(sqlText)
  } catch {
    // Ignore "duplicate column" or "already exists" style bootstrap errors.
  }
}

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

    CREATE TABLE IF NOT EXISTS admin_users (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      username text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id integer NOT NULL,
      session_id text NOT NULL,
      token_hash text NOT NULL UNIQUE,
      device text DEFAULT 'unknown' NOT NULL,
      ip_address text,
      user_agent text,
      expires_at integer NOT NULL,
      last_used_at integer NOT NULL,
      created_at integer NOT NULL,
      revoked_at integer,
      revoked_reason text,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      attempt_key text NOT NULL UNIQUE,
      username text NOT NULL,
      ip_address text NOT NULL,
      fail_count integer DEFAULT 0 NOT NULL,
      first_failed_at integer,
      last_failed_at integer,
      blocked_until integer,
      last_success_at integer
    );

    CREATE TABLE IF NOT EXISTS admin_security_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id integer,
      type text NOT NULL,
      ip_address text,
      user_agent text,
      detail text,
      created_at integer NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
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

    CREATE TABLE IF NOT EXISTS admin_saved_article_views (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id integer,
      name text NOT NULL,
      query text DEFAULT '' NOT NULL,
      category text DEFAULT 'all' NOT NULL,
      status text DEFAULT 'all' NOT NULL,
      sort_by text DEFAULT 'date-desc' NOT NULL,
      payload text DEFAULT '{}' NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_ip_blacklist (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      ip_address text NOT NULL UNIQUE,
      reason text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comment_sensitive_words (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      word text NOT NULL UNIQUE,
      level text DEFAULT 'warning' NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comment_moderation_hits (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      comment_id integer NOT NULL,
      type text NOT NULL,
      match_text text NOT NULL,
      created_at integer NOT NULL,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friends (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      url text NOT NULL,
      avatar text,
      favicon text,
      description text,
      qq text,
      status text DEFAULT 'published' NOT NULL,
      health_status text DEFAULT 'unknown' NOT NULL,
      last_checked_at integer,
      last_status_code integer,
      last_error text,
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
      assignee text,
      ip_address text,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suggestion_reply_templates (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suggestion_timeline_events (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      suggestion_id integer NOT NULL,
      type text NOT NULL,
      detail text NOT NULL,
      created_at integer NOT NULL,
      FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE
    );
  `)

  safeAlter('ALTER TABLE comments ADD COLUMN likes integer DEFAULT 0 NOT NULL;')
  safeAlter('ALTER TABLE friends ADD COLUMN qq text;')
  safeAlter('ALTER TABLE friends ADD COLUMN favicon text;')
  safeAlter("ALTER TABLE friends ADD COLUMN health_status text DEFAULT 'unknown' NOT NULL;")
  safeAlter('ALTER TABLE friends ADD COLUMN last_checked_at integer;')
  safeAlter('ALTER TABLE friends ADD COLUMN last_status_code integer;')
  safeAlter('ALTER TABLE friends ADD COLUMN last_error text;')
  safeAlter('ALTER TABLE suggestions ADD COLUMN admin_reply text;')
  safeAlter('ALTER TABLE suggestions ADD COLUMN assignee text;')

  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS comments_post_status_created_idx
      ON comments (post_id, status, created_at);

    CREATE INDEX IF NOT EXISTS comments_post_parent_created_idx
      ON comments (post_id, parent_id, created_at);

    CREATE INDEX IF NOT EXISTS translation_cache_expires_idx
      ON translation_cache (expires_at);

    CREATE INDEX IF NOT EXISTS admin_refresh_tokens_session_idx
      ON admin_refresh_tokens (session_id, user_id);

    CREATE INDEX IF NOT EXISTS admin_refresh_tokens_active_idx
      ON admin_refresh_tokens (user_id, expires_at, revoked_at);

    CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_idx
      ON admin_login_attempts (ip_address, username);

    CREATE INDEX IF NOT EXISTS admin_security_events_type_created_idx
      ON admin_security_events (type, created_at);

    CREATE INDEX IF NOT EXISTS admin_security_events_user_created_idx
      ON admin_security_events (user_id, created_at);

    CREATE INDEX IF NOT EXISTS admin_saved_article_views_user_updated_idx
      ON admin_saved_article_views (user_id, updated_at);

    CREATE INDEX IF NOT EXISTS comment_moderation_hits_comment_idx
      ON comment_moderation_hits (comment_id, created_at);

    CREATE INDEX IF NOT EXISTS friends_status_sort_idx
      ON friends (status, sort_order, updated_at);

    CREATE INDEX IF NOT EXISTS suggestions_status_updated_idx
      ON suggestions (status, updated_at);

    CREATE INDEX IF NOT EXISTS suggestion_timeline_events_suggestion_idx
      ON suggestion_timeline_events (suggestion_id, created_at);
  `)
}

ensureCoreTables()

export const db = drizzle(sqlite, { schema })

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
