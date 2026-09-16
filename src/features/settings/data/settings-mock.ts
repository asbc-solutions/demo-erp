export type SettingsTab = "profile" | "team" | "billing" | "notifications" | "roles"

export const SETTINGS_TABS: ReadonlyArray<{ id: SettingsTab; label: string }> = [
  { id: "profile", label: "Company Profile" },
  { id: "team", label: "Team & Permissions" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
]
