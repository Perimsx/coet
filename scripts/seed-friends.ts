import { db } from '../src/server/db'
import { friends } from '../src/server/db/schema'
import { sql } from 'drizzle-orm'

const friendsData = [
  {
    name: 'Josh W. Comeau',
    url: 'https://www.joshwcomeau.com/',
    avatar: 'https://www.joshwcomeau.com/favicon.ico',
    description: '全球最顶尖的交互式教程博客，设计与技术的巅峰。',
    status: 'published',
    sortOrder: 100,
  },
  {
    name: 'Overreacted',
    url: 'https://overreacted.io/',
    avatar: 'https://overreacted.io/favicon.ico',
    description: 'Dan Abramov 的个人博客，React 核心开发者的深度思考。',
    status: 'published',
    sortOrder: 95,
  },
  {
    name: 'Paco Coursey',
    url: 'https://paco.me/',
    avatar: 'https://paco.me/favicon.ico',
    description: '设计与工程完美结合的典范，极简主义的美学。',
    status: 'published',
    sortOrder: 90,
  },
  {
    name: 'Rauno Freiberg',
    url: 'https://rauno.me/',
    avatar: 'https://rauno.me/favicon.ico',
    description: 'Vercel 设计工程师，专注于极致交互与极简主义。',
    status: 'published',
    sortOrder: 85,
  },
  {
    name: '张鑫旭-鑫空间-鑫生活',
    url: 'https://www.zhangxinxu.com/wordpress/',
    avatar: 'https://www.zhangxinxu.com/favicon.ico',
    description: '国内 CSS 领域的教父级人物，内容极其硬核且持续高质。',
    status: 'published',
    sortOrder: 80,
  },
  {
    name: 'Lee Robinson',
    url: 'https://leerob.io/',
    avatar: 'https://leerob.io/favicon.ico',
    description: 'Vercel 副总裁，Next.js 与现代 Web 开发的领军人物。',
    status: 'published',
    sortOrder: 75,
  }
]

async function seed() {
  console.log('🌱 Seeding high-quality friends...')
  for (const friend of friendsData) {
    try {
      // 检查是否已存在相同 URL的友链
      const existing = await db.select()
        .from(friends)
        .where(sql`url = ${friend.url}`)
        .get()

      if (existing) {
        console.log(`⏩ Friend already exists, skipping: ${friend.name}`)
        continue
      }

      await db.insert(friends).values(friend).run()
      console.log(`✅ Added friend: ${friend.name}`)
    } catch (error) {
      console.error(`❌ Failed to add friend: ${friend.name}`, error)
    }
  }
  console.log('✅ Seeding completed!')
}

seed().catch((err) => {
  console.error('❌ Seeding failed!')
  console.error(err)
  process.exit(1)
})
