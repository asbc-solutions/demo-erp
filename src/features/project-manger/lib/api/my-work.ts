import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  MyActivityItem,
  MyCapacity,
  MyMilestone,
  MyMilestonesParams,
  MyPriority,
  MyProjectItem,
  MyProjectsParams,
  MyProjectsStats,
  MySummary,
  WeeklyDigestPayload,
  WeeklyDigestResult,
} from "../types"

/**
 * "My Work" endpoints — everything is scoped to the employee resolved from the
 * bearer token, so none of these take an employee id.
 */
export const myWorkApi = {
  summary: () => httpClient.get<ApiResponse<MySummary>>("/pm/me/summary"),

  priorities: (date?: string) =>
    httpClient.get<ApiResponse<MyPriority[]>>("/pm/me/priorities", {
      params: date ? { date } : undefined,
    }),

  capacity: (weekStart?: string) =>
    httpClient.get<ApiResponse<MyCapacity>>("/pm/me/capacity", {
      params: weekStart ? { week_start: weekStart } : undefined,
    }),

  projects: (params?: MyProjectsParams) =>
    httpClient.get<ApiResponse<MyProjectItem[]>>("/pm/me/projects", { params }),

  activity: (limit?: number) =>
    httpClient.get<ApiResponse<MyActivityItem[]>>("/pm/me/activity", {
      params: limit ? { limit } : undefined,
    }),

  projectsStats: () =>
    httpClient.get<ApiResponse<MyProjectsStats>>("/pm/me/projects/stats"),

  milestones: (params?: MyMilestonesParams) =>
    httpClient.get<ApiResponse<MyMilestone[]>>("/pm/me/milestones", { params }),

  sendWeeklyDigest: (payload: WeeklyDigestPayload) =>
    httpClient.post<ApiResponse<WeeklyDigestResult>>(
      "/pm/reports/weekly-digest",
      payload,
    ),
}
