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
import type { Dimension } from "../../lib/types/planning"
import { SESSION_NOTE } from "../budgets/budgets-page"

const ACCENTS = ["indigo", "teal", "amber", "blue"] as const

const dimensionSchema = z.object({
  name: z.string().trim().min(1, "Enter the English name."),
  name_ar: z.string().trim().min(1, "Enter the Arabic name."),
  values: z
    .string()
    .trim()
    .refine((value) => value.split(",").some((part) => part.trim() !== ""), "List at least one value."),
  required: z.boolean(),
})
type DimensionValues = z.infer<typeof dimensionSchema>

const EMPTY: DimensionValues = { name: "", name_ar: "", values: "", required: false }

const COLUMNS: FinanceColumn<Dimension>[] = [
  { id: "code", header: "Code", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
  { id: "name", header: "Dimension", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "values", header: "Values", cell: (row) => `${row.values.length} ${row.values.length === 1 ? "value" : "values"}` },
  { id: "postings", header: "Applies to", cell: (row) => `${row.postings.toLocaleString("en-US")} postings` },
  {
    id: "required",
    header: "Required",
    cell: (row) => (row.required ? <StatusPill status="dimension-required" label="Required" tone="warning" /> : <StatusPill status="dimension-optional" label="Optional" tone="neutral" />),
  },
]

function NewDimensionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
                toast.success(`${dimension.code} · ${dimension.name} is ready to tag journal lines.`)
                onOpenChange(false)
              },
              onError: (error) => toast.error(errorMessage(error, "The dimension could not be saved. Try again.")),
            }),
          )}
        >
          <DialogHeader>
            <DialogTitle>New dimension</DialogTitle>
            <DialogDescription>A dimension tags journal lines with analytical context. Marking it required blocks posting until it is set.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="dimension-name">Name (English) *</FieldLabel>
              <Input id="dimension-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="dimension-name-ar">Name (Arabic) *</FieldLabel>
              <Input id="dimension-name-ar" dir="rtl" lang="ar" aria-invalid={Boolean(errors.name_ar)} {...register("name_ar")} />
              {errors.name_ar ? <FieldError>{errors.name_ar.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="dimension-values">Values *</FieldLabel>
              <Input id="dimension-values" placeholder="Direct, Distributor, Tender" aria-invalid={Boolean(errors.values)} {...register("values")} />
              {errors.values ? <FieldError>{errors.values.message}</FieldError> : <FieldDescription>Comma separated.</FieldDescription>}
            </Field>
            <Controller
              control={control}
              name="required"
              render={({ field }) => (
                <div className="flex items-center gap-2.5">
                  <Switch id="dimension-required" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="dimension-required" className="text-content-secondary text-[13px] font-normal">
                    Required — block posting until this dimension is set
                  </Label>
                </div>
              )}
            />
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

/** 09.06 · Dimensions — analytical tags on journal lines beyond the account and cost center. */
function DimensionsPage() {
  const { data, isError, refetch } = useDimensions()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Dimensions"
        figure={data ? <HeaderFigure label="Analytical dimensions">{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New dimension
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
              <KpiCard layout="bar" accent="indigo" label="Dimensions" value={data.items.length} />
              <KpiCard layout="bar" accent="teal" label="Required" value={data.required} />
              <KpiCard layout="bar" accent="amber" label="Total values" value={data.values} />
            </div>
            <FinanceAlert tone="info">
              Dimensions tag every journal line with analytical context beyond the account — cost center, project, branch.
              Required dimensions block posting until set, so reporting can always slice the ledger cleanly.
            </FinanceAlert>
            <FinanceTable caption="Dimensions" columns={COLUMNS} rows={data.items} getRowId={(row) => row.id} />
            <FinanceSection title="Values">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((dimension, index) => (
                  <KpiCard
                    key={dimension.id}
                    layout="bar"
                    accent={ACCENTS[index % ACCENTS.length]}
                    label={dimension.code}
                    value={dimension.name}
                    caption={
                      <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={`${dimension.name} values`}>
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
