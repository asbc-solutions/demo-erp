import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type {
  AdjustStockPayload,
  AdjustStockResult,
  CreateProductPayload,
  ProductListItem,
  ProductListParams,
  ProductSearchParams,
  ProductSearchResultItem,
  UpdateProductPayload,
} from "../types"

export const productsApi = {
  list: (params?: ProductListParams) =>
    httpClient.get<ApiResponse<ProductListItem[]>>("/sales/products", { params }),

  getById: (id: string) =>
    httpClient.get<ApiResponse<ProductListItem>>(`/sales/products/${id}`),

  create: (payload: CreateProductPayload) =>
    httpClient.post<ApiResponse<ProductListItem>>("/sales/products", payload),

  update: (id: string, payload: UpdateProductPayload) =>
    httpClient.put<ApiResponse<ProductListItem>>(`/sales/products/${id}`, payload),

  adjustStock: (id: string, payload: AdjustStockPayload) =>
    httpClient.post<ApiResponse<AdjustStockResult>>(
      `/sales/products/${id}/adjust-stock`,
      payload,
    ),

  search: (params: ProductSearchParams) =>
    httpClient.get<ApiResponse<ProductSearchResultItem[]>>(
      "/sales/products/search",
      { params },
    ),
}
