import { z } from "zod"

/** Messages are `FinanceBanking` keys, translated where the error is rendered. */
export type BankingErrorKey =
  | "errorAmountPositive"
  | "errorZeroOrMore"
  | "errorTransferFrom"
  | "errorTransferTo"
  | "errorTransferAmount"
  | "errorTransferDate"
  | "errorSameTreasury"
  | "errorChequeNumber"
  | "errorChequeContact"
  | "errorChequeBank"
  | "errorAmount"
  | "errorIssueDate"
  | "errorDueDate"
  | "errorChequeTreasury"
  | "errorDueBeforeIssue"
  | "errorBookTreasury"
  | "errorBookFirst"
  | "errorBookLeaves"
  | "errorBookLeavesRange"
  | "errorCustodyEmployee"
  | "errorCustodyAmount"
  | "errorChooseTreasury"
  | "errorChooseDate"
  | "errorCustodyDescription"
  | "errorSettleNothing"
  | "errorReason"
  | "errorCounterAccount"

const message = (key: BankingErrorKey) => key

const requiredText = (key: BankingErrorKey) => z.string().trim().min(1, message(key))

const positiveAmount = (key: BankingErrorKey) =>
  z
    .string()
    .trim()
    .min(1, message(key))
    .refine((value) => Number(value) > 0, message("errorAmountPositive"))

const optionalAmount = z
  .string()
  .trim()
  .refine((value) => value === "" || Number(value) >= 0, message("errorZeroOrMore"))

export const transferSchema = z
  .object({
    from_treasury_id: requiredText("errorTransferFrom"),
    to_treasury_id: requiredText("errorTransferTo"),
    amount: positiveAmount("errorTransferAmount"),
    date: requiredText("errorTransferDate"),
    note: z.string(),
  })
  .refine((values) => values.from_treasury_id !== values.to_treasury_id, {
    message: message("errorSameTreasury"),
    path: ["to_treasury_id"],
  })

export type TransferFormValues = z.infer<typeof transferSchema>

export const chequeSchema = z
  .object({
    number: z.string().trim().regex(/^\d+$/, message("errorChequeNumber")),
    contact_id: requiredText("errorChequeContact"),
    bank: requiredText("errorChequeBank"),
    amount: positiveAmount("errorAmount"),
    issue_date: requiredText("errorIssueDate"),
    due_date: requiredText("errorDueDate"),
    treasury_id: requiredText("errorChequeTreasury"),
  })
  .refine((values) => values.due_date >= values.issue_date, {
    message: message("errorDueBeforeIssue"),
    path: ["due_date"],
  })

export type ChequeFormValues = z.infer<typeof chequeSchema>

export const chequeBookSchema = z.object({
  treasury_id: requiredText("errorBookTreasury"),
  first: z.string().trim().regex(/^\d+$/, message("errorBookFirst")),
  leaves: z
    .string()
    .trim()
    .regex(/^\d+$/, message("errorBookLeaves"))
    .refine((value) => Number(value) > 0 && Number(value) <= 500, message("errorBookLeavesRange")),
  direction: z.enum(["received", "issued"]),
})

export type ChequeBookFormValues = z.infer<typeof chequeBookSchema>

export const custodySchema = z.object({
  employee_id: requiredText("errorCustodyEmployee"),
  amount: positiveAmount("errorCustodyAmount"),
  treasury_id: requiredText("errorChooseTreasury"),
  date: requiredText("errorChooseDate"),
  description: requiredText("errorCustodyDescription"),
})

export type CustodyFormValues = z.infer<typeof custodySchema>

export const settleSchema = z
  .object({
    expenses: optionalAmount,
    cash_returned: optionalAmount,
    treasury_id: z.string(),
    date: requiredText("errorChooseDate"),
  })
  .refine((values) => Number(values.expenses || 0) + Number(values.cash_returned || 0) > 0, {
    message: message("errorSettleNothing"),
    path: ["expenses"],
  })

export type SettleFormValues = z.infer<typeof settleSchema>

export const reasonSchema = z.object({
  reason: requiredText("errorReason"),
})

export type ReasonFormValues = z.infer<typeof reasonSchema>

export const counterAccountSchema = z.object({
  counter_account: requiredText("errorCounterAccount"),
})

export type CounterAccountFormValues = z.infer<typeof counterAccountSchema>
