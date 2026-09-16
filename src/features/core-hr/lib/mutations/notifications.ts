"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "../api/notifications"
import { coreHrKeys } from "../constants/query-keys"

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markRead(notificationId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreHrKeys.notifications.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreHrKeys.notifications.all })
    },
  })
}
