import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type { ActivityFeedItem, ActivityFeedParams } from "../types/activity-feed"

export const activityFeedApi = {
  list: (params?: ActivityFeedParams) =>
    httpClient.get<ApiResponse<ActivityFeedItem[]> & { meta: PaginationMeta }>(
      "/command-center/activity-feed",
      { params },
    ),
}
