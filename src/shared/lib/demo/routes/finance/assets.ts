import { collection, createRow, findRow, type Row } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import { SALVAGE_SHARE, monthlyCharge } from "../../seed/finance/assets"
import { FIN_CLOSING_PERIOD, FIN_TODAY } from "../../seed/finance/calendar"
import { assetCategory, assets, depreciationRun, presentAsset, runSummary } from "./assets-model"
import { periodProblem } from "./close-model"
import { FIN_COLLECTIONS } from "./collections"
import { createJournal, type JournalLine } from "./ledger-model"

/**
 * 08 · Assets — the register, asset lifecycle (add, edit, dispose, write
 * off), the monthly depreciation run and asset categories. Every change to
 * cost or accumulated depreciation posts a journal, so the register and the
 * PP&E accounts stay tied.
 */

const r2 = (value: number) => Math.round(value * 100) / 100
const refuse = (message: string) => ({ status: 422, data: { message } })

const GAIN_ON_DISPOSAL = "420104"
const LOSS_ON_DISPOSAL = "650102"
const DEPRECIATION_EXPENSE = "650101"

function monthEnd(period: string): string {
  const [year, month] = period.split("-").map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

/** Remove cost and accumulated depreciation; the difference to the proceeds is a gain or loss. */
function retire(asset: Row, kind: "disposed" | "written_off", date: string, proceeds: number, treasury: Row | null, reason: string): Row {
  const meta = assetCategory(asset.category_id) as Row
  const cost = Number(asset.cost)
  const accumulated = Number(asset.accumulated)
  const nbv = r2(cost - accumulated)
  const result = r2(proceeds - nbv)
  const lines: JournalLine[] = [
    { account_code: String(meta.accum_account), description: `Accumulated depreciation — ${String(asset.number)}`, debit: accumulated, credit: 0 },
    { account_code: String(meta.cost_account), description: `Cost — ${String(asset.number)}`, debit: 0, credit: cost },
  ]
  if (proceeds > 0 && treasury) lines.push({ account_code: String(treasury.account_code), description: "Disposal proceeds", debit: proceeds, credit: 0 })
  if (result > 0) lines.push({ account_code: GAIN_ON_DISPOSAL, description: "Gain on disposal", debit: 0, credit: result })
  if (result < 0) lines.push({ account_code: LOSS_ON_DISPOSAL, description: kind === "disposed" ? "Loss on disposal" : "Write-off", debit: -result, credit: 0 })
  const journal = createJournal({
    date,
    description: `${kind === "disposed" ? "Disposal" : "Write-off"} of ${String(asset.number)} — ${String(asset.name)}`,
    lines: lines.filter((row) => row.debit > 0 || row.credit > 0),
    status: "posted",
    origin: "auto",
    source: String(asset.number),
    source_type: "asset",
  })
  Object.assign(asset, {
    status: kind,
    retired_on: date,
    retire_reason: reason || null,
    history: [
      ...((asset.history as Row[]) ?? []),
      { date, event: kind === "disposed" ? "Disposed" : "Written off", amount: kind === "disposed" ? proceeds : -nbv, entry: journal.number },
    ],
  })
  return journal
}

export const financeAssetRoutes: DemoRoute[] = [
  route("get", "/finance/assets", () => {
    const items = assets().map(presentAsset)
    const active = items.filter((row) => row.status === "in_service")
    const cost = r2(active.reduce((sum, row) => sum + Number(row.cost), 0))
    const accumulated = r2(active.reduce((sum, row) => sum + Number(row.accumulated), 0))
    return {
      data: {
        items,
        cost,
        accumulated,
        nbv: r2(cost - accumulated),
        in_service: active.length,
        retired: items.length - active.length,
        categories: collection(FIN_COLLECTIONS.assetCategories).map((row) => ({ id: row.id, name: row.name })),
      },
    }
  }),

  route("get", "/finance/assets/categories", () => {
    const items = collection(FIN_COLLECTIONS.assetCategories).map((row) => {
      const members = assets().filter((asset) => asset.category_id === row.id)
      const active = members.filter((asset) => asset.status === "in_service")
      return {
        ...row,
        assets: members.length,
        in_service: active.length,
        cost: r2(active.reduce((sum, asset) => sum + Number(asset.cost), 0)),
        nbv: r2(active.reduce((sum, asset) => sum + Number(asset.cost) - Number(asset.accumulated), 0)),
      }
    })
    return {
      data: {
        items,
        cost: r2(items.reduce((sum, row) => sum + row.cost, 0)),
        nbv: r2(items.reduce((sum, row) => sum + row.nbv, 0)),
      },
    }
  }),

  route("post", "/finance/assets/categories", (req) => {
    const code = String(req.body.code ?? "").trim().toUpperCase()
    const name = String(req.body.name ?? "").trim()
    const life = Math.trunc(Number(req.body.life))
    const account = findRow(FIN_COLLECTIONS.accounts, String(req.body.cost_account ?? ""))
    if (!code || !name || !(life > 0)) return refuse("A category needs a code, a name and a useful life in months.")
    if (!account || !String(account.code).startsWith("1201")) return refuse("Route the category to a fixed-asset cost account (1201…).")
    if (findRow(FIN_COLLECTIONS.assetCategories, code)) return refuse(`${code} already exists. Choose another code.`)
    // Accumulated depreciation follows the cost account's existing pairing.
    const pair = collection(FIN_COLLECTIONS.assetCategories).find((row) => row.cost_account === account.code)
    const row = createRow(FIN_COLLECTIONS.assetCategories, {
      id: code,
      code,
      name,
      method: req.body.method === "declining_balance" ? "declining_balance" : "straight_line",
      life,
      cost_account: String(account.code),
      accum_account: String(pair?.accum_account ?? "120201"),
      target_cost: 0,
    })
    // Newest last, as the list reads in code order.
    const rows = collection(FIN_COLLECTIONS.assetCategories)
    rows.push(rows.shift() as Row)
    return { data: row }
  }),

  route("get", "/finance/assets/depreciation", () => ({ data: runSummary(depreciationRun() as Row) })),

  route("post", "/finance/assets/depreciation/skip", (req) => {
    const record = depreciationRun() as Row
    if (record.status === "posted") return refuse("The run is already posted. Skipping an asset now would not change the entry.")
    const id = String(req.body.asset_id ?? "")
    const skipped = new Set((record.skipped as string[]) ?? [])
    if (req.body.skip === false) skipped.delete(id)
    else skipped.add(id)
    record.skipped = [...skipped]
    return { data: runSummary(record) }
  }),

  /** One automatic entry: depreciation expense once, accumulated depreciation per category. */
  route("post", "/finance/assets/depreciation/post", () => {
    const record = depreciationRun() as Row
    if (record.status === "posted") return refuse("This period's depreciation is already posted.")
    const summary = runSummary(record)
    if (summary.count === 0) return refuse("No asset is left in the run. Include at least one asset before posting.")
    const date = monthEnd(String(record.period))
    const closed = periodProblem(date)
    if (closed) return refuse(closed)
    const journal = createJournal({
      date,
      description: `Depreciation run — ${String(record.period)}`,
      lines: [
        { account_code: DEPRECIATION_EXPENSE, description: "Monthly depreciation", debit: summary.total, credit: 0 },
        ...summary.by_category.map((row) => ({ account_code: row.account, description: `Accumulated depreciation — ${row.name}`, debit: 0, credit: row.amount })),
      ],
      status: "posted",
      origin: "auto",
      source: String(record.id),
      source_type: "depreciation",
    })
    for (const line of summary.items) {
      const asset = findRow(FIN_COLLECTIONS.assets, String(line.id))
      if (!asset) continue
      asset.accumulated = r2(Number(asset.accumulated) + Number(line.charge))
      asset.history = [...((asset.history as Row[]) ?? []), { date, event: `Depreciation ${String(record.period)}`, amount: -Number(line.charge), entry: journal.number }]
    }
    Object.assign(record, { status: "posted", entry: journal.number, lines: summary.items, skipped_count: summary.skipped, posted_at: date })
    return { data: runSummary(record) }
  }),

  route("get", "/finance/assets/:id", (req) => {
    const asset = findRow(FIN_COLLECTIONS.assets, req.vars.id)
    if (!asset) return { status: 404, data: null }
    // The next twelve runs if nothing changes.
    let accumulated = Number(asset.accumulated)
    const schedule: Row[] = []
    const posted = depreciationRun()?.status === "posted"
    const [year, month] = (posted ? "2026-04" : FIN_CLOSING_PERIOD).split("-").map(Number)
    for (let step = 0; step < 12 && asset.status === "in_service"; step++) {
      const charge = monthlyCharge(String(asset.method), Number(asset.life), Number(asset.cost), Number(asset.salvage), accumulated)
      if (charge <= 0) break
      accumulated = r2(accumulated + charge)
      const period = new Date(Date.UTC(year, month - 1 + step, 1)).toISOString().slice(0, 7)
      schedule.push({ id: period, period, charge, accumulated, nbv: r2(Number(asset.cost) - accumulated) })
    }
    const meta = assetCategory(asset.category_id)
    return { data: { ...presentAsset(asset), cost_account: meta?.cost_account ?? null, accum_account: meta?.accum_account ?? null, schedule } }
  }),

  route("post", "/finance/assets", (req) => {
    const name = String(req.body.name ?? "").trim()
    const meta = assetCategory(req.body.category_id)
    const cost = r2(Number(req.body.cost))
    const salvagePct = Number(req.body.salvage_pct ?? SALVAGE_SHARE * 100)
    const inService = String(req.body.in_service ?? FIN_TODAY)
    if (!name) return refuse("The asset needs a name. Enter a description before saving. It appears on the register and every depreciation entry.")
    if (!meta) return refuse("Choose the asset's category. It sets the depreciation method and useful life.")
    if (!(cost > 0)) return refuse("Enter the acquisition cost. Depreciation is calculated from it.")
    if (!(salvagePct >= 0 && salvagePct < 100)) return refuse("Salvage is a percentage of cost, from 0 up to but not including 100.")
    const center = findRow(FIN_COLLECTIONS.costCenters, String(req.body.cost_center_id ?? "CC-100"))
    if (!center) return refuse("Choose the cost center the asset belongs to.")
    const year = inService.slice(0, 4)
    const serial = assets().filter((row) => String(row.number).startsWith(`FA-${year}-`)).length + 1
    const number = `FA-${year}-${String(serial).padStart(3, "0")}`
    const asset = createRow(FIN_COLLECTIONS.assets, {
      id: number,
      number,
      name,
      category_id: meta.id,
      method: meta.method,
      life: meta.life,
      in_service: inService,
      cost,
      salvage: r2((cost * salvagePct) / 100),
      accumulated: 0,
      cost_center_id: center ? String(center.id) : "CC-100",
      location: String(req.body.location ?? center?.name ?? "Cairo HQ · Head office"),
      status: "in_service",
      retired_on: null,
      history: [{ date: inService, event: "Placed in service", amount: cost, entry: null }],
    })
    return { data: presentAsset(asset) }
  }),

  route("post", "/finance/assets/:id/edit", (req) => {
    const asset = findRow(FIN_COLLECTIONS.assets, req.vars.id)
    if (!asset) return { status: 404, data: null }
    if (asset.status !== "in_service") return refuse("A retired asset cannot be edited.")
    const name = String(req.body.name ?? asset.name).trim()
    const life = Math.trunc(Number(req.body.life ?? asset.life))
    const salvage = r2(Number(req.body.salvage ?? asset.salvage))
    if (!name) return refuse("The asset needs a name.")
    if (!(life > 0)) return refuse("Useful life is a whole number of months above zero.")
    if (salvage < 0 || salvage >= Number(asset.cost)) return refuse("Salvage must be zero or more and below the asset's cost.")
    if (req.body.cost_center_id && !findRow(FIN_COLLECTIONS.costCenters, String(req.body.cost_center_id))) return refuse("Choose an existing cost center.")
    Object.assign(asset, { name, life, salvage, cost_center_id: String(req.body.cost_center_id ?? asset.cost_center_id) })
    asset.history = [...((asset.history as Row[]) ?? []), { date: FIN_TODAY, event: "Details edited", amount: null, entry: null }]
    return { data: presentAsset(asset) }
  }),

  route("post", "/finance/assets/:id/dispose", (req) => {
    const asset = findRow(FIN_COLLECTIONS.assets, req.vars.id)
    if (!asset || asset.status !== "in_service") return refuse("Only an asset in service can be disposed of.")
    const proceeds = r2(Number(req.body.proceeds ?? 0))
    if (!(proceeds >= 0)) return refuse("Proceeds cannot be negative.")
    const treasury = proceeds > 0 ? findRow(FIN_COLLECTIONS.treasuries, String(req.body.treasury_id ?? "")) : null
    if (proceeds > 0 && !treasury) return refuse("Choose the treasury the proceeds were paid into.")
    const date = String(req.body.date ?? FIN_TODAY)
    const closed = periodProblem(date)
    if (closed) return refuse(closed)
    const journal = retire(asset, "disposed", date, proceeds, treasury ?? null, String(req.body.reason ?? "").trim())
    return { data: { ...presentAsset(asset), entry: journal.number } }
  }),

  route("post", "/finance/assets/:id/write-off", (req) => {
    const asset = findRow(FIN_COLLECTIONS.assets, req.vars.id)
    const reason = String(req.body.reason ?? "").trim()
    if (!asset || asset.status !== "in_service") return refuse("Only an asset in service can be written off.")
    if (!reason) return refuse("Record why the asset is being written off. The reason is kept on the asset's history.")
    const closed = periodProblem(FIN_TODAY)
    if (closed) return refuse(closed)
    const journal = retire(asset, "written_off", FIN_TODAY, 0, null, reason)
    return { data: { ...presentAsset(asset), entry: journal.number } }
  }),
]
