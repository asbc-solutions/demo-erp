import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  InventoryScopeParams,
  InventorySummary,
  MaterialTab,
  ProjectMaterial,
} from "../types"

export const inventoryApi = {
  /** Summary cards. Omit `project_id` for a portfolio-wide roll-up. */
  summary: (params?: InventoryScopeParams) =>
    httpClient.get<ApiResponse<InventorySummary>>("/pm/inventory/summary", {
      params,
    }),
  /** Full material reservations for one project (per-project only). */
  listProjectMaterials: (projectId: string, tab: MaterialTab = "all") =>
    httpClient.get<ApiResponse<ProjectMaterial[]>>(
      `/pm/projects/${projectId}/materials`,
      { params: { tab } },
    ),
}
