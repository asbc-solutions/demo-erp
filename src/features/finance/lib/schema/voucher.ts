import { z } from "zod"

export const voucherSchema = z.object({
  contact_id: z.string().trim().min(1, "Choose who the voucher is for."),
  treasury_id: z.string().trim().min(1, "Choose the treasury or bank account."),
  amount: z
    .string()
    .trim()
    .min(1, "Enter the amount.")
    .refine((value) => Number(value) > 0, "The amount must be greater than zero."),
  date: z.string().trim().min(1, "Choose the voucher date."),
  description: z.string().trim().min(1, "Describe what the money is for."),
})

export type VoucherFormValues = z.infer<typeof voucherSchema>
