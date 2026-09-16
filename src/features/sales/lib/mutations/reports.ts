"use client"

import { useMutation } from "@tanstack/react-query"
import { reportsApi } from "../api/reports"
import type { ReportType, TotalSalesReportParams } from "../types"

/** Reports export is always synchronous — returns a ready signed download_url directly. */
export function useExportReport() {
  return useMutation({
    mutationFn: ({ type, params }: { type: ReportType; params?: TotalSalesReportParams }) =>
      reportsApi.export(type, params).then((r) => r.data.data.download_url),
  })
}
