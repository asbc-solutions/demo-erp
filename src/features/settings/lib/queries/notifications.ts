"use client"

import { useQuery } from "@tanstack/react-query"

import { notificationsApi } from "../api/notifications"
import { settingsKeys } from "../constants/query-keys"

export function useNotificationPreferences() {
  return useQuery({
    queryKey: settingsKeys.notifications.preferences(),
    queryFn: () => notificationsApi.get().then((r) => r.data.data),
  })
}
