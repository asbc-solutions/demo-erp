"use client"

import * as React from "react"
import { BookOpen, Download, Plus } from "lucide-react"
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
import { formatDate, formatPeriod } from "../../../lib/utils/date"
import { taxApi } from "../../lib/api/tax"
import { useGenerateAuditFile } from "../../lib/mutations/tax"
import { useAuditFiles } from "../../lib/queries/tax"
import type { AuditFile } from "../../lib/types/tax"

const FORMATS = [
  { kind: "saft_gl", name: "SAF-T general ledger", standard: "OECD SAF-T", detail: "Every posted journal line in the period, with account and amounts. Requested at audit." },
  { kind: "eta_archive", name: "ETA e-invoice archive", standard: "ETA v1.1", detail: "Each sales invoice and credit note issued electronically in the period." },
  { kind: "vat_listing", name: "VAT transaction listing", standard: "ETA", detail: "Sales and purchases with their net amount and VAT, backing the monthly return." },
]

function DownloadButton({ file }: { file: AuditFile }) {
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
          toast.error(errorMessage(error, "The file could not be downloaded. Try again."))
        } finally {
          setBusy(false)
        }
      }}
    >
      <Download aria-hidden />
      Download
    </Button>
  )
}

const COLUMNS: FinanceColumn<AuditFile>[] = [
  { id: "name", header: "File", cell: (row) => <span className="text-content-primary font-medium">{row.name}</span> },
  { id: "standard", header: "Standard", cell: (row) => row.standard },
  { id: "period", header: "Period", cell: (row) => formatPeriod(row.period) },
  { id: "generated", header: "Generated", cell: (row) => (row.generated_on ? formatDate(row.generated_on) : "—") },
  { id: "records", header: "Records", align: "end", cell: (row) => (row.records === null ? "—" : row.records.toLocaleString("en-US")) },
  {
    id: "status",
    header: "Status",
    cell: (row) => (row.status === "ready" ? <StatusPill status="ready" label="Ready" /> : <StatusPill status="in_progress" label="Waiting for close" />),
  },
  { id: "action", header: <span className="sr-only">Download</span>, align: "end", cell: (row) => (row.status === "ready" ? <DownloadButton file={row} /> : null) },
]

function GenerateDialog({ open, onOpenChange, periods }: { open: boolean; onOpenChange: (open: boolean) => void; periods: { id: string; label: string }[] }) {
  const generate = useGenerateAuditFile()
  const [kind, setKind] = React.useState("saft_gl")
  const [period, setPeriod] = React.useState(periods[periods.length - 1]?.id ?? "")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate the audit file?</DialogTitle>
          <DialogDescription>
            The file is a point-in-time export of the ledger and e-invoice archive for a closed period, in the format the authority requires.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="audit-kind">File</FieldLabel>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger id="audit-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((format) => (
                  <SelectItem key={format.kind} value={format.kind}>
                    {format.name} · {format.standard}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="audit-period">Closed period</FieldLabel>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="audit-period">
                <SelectValue placeholder="Choose a closed period" />
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
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!period || generate.isPending}
            onClick={() =>
              generate.mutate(
                { kind, period },
                {
                  onSuccess: (file) => {
                    toast.success(`${file.name} for ${formatPeriod(file.period)} is ready (${file.records ?? 0} records).`)
                    onOpenChange(false)
                  },
                  onError: (error) => toast.error(errorMessage(error, "The file could not be generated. Try again.")),
                },
              )
            }
          >
            Generate file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** 07.09 · Audit files — ledger and e-invoice exports in the formats the authority asks for. */
function AuditFilesPage() {
  const { data, isError, refetch } = useAuditFiles()
  const [dialog, setDialog] = React.useState<"generate" | "formats" | null>(null)
  return (
    <>
      <FinancePageHeader
        title="Tax audit files"
        figure={data ? <HeaderFigure label="Files ready">{data.ready}</HeaderFigure> : null}
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog("formats")}>
              <BookOpen aria-hidden />
              Documentation
            </Button>
            <Button variant="primary" disabled={!data?.closed_periods.length} onClick={() => setDialog("generate")}>
              <Plus aria-hidden />
              Generate file
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
              <KpiCard layout="bar" accent="indigo" label="Files ready" value={data.ready} />
              <KpiCard layout="bar" accent="teal" label="Records exported" value={data.records.toLocaleString("en-US")} />
              <KpiCard layout="bar" accent="amber" label="Generating" value={data.generating} caption="Waits for the period to close" />
            </div>
            <FinanceAlert tone="info">
              Audit files export the full ledger and e-invoice archive in the format tax authorities require. Each file is a
              point-in-time snapshot of a closed period, so regenerate only if the period is reopened and re-closed.
            </FinanceAlert>
            <FinanceTable caption="Tax audit files" columns={COLUMNS} rows={data.items} getRowId={(row) => row.id} />
            <GenerateDialog open={dialog === "generate"} onOpenChange={(open) => setDialog(open ? "generate" : null)} periods={data.closed_periods} />
          </>
        )}
      </FinancePageBody>

      <Dialog open={dialog === "formats"} onOpenChange={(open) => setDialog(open ? "formats" : null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit file formats</DialogTitle>
            <DialogDescription>What each standard contains and when the authority expects it.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ul className="border-stroke-default divide-stroke-light divide-y rounded-lg border">
              {FORMATS.map((format) => (
                <li key={format.kind} className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="text-content-primary text-[13px] leading-5 font-medium">
                    {format.name} · <span className="text-content-secondary font-normal">{format.standard}</span>
                  </span>
                  <span className="text-content-secondary text-xs leading-4">{format.detail}</span>
                </li>
              ))}
            </ul>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { AuditFilesPage }
