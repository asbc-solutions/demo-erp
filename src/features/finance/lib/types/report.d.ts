import type { FinanceReportType } from "../constants/report-types"

export type { FinanceReportType }

export type FinanceReportMetric = {
  label: string
  value: number
}

/** GET /finance/reports — all 6 report-card summaries in one call. */
export type FinanceReportCard = {
  type: FinanceReportType
  title: string
  subtitle: string
  currency_code: string
  metrics: FinanceReportMetric[]
}

/**
 * GET /finance/reports/:type — detail rows behind one card, identical to the
 * CSV export rows. Shape varies per report type, so this stays generic.
 */
export type FinanceReportRow = Record<string, string | number | boolean | null>

/**
 * POST /finance/reports/:type/export — synchronous CSV export. `download_url`
 * is a signed URL (15 min TTL) authenticated by its own signature, not by the
 * bearer token — open it directly, don't route it through httpClient.
 */
export type FinanceReportExportResult = {
  download_url: string
}
