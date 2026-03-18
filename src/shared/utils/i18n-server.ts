import {
  getDictionary,
} from '@/shared/utils/i18n'

/**
 * 在服务端获取多语言字典对象
 */
export async function getServerDictionary() {
  return getDictionary()
}
