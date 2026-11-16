import { cn } from "@/src/shared/lib/utils/utils"

import type { SalesDeal } from "../data/sales-mock"

const ownerColor: Record<string, string> = {
  sc: "bg-brand-primary",
  mj: "bg-brand-primary",
}

const formatAmount = (value: number) => `$${value.toLocaleString("en-US")}`

export function DealCard({ deal }: { deal: SalesDeal }) {
  return (
    <div className="bg-surface-white border-stroke-default flex flex-col gap-2 rounded-2xl border border-s-[1.6px] px-3.5 py-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className="ring-stroke-default flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-violet-500 text-[10px] leading-[10px] font-medium text-white ring-2"
          aria-hidden
        >
          {deal.companyInitials}
        </span>
        <span className="font-mono text-[12px] leading-[18px] text-content-primary">
          {formatAmount(deal.amount)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[12px] leading-[18px] font-medium text-content-primary">
          {deal.name}
        </p>
        <p className="text-[11px] leading-[15.4px] text-content-quaternary">
          {deal.company}
        </p>
      </div>
      <div className="flex items-center justify-between pt-2.5">
        <span className="text-[11px] leading-[16.5px] text-content-quaternary">
          {deal.closeDate}
        </span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[10px] leading-[10px] text-white",
            ownerColor[deal.owner.id] ?? "bg-brand-primary",
          )}
          aria-label={deal.owner.name}
        >
          {deal.owner.initials}
        </span>
      </div>
    </div>
  )
}
