import PostsPanel from './posts-panel'
import { listPostFiles } from '@/features/content/lib/posts'
import { getCategoryListAction } from '@/app/admin/actions'

export default async function AdminPostsPage() {
  const posts = await listPostFiles()
  const categories = await getCategoryListAction()

  return (
    <section>
      <PostsPanel posts={posts} categoryOptions={categories} />
    </section>
  )
}