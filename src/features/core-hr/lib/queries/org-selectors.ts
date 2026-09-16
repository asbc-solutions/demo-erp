"use client"

import type { QueryHookOptions } from "@/src/shared/lib/types/query"

import { useBranches } from "./branches"
import { useDepartments } from "./departments"

const ORG_SELECTOR_PARAMS = {
  is_active: true,
  per_page: 200,
} as const

export function useActiveBranchOptions(options?: QueryHookOptions) {
  return useBranches(ORG_SELECTOR_PARAMS, options)
}

export function useActiveDepartmentOptions(options?: QueryHookOptions) {
  return useDepartments(ORG_SELECTOR_PARAMS, options)
}
