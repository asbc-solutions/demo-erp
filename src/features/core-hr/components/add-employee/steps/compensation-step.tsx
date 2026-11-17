"use client"

import { useTranslations } from "next-intl"

import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Textarea } from "@/src/shared/components/ui/textarea"

import { useFieldError } from "../../../lib/hooks/use-field-error"
import type { ContractType, NewEmployeeDraft } from "../../../types/employee"
import { StepShell } from "../step-shell"

export type CompensationField =
  | "grossAnnual"
  | "contractType"
  | "contractStart"
  | "contractEnd"
  | "notes"

export type CompensationErrors = Partial<Record<CompensationField, string>>

type CompensationStepProps = Readonly<{
  value: NewEmployeeDraft["compensation"]
  onChange: (next: NewEmployeeDraft["compensation"]) => void
  errors?: CompensationErrors
}>

function RequiredLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span>
      {children} <span className="text-brand-danger">*</span>
    </span>
  )
}

export function CompensationStep({
  value,
  onChange,
  errors = {},
}: CompensationStepProps) {
  const t = useTranslations("HrAddEmployee")
  const tCommon = useTranslations("Common")
  const fieldError = useFieldError()
  return (
    <StepShell
      title={t("compensationStepTitle")}
      description={t("compensationStepDescription")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="grossAnnual">
            <RequiredLabel>{t("grossSalaryAnnual")}</RequiredLabel>
          </FieldLabel>
          <div className="relative">
            <span
              aria-hidden
              className="text-content-quaternary pointer-events-none absolute top-1/2 inset-s-3 -translate-y-1/2 text-sm"
            >
              EGP
            </span>
            <Input
              id="grossAnnual"
              type="number"
              min={0}
              placeholder="950000"
              className="ps-12"
              aria-invalid={Boolean(errors.grossAnnual)}
              aria-describedby={
                errors.grossAnnual ? "grossAnnual-error" : undefined
              }
              value={value.grossAnnual ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  grossAnnual:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                })
              }
            />
          </div>
          {errors.grossAnnual && (
            <FieldError id="grossAnnual-error">
              {fieldError(errors.grossAnnual)}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="contractType">
            <RequiredLabel>{t("contractType")}</RequiredLabel>
          </FieldLabel>
          <Select
            value={value.contractType}
            onValueChange={(next) =>
              onChange({ ...value, contractType: next as ContractType })
            }
          >
            <SelectTrigger
              id="contractType"
              aria-invalid={Boolean(errors.contractType)}
              aria-describedby={
                errors.contractType ? "contractType-error" : undefined
              }
            >
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERMANENT">{t("contractPermanent")}</SelectItem>
              <SelectItem value="FIXED_TERM">{t("contractFixedTerm")}</SelectItem>
              <SelectItem value="PROBATION">{t("contractProbation")}</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractType && (
            <FieldError id="contractType-error">
              {fieldError(errors.contractType)}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="contractStart">
            <RequiredLabel>{t("contractStartDate")}</RequiredLabel>
          </FieldLabel>
          <Input
            id="contractStart"
            type="date"
            aria-invalid={Boolean(errors.contractStart)}
            aria-describedby={
              errors.contractStart ? "contractStart-error" : undefined
            }
            value={value.contractStart ?? ""}
            onChange={(event) =>
              onChange({ ...value, contractStart: event.target.value })
            }
          />
          {errors.contractStart && (
            <FieldError id="contractStart-error">
              {fieldError(errors.contractStart)}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="contractEnd">{t("contractEndDate")}</FieldLabel>
          <Input
            id="contractEnd"
            type="date"
            value={value.contractEnd ?? ""}
            onChange={(event) =>
              onChange({ ...value, contractEnd: event.target.value })
            }
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="notes">{tCommon("notes")}</FieldLabel>
        <Textarea
          id="notes"
          rows={3}
          placeholder={t("additionalNotesPlaceholder")}
          value={value.notes ?? ""}
          onChange={(event) =>
            onChange({ ...value, notes: event.target.value })
          }
        />
      </Field>
    </StepShell>
  )
}
