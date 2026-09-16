"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

// Read-only cross-feature import: project/task "leads" ARE HR employees (bru docs:
// `lead_employee_id` must reference an existing `employees` row, joined server-side —
// Operations has no owner list of its own). Same precedent as
// src/shared/components/layout-header.tsx importing core-hr's notifications query.
import { useEmployees } from "@/src/features/core-hr/lib/queries/employees"
import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useCreateProject } from "../lib/mutations/projects"
import type { CreateProjectPayload } from "../lib/types"

import { toastMutationError } from "./shared/operations-error-state"

type NewProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-content-tertiary flex items-center gap-1 text-xs"
    >
      {children}
      {required ? <span className="text-brand-danger">*</span> : null}
    </Label>
  )
}

export function NewProjectDialog({ open, onOpenChange }: NewProjectDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [leadEmployeeId, setLeadEmployeeId] = React.useState<string>("")
  const [start, setStart] = React.useState("")
  const [end, setEnd] = React.useState("")
  const [budget, setBudget] = React.useState("")

  const { data: employeesData } = useEmployees({ is_active: true, per_page: 200 }, { enabled: open })
  const employees = employeesData?.data ?? []
  const createProject = useCreateProject()

  const isValid = name.trim().length > 0

  const reset = () => {
    setName("")
    setDescription("")
    setLeadEmployeeId("")
    setStart("")
    setEnd("")
    setBudget("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return

    const payload: CreateProjectPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      lead_employee_id: leadEmployeeId || undefined,
      start_date: start || undefined,
      end_date: end || undefined,
      budget_amount: budget ? Number(budget) : undefined,
    }

    createProject.mutate(payload, {
      onSuccess: () => {
        toast.success("Project created.")
        handleOpenChange(false)
      },
      onError: (err) => toastMutationError(err, "Failed to create project"),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-[18px] leading-7 font-semibold">
            New Project
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="np-name" required>
                Project Name
              </FieldLabel>
              <Input
                id="np-name"
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="bg-surface-page h-9 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="np-desc">Description</FieldLabel>
              <Textarea
                id="np-desc"
                placeholder="Brief project description..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="bg-surface-page min-h-[80px] text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Lead</FieldLabel>
              <Select value={leadEmployeeId} onValueChange={setLeadEmployeeId}>
                <SelectTrigger className="bg-surface-page h-9 text-[13px]">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="np-start">Start Date</FieldLabel>
                <Input
                  id="np-start"
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="bg-surface-page h-9 text-[13px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="np-end">End Date</FieldLabel>
                <Input
                  id="np-end"
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="bg-surface-page h-9 text-[13px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="np-budget">Budget</FieldLabel>
              <Input
                id="np-budget"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="bg-surface-page h-9 text-[13px]"
              />
            </div>
          </DialogBody>
          <DialogFooter className="bg-transparent border-t-0 px-6 pt-0 pb-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full text-[12px]"
              disabled={!isValid || createProject.isPending}
            >
              {createProject.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Add Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
