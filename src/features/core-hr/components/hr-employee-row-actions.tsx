"use client"

import {
  ArrowLeftRight,
  Eye,
  MoreHorizontal,
  Pencil,
  TrendingUp,
  UserMinus,
} from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"

type EmployeeRowActionsProps = Readonly<{
  employeeName: string
  onViewProfile?: () => void
  onEditDetails?: () => void
  onPromote?: () => void
  onTransfer?: () => void
  onTerminate?: () => void
}>

export function EmployeeRowActions({
  employeeName,
  onViewProfile,
  onEditDetails,
  onPromote,
  onTransfer,
  onTerminate,
}: EmployeeRowActionsProps) {
  return (
    // modal={false} so the wizard dialog this opens stays interactive (Radix gotcha).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${employeeName}`}
          className="text-content-tertiary hover:text-content-primary mx-auto flex"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[170px]">
        <DropdownMenuItem onSelect={onViewProfile}>
          <Eye />
          View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEditDetails}>
          <Pencil />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPromote}>
          <TrendingUp />
          Promote
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onTransfer}>
          <ArrowLeftRight />
          Transfer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={onTerminate}>
          <UserMinus />
          Terminate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
