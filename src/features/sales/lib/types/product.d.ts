export type ProductType = "product" | "service"

/** `low_stock`/`out_of_stock` values are inferred from prose (only `in_stock` has a literal example — see docs/sales.md §4.9). */
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

export type ProductListItem = {
  id: string
  sku: string
  name: string
  type: ProductType
  type_label: string
  default_unit_price: number
  /** null = falls back to sales settings' default_tax_rate. */
  default_tax_rate: number | null
  track_stock: boolean
  stock_on_hand: number
  low_stock_threshold: number
  stock_status: StockStatus
  stock_status_label: string
  is_active: boolean
}

export type ProductListParams = {
  type?: ProductType
  is_active?: boolean
  search?: string
  page?: number
  per_page?: number
}

export type ProductSearchParams = {
  q: string
}

/** GET /sales/products/search — a documented SUBSET of ProductListItem (no type/track_stock/stock_on_hand/low_stock_threshold/is_active). */
export type ProductSearchResultItem = {
  id: string
  sku: string
  name: string
  default_unit_price: number
  default_tax_rate: number | null
  stock_status: StockStatus
  stock_status_label: string
}

export type CreateProductPayload = {
  sku?: string
  name: string
  type?: ProductType
  default_unit_price?: number
  default_tax_rate?: number
  track_stock?: boolean
  stock_on_hand?: number
  low_stock_threshold?: number
}

export type UpdateProductPayload = Partial<CreateProductPayload>

export type AdjustStockPayload = {
  /** Positive (add) or negative (subtract); cannot be zero. */
  delta: number
  reason: string
}

export type AdjustStockResult = {
  id: string
  stock_on_hand: number
  stock_status: StockStatus
}
