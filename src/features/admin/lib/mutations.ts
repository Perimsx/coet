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
