"use client"

import { Link } from "@/src/i18n/navigation"
import { CircleAlert, Landmark, Vault } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import type { FinanceTreasury } from "../../../lib/types/common"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useBankingOverview } from "../../lib/queries/banking"

function TreasuryCard({ treasury }: { treasury: FinanceTreasury }) {
  const t = useTranslations("FinanceBanking")
  const { formatDate } = useFinanceDateFormat()
  const Icon = treasury.kind === "bank" ? Landmark : Vault
  return (
    <Link
      href={`/finance/treasuries/${treasury.id}`}
      className="border-stroke-default bg-surface-white hover:border-stroke-input focus-visible:ring-ring flex flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors outline-none focus-visible:ring-2"
    >
      <span className="text-content-primary flex items-center gap-2 text-sm leading-5 font-medium">
        <Icon className="text-content-secondary size-4" aria-hidden />
        {treasury.name}
      </span>
      <span className="flex items-center gap-2">
        <StatusPill status="prepared" label={treasury.currency} />
        {treasury.account_last4 ? (
          <span
            className="text-content-secondary font-mono text-xs"
            aria-label={t("accountEnding", { last4: treasury.account_last4 })}
          >
            •••• {treasury.account_last4}
          </span>
        ) : null}
      </span>
      <Amount
        value={treasury.balance}
        currency={treasury.currency}
        align="start"
        emphasis="strong"
        signed
        className="text-[13px] leading-5"
        base={
          treasury.currency === "EGP"
            ? undefined
            : { value: treasury.base_balance, currency: "EGP", rate: treasury.rate }
        }
      />
      <span className="border-stroke-light mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs leading-4">
        <span className="text-content-tertiary">
          {treasury.last_reconciled
            ? t("reconciledOn", { date: formatDate(treasury.last_reconciled) })
            : t("neverReconciled")}
        </span>
        {treasury.unmatched_lines > 0 ? (
          <span className="text-status-danger-fg flex items-center gap-1">
            <CircleAlert className="size-3.5" aria-hidden />
            {t("unmatchedCount", { count: treasury.unmatched_lines })}
          </span>
        ) : (
          <StatusPill status="reconciled" label={t("clean")} />
        )}
      </span>
    </Link>
  )
}

/** 04.01 · Treasuries & banks — every cash account, its balance and whether it is reconciled. */
function TreasuriesPage() {
  const t = useTranslations("FinanceBanking")
  const { data, isError, refetch } = useBankingOverview()

  return (
    <>
      <FinancePageHeader
        title={t("treasuriesTitle")}
        figure={data ? <HeaderFigure label={t("cashOnHandEgp")}>{formatAmount(data.total_base)}</HeaderFigure> : null}
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/transfers">{t("newTransfer")}</Link>
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={t("loadingTreasuries")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-36 rounded-xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("accounts")}
                value={data.accounts}
                caption={t("bankCashSplit", { banks: data.banks, tills: data.tills })}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("unmatchedBankLines")}
                value={data.unmatched_lines}
                caption={data.unmatched_lines > 0 ? t("awaitingReconciliation") : t("allMatched")}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("currencies")}
                value={data.currencies.length}
                caption={data.currencies.join(" · ")}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.treasuries.map((treasury) => (
                <TreasuryCard key={treasury.id} treasury={treasury} />
              ))}
            </div>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { TreasuriesPage }
