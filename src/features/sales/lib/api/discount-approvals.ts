import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  DecideDiscountApprovalPayload,
  DiscountApproval,
  RequestDiscountApprovalPayload,
} from "../types"

export const discountApprovalsApi = {
  request: (
    quotationId: string,
    lineId: string,
    payload: RequestDiscountApprovalPayload,
  ) =>
    httpClient.post<ApiResponse<DiscountApproval>>(
      `/sales/quotations/${quotationId}/lines/${lineId}/discount-approvals`,
      payload,
    ),

  decide: (approvalId: string, payload: DecideDiscountApprovalPayload) =>
    httpClient.post<ApiResponse<DiscountApproval>>(
      `/sales/discount-approvals/${approvalId}/decide`,
      payload,
    ),
}
