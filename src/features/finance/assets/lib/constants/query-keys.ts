import { financeKeys } from "../../../lib/constants/query-keys"

export const assetsKeys = {
  all: [...financeKeys.all, "assets"] as const,
  register: () => [...assetsKeys.all, "register"] as const,
  detail: (id: string) => [...assetsKeys.all, "detail", id] as const,
  depreciation: () => [...assetsKeys.all, "depreciation"] as const,
  categories: () => [...assetsKeys.all, "categories"] as const,
} as const
