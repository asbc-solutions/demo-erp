"use client"

import { Link } from "@/src/i18n/navigation"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { AttentionList } from "../../../components/shared/attention-list"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import { formatAmount } from "../../../lib/utils/money"
import { useFinanceHome } from "../../lib/queries/overview"
import type { FinanceHome } from "../../lib/types/overview"
import { CashWeeksChart } from "./cash-weeks-chart"
import { CloseProgress } from "./close-progress"

function HomeFigures({ data }: { data: FinanceHome }) {
  const t = useTranslations("FinanceOverview")
  const { formatDateTime } = useFinanceDateFormat()
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-0.5">
        <span className="text-content-secondary text-sm leading-5">{t("cashOnHand")}</span>
        <span className="text-content-primary text-2xl leading-8 font-bold tabular-nums">
          {data.cash.currency} {formatAmount(data.cash.total)}
        </span>
        <span className="text-content-tertiary text-[13px] leading-5">
          {t("cashAcross", {
            count: data.cash.accounts,
            updated: formatDateTime(data.cash.updated_at, " "),
          })}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          layout="bar"
          accent="indigo"
          label={t("receivablesOutstanding")}
          value={formatAmount(data.receivables.outstanding)}
          caption={t("amountOverdue", { amount: formatAmount(data.receivables.overdue) })}
        />
        <KpiCard
          layout="bar"
          accent="teal"
          label={t("payablesOutstanding")}
          value={formatAmount(data.payables.outstanding)}
          caption={t("amountDueThisWeek", { amount: formatAmount(data.payables.due_this_week) })}
        />
        <KpiCard
          layout="bar"
          accent="amber"
          label={t("netResult", { period: data.net_result.period_label })}
          value={formatAmount(data.net_result.amount)}
        />
      </div>
    </div>
  )
}

function HomeSkeleton() {
  const t = useTranslations("FinanceOverview")
  return (
    <div aria-busy aria-label={t("loadingHome")} className="flex flex-col gap-6">
      <FinanceTilesSkeleton />
      <Skeleton className="h-64 rounded-[14px]" />
      <Skeleton className="h-64 rounded-[14px]" />
    </div>
  )
}

/** 01.01 · Finance home — cash, open balances, what needs attention, the close. */
function FinanceHomePage() {
  const t = useTranslations("FinanceOverview")
  const { formatDateTime } = useFinanceDateFormat()
  const { data, isError, refetch } = useFinanceHome()

  return (
    <>
      <FinancePageHeader
        title={t("homeTitle")}
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/journals/new">
              <Plus aria-hidden />
              {t("newEntry")}
            </Link>
          </Button>
        }
      />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <HomeSkeleton />
        ) : (
          <>
            <HomeFigures data={data} />

            <FinanceSection title={t("needsAttention")}>
              <AttentionList items={data.attention} />
            </FinanceSection>

            <FinanceSection title={t("cashOver13Weeks")}>
              <CashWeeksChart weeks={data.cash_weeks} />
            </FinanceSection>

            <FinanceSection
              title={t("closeProgressTitle")}
              action={
                <Link
                  href="/finance/close"
                  className="text-brand-primary text-[13px] leading-5 font-medium hover:underline"
                >
                  {t("openCloseWorkspace")}
                </Link>
              }
            >
              <CloseProgress
                tasks={data.close.tasks}
                done={data.close.done}
                total={data.close.total}
              />
            </FinanceSection>

            <FinanceSection
              title={t("recentActivity")}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/finance/audit">{t("openAuditLog")}</Link>
                </Button>
              }
            >
              <ul className="-mt-2 flex flex-col">
                {data.activity.map((event) => (
                  <li
                    key={event.id}
                    className="border-stroke-light flex flex-col gap-x-3 gap-y-0.5 border-b py-2 sm:flex-row"
                  >
                    <span className="text-content-tertiary w-40 shrink-0 text-[13px] leading-5 tabular-nums">
                      {formatDateTime(event.at)}
                    </span>
                    <span className="text-content-primary text-sm leading-5">
                      {event.actor} · {event.action} ·{" "}
                      {event.href ? (
                        <Link href={event.href} className="hover:underline">
                          {event.subject}
                        </Link>
                      ) : (
                        event.subject
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </FinanceSection>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { FinanceHomePage }
