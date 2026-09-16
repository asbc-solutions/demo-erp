"use client"

import { useQuery } from "@tanstack/react-query"
import { governanceApi } from "../api/governance"
import { pmKeys } from "../constants/query-keys"

/** G0–G6 gate pipeline for a project (lazy-seeded server-side). */
export function useProjectGates(projectId: string) {
  return useQuery({
    queryKey: pmKeys.governance.gates(projectId),
    queryFn: () => governanceApi.listGates(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

/** Change requests raised against a project. */
export function useProjectChangeRequests(projectId: string) {
  return useQuery({
    queryKey: pmKeys.governance.changeRequests(projectId),
    queryFn: () =>
      governanceApi.listChangeRequests(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}

/** Fixed 15-item closure checklist (lazy-seeded server-side). */
export function useClosureChecklist(projectId: string) {
  return useQuery({
    queryKey: pmKeys.governance.closure(projectId),
    queryFn: () =>
      governanceApi.getClosureChecklist(projectId).then((r) => r.data.data),
    enabled: !!projectId,
  })
}
