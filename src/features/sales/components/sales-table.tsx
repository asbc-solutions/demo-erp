import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { SALES_DEALS, STAGE_BADGE } from "../data/sales-mock"

const formatAmount = (value: number) => `$${value.toLocaleString("en-US")}`

const ownerBg: Record<string, string> = {
  sc: "bg-brand-primary",
  mj: "bg-brand-primary",
}

export function SalesTable() {
  return (
    <div className="bg-surface-white border-stroke-default overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Deal</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-end">Amount</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SALES_DEALS.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell className="text-content-primary text-[13px] leading-[18px] font-medium">
                {deal.name}
              </TableCell>
              <TableCell className="text-content-secondary text-[13px] leading-[18px]">
                {deal.company}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] leading-[15.4px] font-medium",
                    STAGE_BADGE[deal.stage],
                  )}
                >
                  {deal.stage}
                </span>
              </TableCell>
              <TableCell className="text-content-primary text-end font-mono text-[12px] leading-[18px]">
                {formatAmount(deal.amount)}
              </TableCell>
              <TableCell className="text-content-secondary text-[12px] leading-[18px]">
                {deal.closeDateLong}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] leading-[10px] text-white",
                      ownerBg[deal.owner.id] ?? "bg-brand-primary",
                    )}
                    aria-hidden
                  >
                    {deal.owner.initials}
                  </span>
                  <span className="text-content-secondary text-[13px] leading-[18px]">
                    {deal.owner.name}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
