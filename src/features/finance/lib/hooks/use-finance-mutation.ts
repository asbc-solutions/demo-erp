"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { financeKeys } from "../constants/query-keys"

/**
 * A finance write can move subledger totals, cash, the attention list and nav
 * badges at once, so every one refreshes the whole finance module.
 */
export function useFinanceMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
  })
}
