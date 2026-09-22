import type { Row } from "../../demo-db"

/**
 * Planning — cost centers, the FY2026 budget, analytical dimensions and
 * allocation rules.
 *
 * Journal lines carry no cost center unless a screen sets one (allocation
 * runs do), so each unassigned P&L line is spread across the centers by the
 * weights below for its account class. Every center's actuals therefore add
 * back to the ledger's P&L exactly.
 */

export type CostCenterType = "department" | "branch" | "project"

/** Account classes the spread weights are kept for. */
export type PlClass = "revenue" | "cogs" | "payroll" | "occupancy" | "admin" | "depreciation"

export function plClass(accountCode: string): PlClass | null {
  if (accountCode.startsWith("4")) return "revenue"
  if (accountCode.startsWith("5")) return "cogs"
  if (accountCode.startsWith("61")) return "payroll"
  if (accountCode.startsWith("62")) return "occupancy"
  if (accountCode.startsWith("65")) return "depreciation"
  if (accountCode.startsWith("6")) return "admin"
  return null
}

type Seed = [code: string, name: string, nameAr: string, type: CostCenterType, parent: string | null, weights: Record<PlClass, number>]

const w = (revenue: number, cogs: number, payroll: number, occupancy: number, admin: number, depreciation: number) => ({
  revenue,
  cogs,
  payroll,
  occupancy,
  admin,
  depreciation,
})

const SEEDS: Seed[] = [
  ["CC-100", "Head office", "المكتب الرئيسي", "department", null, w(0, 0, 8, 10, 12, 10)],
  ["CC-110", "Management", "الإدارة العليا", "department", "CC-100", w(0, 0, 10, 4, 8, 2)],
  ["CC-120", "Finance", "المالية", "department", "CC-100", w(0, 0, 8, 3, 10, 2)],
  ["CC-130", "IT", "تقنية المعلومات", "department", "CC-100", w(0, 0, 6, 2, 14, 8)],
  ["CC-200", "Cairo branch", "فرع القاهرة", "branch", null, w(10, 8, 6, 8, 6, 6)],
  ["CC-210", "Cairo sales", "مبيعات القاهرة", "department", "CC-200", w(22, 14, 10, 6, 8, 2)],
  ["CC-220", "Cairo warehouse", "مخزن القاهرة", "department", "CC-200", w(0, 10, 6, 10, 4, 8)],
  ["CC-230", "Cairo workshop", "ورشة القاهرة", "department", "CC-200", w(4, 12, 8, 6, 4, 16)],
  ["CC-300", "Alexandria branch", "فرع الإسكندرية", "branch", null, w(8, 6, 5, 7, 5, 5)],
  ["CC-310", "Alexandria sales", "مبيعات الإسكندرية", "department", "CC-300", w(14, 10, 7, 4, 6, 2)],
  ["CC-320", "Alexandria warehouse", "مخزن الإسكندرية", "department", "CC-300", w(0, 8, 5, 8, 3, 6)],
  ["CC-400", "Projects", "المشروعات", "project", null, w(4, 4, 4, 2, 4, 2)],
  ["CC-410", "New Capital fit-out", "تجهيزات العاصمة الإدارية", "project", "CC-400", w(10, 8, 4, 2, 3, 4)],
  ["CC-420", "Sokhna plant upgrade", "تطوير مصنع السخنة", "project", "CC-400", w(12, 10, 5, 2, 3, 6)],
  ["CC-430", "Ministry framework contract", "عقد إطاري مع الوزارة", "project", "CC-400", w(16, 10, 4, 2, 3, 1)],
]

export const FIN_COST_CENTER_ROWS: Row[] = SEEDS.map(([code, name, nameAr, type, parent, weights]) => ({
  id: code,
  code,
  name,
  name_ar: nameAr,
  type,
  parent_id: parent,
  status: "active",
  weights,
}))

/**
 * FY2026 operating budget: annual expense per top-level center, phased evenly
 * across the year. Sized so the first quarter lands just under plan.
 */
export const FIN_BUDGET_ROWS: Row[] = [
  {
    id: "BUD-2026",
    code: "BUD-2026",
    name: "FY2026 operating budget",
    year: 2026,
    scope: "all",
    status: "approved",
    approved_by: "Karim Fouad",
    approved_on: "2025-12-18",
    locked_by: null,
    locked_on: null,
    lines: [
      { cost_center_id: "CC-100", annual: 3_920_000 },
      { cost_center_id: "CC-200", annual: 14_080_000 },
      { cost_center_id: "CC-300", annual: 7_650_000 },
      { cost_center_id: "CC-400", annual: 9_350_000 },
    ],
  },
]

export const FIN_DIMENSION_ROWS: Row[] = [
  { id: "D1", code: "D1", name: "Product line", name_ar: "خط الإنتاج", values: ["Industrial valves", "Pumps", "Spare parts", "Services"], postings: 184, required: false },
  { id: "D2", code: "D2", name: "Channel", name_ar: "قناة البيع", values: ["Direct", "Distributor", "Tender", "Online"], postings: 121, required: false },
  { id: "D3", code: "D3", name: "Contract", name_ar: "العقد", values: ["MOH-2026-04", "NUCA-2025-11", "Private"], postings: 63, required: true },
]

export const ALLOCATION_BASES = [
  { value: "floor_area", label: "Floor area" },
  { value: "headcount", label: "Headcount" },
  { value: "revenue_share", label: "Revenue share" },
  { value: "fixed", label: "Fixed percentage" },
]

export const FIN_ALLOCATION_RULE_ROWS: Row[] = [
  {
    id: "AR-1",
    code: "AR-1",
    name: "Rent by floor area",
    basis: "floor_area",
    source_accounts: ["620101"],
    targets: [
      { cost_center_id: "CC-110", weight: 20 },
      { cost_center_id: "CC-210", weight: 35 },
      { cost_center_id: "CC-220", weight: 45 },
    ],
    active: true,
    runs: [],
  },
  {
    id: "AR-2",
    code: "AR-2",
    name: "IT cost by headcount",
    basis: "headcount",
    source_accounts: ["640106", "640401"],
    targets: [
      { cost_center_id: "CC-110", weight: 15 },
      { cost_center_id: "CC-120", weight: 10 },
      { cost_center_id: "CC-210", weight: 40 },
      { cost_center_id: "CC-310", weight: 35 },
    ],
    active: true,
    runs: [],
  },
  {
    id: "AR-3",
    code: "AR-3",
    name: "Management overhead by revenue",
    basis: "revenue_share",
    source_accounts: ["610101"],
    targets: [
      { cost_center_id: "CC-200", weight: 60 },
      { cost_center_id: "CC-300", weight: 40 },
    ],
    active: false,
    runs: [],
  },
]
