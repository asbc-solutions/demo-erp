import { z } from "zod"

import type { LedgerMessageKey } from "../types/ledger"

/** Messages are `FinanceLedger` keys, translated where the error is rendered. */
const msg = (key: LedgerMessageKey) => key

const requiredText = (message: LedgerMessageKey) => z.string().trim().min(1, message)
const amountText = z.string().trim().refine((value) => value === "" || Number(value) >= 0, msg("errZeroOrMore"))

export const journalLineSchema = z.object({
  account_code: z.string(),
  description: z.string(),
  debit: amountText,
  credit: amountText,
})

export const journalSchema = z.object({
  date: requiredText("errEntryDate"),
  description: requiredText("errEntryDescription"),
  lines: z.array(journalLineSchema).min(2, msg("errTwoLines")),
})

export type JournalFormValues = z.infer<typeof journalSchema>

export const reverseSchema = z.object({
  date: requiredText("errReversalDate"),
  reason: requiredText("errReversalReason"),
})

export type ReverseFormValues = z.infer<typeof reverseSchema>

export const templateSchema = z
  .object({
    name: requiredText("errTemplateName"),
    debit_account: requiredText("errDebitAccount"),
    credit_account: requiredText("errCreditAccount"),
    amount: amountText,
    cadence: z.enum(["ad_hoc", "monthly", "quarterly"]),
  })
  .refine((values) => values.debit_account !== values.credit_account, {
    message: msg("errSameAccount"),
    path: ["credit_account"],
  })

export type TemplateFormValues = z.infer<typeof templateSchema>

export const recurringSchema = z
  .object({
    name: requiredText("errRecurringName"),
    cadence: z.enum(["monthly", "quarterly"]),
    next_run: requiredText("errFirstRun"),
    debit_account: requiredText("errDebitAccount"),
    credit_account: requiredText("errCreditAccount"),
    amount: z
      .string()
      .trim()
      .min(1, msg("errAmount"))
      .refine((value) => Number(value) > 0, msg("errAmountPositive")),
  })
  .refine((values) => values.debit_account !== values.credit_account, {
    message: msg("errSameAccount"),
    path: ["credit_account"],
  })

export type RecurringFormValues = z.infer<typeof recurringSchema>
