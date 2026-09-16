import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  NotificationPreference,
  SaveNotificationPreferencesPayload,
} from "../types/notifications"

export const notificationsApi = {
  // Self-service, no RBAC gate — every authenticated user manages only their own rows.
  get: () =>
    httpClient.get<ApiResponse<NotificationPreference[]>>(
      "/settings/notifications/preferences",
    ),

  /** Bulk save — matches the single "Save Preferences" button in the UI. */
  save: (payload: SaveNotificationPreferencesPayload) =>
    httpClient.put<ApiResponse<NotificationPreference[]>>(
      "/settings/notifications/preferences",
      payload,
    ),
}
