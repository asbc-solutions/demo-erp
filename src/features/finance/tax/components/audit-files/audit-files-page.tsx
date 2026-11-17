"use client"

import * as React from "react"
import { BookOpen, Download, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useIntlLocale } from "@/src/i18n/intl-locale"
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
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { errorMessage, unwrap } from "../../../lib/utils/api"
import { downloadCsv } from "../../../lib/utils/csv"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { taxApi } from "../../lib/api/tax"
import { useGenerateAuditFile } from "../../lib/mutations/tax"
import { useAuditFiles } from "../../lib/queries/tax"
import type { AuditFile, TaxMessageKey, TaxTranslator } from "../../lib/types/tax"

const FORMATS: { kind: string; nameKey: TaxMessageKey; standard: string; detailKey: TaxMessageKey }[] = [
  { kind: "saft_gl", nameKey: "formatSaftName", standard: "OECD SAF-T", detailKey: "formatSaftDetail" },
  { kind: "eta_archive", nameKey: "formatEtaName", standard: "ETA v1.1", detailKey: "formatEtaDetail" },
  { kind: "vat_listing", nameKey: "formatVatName", standard: "ETA", detailKey: "formatVatDetail" },
]

function DownloadButton({ file }: { file: AuditFile }) {
  const t = useTranslations("FinanceTax")
  const [busy, setBusy] = React.useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const result = await taxApi.exportAuditFile(file.id).then(unwrap)
          downloadCsv(result.name, result.headers, result.rows)
        } catch (error) {
          toast.error(errorMessage(error, t("errorDownloadFile")))
        } finally {
          setBusy(false)
        }
      }}
    >
      <Download aria-hidden />
      {t("download")}
    </Button>
  )
}

function buildColumns(t: TaxTranslator, locale: string, { formatDate, formatPeriod }: FinanceDateFormat): FinanceColumn<AuditFile>[] {
  return [
    { id: "name", header: t("file"), cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
    { id: "standard", header: t("standard"), cell: (row) => row.standard },
    { id: "period", header: t("period"), cell: (row) => formatPeriod(row.period) },
    { id: "generated", header: t("generated"), cell: (row) => (row.generated_on ? formatDate(row.generated_on) : "—") },
    { id: "records", header: t("records"), align: "end", cell: (row) => (row.records === null ? "—" : row.records.toLocaleString(locale)) },
    {
      id: "status",
      header: t("status"),
      cell: (row) => (row.status === "ready" ? <StatusPill status="ready" label={t("ready")} /> : <StatusPill status="in_progress" label={t("waitingForClose")} />),
    },
    { id: "action", header: <span className="sr-only">{t("download")}</span>, align: "end", cell: (row) => (row.status === "ready" ? <DownloadButton file={row} /> : null) },
  ]
}

function GenerateDialog({ open, onOpenChange, periods }: { open: boolean; onOpenChange: (open: boolean) => void; periods: { id: string; label: string }[] }) {
  const t = useTranslations("FinanceTax")
  const { formatPeriod } = useFinanceDateFormat()
  const generate = useGenerateAuditFile()
  const [kind, setKind] = React.useState("saft_gl")
  const [period, setPeriod] = React.useState(periods[periods.length - 1]?.id ?? "")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("generateTitle")}</DialogTitle>
          <DialogDescription>{t("generateDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="audit-kind">{t("file")}</FieldLabel>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="audit-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((format) => (
                  <SelectItem key={format.kind} value={format.kind}>
                    {t(format.nameKey)} · {format.standard}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="audit-period">{t("closedPeriod")}</FieldLabel>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="audit-period">
                <SelectValue placeholder={t("chooseClosedPeriod")} />
              </SelectTrigger>
              <SelectContent>
                {periods.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            disabled={!period || generate.isPending}
            onClick={() =>
              generate.mutate(
                { kind, period },
                {
                  onSuccess: (file) => {
                    toast.success(t("toastFileReady", { name: file.name, period: formatPeriod(file.period), count: file.records ?? 0 }))
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, t("errorGenerateFile"))),
                },
              )
            }
          >
            {t("generateFile")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 07.09 · Audit files — ledger and e-invoice exports in the formats the authority asks for. */
function AuditFilesPage() {
  const t = useTranslations("FinanceTax")
  const dateFormat = useFinanceDateFormat()
  const locale = useIntlLocale()
  const columns = React.useMemo(() => buildColumns(t, locale, dateFormat), [t, locale, dateFormat])
  const { data, isError, refetch } = useAuditFiles()
  const [dialog, setDialog] = React.useState<"generate" | "formats" | null>(null)
  return (
    <>
      <FinancePageHeader
        title={t("taxAuditFiles")}
        figure={data ? <HeaderFigure label={t("filesReady")}>{data.ready}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog("formats")}>
              <BookOpen aria-hidden />
              {t("documentation")}
            </Button>
            <Button variant="primary" disabled={!data?.closed_periods.length} onClick={() => setDialog("generate")}>
              <Plus aria-hidden />
              {t("generateFile")}
            </Button>
          </>
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
              <KpiCard layout="bar" accent="indigo" label={t("filesReady")} value={data.ready} />
              <KpiCard layout="bar" accent="teal" label={t("recordsExported")} value={data.records.toLocaleString(locale)} />
              <KpiCard layout="bar" accent="amber" label={t("generating")} value={data.generating} caption={t("waitsForClose")} />
            </div>
            <FinanceAlert tone="info">
              {t("auditFilesInfo")}
            </FinanceAlert>
            <FinanceTable caption={t("taxAuditFiles")} columns={columns} rows={data.items} getRowId={(row) => row.id} />
            <GenerateDialog open={dialog === "generate"} onOpenChange={(open) => setDialog(open ? "generate" : null)} periods={data.closed_periods} />
          </>
        )}
      </FinancePageBody>

      <Dialog open={dialog === "formats"} onOpenChange={(open) => setDialog(open ? "formats" : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("auditFileFormats")}</DialogTitle>
            <DialogDescription>{t("auditFileFormatsDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ul className="border-stroke-default divide-stroke-light divide-y rounded-lg border">
              {FORMATS.map((format) => (
                <li key={format.kind} className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="text-content-primary text-[13px] leading-5 font-medium">
                    {t(format.nameKey)} · <span className="text-content-secondary font-normal">{format.standard}</span>
                  </span>
                  <span className="text-content-secondary text-xs leading-4">{t(format.detailKey)}</span>
                </li>
              ))}
            </ul>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AuditFilesPage }
