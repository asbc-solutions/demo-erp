"use client"

import { useState } from "react"
import {
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
  Eye,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import type { PositionListItem, PositionStatus, VacancyStatus } from "../../lib/types"
import { usePositions } from "../../lib/queries/positions"
import { useClosePosition } from "../../lib/mutations/positions"
import type { HrFilterGroup, HrFilterValues } from "../shared/hr-filter-panel"
import { HrToolbar } from "../shared/hr-toolbar"
import { CreatePositionDialog } from "./create-position-dialog"
import { EditPositionDialog } from "./edit-position-dialog"
import { PositionDetailSheet } from "./position-detail-sheet"

// ─── Status badges ────────────────────────────────────────────────────────────

const POSITION_STATUS_BADGE: Record<PositionStatus, string> = {
  open: "border-brand-success/30 bg-brand-success/10 text-brand-success",
  filled: "border-brand-primary/30 bg-brand-primary/10 text-brand-primary",
  frozen: "border-brand-warning/30 bg-brand-warning/10 text-brand-warning",
  closed: "border-stroke-default bg-surface-hover text-content-tertiary",
  on_hold: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
}

const POSITION_STATUS_OPTIONS: readonly PositionStatus[] = [
  "open",
  "filled",
  "frozen",
  "on_hold",
  "closed",
]

const VACANCY_OPTIONS: readonly VacancyStatus[] = ["open", "partial", "filled"]

function PositionStatusBadge({ status }: { status: PositionStatus }) {
  const t = useTranslations("HrShared")
  const known = status in POSITION_STATUS_BADGE ? status : "closed"
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase",
        POSITION_STATUS_BADGE[known],
      )}
    >
      {t(`positionStatus.${known}`)}
    </Badge>
  )
}

function VacancyBadge({ status }: { status: VacancyStatus }) {
  const t = useTranslations("HrShared")
  if (status === "filled") {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-brand-success text-white inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
      >
        <UserCheck className="size-3" />
        {t("vacancyStatus.filled")}
      </Badge>
    )
  }
  if (status === "partial") {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-brand-warning text-white inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
      >
        <UserMinus className="size-3" />
        {t("vacancyStatus.partial")}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-transparent bg-brand-danger text-white inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
    >
      <UserX className="size-3" />
      {t("vacancyStatus.open")}
    </Badge>
  )
}

function HeadcountCell({ filled, budget }: { filled: number; budget: number }) {
  const percent = budget === 0 ? 0 : (filled / budget) * 100
  const indicator =
    percent >= 100
      ? "bg-brand-success"
      : percent >= 50
        ? "bg-brand-warning"
        : "bg-brand-danger"

  return (
    <div className="flex w-28 flex-col gap-1">
      <span className="text-content-primary text-sm font-medium">
        {filled}
        <span className="text-content-quaternary"> / {budget}</span>
      </span>
      <span className="bg-stroke-default relative block h-1 w-full overflow-hidden rounded-full">
        <span
          aria-hidden
          className={cn("absolute inset-y-0 inset-s-0 rounded-full", indicator)}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </span>
    </div>
  )
}

function PositionsTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="ps-6">
            <Skeleton className="h-4 w-44" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <div className="flex w-28 flex-col gap-1.5">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16 rounded-md" />
          </TableCell>
          <TableCell className="pe-6 text-end">
            <Skeleton className="ms-auto h-7 w-7 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

export function PositionsTab() {
  const t = useTranslations("HrPositions")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [createOpen, setCreateOpen] = useState(false)

  const [detailPosition, setDetailPosition] = useState<PositionListItem | null>(null)
  const [editPosition, setEditPosition] = useState<PositionListItem | null>(null)
  const [archivePosition, setArchivePosition] = useState<PositionListItem | null>(null)

  const { data, isLoading } = usePositions(search ? { search } : undefined)
  const positions = data?.data ?? []
  const closePosition = useClosePosition()

  const filterGroups: readonly HrFilterGroup[] = [
    {
      id: "status",
      label: tCommon("status"),
      options: POSITION_STATUS_OPTIONS.map((value) => ({
        value,
        label: tShared(`positionStatus.${value}`),
      })),
    },
    {
      id: "vacancy",
      label: t("vacancy"),
      options: VACANCY_OPTIONS.map((value) => ({
        value,
        label: tShared(`vacancyStatus.${value}`),
      })),
    },
  ]

  const statusFilter = filters.status ?? []
  const vacancyFilter = filters.vacancy ?? []
  const filtered = positions.filter((pos) => {
    if (
      statusFilter.length > 0 &&
      !statusFilter.includes(pos.position_status)
    ) {
      return false
    }
    if (
      vacancyFilter.length > 0 &&
      !vacancyFilter.includes(pos.vacancy_status)
    ) {
      return false
    }
    return true
  })

  const handleArchiveConfirm = () => {
    if (!archivePosition) return
    closePosition.mutate(archivePosition.id, {
      onSuccess: () => {
        toast.success(t("archivedToast", { title: archivePosition.position_title }))
        setArchivePosition(null)
      },
      onError: (err) => {
        const apiErr = err as unknown as { code?: string; message?: string; details?: Record<string, unknown> }
        if (apiErr.code === "CONFLICT") {
          const count = apiErr.details?.assigned_employees as number | undefined
          toast.error(t("cannotArchive"), {
            description:
              typeof count === "number"
                ? t("hasAssignedEmployees", { count })
                : t("hasSomeAssignedEmployees"),
          })
        } else {
          toast.error(t("archiveFailed"), {
            description: apiErr.message,
          })
        }
        setArchivePosition(null)
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <HrToolbar
        primary={
          <Button
            variant="primary"
            className="rounded-[10px]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus />
            {t("createPosition")}
          </Button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        filterGroups={filterGroups}
        filterValues={filters}
        onFilterChange={setFilters}
      />

      <div className="border-stroke-default bg-surface-white overflow-hidden rounded-[12px] border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6">{t("colTitle")}</TableHead>
              <TableHead>{t("colCode")}</TableHead>
              <TableHead>{t("colHeadcount")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{t("vacancy")}</TableHead>
              <TableHead className="pe-6 text-end">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <PositionsTableSkeleton />
          ) : (
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-content-tertiary py-12 text-center text-sm"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((pos) => (
                <TableRow key={pos.id}>
                  <TableCell className="ps-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-content-primary text-sm font-medium">
                        {pos.position_title}
                      </span>
                      {!pos.is_budgeted && (
                        <span className="text-content-quaternary inline-flex items-center gap-1 text-[11px]">
                          <Lock className="size-3" strokeWidth={2} />
                          {t("unbudgeted")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-content-tertiary font-mono text-sm">
                    {pos.position_code}
                  </TableCell>
                  <TableCell>
                    <HeadcountCell
                      filled={pos.headcount_filled}
                      budget={pos.headcount_budget}
                    />
                  </TableCell>
                  <TableCell>
                    <PositionStatusBadge status={pos.position_status} />
                  </TableCell>
                  <TableCell>
                    <VacancyBadge status={pos.vacancy_status} />
                  </TableCell>
                  <TableCell className="pe-6 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("actionsFor", { title: pos.position_title })}
                          className="text-content-tertiary hover:text-content-primary mx-auto"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[170px]">
                        <DropdownMenuItem
                          onSelect={() => setDetailPosition(pos)}
                          className="gap-2"
                        >
                          <Eye className="size-4" strokeWidth={1.75} />
                          {t("viewDetails")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setEditPosition(pos)}
                          className="gap-2"
                          disabled={pos.position_status === "closed"}
                        >
                          <Pencil className="size-4" strokeWidth={1.75} />
                          {t("editPosition")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="danger"
                          onSelect={() => setArchivePosition(pos)}
                          className="gap-2"
                          disabled={
                            pos.position_status === "closed" ||
                            closePosition.isPending
                          }
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
                          {t("archive")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* ── Dialogs & sheets ───────────────────────────────────────────── */}

      <CreatePositionDialog open={createOpen} onOpenChange={setCreateOpen} />

      <PositionDetailSheet
        position={detailPosition}
        open={!!detailPosition}
        onOpenChange={(open) => { if (!open) setDetailPosition(null) }}
      />

      <EditPositionDialog
        position={editPosition}
        open={!!editPosition}
        onOpenChange={(open) => { if (!open) setEditPosition(null) }}
      />

      <AlertDialog
        open={!!archivePosition}
        onOpenChange={(open) => { if (!open) setArchivePosition(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("archiveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich("archiveDescription", {
                title: archivePosition?.position_title ?? "",
                strong: (chunks) => (
                  <strong className="text-content-primary">{chunks}</strong>
                ),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className="bg-brand-danger text-white hover:bg-brand-danger/90"
            >
              {t("archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
