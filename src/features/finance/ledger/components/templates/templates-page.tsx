"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
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
import type { JournalTemplate, LedgerMessageKey, LedgerTranslator } from "../../lib/types/ledger"

export const CADENCE_LABEL_KEY: Record<string, LedgerMessageKey> = { ad_hoc: "cadenceAdHoc", monthly: "cadenceMonthly", quarterly: "cadenceQuarterly" }

function buildColumns(t: LedgerTranslator): FinanceColumn<JournalTemplate>[] {
  return [
    { id: "code", header: t("code"), cell: (row) => <DocNumber>{row.code}</DocNumber> },
    { id: "name", header: t("template"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "lines", header: t("lines"), align: "end", cell: (row) => row.lines.length },
    {
      id: "accounts",
      header: t("drCr"),
      cell: (row) => {
        const debit = row.lines.find((entry) => entry.side === "debit")
        const credit = row.lines.find((entry) => entry.side === "credit")
        return (
          <span className="flex items-center gap-1.5 font-mono text-xs" title={`${debit?.account_name} → ${credit?.account_name}`}>
            {debit?.account_code}
            <ArrowRight className="text-content-tertiary size-3 rtl:rotate-180" aria-label={t("to")} />
            {credit?.account_code}
          </span>
        )
      },
    },
    {
      id: "amount",
      header: t("defaultAmountEgp"),
      align: "end",
      cell: (row) => (row.amount > 0 ? <Amount value={row.amount} /> : <span className="text-content-tertiary">{t("prompt")}</span>),
    },
    { id: "cadence", header: t("cadence"), cell: (row) => (CADENCE_LABEL_KEY[row.cadence] ? t(CADENCE_LABEL_KEY[row.cadence]) : row.cadence) },
    {
      id: "use",
      header: <span className="sr-only">{t("use")}</span>,
      align: "end",
      cell: (row) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/finance/journals/new?template=${row.id}`}>{t("use")}</Link>
        </Button>
      ),
    },
  ]
}

const EMPTY: TemplateFormValues = { name: "", debit_account: "", credit_account: "", amount: "", cadence: "ad_hoc" }

function NewTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceLedger")
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
          toast.success(t("toastTemplateAdded", { code: template.code, name: template.name }))
          onOpenChange(false)
        },
        onError: (error) => toast.error(errorMessage(error, t("errorSaveTemplate"))),
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("newTemplate")}</DialogTitle>
            <DialogDescription>{t("newTemplateDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel htmlFor="template-name">{t("nameRequired")}</FieldLabel>
              <Input id="template-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="template-debit">{t("debitRequired")}</FieldLabel>
              <Controller
                control={control}
                name="debit_account"
                render={({ field }) => <AccountSelect id="template-debit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.debit_account)} />}
              />
              {errors.debit_account ? <FieldError>{t(errors.debit_account.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="template-credit">{t("creditRequired")}</FieldLabel>
              <Controller
                control={control}
                name="credit_account"
                render={({ field }) => <AccountSelect id="template-credit" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.credit_account)} />}
              />
              {errors.credit_account ? <FieldError>{t(errors.credit_account.message as LedgerMessageKey)}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="template-amount">{t("defaultAmountEgp")}</FieldLabel>
              <Input id="template-amount" inputMode="decimal" placeholder="0.00" className="text-end tabular-nums" {...register("amount")} />
              <FieldDescription>{t("defaultAmountHint")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="template-cadence">{t("cadenceRequired")}</FieldLabel>
              <Controller
                control={control}
                name="cadence"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="template-cadence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CADENCE_LABEL_KEY).map(([value, labelKey]) => (
                        <SelectItem key={value} value={value}>
                          {t(labelKey)}
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

/** 05.08 · Journal templates — pre-filled entries for the journals that recur by hand. */
function TemplatesPage() {
  const t = useTranslations("FinanceLedger")
  const columns = React.useMemo(() => buildColumns(t), [t])
  const { data, isError, refetch } = useJournalTemplates()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <>
      <FinancePageHeader
        title={t("templatesAndRecurring")}
        figure={data ? <HeaderFigure label={t("journalTemplates")}>{data.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newTemplate")}
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
              <KpiCard layout="bar" accent="indigo" label={t("templates")} value={data.length} />
              <KpiCard layout="bar" accent="teal" label={t("monthlyTemplates")} value={data.filter((row) => row.cadence === "monthly").length} />
              <KpiCard layout="bar" accent="amber" label={t("fixedAmount")} value={data.filter((row) => row.amount > 0).length} />
            </div>
            <FinanceAlert
              tone="info"
              action={
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/finance/recurring">{t("recurringJournals")}</Link>
                </Button>
              }
            >
              {t("templatesInfo")}
            </FinanceAlert>
            <FinanceSection title={t("journalTemplates")}>
              <FinanceTable caption={t("journalTemplates")} columns={columns} rows={data} getRowId={(row) => row.id} />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
      <NewTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { TemplatesPage }
