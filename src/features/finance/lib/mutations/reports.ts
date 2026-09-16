"use client"

import { useMutation } from "@tanstack/react-query"

import { reportsApi } from "../api/reports"
import type { FinanceReportType } from "../constants/report-types"

/** Export is synchronous — the response already carries the signed download_url. */
export function useExportFinanceReportCsv() {
  return useMutation({
    mutationFn: (type: FinanceReportType) =>
      reportsApi.exportCsv(type).then((r) => r.data.data.download_url),
  })
}
