"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { AttentionList } from "../../../components/shared/attention-list"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinancePageBody, FinancePageHeader } from "../../../components/shared/page-header"
import { formatDateTime } from "../../../lib/utils/date"
import { formatAmount } from "../../../lib/utils/money"
import { useFinanceHome } from "../../lib/queries/overview"
import type { FinanceHome } from "../../lib/types/overview"
import { CashWeeksChart } from "./cash-weeks-chart"
import { CloseProgress } from "./close-progress"

function HomeFigures({ data }: { data: FinanceHome }) {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-0.5">
        <span className="text-content-secondary text-sm leading-5">Cash on hand</span>
        <span className="text-content-primary text-2xl leading-8 font-bold tabular-nums">
          {data.cash.currency} {formatAmount(data.cash.total)}
        </span>
        <span className="text-content-tertiary text-[13px] leading-5">
          across {data.cash.accounts} accounts · updated {formatDateTime(data.cash.updated_at, " ")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          layout="bar"
          accent="indigo"
          label="Receivables outstanding (EGP)"
          value={formatAmount(data.receivables.outstanding)}
          caption={`${formatAmount(data.receivables.overdue)} overdue`}
        />
        <KpiCard
          layout="bar"
          accent="teal"
          label="Payables outstanding (EGP)"
          value={formatAmount(data.payables.outstanding)}
          caption={`${formatAmount(data.payables.due_this_week)} due this week`}
        />
        <KpiCard
          layout="bar"
          accent="amber"
          label={`Net result — ${data.net_result.period_label}`}
          value={formatAmount(data.net_result.amount)}
        />
      </div>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div aria-busy aria-label="Loading finance home" className="flex flex-col gap-6">
      <FinanceTilesSkeleton />
      <Skeleton className="h-64 rounded-[14px]" />
      <Skeleton className="h-64 rounded-[14px]" />
    </div>
  )
}

/** 01.01 · Finance home — cash, open balances, what needs attention, the close. */
function FinanceHomePage() {
  const { data, isError, refetch } = useFinanceHome()

  return (
    <>
      <FinancePageHeader
        title="Finance home"
        actions={
          <Button variant="primary" asChild>
            <Link href="/finance/journals/new">
              <Plus aria-hidden />
              New entry
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

            <FinanceSection title="Needs your attention">
              <AttentionList items={data.attention} />
            </FinanceSection>

            <FinanceSection title="Cash over 13 weeks">
              <CashWeeksChart weeks={data.cash_weeks} />
            </FinanceSection>

            <FinanceSection
              title="Period close progress"
              action={
                <Link
                  href="/finance/close"
                  className="text-brand-primary text-[13px] leading-5 font-medium hover:underline"
                >
                  Open close workspace
                </Link>
              }
            >
              <CloseProgress
                tasks={data.close.tasks}
                done={data.close.done}
                total={data.close.total}
              />
            </FinanceSection>

            <FinanceSection title="Recent activity">
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
                      {event.actor} · {event.action} · {event.subject}
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
