import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/src/shared/lib/utils/utils"

const financeAlertVariants = cva(
  "border-stroke-default flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border px-5 py-3.5 text-sm leading-5",
  {
    variants: {
      tone: {
        info: "bg-status-info-bg text-content-secondary",
        success: "bg-status-success-bg text-content-secondary",
        warning: "bg-status-warning-bg text-content-secondary",
        danger: "bg-status-danger-bg text-status-danger-fg",
      },
    },
    defaultVariants: { tone: "info" },
  },
)

type FinanceAlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof financeAlertVariants> & {
    /** A button placed at the end, e.g. "Renew". */
    action?: React.ReactNode
  }

/**
 * The design's three-sentence message: what happened, why, and what to do
 * next — e.g. "This entry doesn't balance. Debits total 42,000.00 and credits
 * 41,500.00. Adjust a line so both sides match, then post."
 */
function FinanceAlert({ className, tone, action, children, ...props }: FinanceAlertProps) {
  return (
    <div
      data-slot="finance-alert"
      data-tone={tone ?? "info"}
      role={tone === "danger" ? "alert" : "status"}
      className={cn(financeAlertVariants({ tone }), className)}
      {...props}
    >
      <p className="max-w-3xl min-w-0 flex-1">{children}</p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export { FinanceAlert, financeAlertVariants }
