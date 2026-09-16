export type NotificationPreference = {
  key: string
  title: string
  description: string
  enabled: boolean
}

export type SaveNotificationPreferencesPayload = {
  preferences: { key: string; enabled: boolean }[]
}
