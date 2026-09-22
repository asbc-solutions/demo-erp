import { z } from "zod"

const requiredText = (message: string) => z.string().trim().min(1, message)
const amountText = z.string().trim().refine((value) => value === "" || Number(value) >= 0, "Enter zero or more.")

export const journalLineSchema = z.object({
  account_code: z.string(),
  description: z.string(),
  debit: amountText,
  credit: amountText,
})

export const journalSchema = z.object({
  date: requiredText("Choose the entry date."),
  description: requiredText("Describe the entry."),
  lines: z.array(journalLineSchema).min(2, "An entry needs at least two lines."),
})

export type JournalFormValues = z.infer<typeof journalSchema>

export const reverseSchema = z.object({
  date: requiredText("Choose the reversal date."),
  reason: requiredText("Give a reason so the audit trail explains why."),
})

export type ReverseFormValues = z.infer<typeof reverseSchema>

export const templateSchema = z
  .object({
    name: requiredText("Name the template."),
    debit_account: requiredText("Choose the debit account."),
    credit_account: requiredText("Choose the credit account."),
    amount: amountText,
    cadence: z.enum(["ad_hoc", "monthly", "quarterly"]),
  })
  .refine((values) => values.debit_account !== values.credit_account, {
    message: "Debit and credit must be different accounts.",
    path: ["credit_account"],
  })

export type TemplateFormValues = z.infer<typeof templateSchema>

export const recurringSchema = z
  .object({
    name: requiredText("Name the recurring journal."),
    cadence: z.enum(["monthly", "quarterly"]),
    next_run: requiredText("Choose the first run date."),
    debit_account: requiredText("Choose the debit account."),
    credit_account: requiredText("Choose the credit account."),
    amount: z
      .string()
      .trim()
      .min(1, "Enter the amount.")
      .refine((value) => Number(value) > 0, "The amount must be greater than zero."),
  })
  .refine((values) => values.debit_account !== values.credit_account, {
    message: "Debit and credit must be different accounts.",
    path: ["credit_account"],
  })

export type RecurringFormValues = z.infer<typeof recurringSchema>
