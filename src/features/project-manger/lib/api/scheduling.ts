import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  Milestone,
  Baseline,
  Dependency,
  CriticalPath,
  CreateMilestonePayload,
  UpdateMilestonePayload,
  CreateBaselinePayload,
  AddDependencyPayload,
  PortfolioSchedule,
  PortfolioScheduleParams,
} from "../types"

export const schedulingApi = {
  /** Milestones across every active project (portfolio view). */
  portfolioSchedule: (params?: PortfolioScheduleParams) =>
    httpClient.get<ApiResponse<PortfolioSchedule>>("/pm/schedule", { params }),

  // ─── Milestones ─────────────────────────────────────────────────────────
  listMilestones: (projectId: string) =>
    httpClient.get<ApiResponse<Milestone[]>>(
      `/pm/projects/${projectId}/milestones`,
    ),
  createMilestone: (projectId: string, payload: CreateMilestonePayload) =>
    httpClient.post<ApiResponse<Milestone>>(
      `/pm/projects/${projectId}/milestones`,
      payload,
    ),
  getMilestone: (id: string) =>
    httpClient.get<ApiResponse<Milestone>>(`/pm/milestones/${id}`),
  updateMilestone: (id: string, payload: UpdateMilestonePayload) =>
    httpClient.put<ApiResponse<Milestone>>(`/pm/milestones/${id}`, payload),
  deleteMilestone: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/milestones/${id}`),

  // ─── Baselines ──────────────────────────────────────────────────────────
  listBaselines: (projectId: string) =>
    httpClient.get<ApiResponse<Baseline[]>>(
      `/pm/projects/${projectId}/baselines`,
    ),
  createBaseline: (projectId: string, payload: CreateBaselinePayload) =>
    httpClient.post<ApiResponse<Baseline>>(
      `/pm/projects/${projectId}/baselines`,
      payload,
    ),
  getBaseline: (id: string) =>
    httpClient.get<ApiResponse<Baseline>>(`/pm/baselines/${id}`),

  // ─── Dependencies ───────────────────────────────────────────────────────
  listDependencies: (taskId: string) =>
    httpClient.get<ApiResponse<Dependency[]>>(
      `/pm/tasks/${taskId}/dependencies`,
    ),
  addDependency: (successorTaskId: string, payload: AddDependencyPayload) =>
    httpClient.post<ApiResponse<Dependency>>(
      `/pm/tasks/${successorTaskId}/dependencies`,
      payload,
    ),
  removeDependency: (taskId: string, dependencyId: string) =>
    httpClient.delete<ApiResponse<null>>(
      `/pm/tasks/${taskId}/dependencies/${dependencyId}`,
    ),

  // ─── Critical path ──────────────────────────────────────────────────────
  criticalPath: (projectId: string) =>
    httpClient.get<ApiResponse<CriticalPath>>(
      `/pm/projects/${projectId}/critical-path`,
    ),
}
