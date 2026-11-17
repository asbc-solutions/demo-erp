"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

// Read-only cross-feature import — see new-project-dialog.tsx for the precedent/rationale:
// task assignees ARE HR employees (`assignee_employee_id` FK into `employees`).
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

import { TASK_PRIORITY_OPTIONS } from "../data/operations-mock"
import { useCreateTask } from "../lib/mutations/tasks"
import { useProjects } from "../lib/queries/projects"
import type { CreateTaskPayload, TaskPriority } from "../lib/types"

import { toastMutationError } from "./shared/operations-error-state"

type NewTaskDialogProps = {
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

export function NewTaskDialog({ open, onOpenChange }: NewTaskDialogProps) {
  const t = useTranslations("OperationsNewTask")
  const tTasks = useTranslations("OperationsTasks")
  const tShared = useTranslations("OperationsShared")
  const [title, setTitle] = React.useState("")
  const [projectId, setProjectId] = React.useState("")
  const [assigneeId, setAssigneeId] = React.useState("")
  const [priority, setPriority] = React.useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = React.useState("")

  const { data: projectsData } = useProjects({ per_page: 100 }, { enabled: open })
  const projects = projectsData?.data ?? []
  const { data: employeesData } = useEmployees({ is_active: true, per_page: 200 }, { enabled: open })
  const employees = employeesData?.data ?? []
  const createTask = useCreateTask()

  const isValid = title.trim().length > 0

  const reset = () => {
    setTitle("")
    setProjectId("")
    setAssigneeId("")
    setPriority("medium")
    setDueDate("")
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return

    const payload: CreateTaskPayload = {
      title: title.trim(),
      project_id: projectId || undefined,
      assignee_employee_id: assigneeId || undefined,
      priority,
      due_date: dueDate || undefined,
    }

    createTask.mutate(payload, {
      onSuccess: () => {
        toast.success(t("created"))
        handleOpenChange(false)
      },
      onError: (err) => toastMutationError(err, t("createFailed"), tShared),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[480px] gap-0 p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-[18px] leading-7 font-semibold">
            {t("title")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="nt-title" required>
                {t("taskTitle")}
              </FieldLabel>
              <Input
                id="nt-title"
                placeholder={t("taskTitlePlaceholder")}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="bg-surface-page h-9 text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t("project")}</FieldLabel>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-surface-page h-9 text-[13px]">
                  <SelectValue placeholder={t("projectPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>{t("assignee")}</FieldLabel>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="bg-surface-page h-9 text-[13px]">
                  <SelectValue placeholder={t("assigneePlaceholder")} />
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
                <FieldLabel>{t("priority")}</FieldLabel>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as TaskPriority)}
                >
                  <SelectTrigger className="bg-surface-page h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {tTasks(`priority.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="nt-due">{t("dueDate")}</FieldLabel>
                <Input
                  id="nt-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="bg-surface-page h-9 text-[13px]"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="bg-transparent border-t-0 px-6 pt-0 pb-6">
            <Button
              type="submit"
              variant="primary"
              className="w-full text-[12px]"
              disabled={!isValid || createTask.isPending}
            >
              {createTask.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
