"use client"

import { Link } from "@/src/i18n/navigation"
import { Banknote, Landmark } from "lucide-react"
import { useTranslations } from "next-intl"

import { KpiCard, type KpiAccent } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { Amount } from "../../../components/shared/amount"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import {
  FinancePageBody,
  FinancePageHeader,
  HeaderFigure,
} from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatAmount } from "../../../lib/utils/money"
import { useCashPosition } from "../../lib/queries/overview"
import type { TreasuryPosition } from "../../lib/types/overview"

const CURRENCY_ACCENTS: readonly KpiAccent[] = ["indigo", "teal", "amber", "blue", "emerald", "violet"]

/** A cash account with its share of the largest balance, in the base currency. */
function TreasuryRow({ treasury, largest }: { treasury: TreasuryPosition; largest: number }) {
  const t = useTranslations("FinanceOverview")
  const Icon = treasury.kind === "bank" ? Landmark : Banknote
  const share = largest > 0 ? Math.max(2, (treasury.base_amount / largest) * 100) : 0
  const foreign = treasury.base_amount !== treasury.balance

  return (
    <Link
      href={`/finance/treasuries/${treasury.id}`}
      className="border-stroke-default bg-surface-white hover:border-stroke-input focus-visible:ring-brand-primary/20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border px-4 py-3 outline-none transition-colors focus-visible:ring-[3px] md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,2fr)_auto]"
    >
      <Icon aria-hidden className="text-content-tertiary size-4.5" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-content-primary truncate text-[13px] leading-5 font-medium">
          {treasury.name}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-content-secondary font-mono text-xs leading-4">{treasury.currency}</span>
          {treasury.unmatched_lines > 0 ? (
            <StatusPill status="unreconciled" label={t("unmatchedCount", { count: treasury.unmatched_lines })} />
          ) : null}
        </span>
      </div>
      <div
        aria-hidden
        className="bg-surface-hover hidden h-2 overflow-hidden rounded-full md:block"
      >
        <div className="bg-brand-primary h-full rounded-full" style={{ width: `${share}%` }} />
      </div>
      <Amount
        value={treasury.balance}
        emphasis="default"
        className="text-sm leading-5 font-medium"
        base={foreign ? { value: treasury.base_amount, currency: "EGP" } : undefined}
      />
    </Link>
  )
}

/** 01.02 · Cash position — every bank and treasury, restated in EGP. */
function CashPositionPage() {
  const t = useTranslations("FinanceOverview")
  const { data, isError, refetch } = useCashPosition()
  const largest = Math.max(0, ...(data?.treasuries ?? []).map((row) => row.base_amount))

  return (
    <>
      <FinancePageHeader
        title={t("cashPositionTitle")}
        figure={
          data ? (
            <HeaderFigure size="lg" label={t("totalCashEquivalent", { currency: data.base_currency })}>
              {formatAmount(data.total)}
            </HeaderFigure>
          ) : null
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <div aria-busy aria-label={t("loadingCashPosition")} className="flex flex-col gap-6">
            <FinanceTilesSkeleton count={4} className="md:grid-cols-4" />
            <Skeleton className="h-72 rounded-[14px]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              <KpiCard
                layout="bar"
                accent="indigo"
                label={t("bankBalances", { currency: data.base_currency })}
                value={formatAmount(data.banks.amount)}
                caption={t("accountsCount", { count: data.banks.count })}
              />
              <KpiCard
                layout="bar"
                accent="teal"
                label={t("cashOnHandEq", { currency: data.base_currency })}
                value={formatAmount(data.cash_on_hand.amount)}
                caption={t("treasuriesCount", { count: data.cash_on_hand.count })}
              />
              <KpiCard
                layout="bar"
                accent="amber"
                label={t("currenciesHeld")}
                value={data.currencies.length}
              />
              <KpiCard
                layout="bar"
                accent="blue"
                label={t("unreconciledLines")}
                value={data.unreconciled_lines}
              />
            </div>

            <FinanceSection title={t("byCurrency")}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                {data.currencies.map((currency, index) => (
                  <KpiCard
                    key={currency.code}
                    layout="bar"
                    accent={CURRENCY_ACCENTS[index % CURRENCY_ACCENTS.length]}
                    label={currency.code}
                    value={formatAmount(currency.amount)}
                    caption={
                      currency.code === data.base_currency
                        ? undefined
                        : `≈ ${formatAmount(currency.base_amount)} ${data.base_currency}`
                    }
                  />
                ))}
              </div>
            </FinanceSection>

            <FinanceSection title={t("treasuries")}>
              <div className="flex flex-col gap-2">
                {data.treasuries.map((treasury) => (
                  <TreasuryRow key={treasury.id} treasury={treasury} largest={largest} />
                ))}
              </div>
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { CashPositionPage }
