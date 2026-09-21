import { Badge } from "@/src/shared/components/ui/badge"
import { cn } from "@/src/shared/lib/utils/utils"

import type { FinanceInvoiceStatus } from "../../lib/types"

const STATUS_META: Record<
  FinanceInvoiceStatus,
  { label: string; dot: string; badgeClass: string }
> = {
  paid: {
    label: "Paid",
    dot: "bg-brand-success",
    badgeClass: "bg-brand-success/12 text-brand-success",
  },
  sent: {
    label: "Sent",
    dot: "bg-brand-info",
    badgeClass: "bg-brand-info/12 text-brand-info",
  },
  overdue: {
    label: "Overdue",
    dot: "bg-brand-danger",
    badgeClass: "bg-brand-danger/12 text-brand-danger",
  },
  draft: {
    label: "Draft",
    dot: "bg-content-quaternary",
    badgeClass: "bg-[#f4f4f5] text-content-tertiary",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-content-quaternary",
    badgeClass: "bg-surface-hover text-content-tertiary",
  },
}

export function InvoiceStatusBadge({ status }: Readonly<{ status: FinanceInvoiceStatus }>) {
  // An unrecognised status renders neutrally rather than throwing and taking the whole table down.
  const meta = STATUS_META[status] ?? { ...STATUS_META.cancelled, label: status }
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      <Badge className={cn("rounded-lg border-0 px-2 py-0.5 text-[11px] font-medium", meta.badgeClass)}>
        {meta.label}
      </Badge>
    </div>
  )
}
