export type ReportType = "total-sales" | "sales-by-customer" | "sales-by-salesperson"

/** Shared filter set across all 3 report endpoints (docs/sales.md §4.6). */
export type TotalSalesReportParams = {
  date_from?: string
  date_to?: string
  customer_id?: string
  salesperson_id?: string
  invoice_status?: string
}

export type TotalSalesSeriesPoint = {
  date: string
  amount: number
}

export type TotalSalesReport = {
  series: TotalSalesSeriesPoint[]
  total_amount: number
  invoice_count: number
}

export type SalesByCustomerRow = {
  customer_id: string
  customer_name: string
  invoice_count: number
  total_amount: number
}

export type SalesBySalespersonRow = {
  salesperson_id: string
  salesperson_name: string
  invoice_count: number
  total_amount: number
}
