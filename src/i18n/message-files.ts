/**
 * One JSON file per area under `messages/<locale>/`. Each file owns its own
 * top-level namespaces; namespaces must be unique across files (checked by
 * `npm run i18n:check`). Add a file here AND in `global.d.ts`.
 */
export const MESSAGE_FILES = [
  "common",
  "shell",
  "onboarding",
  "command-center",
  "compliance",
  "integrations",
  "marketing-tracking",
  "operations",
  "settings",
  "sales",
  "hr-people",
  "hr-workflows",
  "finance-operations",
  "finance-accounting",
  "projects-portfolio",
  "projects-delivery",
] as const
