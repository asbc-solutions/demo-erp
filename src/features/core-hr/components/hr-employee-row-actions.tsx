"use client"

import {
  ArrowLeftRight,
  Eye,
  MoreHorizontal,
  Pencil,
  TrendingUp,
  UserMinus,
} from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("HrEmployees")

  return (
    // modal={false} so the wizard dialog this opens stays interactive (Radix gotcha).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("actionsFor", { name: employeeName })}
          className="text-content-tertiary hover:text-content-primary mx-auto flex"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[170px]">
        <DropdownMenuItem onSelect={onViewProfile}>
          <Eye />
          {t("viewProfile")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEditDetails}>
          <Pencil />
          {t("editDetails")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onPromote}>
          <TrendingUp />
          {t("promote")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onTransfer}>
          <ArrowLeftRight />
          {t("transfer")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={onTerminate}>
          <UserMinus />
          {t("terminate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
