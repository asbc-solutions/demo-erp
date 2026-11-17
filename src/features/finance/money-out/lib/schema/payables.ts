import { z } from "zod"

/** Messages are `FinanceMoneyOut` keys, translated where the error is rendered. */
export type PayablesErrorKey =
  | "errorSendBackReason"
  | "errorMerchant"
  | "errorDescription"
  | "errorAmountPaid"
  | "errorAmountPositive"
  | "errorReceiptDate"
  | "errorPaidFrom"
  | "errorHasReceipt"

const message = (key: PayablesErrorKey) => key

const requiredText = (key: PayablesErrorKey) => z.string().trim().min(1, message(key))

export const sendBackSchema = z.object({
  reason: requiredText("errorSendBackReason"),
})

export type SendBackFormValues = z.infer<typeof sendBackSchema>

/** Expense capture. The form keeps amounts as typed text; the API receives numbers. */
export const expenseSchema = z.object({
  merchant: requiredText("errorMerchant"),
  description: requiredText("errorDescription"),
  amount: z
    .string()
    .trim()
    .min(1, message("errorAmountPaid"))
    .refine((value) => Number(value) > 0, message("errorAmountPositive")),
  date: requiredText("errorReceiptDate"),
  treasury_id: requiredText("errorPaidFrom"),
  has_receipt: z.boolean().refine(Boolean, message("errorHasReceipt")),
  account_code: z.string(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
