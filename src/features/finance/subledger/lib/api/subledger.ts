import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import { SUBLEDGER_SIDES } from "../constants/sides"
import type {
  ContactCard,
  CreditDocument,
  CreditList,
  NewNotePayload,
  NewVoucherPayload,
  Side,
  SubledgerOverview,
  Voucher,
  VoucherList,
} from "../types/subledger"

const api = (side: Side) => SUBLEDGER_SIDES[side].api

export const subledgerApi = {
  overview: (side: Side) => httpClient.get<ApiResponse<SubledgerOverview>>(api(side).overview),

  contact: (side: Side, id: string) =>
    httpClient.get<ApiResponse<ContactCard | null>>(`${api(side).contact}/${id}`),

  writeOff: (side: Side, id: string, reason: string) =>
    httpClient.post<ApiResponse<{ written_off_base: number }>>(`${api(side).contact}/${id}/write-off`, {
      reason,
    }),

  notes: (side: Side) => httpClient.get<ApiResponse<CreditList>>(api(side).notes),

  createNote: (side: Side, payload: NewNotePayload) =>
    httpClient.post<ApiResponse<CreditDocument>>(api(side).notes, payload),

  advances: (side: Side) => httpClient.get<ApiResponse<CreditList>>(api(side).advances),

  vouchers: (side: Side) => httpClient.get<ApiResponse<VoucherList>>(api(side).vouchers),

  createVoucher: (side: Side, payload: NewVoucherPayload) =>
    httpClient.post<ApiResponse<Voucher>>(api(side).vouchers, payload),
}
