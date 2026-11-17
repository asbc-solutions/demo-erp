"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
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
import { Field, FieldError, FieldLabel } from "@/src/shared/components/ui/field"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { AccountSelect } from "../../../components/shared/account-select"
import { Amount } from "../../../components/shared/amount"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { METHOD_LABEL_KEYS } from "../../lib/constants/assets"
import { useCreateAssetCategory } from "../../lib/mutations/assets"
import { useAssetCategories } from "../../lib/queries/assets"
import type { AssetCategory, AssetsMessageKey } from "../../lib/types/assets"

/** Messages are `FinanceAssets` keys, translated where the error is rendered. */
const msg = (key: AssetsMessageKey) => key

const categorySchema = z.object({
  code: z.string().trim().min(1, msg("errCode")).regex(/^[A-Za-z0-9-]+$/, msg("errCodeChars")),
  name: z.string().trim().min(1, msg("errCategoryName")),
  method: z.enum(["straight_line", "declining_balance"]),
  life: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, msg("errWholeMonths")),
  cost_account: z.string().min(1, msg("errCostAccount")),
})
type CategoryValues = z.infer<typeof categorySchema>

function NewCategoryDialog({ open, onOpenChange, nextCode }: { open: boolean; onOpenChange: (open: boolean) => void; nextCode: string }) {
  const t = useTranslations("FinanceAssets")
  const create = useCreateAssetCategory()
  const empty = React.useMemo<CategoryValues>(() => ({ code: nextCode, name: "", method: "straight_line", life: "60", cost_account: "" }), [nextCode])
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: empty })
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
              { ...values, life: Number(values.life) },
              {
                onSuccess: (category) => {
                  toast.success(t("toastCategoryReady", { code: category.code, name: category.name }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorSaveCategory"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("newCategory")}</DialogTitle>
            <DialogDescription>{t("newCategoryDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
              <Field>
                <FieldLabel htmlFor="category-code">{t("codeRequired")}</FieldLabel>
                <Input id="category-code" className="font-mono uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
                {errors.code ? <FieldError>{t(errors.code.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="category-name">{t("nameRequired")}</FieldLabel>
                <Input id="category-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
                {errors.name ? <FieldError>{t(errors.name.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="category-method">{t("defaultMethodRequired")}</FieldLabel>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight_line">{t("methodStraightLine")}</SelectItem>
                        <SelectItem value="declining_balance">{t("methodDecliningBalance")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="category-life">{t("lifeMonthsRequired")}</FieldLabel>
                <Input id="category-life" inputMode="numeric" className="tabular-nums" aria-invalid={Boolean(errors.life)} {...register("life")} />
                {errors.life ? <FieldError>{t(errors.life.message as AssetsMessageKey)}</FieldError> : null}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="category-account">{t("accountRequired")}</FieldLabel>
              <Controller
                control={control}
                name="cost_account"
                render={({ field }) => (
                  <AccountSelect
                    id="category-account"
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={Boolean(errors.cost_account)}
                    placeholder={t("chooseCostAccount")}
                    filter={(code) => code.startsWith("1201")}
                  />
                )}
              />
              {errors.cost_account ? <FieldError>{t(errors.cost_account.message as AssetsMessageKey)}</FieldError> : null}
            </Field>
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

/** 08.05 · Asset categories — default method, life and ledger routing for each class of asset. */
function AssetCategoriesPage() {
  const t = useTranslations("FinanceAssets")
  const { data, isError, refetch } = useAssetCategories()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const columns: FinanceColumn<AssetCategory>[] = [
    { id: "code", header: t("code"), cell: (row) => <span className="font-mono text-xs">{row.code}</span>, footer: t("total") },
    { id: "name", header: t("category"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "method", header: t("defaultMethod"), cell: (row) => t(METHOD_LABEL_KEYS[row.method]) },
    { id: "life", header: t("lifeMonths"), align: "end", cell: (row) => row.life },
    {
      id: "accounts",
      header: t("accounts"),
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.cost_account} / {row.accum_account}
        </span>
      ),
    },
    { id: "assets", header: t("assets"), align: "end", cell: (row) => row.assets },
    { id: "cost", header: t("costEgp"), align: "end", cell: (row) => <Amount value={row.cost} />, footer: data ? <Amount value={data.cost} emphasis="strong" /> : null },
    { id: "nbv", header: t("netBookEgp"), align: "end", cell: (row) => <Amount value={row.nbv} />, footer: data ? <Amount value={data.nbv} emphasis="strong" /> : null },
  ]

  const nextCode = `AC-${(data?.items.length ?? 4) + 1}`

  return (
    <>
      <FinancePageHeader
        title={t("assetCategories")}
        figure={data ? <HeaderFigure label={t("categories")}>{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newCategory")}
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
            <FinanceTable caption={t("assetCategories")} columns={columns} rows={data.items} getRowId={(row) => row.id} />
            <FinanceAlert tone="info">
              {t("categoriesInfo")}
            </FinanceAlert>
          </>
        )}
      </FinancePageBody>
      <NewCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} nextCode={nextCode} />
    </>
  )
}

export { AssetCategoriesPage }
