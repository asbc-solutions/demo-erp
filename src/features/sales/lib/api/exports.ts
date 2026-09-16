import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { SalesExportJob } from "../types/common"

export const exportsApi = {
  getStatus: (jobId: string) =>
    httpClient.get<ApiResponse<SalesExportJob>>(`/sales/exports/${jobId}/status`),
}
