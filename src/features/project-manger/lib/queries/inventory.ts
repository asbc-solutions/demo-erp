"use client"

import { useQuery } from "@tanstack/react-query"
import { inventoryApi } from "../api/inventory"
import { pmKeys } from "../constants/query-keys"
import type { InventoryScopeParams, MaterialTab } from "../types"

/** Inventory summary cards. Omit `project_id` for a portfolio-wide roll-up. */
export function useInventorySummary(params?: InventoryScopeParams) {
  return useQuery({
    queryKey: pmKeys.inventory.summary(params),
    queryFn: () => inventoryApi.summary(params).then((r) => r.data.data),
  })
}

/** Material reservations for one project (per-project only). */
export function useProjectMaterials(
  projectId: string,
  tab: MaterialTab = "all",
) {
  return useQuery({
    queryKey: pmKeys.inventory.materials(projectId, tab),
    queryFn: () =>
      inventoryApi.listProjectMaterials(projectId, tab).then((r) => r.data.data),
    enabled: !!projectId,
  })
}
