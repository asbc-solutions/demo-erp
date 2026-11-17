"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { errorMessage } from "../../../lib/utils/api"
import { COST_CENTER_TYPES } from "../../lib/constants/planning"
import { useCreateCostCenter } from "../../lib/mutations/planning"
import type { CostCenter, PlanningMessageKey } from "../../lib/types/planning"

const NO_PARENT = "none"

/** Messages are `FinancePlanning` keys, translated where the error is rendered. */
const msg = (key: PlanningMessageKey) => key

const centerSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^CC-\d{3}$/i, msg("errCenterCode")),
  name: z.string().trim().min(1, msg("errEnglishName")),
  name_ar: z.string().trim().min(1, msg("errArabicName")),
  type: z.enum(["department", "branch", "project"]),
  parent_id: z.string(),
})
type CenterValues = z.infer<typeof centerSchema>

function NewCostCenterDialog({
  open,
  onOpenChange,
  centers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  centers: CostCenter[]
}) {
  const t = useTranslations("FinancePlanning")
  const create = useCreateCostCenter()
  const empty = React.useMemo<CenterValues>(() => ({ code: "CC-900", name: "", name_ar: "", type: "department", parent_id: NO_PARENT }), [])
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CenterValues>({ resolver: zodResolver(centerSchema), defaultValues: empty })
  React.useEffect(() => {
    if (open) reset(empty)
  }, [open, reset, empty])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            create.mutate(
              { ...values, code: values.code.toUpperCase(), parent_id: values.parent_id === NO_PARENT ? null : values.parent_id },
              {
                onSuccess: (center) => {
                  toast.success(t("toastCenterAdded", { code: center.code, name: center.name }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorSaveCenter"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("newCostCenter")}</DialogTitle>
            <DialogDescription>{t("newCostCenterDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="center-code">{t("codeRequired")}</FieldLabel>
              <Input id="center-code" className="w-40 font-mono uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
              {errors.code ? <FieldError>{t(errors.code.message as PlanningMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="center-name">{t("nameEnglishRequired")}</FieldLabel>
              <Input id="center-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as PlanningMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="center-name-ar">{t("nameArabicRequired")}</FieldLabel>
              <Input id="center-name-ar" dir="rtl" lang="ar" aria-invalid={Boolean(errors.name_ar)} {...register("name_ar")} />
              {errors.name_ar ? <FieldError>{t(errors.name_ar.message as PlanningMessageKey)}</FieldError> : <FieldDescription>{t("arabicNameHint")}</FieldDescription>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="center-type">{t("typeRequired")}</FieldLabel>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="center-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COST_CENTER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {t(type.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="center-parent">{t("parent")}</FieldLabel>
                <Controller
                  control={control}
                  name="parent_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="center-parent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT}>{t("noParent")}</SelectItem>
                        {centers.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.code} · {center.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <p className="text-content-tertiary text-[13px] leading-5">{t("sessionNote")}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { NewCostCenterDialog }
