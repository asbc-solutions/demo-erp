"use client"

import { ChevronRight, Receipt } from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { useRecentInvoices } from "../lib/queries/recent-invoices"
import { formatCurrency } from "../lib/utils/format"
import { CommandCenterSectionSpinner } from "./shared/command-center-loading"
import { CommandCenterErrorState } from "./shared/command-center-error-state"

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary"
  | "outline"

/** `status` is derived (e.g. `overdue`) and isn't a fixed enum in the docs — map known values, fall back to neutral. */
function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "paid":
      return "success"
    case "sent":
      return "info"
    case "overdue":
      return "danger"
    case "partial":
      return "warning"
    case "draft":
    case "void":
    default:
      return "neutral"
  }
}

export function RecentInvoicesSection() {
  const { data, isLoading, isError, refetch } = useRecentInvoices({ limit: 3 })
  const invoices = data ?? []

  return (
    <Card
      variant="elevated"
      className="overflow-hidden rounded-2xl border-stroke-default py-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
    >
      <div className="flex items-center justify-between px-6 pb-4">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-content-secondary" />
          <p className="text-sm font-semibold text-content-primary">Recent Invoices</p>
        </div>
        <Button
          type="button"
          variant="ghost-primary"
          size="xs"
          className="h-auto gap-1 px-1 text-[11px] font-medium"
        >
          View all
          <ChevronRight className="size-3" />
        </Button>
      </div>
      <div className="px-6 pb-2">
        {isLoading ? (
          <CommandCenterSectionSpinner />
        ) : isError ? (
          <CommandCenterErrorState
            message="Failed to load recent invoices."
            onRetry={() => void refetch()}
          />
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-content-quaternary">
            No invoices yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-stroke-default hover:bg-transparent">
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-end">Amount</TableHead>
                <TableHead className="text-end">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-stroke-default">
                  <TableCell className="text-xs font-medium text-content-primary">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell className="text-xs text-content-tertiary">
                    {invoice.client_name}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs text-content-primary">
                    {formatCurrency(invoice.total_amount, invoice.currency_code)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Badge
                      variant={statusBadgeVariant(invoice.status)}
                      className={cn(
                        "rounded-lg border-0 px-2 py-0.5 text-[11px] capitalize",
                        invoice.status === "draft" &&
                          "bg-surface-hover text-content-tertiary",
                      )}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  )
}
