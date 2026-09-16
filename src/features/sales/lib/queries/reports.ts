"use client"

import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "../api/reports"
import { salesKeys } from "../constants/query-keys"
import type { TotalSalesReportParams } from "../types"

export function useTotalSalesReport(params?: TotalSalesReportParams) {
  return useQuery({
    queryKey: salesKeys.reports.totalSales(params),
    queryFn: () => reportsApi.totalSales(params).then((r) => r.data.data),
  })
}

export function useSalesByCustomerReport(params?: TotalSalesReportParams) {
  return useQuery({
    queryKey: salesKeys.reports.byCustomer(params),
    queryFn: () => reportsApi.salesByCustomer(params).then((r) => r.data.data),
  })
}

export function useSalesBySalespersonReport(params?: TotalSalesReportParams) {
  return useQuery({
    queryKey: salesKeys.reports.bySalesperson(params),
    queryFn: () => reportsApi.salesBySalesperson(params).then((r) => r.data.data),
  })
}
