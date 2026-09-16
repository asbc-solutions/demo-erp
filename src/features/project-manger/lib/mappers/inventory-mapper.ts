import type { InventorySummary, ProjectMaterial, ReservationStatus } from "../types"
import { formatMoney } from "./cost-budget-mapper"

/* ------------------------------------------------------------------ */
/* Summary cards                                                       */
/* ------------------------------------------------------------------ */

export type InventoryStat = {
  id: string
  label: string
  value: string
  caption: string
  icon: "package" | "check" | "flag" | "dollar"
  accent: "indigo" | "emerald" | "amber" | "violet"
}

export function buildInventoryStats(
  summary: InventorySummary | undefined,
): InventoryStat[] {
  return [
    {
      id: "total",
      label: "Total Reservations",
      value: summary ? String(summary.total_count) : "—",
      caption: summary
        ? `${summary.reserved_count} reserved · ${summary.issued_count} issued`
        : "",
      icon: "package",
      accent: "indigo",
    },
    {
      id: "reserved-value",
      label: "Reserved Value",
      value: summary ? formatMoney(summary.reserved_value) : "—",
      caption: "committed stock",
      icon: "dollar",
      accent: "emerald",
    },
    {
      id: "issued-value",
      label: "Issued Value",
      value: summary ? formatMoney(summary.issued_value) : "—",
      caption: "goods consumed",
      icon: "check",
      accent: "violet",
    },
    {
      id: "pending",
      label: "Pending Procurement",
      value: summary ? String(summary.pending_procurement_count) : "—",
      caption: summary ? `${summary.late_sku_count} late` : "",
      icon: "flag",
      accent: "amber",
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Material rows                                                       */
/* ------------------------------------------------------------------ */

type BadgeTone = "info" | "success" | "warning" | "neutral"

const STATUS_META: Record<
  ReservationStatus,
  { label: string; tone: BadgeTone }
> = {
  reserved: { label: "Reserved", tone: "info" },
  issued: { label: "Issued", tone: "success" },
  pending_procurement: { label: "Pending", tone: "warning" },
  cancelled: { label: "Cancelled", tone: "neutral" },
}

export type MaterialRow = {
  id: string
  code: string
  name: string
  wbs: string
  reserved: string
  issued: string
  stockType: string
  isProjectStock: boolean
  location: string
  unitCost: string
  statusLabel: string
  statusTone: BadgeTone
}

export function mapMaterialRow(item: ProjectMaterial): MaterialRow {
  const status = STATUS_META[item.status] ?? {
    label: item.status_label,
    tone: "neutral" as BadgeTone,
  }
  return {
    id: item.reservation_id,
    code: item.material_code,
    name: item.material_name,
    wbs: item.wbs_code,
    reserved: `${item.reserved_qty} ${item.unit_of_measure}`,
    issued: `${item.issued_qty} ${item.unit_of_measure}`,
    stockType: item.stock_type,
    isProjectStock: item.stock_type === "project",
    location: item.location ?? "—",
    unitCost: formatMoney(item.unit_cost),
    statusLabel: status.label,
    statusTone: status.tone,
  }
}
