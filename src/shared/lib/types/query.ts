/**
 * Options list-query hooks expose so callers can defer a fetch that is not needed yet
 * (a closed dialog's dropdown data, a collapsed nav submenu's badge counts) or relax
 * freshness for data that is only decorative.
 */
export type QueryHookOptions = {
  enabled?: boolean
  staleTime?: number
}
