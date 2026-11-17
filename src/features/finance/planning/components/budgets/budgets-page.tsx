"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
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

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateBudget } from "../../lib/mutations/planning"
import { useBudgets, useCostCenters } from "../../lib/queries/planning"
import type { Budget, PlanningMessageKey, PlanningTranslator } from "../../lib/types/planning"

/** Messages are `FinancePlanning` keys, translated where the error is rendered. */
const msg = (key: PlanningMessageKey) => key

const budgetSchema = z.object({
  name: z.string().trim().min(1, msg("errBudgetName")),
  year: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 2020 && Number(value) <= 2035, msg("errBudgetYear")),
  scope: z.string().min(1, msg("errBudgetScope")),
  annual: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, msg("errBudgetAnnual")),
})
type BudgetValues = z.infer<typeof budgetSchema>

const EMPTY: BudgetValues = { name: "", year: "2026", scope: "all", annual: "" }

function buildColumns(t: PlanningTranslator): FinanceColumn<Budget>[] {
  return [
    { id: "code", header: t("budget"), cell: (row) => <DocNumber>{row.code}</DocNumber> },
    { id: "name", header: t("name"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "year", header: t("year"), cell: (row) => row.year },
    { id: "scope", header: t("scope"), cell: (row) => <span className="text-content-secondary">{row.scope_label}</span> },
    { id: "total", header: t("totalEgp"), align: "end", cell: (row) => <Amount value={row.total} /> },
    { id: "status", header: t("status"), cell: (row) => <StatusPill status={row.status} /> },
  ]
}

function NewBudgetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinancePlanning")
  const router = useRouter()
  const create = useCreateBudget()
  const { data: centers } = useCostCenters()
  const tops = centers?.items.filter((row) => !row.parent_id) ?? []
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetValues>({ resolver: zodResolver(budgetSchema), defaultValues: EMPTY })
  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form
          noValidate
          onSubmit={handleSubmit((values) =>
            create.mutate(
              { name: values.name, year: Number(values.year), scope: values.scope, annual: Number(values.annual) },
              {
                onSuccess: (budget) => {
                  toast.success(t("toastBudgetDraft", { code: budget.code }))
                  onOpenChange(false)
                  router.push(`/finance/budgets/${budget.id}`)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorSaveBudget"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("newBudget")}</DialogTitle>
            <DialogDescription>{t("newBudgetDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="budget-name">{t("nameRequired")}</FieldLabel>
              <Input id="budget-name" placeholder={t("budgetNamePlaceholder")} aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as PlanningMessageKey)}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="budget-year">{t("yearRequired")}</FieldLabel>
                <Input id="budget-year" inputMode="numeric" className="tabular-nums" aria-invalid={Boolean(errors.year)} {...register("year")} />
                {errors.year ? <FieldError>{t(errors.year.message as PlanningMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="budget-scope">{t("scopeRequired")}</FieldLabel>
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="budget-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allCostCenters")}</SelectItem>
                        {tops.map((row) => (
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
            <Field>
              <FieldLabel htmlFor="budget-annual">{t("annualBudgetEgpRequired")}</FieldLabel>
              <Input id="budget-annual" inputMode="decimal" placeholder="0.00" className="tabular-nums" aria-invalid={Boolean(errors.annual)} {...register("annual")} />
              {errors.annual ? <FieldError>{t(errors.annual.message as PlanningMessageKey)}</FieldError> : null}
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

/** 09.01 · Budgets — each plan, its scope and where it stands in approval. */
function BudgetsPage() {
  const t = useTranslations("FinancePlanning")
  const columns = React.useMemo(() => buildColumns(t), [t])
  const router = useRouter()
  const { data, isError, refetch } = useBudgets()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("budgets")}
        figure={data ? <HeaderFigure label={t("activeBudgets")}>{data.active}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newBudget")}
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
            <FinanceTable
              caption={t("budgets")}
              columns={columns}
              rows={data.items}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/budgets/${row.id}`)}
            />
            <p className="text-content-secondary text-[13px] leading-5">
              {t("budgetsInfo")}
            </p>
          </>
        )}
      </FinancePageBody>
      <NewBudgetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { BudgetsPage }
