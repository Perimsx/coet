import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const commentStatusValues = ['pending', 'approved', 'rejected'] as const
export type CommentStatus = (typeof commentStatusValues)[number]

export const suggestionStatusValues = ['pending', 'in_progress', 'replied', 'resolved'] as const
export type SuggestionStatus = (typeof suggestionStatusValues)[number]

export const adminSecurityEventTypeValues = [
  'login_success',
  'login_failed',
  'login_rate_limited',
  'login_new_ip',
  'token_refreshed',
  'logout',
  'logout_all',
  'password_changed',
  'comment_deleted',
] as const
export type AdminSecurityEventType = (typeof adminSecurityEventTypeValues)[number]

export const adminSessionDeviceValues = ['desktop', 'mobile', 'tablet', 'bot', 'unknown'] as const
export type AdminSessionDevice = (typeof adminSessionDeviceValues)[number]

export const moderationHitTypeValues = ['sensitive_word', 'ip_blacklist'] as const
export type ModerationHitType = (typeof moderationHitTypeValues)[number]

export const sensitiveWordLevelValues = ['warning', 'block'] as const
export type SensitiveWordLevel = (typeof sensitiveWordLevelValues)[number]

export const suggestionTimelineTypeValues = ['status_changed', 'reply', 'note'] as const
export type SuggestionTimelineType = (typeof suggestionTimelineTypeValues)[number]

export const linkHealthStatusValues = ['unknown', 'healthy', 'warning', 'down'] as const
export type LinkHealthStatus = (typeof linkHealthStatusValues)[number]

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

export const adminRefreshTokens = sqliteTable('admin_refresh_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => adminUsers.id, { onDelete: 'cascade' })
    .notNull(),
  sessionId: text('session_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  device: text('device', { enum: adminSessionDeviceValues }).notNull().default('unknown'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  revokedReason: text('revoked_reason'),
}, (table) => ({
  tokenHashIdx: uniqueIndex('admin_refresh_tokens_token_hash_idx').on(table.tokenHash),
  sessionIdx: index('admin_refresh_tokens_session_idx').on(table.sessionId, table.userId),
  activeIdx: index('admin_refresh_tokens_active_idx').on(table.userId, table.expiresAt, table.revokedAt),
}))

export const adminLoginAttempts = sqliteTable('admin_login_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  attemptKey: text('attempt_key').notNull(),
  username: text('username').notNull(),
  ipAddress: text('ip_address').notNull(),
  failCount: integer('fail_count').notNull().default(0),
  firstFailedAt: integer('first_failed_at', { mode: 'timestamp_ms' }),
  lastFailedAt: integer('last_failed_at', { mode: 'timestamp_ms' }),
  blockedUntil: integer('blocked_until', { mode: 'timestamp_ms' }),
  lastSuccessAt: integer('last_success_at', { mode: 'timestamp_ms' }),
}, (table) => ({
  attemptKeyIdx: uniqueIndex('admin_login_attempts_attempt_key_idx').on(table.attemptKey),
  ipIdx: index('admin_login_attempts_ip_idx').on(table.ipAddress, table.username),
}))

export const adminSecurityEvents = sqliteTable('admin_security_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  type: text('type', { enum: adminSecurityEventTypeValues }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  detail: text('detail'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  typeCreatedIdx: index('admin_security_events_type_created_idx').on(table.type, table.createdAt),
  userCreatedIdx: index('admin_security_events_user_created_idx').on(table.userId, table.createdAt),
}))

export const mediaLogs = sqliteTable('media_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  source: text('source').notNull().default('manual'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const adminSavedArticleViews = sqliteTable('admin_saved_article_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  query: text('query').notNull().default(''),
  category: text('category').notNull().default('all'),
  status: text('status').notNull().default('all'),
  sortBy: text('sort_by').notNull().default('date-desc'),
  payload: text('payload').notNull().default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  userUpdatedIdx: index('admin_saved_article_views_user_updated_idx').on(table.userId, table.updatedAt),
}))

export const commentIpBlacklist = sqliteTable('comment_ip_blacklist', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ipAddress: text('ip_address').notNull(),
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  ipIdx: uniqueIndex('comment_ip_blacklist_ip_idx').on(table.ipAddress),
}))

export const commentSensitiveWords = sqliteTable('comment_sensitive_words', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word: text('word').notNull(),
  level: text('level', { enum: sensitiveWordLevelValues }).notNull().default('warning'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  wordIdx: uniqueIndex('comment_sensitive_words_word_idx').on(table.word),
}))

export const commentModerationHits = sqliteTable('comment_moderation_hits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commentId: integer('comment_id')
    .references(() => comments.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type', { enum: moderationHitTypeValues }).notNull(),
  matchText: text('match_text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  commentIdx: index('comment_moderation_hits_comment_idx').on(table.commentId, table.createdAt),
}))

export const friends = sqliteTable('friends', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  avatar: text('avatar'),
  favicon: text('favicon'),
  description: text('description'),
  qq: text('qq'),
  status: text('status').notNull().default('published'),
  healthStatus: text('health_status', { enum: linkHealthStatusValues }).notNull().default('unknown'),
  lastCheckedAt: integer('last_checked_at', { mode: 'timestamp_ms' }),
  lastStatusCode: integer('last_status_code'),
  lastError: text('last_error'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  statusSortIdx: index('friends_status_sort_idx').on(table.status, table.sortOrder, table.updatedAt),
}))

export const suggestions = sqliteTable('suggestions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  qq: text('qq').notNull(),
  content: text('content').notNull(),
  status: text('status', { enum: suggestionStatusValues }).notNull().default('pending'),
  adminReply: text('admin_reply'),
  assignee: text('assignee'),
  ipAddress: text('ip_address'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  statusUpdatedIdx: index('suggestions_status_updated_idx').on(table.status, table.updatedAt),
}))

export const suggestionReplyTemplates = sqliteTable('suggestion_reply_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
})

export const suggestionTimelineEvents = sqliteTable('suggestion_timeline_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  suggestionId: integer('suggestion_id')
    .references(() => suggestions.id, { onDelete: 'cascade' })
    .notNull(),
  type: text('type', { enum: suggestionTimelineTypeValues }).notNull(),
  detail: text('detail').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
}, (table) => ({
  suggestionIdx: index('suggestion_timeline_events_suggestion_idx').on(table.suggestionId, table.createdAt),
}))

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type AdminUser = typeof adminUsers.$inferSelect
export type AdminRefreshTokenRecord = typeof adminRefreshTokens.$inferSelect
export type NewAdminRefreshTokenRecord = typeof adminRefreshTokens.$inferInsert
export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect
export type AdminSecurityEvent = typeof adminSecurityEvents.$inferSelect
export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert
export type ArticleFilterPreset = typeof adminSavedArticleViews.$inferSelect
export type NewArticleFilterPreset = typeof adminSavedArticleViews.$inferInsert
export type CommentIpBlacklistRecord = typeof commentIpBlacklist.$inferSelect
export type CommentSensitiveWord = typeof commentSensitiveWords.$inferSelect
export type CommentModerationHit = typeof commentModerationHits.$inferSelect
export type Friend = typeof friends.$inferSelect
export type NewFriend = typeof friends.$inferInsert
export type Suggestion = typeof suggestions.$inferSelect
export type NewSuggestion = typeof suggestions.$inferInsert
export type SuggestionReplyTemplate = typeof suggestionReplyTemplates.$inferSelect
export type NewSuggestionReplyTemplate = typeof suggestionReplyTemplates.$inferInsert
export type SuggestionTimelineEvent = typeof suggestionTimelineEvents.$inferSelect
