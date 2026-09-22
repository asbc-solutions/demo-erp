import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"

import type {
  Asset,
  AssetCategory,
  AssetCategoryList,
  AssetDetail,
  AssetRegister,
  DepreciationRun,
  EditAssetInput,
  NewAssetInput,
  NewCategoryInput,
} from "../types/assets"

type Retired = Asset & { entry: string }

export const assetsApi = {
  register: () => httpClient.get<ApiResponse<AssetRegister>>("/finance/assets"),

  detail: (id: string) => httpClient.get<ApiResponse<AssetDetail | null>>(`/finance/assets/${id}`),

  create: (input: NewAssetInput) => httpClient.post<ApiResponse<Asset>>("/finance/assets", input),

  edit: (id: string, input: EditAssetInput) => httpClient.post<ApiResponse<Asset>>(`/finance/assets/${id}/edit`, input),

  dispose: (id: string, input: { proceeds: number; treasury_id: string | null; date: string; reason: string }) =>
    httpClient.post<ApiResponse<Retired>>(`/finance/assets/${id}/dispose`, input),

  writeOff: (id: string, reason: string) => httpClient.post<ApiResponse<Retired>>(`/finance/assets/${id}/write-off`, { reason }),

  depreciation: () => httpClient.get<ApiResponse<DepreciationRun>>("/finance/assets/depreciation"),

  skip: (assetId: string, skip: boolean) =>
    httpClient.post<ApiResponse<DepreciationRun>>("/finance/assets/depreciation/skip", { asset_id: assetId, skip }),

  postRun: () => httpClient.post<ApiResponse<DepreciationRun>>("/finance/assets/depreciation/post"),

  categories: () => httpClient.get<ApiResponse<AssetCategoryList>>("/finance/assets/categories"),

  createCategory: (input: NewCategoryInput) => httpClient.post<ApiResponse<AssetCategory>>("/finance/assets/categories", input),
}
