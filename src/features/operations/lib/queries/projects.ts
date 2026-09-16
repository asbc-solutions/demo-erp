"use client"

import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "../api/projects"
import { operationsKeys } from "../constants/query-keys"
import type { ProjectListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useProjects(params?: ProjectListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: operationsKeys.projects.list(params),
    queryFn: () => projectsApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useProjectKpis() {
  return useQuery({
    queryKey: operationsKeys.projects.kpis(),
    queryFn: () => projectsApi.kpis().then((r) => r.data.data),
  })
}
