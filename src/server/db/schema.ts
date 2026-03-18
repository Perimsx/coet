import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const commentStatusValues = ['pending', 'approved', 'rejected'] as const
export type CommentStatus = (typeof commentStatusValues)[number]

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: text('post_id').notNull(),
  parentId: integer('parent_id'),
  qq: text('qq'),
  avatar: text('avatar'),
  authorName: text('author_name').notNull(),
  content: text('content').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  ipAddress: text('ip_address'),
  location: text('location'),
  userAgent: text('user_agent'),
  browser: text('browser'),
  os: text('os'),
  status: text('status', { enum: commentStatusValues }).notNull().default('pending'),
  likes: integer('likes').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  postStatusCreatedIdx: index('comments_post_status_created_idx').on(
    table.postId,
    table.status,
    table.createdAt
  ),
  postParentCreatedIdx: index('comments_post_parent_created_idx').on(
    table.postId,
    table.parentId,
    table.createdAt
  ),
}))

export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const mediaLogs = sqliteTable('media_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  source: text('source').notNull().default('manual'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

// 站点设置表
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const friends = sqliteTable('friends', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  avatar: text('avatar'),
  description: text('description'),
  qq: text('qq'),
  status: text('status').notNull().default('published'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})



export const suggestions = sqliteTable('suggestions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  qq: text('qq').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'replied'] }).notNull().default('pending'),
  adminReply: text('admin_reply'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type AdminUser = typeof adminUsers.$inferSelect
export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert
export type Friend = typeof friends.$inferSelect
export type NewFriend = typeof friends.$inferInsert
export type Suggestion = typeof suggestions.$inferSelect
export type NewSuggestion = typeof suggestions.$inferInsert

