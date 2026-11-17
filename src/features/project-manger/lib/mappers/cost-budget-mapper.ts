import type { ProgressColor } from "../../all-project/data/all-projects-data"
import type {
  CostMixItem,
  CostPlan,
  EvmMetrics,
  WaterfallItem,
} from "../types"

/** Compact money formatting: 2_840_000 → "$2.84M", 648_000 → "$648K". */
export function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`
  return `${sign}$${Math.round(abs)}`
}

/** Cost types the UI has a translated label for (`ProjectsShared.costType`). */
export const COST_TYPES = [
  "labor",
  "material",
  "equipment",
  "overhead",
  "other",
] as const

export type KnownCostType = (typeof COST_TYPES)[number]

export function isKnownCostType(value: string): value is KnownCostType {
  return (COST_TYPES as readonly string[]).includes(value)
}

export const COST_TYPE_LABEL: Record<string, string> = {
  labor: "Labor",
  material: "Materials",
  equipment: "Equipment",
  overhead: "Overhead",
  other: "Other",
}

export const COST_TYPE_COLOR: Record<string, string> = {
  labor: "var(--brand-primary)",
  material: "var(--brand-success)",
  equipment: "var(--brand-info)",
  overhead: "var(--brand-warning)",
  other: "var(--content-tertiary)",
}

export type CostMixSlice = {
  /** Backend `cost_type` — translate known ones via `isKnownCostType`. */
  key: string
  label: string
  value: string
  raw: number
  color: string
}

/**
 * Optional label override for a cost type, e.g.
 * `(key) => isKnownCostType(key) ? t(\`costType.${key}\`) : undefined`.
 * Falls back to the API label / English `COST_TYPE_LABEL`.
 */
export type CostTypeLabeler = (costType: string) => string | undefined

/** Group cost-plan line items by cost type for the donut chart. */
export function buildCostMix(
  plans: CostPlan[],
  labelFor?: CostTypeLabeler,
): {
  slices: CostMixSlice[]
  total: number
} {
  const totals = new Map<string, number>()
  for (const p of plans) {
    totals.set(
      p.cost_type,
      (totals.get(p.cost_type) ?? 0) + Number(p.planned_amount),
    )
  }
  const slices = [...totals.entries()].map(([type, raw]) => ({
    key: type,
    label: labelFor?.(type) ?? COST_TYPE_LABEL[type] ?? type,
    value: formatMoney(raw),
    raw,
    color: COST_TYPE_COLOR[type] ?? "var(--content-tertiary)",
  }))
  return { slices, total: slices.reduce((a, s) => a + s.raw, 0) }
}

export type EvmMetricId = "pv" | "ev" | "ac" | "cpi" | "spi" | "eac" | "etc"

export type EvmMetricCard = {
  id: EvmMetricId
  label: string
  value: string
  sub: string
  tone: "default" | "warning" | "danger"
}

const indexTone = (v: number | null | undefined): EvmMetricCard["tone"] =>
  v == null ? "default" : v < 0.9 ? "danger" : v < 1.0 ? "warning" : "default"

/** Format a unitless performance index (CPI/SPI), tolerating null/undefined. */
const formatIndex = (v: number | null | undefined): string =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(2)

/* ------------------------------------------------------------------ */
/* Portfolio dashboard helpers (cost-mix + waterfall + labels)         */
/* ------------------------------------------------------------------ */

/** Turn a snake_case backend label into "Title Case" (or "—" when empty). */
export function humanizeLabel(value: string | null | undefined): string {
  if (!value) return "—"
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Cost mix from the `/cost-mix` endpoint items (already grouped by type). */
export function buildCostMixSlices(
  items: CostMixItem[] | undefined,
  labelFor?: CostTypeLabeler,
): {
  slices: CostMixSlice[]
  total: number
} {
  if (!items) return { slices: [], total: 0 }
  const slices = items
    .filter((i) => Number(i.amount) > 0)
    .map((i) => ({
      key: i.cost_type,
      label:
        labelFor?.(i.cost_type) ??
        i.cost_type_label ??
        COST_TYPE_LABEL[i.cost_type] ??
        i.cost_type,
      value: formatMoney(Number(i.amount)),
      raw: Number(i.amount),
      color: COST_TYPE_COLOR[i.cost_type] ?? "var(--content-tertiary)",
    }))
  return { slices, total: slices.reduce((a, s) => a + s.raw, 0) }
}

export type WaterfallBar = {
  id: string
  label: string
  meta: string
  pct: number
  color: ProgressColor
}

function consumedColor(pct: number): ProgressColor {
  if (pct > 100) return "red"
  if (pct >= 85) return "amber"
  return "emerald"
}

/** Top-level project rows → progress bars (spent vs planned). */
export function buildWaterfallBars(
  items: WaterfallItem[] | undefined,
): WaterfallBar[] {
  if (!items) return []
  return items
    .filter((i) => i.node_type === "project")
    .slice(0, 8)
    .map((i) => {
      const planned = Number(i.planned_amount)
      const spent = Number(i.committed_amount) + Number(i.actual_amount)
      const pct = planned > 0 ? (spent / planned) * 100 : 0
      return {
        id: i.code,
        label: i.name,
        meta: `${formatMoney(spent)} / ${formatMoney(planned)}`,
        pct: Math.min(pct, 100),
        color: consumedColor(pct),
      }
    })
}

export type BudgetCostRow = {
  id: string
  element: string
  code: string
  typeLabel: string
  planned: string
  committed: string
  actual: string
  variance: string
  varianceTone: "danger" | "success" | "neutral"
  consumed: number
}

/** Flat WBS rows → cost-detail table (variance = planned − spent). */
export function buildCostDetail(
  items: WaterfallItem[] | undefined,
): BudgetCostRow[] {
  if (!items) return []
  return items.slice(0, 100).map((i, index) => {
    const planned = Number(i.planned_amount)
    const spent = Number(i.committed_amount) + Number(i.actual_amount)
    const variance = Number(i.variance)
    const consumed = planned > 0 ? Math.round((spent / planned) * 100) : 0
    return {
      id: `${i.code}-${index}`,
      element: i.name,
      code: i.code,
      typeLabel: humanizeLabel(i.node_type),
      planned: formatMoney(planned),
      committed: formatMoney(Number(i.committed_amount)),
      actual: formatMoney(Number(i.actual_amount)),
      variance: formatMoney(variance),
      varianceTone: variance < 0 ? "danger" : variance > 0 ? "success" : "neutral",
      consumed,
    }
  })
}

/** Map the EVM payload to the 7 metric tiles (PV, EV, AC, CPI, SPI, EAC, ETC). */
export function evmMetricCards(evm: EvmMetrics): EvmMetricCard[] {
  const eacOverBac =
    evm.eac != null && evm.bac != null && evm.eac > evm.bac ? "danger" : "default"
  return [
    { id: "pv", label: "PV", value: formatMoney(evm.pv), sub: "Planned Value", tone: "default" },
    { id: "ev", label: "EV", value: formatMoney(evm.ev), sub: "Earned Value", tone: "default" },
    { id: "ac", label: "AC", value: formatMoney(evm.ac), sub: "Actual Cost", tone: "default" },
    { id: "cpi", label: "CPI", value: formatIndex(evm.cpi), sub: "Cost Index", tone: indexTone(evm.cpi) },
    { id: "spi", label: "SPI", value: formatIndex(evm.spi), sub: "Schedule Index", tone: indexTone(evm.spi) },
    { id: "eac", label: "EAC", value: formatMoney(evm.eac), sub: "Est. at Completion", tone: eacOverBac },
    { id: "etc", label: "ETC", value: formatMoney(evm.etc), sub: "Est. to Complete", tone: "default" },
  ]
}
