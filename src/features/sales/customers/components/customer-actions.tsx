"use client"

import { Ban, Copy, Eye, MoreHorizontal, Pencil, ShieldCheck } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"

import type { CustomerListItem } from "../../lib/types"

export function CustomerActions({
  customer,
  canManage,
  onView,
  onEdit,
  onBlock,
  onUnblock,
}: Readonly<{
  customer: CustomerListItem
  canManage: boolean
  onView: () => void
  onEdit: () => void
  onBlock: () => void
  onUnblock: () => void
}>) {
  const copy = (value: string) => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(value).catch(() => {})
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${customer.name}`}
          className="text-content-tertiary"
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={onView}>
          <Eye aria-hidden />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => copy(customer.email)}>
          <Copy aria-hidden />
          Copy email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copy(customer.phone)}>
          <Copy aria-hidden />
          Copy phone
        </DropdownMenuItem>
        {canManage ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden />
              Edit customer
            </DropdownMenuItem>
            {customer.status === "blocked" ? (
              <DropdownMenuItem onSelect={onUnblock}>
                <ShieldCheck aria-hidden />
                Unblock customer
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem variant="danger" onSelect={onBlock}>
                <Ban aria-hidden />
                Block customer
              </DropdownMenuItem>
            )}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
