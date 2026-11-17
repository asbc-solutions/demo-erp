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
import type { TaxCode, TaxMessageKey, TaxTranslator } from "../../lib/types/tax"

const KINDS: { value: string; labelKey: TaxMessageKey }[] = [
  { value: "vat", labelKey: "kindVatCodes" },
  { value: "withholding", labelKey: "kindWithholding" },
  { value: "table", labelKey: "kindTable" },
  { value: "stamp", labelKey: "kindStamp" },
  { value: "excise", labelKey: "kindExcise" },
]

const KIND_LABEL_KEY: Record<string, TaxMessageKey> = {
  vat: "kindVat",
  withholding: "kindWithholding",
  table: "kindTable",
  stamp: "kindStamp",
  excise: "kindExcise",
}

/** Messages are `FinanceTax` keys, translated where the error is rendered. */
const msg = (key: TaxMessageKey) => key

const codeSchema = z.object({
  code: z.string().trim().min(1, msg("errCode")).regex(/^[A-Za-z0-9-]+$/, msg("errCodeChars")),
  name: z.string().trim().min(1, msg("errCodeName")),
  kind: z.string().min(1, msg("errType")),
  rate: z
    .string()
    .trim()
    .min(1, msg("errRate"))
    .refine((value) => Number(value) >= 0 && Number(value) <= 100, msg("errRateRange")),
  account_code: z.string().min(1, msg("errRouteAccount")),
  jurisdiction: z.enum(["EG", "SA"]),
})
type CodeValues = z.infer<typeof codeSchema>

const EMPTY: CodeValues = { code: "", name: "", kind: "vat", rate: "", account_code: "", jurisdiction: "EG" }

function buildColumns(t: TaxTranslator): FinanceColumn<TaxCode>[] {
  return [
    { id: "code", header: t("code"), cell: (row) => <span className="font-mono text-xs">{row.code}</span> },
    { id: "name", header: t("name"), cell: (row) => row.name },
    { id: "kind", header: t("type"), cell: (row) => (KIND_LABEL_KEY[row.kind] ? t(KIND_LABEL_KEY[row.kind]) : row.kind) },
    { id: "rate", header: t("rate"), align: "end", cell: (row) => `${row.rate}%` },
    { id: "basis", header: t("basis"), cell: () => t("exclusive") },
    {
      id: "account",
      header: t("account"),
      cell: (row) =>
        row.account_code ? (
          <span className="font-mono text-xs" title={row.account_name ?? undefined}>
            {row.account_code}
          </span>
        ) : (
          <StatusPill status="blocked" label={t("noRouting")} />
        ),
    },
    { id: "jurisdiction", header: t("jurisdiction"), cell: (row) => row.jurisdiction },
    { id: "status", header: t("status"), cell: () => <StatusPill status="ready" label={t("active")} /> },
  ]
}

function NewCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("FinanceTax")
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
                  toast.success(t("toastCodeRoutes", { code: code.code, account: code.account_code ?? "" }))
                  onOpenChange(false)
                },
                onError: (error) => toast.error(errorMessage(error, t("errorSaveCode"))),
              },
            ),
          )}
        >
          <DialogHeader>
            <DialogTitle>{t("newTaxCode")}</DialogTitle>
            <DialogDescription>{t("newTaxCodeDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="code-code">{t("codeRequired")}</FieldLabel>
                <Input id="code-code" className="font-mono uppercase" aria-invalid={Boolean(errors.code)} {...register("code")} />
                {errors.code ? <FieldError>{t(errors.code.message as TaxMessageKey)}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="code-rate">{t("rateRequired")}</FieldLabel>
                <Input id="code-rate" inputMode="decimal" className="tabular-nums" aria-invalid={Boolean(errors.rate)} {...register("rate")} />
                {errors.rate ? <FieldError>{t(errors.rate.message as TaxMessageKey)}</FieldError> : <FieldDescription>{t("rateHint")}</FieldDescription>}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="code-name">{t("nameRequired")}</FieldLabel>
              <Input id="code-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              {errors.name ? <FieldError>{t(errors.name.message as TaxMessageKey)}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="code-kind">{t("typeRequired")}</FieldLabel>
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
                            {t(kind.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="code-jurisdiction">{t("jurisdictionRequired")}</FieldLabel>
                <Controller
                  control={control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="code-jurisdiction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EG">{t("jurisdictionEg")}</SelectItem>
                        <SelectItem value="SA">{t("jurisdictionSa")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="code-account">{t("accountRequired")}</FieldLabel>
              <Controller
                control={control}
                name="account_code"
                render={({ field }) => <AccountSelect id="code-account" value={field.value} onValueChange={field.onChange} invalid={Boolean(errors.account_code)} />}
              />
              {errors.account_code ? <FieldError>{t(errors.account_code.message as TaxMessageKey)}</FieldError> : null}
            </Field>
            <p className="text-content-tertiary text-[13px] leading-5">
              {t("sessionNote")}
            </p>
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

/** 07.08 · Tax codes — every code, its rate and the control account it routes to. */
function TaxCodesPage() {
  const t = useTranslations("FinanceTax")
  const columns = React.useMemo(() => buildColumns(t), [t])
  const { data, isError, refetch } = useTaxCodes()
  const [jurisdiction, setJurisdiction] = React.useState("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const rows = data?.items.filter((row) => jurisdiction === "all" || row.jurisdiction === jurisdiction) ?? []

  return (
    <>
      <FinancePageHeader
        title={t("taxCodes")}
        figure={data ? <HeaderFigure label={t("configuredCodes")}>{data.items.length}</HeaderFigure> : null}
        actions={
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden />
            {t("newTaxCode")}
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
              <KpiCard layout="bar" accent="indigo" label={t("kindVatCodes")} value={data.vat} />
              <KpiCard layout="bar" accent="teal" label={t("withholdingCodes")} value={data.withholding} />
              <KpiCard layout="bar" accent="amber" label={t("otherLevies")} value={data.other} caption={t("otherLeviesCaption")} />
            </div>
            <FilterBar>
              <FilterChip
                label={t("jurisdiction")}
                value={jurisdiction}
                options={[{ value: "all", label: t("allJurisdictions") }, ...data.jurisdictions.map((value) => ({ value, label: value }))]}
                onValueChange={setJurisdiction}
              />
            </FilterBar>
            <FinanceTable caption={t("taxCodes")} columns={columns} rows={rows} getRowId={(row) => row.id} />
          </>
        )}
      </FinancePageBody>
      <NewCodeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

export { TaxCodesPage }
