"use client"

import * as React from "react"
import Link from "next/link"
import { FileUp, Info } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/shared/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Field, FieldLabel } from "@/src/shared/components/ui/field"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceTreasuries } from "../../../lib/queries/master-data"
import { errorMessage } from "../../../lib/utils/api"
import { formatDate } from "../../../lib/utils/date"
import { useImportStatement } from "../../lib/mutations/banking"
import { useLatestImport } from "../../lib/queries/banking"
import type { ImportedLine } from "../../lib/types/banking"

const DEFAULT_TREASURY_ID = "bnk-cib-0021"

const MATCH_PILL: Record<ImportedLine["match"], { label: string; tone: "success" | "warning" | "muted" }> = {
  auto: { label: "Auto-matched", tone: "success" },
  review: { label: "Needs review", tone: "warning" },
  duplicate: { label: "Already imported", tone: "muted" },
}

function columns(currency: string): FinanceColumn<ImportedLine>[] {
  return [
    { id: "date", header: "Date", cell: (row) => formatDate(row.date) },
    { id: "reference", header: "Reference", cell: (row) => <DocNumber>{row.reference}</DocNumber> },
    { id: "memo", header: "Memo", cell: (row) => row.memo },
    { id: "amount", header: `Amount (${currency})`, align: "end", cell: (row) => <Amount value={row.amount} /> },
    {
      id: "match",
      header: "Match",
      cell: (row) => (
        <StatusPill status={`import-${row.match}`} label={MATCH_PILL[row.match].label} tone={MATCH_PILL[row.match].tone} />
      ),
    },
  ]
}

/**
 * 04.06 · Statement import — read the bank's file, auto-match what is already
 * on the books, and send the rest to the reconciliation workspace.
 */
function StatementImportPage() {
  const { data: treasuries = [] } = useFinanceTreasuries()
  const banks = treasuries.filter((row) => row.kind === "bank")
  const [treasuryId, setTreasuryId] = React.useState(DEFAULT_TREASURY_ID)
  const [confirming, setConfirming] = React.useState(false)
  const { data: latest, isPending } = useLatestImport(treasuryId)
  const importStatement = useImportStatement()
  const treasury = banks.find((row) => row.id === treasuryId)

  const runImport = () =>
    importStatement.mutate(treasuryId, {
      onSuccess: (result) =>
        toast.success(
          result.skipped === result.parsed
            ? `All ${result.parsed} lines were already imported. Nothing new was added.`
            : `${result.parsed - result.skipped} lines imported into ${result.treasury_name}.`,
        ),
      onError: (error) => toast.error(errorMessage(error, "The statement could not be imported. Try again.")),
    })

  return (
    <>
      <FinancePageHeader
        title="Bank statement import"
        figure={<HeaderFigure label="Lines parsed">{latest?.parsed ?? 0}</HeaderFigure>}
        actions={
          latest ? (
            <Button variant="primary" asChild>
              <Link href={`/finance/reconciliation/${treasuryId}`}>Continue to reconciliation</Link>
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-72">
            <FieldLabel htmlFor="import-treasury">Bank treasury</FieldLabel>
            <Select value={treasuryId} onValueChange={setTreasuryId}>
              <SelectTrigger id="import-treasury" className="h-9">
                <SelectValue placeholder="Choose a bank account" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.name} — {row.bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <span className="text-content-tertiary flex h-9 items-center gap-1.5 text-[13px] leading-5">
            <Info className="size-3.5" aria-hidden />
            Reads generated data, not a real source.
          </span>
          <Button variant="secondary" disabled={!treasury || importStatement.isPending} onClick={() => setConfirming(true)}>
            <FileUp aria-hidden />
            Upload statement (.csv / .ofx)
          </Button>
        </div>

        {isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : !latest ? (
          <EmptyState
            variant="card"
            icon={<FileUp />}
            title="Import a bank statement"
            description="Choose the treasury and upload the bank's file. Nucleus parses each line, auto-matches against posted book entries, and flags the rest for manual reconciliation."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Lines parsed" value={latest.parsed} caption={latest.skipped > 0 ? `${latest.skipped} already imported` : undefined} />
              <KpiCard layout="bar" accent="teal" label="Auto-matched" value={latest.auto_matched} caption={`${latest.review} need review`} />
              <KpiCard layout="bar" accent="amber" label="Into treasury" value={latest.treasury_name} />
            </div>
            <FinanceAlert tone="info">
              Auto-matched lines already correspond to a posted book entry and need no action. The remaining lines
              open in the reconciliation workspace, where you pair or create the missing entry.
            </FinanceAlert>
            <FinanceSection title="Parsed lines">
              <FinanceTable
                caption={`Lines parsed from the ${latest.treasury_name} statement`}
                columns={columns(latest.currency)}
                rows={latest.lines}
                getRowId={(row) => `${row.reference}-${row.date}`}
              />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this statement?</AlertDialogTitle>
            <AlertDialogDescription>
              Imported lines join the unmatched statement list for {treasury?.name ?? "this account"}. Duplicate
              lines are detected by reference and date and are skipped. Nothing posts to the ledger from an import.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "primary" })} onClick={runImport}>
              Import statement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { StatementImportPage }
