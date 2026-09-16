import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  ActivityEvent,
  ActivityFeedParams,
  CollaborationContext,
  Message,
  MessageListParams,
  MessageSearchParams,
  PortfolioActivityItem,
  SendMessagePayload,
} from "../types"

/** Node-scoped collaboration. Paths mirror `bruno/PM/Collaboration/*`. */
export const collaborationApi = {
  listForNode: (nodeId: string, params?: MessageListParams) =>
    httpClient.get<ApiResponse<Message[]> & { meta: PaginationMeta }>(
      `/pm/nodes/${nodeId}/messages`,
      { params },
    ),

  send: (nodeId: string, payload: SendMessagePayload) =>
    httpClient.post<ApiResponse<Message>>(
      `/pm/nodes/${nodeId}/messages`,
      payload,
    ),

  remove: (messageId: string) =>
    httpClient.delete<ApiResponse<null>>(`/pm/messages/${messageId}`),

  activityFeed: (projectId: string, params?: ActivityFeedParams) =>
    httpClient.get<ApiResponse<ActivityEvent[]> & { meta: PaginationMeta }>(
      `/pm/projects/${projectId}/messages/activity`,
      { params },
    ),

  search: (params: MessageSearchParams) =>
    httpClient.get<ApiResponse<Message[]> & { meta: PaginationMeta }>(
      `/pm/search/messages`,
      { params },
    ),

  /** Team feed across every project (portfolio view). */
  portfolioActivity: (limit?: number) =>
    httpClient.get<ApiResponse<PortfolioActivityItem[]>>("/pm/activity", {
      params: limit ? { limit } : undefined,
    }),

  /** Chat-page context: members + can_post (+ recent activity). */
  context: (projectId?: string) =>
    httpClient.get<ApiResponse<CollaborationContext>>(
      "/pm/collaboration/context",
      { params: projectId ? { project_id: projectId } : undefined },
    ),
}
