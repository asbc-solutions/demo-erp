export type AssetStatus = "in_service" | "disposed" | "written_off"
export type DepreciationMethod = "straight_line" | "declining_balance"

export type AssetHistoryEvent = {
  date: string
  event: string
  /** Cost placed in service, proceeds, charge (negative) or carrying amount written off (negative). */
  amount: number | null
  entry: string | null
}

export type Asset = {
  id: string
  number: string
  name: string
  category_id: string
  category_name: string
  method: DepreciationMethod
  /** Useful life in months. */
  life: number
  in_service: string
  cost: number
  salvage: number
  accumulated: number
  nbv: number
  pct_depreciated: number
  monthly_charge: number
  cost_center_id: string
  location: string
  status: AssetStatus
  retired_on: string | null
  retire_reason?: string | null
  history: AssetHistoryEvent[]
}

export type AssetScheduleRow = { id: string; period: string; charge: number; accumulated: number; nbv: number }

export type AssetDetail = Asset & {
  cost_account: string | null
  accum_account: string | null
  schedule: AssetScheduleRow[]
}

export type AssetRegister = {
  items: Asset[]
  cost: number
  accumulated: number
  nbv: number
  in_service: number
  retired: number
  categories: { id: string; name: string }[]
}

export type AssetCategory = {
  id: string
  code: string
  name: string
  method: DepreciationMethod
  life: number
  cost_account: string
  accum_account: string
  assets: number
  in_service: number
  cost: number
  nbv: number
}

export type AssetCategoryList = { items: AssetCategory[]; cost: number; nbv: number }

export type DepreciationLine = {
  id: string
  number: string
  name: string
  category_id: string
  nbv: number
  charge: number
}

export type DepreciationRun = {
  id: string
  period: string
  status: "draft" | "posted"
  entry: string | null
  items: DepreciationLine[]
  count: number
  skipped: number
  set_aside: DepreciationLine[]
  total: number
  by_category: { id: string; name: string; account: string; amount: number }[]
}

export type NewAssetInput = {
  name: string
  category_id: string
  in_service: string
  cost: number
  salvage_pct: number
  cost_center_id: string
}

export type EditAssetInput = { name: string; cost_center_id: string; life: number; salvage: number }

export type NewCategoryInput = { code: string; name: string; method: DepreciationMethod; life: number; cost_account: string }
