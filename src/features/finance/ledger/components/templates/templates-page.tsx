"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Plus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

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
import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { useCreateTemplate } from "../../lib/mutations/ledger"
import { useJournalTemplates } from "../../lib/queries/ledger"
import { templateSchema, type TemplateFormValues } from "../../lib/schema/ledger"
import type { JournalTemplate } from "../../lib/types/ledger"

export const CADENCE_LABEL: Record<string, string> = { ad_hoc: "Ad hoc", monthly: "Monthly", quarterly: "Quarterly" }

const COLUMNS: FinanceColumn<JournalTemplate>[] = [
  { id: "code", header: "Code", cell: (row) => <DocNumber>{row.code}</DocNumber> },
  { id: "name", header: "Template", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "lines", header: "Lines", align: "end", cell: (row) => row.lines.length },
  {
    id: "accounts",
    header: "Dr / Cr",
    cell: (row) => {
      const debit = row.lines.find((entry) => entry.side === "debit")
      const credit = row.lines.find((entry) => entry.side === "credit")
      return (
        <span className="flex items-center gap-1.5 font-mono text-xs" title={`${debit?.account_name} → ${credit?.account_name}`}>
          {debit?.account_code}
          <ArrowRight className="text-content-tertiary size-3" aria-label="to" />
          {credit?.account_code}
        </span>
      )
    },
  },
  {
    id: "amount",
    header: "Default amount (EGP)",
    align: "end",
    cell: (row) => (row.amount > 0 ? <Amount value={row.amount} /> : <span className="text-content-tertiary">Prompt</span>),
  },
  { id: "cadence", header: "Cadence", cell: (row) => CADENCE_LABEL[row.cadence] ?? row.cadence },
  {
    id: "use",
    header: <span className="sr-only">Use</span>,
    align: "end",
    cell: (row) => (
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/finance/journals/new?template=${row.id}`}>Use</Link>
      </Button>
    ),
  },
]

const EMPTY: TemplateFormValues = { name: "", debit_account: "", credit_account: "", amount: "", cadence: "ad_hoc" }

function NewTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateTemplate()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormValues>({ resolver: zodResolver(templateSchema), defaultValues: EMPTY })

  React.useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  const submit = (values: TemplateFormValues) =>
    create.mutate(
      { ...values, amount: Number(values.amount) || 0 },
      {
        onSuccess: (template) => {
          toast.success(`${template.code} · ${template.name} was added to the templates.`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, "The template could not be saved. Try again.")),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>New template</DialogTitle>
            <DialogDescription>
              A template pre-fills a journal. Saving adds it to the template list; it does not post anything on its own.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="template-name">Name *</FieldLabel>
              <Input id="template-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="template-debit">Debit *</FieldLabel>
              <Controller
                control={control}
                name="debit_account"
                render={({ field }) => <AccountSelect id="template-debit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.debit_account)} />}
              />
              {errors.debit_account ? <FieldError>{errors.debit_account.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="template-credit">Credit *</FieldLabel>
              <Controller
                control={control}
                name="credit_account"
                render={({ field }) => <AccountSelect id="template-credit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.credit_account)} />}
              />
              {errors.credit_account ? <FieldError>{errors.credit_account.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="template-amount">Default amount (EGP)</FieldLabel>
              <Input id="template-amount" inputMode="decimal" placeholder="0.00" className="text-end tabular-nums" {...register("amount")} />
              <FieldDescription>Leave at zero to prompt for the amount each time.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="template-cadence">Cadence *</FieldLabel>
              <Controller
                control={control}
                name="cadence"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="template-cadence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CADENCE_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
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

/** 05.08 · Journal templates — pre-filled entries for the journals that recur by hand. */
function TemplatesPage() {
  const { data, isError, refetch } = useJournalTemplates()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title="Templates & recurring"
        figure={data ? <HeaderFigure label="Journal templates">{data.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            New template
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
              <KpiCard layout="bar" accent="indigo" label="Templates" value={data.length} />
              <KpiCard layout="bar" accent="teal" label="Monthly templates" value={data.filter((row) => row.cadence === "monthly").length} />
              <KpiCard layout="bar" accent="amber" label="Fixed-amount" value={data.filter((row) => row.amount > 0).length} />
            </div>
            <FinanceAlert
              tone="info"
              action={
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/finance/recurring">Recurring journals</Link>
                </Button>
              }
            >
              Templates pre-fill a journal so common entries post consistently. To have a template post itself on a
              schedule, promote it to a recurring journal, which generates a draft on its next-run date for review.
            </FinanceAlert>
            <FinanceSection title="Journal templates">
              <FinanceTable caption="Journal templates" columns={COLUMNS} rows={data} getRowId={(row) => row.id} />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
      <NewTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { TemplatesPage }
