"use client"

import { useQuery } from "@tanstack/react-query"
import { collaborationApi } from "../api/collaboration"
import { pmKeys } from "../constants/query-keys"
import type { ActivityFeedParams, MessageListParams } from "../types"

/** Messages linked to a single hierarchy node (paginated envelope). */
export function useNodeMessages(nodeId: string, params?: MessageListParams) {
  return useQuery({
    queryKey: pmKeys.collaboration.messages(nodeId, params),
    queryFn: () =>
      collaborationApi.listForNode(nodeId, params).then((r) => r.data),
    enabled: !!nodeId,
  })
}

/** Project-wide activity feed across all nodes. */
export function useActivityFeed(projectId: string, params?: ActivityFeedParams) {
  return useQuery({
    queryKey: pmKeys.collaboration.activity(projectId, params),
    queryFn: () =>
      collaborationApi.activityFeed(projectId, params).then((r) => r.data),
    enabled: !!projectId,
  })
}

/** Full-text search over a project's messages (min 2 chars). */
export function useMessageSearch(projectId: string, q: string) {
  return useQuery({
    queryKey: pmKeys.collaboration.search(projectId, q),
    queryFn: () =>
      collaborationApi.search({ project_id: projectId, q }).then((r) => r.data),
    enabled: !!projectId && q.trim().length >= 2,
  })
}

/** Team feed across every project (portfolio view). */
export function usePortfolioActivity(limit?: number) {
  return useQuery({
    queryKey: pmKeys.collaboration.portfolioActivity(limit),
    queryFn: () =>
      collaborationApi.portfolioActivity(limit).then((r) => r.data.data),
  })
}

/** Chat context: project members, can_post, block reason. */
export function useCollaborationContext(projectId?: string) {
  return useQuery({
    queryKey: pmKeys.collaboration.context(projectId),
    queryFn: () => collaborationApi.context(projectId).then((r) => r.data.data),
  })
}
