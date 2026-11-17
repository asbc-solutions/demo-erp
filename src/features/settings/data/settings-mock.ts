export type SettingsTab = "profile" | "team" | "billing" | "notifications" | "roles"

/** `labelKey` is a `SettingsView` message key. */
export const SETTINGS_TABS = [
  { id: "profile", labelKey: "tabProfile" },
  { id: "team", labelKey: "tabTeam" },
  { id: "roles", labelKey: "tabRoles" },
  { id: "billing", labelKey: "tabBilling" },
  { id: "notifications", labelKey: "tabNotifications" },
] as const satisfies ReadonlyArray<{ id: SettingsTab; labelKey: string }>
