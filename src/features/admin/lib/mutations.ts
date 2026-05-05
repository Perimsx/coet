/**
 * 管理后台操作结果的统一返回结构
 */
export type AdminMutationResult<T = never> =
  | {
      ok: true
      message?: string
      item?: T
      items?: T[]
      deletedIds?: number[]
    }
  | {
      ok: false
      error: string
      code?: string
    }

/**
 * 返回操作成功的结果对象
 */
export function adminSuccess<T>(input: {
  message?: string
  item?: T
  items?: T[]
  deletedIds?: number[]
} = {}): AdminMutationResult<T> {
  return {
    ok: true,
    message: input.message,
    item: input.item,
    items: input.items,
    deletedIds: input.deletedIds,
  }
}

/**
 * 返回操作失败的结果对象
 */
export function adminError(
  error: string,
  code?: string,
): AdminMutationResult<never> {
  return {
    ok: false,
    error,
    code,
  }
}
