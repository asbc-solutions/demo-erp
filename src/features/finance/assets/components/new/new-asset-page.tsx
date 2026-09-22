"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { ASSET_COST_CENTERS, METHOD_LABELS } from "../../lib/constants/assets"
import { useCreateAsset } from "../../lib/mutations/assets"
import { useAssetCategories } from "../../lib/queries/assets"
import type { Asset, AssetCategory } from "../../lib/types/assets"

const assetSchema = z.object({
  name: z.string().trim().min(1, "The asset needs a name. Enter a description before saving. It appears on the register and every depreciation entry."),
  category_id: z.string().min(1, "Choose the asset's category."),
  in_service: z.string().min(1, "Enter the in-service date."),
  cost: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Enter the acquisition cost. Depreciation is calculated from it."),
  salvage_pct: z
    .string()
    .trim()
    .refine((value) => value !== "" && Number(value) >= 0 && Number(value) < 100, "Salvage is a percentage of cost below 100."),
  cost_center_id: z.string().min(1, "Choose a cost center."),
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
  const router = useRouter()
  const create = useCreateAsset()
  const { data: categories } = useAssetCategories()
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
  const firstError = errors.name?.message

  if (saved) {
    return (
      <>
        <FinancePageHeader
          title="Add asset"
          breadcrumbs={[{ label: "Assets" }, { label: "Asset register", href: "/finance/assets" }, { label: "Add asset" }]}
        />
        <FinancePageBody>
          <FinanceAlert
            tone="success"
            action={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/assets">View register</Link>
              </Button>
            }
          >
            {saved.number} was added to the register in the {saved.category_name} category. It will begin depreciating at{" "}
            {formatAmount(saved.monthly_charge)} EGP per month from the next depreciation run. Capitalise the cost with a
            journal to complete the acquisition.
          </FinanceAlert>
          <div className="flex gap-2">
            <Button variant="primary" asChild>
              <Link href={`/finance/assets/${saved.id}`}>Open {saved.number}</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/finance/journals/new">New journal</Link>
            </Button>
          </div>
        </FinancePageBody>
      </>
    )
  }

  return (
    <>
      <FinancePageHeader
        title="Add asset"
        breadcrumbs={[{ label: "Assets" }, { label: "Asset register", href: "/finance/assets" }, { label: "Add asset" }]}
        figure={
          <HeaderFigure label="Monthly charge (EGP)" size="lg">
            {formatAmount(charge)}
          </HeaderFigure>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push("/finance/assets")}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} variant="primary" disabled={create.isPending}>
              Save asset
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
                  onError: (error) => setServerError(errorMessage(error, "The asset could not be saved. Try again.")),
                },
              )
            })}
          >
            {firstError || serverError ? <FinanceAlert tone="danger">{serverError ?? firstError}</FinanceAlert> : null}
            <Field>
              <FieldLabel htmlFor="asset-name">Asset name</FieldLabel>
              <Input id="asset-name" placeholder="e.g. Server rack — New Capital" aria-invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="asset-category">Category</FieldLabel>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="asset-category" aria-invalid={Boolean(errors.category_id)}>
                        <SelectValue placeholder="Choose a category" />
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
                {errors.category_id ? <FieldError>{errors.category_id.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-in-service">In-service date</FieldLabel>
                <Input id="asset-in-service" type="date" aria-invalid={Boolean(errors.in_service)} {...register("in_service")} />
                {errors.in_service ? <FieldError>{errors.in_service.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-cost">Acquisition cost (EGP)</FieldLabel>
                <Input id="asset-cost" inputMode="decimal" placeholder="0.00" className="tabular-nums" aria-invalid={Boolean(errors.cost)} {...register("cost")} />
                {errors.cost ? <FieldError>{errors.cost.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-salvage">Salvage (% of cost)</FieldLabel>
                <Input id="asset-salvage" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.salvage_pct)} {...register("salvage_pct")} />
                {errors.salvage_pct ? <FieldError>{errors.salvage_pct.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-center">Cost center</FieldLabel>
                <Controller
                  control={control}
                  name="cost_center_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="asset-center">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_COST_CENTERS.map((row) => (
                          <SelectItem key={row.id} value={row.id}>
                            {row.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
          </form>

          <FinanceSection title="Depreciation preview">
            <div className="flex flex-col gap-4">
              <KpiCard
                layout="bar"
                accent="indigo"
                label="Depreciable base (EGP)"
                value={formatAmount(round2(cost - salvage))}
                caption={`Cost ${formatAmount(cost)} − salvage ${formatAmount(salvage)}`}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label="Useful life"
                value={category ? `${category.life} months` : "—"}
                caption={category ? METHOD_LABELS[category.method].toLowerCase() : undefined}
              />
              <KpiCard layout="bar" accent="amber" label="Monthly charge (EGP)" value={formatAmount(charge)} />
            </div>
          </FinanceSection>
        </div>
      </FinancePageBody>
    </>
  )
}

export { NewAssetPage }
