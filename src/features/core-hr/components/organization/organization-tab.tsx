"use client"

import * as React from "react"
import {
  Briefcase,
  Building2,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/components/ui/accordion"
import { Button } from "@/src/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/shared/components/ui/dropdown-menu"
import { Spinner } from "@/src/shared/components/ui/spinner"

import type { BranchListItem, Department } from "../../lib/types"
import { useDeleteBranch } from "../../lib/mutations/branches"
import { useDeleteDepartment } from "../../lib/mutations/departments"
import { useBranchHeadcount } from "../../lib/queries/branches"
import {
  useActiveBranchOptions,
  useActiveDepartmentOptions,
} from "../../lib/queries/org-selectors"
import { usePositions } from "../../lib/queries/positions"
import { apiErrorMessage, describeBlockingError } from "../../lib/utils/api-error"
import { ConfirmDeleteDialog } from "../shared/confirm-delete-dialog"
import { HrOrgListSkeleton } from "../shared/hr-loading"

import { AddBranchDialog } from "./add-branch-dialog"
import { AddDepartmentDialog } from "./add-department-dialog"
import { EditBranchDialog } from "./edit-branch-dialog"
import { EditDepartmentDialog } from "./edit-department-dialog"

const formatType = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

type OrgPanelProps = Readonly<{
  title: string
  description: string
  icon: React.ReactNode
  ctaLabel: string
  onCta?: () => void
  isLoading?: boolean
  isEmpty?: boolean
  emptyLabel: string
  children: React.ReactNode
}>

function OrgPanel({
  title,
  description,
  icon,
  ctaLabel,
  onCta,
  isLoading,
  isEmpty,
  emptyLabel,
  children,
}: OrgPanelProps) {
  return (
    <section className="border-stroke-default bg-surface-page rounded-[14px] border p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-content-primary mt-0.5 inline-flex size-5 items-center justify-center">
            {icon}
          </span>
          <div className="flex flex-col">
            <h2 className="text-content-primary text-base leading-6 font-semibold">
              {title}
            </h2>
            <p className="text-content-tertiary text-sm leading-5">
              {description}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="rounded-[10px]"
          onClick={onCta}
        >
          <Plus />
          {ctaLabel}
        </Button>
      </header>

      <div className="mt-4">
        {isLoading ? (
          <ul className="flex flex-col gap-1">
            <HrOrgListSkeleton />
          </ul>
        ) : isEmpty ? (
          <p className="text-content-tertiary py-6 text-center text-sm">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

type OrgRowActionsProps = Readonly<{
  editLabel: string
  onEdit: () => void
  onDelete: () => void
}>

function OrgRowActions({ editLabel, onEdit, onDelete }: OrgRowActionsProps) {
  return (
    // `modal={false}` so the menu doesn't lock <body> with pointer-events:none —
    // otherwise the Edit/Delete dialog it opens becomes unclickable (Radix gotcha).
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="More actions"
          className="text-content-tertiary rounded-[8px]"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onSelect={() => onEdit()}>
          <Pencil />
          {editLabel}
        </DropdownMenuItem>
        <DropdownMenuItem variant="danger" onSelect={() => onDelete()}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type OrgRowHeaderProps = Readonly<{
  icon: React.ReactNode
  title: string
  meta: string
}>

/** The clickable accordion trigger row (chevron + icon badge + title/meta). */
function OrgRowHeader({ icon, title, meta }: OrgRowHeaderProps) {
  return (
    <AccordionTrigger
      hideChevron
      className="group hover:bg-surface-white rounded-[10px] px-2 pr-12"
    >
      <ChevronRight className="text-content-quaternary size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
      <span
        aria-hidden
        className="bg-brand-primary/10 text-brand-primary flex size-9 shrink-0 items-center justify-center rounded-[10px]"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-content-primary truncate text-sm leading-5 font-semibold">
          {title}
        </span>
        <span className="text-content-tertiary truncate text-xs leading-4">
          {meta}
        </span>
      </div>
    </AccordionTrigger>
  )
}

// Fetch a wide page of positions once (shared across every department row) and
// filter client-side by dept_id.
const POSITIONS_LOOKUP_PARAMS = { per_page: 200 } as const

/** Positions assigned to a department, shown when its row is expanded. */
function DepartmentPositions({ deptId }: { deptId: string }) {
  // Source from the authoritative /positions list (the same one the Positions page
  // uses) filtered by dept_id, rather than /departments/:id/positions — that nested
  // endpoint can be out of sync and report a department as empty when it isn't.
  const { data, isLoading, isError } = usePositions(POSITIONS_LOOKUP_PARAMS)
  const positions = (data?.data ?? []).filter((p) => p.dept_id === deptId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner className="text-content-tertiary size-4" />
      </div>
    )
  }

  if (isError || positions.length === 0) {
    return (
      <p className="text-content-tertiary py-3 text-center text-xs">
        No positions in this department.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {positions.map((position) => (
        <div
          key={position.id}
          className="border-stroke-default bg-surface-white flex items-center gap-2 rounded-[10px] border px-3 py-2"
        >
          <span
            aria-hidden
            className="bg-brand-primary/10 text-brand-primary flex size-7 shrink-0 items-center justify-center rounded-full"
          >
            <Briefcase className="size-3.5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-content-primary truncate text-xs font-semibold">
              {position.position_title}
            </span>
            <span className="text-content-tertiary truncate text-[11px] leading-4">
              {position.headcount_vacant} vacant
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

type BranchRowProps = Readonly<{
  branch: BranchListItem
  branchDepts: Department[]
  onEdit: () => void
  onDelete: () => void
}>

/**
 * The list endpoint's flat `employee_count` is unreliable (always 0 in
 * practice) — the dedicated /branches/:id/headcount endpoint is the
 * authoritative source, so prefer it once it loads.
 */
function BranchRow({ branch, branchDepts, onEdit, onDelete }: BranchRowProps) {
  const { data: headcount } = useBranchHeadcount(branch.id)
  const employeeCount = headcount?.headcount_filled ?? branch.employee_count

  return (
    <AccordionItem value={branch.id} className="relative border-b-0">
      <OrgRowHeader
        icon={<Building2 className="size-4" strokeWidth={1.75} />}
        title={branch.branch_name}
        meta={`${branch.branch_code} · ${formatType(branch.branch_type)} · ${employeeCount} employees`}
      />
      <div className="absolute top-2 right-2">
        <OrgRowActions editLabel="Edit Branch" onEdit={onEdit} onDelete={onDelete} />
      </div>
      <AccordionContent className="pr-2 pl-9">
        {branchDepts.length === 0 ? (
          <p className="text-content-tertiary py-3 text-center text-xs">
            No departments in this branch.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {branchDepts.map((dept) => {
              // GET /departments/:id/positions nests headcount under `.headcount`,
              // GET /departments (list) returns it flat — check both shapes.
              const filled = dept.headcount?.filled ?? dept.headcount_filled
              return (
                <li
                  key={dept.id}
                  className="border-brand-primary bg-surface-white flex items-center gap-3 rounded-[8px] border-l-2 px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-content-primary truncate text-sm leading-5 font-semibold">
                      {dept.dept_name}
                    </span>
                    <span className="text-content-tertiary truncate text-xs leading-4">
                      {dept.dept_code} · {formatType(dept.dept_type)}
                    </span>
                  </div>
                  {typeof filled === "number" && (
                    <span className="text-content-tertiary shrink-0 text-xs">
                      {filled} people
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export function OrganizationTab() {
  const [branchDialogOpen, setBranchDialogOpen] = React.useState(false)
  const [departmentDialogOpen, setDepartmentDialogOpen] = React.useState(false)
  const [editBranch, setEditBranch] = React.useState<BranchListItem | null>(null)
  const [deleteBranch, setDeleteBranch] = React.useState<BranchListItem | null>(
    null,
  )
  const [editDept, setEditDept] = React.useState<Department | null>(null)
  const [deleteDept, setDeleteDept] = React.useState<Department | null>(null)

  // Delete is a soft-delete (is_active=false); filter to active only so a removed
  // branch/department actually disappears from the list after deletion.
  const { data: branchData, isLoading: branchesLoading } =
    useActiveBranchOptions()
  const { data: deptData, isLoading: deptsLoading } =
    useActiveDepartmentOptions()

  const branches = branchData?.data ?? []
  const departments = deptData?.data ?? []

  const deleteBranchMutation = useDeleteBranch()
  const deleteDeptMutation = useDeleteDepartment()

  const confirmDeleteBranch = () => {
    if (!deleteBranch) return
    const name = deleteBranch.branch_name
    deleteBranchMutation.mutate(deleteBranch.id, {
      onSuccess: () => {
        toast.success(`Branch "${name}" deleted`)
        setDeleteBranch(null)
      },
      onError: (err) => {
        const blocked = describeBlockingError(err)
        toast.error(blocked ? "Cannot delete branch" : "Failed to delete branch", {
          description: blocked ?? apiErrorMessage(err),
        })
      },
    })
  }

  const confirmDeleteDept = () => {
    if (!deleteDept) return
    const name = deleteDept.dept_name
    deleteDeptMutation.mutate(deleteDept.id, {
      onSuccess: () => {
        toast.success(`Department "${name}" deleted`)
        setDeleteDept(null)
      },
      onError: (err) => {
        const blocked = describeBlockingError(err)
        toast.error(
          blocked ? "Cannot delete department" : "Failed to delete department",
          {
            description: blocked ?? apiErrorMessage(err),
          },
        )
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <OrgPanel
        title="Branches"
        description="Office locations"
        icon={<Building2 className="size-5" strokeWidth={1.75} />}
        ctaLabel="Add Branch"
        onCta={() => setBranchDialogOpen(true)}
        isLoading={branchesLoading}
        isEmpty={branches.length === 0}
        emptyLabel="No branches found."
      >
        <Accordion type="multiple" className="flex flex-col">
          {branches.map((branch) => (
            <BranchRow
              key={branch.id}
              branch={branch}
              branchDepts={departments.filter(
                (d) => d.branch_id === branch.id,
              )}
              onEdit={() => setEditBranch(branch)}
              onDelete={() => setDeleteBranch(branch)}
            />
          ))}
        </Accordion>
      </OrgPanel>

      <OrgPanel
        title="Departments"
        description="Organizational units"
        icon={<Users className="size-5" strokeWidth={1.75} />}
        ctaLabel="Add Department"
        onCta={() => setDepartmentDialogOpen(true)}
        isLoading={deptsLoading}
        isEmpty={departments.length === 0}
        emptyLabel="No departments found."
      >
        <Accordion type="multiple" className="flex flex-col">
          {departments.map((dept) => (
            <AccordionItem
              key={dept.id}
              value={dept.id}
              className="relative border-b-0"
            >
              <OrgRowHeader
                icon={<Users className="size-4" strokeWidth={1.75} />}
                title={dept.dept_name}
                meta={`${dept.dept_code} · ${formatType(dept.dept_type)}`}
              />
              <div className="absolute top-2 right-2">
                <OrgRowActions
                  editLabel="Edit Department"
                  onEdit={() => setEditDept(dept)}
                  onDelete={() => setDeleteDept(dept)}
                />
              </div>
              <AccordionContent className="pr-2 pl-9">
                <DepartmentPositions deptId={dept.id} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </OrgPanel>

      <AddBranchDialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen} />
      <AddDepartmentDialog
        open={departmentDialogOpen}
        onOpenChange={setDepartmentDialogOpen}
      />

      <EditBranchDialog
        branch={editBranch}
        open={!!editBranch}
        onOpenChange={(open) => !open && setEditBranch(null)}
      />
      <EditDepartmentDialog
        department={editDept}
        open={!!editDept}
        onOpenChange={(open) => !open && setEditDept(null)}
      />

      <ConfirmDeleteDialog
        open={!!deleteBranch}
        onOpenChange={(open) => !open && setDeleteBranch(null)}
        title="Delete Branch"
        description="Are you sure you want to remove this Branch?"
        isPending={deleteBranchMutation.isPending}
        onConfirm={confirmDeleteBranch}
      />
      <ConfirmDeleteDialog
        open={!!deleteDept}
        onOpenChange={(open) => !open && setDeleteDept(null)}
        title="Delete Department"
        description="Are you sure you want to remove this Department?"
        isPending={deleteDeptMutation.isPending}
        onConfirm={confirmDeleteDept}
      />
    </div>
  )
}
