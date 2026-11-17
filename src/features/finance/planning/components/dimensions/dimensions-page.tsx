"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useIntlLocale } from "@/src/i18n/intl-locale"
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
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Label } from "@/src/shared/components/ui/label"
import { Switch } from "@/src/shared/components/ui/switch"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateDimension } from "../../lib/mutations/planning"
import { useDimensions } from "../../lib/queries/planning"
import type { Dimension, PlanningMessageKey, PlanningTranslator } from "../../lib/types/planning"

const ACCENTS = ["indigo", "teal", "amber", "blue"] as const

/** Messages are `FinancePlanning` keys, translated where the error is rendered. */
const msg = (key: PlanningMessageKey) => key

const dimensionSchema = z.object({
  name: z.string().trim().min(1, msg("errEnglishName")),
  name_ar: z.string().trim().min(1, msg("errArabicName")),
  values: z
    .string()
    .trim()
    .refine((value) => value.split(",").some((part) => part.trim() !== ""), msg("errOneValue")),
  required: z.boolean(),
})
type DimensionValues = z.infer<typeof dimensionSchema>

const EMPTY: DimensionValues = { name: "", name_ar: "", values: "", required: false }

function buildColumns(t: PlanningTranslator, locale: string): FinanceColumn<Dimension>[] {
  return [
    { id: "code", header: t("code"), cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { id: "name", header: t("dimension"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "values", header: t("values"), cell: (row) => t("valuesCount", { count: row.values.length }) },
    { id: "postings", header: t("appliesTo"), cell: (row) => t("postingsCount", { count: row.postings.toLocaleString(locale) }) },
    {
      id: "required",
      header: t("required"),
      cell: (row) => (row.required ? <StatusPill status="dimension-required" label={t("required")} tone="warning" /> : <StatusPill status="dimension-optional" label={t("optional")} tone="neutral" />),
    },
  ]
}

function NewDimensionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinancePlanning")
  const create = useCreateDimension()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DimensionValues>({ resolver: zodResolver(dimensionSchema), defaultValues: EMPTY })
  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            create.mutate(values, {
              onSuccess: (dimension) => {
                toast.success(t("toastDimensionReady", { code: dimension.code, name: dimension.name }))
                onOpenChange(false)
              },
              onError: (error) => toast.error(errorMessage(error, t("errorSaveDimension"))),
            }),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("newDimension")}</DialogTitle>
            <DialogDescription>{t("newDimensionDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="dimension-name">{t("nameEnglishRequired")}</FieldLabel>
              <Input id="dimension-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as PlanningMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="dimension-name-ar">{t("nameArabicRequired")}</FieldLabel>
              <Input id="dimension-name-ar" dir="rtl" lang="ar" aria-invalid={Boolean(errors.name_ar)} {...register("name_ar")} />
              {errors.name_ar ? <FieldError>{t(errors.name_ar.message as PlanningMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="dimension-values">{t("valuesRequired")}</FieldLabel>
              <Input id="dimension-values" placeholder={t("valuesPlaceholder")} aria-invalid={Boolean(errors.values)} {...register("values")} />
              {errors.values ? <FieldError>{t(errors.values.message as PlanningMessageKey)}</FieldError> : <FieldDescription>{t("commaSeparated")}</FieldDescription>}
            </Field>
            <Controller
              control={control}
              name="required"
              render={({ field }) => (
                <div className="flex items-center gap-2.5">
                  <Switch id="dimension-required" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="dimension-required" className="text-content-secondary text-[13px] font-normal">
                    {t("requiredSwitch")}
                  </Label>
                </div>
              )}
            />
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

/** 09.06 · Dimensions — analytical tags on journal lines beyond the account and cost center. */
function DimensionsPage() {
  const t = useTranslations("FinancePlanning")
  const locale = useIntlLocale()
  const columns = React.useMemo(() => buildColumns(t, locale), [t, locale])
  const { data, isError, refetch } = useDimensions()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("dimensions")}
        figure={data ? <HeaderFigure label={t("analyticalDimensions")}>{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newDimension")}
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("dimensions")} value={data.items.length} />
              <KpiCard layout="bar" accent="teal" label={t("required")} value={data.required} />
              <KpiCard layout="bar" accent="amber" label={t("totalValues")} value={data.values} />
            </div>
            <FinanceAlert tone="info">
              {t("dimensionsInfo")}
            </FinanceAlert>
            <FinanceTable caption={t("dimensions")} columns={columns} rows={data.items} getRowId={(row) => row.id} />
            <FinanceSection title={t("values")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((dimension, index) => (
                  <KpiCard
                    key={dimension.id}
                    layout="bar"
                    accent={ACCENTS[index % ACCENTS.length]}
                    label={dimension.code}
                    value={dimension.name}
                    caption={
                      <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={t("dimensionValues", { name: dimension.name })}>
                        {dimension.values.map((value) => (
                          <li key={value} className="bg-status-neutral-bg text-status-neutral-fg rounded-sm px-1.5 py-0.5 text-[11px] leading-4">
                            {value}
                          </li>
                        ))}
                      </ul>
                    }
                  />
                ))}
              </div>
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
      <NewDimensionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { DimensionsPage }
