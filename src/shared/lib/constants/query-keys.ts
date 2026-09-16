export const permissionsKeys = {
  all: ["permissions"] as const,
  me: () => [...permissionsKeys.all, "me"] as const,
}
