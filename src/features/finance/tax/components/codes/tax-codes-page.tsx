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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { AccountSelect } from "../../../components/shared/account-select"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FilterBar, FilterChip } from "../../../components/shared/filter-bar"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateTaxCode } from "../../lib/mutations/tax"
import { useTaxCodes } from "../../lib/queries/tax"
import type { TaxCode } from "../../lib/types/tax"

const KINDS = [
  { value: "vat", label: "VAT codes" },
  { value: "withholding", label: "Withholding" },
  { value: "table", label: "Table tax" },
  { value: "stamp", label: "Stamp tax" },
  { value: "excise", label: "Excise" },
]

const codeSchema = z.object({
  code: z.string().trim().min(1, "Enter the code.").regex(/^[A-Za-z0-9-]+$/, "Letters, digits and dashes only."),
  name: z.string().trim().min(1, "Name the code."),
  kind: z.string().min(1, "Choose the type."),
  rate: z
    .string()
    .trim()
    .min(1, "Enter the rate.")
    .refine((value) => Number(value) >= 0 && Number(value) <= 100, "Between 0 and 100."),
  account_code: z.string().min(1, "Route the code to an account."),
  jurisdiction: z.enum(["EG", "SA"]),
})
type CodeValues = z.infer<typeof codeSchema>

const EMPTY: CodeValues = { code: "", name: "", kind: "vat", rate: "", account_code: "", jurisdiction: "EG" }

const COLUMNS: FinanceColumn<TaxCode>[] = [
  { id: "code", header: "Code", cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
  { id: "name", header: "Name", cell: (row) => row.name },
  { id: "kind", header: "Type", cell: (row) => row.kind },
  { id: "rate", header: "Rate", align: "end", cell: (row) => `${row.rate}%` },
  { id: "basis", header: "Basis", cell: () => "Exclusive" },
  {
    id: "account",
    header: "Account",
    cell: (row) =>
      row.account_code ? (
        <span className="font-mono text-xs" title={row.account_name ?? undefined}>
          {row.account_code}
        </span>
      ) : (
        <StatusPill status="blocked" label="No routing" />
      ),
  },
  { id: "jurisdiction", header: "Jurisdiction", cell: (row) => row.jurisdiction },
  { id: "status", header: "Status", cell: () => <StatusPill status="ready" label="Active" /> },
]

function NewCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateTaxCode()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: EMPTY })
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
              { ...values, rate: Number(values.rate) },
              {
                onSuccess: (code) => {
                  toast.success(`${code.code} routes to ${code.account_code}.`)
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, "The tax code could not be saved. Try again.")),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>New tax code</DialogTitle>
            <DialogDescription>
              A tax code routes tax to a control account. Saving adds it to the code list; it does not apply it to any existing document.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="code-code">Code *</FieldLabel>
                <Input id="code-code" className="font-mono uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
                {errors.code ? <FieldError>{errors.code.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="code-rate">Rate *</FieldLabel>
                <Input id="code-rate" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.rate)} {...register("rate")} />
                {errors.rate ? <FieldError>{errors.rate.message}</FieldError> : <FieldDescription>Percentage, not a fraction — 14 means 14%.</FieldDescription>}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="code-name">Name *</FieldLabel>
              <Input id="code-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="code-kind">Type *</FieldLabel>
                <Controller
                  control={control}
                  name="kind"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="code-kind">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KINDS.map((kind) => (
                          <SelectItem key={kind.value} value={kind.value}>
                            {kind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="code-jurisdiction">Jurisdiction *</FieldLabel>
                <Controller
                  control={control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="code-jurisdiction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EG">EG — Egypt</SelectItem>
                        <SelectItem value="SA">SA — Saudi Arabia</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="code-account">Account *</FieldLabel>
              <Controller
                control={control}
                name="account_code"
                render={({ field }) => <AccountSelect id="code-account" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.account_code)} />}
              />
              {errors.account_code ? <FieldError>{errors.account_code.message}</FieldError> : null}
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">
              Saved records live in this session only. The seeded data is never modified, so a reload returns the prototype to its known state.
            </p>
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

/** 07.08 · Tax codes — every code, its rate and the control account it routes to. */
function TaxCodesPage() {
  const { data, isError, refetch } = useTaxCodes()
  const [jurisdiction, setJurisdiction] = React.useState("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const rows = data?.items.filter((row) => jurisdiction === "all" || row.jurisdiction === jurisdiction) ?? []

  return (
    <>
      <FinancePageHeader
        title="Tax codes"
        figure={data ? <HeaderFigure label="Configured codes">{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New tax code
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
              <KpiCard layout="bar" accent="indigo" label="VAT codes" value={data.vat} />
              <KpiCard layout="bar" accent="teal" label="Withholding codes" value={data.withholding} />
              <KpiCard layout="bar" accent="amber" label="Other levies" value={data.other} caption="Table, stamp, excise" />
            </div>
            <FilterBar>
              <FilterChip
                label="Jurisdiction"
                value={jurisdiction}
                options={[{ value: "all", label: "All jurisdictions" }, ...data.jurisdictions.map((value) => ({ value, label: value }))]}
                onValueChange={setJurisdiction}
              />
            </FilterBar>
            <FinanceTable caption="Tax codes" columns={COLUMNS} rows={rows} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
      <NewCodeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { TaxCodesPage }
