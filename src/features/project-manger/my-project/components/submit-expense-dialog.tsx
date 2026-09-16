"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"
import type { ApiError } from "@/src/shared/lib/types/api"

import { useCreateExpense } from "../../lib/mutations/time-expense"
import { useProjects } from "../../lib/queries/projects"
import { useResources } from "../../lib/queries/resources"
import { useExpenseCategories } from "../../lib/queries/time-expense"

type SubmitExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <span className="text-content-secondary text-[13px] leading-5 font-semibold">
      {children}
      {required && <span className="text-brand-danger">*</span>}
    </span>
  )
}

export function SubmitExpenseDialog({
  open,
  onOpenChange,
}: SubmitExpenseDialogProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [date, setDate] = useState(todayIso)
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  const projectsQ = useProjects({ is_active: true, per_page: 100 }, { enabled: open })
  const resourcesQ = useResources({ per_page: 100 }, { enabled: open })
  const categoriesQ = useExpenseCategories({ enabled: open })
  const createExpense = useCreateExpense()

  const projects = projectsQ.data?.data ?? []
  const employees = resourcesQ.data ?? []
  const categories = categoriesQ.data ?? []

  const reset = () => {
    setEmployeeId("")
    setProjectId("")
    setDate(todayIso())
    setCategory("")
    setAmount("")
    setDescription("")
  }

  const close = () => {
    onOpenChange(false)
    window.setTimeout(reset, 200)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) close()
    else onOpenChange(true)
  }

  const handleSubmit = () => {
    if (!projectId || !category || !amount || !employeeId) {
      toast.error("Missing required fields", {
        description: "Employee, project, category and amount are required.",
      })
      return
    }
    createExpense.mutate(
      {
        employee_id: employeeId,
        project_id: projectId,
        category,
        amount: Number(amount),
        expense_date: date,
        billable: true,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Expense submitted", {
            description: `$${Number(amount).toLocaleString("en-US")} sent for approval.`,
          })
          close()
        },
        onError: (err) =>
          toast.error("Couldn't submit expense", {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[640px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-lg leading-7 font-semibold">
            Submit Expense
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            Submit an expense for project reimbursement
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Employee</FieldLabel>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue
                    placeholder={
                      resourcesQ.isLoading ? "Loading…" : "Select an employee"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.employee_id} value={e.employee_id}>
                      {`${e.first_name} ${e.last_name}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Project</FieldLabel>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue
                    placeholder={
                      projectsQ.isLoading ? "Loading…" : "Select a project"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Date</FieldLabel>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Category</FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue
                    placeholder={
                      categoriesQ.isLoading ? "Loading…" : "Select a category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Amount</FieldLabel>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 text-[13px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              placeholder="What is this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[88px] text-[13px]"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-[13px]">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={createExpense.isPending}
            className="text-[13px]"
          >
            {createExpense.isPending ? "Submitting…" : "Submit Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
