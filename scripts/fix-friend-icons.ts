import { db } from '../src/server/db'
import { friends } from '../src/server/db/schema'
import { eq } from 'drizzle-orm'

// 使用 unavatar.io 作为极其稳定的头像代理
const updatedFriends = [
  {
    name: 'Josh W. Comeau',
    avatar: 'https://unavatar.io/github/joshwcomeau',
  },
  {
    name: 'Overreacted',
    avatar: 'https://unavatar.io/github/gaearon',
  },
  {
    name: 'Paco Coursey',
    avatar: 'https://unavatar.io/github/pacocoursey',
  },
  {
    name: 'Rauno Freiberg',
    avatar: 'https://unavatar.io/github/raunofreiberg',
  },
  {
    name: '张鑫旭-鑫空间-鑫生活',
    avatar: 'https://unavatar.io/github/zhangxinxu', // 尝试其 Github 头像
  },
  {
    name: 'Lee Robinson',
    avatar: 'https://unavatar.io/github/leerob',
  },
  {
    name: '酷壳 - CoolShell',
    avatar: 'https://unavatar.io/github/haoel',
  },
  {
    name: '阮一峰的个人网站',
    avatar: 'https://unavatar.io/github/ruanyf',
  },
  {
    name: '廖雪峰的官方网站',
    avatar: 'https://unavatar.io/twitter/liaoxuefeng', // 尝试 Twitter 渠道
  },
  {
    name: '印记中文',
    avatar: 'https://unavatar.io/github/docschina',
  }
]

async function fixIcons() {
  console.log('🔧 Fixing friend icons with unavatar.io proxy...')
  for (const item of updatedFriends) {
    try {
      await db.update(friends)
        .set({ avatar: item.avatar })
        .where(eq(friends.name, item.name))
        .run()
      console.log(`✅ Updated icon for: ${item.name}`)
    } catch (error) {
      console.error(`❌ Failed to update icon for: ${item.name}`, error)
    }
  }
  console.log('✅ Icon fix completed!')
}

fixIcons().catch((err) => {
  console.error('❌ Fix failed!')
  console.error(err)
  process.exit(1)
})
