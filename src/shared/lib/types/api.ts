export type PaginationMeta = {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export type ApiResponse<T> = {
  success: boolean
  data: T
  meta?: PaginationMeta
}

export type ApiError = {
  code: string
  message: string
  details?: Record<string, unknown>
  blocking_counts?: Record<string, number>
}
