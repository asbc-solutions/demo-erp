import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  TaskListItem,
  TaskAssignee,
  TimeLog,
  EmployeeWorkload,
  TaskListParams,
  UpdateTaskStatusPayload,
  AddTaskAssigneePayload,
  LogTimePayload,
} from "../types"

/**
 * The entire project-management module is mounted under `/pm` on the backend.
 * Paths here mirror `bruno/PM/Tasks/*`.
 */
export const tasksApi = {
  list: (params?: TaskListParams) =>
    httpClient.get<ApiResponse<TaskListItem[]> & { meta: PaginationMeta }>(
      "/pm/tasks",
      { params },
    ),

  updateStatus: (taskId: string, payload: UpdateTaskStatusPayload) =>
    httpClient.patch<ApiResponse<null>>(`/pm/tasks/${taskId}/status`, payload),

  listAssignees: (taskId: string) =>
    httpClient.get<ApiResponse<TaskAssignee[]>>(`/pm/tasks/${taskId}/assignees`),

  addAssignee: (taskId: string, payload: AddTaskAssigneePayload) =>
    httpClient.post<ApiResponse<TaskAssignee>>(
      `/pm/tasks/${taskId}/assignees`,
      payload,
    ),

  removeAssignee: (taskId: string, assigneeId: string) =>
    httpClient.delete<ApiResponse<null>>(
      `/pm/tasks/${taskId}/assignees/${assigneeId}`,
    ),

  logTime: (taskId: string, payload: LogTimePayload) =>
    httpClient.post<ApiResponse<TimeLog>>(`/pm/tasks/${taskId}/time-logs`, payload),

  employeeWorkload: (employeeId: string) =>
    httpClient.get<ApiResponse<EmployeeWorkload>>(
      `/pm/employees/${employeeId}/workload`,
    ),
}
