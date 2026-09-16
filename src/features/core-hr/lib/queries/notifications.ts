"use client"

import { useQuery } from "@tanstack/react-query"
import { notificationsApi } from "../api/notifications"
import { coreHrKeys } from "../constants/query-keys"
import type { NotificationListParams } from "../types"

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: coreHrKeys.notifications.list(params),
    queryFn: () => notificationsApi.list(params).then((r) => r.data),
  })
}

export function useUnreadNotifications() {
  return useNotifications({ is_read: false, per_page: 20 })
}
