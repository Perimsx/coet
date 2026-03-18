import AboutEditorForm from '@/features/admin/components/AboutEditorForm'
import { getAboutPageData } from '@/features/content/lib/about-page'

export default async function AdminAboutPage() {
  const data = await getAboutPageData()

  return (
    <section>
      <AboutEditorForm initialData={{ frontmatter: data.frontmatter, content: data.content || '' }} />
    </section>
  )
}
