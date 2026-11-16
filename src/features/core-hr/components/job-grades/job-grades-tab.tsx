"use client"

import { useState } from "react"
import { Briefcase, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import type { JobGradeListItem } from "../../lib/types"
import { useDeleteJobGrade } from "../../lib/mutations/job-grades"
import { useJobGrades } from "../../lib/queries/job-grades"
import { apiErrorMessage, describeBlockingError } from "../../lib/utils/api-error"
import { ConfirmDeleteDialog } from "../shared/confirm-delete-dialog"

import { AddJobGradeDialog } from "./add-job-grade-dialog"
import { EditJobGradeDialog } from "./edit-job-grade-dialog"
import { JobGradeDetailSheet } from "./job-grade-detail-sheet"
import { CATEGORY_BADGE, formatK } from "./grade-meta"

type GradeCardActionsProps = Readonly<{
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}>

function GradeCardActions({ onView, onEdit, onDelete }: GradeCardActionsProps) {
  return (
    // modal={false} so the dialog/sheet it opens stays interactive (Radix gotcha).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Grade actions"
          className="text-content-tertiary -me-1 shrink-0 rounded-[8px]"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onSelect={() => onView()}>
          <Eye />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit()}>
          <Pencil />
          Edit Grade
        </DropdownMenuItem>
        <DropdownMenuItem variant="danger" onSelect={() => onDelete()}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type GradeCardProps = Readonly<{
  grade: JobGradeListItem
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}>

function GradeCard({ grade, onView, onEdit, onDelete }: GradeCardProps) {
  const { min_salary, mid_salary, max_salary, currency_code } = grade
  const range = max_salary - min_salary
  const fillPercent =
    range > 0
      ? Math.max(0, Math.min(100, ((mid_salary - min_salary) / range) * 100))
      : 50

  return (
    <article className="border-stroke-default bg-surface-page flex flex-col gap-4 rounded-[14px] border p-5">
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-content-primary text-base leading-6 font-semibold">
            {grade.grade_name}
          </h3>
          <p className="text-content-tertiary text-sm leading-5">
            Level {grade.grade_level} · {grade.grade_code}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border-transparent px-2.5 py-0.5 text-[11px] tracking-[0.4px] capitalize",
              CATEGORY_BADGE[grade.grade_category],
            )}
          >
            {grade.grade_category}
          </Badge>
          <GradeCardActions
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </header>

      {grade.description && (
        <p className="text-content-tertiary line-clamp-2 text-sm leading-5">
          {grade.description}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-content-tertiary">
            {formatK(min_salary)} {currency_code}
          </span>
          <span className="text-content-primary font-semibold">
            {formatK(mid_salary)} mid
          </span>
          <span className="text-content-tertiary">
            {formatK(max_salary)} {currency_code}
          </span>
        </div>
        <div className="bg-stroke-default relative h-2 w-full overflow-hidden rounded-full">
          <span
            aria-hidden
            className="bg-brand-primary absolute inset-y-0 inset-s-0 rounded-full transition-all"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <footer className="text-content-tertiary flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Briefcase className="size-3.5" strokeWidth={1.75} />
          {grade.annual_leave_days}d annual leave
        </span>
        <span>{grade.overtime_eligible ? "OT eligible" : "No OT"}</span>
        {grade.employee_count > 0 && (
          <span>{grade.employee_count} employees</span>
        )}
      </footer>
    </article>
  )
}

function GradeCardSkeleton() {
  return (
    <div className="border-stroke-default bg-surface-page flex flex-col gap-4 rounded-[14px] border p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function JobGradesTab() {
  const [addOpen, setAddOpen] = useState(false)
  const [detailGrade, setDetailGrade] = useState<JobGradeListItem | null>(null)
  const [editGrade, setEditGrade] = useState<JobGradeListItem | null>(null)
  const [deleteGrade, setDeleteGrade] = useState<JobGradeListItem | null>(null)

  // Delete is a soft-delete (is_active=false); filter so removed grades vanish.
  const { data, isLoading } = useJobGrades({ is_active: true })
  const grades = data?.data ?? []

  const deleteJobGrade = useDeleteJobGrade()

  const confirmDelete = () => {
    if (!deleteGrade) return
    const name = deleteGrade.grade_name
    deleteJobGrade.mutate(deleteGrade.id, {
      onSuccess: () => {
        toast.success(`Grade "${name}" deleted`)
        setDeleteGrade(null)
      },
      onError: (err) => {
        const blocked = describeBlockingError(err)
        toast.error(blocked ? "Cannot delete job grade" : "Failed to delete job grade", {
          description: blocked ?? apiErrorMessage(err),
        })
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="primary"
          className="rounded-[10px]"
          onClick={() => setAddOpen(true)}
        >
          <Plus />
          Add Grade
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <GradeCardSkeleton key={i} />
            ))
          : grades.map((grade) => (
              <GradeCard
                key={grade.id}
                grade={grade}
                onView={() => setDetailGrade(grade)}
                onEdit={() => setEditGrade(grade)}
                onDelete={() => setDeleteGrade(grade)}
              />
            ))}
      </div>

      {!isLoading && grades.length === 0 && (
        <p className="text-content-tertiary py-12 text-center text-sm">
          No job grades found. Add your first grade to get started.
        </p>
      )}

      <AddJobGradeDialog open={addOpen} onOpenChange={setAddOpen} />

      <JobGradeDetailSheet
        grade={detailGrade}
        open={!!detailGrade}
        onOpenChange={(open) => !open && setDetailGrade(null)}
      />
      <EditJobGradeDialog
        grade={editGrade}
        open={!!editGrade}
        onOpenChange={(open) => !open && setEditGrade(null)}
      />
      <ConfirmDeleteDialog
        open={!!deleteGrade}
        onOpenChange={(open) => !open && setDeleteGrade(null)}
        title="Delete Job Grade"
        description="Are you sure you want to remove this Job Grade?"
        isPending={deleteJobGrade.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
