import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  ReportType,
  SalesByCustomerRow,
  SalesBySalespersonRow,
  TotalSalesReport,
  TotalSalesReportParams,
} from "../types"
import type { SignedDownloadUrl } from "../types/common"

export const reportsApi = {
  totalSales: (params?: TotalSalesReportParams) =>
    httpClient.get<ApiResponse<TotalSalesReport>>("/sales/reports/total-sales", { params }),

  salesByCustomer: (params?: TotalSalesReportParams) =>
    httpClient.get<ApiResponse<SalesByCustomerRow[]>>("/sales/reports/sales-by-customer", {
      params,
    }),

  salesBySalesperson: (params?: TotalSalesReportParams) =>
    httpClient.get<ApiResponse<SalesBySalespersonRow[]>>(
      "/sales/reports/sales-by-salesperson",
      { params },
    ),

  export: (type: ReportType, params?: TotalSalesReportParams) =>
    httpClient.post<ApiResponse<SignedDownloadUrl>>(`/sales/reports/${type}/export`, null, {
      params,
    }),
}
