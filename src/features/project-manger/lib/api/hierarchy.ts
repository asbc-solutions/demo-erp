import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  Timeline,
  Phase,
  Task,
  Subtask,
  Rollup,
  CreateTimelinePayload,
  CreatePhasePayload,
  CreateTaskPayload,
  CreateSubtaskPayload,
  MoveNodePayload,
  WbsIndexRow,
} from "../types"

export const hierarchyApi = {
  /** Full Project → Timeline → Phase → Task → Subtask tree. */
  getTree: (projectId: string) =>
    httpClient.get<ApiResponse<Timeline[]>>(
      `/pm/projects/${projectId}/hierarchy`,
    ),

  /** Portfolio WBS index — one row per project with node counts. */
  wbsIndex: () =>
    httpClient.get<ApiResponse<WbsIndexRow[]>>("/pm/wbs/summary"),

  // ─── Timelines ──────────────────────────────────────────────────────────
  createTimeline: (payload: CreateTimelinePayload) =>
    httpClient.post<ApiResponse<Timeline>>("/pm/timelines", payload),
  updateTimeline: (id: string, payload: Partial<CreateTimelinePayload>) =>
    httpClient.put<ApiResponse<Timeline>>(`/pm/timelines/${id}`, payload),
  deleteTimeline: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/timelines/${id}`),
  moveTimeline: (id: string, payload: MoveNodePayload) =>
    httpClient.patch<ApiResponse<Timeline>>(`/pm/timelines/${id}/move`, payload),
  timelineRollup: (id: string) =>
    httpClient.get<ApiResponse<Rollup>>(`/pm/timelines/${id}/rollup`),

  // ─── Phases ─────────────────────────────────────────────────────────────
  createPhase: (payload: CreatePhasePayload) =>
    httpClient.post<ApiResponse<Phase>>("/pm/phases", payload),
  updatePhase: (id: string, payload: Partial<CreatePhasePayload>) =>
    httpClient.put<ApiResponse<Phase>>(`/pm/phases/${id}`, payload),
  deletePhase: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/phases/${id}`),
  movePhase: (id: string, payload: MoveNodePayload) =>
    httpClient.patch<ApiResponse<Phase>>(`/pm/phases/${id}/move`, payload),
  phaseRollup: (id: string) =>
    httpClient.get<ApiResponse<Rollup>>(`/pm/phases/${id}/rollup`),

  // ─── Tasks ──────────────────────────────────────────────────────────────
  createTask: (payload: CreateTaskPayload) =>
    httpClient.post<ApiResponse<Task>>("/pm/tasks", payload),
  updateTask: (id: string, payload: Partial<CreateTaskPayload>) =>
    httpClient.put<ApiResponse<Task>>(`/pm/tasks/${id}`, payload),
  deleteTask: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/tasks/${id}`),
  moveTask: (id: string, payload: MoveNodePayload) =>
    httpClient.patch<ApiResponse<Task>>(`/pm/tasks/${id}/move`, payload),
  taskRollup: (id: string) =>
    httpClient.get<ApiResponse<Rollup>>(`/pm/tasks/${id}/rollup`),

  // ─── Subtasks ───────────────────────────────────────────────────────────
  createSubtask: (payload: CreateSubtaskPayload) =>
    httpClient.post<ApiResponse<Subtask>>("/pm/subtasks", payload),
  updateSubtask: (id: string, payload: Partial<CreateSubtaskPayload>) =>
    httpClient.put<ApiResponse<Subtask>>(`/pm/subtasks/${id}`, payload),
  deleteSubtask: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/subtasks/${id}`),
  moveSubtask: (id: string, payload: MoveNodePayload) =>
    httpClient.patch<ApiResponse<Subtask>>(`/pm/subtasks/${id}/move`, payload),
}
