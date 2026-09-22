"use client"

import * as React from "react"
import Link from "next/link"
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
import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { errorMessage } from "../../../lib/utils/api"
import { formatPeriod } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { usePostDepreciation, useSkipDepreciation } from "../../lib/mutations/assets"
import { useDepreciationRun } from "../../lib/queries/assets"
import type { DepreciationLine, DepreciationRun } from "../../lib/types/assets"

type PreviewLine = { id: string; account: string; name: string; debit: number; credit: number }

function previewLines(run: DepreciationRun): PreviewLine[] {
  return [
    { id: "expense", account: "650101", name: "Depreciation expense", debit: run.total, credit: 0 },
    ...run.by_category.map((row) => ({ id: row.id, account: row.account, name: `Accum. depreciation — ${row.name}`, debit: 0, credit: row.amount })),
  ]
}

function SkipButton({ line, skip }: { line: DepreciationLine; skip: boolean }) {
  const toggle = useSkipDepreciation()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={toggle.isPending}
      onClick={() =>
        toggle.mutate(
          { assetId: line.id, skip },
          { onError: (error) => toast.error(errorMessage(error, "The run could not be changed. Try again.")) },
        )
      }
    >
      {skip ? "Skip asset" : "Include"}
    </Button>
  )
}

/** 08.04 · Depreciation run — the period's charge per asset, the entry it posts, and posting it. */
function DepreciationRunPage() {
  const { data, isError, refetch } = useDepreciationRun()
  const post = usePostDepreciation()
  const [confirming, setConfirming] = React.useState(false)
  const posted = data?.status === "posted"

  const columns: FinanceColumn<DepreciationLine>[] = [
    { id: "tag", header: "Tag", cell: (row) => <DocNumber href={`/finance/assets/${row.id}`}>{row.number}</DocNumber> },
    { id: "asset", header: "Asset", cell: (row) => <span className="text-content-primary">{row.name}</span>, footer: "Total charge" },
    { id: "nbv", header: "Net book (EGP)", align: "end", cell: (row) => <Amount value={row.nbv} /> },
    {
      id: "charge",
      header: "Charge (EGP)",
      align: "end",
      cell: (row) => <Amount value={row.charge} />,
      footer: data ? <Amount value={data.total} emphasis="strong" /> : null,
    },
    ...(posted
      ? []
      : [{ id: "skip", header: <span className="sr-only">Skip</span>, align: "end" as const, cell: (row: DepreciationLine) => <SkipButton line={row} skip /> }]),
  ]

  const previewColumns: FinanceColumn<PreviewLine>[] = [
    {
      id: "account",
      header: "Account",
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-xs">{row.account}</span>
          <span className="text-content-secondary">{row.name}</span>
        </span>
      ),
    },
    { id: "debit", header: "Debit", align: "end", cell: (row) => (row.debit ? <Amount value={row.debit} /> : null), footer: data ? <Amount value={data.total} emphasis="strong" /> : null },
    { id: "credit", header: "Credit", align: "end", cell: (row) => (row.credit ? <Amount value={row.credit} /> : null), footer: data ? <Amount value={data.total} emphasis="strong" /> : null },
  ]

  const periodLabel = data ? formatPeriod(data.period) : ""

  return (
    <>
      <FinancePageHeader
        title="Depreciation run"
        figure={
          data ? (
            <HeaderFigure label={`${periodLabel} charge (EGP)`} size="lg">
              {formatAmount(data.total)}
            </HeaderFigure>
          ) : null
        }
        actions={
          data ? (
            posted && data.entry ? (
              <Button variant="secondary" asChild>
                <Link href={`/finance/journals/${data.entry}`}>View entry</Link>
              </Button>
            ) : (
              <Button variant="primary" disabled={data.count === 0} onClick={() => setConfirming(true)}>
                Post depreciation
              </Button>
            )
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            {posted ? (
              <FinanceAlert tone="success">
                The run posted as entry {data.entry}, debiting depreciation expense and crediting accumulated depreciation.
                Assets in service were charged; fully depreciated and disposed assets were skipped. Open the entry to trace it
                to each asset.
              </FinanceAlert>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="Assets in run" value={data.count} caption={`${data.skipped} skipped`} />
              <KpiCard layout="bar" accent="teal" label="Period charge (EGP)" value={formatAmount(data.total)} />
              <KpiCard layout="bar" accent="amber" label="Accounts credited" value={data.by_category.length} caption="By category" />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex flex-col gap-6">
                <FinanceSection title="Per-asset charge">
                  <FinanceTable caption={`Depreciation for ${periodLabel}`} columns={columns} rows={data.items} getRowId={(row) => row.id} />
                </FinanceSection>
                {!posted && data.set_aside.length > 0 ? (
                  <FinanceSection title="Skipped this run" description="These assets are left out of this period's charge. Include one to charge it again.">
                    <FinanceTable
                      caption="Assets skipped this run"
                      columns={[
                        columns[0],
                        { id: "asset", header: "Asset", cell: (row) => row.name },
                        { id: "charge", header: "Charge (EGP)", align: "end", cell: (row) => <Amount value={row.charge} emphasis="muted" /> },
                        { id: "include", header: <span className="sr-only">Include</span>, align: "end", cell: (row) => <SkipButton line={row} skip={false} /> },
                      ]}
                      rows={data.set_aside}
                      getRowId={(row) => row.id}
                    />
                  </FinanceSection>
                ) : null}
              </div>
              <FinanceSection title="Posting preview">
                <FinanceTable caption="Entry the run posts" columns={previewColumns} rows={previewLines(data)} getRowId={(row) => row.id} />
                <p className="text-content-secondary text-[13px] leading-5">
                  The run posts as a single automatic entry. Depreciation expense is debited once; accumulated depreciation is
                  credited per asset category.
                </p>
              </FinanceSection>
            </div>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post the depreciation run?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <FinanceAlert tone="warning">
                  Posting creates one journal entry charging depreciation expense and crediting accumulated depreciation for
                  every eligible asset. Assets in the skipped list are not touched. Posting is what unblocks the close.
                </FinanceAlert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={post.isPending}
              onClick={() =>
                post.mutate(undefined, {
                  onSuccess: (run) => toast.success(`${formatPeriod(run.period)} depreciation posted as ${run.entry}.`),
                  onError: (error) => toast.error(errorMessage(error, "The run could not be posted. Try again.")),
                })
              }
            >
              Post depreciation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { DepreciationRunPage }
