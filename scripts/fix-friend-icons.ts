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
  console.log('🔧 正在使用 unavatar.io 代理修复友链图标...')
  for (const item of updatedFriends) {
    try {
      await db.update(friends)
        .set({ avatar: item.avatar })
        .where(eq(friends.name, item.name))
        .run()
      console.log(`✅ 已更新图标: ${item.name}`)
    } catch (error) {
      console.error(`❌ 更新图标失败: ${item.name}`, error)
    }
  }
  console.log('✅ 图标修复完成！')
}

fixIcons().catch((err) => {
  console.error('❌ 修复失败！')
  console.error(err)
  process.exit(1)
})
