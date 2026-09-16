"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "../api/projects"
import { pmKeys } from "../constants/query-keys"
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  AddStakeholderPayload,
} from "../types"

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      projectsApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.projects.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateProjectPayload
    }) => projectsApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: pmKeys.projects.detail(id) })
      qc.invalidateQueries({ queryKey: pmKeys.projects.all })
    },
  })
}

export function useReleaseProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      projectsApi.release(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: pmKeys.projects.detail(id) })
      qc.invalidateQueries({ queryKey: pmKeys.projects.all })
    },
  })
}

export function useImportProjects() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) =>
      projectsApi.import(file).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: pmKeys.projects.all }),
  })
}

export function useFollowProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, follow }: { id: string; follow: boolean }) =>
      (follow ? projectsApi.follow(id) : projectsApi.unfollow(id)).then(
        (r) => r.data.data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pmKeys.myWork.all })
    },
  })
}

export function useAddStakeholder(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddStakeholderPayload) =>
      projectsApi.addStakeholder(projectId, payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: pmKeys.projects.stakeholders(projectId),
      })
      qc.invalidateQueries({ queryKey: pmKeys.projects.detail(projectId) })
    },
  })
}

export function useRemoveStakeholder(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stakeholderId: string) =>
      projectsApi.removeStakeholder(projectId, stakeholderId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: pmKeys.projects.stakeholders(projectId),
      })
      qc.invalidateQueries({ queryKey: pmKeys.projects.detail(projectId) })
    },
  })
}
