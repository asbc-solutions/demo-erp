import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type { Notification, NotificationListParams } from "../types"

type NotificationListResponse = Omit<ApiResponse<Notification[]>, "meta"> & {
  meta: PaginationMeta
}

export const notificationsApi = {
  list: (params?: NotificationListParams) =>
    httpClient.get<NotificationListResponse>("/notifications", { params }),

  markRead: (notificationId: string) =>
    httpClient.put<ApiResponse<null>>(
      `/notifications/${notificationId}/read`
    ),

  markAllRead: () =>
    httpClient.put<ApiResponse<null>>("/notifications/read-all"),
}
