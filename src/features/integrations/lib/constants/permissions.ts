/**
 * ⚠️ The RBAC resource slug for this whole feature is `settings.integrations`.
 * Do NOT use the singular `integration` — that slug is reserved for the
 * unrelated CrossModuleIntegration resource (an internal HR sync-log), and
 * granting it by mistake is a documented footgun (see List Integrations.bru docs).
 */
export const INTEGRATIONS_RESOURCES = {
  integrations: "settings.integrations",
} as const

export type IntegrationsResource =
  (typeof INTEGRATIONS_RESOURCES)[keyof typeof INTEGRATIONS_RESOURCES]
