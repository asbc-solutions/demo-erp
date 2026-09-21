import { z } from "zod"

const requiredText = (message: string) => z.string().trim().min(1, message)

export const sendBackSchema = z.object({
  reason: requiredText("Tell the preparer what to correct."),
})

export type SendBackFormValues = z.infer<typeof sendBackSchema>

/** Expense capture. The form keeps amounts as typed text; the API receives numbers. */
export const expenseSchema = z.object({
  merchant: requiredText("Enter the merchant."),
  description: requiredText("Say what it was for."),
  amount: z
    .string()
    .trim()
    .min(1, "Enter the amount paid.")
    .refine((value) => Number(value) > 0, "The amount must be greater than zero."),
  date: requiredText("Choose the date on the receipt."),
  treasury_id: requiredText("Choose where it was paid from."),
  has_receipt: z.boolean().refine(Boolean, "Confirm you have the receipt."),
  account_code: z.string(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>
