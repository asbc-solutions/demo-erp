"use client"

import * as React from "react"
import { Link, useRouter } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/src/shared/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { formatAmount, round2 } from "../../../lib/utils/money"
import { useCostCenters } from "../../../planning/lib/queries/planning"
import { METHOD_LABEL_KEYS } from "../../lib/constants/assets"
import { useCreateAsset } from "../../lib/mutations/assets"
import { useAssetCategories } from "../../lib/queries/assets"
import type { Asset, AssetCategory, AssetsMessageKey } from "../../lib/types/assets"

/** Messages are `FinanceAssets` keys, translated where the error is rendered. */
const msg = (key: AssetsMessageKey) => key

const assetSchema = z.object({
  name: z.string().trim().min(1, msg("errNewAssetName")),
  category_id: z.string().min(1, msg("errCategory")),
  in_service: z.string().min(1, msg("errInServiceDate")),
  cost: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, msg("errAcquisitionCost")),
  salvage_pct: z
    .string()
    .trim()
    .refine((value) => value !== "" && Number(value) >= 0 && Number(value) < 100, msg("errSalvagePct")),
  cost_center_id: z.string().min(1, msg("errCostCenter")),
})
type AssetValues = z.infer<typeof assetSchema>

const FORM_ID = "new-asset-form"

/** The first month's charge, the same way the depreciation run works it out. */
function firstCharge(category: AssetCategory | undefined, cost: number, salvage: number): number {
  if (!category || cost <= 0) return 0
  const charge = category.method === "declining_balance" ? cost * (2 / category.life) : (cost - salvage) / category.life
  return round2(Math.max(0, Math.min(charge, cost - salvage)))
}

/** 08.03 · Add asset — register a fixed asset and preview how it will depreciate. */
function NewAssetPage() {
  const t = useTranslations("FinanceAssets")
  const router = useRouter()
  const create = useCreateAsset()
  const { data: categories } = useAssetCategories()
  const { data: centers } = useCostCenters()
  const [saved, setSaved] = React.useState<Asset | null>(null)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: { name: "", category_id: "AC-4", in_service: "2026-03-01", cost: "", salvage_pct: "5", cost_center_id: "CC-100" },
  })

  const [categoryId, costText, salvageText] = useWatch({ control, name: ["category_id", "cost", "salvage_pct"] })
  const category = categories?.items.find((row) => row.id === categoryId)
  const cost = Math.max(0, Number(costText) || 0)
  const salvage = round2((cost * (Number(salvageText) || 0)) / 100)
  const charge = firstCharge(category, cost, salvage)
  const firstError = errors.name?.message ? t(errors.name.message as AssetsMessageKey) : undefined

  if (saved) {
    return (
      <>
        <FinancePageHeader
          title={t("addAsset")}
          breadcrumbs={[{ label: t("assets") }, { label: t("assetRegister"), href: "/finance/assets" }, { label: t("addAsset") }]}
        />
        <FinancePageBody>
          <FinanceAlert
            tone="success"
            action={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/assets">{t("viewRegister")}</Link>
              </Button>
            }
          >
            {t("assetAddedNotice", { number: saved.number, category: saved.category_name, amount: formatAmount(saved.monthly_charge) })}
          </FinanceAlert>
          <div className="flex gap-2">
            <Button variant="primary" asChild>
              <Link href={`/finance/assets/${saved.id}`}>{t("openNumber", { number: saved.number })}</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/finance/journals/new">{t("newJournal")}</Link>
            </Button>
          </div>
        </FinancePageBody>
      </>
    )
  }

  return (
    <>
      <FinancePageHeader
        title={t("addAsset")}
        breadcrumbs={[{ label: t("assets") }, { label: t("assetRegister"), href: "/finance/assets" }, { label: t("addAsset") }]}
        figure={
          <HeaderFigure label={t("monthlyChargeEgp")} size="lg">
            {formatAmount(charge)}
          </HeaderFigure>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push("/finance/assets")}>
              {t("cancel")}
            </Button>
            <Button type="submit" form={FORM_ID} variant="primary" disabled={create.isPending}>
              {t("saveAsset")}
            </Button>
          </>
        }
      />
      <FinancePageBody>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            id={FORM_ID}
            noValidate
            className="flex max-w-2xl flex-col gap-4"
            onSubmit={handleSubmit((values) => {
              setServerError(null)
              create.mutate(
                {
                  name: values.name,
                  category_id: values.category_id,
                  in_service: values.in_service,
                  cost: Number(values.cost),
                  salvage_pct: Number(values.salvage_pct),
                  cost_center_id: values.cost_center_id,
                },
                {
                  onSuccess: setSaved,
                  onError: (error) => setServerError(errorMessage(error, t("errorSaveAsset"))),
                },
              )
            })}
          >
            {firstError || serverError ? <FinanceAlert tone="danger">{serverError ?? firstError}</FinanceAlert> : null}
            <Field>
              <FieldLabel htmlFor="asset-name">{t("assetName")}</FieldLabel>
              <Input id="asset-name" placeholder={t("assetNamePlaceholder")} aria-invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="asset-category">{t("category")}</FieldLabel>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="asset-category" aria-invalid={Boolean(errors.category_id)}>
                        <SelectValue placeholder={t("chooseCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.items.map((row) => (
                          <SelectItem key={row.id} value={row.id}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category_id ? <FieldError>{t(errors.category_id.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-in-service">{t("inServiceDate")}</FieldLabel>
                <Input id="asset-in-service" type="date" aria-invalid={Boolean(errors.in_service)} {...register("in_service")} />
                {errors.in_service ? <FieldError>{t(errors.in_service.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-cost">{t("acquisitionCostEgp")}</FieldLabel>
                <Input id="asset-cost" inputMode="decimal" placeholder="0.00" className="tabular-nums" aria-invalid={Boolean(errors.cost)} {...register("cost")} />
                {errors.cost ? <FieldError>{t(errors.cost.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-salvage">{t("salvagePctOfCost")}</FieldLabel>
                <Input id="asset-salvage" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.salvage_pct)} {...register("salvage_pct")} />
                {errors.salvage_pct ? <FieldError>{t(errors.salvage_pct.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-center">{t("costCenter")}</FieldLabel>
                <Controller
                  control={control}
                  name="cost_center_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="asset-center">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {centers?.items.map((row) => (
                          <SelectItem key={row.id} value={row.id}>
                            {row.code} · {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </form>

          <FinanceSection title={t("depreciationPreview")}>
            <div className="flex flex-col gap-4">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("depreciableBaseEgp")}
                value={formatAmount(round2(cost - salvage))}
                caption={t("costMinusSalvage", { cost: formatAmount(cost), salvage: formatAmount(salvage) })}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("usefulLife")}
                value={category ? t("monthsCount", { count: category.life }) : "—"}
                caption={category ? t(METHOD_LABEL_KEYS[category.method]).toLowerCase() : undefined}
              />
              <KpiCard layout="bar" accent="amber" label={t("monthlyChargeEgp")} value={formatAmount(charge)} />
            </div>
          </FinanceSection>
        </div>
      </FinancePageBody>
    </>
  )
}

export { NewAssetPage }
