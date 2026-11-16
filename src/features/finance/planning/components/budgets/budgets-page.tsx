"use client"

import * as React from "react"
import { useRouter } from "@/src/i18n/navigation"
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

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateBudget } from "../../lib/mutations/planning"
import { useBudgets, useCostCenters } from "../../lib/queries/planning"
import type { Budget } from "../../lib/types/planning"

const SESSION_NOTE =
  "Saved records live in this session only. The seeded data is never modified, so a reload returns the prototype to its known state."

const budgetSchema = z.object({
  name: z.string().trim().min(1, "Name the budget."),
  year: z
    .string()
    .trim()
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 2020 && Number(value) <= 2035, "Enter a year between 2020 and 2035."),
  scope: z.string().min(1, "Choose what the budget covers."),
  annual: z
    .string()
    .trim()
    .refine((value) => Number(value) > 0, "Enter the annual budget above zero."),
})
type BudgetValues = z.infer<typeof budgetSchema>

const EMPTY: BudgetValues = { name: "", year: "2026", scope: "all", annual: "" }

const COLUMNS: FinanceColumn<Budget>[] = [
  { id: "code", header: "Budget", cell: (row) => <DocNumber>{row.code}</DocNumber> },
  { id: "name", header: "Name", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "year", header: "Year", cell: (row) => row.year },
  { id: "scope", header: "Scope", cell: (row) => <span className="text-content-secondary">{row.scope_label}</span> },
  { id: "total", header: "Total (EGP)", align: "end", cell: (row) => <Amount value={row.total} /> },
  { id: "status", header: "Status", cell: (row) => <StatusPill status={row.status} /> },
]

function NewBudgetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
                  toast.success(`${budget.code} is saved as a draft.`)
                  onOpenChange(false)
                  router.push(`/finance/budgets/${budget.id}`)
                },
                onError: (error) => toast.error(errorMessage(error, "The budget could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>New budget</DialogTitle>
            <DialogDescription>
              A budget is measured against posted actuals. Saving creates it as a draft; approving and locking are separate
              steps.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="budget-name">Name *</FieldLabel>
              <Input id="budget-name" placeholder="e.g. FY2027 operating budget" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="budget-year">Year *</FieldLabel>
                <Input id="budget-year" inputMode="numeric" className="tabular-nums" aria-invalid={Boolean(errors.year)} {...register("year")} />
                {errors.year ? <FieldError>{errors.year.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="budget-scope">Scope *</FieldLabel>
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="budget-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All cost centers</SelectItem>
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
              <FieldLabel htmlFor="budget-annual">Annual budget (EGP) *</FieldLabel>
              <Input id="budget-annual" inputMode="decimal" placeholder="0.00" className="tabular-nums" aria-invalid={Boolean(errors.annual)} {...register("annual")} />
              {errors.annual ? <FieldError>{errors.annual.message}</FieldError> : null}
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

/** 09.01 · Budgets — each plan, its scope and where it stands in approval. */
function BudgetsPage() {
  const router = useRouter()
  const { data, isError, refetch } = useBudgets()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Budgets"
        figure={data ? <HeaderFigure label="Active budgets">{data.active}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New budget
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
              caption="Budgets"
              columns={COLUMNS}
              rows={data.items}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/finance/budgets/${row.id}`)}
            />
            <p className="text-content-secondary text-[13px] leading-5">
              Open a budget to see it measured against actuals. Approved budgets lock their figures; revisions keep an audit
              trail of the original.
            </p>
          </>
        )}
      </FinancePageBody>
      <NewBudgetDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { BudgetsPage, SESSION_NOTE }
