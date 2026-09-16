import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse, PaginationMeta } from "@/src/shared/lib/types/api"
import type {
  CreateExpensePayload,
  CurrentTimesheetParams,
  Expense,
  ExpenseCategory,
  ExpenseListParams,
  LogTimePayload,
  SubmitTimesheetPayload,
  TimeLog,
  Timesheet,
} from "../types"

export const timeExpenseApi = {
  /** Weekly timesheet grid for one employee (7 days from `week_start`). */
  currentTimesheet: (params: CurrentTimesheetParams) =>
    httpClient.get<ApiResponse<Timesheet>>("/pm/timesheets/current", { params }),
  listExpenses: (params?: ExpenseListParams) =>
    httpClient.get<ApiResponse<Expense[]> & { meta: PaginationMeta }>(
      "/pm/expenses",
      { params },
    ),
  expenseCategories: () =>
    httpClient.get<ApiResponse<ExpenseCategory[]>>(
      "/pm/costbudget/expenses/categories",
    ),
  logTime: (payload: LogTimePayload) =>
    httpClient.post<ApiResponse<TimeLog>>("/pm/time-logs", payload),
  createExpense: (payload: CreateExpensePayload) =>
    httpClient.post<ApiResponse<Expense>>("/pm/expenses", payload),
  submitExpense: (expenseId: string) =>
    httpClient.post<ApiResponse<Expense>>(`/pm/expenses/${expenseId}/submit`),
  submitTimesheet: (payload: SubmitTimesheetPayload) =>
    httpClient.post<ApiResponse<Timesheet>>("/pm/timesheets/submit", payload),
}
