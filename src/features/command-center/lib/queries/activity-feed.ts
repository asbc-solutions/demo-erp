"use client"

import { useQuery } from "@tanstack/react-query"

import { activityFeedApi } from "../api/activity-feed"
import { commandCenterKeys } from "../constants/query-keys"
import type { ActivityFeedParams } from "../types/activity-feed"

export function useActivityFeed(params?: ActivityFeedParams) {
  return useQuery({
    queryKey: commandCenterKeys.activityFeed.list(params),
    queryFn: () => activityFeedApi.list(params).then((r) => r.data),
  })
}
