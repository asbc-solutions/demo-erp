import { z } from "zod"

/** Messages are `FinanceSubledger` keys, translated where the error is rendered. */
export type SubledgerErrorKey =
  | "errorAmount"
  | "errorAmountPositive"
  | "errorNoteContact"
  | "errorNoteDate"
  | "errorNoteReason"
  | "errorWriteOffReason"

const requiredText = (message: SubledgerErrorKey) => z.string().trim().min(1, message)

const positiveAmount = z
  .string()
  .trim()
  .min(1, "errorAmount" satisfies SubledgerErrorKey)
  .refine((value) => Number(value) > 0, "errorAmountPositive" satisfies SubledgerErrorKey)

/** A credit note (customer) or debit note (supplier); both are recorded against a contact. */
export const noteSchema = z.object({
  contact_id: requiredText("errorNoteContact"),
  amount: positiveAmount,
  date: requiredText("errorNoteDate"),
  reason: requiredText("errorNoteReason"),
})

export type NoteFormValues = z.infer<typeof noteSchema>

export const writeOffSchema = z.object({
  reason: requiredText("errorWriteOffReason"),
})

export type WriteOffFormValues = z.infer<typeof writeOffSchema>
