import SuggestionsClient from './suggestions-client'
import { getSuggestionsAction } from './actions'

export const metadata = {
  title: '建议管理 - 后台',
}

export default async function SuggestionsPage() {
  const suggestions = await getSuggestionsAction()
  return <SuggestionsClient initialData={suggestions} />
}
