import { getAllAuthors } from './contentlayer-adapter'

type AboutPageData = {
  frontmatter: Record<string, unknown>
  content: string
}

export async function getAboutPageData(locale: 'zh' | 'en' = 'zh'): Promise<AboutPageData> {
  const allAuthors = getAllAuthors()
  const author =
    allAuthors.find((a) =>
      locale === 'en'
        ? a.slug === 'default-en' || a._raw?.sourceFileName === 'default.en.md'
        : a.slug === 'default' || a._raw?.sourceFileName === 'default.md'
    ) || allAuthors[0]

  if (author) {
    return {
      frontmatter: author as unknown as Record<string, unknown>,
      content: author.body?.raw || '',
    }
  }
  return {
    frontmatter: {},
    content: '',
  }
}
