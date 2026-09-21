import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

import { formatAmount, formatRate } from "../../lib/utils/money"

const amountVariants = cva("inline-flex flex-col tabular-nums", {
  variants: {
    align: {
      end: "items-end text-right",
      start: "items-start text-left",
    },
    emphasis: {
      default: "text-content-primary",
      strong: "text-content-primary font-semibold",
      muted: "text-content-tertiary",
    },
    /** Colour negatives as a warning, e.g. an overdrawn balance. */
    signed: {
      true: "data-negative:text-status-danger-fg",
      false: "",
    },
  },
  defaultVariants: {
    align: "end",
    emphasis: "default",
    signed: false,
  },
})

type AmountProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof amountVariants> & {
    value: number
    currency?: string
    /** Hide the muted currency suffix, e.g. in a column whose header names the currency. */
    hideCurrency?: boolean
    /** Restatement in the entity's base currency, shown as a muted second line. */
    base?: { value: number; currency: string; rate?: number }
  }

/**
 * The design's MoneyCell: `125,000.00 USD` with an optional
 * `≈ 6,078,750.00 EGP @ 48.6300` line. Negatives render in parentheses.
 */
function Amount({
  className,
  align,
  emphasis,
  signed,
  value,
  currency,
  hideCurrency = false,
  base,
  ...props
}: AmountProps) {
  return (
    <span
      data-slot="amount"
      data-negative={value < 0 ? "" : undefined}
      className={cn(amountVariants({ align, emphasis, signed }), className)}
      {...props}
    >
      <span className="whitespace-nowrap">
        {formatAmount(value)}
        {currency && !hideCurrency ? (
          <span className="text-content-tertiary font-normal"> {currency}</span>
        ) : null}
      </span>
      {base ? (
        <span className="text-content-tertiary text-xs leading-4 font-normal whitespace-nowrap">
          ≈ {formatAmount(base.value)} {base.currency}
          {base.rate ? ` @ ${formatRate(base.rate)}` : null}
        </span>
      ) : null}
    </span>
  )
}

export { Amount, amountVariants }
