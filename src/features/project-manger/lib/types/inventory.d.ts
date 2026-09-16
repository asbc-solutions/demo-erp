/* ------------------------------------------------------------------ */
/* Inventory & materials                                               */
/* ------------------------------------------------------------------ */

export type MaterialTab = "all" | "reserved" | "issued" | "pending_procurement"

export type ReservationStatus =
  | "reserved"
  | "issued"
  | "pending_procurement"
  | "cancelled"

/** Portfolio-wide when `project_id` is omitted. */
export type InventorySummary = {
  project_id: string | null
  currency_code: string
  total_count: number
  reserved_count: number
  issued_count: number
  pending_procurement_count: number
  cancelled_count: number
  late_sku_count: number
  reserved_value: number
  issued_value: number
  auc_balance: number
  capital_project_count: number
}

export type ProjectMaterial = {
  reservation_id: string
  project_id: string
  node_id: string
  node_type: string
  wbs_code: string
  material_code: string
  material_name: string
  unit_of_measure: string
  required_qty: number
  reserved_qty: number
  issued_qty: number
  remaining_qty: number
  unit_cost: number
  total_cost: number
  currency_code: string
  status: ReservationStatus
  status_label: string
  po_number: string | null
  expected_receipt_date: string | null
  location: string | null
  stock_type: string
  is_awaiting_receipt: boolean
}

export type InventoryScopeParams = { project_id?: string }
