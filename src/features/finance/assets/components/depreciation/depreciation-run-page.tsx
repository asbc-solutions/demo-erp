"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"
import { useTranslations } from "next-intl"
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
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { usePostDepreciation, useSkipDepreciation } from "../../lib/mutations/assets"
import { useDepreciationRun } from "../../lib/queries/assets"
import type { AssetsTranslator, DepreciationLine, DepreciationRun } from "../../lib/types/assets"

type PreviewLine = { id: string; account: string; name: string; debit: number; credit: number }

function previewLines(t: AssetsTranslator, run: DepreciationRun): PreviewLine[] {
  return [
    { id: "expense", account: "650101", name: t("depreciationExpense"), debit: run.total, credit: 0 },
    ...run.by_category.map((row) => ({ id: row.id, account: row.account, name: t("accumDepreciationFor", { name: row.name }), debit: 0, credit: row.amount })),
  ]
}

function SkipButton({ line, skip }: { line: DepreciationLine; skip: boolean }) {
  const t = useTranslations("FinanceAssets")
  const toggle = useSkipDepreciation()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={toggle.isPending}
      onClick={() =>
        toggle.mutate(
          { assetId: line.id, skip },
          { onError: (error) => toast.error(errorMessage(error, t("errorChangeRun"))) },
        )
      }
    >
      {skip ? t("skipAsset") : t("include")}
    </Button>
  )
}

/** 08.04 · Depreciation run — the period's charge per asset, the entry it posts, and posting it. */
function DepreciationRunPage() {
  const t = useTranslations("FinanceAssets")
  const { formatPeriod } = useFinanceDateFormat()
  const { data, isError, refetch } = useDepreciationRun()
  const post = usePostDepreciation()
  const [confirming, setConfirming] = React.useState(false)
  const posted = data?.status === "posted"

  const columns: FinanceColumn<DepreciationLine>[] = [
    { id: "tag", header: t("tag"), cell: (row) => <DocNumber href={`/finance/assets/${row.id}`}>{row.number}</DocNumber> },
    { id: "asset", header: t("asset"), cell: (row) => <span className="text-content-primary">{row.name}</span>, footer: t("totalCharge") },
    { id: "nbv", header: t("netBookEgp"), align: "end", cell: (row) => <Amount value={row.nbv} /> },
    {
      id: "charge",
      header: t("chargeEgp"),
      align: "end",
      cell: (row) => <Amount value={row.charge} />,
      footer: data ? <Amount value={data.total} emphasis="strong" /> : null,
    },
    ...(posted
      ? []
      : [{ id: "skip", header: <span className="sr-only">{t("skip")}</span>, align: "end" as const, cell: (row: DepreciationLine) => <SkipButton line={row} skip /> }]),
  ]

  const previewColumns: FinanceColumn<PreviewLine>[] = [
    {
      id: "account",
      header: t("account"),
      cell: (row) => (
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-xs">{row.account}</span>
          <span className="text-content-secondary">{row.name}</span>
        </span>
      ),
    },
    { id: "debit", header: t("debit"), align: "end", cell: (row) => (row.debit ? <Amount value={row.debit} /> : null), footer: data ? <Amount value={data.total} emphasis="strong" /> : null },
    { id: "credit", header: t("credit"), align: "end", cell: (row) => (row.credit ? <Amount value={row.credit} /> : null), footer: data ? <Amount value={data.total} emphasis="strong" /> : null },
  ]

  const periodLabel = data ? formatPeriod(data.period) : ""

  return (
    <>
      <FinancePageHeader
        title={t("depreciationRun")}
        figure={
          data ? (
            <HeaderFigure label={t("periodChargeLabel", { period: periodLabel })} size="lg">
              {formatAmount(data.total)}
            </HeaderFigure>
          ) : null
        }
        actions={
          data ? (
            posted && data.entry ? (
              <Button variant="secondary" asChild>
                <Link href={`/finance/journals/${data.entry}`}>{t("viewEntry")}</Link>
              </Button>
            ) : (
              <Button variant="primary" disabled={data.count === 0} onClick={() => setConfirming(true)}>
                {t("postDepreciation")}
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
                {t("runPostedNotice", { entry: data.entry ?? "" })}
              </FinanceAlert>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("assetsInRun")} value={data.count} caption={t("skippedCount", { count: data.skipped })} />
              <KpiCard layout="bar" accent="teal" label={t("periodChargeEgp")} value={formatAmount(data.total)} />
              <KpiCard layout="bar" accent="amber" label={t("accountsCredited")} value={data.by_category.length} caption={t("byCategory")} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="flex flex-col gap-6">
                <FinanceSection title={t("perAssetCharge")}>
                  <FinanceTable caption={t("depreciationFor", { period: periodLabel })} columns={columns} rows={data.items} getRowId={(row) => row.id} />
                </FinanceSection>
                {!posted && data.set_aside.length > 0 ? (
                  <FinanceSection title={t("skippedThisRun")} description={t("skippedThisRunDescription")}>
                    <FinanceTable
                      caption={t("assetsSkippedThisRun")}
                      columns={[
                        columns[0],
                        { id: "asset", header: t("asset"), cell: (row) => row.name },
                        { id: "charge", header: t("chargeEgp"), align: "end", cell: (row) => <Amount value={row.charge} emphasis="muted" /> },
                        { id: "include", header: <span className="sr-only">{t("include")}</span>, align: "end", cell: (row) => <SkipButton line={row} skip={false} /> },
                      ]}
                      rows={data.set_aside}
                      getRowId={(row) => row.id}
                    />
                  </FinanceSection>
                ) : null}
              </div>
              <FinanceSection title={t("postingPreview")}>
                <FinanceTable caption={t("entryTheRunPosts")} columns={previewColumns} rows={previewLines(t, data)} getRowId={(row) => row.id} />
                <p className="text-content-secondary text-[13px] leading-5">
                  {t("postingPreviewNote")}
                </p>
              </FinanceSection>
            </div>
          </>
        )}
      </FinancePageBody>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("postRunTitle")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <FinanceAlert tone="warning">
                  {t("postRunDescription")}
                </FinanceAlert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={post.isPending}
              onClick={() =>
                post.mutate(undefined, {
                  onSuccess: (run) => toast.success(t("toastDepreciationPosted", { period: formatPeriod(run.period), entry: run.entry ?? "" })),
                  onError: (error) => toast.error(errorMessage(error, t("errorPostRun"))),
                })
              }
            >
              {t("postDepreciation")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { DepreciationRunPage }
