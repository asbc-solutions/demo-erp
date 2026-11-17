import { z } from "zod"

/** Messages are `FinanceShared` keys, translated where the error is rendered. */
export type VoucherErrorKey =
  | "voucherErrorContact"
  | "voucherErrorTreasury"
  | "voucherErrorAmount"
  | "voucherErrorAmountPositive"
  | "voucherErrorDate"
  | "voucherErrorDescription"

const message = (key: VoucherErrorKey) => key

export const voucherSchema = z.object({
  contact_id: z.string().trim().min(1, message("voucherErrorContact")),
  treasury_id: z.string().trim().min(1, message("voucherErrorTreasury")),
  amount: z
    .string()
    .trim()
    .min(1, message("voucherErrorAmount"))
    .refine((value) => Number(value) > 0, message("voucherErrorAmountPositive")),
  date: z.string().trim().min(1, message("voucherErrorDate")),
  description: z.string().trim().min(1, message("voucherErrorDescription")),
})

export type VoucherFormValues = z.infer<typeof voucherSchema>
