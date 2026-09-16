"use client"

import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "../api/projects"
import { templatesApi } from "../api/templates"
import { pmKeys } from "../constants/query-keys"
import type { ProjectListParams, TemplateListParams } from "../types"
import type { QueryHookOptions } from "@/src/shared/lib/types/query"

export function useProjects(params?: ProjectListParams, options?: QueryHookOptions) {
  return useQuery({
    queryKey: pmKeys.projects.list(params),
    queryFn: () => projectsApi.list(params).then((r) => r.data),
    ...options,
  })
}

export function useProjectStats() {
  return useQuery({
    queryKey: pmKeys.projects.stats(),
    queryFn: () => projectsApi.stats().then((r) => r.data.data),
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: pmKeys.projects.detail(id),
    queryFn: () => projectsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useProjectStakeholders(id: string) {
  return useQuery({
    queryKey: pmKeys.projects.stakeholders(id),
    queryFn: () => projectsApi.listStakeholders(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useProjectTemplates(params?: TemplateListParams) {
  return useQuery({
    queryKey: pmKeys.templates.list(params),
    queryFn: () => templatesApi.list(params).then((r) => r.data.data),
  })
}
