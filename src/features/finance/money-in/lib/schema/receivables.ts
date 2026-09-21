import { z } from "zod"

const requiredText = (message: string) => z.string().trim().min(1, message)

const positiveAmount = z
  .string()
  .trim()
  .min(1, "Enter the amount.")
  .refine((value) => Number(value) > 0, "The amount must be greater than zero.")

export const creditNoteSchema = z.object({
  customer_id: requiredText("Choose the customer the note is for."),
  amount: positiveAmount,
  date: requiredText("Choose the note date."),
  reason: requiredText("Say why the credit is being issued."),
})

export type CreditNoteFormValues = z.infer<typeof creditNoteSchema>

export const writeOffSchema = z.object({
  reason: requiredText("Record why this balance is being written off."),
})

export type WriteOffFormValues = z.infer<typeof writeOffSchema>
