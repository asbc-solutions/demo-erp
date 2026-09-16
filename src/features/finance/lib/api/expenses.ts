import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"

import type {
  CreateFinanceExpensePayload,
  CreateFinanceExpenseResult,
  FinanceExpenseBreakdownEntry,
  FinanceExpenseCategory,
  FinanceExpenseListItem,
  FinanceExpenseListParams,
  FinanceExpenseSummary,
} from "../types"

export const expensesApi = {
  list: (params?: FinanceExpenseListParams) =>
    httpClient.get<ApiResponse<FinanceExpenseListItem[]> & { meta: PaginationMeta }>(
      "/finance/expenses",
      { params },
    ),

  create: (payload: CreateFinanceExpensePayload) =>
    httpClient.post<ApiResponse<CreateFinanceExpenseResult>>("/finance/expenses", payload),

  summary: () => httpClient.get<ApiResponse<FinanceExpenseSummary>>("/finance/expenses/summary"),

  categories: () =>
    httpClient.get<ApiResponse<FinanceExpenseCategory[]>>("/finance/expenses/categories"),

  breakdown: (from?: string, to?: string) =>
    httpClient.get<ApiResponse<FinanceExpenseBreakdownEntry[]>>("/finance/expenses/breakdown", {
      params: { from, to },
    }),
}
