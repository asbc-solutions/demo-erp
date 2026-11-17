"use client"

import { useState } from "react"
import { ArrowLeft, TrendingUp, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/src/shared/components/ui/alert"
import { Button } from "@/src/shared/components/ui/button"
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
import type { ApiError } from "@/src/shared/lib/types/api"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import {
  usePreviewEmployeePromotion,
  usePromoteEmployee,
  useUndoOperation,
} from "../../lib/mutations/employee-operations"
import { useEmployee } from "../../lib/queries/employees"
import { useJobGrades } from "../../lib/queries/job-grades"
import { usePositions } from "../../lib/queries/positions"
import { useCurrentSalary } from "../../lib/queries/salaries"
import type { EmployeeListItem, PromotePreview } from "../../lib/types"
import {
  ComparisonTable,
  EmployeeChip,
  OperationResult,
  OperationStepper,
} from "./operation-wizard"

type PromoteEmployeeDialogProps = Readonly<{
  employee: EmployeeListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewProfile?: (employeeId: string) => void
}>

const STEP_KEYS = ["stepNewPosition", "stepReviewDetails", "stepResult"] as const

function today() {
  return new Date().toISOString().slice(0, 10)
}

function money(
  value: number | null | undefined,
  currency: string,
  locale: string,
) {
  return `${currency} ${(value ?? 0).toLocaleString(locale)}`
}

export function PromoteEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onViewProfile,
}: PromoteEmployeeDialogProps) {
  const t = useTranslations("HrEmployeeOperations")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const intlLocale = useIntlLocale()
  const [step, setStep] = useState(0)
  const [targetPositionId, setTargetPositionId] = useState("")
  const [newJobGradeId, setNewJobGradeId] = useState("")
  const [newBasicSalary, setNewBasicSalary] = useState("")
  const [effectiveDate, setEffectiveDate] = useState(today())
  const [reason, setReason] = useState("")
  const [preview, setPreview] = useState<PromotePreview | null>(null)

  const previewPromotion = usePreviewEmployeePromotion()
  const promoteEmployee = usePromoteEmployee()
  const undoOperation = useUndoOperation()

  const { data: positionsData } = usePositions({ per_page: 100, is_active: true }, { enabled: open })
  const { data: gradesData } = useJobGrades({ is_active: true }, { enabled: open })
  const { data: detail } = useEmployee(open && employee ? employee.id : "")
  const { data: currentSalary } = useCurrentSalary(
    open && employee ? employee.id : "",
  )

  const positions = positionsData?.data ?? []
  const grades = gradesData?.data ?? []
  const currentBasic = currentSalary?.salary.basic_salary
  const currency = "EGP"

  const selectablePositions = positions.filter(
    (p) => p.id !== employee?.position_id,
  )

  const currentPositionName =
    positions.find((p) => p.id === detail?.employment.position_id)
      ?.position_title ?? "—"
  const currentGrade = grades.find(
    (x) => x.id === detail?.employment.job_grade_id,
  )
  const currentGradeName = currentGrade
    ? `${currentGrade.grade_code} - ${currentGrade.grade_name}`
    : "—"

  const newSalaryNum = Number(newBasicSalary)
  const deltaPct =
    currentBasic &&
    currentBasic > 0 &&
    Number.isFinite(newSalaryNum) &&
    newSalaryNum > 0
      ? ((newSalaryNum - currentBasic) / currentBasic) * 100
      : null

  const selectedPosition = positions.find((p) => p.id === targetPositionId)
  const selectedGrade = grades.find((g) => g.id === newJobGradeId)

  const canContinue =
    Boolean(targetPositionId) &&
    Boolean(newJobGradeId) &&
    Number.isFinite(newSalaryNum) &&
    newSalaryNum > 0 &&
    Boolean(effectiveDate)

  const payload = () => ({
    target_position_id: targetPositionId,
    new_job_grade_id: newJobGradeId,
    new_basic_salary: newSalaryNum,
    currency_code: currency,
    effective_date: effectiveDate,
    reason: reason.trim() || undefined,
  })

  const reset = () => {
    setStep(0)
    setTargetPositionId("")
    setNewJobGradeId("")
    setNewBasicSalary("")
    setEffectiveDate(today())
    setReason("")
    setPreview(null)
    previewPromotion.reset()
    promoteEmployee.reset()
    undoOperation.reset()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const goReview = () => {
    if (!employee || !canContinue) {
      toast.error(t("promoteIncomplete"))
      return
    }
    previewPromotion.mutate(
      { employeeId: employee.id, payload: payload() },
      {
        onSuccess: (data) => {
          setPreview(data)
          setStep(1)
        },
        onError: (err) =>
          toast.error(t("promotePreviewFailed"), {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  const submit = () => {
    if (!employee) return
    promoteEmployee.mutate(
      { employeeId: employee.id, payload: payload() },
      {
        onSuccess: () => setStep(2),
        onError: (err) =>
          toast.error(t("promoteFailed"), {
            description: (err as unknown as ApiError).message,
          }),
      },
    )
  }

  if (!employee) return null

  const salaryChange = preview?.salary_change
  const hasSalaryDelta =
    salaryChange != null &&
    salaryChange.change_amount != null &&
    salaryChange.change_pct != null
  const salaryRowNext = salaryChange
    ? hasSalaryDelta
      ? t("salaryWithDelta", {
          amount: money(salaryChange.new_basic, currency, intlLocale),
          delta: money(salaryChange.change_amount, currency, intlLocale),
          pct: salaryChange.change_pct!.toFixed(1),
        })
      : money(salaryChange.new_basic, currency, intlLocale)
    : money(newSalaryNum, currency, intlLocale)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-3 pe-8">
            <DialogTitle className="text-content-primary text-lg font-semibold">
              {t("promoteTitle")}
            </DialogTitle>
            <EmployeeChip
              initials={employee.avatar_initials}
              name={employee.full_name}
              subtitle={currentPositionName !== "—" ? currentPositionName : undefined}
            />
          </div>

          <OperationStepper
            steps={STEP_KEYS.map((key) => t(key))}
            current={step}
            accent="primary"
          />

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("stepNewPosition")}
                </Label>
                <Select value={targetPositionId} onValueChange={setTargetPositionId}>
                  <SelectTrigger className="h-10 rounded-md text-sm">
                    <SelectValue placeholder={t("selectPosition")} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectablePositions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.position_title} ({p.position_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("newJobGrade")}
                </Label>
                <Select value={newJobGradeId} onValueChange={setNewJobGradeId}>
                  <SelectTrigger className="h-10 rounded-md text-sm">
                    <SelectValue placeholder={t("selectGrade")} />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.grade_code} - {g.grade_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("salaryAdjustment")}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="text-content-quaternary absolute top-1/2 inset-s-3 -translate-y-1/2 font-mono text-xs">
                      {currency}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={newBasicSalary}
                      onChange={(e) => setNewBasicSalary(e.target.value)}
                      placeholder="40000"
                      className="h-10 rounded-md ps-12 font-mono text-sm"
                    />
                  </div>
                  {deltaPct !== null && (
                    <span
                      className={
                        deltaPct >= 0
                          ? "bg-brand-success/10 text-brand-success inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                          : "bg-brand-danger/10 text-brand-danger inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                      }
                    >
                      <TrendingUp className="size-3.5" />
                      {deltaPct >= 0 ? "+" : ""}
                      {deltaPct.toFixed(1)}%
                    </span>
                  )}
                </div>
                {currentBasic != null && (
                  <p className="text-content-tertiary text-xs">
                    {t.rich("currentSalary", {
                      amount: money(currentBasic, currency, intlLocale),
                      strong: (chunks) => (
                        <span className="text-content-primary font-medium">
                          {chunks}
                        </span>
                      ),
                    })}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("effectiveDate")}
                </Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
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
                  placeholder={t("promoteReasonPlaceholder")}
                  rows={2}
                  className="resize-none rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-content-tertiary text-sm">
                {t("promoteReview")}
              </p>
              <ComparisonTable
                nextLabel={t("afterPromotion")}
                rows={[
                  {
                    label: t("rowPosition"),
                    current: currentPositionName,
                    next: selectedPosition?.position_title ?? "—",
                  },
                  {
                    label: t("rowGrade"),
                    current: currentGradeName,
                    next:
                      preview?.band?.grade_name ??
                      (selectedGrade
                        ? `${selectedGrade.grade_code} - ${selectedGrade.grade_name}`
                        : "—"),
                  },
                  {
                    label: t("rowSalary"),
                    current: money(
                      preview?.salary_change?.previous_basic ?? currentBasic,
                      currency,
                      intlLocale,
                    ),
                    next: salaryRowNext,
                  },
                ]}
              />
              {preview?.warnings && preview.warnings.length > 0 && (
                <Alert variant="warning">
                  <TriangleAlert />
                  <AlertTitle>{t("reviewBeforeSubmitting")}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc space-y-1 ps-4">
                      {preview.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === 2 && (
            <OperationResult
              title={t("promoteCompleted")}
              onViewProfile={
                onViewProfile ? () => onViewProfile(employee.id) : undefined
              }
              onUndo={() => {
                const operationId = promoteEmployee.data?.id
                if (!operationId) return
                undoOperation.mutate(
                  { operationId, employeeId: employee.id },
                  {
                    onSuccess: () => {
                      toast.success(t("promoteUndone"), {
                        description: t("promoteUndoneDescription"),
                      })
                      handleOpenChange(false)
                    },
                    onError: (err) => {
                      const apiErr = err as Partial<ApiError>
                      toast.error(t("promoteUndoFailed"), {
                        description:
                          apiErr.message ?? tShared("pleaseTryAgain"),
                      })
                    },
                  },
                )
              }}
              undoing={undoOperation.isPending}
              onDone={() => handleOpenChange(false)}
            >
              {t.rich("promoteResult", {
                name: employee.full_name,
                position: selectedPosition?.position_title ?? "—",
                date: effectiveDate,
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
                  disabled={!canContinue || previewPromotion.isPending}
                  onClick={goReview}
                >
                  {previewPromotion.isPending ? t("checking") : tCommon("next")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="rounded-[10px]"
                  disabled={promoteEmployee.isPending}
                  onClick={submit}
                >
                  {promoteEmployee.isPending ? t("submitting") : t("confirmPromotion")}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
