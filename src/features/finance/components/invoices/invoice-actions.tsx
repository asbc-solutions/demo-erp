"use client"

import { Ban, Eye, MoreHorizontal, Send, Wallet } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"

import type { FinanceInvoiceListItem } from "../../lib/types"

export function InvoiceActions({
  invoice,
  canManage,
  onView,
  onSend,
  onMarkPaid,
  onCancel,
}: Readonly<{
  invoice: FinanceInvoiceListItem
  canManage: boolean
  onView: () => void
  onSend: () => void
  onMarkPaid: () => void
  onCancel: () => void
}>) {
  const canSend = canManage && invoice.status === "draft"
  const canMarkPaid = canManage && (invoice.status === "sent" || invoice.status === "overdue")
  const canCancel = canManage && invoice.status !== "paid" && invoice.status !== "cancelled"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${invoice.invoice_number}`}
          className="text-content-tertiary"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye aria-hidden />
          View details
        </DropdownMenuItem>
        {canSend || canMarkPaid || canCancel ? <DropdownMenuSeparator /> : null}
        {canSend ? (
          <DropdownMenuItem onSelect={onSend}>
            <Send aria-hidden />
            Send invoice
          </DropdownMenuItem>
        ) : null}
        {canMarkPaid ? (
          <DropdownMenuItem onSelect={onMarkPaid}>
            <Wallet aria-hidden />
            Record payment
          </DropdownMenuItem>
        ) : null}
        {canCancel ? (
          <DropdownMenuItem variant="danger" onSelect={onCancel}>
            <Ban aria-hidden />
            Cancel invoice
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
