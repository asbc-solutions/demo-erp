"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
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
import { cn } from "@/src/shared/lib/utils/utils"

import { useLogTime } from "../../lib/mutations/time-expense"
import { useResources } from "../../lib/queries/resources"
import { useTasks } from "../../lib/queries/tasks"

type LogTimeDialogProps = {
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

type TimeType = "billable" | "nonBillable"

const TIME_TYPES: TimeType[] = ["billable", "nonBillable"]

export function LogTimeDialog({ open, onOpenChange }: LogTimeDialogProps) {
  const t = useTranslations("ProjectsMyProjects")
  const tCommon = useTranslations("Common")
  const [date, setDate] = useState(todayIso)
  const [employeeId, setEmployeeId] = useState("")
  const [taskId, setTaskId] = useState("")
  const [hours, setHours] = useState("4")
  const [type, setType] = useState<TimeType>("billable")
  const [description, setDescription] = useState("")

  const resourcesQ = useResources({ per_page: 100 }, { enabled: open })
  const tasksQ = useTasks({ per_page: 100 }, { enabled: open })
  const logTime = useLogTime()

  const employees = resourcesQ.data ?? []
  const tasks = useMemo(
    () => (tasksQ.data ?? []).filter((task) => task.status !== "done"),
    [tasksQ.data],
  )

  const reset = () => {
    setDate(todayIso())
    setEmployeeId("")
    setTaskId("")
    setHours("4")
    setType("billable")
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
    if (!taskId || !employeeId) {
      toast.error(t("missingFields"), {
        description: t("logTimeMissingDescription"),
      })
      return
    }
    const parsedHours = Number(hours)
    if (!parsedHours || parsedHours <= 0) {
      toast.error(t("logTimeEnterHours"))
      return
    }
    logTime.mutate(
      {
        task_id: taskId,
        employee_id: employeeId,
        hours: parsedHours,
        log_date: date,
        billable: type === "billable",
        note: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("timeLogged"), {
            description: t("timeLoggedDescription", {
              hours: parsedHours,
              type: t(`timeType.${type}`),
            }),
          })
          close()
        },
        onError: (err) =>
          toast.error(t("logTimeFailed"), {
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
            {t("logTimeTitle")}
          </DialogTitle>
          <DialogDescription className="text-content-tertiary text-[13px] leading-5">
            {t("logTimeDescription")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>{t("fieldEmployee")}</FieldLabel>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="h-10 text-[13px]">
                  <SelectValue
                    placeholder={
                      resourcesQ.isLoading
                        ? tCommon("loading")
                        : t("selectEmployee")
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
              <FieldLabel>{tCommon("date")}</FieldLabel>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-[13px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>{t("fieldTask")}</FieldLabel>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger className="h-10 text-[13px]">
                <SelectValue
                  placeholder={
                    tasksQ.isLoading ? tCommon("loading") : t("selectTask")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.task_id} value={task.task_id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>{t("fieldHours")}</FieldLabel>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-10 text-[13px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>{tCommon("type")}</FieldLabel>
              <div className="flex gap-2">
                {TIME_TYPES.map((option) => {
                  const active = type === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setType(option)}
                      className={cn(
                        "h-10 flex-1 rounded-lg border text-[13px] leading-5 font-medium transition-colors",
                        active
                          ? "border-brand-primary bg-brand-primary/[0.06] text-brand-primary"
                          : "border-stroke-default text-content-tertiary hover:text-content-primary",
                      )}
                    >
                      {t(`timeType.${option}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>{tCommon("description")}</FieldLabel>
            <Textarea
              placeholder={t("logTimeNotePlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[88px] text-[13px]"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-[13px]">
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={logTime.isPending}
            className="text-[13px]"
          >
            {logTime.isPending
              ? t("logging")
              : t("logHours", { hours: hours || 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
