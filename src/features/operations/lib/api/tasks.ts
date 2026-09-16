import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CreateTaskPayload,
  TaskListItem,
  TaskListParams,
  UpdateTaskPayload,
} from "../types"

export const tasksApi = {
  list: (params?: TaskListParams) =>
    httpClient.get<ApiResponse<TaskListItem[]>>("/operations/tasks", { params }),

  create: (payload: CreateTaskPayload) =>
    httpClient.post<ApiResponse<TaskListItem>>("/operations/tasks", payload),

  /** Also handles the `completed` checkbox shorthand — see UpdateTaskPayload. */
  update: (id: string, payload: UpdateTaskPayload) =>
    httpClient.patch<ApiResponse<TaskListItem>>(`/operations/tasks/${id}`, payload),
}
