"use client"

import { useState } from "react"
import { ArrowLeft, TriangleAlert, UserMinus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/src/shared/components/ui/alert"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
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
import { cn } from "@/src/shared/lib/utils/utils"
import type { ApiError } from "@/src/shared/lib/types/api"

import {
  usePreviewEmployeeTermination,
  useTerminateEmployee,
  useUndoOperation,
} from "../../lib/mutations/employee-operations"
import type {
  EmployeeListItem,
  EmployeeOperationPreview,
  TerminationType,
} from "../../lib/types"
import { EmployeeChip, OperationResult, OperationStepper } from "./operation-wizard"

type TerminateEmployeeDialogProps = Readonly<{
  employee: EmployeeListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewProfile?: (employeeId: string) => void
}>

const STEP_KEYS = [
  "stepTerminationDetails",
  "stepReviewConfirm",
  "stepResult",
] as const

// Labels live in `HrEmployeeOperations.terminationType.<value>`.
const TERMINATION_TYPES: readonly TerminationType[] = [
  "resignation",
  "termination",
  "contract_end",
  "retirement",
  "redundancy",
  "death",
]

function YesNo({
  value,
  onChange,
}: Readonly<{ value: boolean | null; onChange: (v: boolean) => void }>) {
  const tCommon = useTranslations("Common")
  const cls = (active: boolean) =>
    cn(
      "rounded-md border px-5 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
        : "border-stroke-input text-content-secondary hover:bg-surface-hover",
    )
  return (
    <div className="flex gap-2">
      <button type="button" className={cls(value === true)} onClick={() => onChange(true)}>
        {tCommon("yes")}
      </button>
      <button type="button" className={cls(value === false)} onClick={() => onChange(false)}>
        {tCommon("no")}
      </button>
    </div>
  )
}

export function TerminateEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onViewProfile,
}: TerminateEmployeeDialogProps) {
  const t = useTranslations("HrEmployeeOperations")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const [step, setStep] = useState(0)
  const [terminationType, setTerminationType] = useState<TerminationType | "">("")
  const [lastWorkingDay, setLastWorkingDay] = useState("")
  const [reason, setReason] = useState("")
  const [noticeServed, setNoticeServed] = useState<boolean | null>(null)
  const [eligibleRehire, setEligibleRehire] = useState<boolean | null>(null)
  const [sendLetter, setSendLetter] = useState(true)
  const [notifyHr, setNotifyHr] = useState(true)
  const [preview, setPreview] = useState<EmployeeOperationPreview | null>(null)

  const previewTermination = usePreviewEmployeeTermination()
  const terminateEmployee = useTerminateEmployee()
  const undoOperation = useUndoOperation()

  const typeLabel = terminationType
    ? t(`terminationType.${terminationType}`)
    : ""

  const canContinue =
    Boolean(terminationType) && Boolean(lastWorkingDay) && Boolean(reason.trim())

  const payload = () => ({
    termination_type: terminationType as TerminationType,
    termination_date: lastWorkingDay,
    termination_reason: reason.trim(),
    unused_leave_days: 0,
  })

  const reset = () => {
    setStep(0)
    setTerminationType("")
    setLastWorkingDay("")
    setReason("")
    setNoticeServed(null)
    setEligibleRehire(null)
    setSendLetter(true)
    setNotifyHr(true)
    setPreview(null)
    previewTermination.reset()
    terminateEmployee.reset()
    undoOperation.reset()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const goReview = () => {
    if (!employee || !canContinue) {
      toast.error(t("terminateIncomplete"))
      return
    }
    previewTermination.mutate(
      { employeeId: employee.id, payload: payload() },
      {
        onSuccess: (data) => {
          setPreview(data)
          setStep(1)
        },
        // Preview is best-effort — proceed to review even if it fails.
        onError: () => setStep(1),
      },
    )
  }

  const submit = () => {
    if (!employee) return
    terminateEmployee.mutate(
      { employeeId: employee.id, payload: payload() },
      {
        onSuccess: () => setStep(2),
        onError: (err) =>
          toast.error(t("terminateFailed"), {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-3 pe-8">
            <DialogTitle className="text-content-primary text-lg font-semibold">
              {t("terminateTitle")}
            </DialogTitle>
            <EmployeeChip
              initials={employee.avatar_initials}
              name={employee.full_name}
              subtitle={employee.employee_number}
            />
          </div>

          <OperationStepper
            steps={STEP_KEYS.map((key) => t(key))}
            current={step}
            accent="danger"
          />

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("terminationTypeLabel")}
                </Label>
                <Select
                  value={terminationType}
                  onValueChange={(v) => setTerminationType(v as TerminationType)}
                >
                  <SelectTrigger className="h-10 rounded-md text-sm">
                    <SelectValue placeholder={t("selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMINATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`terminationType.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("lastWorkingDay")}
                </Label>
                <Input
                  type="date"
                  value={lastWorkingDay}
                  onChange={(e) => setLastWorkingDay(e.target.value)}
                  className="h-10 rounded-md text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("reason")}
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("terminateReasonPlaceholder")}
                  rows={3}
                  className="resize-none rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                    {t("noticeServed")}
                  </Label>
                  <YesNo value={noticeServed} onChange={setNoticeServed} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                    {t("eligibleRehire")}
                  </Label>
                  <YesNo value={eligibleRehire} onChange={setEligibleRehire} />
                </div>
              </div>

              <Alert variant="warning">
                <TriangleAlert />
                <AlertDescription>
                  {t("terminateWarning")}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="border-brand-danger bg-brand-danger/5 flex flex-col gap-3 rounded-[12px] border-s-4 p-4">
                <div className="flex items-start gap-3">
                  <span className="bg-brand-danger/10 text-brand-danger flex size-9 shrink-0 items-center justify-center rounded-full">
                    <UserMinus className="size-5" />
                  </span>
                  <div className="flex flex-col">
                    <p className="text-brand-danger text-sm font-semibold">
                      {t("aboutToTerminate", {
                        name: employee.full_name,
                        number: employee.employee_number,
                      })}
                    </p>
                    <p className="text-content-tertiary text-xs">
                      {t("typeAndLastDay", { type: typeLabel, date: lastWorkingDay })}
                    </p>
                  </div>
                </div>
                <ul className="text-content-secondary flex flex-col gap-1.5 ps-1 text-sm">
                  <li>
                    {t.rich("systemAccessRevoked", {
                      date: lastWorkingDay,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </li>
                  <li>
                    {t.rich("benefitsDeactivated", {
                      date: lastWorkingDay,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </li>
                  <li>
                    {t("rehireEligibility")}{" "}
                    <strong>
                      {eligibleRehire === null
                        ? t("notSet")
                        : eligibleRehire
                          ? t("eligible")
                          : t("notEligible")}
                    </strong>
                  </li>
                  {(preview?.warnings ?? []).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={sendLetter}
                    onCheckedChange={(v) => setSendLetter(v === true)}
                  />
                  {t("sendTerminationLetter")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={notifyHr}
                    onCheckedChange={(v) => setNotifyHr(v === true)}
                  />
                  {t("notifyHrAdmin")}
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <OperationResult
              title={t("terminateConfirmed")}
              onViewProfile={
                onViewProfile ? () => onViewProfile(employee.id) : undefined
              }
              onUndo={() => {
                const operationId = terminateEmployee.data?.id
                if (!operationId) return
                undoOperation.mutate(
                  { operationId, employeeId: employee.id },
                  {
                    onSuccess: () => {
                      toast.success(t("terminateUndone"), {
                        description: t("terminateUndoneDescription"),
                      })
                      handleOpenChange(false)
                    },
                    onError: (err) => {
                      const apiErr = err as Partial<ApiError>
                      toast.error(t("terminateUndoFailed"), {
                        description:
                          apiErr.message ?? tShared("pleaseTryAgain"),
                      })
                    },
                  },
                )
              }}
              undoing={undoOperation.isPending}
              onDone={() => handleOpenChange(false)}
              extra={
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-brand-danger/30 bg-brand-danger/10 text-brand-danger rounded-full px-2.5 py-0.5 text-[11px]"
                  >
                    {tShared("employmentStatus.inactive")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-brand-success/30 bg-brand-success/10 text-brand-success rounded-full px-2.5 py-0.5 text-[11px]"
                  >
                    {t("archived")}
                  </Badge>
                </div>
              }
            >
              {t.rich("terminateResult", {
                name: employee.full_name,
                type: typeLabel,
                date: lastWorkingDay,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </OperationResult>
          )}

          {step < 2 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              {step === 0 ? (
                <Button
                  variant="outline"
                  className="rounded-[10px]"
                  onClick={() => handleOpenChange(false)}
                >
                  {tCommon("cancel")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-[10px]"
                  onClick={() => setStep(0)}
                >
                  <ArrowLeft className="rtl:rotate-180" />
                  {tCommon("back")}
                </Button>
              )}

              {step === 0 ? (
                <Button
                  variant="primary"
                  className="rounded-[10px]"
                  disabled={!canContinue || previewTermination.isPending}
                  onClick={goReview}
                >
                  {previewTermination.isPending ? t("checking") : tCommon("next")}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  className="rounded-[10px]"
                  disabled={terminateEmployee.isPending}
                  onClick={submit}
                >
                  <UserMinus />
                  {terminateEmployee.isPending ? t("terminating") : t("terminateTitle")}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
