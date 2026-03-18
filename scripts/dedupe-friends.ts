import { db } from '../src/server/db'
import { friends } from '../src/server/db/schema'
import { sql } from 'drizzle-orm'

async function dedupe() {
  console.log('🧹 正在清理重复的友链数据...')
  
  try {
    // 找出每个 URL 对应的最小 ID
    // 然后删除所有不在这个最小 ID 集合中的记录
    const result = await db.run(sql`
      DELETE FROM friends 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM friends 
        GROUP BY url
      )
    `)
    
    console.log('✅ 友链去重完成！')
  } catch (error) {
    console.error('❌ 友链去重失败！', error)
    process.exit(1)
  }
}

dedupe()
