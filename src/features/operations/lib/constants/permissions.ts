export const OPERATIONS_RESOURCES = {
  projects: "operations.projects",
  tasks: "operations.tasks",
  vendors: "operations.vendors",
} as const

export type OperationsResource = (typeof OPERATIONS_RESOURCES)[keyof typeof OPERATIONS_RESOURCES]
