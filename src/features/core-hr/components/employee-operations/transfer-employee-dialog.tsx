"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, ArrowLeftRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/src/shared/components/ui/button"
import { Checkbox } from "@/src/shared/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/shared/components/ui/dialog"
import { FieldError } from "@/src/shared/components/ui/field"
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

import {
  usePreviewEmployeeTransfer,
  useTransferEmployee,
  useUndoOperation,
} from "../../lib/mutations/employee-operations"
import { useCostCenters } from "../../lib/queries/cost-centers"
import { useEmployee } from "../../lib/queries/employees"
import {
  useActiveBranchOptions,
  useActiveDepartmentOptions,
} from "../../lib/queries/org-selectors"
import type { EmployeeListItem } from "../../lib/types"
import {
  ComparisonTable,
  EmployeeChip,
  OperationResult,
  OperationStepper,
} from "./operation-wizard"

type TransferEmployeeDialogProps = Readonly<{
  employee: EmployeeListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewProfile?: (employeeId: string) => void
}>

type TransferField =
  | "target_branch_id"
  | "target_dept_id"
  | "target_cost_centre_id"
  | "effective_date"
  | "reason"

type TransferFieldErrors = Partial<Record<TransferField, string>>

type OperationsTranslator = ReturnType<
  typeof useTranslations<"HrEmployeeOperations">
>

const STEP_KEYS = [
  "stepSelectDestination",
  "stepReviewDetails",
  "stepResult",
] as const

// `value` is what the API stores, so it stays English; only the label is translated.
const TRANSFER_REASONS = [
  { value: "Team realignment", labelKey: "teamRealignment" },
  { value: "Restructuring", labelKey: "restructuring" },
  { value: "Employee request", labelKey: "employeeRequest" },
  { value: "Promotion", labelKey: "promotion" },
  { value: "Performance", labelKey: "performance" },
  { value: "Other", labelKey: "other" },
] as const

const FIELD_LABEL = {
  target_branch_id: "branch",
  target_dept_id: "department",
  target_cost_centre_id: "costCenter",
  effective_date: "effectiveDate",
  reason: "transferReason",
} as const satisfies Record<TransferField, string>

function today() {
  return new Date().toISOString().slice(0, 10)
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string")
    return typeof first === "string" ? first : null
  }
  return null
}

function normalizeTransferField(field: string): TransferField | null {
  const normalized = field.replace(/^payload\./, "")
  if (normalized === "target_cost_center_id") return "target_cost_centre_id"
  if (normalized in FIELD_LABEL) return normalized as TransferField
  return null
}

function fieldErrorsFromApi(err: unknown): TransferFieldErrors {
  const apiErr = err as Partial<ApiError>
  const details = apiErr.details as
    | { fields?: Record<string, unknown>; errors?: Record<string, unknown> }
    | undefined
  const fields = details?.fields ?? details?.errors
  if (!fields) return {}

  return Object.entries(fields).reduce<TransferFieldErrors>(
    (acc, [field, value]) => {
      const key = normalizeTransferField(field)
      const message = firstMessage(value)
      if (key && message) acc[key] = message
      return acc
    },
    {},
  )
}

function fieldSummary(errors: TransferFieldErrors, t: OperationsTranslator) {
  return Object.entries(errors)
    .map(
      ([field, message]) =>
        `${t(FIELD_LABEL[field as TransferField])}: ${message}`,
    )
    .join(" ")
}

export function TransferEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onViewProfile,
}: TransferEmployeeDialogProps) {
  const t = useTranslations("HrEmployeeOperations")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const [step, setStep] = useState(0)
  const [branchId, setBranchId] = useState("")
  const [deptId, setDeptId] = useState("")
  const [costCentreId, setCostCentreId] = useState("")
  const [effectiveDate, setEffectiveDate] = useState(today())
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [notifyEmployee, setNotifyEmployee] = useState(true)
  const [notifyManager, setNotifyManager] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<TransferFieldErrors>({})
  const [submitError, setSubmitError] = useState("")

  const previewTransfer = usePreviewEmployeeTransfer()
  const transferEmployee = useTransferEmployee()
  const undoOperation = useUndoOperation()

  const { data: branchesData } = useActiveBranchOptions({ enabled: open })
  const { data: deptsData, isPending: deptsPending } =
    useActiveDepartmentOptions({ enabled: open })
  const { data: ccData } = useCostCenters({
    fiscal_year: new Date().getFullYear(),
    per_page: 200,
    is_active: true,
  }, { enabled: open })
  const { data: detail } = useEmployee(open && employee ? employee.id : "")

  const branches = branchesData?.data ?? []
  const departments = deptsData?.data ?? []
  const costCentres = ccData?.data ?? []

  const branchDepts = departments.filter(
    (d) => !branchId || d.branch_id === branchId,
  )
  const branchHasNoDepartments =
    Boolean(branchId) && !deptsPending && branchDepts.length === 0
  const availableCostCentres = costCentres.filter(
    (c) =>
      (!branchId || c.branch_id === branchId) &&
      (!deptId || c.dept_id === deptId),
  )

  const nameOf = {
    branch: (id?: string | null) =>
      branches.find((b) => b.id === id)?.branch_name ?? "-",
    dept: (id?: string | null) =>
      departments.find((d) => d.id === id)?.dept_name ?? "-",
    cc: (id?: string | null) => {
      const c = costCentres.find((x) => x.id === id)
      return c ? `${c.cc_code} - ${c.cc_name}` : "-"
    },
  }

  const transferPayload = useMemo(
    () => ({
      target_branch_id: branchId,
      target_dept_id: deptId,
      target_cost_centre_id: costCentreId || null,
      effective_date: effectiveDate,
      reason,
      notes: notes.trim() || null,
      notify_employee: notifyEmployee,
      notify_manager: notifyManager,
    }),
    [
      branchId,
      costCentreId,
      deptId,
      effectiveDate,
      notes,
      notifyEmployee,
      notifyManager,
      reason,
    ],
  )

  const clearFieldError = (field: TransferField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setSubmitError("")
  }

  const validateStep = () => {
    const nextErrors: TransferFieldErrors = {}
    const selectedDept = departments.find((d) => d.id === deptId)
    const selectedCostCentre = costCentres.find((c) => c.id === costCentreId)

    if (!branchId) nextErrors.target_branch_id = t("errSelectBranch")
    if (!deptId) nextErrors.target_dept_id = t("errSelectDepartment")
    if (!effectiveDate) nextErrors.effective_date = t("errSelectEffectiveDate")
    if (!reason) nextErrors.reason = t("errSelectReason")

    if (selectedDept && selectedDept.branch_id !== branchId) {
      nextErrors.target_dept_id = t("errDeptNotInBranch")
    }

    if (
      selectedCostCentre &&
      (selectedCostCentre.branch_id !== branchId ||
        selectedCostCentre.dept_id !== deptId)
    ) {
      nextErrors.target_cost_centre_id = t("errCostCenterMismatch")
    }

    setFieldErrors(nextErrors)
    return nextErrors
  }

  const handleTransferError = (err: unknown) => {
    const apiErr = err as Partial<ApiError>
    const apiFieldErrors = fieldErrorsFromApi(err)
    const summary = fieldSummary(apiFieldErrors, t)
    const message = summary || apiErr.message || t("checkTransferDetails")

    if (Object.keys(apiFieldErrors).length > 0) {
      setFieldErrors(apiFieldErrors)
      setSubmitError("")
      setStep(0)
      toast.error(t("transferNeedsAttention"), {
        description: summary,
      })
      return
    }

    setSubmitError(message)
    toast.error(t("transferFailed"), {
      description: message,
    })
  }

  const reset = () => {
    setStep(0)
    setBranchId("")
    setDeptId("")
    setCostCentreId("")
    setEffectiveDate(today())
    setReason("")
    setNotes("")
    setNotifyEmployee(true)
    setNotifyManager(true)
    setFieldErrors({})
    setSubmitError("")
    previewTransfer.reset()
    transferEmployee.reset()
    undoOperation.reset()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const goToReview = () => {
    if (!employee) return
    const nextErrors = validateStep()
    if (Object.keys(nextErrors).length > 0) return

    previewTransfer.mutate(
      {
        employeeId: employee.id,
        payload: transferPayload,
      },
      {
        onSuccess: () => {
          setSubmitError("")
          setStep(1)
        },
        onError: handleTransferError,
      },
    )
  }

  const submit = () => {
    if (!employee) return
    transferEmployee.mutate(
      {
        employeeId: employee.id,
        payload: transferPayload,
      },
      {
        onSuccess: () => setStep(2),
        onError: handleTransferError,
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
              {t("transferTitle")}
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
            accent="primary"
          />

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <p className="text-content-tertiary text-[11px] font-semibold tracking-[0.4px] uppercase">
                {t("newAssignment")}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                    {t("branch")}
                  </Label>
                  <Select
                    value={branchId}
                    onValueChange={(v) => {
                      setBranchId(v)
                      setDeptId("")
                      setCostCentreId("")
                      clearFieldError("target_branch_id")
                      clearFieldError("target_dept_id")
                      clearFieldError("target_cost_centre_id")
                    }}
                  >
                    <SelectTrigger
                      className="h-10 rounded-md text-sm"
                      aria-invalid={Boolean(fieldErrors.target_branch_id)}
                    >
                      <SelectValue placeholder={t("selectBranch")} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.target_branch_id && (
                    <FieldError>{fieldErrors.target_branch_id}</FieldError>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                    {t("department")}
                  </Label>
                  <Select
                    value={deptId}
                    onValueChange={(v) => {
                      setDeptId(v)
                      setCostCentreId("")
                      clearFieldError("target_dept_id")
                      clearFieldError("target_cost_centre_id")
                    }}
                    disabled={!branchId}
                  >
                    <SelectTrigger
                      className="h-10 rounded-md text-sm"
                      aria-invalid={Boolean(fieldErrors.target_dept_id)}
                    >
                      <SelectValue
                        placeholder={
                          !branchId
                            ? t("selectBranchFirst")
                            : branchHasNoDepartments
                              ? t("noDepartmentsAvailable")
                              : t("selectDepartment")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branchDepts.length === 0 ? (
                        <div className="text-content-tertiary px-2 py-1.5 text-sm">
                          {deptsPending
                            ? t("loadingDepartments")
                            : t("noDepartmentsInBranch")}
                        </div>
                      ) : (
                        branchDepts.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.dept_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {fieldErrors.target_dept_id && (
                    <FieldError>{fieldErrors.target_dept_id}</FieldError>
                  )}
                  {branchHasNoDepartments && !fieldErrors.target_dept_id && (
                    <p className="text-content-tertiary text-xs leading-4">
                      {t("noDepartmentsInBranchHint")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {t("costCenter")}
                </Label>
                <Select
                  value={costCentreId}
                  onValueChange={(v) => {
                    setCostCentreId(v)
                    clearFieldError("target_cost_centre_id")
                  }}
                  disabled={!deptId}
                >
                  <SelectTrigger
                    className="h-10 rounded-md text-sm"
                    aria-invalid={Boolean(fieldErrors.target_cost_centre_id)}
                  >
                    <SelectValue
                      placeholder={
                        deptId ? t("selectCostCenter") : t("selectDepartmentFirst")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCostCentres.length === 0 ? (
                      <div className="text-content-tertiary px-2 py-1.5 text-sm">
                        {t("noCostCenters")}
                      </div>
                    ) : (
                      availableCostCentres.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.cc_code} - {c.cc_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fieldErrors.target_cost_centre_id && (
                  <FieldError>{fieldErrors.target_cost_centre_id}</FieldError>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                    {t("effectiveDate")}
                  </Label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => {
                      setEffectiveDate(e.target.value)
                      clearFieldError("effective_date")
                    }}
                    className="h-10 rounded-md text-sm"
                    aria-invalid={Boolean(fieldErrors.effective_date)}
                  />
                  {fieldErrors.effective_date && (
                    <FieldError>{fieldErrors.effective_date}</FieldError>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                    {t("transferReason")}
                  </Label>
                  <Select
                    value={reason}
                    onValueChange={(v) => {
                      setReason(v)
                      clearFieldError("reason")
                    }}
                  >
                    <SelectTrigger
                      className="h-10 rounded-md text-sm"
                      aria-invalid={Boolean(fieldErrors.reason)}
                    >
                      <SelectValue placeholder={t("selectReason")} />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFER_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {t(`transferReasons.${r.labelKey}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.reason && (
                    <FieldError>{fieldErrors.reason}</FieldError>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
                  {tCommon("notes")}{" "}
                  <span className="normal-case">({tCommon("optional")})</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("additionalNotes")}
                  rows={2}
                  className="resize-none rounded-md text-sm"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-content-tertiary text-sm">
                {t("transferReview")}
              </p>
              {submitError && (
                <div className="border-brand-danger/30 bg-brand-danger/5 text-brand-danger rounded-[10px] border px-3 py-2 text-sm">
                  {submitError}
                </div>
              )}
              <ComparisonTable
                nextLabel={t("afterTransfer")}
                rows={[
                  {
                    label: t("branch"),
                    current: nameOf.branch(detail?.employment.branch_id),
                    next: nameOf.branch(branchId),
                  },
                  {
                    label: t("department"),
                    current: nameOf.dept(detail?.employment.dept_id),
                    next: nameOf.dept(deptId),
                  },
                  {
                    label: t("costCenter"),
                    current: "-",
                    next: costCentreId ? nameOf.cc(costCentreId) : t("unchanged"),
                  },
                  {
                    label: t("manager"),
                    current: detail?.employment.manager_id
                      ? t("currentManager")
                      : "-",
                    next: t("tbd"),
                  },
                ]}
              />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={notifyEmployee}
                    onCheckedChange={(v) => setNotifyEmployee(v === true)}
                  />
                  {t("notifyEmployee")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={notifyManager}
                    onCheckedChange={(v) => setNotifyManager(v === true)}
                  />
                  {t("notifyManager")}
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <OperationResult
              title={t("transferConfirmed")}
              onViewProfile={
                onViewProfile ? () => onViewProfile(employee.id) : undefined
              }
              onUndo={() => {
                const operationId = transferEmployee.data?.id
                if (!operationId) return
                undoOperation.mutate(
                  { operationId, employeeId: employee.id },
                  {
                    onSuccess: () => {
                      toast.success(t("transferUndone"), {
                        description: t("transferUndoneDescription"),
                      })
                      handleOpenChange(false)
                    },
                    onError: (err) => {
                      const apiErr = err as Partial<ApiError>
                      toast.error(t("transferUndoFailed"), {
                        description:
                          apiErr.message ?? tShared("pleaseTryAgain"),
                      })
                    },
                  },
                )
              }}
              undoing={undoOperation.isPending}
              undoLabel={t("undoTransfer24h")}
              onDone={() => handleOpenChange(false)}
            >
              {t.rich("transferResult", {
                name: employee.full_name,
                branch: nameOf.branch(branchId),
                department: nameOf.dept(deptId),
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
                  disabled={previewTransfer.isPending || branchHasNoDepartments}
                  onClick={goToReview}
                >
                  {previewTransfer.isPending ? t("checking") : tCommon("next")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="rounded-[10px]"
                  disabled={transferEmployee.isPending}
                  onClick={submit}
                >
                  <ArrowLeftRight />
                  {transferEmployee.isPending
                    ? t("transferring")
                    : t("confirmTransfer")}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
