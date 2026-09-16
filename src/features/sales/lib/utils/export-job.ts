import { exportsApi } from "../api/exports"
import type { SalesExportResult } from "../types/common"

const EXPORT_POLL_INTERVAL_MS = 2_000
const EXPORT_POLL_MAX_ATTEMPTS = 90 // ~3 minutes

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pollSalesExportJob(jobId: string): Promise<string> {
  for (let attempt = 0; attempt < EXPORT_POLL_MAX_ATTEMPTS; attempt++) {
    await delay(EXPORT_POLL_INTERVAL_MS)
    const job = await exportsApi.getStatus(jobId).then((r) => r.data.data)
    if (job.status === "completed") {
      if (!job.download_url) {
        throw new Error("Export completed but no download URL was returned.")
      }
      return job.download_url
    }
    if (job.status === "failed") {
      throw new Error(job.error ?? "Export failed on the server.")
    }
  }
  throw new Error("Export timed out. Try again or narrow the scope.")
}

/**
 * Entity exports (Customers/Quotations/Orders/Invoices) return an immediate
 * `download_url` when synchronous, or just a `job_id` to poll when the row
 * count exceeds the backend's async threshold. Resolves either way to a
 * ready download URL.
 */
export async function resolveExportDownloadUrl(
  result: SalesExportResult,
): Promise<string> {
  if (result.download_url) return result.download_url
  return pollSalesExportJob(result.job_id)
}
