import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  ChangeRequest,
  ChangeRequestExecutionStatus,
  ChangeRequestStatus,
  ClosureChecklist,
  ClosureItem,
  ClosureSummaryRow,
  CreateChangeRequestPayload,
  Gate,
  GateDecisionStatus,
  PortfolioChangeRequest,
  PortfolioGate,
} from "../types"

/**
 * ProjectGovernance module — project-wide G0–G6 stage gates, change requests,
 * and the closure checklist. Paths mirror `bruno/PM/Governance/*`.
 */
export const governanceApi = {
  /* ── Gates ─────────────────────────────────────────────────────────── */

  /** Fixed 7-gate pipeline; first call lazy-seeds the gates. */
  listGates: (projectId: string) =>
    httpClient.get<ApiResponse<Gate[]>>(`/pm/projects/${projectId}/gates`),

  /** All gates across every project (paginated). */
  listAllGates: (params?: {
    status?: GateDecisionStatus
    page?: number
    per_page?: number
  }) =>
    httpClient.get<ApiResponse<PortfolioGate[]> & { meta: PaginationMeta }>(
      "/pm/gates",
      { params },
    ),

  submitGate: (gateId: string) =>
    httpClient.post<ApiResponse<Gate>>(`/pm/gates/${gateId}/submit`),

  approveGate: (gateId: string, notes?: string) =>
    httpClient.post<ApiResponse<Gate>>(`/pm/gates/${gateId}/approve`, {
      notes,
    }),

  rejectGate: (gateId: string, reason: string) =>
    httpClient.post<ApiResponse<Gate>>(`/pm/gates/${gateId}/reject`, {
      reason,
    }),

  requestGateInfo: (gateId: string, message: string, neededBy?: string) =>
    httpClient.post<ApiResponse<Gate>>(`/pm/gates/${gateId}/request-info`, {
      message,
      needed_by: neededBy,
    }),

  /* ── Change requests ───────────────────────────────────────────────── */

  listChangeRequests: (projectId: string) =>
    httpClient.get<ApiResponse<ChangeRequest[]>>(
      `/pm/projects/${projectId}/change-requests`,
    ),

  /** All change requests across every project (paginated). */
  listAllChangeRequests: (params?: {
    status?: ChangeRequestStatus
    type?: string
    page?: number
    per_page?: number
  }) =>
    httpClient.get<
      ApiResponse<PortfolioChangeRequest[]> & { meta: PaginationMeta }
    >("/pm/change-requests", { params }),

  createChangeRequest: (projectId: string, payload: CreateChangeRequestPayload) =>
    httpClient.post<ApiResponse<ChangeRequest>>(
      `/pm/projects/${projectId}/change-requests`,
      payload,
    ),

  submitChangeRequest: (crId: string) =>
    httpClient.post<ApiResponse<ChangeRequest>>(
      `/pm/change-requests/${crId}/submit`,
    ),

  approveChangeRequest: (crId: string, notes?: string) =>
    httpClient.post<ApiResponse<ChangeRequest>>(
      `/pm/change-requests/${crId}/approve`,
      { notes },
    ),

  rejectChangeRequest: (crId: string, reason: string) =>
    httpClient.post<ApiResponse<ChangeRequest>>(
      `/pm/change-requests/${crId}/reject`,
      { reason },
    ),

  updateChangeRequestStatus: (
    crId: string,
    status: ChangeRequestExecutionStatus,
  ) =>
    httpClient.patch<ApiResponse<ChangeRequest>>(
      `/pm/change-requests/${crId}/status`,
      { status },
    ),

  /* ── Closure ───────────────────────────────────────────────────────── */

  /** Fixed 15-item checklist; first call lazy-seeds the items. */
  getClosureChecklist: (projectId: string) =>
    httpClient.get<ApiResponse<ClosureChecklist>>(
      `/pm/projects/${projectId}/closure`,
    ),

  /** Closure progress per project (portfolio). */
  closureSummary: () =>
    httpClient.get<ApiResponse<ClosureSummaryRow[]>>("/pm/closure/summary"),

  toggleClosureItem: (itemId: string, isComplete: boolean) =>
    httpClient.patch<ApiResponse<ClosureItem>>(`/pm/closure-items/${itemId}`, {
      is_complete: isComplete,
    }),

  setTechnicallyComplete: (projectId: string) =>
    httpClient.post<ApiResponse<null>>(
      `/pm/projects/${projectId}/closure/technically-complete`,
    ),

  lockProject: (projectId: string) =>
    httpClient.post<ApiResponse<null>>(`/pm/projects/${projectId}/closure/lock`),
}
