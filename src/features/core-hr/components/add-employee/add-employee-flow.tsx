"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"

import {
  compensationInfoSchema,
  contractStartSchema,
} from "../../lib/schema/compensation-info"
import { employmentInfoSchema } from "../../lib/schema/employment-info"
import { dateOfBirthSchema, phoneSchema } from "../../lib/schema/personal-info"
import { vk, type HrValidationKey } from "../../lib/schema/validation-key"
import {
  EMPTY_NEW_EMPLOYEE,
  type NewEmployeeDraft,
} from "../../types/employee"
import {
  ADD_EMPLOYEE_STEPS,
  AddEmployeeStepper,
  type AddEmployeeStepId,
} from "./add-employee-stepper"
import {
  CompensationStep,
  type CompensationErrors,
  type CompensationField,
} from "./steps/compensation-step"
import {
  EmploymentStep,
  type EmploymentErrors,
  type EmploymentField,
} from "./steps/employment-step"
import {
  PersonalInfoStep,
  type PersonalInfoErrors,
  type PersonalInfoField,
} from "./steps/personal-info-step"

type AddEmployeeFlowMode = "add" | "edit"

type AddEmployeeFlowProps = Readonly<{
  mode?: AddEmployeeFlowMode
  initialDraft?: NewEmployeeDraft
  submitting?: boolean
  onCancel: () => void
  onSubmit: (draft: NewEmployeeDraft) => void
}>

// Errors hold `HrValidation` keys; the step components translate them.
const REQUIRED_PERSONAL_FIELDS: ReadonlyArray<{
  key: PersonalInfoField
  message: HrValidationKey
}> = [
  { key: "firstName", message: vk("firstNameRequiredField") },
  { key: "lastName", message: vk("lastNameRequiredField") },
  { key: "email", message: vk("emailRequiredField") },
  { key: "phone", message: vk("phoneRequiredField") },
  { key: "password", message: vk("passwordRequiredField") },
  { key: "dateOfBirth", message: vk("dobRequiredField") },
  { key: "gender", message: vk("genderRequiredField") },
  { key: "nationality", message: vk("nationalityRequiredField") },
  { key: "nationalId", message: vk("nationalIdRequiredField") },
  { key: "address", message: vk("addressRequiredField") },
  { key: "city", message: vk("cityRequiredField") },
  { key: "country", message: vk("countryRequiredField") },
  { key: "postalCode", message: vk("postalCodeRequiredField") },
]

// Fields not shown in edit mode (password is never changed here; street
// address and postal code are not returned or persisted by the employee API),
// so they are neither rendered nor required when editing.
const EDIT_EXCLUDED_KEYS = new Set<PersonalInfoField>([
  "password",
  "address",
  "postalCode",
])

function validatePersonalInfo(
  personal: NewEmployeeDraft["personal"],
  mode: AddEmployeeFlowMode,
): PersonalInfoErrors {
  const required =
    mode === "edit"
      ? REQUIRED_PERSONAL_FIELDS.filter(
          (field) => !EDIT_EXCLUDED_KEYS.has(field.key),
        )
      : REQUIRED_PERSONAL_FIELDS

  const errors = required.reduce<PersonalInfoErrors>((errors, field) => {
    const value = personal[field.key]
    if (typeof value !== "string" || value.trim().length === 0) {
      errors[field.key] = field.message
    }
    return errors
  }, {})

  // Phone format (digits + optional "+"/separators) is enforced with zod.
  // Only when a value is present — an empty phone is handled by the required
  // check above (add mode) or allowed (edit mode).
  if (
    !errors.phone &&
    typeof personal.phone === "string" &&
    personal.phone.trim().length > 0
  ) {
    const result = phoneSchema.safeParse(personal.phone)
    if (!result.success) {
      errors.phone =
        result.error.issues[0]?.message ?? vk("phoneDigits")
    }
  }

  // Date of birth must be a real past date meeting the minimum working age.
  if (
    !errors.dateOfBirth &&
    typeof personal.dateOfBirth === "string" &&
    personal.dateOfBirth.trim().length > 0
  ) {
    const result = dateOfBirthSchema.safeParse(personal.dateOfBirth)
    if (!result.success) {
      errors.dateOfBirth =
        result.error.issues[0]?.message ?? vk("dobInvalid")
    }
  }

  return errors
}

function validateEmployment(
  employment: NewEmployeeDraft["employment"],
): EmploymentErrors {
  const result = employmentInfoSchema.safeParse(employment)
  if (result.success) return {}

  const errors: EmploymentErrors = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as EmploymentField | undefined
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}

function validateCompensation(
  compensation: NewEmployeeDraft["compensation"],
  hireDate: string | undefined,
): CompensationErrors {
  const errors: CompensationErrors = {}

  const requiredResult = compensationInfoSchema.safeParse(compensation)
  if (!requiredResult.success) {
    for (const issue of requiredResult.error.issues) {
      const key = issue.path[0] as CompensationField | undefined
      if (key && !errors[key]) errors[key] = issue.message
    }
  }

  const dateOrderResult = contractStartSchema.safeParse({
    hireDate: hireDate ?? "",
    contractStart: compensation.contractStart ?? "",
  })
  if (!dateOrderResult.success) {
    for (const issue of dateOrderResult.error.issues) {
      const key = issue.path[0] as CompensationField | undefined
      if (key && !errors[key]) errors[key] = issue.message
    }
  }

  return errors
}

export function AddEmployeeFlow({
  mode = "add",
  initialDraft,
  submitting = false,
  onCancel,
  onSubmit,
}: AddEmployeeFlowProps) {
  const t = useTranslations("HrAddEmployee")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const isEdit = mode === "edit"
  // Compensation is handled by the salary module, not the employee-update API,
  // so it is not part of the edit flow.
  const steps = isEdit
    ? ADD_EMPLOYEE_STEPS.filter((step) => step.id !== "compensation")
    : ADD_EMPLOYEE_STEPS

  const [stepId, setStepId] = useState<AddEmployeeStepId>("personal")
  const [draft, setDraft] = useState<NewEmployeeDraft>(
    initialDraft ?? EMPTY_NEW_EMPLOYEE,
  )
  const [personalErrors, setPersonalErrors] = useState<PersonalInfoErrors>({})
  const [employmentErrors, setEmploymentErrors] = useState<EmploymentErrors>({})
  const [compensationErrors, setCompensationErrors] =
    useState<CompensationErrors>({})

  const stepIndex = steps.findIndex((step) => step.id === stepId)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const handlePersonalChange = (next: NewEmployeeDraft["personal"]) => {
    setDraft({ ...draft, personal: next })
    if (Object.keys(personalErrors).length > 0) {
      setPersonalErrors(validatePersonalInfo(next, mode))
    }
  }

  const handleEmploymentChange = (next: NewEmployeeDraft["employment"]) => {
    setDraft({ ...draft, employment: next })
    if (Object.keys(employmentErrors).length > 0) {
      setEmploymentErrors(validateEmployment(next))
    }
  }

  const handleCompensationChange = (next: NewEmployeeDraft["compensation"]) => {
    setDraft({ ...draft, compensation: next })
    if (Object.keys(compensationErrors).length > 0) {
      setCompensationErrors(
        validateCompensation(next, draft.employment.hireDate),
      )
    }
  }

  const handleNext = () => {
    if (stepId === "personal") {
      const nextErrors = validatePersonalInfo(draft.personal, mode)
      if (Object.keys(nextErrors).length > 0) {
        setPersonalErrors(nextErrors)
        return
      }
      setPersonalErrors({})
    }

    if (stepId === "employment") {
      const nextErrors = validateEmployment(draft.employment)
      if (Object.keys(nextErrors).length > 0) {
        setEmploymentErrors(nextErrors)
        return
      }
      setEmploymentErrors({})
    }

    if (stepId === "compensation") {
      const nextErrors = validateCompensation(
        draft.compensation,
        draft.employment.hireDate,
      )
      if (Object.keys(nextErrors).length > 0) {
        setCompensationErrors(nextErrors)
        return
      }
      setCompensationErrors({})
    }

    if (isLastStep) {
      onSubmit(draft)
      return
    }
    const nextStep = steps[stepIndex + 1]
    if (nextStep) setStepId(nextStep.id)
  }

  const handleBack = () => {
    if (isFirstStep) return
    const prevStep = steps[stepIndex - 1]
    if (prevStep) setStepId(prevStep.id)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <button
        type="button"
        onClick={onCancel}
        className="text-content-tertiary hover:text-content-primary inline-flex h-8 w-fit items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" strokeWidth={1.75} />
        {t("backToEmployees")}
      </button>

      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-content-primary text-2xl leading-8 font-semibold">
          {isEdit ? t("editTitle") : t("newTitle")}
        </h1>
        <p className="text-content-tertiary text-sm leading-5">
          {isEdit ? t("editSubtitle") : t("newSubtitle")}
        </p>
      </header>

      <div className="flex w-full justify-center py-2">
        <AddEmployeeStepper current={stepId} steps={steps} />
      </div>

      <div>
        {stepId === "personal" && (
          <PersonalInfoStep
            value={draft.personal}
            onChange={handlePersonalChange}
            errors={personalErrors}
            mode={mode}
          />
        )}
        {stepId === "employment" && (
          <EmploymentStep
            value={draft.employment}
            onChange={handleEmploymentChange}
            errors={employmentErrors}
          />
        )}
        {stepId === "compensation" && (
          <CompensationStep
            value={draft.compensation}
            onChange={handleCompensationChange}
            errors={compensationErrors}
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          className="rounded-[10px]"
          onClick={handleBack}
          disabled={isFirstStep}
        >
          <ArrowLeft className="rtl:rotate-180" />
          {tCommon("back")}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-[10px]"
            onClick={onCancel}
            disabled={submitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            variant="primary"
            className="rounded-[10px]"
            onClick={handleNext}
            disabled={submitting}
          >
            {isLastStep
              ? submitting
                ? tShared("saving")
                : isEdit
                  ? tCommon("saveChanges")
                  : t("createEmployee")
              : tCommon("next")}
            {!isLastStep && <ArrowRight className="rtl:rotate-180" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
