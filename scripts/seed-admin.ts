import { eq } from 'drizzle-orm'
import { db } from '../src/server/db'
import { adminUsers } from '../src/server/db/schema'
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME } from '../src/features/admin/lib/defaults'
import { hashPassword } from '../src/features/admin/lib/password'

const username = DEFAULT_ADMIN_USERNAME
const password = process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD

if (password.length < 6) {
  throw new Error('ADMIN_PASSWORD must be at least 6 characters.')
}

const existingUser = db.select().from(adminUsers).where(eq(adminUsers.username, username)).get()
const passwordHash = hashPassword(password)

if (existingUser) {
  db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, existingUser.id)).run()
  console.log(`[seed-admin] Updated password for user "${username}".`)
} else {
  db.insert(adminUsers).values({ username, passwordHash }).run()
  console.log(`[seed-admin] Created admin user "${username}".`)
}
