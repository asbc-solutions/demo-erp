import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  CreateTermsTemplatePayload,
  TermsTemplate,
  UpdateTermsTemplatePayload,
} from "../types"

export const termsTemplatesApi = {
  list: () => httpClient.get<ApiResponse<TermsTemplate[]>>("/sales/terms-templates"),

  create: (payload: CreateTermsTemplatePayload) =>
    httpClient.post<ApiResponse<TermsTemplate>>("/sales/terms-templates", payload),

  update: (id: string, payload: UpdateTermsTemplatePayload) =>
    httpClient.put<ApiResponse<TermsTemplate>>(`/sales/terms-templates/${id}`, payload),

  delete: (id: string) =>
    httpClient.delete<ApiResponse<null>>(`/sales/terms-templates/${id}`),
}
