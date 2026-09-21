import { z } from "zod"

const requiredText = (message: string) => z.string().trim().min(1, message)

const positiveAmount = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => Number(value) > 0, "The amount must be greater than zero.")

const optionalAmount = z
  .string()
  .trim()
  .refine((value) => value === "" || Number(value) >= 0, "Enter zero or more.")

export const transferSchema = z
  .object({
    from_treasury_id: requiredText("Choose where the money comes from."),
    to_treasury_id: requiredText("Choose where the money goes."),
    amount: positiveAmount("Enter a transfer amount."),
    date: requiredText("Choose the transfer date."),
    note: z.string(),
  })
  .refine((values) => values.from_treasury_id !== values.to_treasury_id, {
    message: "Money has to move between two different treasuries.",
    path: ["to_treasury_id"],
  })

export type TransferFormValues = z.infer<typeof transferSchema>

export const chequeSchema = z
  .object({
    number: z.string().trim().regex(/^\d+$/, "Enter the cheque number as digits."),
    contact_id: requiredText("Choose who the cheque is from or to."),
    bank: requiredText("Enter the bank the cheque is drawn on."),
    amount: positiveAmount("Enter the amount."),
    issue_date: requiredText("Choose the issue date."),
    due_date: requiredText("Choose the due date."),
    treasury_id: requiredText("Choose the treasury it posts to."),
  })
  .refine((values) => values.due_date >= values.issue_date, {
    message: "The due date cannot be before the issue date.",
    path: ["due_date"],
  })

export type ChequeFormValues = z.infer<typeof chequeSchema>

export const chequeBookSchema = z.object({
  treasury_id: requiredText("Choose the bank account."),
  first: z.string().trim().regex(/^\d+$/, "Enter the first cheque number."),
  leaves: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter how many leaves the book has.")
    .refine((value) => Number(value) > 0 && Number(value) <= 500, "A book has between 1 and 500 leaves."),
  direction: z.enum(["received", "issued"]),
})

export type ChequeBookFormValues = z.infer<typeof chequeBookSchema>

export const custodySchema = z.object({
  employee_id: requiredText("Choose the employee."),
  amount: positiveAmount("Enter the amount advanced."),
  treasury_id: requiredText("Choose the treasury."),
  date: requiredText("Choose the date."),
  description: requiredText("Say what the custody is for."),
})

export type CustodyFormValues = z.infer<typeof custodySchema>

export const settleSchema = z
  .object({
    expenses: optionalAmount,
    cash_returned: optionalAmount,
    treasury_id: z.string(),
    date: requiredText("Choose the date."),
  })
  .refine((values) => Number(values.expenses || 0) + Number(values.cash_returned || 0) > 0, {
    message: "Enter the expenses claimed, the cash handed back, or both.",
    path: ["expenses"],
  })

export type SettleFormValues = z.infer<typeof settleSchema>

export const reasonSchema = z.object({
  reason: requiredText("Record the reason."),
})

export type ReasonFormValues = z.infer<typeof reasonSchema>

export const counterAccountSchema = z.object({
  counter_account: requiredText("Choose the account for the other side."),
})

export type CounterAccountFormValues = z.infer<typeof counterAccountSchema>
