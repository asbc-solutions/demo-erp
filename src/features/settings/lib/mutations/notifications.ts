"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { notificationsApi } from "../api/notifications"
import { settingsKeys } from "../constants/query-keys"
import type { SaveNotificationPreferencesPayload } from "../types/notifications"

export function useSaveNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveNotificationPreferencesPayload) =>
      notificationsApi.save(payload).then((r) => r.data.data),
    onSuccess: (data) =>
      qc.setQueryData(settingsKeys.notifications.preferences(), data),
  })
}
