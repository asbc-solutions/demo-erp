"use client"

import { Dialog, DialogContent, DialogTitle } from "@/src/shared/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

import { useFinanceInvoice } from "../../lib/queries/invoices"
import { formatCurrency } from "../../lib/utils/currency"
import { FinanceSectionSpinner } from "../shared/finance-loading"
import { FinanceErrorState } from "../shared/finance-error-state"
import { InvoiceStatusBadge } from "./invoice-status-badge"

export function InvoiceDetailDialog({
  invoiceId,
  onOpenChange,
}: Readonly<{ invoiceId: string | null; onOpenChange: (open: boolean) => void }>) {
  const { data: invoice, isLoading, isError, refetch } = useFinanceInvoice(invoiceId)

  return (
    <Dialog open={invoiceId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 sm:max-w-2xl">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-[18px] leading-[28.8px] font-semibold text-content-primary">
                {invoice?.invoice_number ?? "Invoice details"}
              </DialogTitle>
              {invoice ? (
                <span className="text-xs text-content-tertiary">{invoice.client_name}</span>
              ) : null}
            </div>
            {invoice ? <InvoiceStatusBadge status={invoice.status} /> : null}
          </div>

          {isLoading ? (
            <FinanceSectionSpinner />
          ) : isError ? (
            <FinanceErrorState message="Failed to load invoice." onRetry={() => void refetch()} />
          ) : invoice ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <DetailField label="Issue Date" value={invoice.issue_date} />
                <DetailField label="Due Date" value={invoice.due_date} />
                <DetailField
                  label="Total"
                  value={formatCurrency(invoice.total_amount, invoice.currency_code)}
                />
                <DetailField
                  label="Outstanding"
                  value={formatCurrency(invoice.outstanding_amount, invoice.currency_code)}
                />
              </div>

              <div className="overflow-x-auto rounded-lg border border-stroke-default">
                <Table>
                  <TableHeader>
                    <TableRow className="border-stroke-default hover:bg-transparent">
                      <TableHead className="px-3">Description</TableHead>
                      <TableHead className="px-3 text-right">Qty</TableHead>
                      <TableHead className="px-3 text-right">Unit Price</TableHead>
                      <TableHead className="px-3 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.line_items.map((line) => (
                      <TableRow key={line.id} className="border-stroke-default">
                        <TableCell className="px-3 py-2 text-xs text-content-primary">
                          {line.description}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-mono text-xs text-content-tertiary">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-mono text-xs text-content-tertiary">
                          {formatCurrency(line.unit_price, invoice.currency_code)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-mono text-xs text-content-primary">
                          {formatCurrency(line.line_total, invoice.currency_code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end gap-1 text-xs text-content-tertiary">
                <span>
                  Subtotal:{" "}
                  <span className="text-content-primary">
                    {formatCurrency(invoice.subtotal_amount, invoice.currency_code)}
                  </span>
                </span>
                <span>
                  Tax ({invoice.tax_rate}%):{" "}
                  <span className="text-content-primary">
                    {formatCurrency(invoice.tax_amount, invoice.currency_code)}
                  </span>
                </span>
              </div>

              {invoice.notes ? (
                <div className="flex flex-col gap-1 rounded-lg bg-surface-hover p-3">
                  <span className="text-[11px] font-medium text-content-quaternary uppercase">
                    Notes
                  </span>
                  <p className="text-xs text-content-secondary">{invoice.notes}</p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailField({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] leading-[15.4px] text-content-quaternary">{label}</span>
      <span className="text-[12px] leading-[18px] font-medium text-content-primary">{value}</span>
    </div>
  )
}
