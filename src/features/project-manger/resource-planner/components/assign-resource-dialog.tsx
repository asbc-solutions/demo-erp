"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
import { Label } from "@/src/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ResourceRow } from "../../lib/mappers/resource-mapper"
import { useCreateAssignment } from "../../lib/mutations/resources"
import { useProjects } from "../../lib/queries/projects"
import { useTasks } from "../../lib/queries/tasks"

const assignResourceSchema = z
  .object({
    employee_id: z.string().min(1, "Select a resource"),
    task_id: z.string().min(1, "Select a task"),
    allocation_pct: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Whole percentages only")
      .min(1, "Allocate at least 1%")
      .max(100, "Cannot exceed 100%"),
    planned_hours: z
      .number({ invalid_type_error: "Must be a number" })
      .min(0, "Cannot be negative")
      .optional(),
    start_date: z.string().min(1, "Pick a start date"),
    end_date: z.string().min(1, "Pick an end date"),
  })
  .refine((values) => values.end_date >= values.start_date, {
    message: "End date must be on or after the start date",
    path: ["end_date"],
  })

type AssignResourceFormValues = z.infer<typeof assignResourceSchema>

function isoDay(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function defaultValues(employeeId?: string | null): AssignResourceFormValues {
  return {
    employee_id: employeeId ?? "",
    task_id: "",
    allocation_pct: 50,
    planned_hours: undefined,
    start_date: isoDay(0),
    end_date: isoDay(30),
  }
}

const FIELD_CLASS =
  "border-stroke-default bg-surface-white h-9 rounded-md text-sm"

type AssignResourceDialogProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The directory already loaded by the planner — the employee picker's source. */
  resources: readonly ResourceRow[]
  /** Pre-selected when the dialog is opened from a directory row. */
  defaultEmployeeId?: string | null
}>

export function AssignResourceDialog({
  open,
  onOpenChange,
  resources,
  defaultEmployeeId,
}: AssignResourceDialogProps) {
  const tasksQuery = useTasks({ per_page: 100 }, { enabled: open })
  const projectsQuery = useProjects({ per_page: 100 }, { enabled: open })

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const projectNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projectsQuery.data?.data ?? []) {
      map.set(project.id, project.name)
    }
    return map
  }, [projectsQuery.data])

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AssignResourceFormValues>({
    resolver: zodResolver(assignResourceSchema),
    defaultValues: defaultValues(defaultEmployeeId),
  })

  useEffect(() => {
    if (open) reset(defaultValues(defaultEmployeeId))
  }, [open, defaultEmployeeId, reset])

  const employeeId = useWatch({ control, name: "employee_id" })
  const taskId = useWatch({ control, name: "task_id" })
  const allocationPct = useWatch({ control, name: "allocation_pct" })

  const selectedTask = tasks.find((task) => task.task_id === taskId) ?? null
  const selectedResource =
    resources.find((resource) => resource.id === employeeId) ?? null
  const projectId = selectedTask?.project_id ?? ""

  const createAssignment = useCreateAssignment(projectId)

  const currentAllocation = selectedResource?.availabilityPct ?? null
  const projectedAllocation =
    currentAllocation == null || !Number.isFinite(allocationPct)
      ? null
      : currentAllocation + allocationPct

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset(defaultValues(null))
  }

  const onSubmit = (values: AssignResourceFormValues) => {
    createAssignment.mutate(values, {
      onSuccess: () => {
        toast.success(
          `${selectedResource?.name ?? "Resource"} assigned at ${values.allocation_pct}%`,
          {
            description: selectedTask
              ? `${selectedTask.title} · ${projectNameById.get(selectedTask.project_id) ?? "Project"}`
              : undefined,
          },
        )
        handleOpenChange(false)
      },
      onError: (error) => {
        const apiError = error as unknown as { message?: string }
        toast.error("Couldn't create the assignment", {
          description: apiError.message ?? "Please check the details and try again.",
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader className="pr-10">
            <DialogTitle>Assign Resource</DialogTitle>
            <DialogDescription>
              Book capacity for a task and set the allocation for the period.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                Resource <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={employeeId}
                onValueChange={(value) =>
                  setValue("employee_id", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className={cn(FIELD_CLASS, "w-full shadow-xs")}>
                  <SelectValue placeholder="Select a resource…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name}
                      {resource.availabilityPct == null
                        ? ""
                        : ` — ${resource.availabilityPct}% allocated`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-brand-danger text-xs">
                  {errors.employee_id.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-content-primary text-sm font-semibold">
                Task <span className="text-brand-danger">*</span>
              </Label>
              <Select
                value={taskId}
                onValueChange={(value) =>
                  setValue("task_id", value, { shouldValidate: true })
                }
                disabled={tasksQuery.isLoading}
              >
                <SelectTrigger className={cn(FIELD_CLASS, "w-full shadow-xs")}>
                  <SelectValue
                    placeholder={
                      tasksQuery.isLoading ? "Loading tasks…" : "Select a task…"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {tasks.length === 0 ? (
                    <p className="text-content-tertiary px-2 py-1.5 text-sm">
                      No tasks available.
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <SelectItem key={task.task_id} value={task.task_id}>
                        {task.title}
                        {projectNameById.has(task.project_id)
                          ? ` · ${projectNameById.get(task.project_id)}`
                          : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.task_id && (
                <p className="text-brand-danger text-xs">
                  {errors.task_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-primary text-sm font-semibold">
                  Allocation % <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("allocation_pct", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={100}
                  step={5}
                  className={cn(FIELD_CLASS, "font-mono")}
                />
                {errors.allocation_pct && (
                  <p className="text-brand-danger text-xs">
                    {errors.allocation_pct.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-primary text-sm font-semibold">
                  Planned hours
                </Label>
                <Input
                  {...register("planned_hours", {
                    setValueAs: (value) =>
                      value === "" || value == null ? undefined : Number(value),
                  })}
                  type="number"
                  min={0}
                  placeholder="Optional"
                  className={cn(FIELD_CLASS, "font-mono")}
                />
                {errors.planned_hours && (
                  <p className="text-brand-danger text-xs">
                    {errors.planned_hours.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-primary text-sm font-semibold">
                  Start date <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("start_date")}
                  type="date"
                  className={FIELD_CLASS}
                />
                {errors.start_date && (
                  <p className="text-brand-danger text-xs">
                    {errors.start_date.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-primary text-sm font-semibold">
                  End date <span className="text-brand-danger">*</span>
                </Label>
                <Input
                  {...register("end_date")}
                  type="date"
                  className={FIELD_CLASS}
                />
                {errors.end_date && (
                  <p className="text-brand-danger text-xs">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            {projectedAllocation != null && (
              <p
                className={cn(
                  "bg-surface-muted rounded-lg px-3 py-2 text-xs leading-5",
                  projectedAllocation > 100
                    ? "text-brand-danger"
                    : "text-content-tertiary",
                )}
              >
                {selectedResource?.name} is currently {currentAllocation}%
                allocated this period — this booking takes them to{" "}
                {projectedAllocation}%
                {projectedAllocation > 100 ? ", above capacity." : "."}
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4 text-sm font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createAssignment.isPending}
              className="h-9 px-4 text-sm font-semibold disabled:opacity-50"
            >
              {createAssignment.isPending ? "Assigning…" : "Assign Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
