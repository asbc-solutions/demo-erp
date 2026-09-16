import type { TeamListParams } from "../types/team"

export const settingsKeys = {
  roles: {
    all: ["settings", "roles"] as const,
    list: () => [...settingsKeys.roles.all, "list"] as const,
    permissions: (roleId: string) =>
      [...settingsKeys.roles.all, roleId, "permissions"] as const,
  },
  companyProfile: {
    all: ["settings", "company-profile"] as const,
    detail: () => [...settingsKeys.companyProfile.all, "detail"] as const,
  },
  team: {
    all: ["settings", "team"] as const,
    list: (params?: TeamListParams) =>
      [...settingsKeys.team.all, "list", params ?? {}] as const,
    assignableRoles: () =>
      [...settingsKeys.team.all, "assignable-roles"] as const,
  },
  billing: {
    all: ["settings", "billing"] as const,
    overview: () => [...settingsKeys.billing.all, "overview"] as const,
    invoices: (status?: string) =>
      [...settingsKeys.billing.all, "invoices", status ?? "all"] as const,
  },
  notifications: {
    all: ["settings", "notifications"] as const,
    preferences: () => [...settingsKeys.notifications.all, "preferences"] as const,
  },
}
