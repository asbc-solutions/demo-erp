"use client"

import { useQuery } from "@tanstack/react-query"
import { customersApi } from "../api/customers"
import { salesKeys } from "../constants/query-keys"
import type { CustomerListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useCustomers(params?: CustomerListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: salesKeys.customers.list(params),
    queryFn: () => customersApi.list(params).then((r) => r.data),
    ...options,
  })
}

const CUSTOMER_DIRECTORY_PAGE_SIZE = 100

/**
 * Loads the complete customer directory for client-side filtering and uniqueness
 * checks. The customers endpoint currently does not search email addresses and
 * returns tab counts that ignore the search term, so consumers that need those
 * guarantees must work from the same complete data set.
 */
export function useCustomerDirectory(options?: QueryHookOptions) {
  return useQuery({
    queryKey: [...salesKeys.customers.all, "directory"],
    queryFn: async () => {
      const firstPage = await customersApi.list({
        tab: "all",
        page: 1,
        per_page: CUSTOMER_DIRECTORY_PAGE_SIZE,
      })
      const firstData = firstPage.data
      const lastPage = firstData.meta.last_page

      if (lastPage <= 1) return firstData.data

      const remainingPages = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) =>
          customersApi
            .list({
              tab: "all",
              page: index + 2,
              per_page: CUSTOMER_DIRECTORY_PAGE_SIZE,
            })
            .then((response) => response.data.data)
        )
      )

      return [firstData.data, ...remainingPages].flat()
    },
    ...options,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: salesKeys.customers.detail(id),
    queryFn: () => customersApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}
