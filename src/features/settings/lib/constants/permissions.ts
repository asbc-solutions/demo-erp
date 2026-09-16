/**
 * RBAC resource slugs for the Settings module, confirmed against the real
 * backend `.bru` docs (`bruno/Settings/**\/*.bru`) — grep for `FORBIDDEN` in
 * those files to re-verify.
 *
 * Notifications has no entry: `GET/PUT /settings/notifications/preferences`
 * carries no RBAC gate — it is self-service, per-user.
 */
export const SETTINGS_RESOURCES = {
  companyProfile: "settings.company",
  team: "settings.team",
  billing: "settings.billing",
} as const

export type SettingsResource =
  (typeof SETTINGS_RESOURCES)[keyof typeof SETTINGS_RESOURCES]
