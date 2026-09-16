import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  ResourcePoolItem,
  ResourceProfile,
  ResourceCapacity,
  ProjectUtilizationRow,
  ResourceAssignment,
  ResourceListParams,
  CreateResourceProfilePayload,
  UpdateResourceProfilePayload,
  CreateAssignmentPayload,
  ResourcePlannerSummary,
  ResourcePeriodParams,
  ResourceHeatmapRow,
} from "../types"

export const resourcesApi = {
  // ─── Resource pool / profiles ─────────────────────────────────────────────
  list: (params?: ResourceListParams) =>
    httpClient.get<ApiResponse<ResourcePoolItem[]> & { meta: PaginationMeta }>(
      "/pm/resources",
      { params },
    ),
  getProfile: (employeeId: string) =>
    httpClient.get<ApiResponse<ResourceProfile>>(`/pm/resources/${employeeId}`),
  createProfile: (payload: CreateResourceProfilePayload) =>
    httpClient.post<ApiResponse<ResourceProfile>>("/pm/resources", payload),
  updateProfile: (employeeId: string, payload: UpdateResourceProfilePayload) =>
    httpClient.put<ApiResponse<ResourceProfile>>(
      `/pm/resources/${employeeId}`,
      payload,
    ),

  // ─── Portfolio planner (summary + heatmap) ────────────────────────────────
  /** Summary cards. Omit `project_id` for a portfolio-wide roll-up. */
  summary: (params?: ResourcePeriodParams) =>
    httpClient.get<ApiResponse<ResourcePlannerSummary>>(
      "/pm/resources/summary",
      { params },
    ),
  /** Weekly allocation heatmap. Omit `project_id` for all resources. */
  heatmap: (params: ResourcePeriodParams) =>
    httpClient.get<ApiResponse<ResourceHeatmapRow[]>>("/pm/resources/heatmap", {
      params,
    }),

  // ─── Capacity / utilization ───────────────────────────────────────────────
  capacity: (employeeId: string, from: string, to: string) =>
    httpClient.get<ApiResponse<ResourceCapacity>>(
      `/pm/resources/${employeeId}/capacity`,
      { params: { from, to } },
    ),
  projectUtilization: (projectId: string) =>
    httpClient.get<ApiResponse<ProjectUtilizationRow[]>>(
      `/pm/projects/${projectId}/utilization`,
    ),

  // ─── Assignments ──────────────────────────────────────────────────────────
  createAssignment: (payload: CreateAssignmentPayload) =>
    httpClient.post<ApiResponse<ResourceAssignment>>("/pm/assignments", payload),
}
