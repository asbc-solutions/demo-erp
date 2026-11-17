"use client"

import { Link } from "@/src/i18n/navigation"
import { ArrowLeftRight, ArrowRight, SearchX } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { DocNumber } from "../../../components/shared/doc-number"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
  MetaChips,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useTreasuryDetail } from "../../lib/queries/banking"
import type { TreasuryMovement } from "../../lib/types/banking"

type BankingT = ReturnType<typeof useTranslations<"FinanceBanking">>

function movementColumns(t: BankingT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<TreasuryMovement>[] {
  return [
    { id: "date", header: t("colDate"), cell: (row) => formatDate(row.date) },
    { id: "entry", header: t("colEntry"), cell: (row) => <DocNumber>{row.entry}</DocNumber> },
    {
      id: "description",
      header: t("colDescription"),
      cell: (row) => <span className="block max-w-80 truncate">{row.description}</span>,
    },
    {
      id: "source",
      header: t("colSource"),
      cell: (row) =>
        row.source_href ? (
          <Link
            href={row.source_href}
            className="border-stroke-default text-content-primary hover:bg-surface-hover inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-xs"
          >
            {row.source}
            <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
          </Link>
        ) : (
          <span className="text-content-tertiary">{row.source}</span>
        ),
    },
    {
      id: "in",
      header: t("colIn"),
      align: "end",
      cell: (row) => (row.amount > 0 ? <Amount value={row.amount} /> : null),
    },
    {
      id: "out",
      header: t("colOut"),
      align: "end",
      cell: (row) => (row.amount < 0 ? <Amount value={-row.amount} /> : null),
    },
  ]
}

type CommonT = ReturnType<typeof useTranslations<"Common">>

function daysAgo(days: number | null, t: BankingT, tCommon: CommonT) {
  if (days === null) return undefined
  return days === 0 ? tCommon("today") : days === 1 ? tCommon("yesterday") : t("daysAgo", { days })
}

/** 04.03 · Treasury — one cash account's book balance, reconciliation state and movements. */
function TreasuryDetailPage({ treasuryId }: { treasuryId: string }) {
  const t = useTranslations("FinanceBanking")
  const tCommon = useTranslations("Common")
  const { formatDate } = useFinanceDateFormat()
  const { data, isError, isPending, refetch } = useTreasuryDetail(treasuryId)

  if (isError) {
    return (
      <>
        <FinancePageHeader title={t("treasury")} />
        <FinancePageBody>
          <FinanceErrorState onRetry={() => refetch()} />
        </FinancePageBody>
      </>
    )
  }

  if (!isPending && !data) {
    return (
      <>
        <FinancePageHeader title={t("treasuryNotFound")} />
        <FinancePageBody>
          <EmptyState
            variant="card"
            icon={<SearchX />}
            title={t("noTreasuryWithCode")}
            description={t("treasuryNotFoundDescription")}
            actions={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/finance/treasuries">{t("openTreasuries")}</Link>
              </Button>
            }
          />
        </FinancePageBody>
      </>
    )
  }

  return (
    <>
      <FinancePageHeader
        title={data?.name ?? t("treasury")}
        figure={
          data ? (
            <HeaderFigure label={t("bookBalance")}>
              <Amount value={data.balance} currency={data.currency} align="start" signed />
            </HeaderFigure>
          ) : null
        }
        actions={
          data ? (
            <Button variant="secondary" asChild>
              <Link href={`/finance/ledger?account=${data.account_code}`}>{t("viewLedger")}</Link>
            </Button>
          ) : null
        }
      />
      <FinancePageBody>
        {!data ? (
          <div aria-busy aria-label={t("loadingTreasury")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <>
            <MetaChips>
              <StatusPill status="prepared" label={data.kind === "bank" ? t("bankAccount") : t("cashTreasury")} />
              <StatusPill status="prepared" label={data.currency} />
              <span className="text-content-primary font-mono text-xs">{data.account_code}</span>
              <span>{data.name}</span>
            </MetaChips>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("openingBalance")}
                value={`${formatAmount(data.opening_balance)} ${data.currency}`}
                caption={t("beforeMovements")}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("lastReconciled")}
                value={data.last_reconciled ? formatDate(data.last_reconciled) : t("never")}
                caption={daysAgo(data.days_since_reconciled, t, tCommon)}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("unmatchedLines")}
                value={data.unmatched_lines}
                caption={
                  data.unmatched_lines > 0 ? (
                    <Link href={`/finance/reconciliation/${data.id}`} className="hover:underline">
                      {t("reconcileNow")}
                    </Link>
                  ) : (
                    t("allMatched")
                  )
                }
              />
            </div>

            <FinanceSection
              title={t("recentMovements")}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/finance/transfers?from=${data.id}`}>
                    <ArrowLeftRight aria-hidden />
                    {t("transfer")}
                  </Link>
                </Button>
              }
            >
              <FinanceTable
                caption={t("movementsOn", { name: data.name })}
                columns={movementColumns(t, formatDate)}
                rows={data.movements}
                getRowId={(row) => row.id}
                empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noMovements")}</p>}
              />
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { TreasuryDetailPage }
