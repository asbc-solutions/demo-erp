"use client"

import { useQuery } from "@tanstack/react-query"
import { hierarchyApi } from "../api/hierarchy"
import { pmKeys } from "../constants/query-keys"

export function useProjectHierarchy(projectId: string) {
  return useQuery({
    queryKey: pmKeys.hierarchy.byProject(projectId),
    queryFn: () => hierarchyApi.getTree(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

/** Portfolio WBS index — one row per project with node counts. */
export function useWbsIndex() {
  return useQuery({
    queryKey: pmKeys.hierarchy.wbsIndex(),
    queryFn: () => hierarchyApi.wbsIndex().then((r) => r.data.data),
  })
}
