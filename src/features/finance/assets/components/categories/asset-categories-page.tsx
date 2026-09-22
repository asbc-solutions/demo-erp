"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
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
import { METHOD_LABELS } from "../../lib/constants/assets"
import { useCreateAssetCategory } from "../../lib/mutations/assets"
import { useAssetCategories } from "../../lib/queries/assets"
import type { AssetCategory } from "../../lib/types/assets"
import { SESSION_NOTE } from "../detail/asset-dialogs"

const categorySchema = z.object({
  code: z.string().trim().min(1, "Enter the code.").regex(/^[A-Za-z0-9-]+$/, "Letters, digits and dashes only."),
  name: z.string().trim().min(1, "Name the category."),
  method: z.enum(["straight_line", "declining_balance"]),
  life: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, "Whole months above zero."),
  cost_account: z.string().min(1, "Route the category to a cost account."),
})
type CategoryValues = z.infer<typeof categorySchema>

function NewCategoryDialog({ open, onOpenChange, nextCode }: { open: boolean; onOpenChange: (open: boolean) => void; nextCode: string }) {
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
                  toast.success(`${category.code} · ${category.name} is ready for new assets.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The category could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              A category sets the default depreciation method and life for assets added to it. Existing assets keep their own
              settings.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
              <Field>
                <FieldLabel htmlFor="category-code">Code *</FieldLabel>
                <Input id="category-code" className="font-mono uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
                {errors.code ? <FieldError>{errors.code.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="category-name">Name *</FieldLabel>
                <Input id="category-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
                {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="category-method">Default method *</FieldLabel>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="category-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight_line">Straight line</SelectItem>
                        <SelectItem value="declining_balance">Declining balance</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="category-life">Life (months) *</FieldLabel>
                <Input id="category-life" inputMode="numeric" className="tabular-nums" aria-invalid={Boolean(errors.life)} {...register("life")} />
                {errors.life ? <FieldError>{errors.life.message}</FieldError> : null}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="category-account">Account *</FieldLabel>
              <Controller
                control={control}
                name="cost_account"
                render={({ field }) => (
                  <AccountSelect
                    id="category-account"
                    value={field.value}
                    onValueChange={field.onChange}
                    invalid={Boolean(errors.cost_account)}
                    placeholder="Choose the cost account"
                    filter={(code) => code.startsWith("1201")}
                  />
                )}
              />
              {errors.cost_account ? <FieldError>{errors.cost_account.message}</FieldError> : null}
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">{SESSION_NOTE}</p>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 08.05 · Asset categories — default method, life and ledger routing for each class of asset. */
function AssetCategoriesPage() {
  const { data, isError, refetch } = useAssetCategories()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const columns: FinanceColumn<AssetCategory>[] = [
    { id: "code", header: "Code", cell: (row) => <span className="font-mono text-xs">{row.code}</span>, footer: "Total" },
    { id: "name", header: "Category", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "method", header: "Default method", cell: (row) => METHOD_LABELS[row.method] },
    { id: "life", header: "Life (months)", align: "end", cell: (row) => row.life },
    {
      id: "accounts",
      header: "Accounts",
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.cost_account} / {row.accum_account}
        </span>
      ),
    },
    { id: "assets", header: "Assets", align: "end", cell: (row) => row.assets },
    { id: "cost", header: "Cost (EGP)", align: "end", cell: (row) => <Amount value={row.cost} />, footer: data ? <Amount value={data.cost} emphasis="strong" /> : null },
    { id: "nbv", header: "Net book (EGP)", align: "end", cell: (row) => <Amount value={row.nbv} />, footer: data ? <Amount value={data.nbv} emphasis="strong" /> : null },
  ]

  const nextCode = `AC-${(data?.items.length ?? 4) + 1}`

  return (
    <>
      <FinancePageHeader
        title="Asset categories"
        figure={data ? <HeaderFigure label="Categories">{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New category
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
            <FinanceTable caption="Asset categories" columns={columns} rows={data.items} getRowId={(row) => row.id} />
            <FinanceAlert tone="info">
              A category sets the default depreciation method and useful life for assets assigned to it. Individual assets can
              override the method when needed. Cost and net book count assets in service.
            </FinanceAlert>
          </>
        )}
      </FinancePageBody>
      <NewCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} nextCode={nextCode} />
    </>
  )
}

export { AssetCategoriesPage }
