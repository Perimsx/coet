import {
  getDictionary,
} from '@/shared/utils/i18n'

export async function getServerDictionary() {
  return getDictionary()
}
