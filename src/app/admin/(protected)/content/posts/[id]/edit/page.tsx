import { PostEditor } from '@/features/admin/components/PostEditor'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <PostEditor postID={id} /> }
