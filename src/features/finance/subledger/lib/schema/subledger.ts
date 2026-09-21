import { z } from "zod"

const requiredText = (message: string) => z.string().trim().min(1, message)

const positiveAmount = z
  .string()
  .trim()
  .min(1, "Enter the amount.")
  .refine((value) => Number(value) > 0, "The amount must be greater than zero.")

/** A credit note (customer) or debit note (supplier); both are recorded against a contact. */
export const noteSchema = z.object({
  contact_id: requiredText("Choose who the note is for."),
  amount: positiveAmount,
  date: requiredText("Choose the note date."),
  reason: requiredText("Say why the note is being issued."),
})

export type NoteFormValues = z.infer<typeof noteSchema>

export const writeOffSchema = z.object({
  reason: requiredText("Record why this balance is being written off."),
})

export type WriteOffFormValues = z.infer<typeof writeOffSchema>
