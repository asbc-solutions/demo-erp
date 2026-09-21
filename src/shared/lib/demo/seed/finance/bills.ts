import type { Row } from "../../demo-db"

type BillSeed = [number: string, supplierId: string, supplier: string, amount: number, due: string]

/**
 * Supplier bills waiting for approval (On the go · Approve a bill). Phase 3
 * (Money out) adds the rest of the payables book to this collection.
 */
const PENDING: BillSeed[] = [
  ["BILL-2026-2000", "210101", "El Sharq Steel Works", 51_024.2, "2026-04-24"],
  ["BILL-2026-2001", "210102", "National Packaging", 144_757.35, "2026-04-12"],
  ["BILL-2026-2002", "210103", "Siemens Egypt", 44_532.68, "2026-05-09"],
  ["BILL-2026-2003", "210104", "Cairo Logistics Services", 229_859.44, "2026-03-22"],
  ["BILL-2026-2004", "210105", "El Nasr Accounting Office", 187_156.44, "2026-05-02"],
  ["BILL-2026-2005", "210101", "El Sharq Steel Works", 69_390.51, "2026-03-09"],
]

export const FIN_BILL_ROWS: Row[] = PENDING.map(([number, supplierId, supplier, amount, due]) => ({
  id: number,
  number,
  supplier_id: supplierId,
  supplier_name: supplier,
  amount,
  currency: "EGP",
  due_date: due,
  status: "pending_approval",
  approvals: 0,
}))
