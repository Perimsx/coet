// 初始化管理员账户脚本
import { eq } from 'drizzle-orm'
import { db } from '../src/server/db'
import { adminUsers } from '../src/server/db/schema'
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME } from '../src/features/admin/lib/defaults'
import { hashPassword } from '../src/features/admin/lib/password'

const username = DEFAULT_ADMIN_USERNAME
const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD

// 密码长度校验
if (password.length < 6) {
  throw new Error('ADMIN_PASSWORD 必须至少包含 6 个字符。')
}

// 检查现有用户
const existingUser = db.select().from(adminUsers).where(eq(adminUsers.username, username)).get()
const passwordHash = hashPassword(password)

if (existingUser) {
  // 更新现有管理员密码
  db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, existingUser.id)).run()
  console.log(`[seed-admin] 已更新用户 "${username}" 的密码。`)
} else {
  // 创建新管理员
  db.insert(adminUsers).values({ username, passwordHash }).run()
  console.log(`[seed-admin] 已创建管理员用户 "${username}"。`)
}
