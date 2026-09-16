"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "../api/projects"
import { operationsKeys } from "../constants/query-keys"
import type { CreateProjectPayload, UpdateProjectPayload } from "../types"

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      projectsApi.create(payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: operationsKeys.projects.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectPayload }) =>
      projectsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: operationsKeys.projects.all }),
  })
}
