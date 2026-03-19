import SuggestionsClient from './suggestions-client'
import { getSuggestionTemplatesAction, getSuggestionsAction } from './actions'

export const metadata = {
  title: '建议管理 - 后台',
}

export default async function SuggestionsPage() {
  const [suggestions, templates] = await Promise.all([
    getSuggestionsAction(),
    getSuggestionTemplatesAction(),
  ])

  return <SuggestionsClient initialData={suggestions} templates={templates} />
}
