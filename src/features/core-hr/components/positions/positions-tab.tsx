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

const POSITION_STATUS_BADGE: Record<
  PositionStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "border-brand-success/30 bg-brand-success/10 text-brand-success",
  },
  filled: {
    label: "Filled",
    className: "border-brand-primary/30 bg-brand-primary/10 text-brand-primary",
  },
  frozen: {
    label: "Frozen",
    className: "border-brand-warning/30 bg-brand-warning/10 text-brand-warning",
  },
  closed: {
    label: "Closed",
    className: "border-stroke-default bg-surface-hover text-content-tertiary",
  },
  on_hold: {
    label: "On Hold",
    className: "border-brand-danger/30 bg-brand-danger/10 text-brand-danger",
  },
}

const POSITION_STATUS_OPTIONS: readonly { value: PositionStatus; label: string }[] =
  [
    { value: "open", label: "Open" },
    { value: "filled", label: "Filled" },
    { value: "frozen", label: "Frozen" },
    { value: "on_hold", label: "On Hold" },
    { value: "closed", label: "Closed" },
  ]

const VACANCY_OPTIONS: readonly { value: VacancyStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "partial", label: "Partial" },
  { value: "filled", label: "Filled" },
]

const POSITION_FILTER_GROUPS: readonly HrFilterGroup[] = [
  { id: "status", label: "Status", options: POSITION_STATUS_OPTIONS },
  { id: "vacancy", label: "Vacancy", options: VACANCY_OPTIONS },
]

function PositionStatusBadge({ status }: { status: PositionStatus }) {
  const { label, className } =
    POSITION_STATUS_BADGE[status] ?? POSITION_STATUS_BADGE.closed
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.4px] uppercase ${className}`}
    >
      {label}
    </Badge>
  )
}

function VacancyBadge({ status }: { status: VacancyStatus }) {
  if (status === "filled") {
    return (
      <Badge
        variant="outline"
        className="border-transparent bg-brand-success text-white inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
      >
        <UserCheck className="size-3" />
        Filled
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
        Partial
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="border-transparent bg-brand-danger text-white inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
    >
      <UserX className="size-3" />
      Open
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
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<HrFilterValues>({})
  const [createOpen, setCreateOpen] = useState(false)

  const [detailPosition, setDetailPosition] = useState<PositionListItem | null>(null)
  const [editPosition, setEditPosition] = useState<PositionListItem | null>(null)
  const [archivePosition, setArchivePosition] = useState<PositionListItem | null>(null)

  const { data, isLoading } = usePositions(search ? { search } : undefined)
  const positions = data?.data ?? []
  const closePosition = useClosePosition()

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
        toast.success(`"${archivePosition.position_title}" archived`)
        setArchivePosition(null)
      },
      onError: (err) => {
        const apiErr = err as unknown as { code?: string; message?: string; details?: Record<string, unknown> }
        if (apiErr.code === "CONFLICT") {
          const count = (apiErr.details?.assigned_employees as number) ?? "some"
          toast.error("Cannot archive position", {
            description: `Position has ${count} assigned employee(s). Reassign them first.`,
          })
        } else {
          toast.error("Failed to archive position", {
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
            Create Position
          </Button>
        }
        searchValue={search}
        onSearchChange={setSearch}
        filterGroups={POSITION_FILTER_GROUPS}
        filterValues={filters}
        onFilterChange={setFilters}
      />

      <div className="border-stroke-default bg-surface-white overflow-hidden rounded-[12px] border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6">Title</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Headcount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vacancy</TableHead>
              <TableHead className="pe-6 text-end">Actions</TableHead>
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
                    No positions found.
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
                          Unbudgeted
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
                          aria-label={`Actions for ${pos.position_title}`}
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setEditPosition(pos)}
                          className="gap-2"
                          disabled={pos.position_status === "closed"}
                        >
                          <Pencil className="size-4" strokeWidth={1.75} />
                          Edit Position
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
                          Archive
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
            <AlertDialogTitle>Archive this position?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-content-primary">
                {archivePosition?.position_title}
              </strong>{" "}
              will be permanently closed and deactivated. This cannot be undone.
              Positions with assigned employees cannot be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className="bg-brand-danger text-white hover:bg-brand-danger/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
