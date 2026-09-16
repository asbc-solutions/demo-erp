import type { ProjectListParams, TaskListParams, VendorListParams } from "../types"

export const operationsKeys = {
  projects: {
    all: ["operations", "projects"] as const,
    list: (params?: ProjectListParams) =>
      [...operationsKeys.projects.all, "list", params] as const,
    kpis: () => [...operationsKeys.projects.all, "kpis"] as const,
  },

  tasks: {
    all: ["operations", "tasks"] as const,
    list: (params?: TaskListParams) =>
      [...operationsKeys.tasks.all, "list", params] as const,
  },

  vendors: {
    all: ["operations", "vendors"] as const,
    list: (params?: VendorListParams) =>
      [...operationsKeys.vendors.all, "list", params] as const,
    kpis: () => [...operationsKeys.vendors.all, "kpis"] as const,
  },
}
