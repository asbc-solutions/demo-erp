"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { useCloseReadiness } from "../../lib/queries/overview"

/** Close status — whether the period can close, so you know before you are asked. */
function CloseStatusTab() {
  const { data, isError, refetch } = useCloseReadiness()

  if (isError) return <FinanceErrorState onRetry={() => refetch()} />
  if (!data) return <Skeleton aria-busy aria-label="Loading close status" className="h-64 rounded-xl" />

  const blocking = data.checks.length

  return (
    <div className="flex flex-col gap-4">
      {blocking > 0 ? (
        <FinanceAlert tone="warning" className="text-status-warning-fg">
          {blocking === 1 ? "1 thing is" : `${blocking} things are`} still in the way.
        </FinanceAlert>
      ) : (
        <FinanceAlert tone="success">
          Nothing is in the way. {data.period_label} can be closed from the close workspace.
        </FinanceAlert>
      )}
      <p className="text-content-tertiary text-[13px] leading-5">
        Closing itself is a desk job. This tells you whether it can happen, so you know before you are asked.
      </p>
      {blocking > 0 ? (
        <FinanceSection title="What is in the way">
          <ul className="flex flex-col gap-2">
            {data.checks.map((check) => (
              <li key={check.id}>
                <Link
                  href={check.href}
                  className="border-stroke-default bg-surface-white hover:border-stroke-input focus-visible:ring-brand-primary/20 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-xs outline-none transition-colors focus-visible:ring-[3px]"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-content-primary text-sm leading-5">{check.title}</span>
                    <span className="text-content-secondary text-[13px] leading-5">{check.detail}</span>
                  </span>
                  <ChevronRight aria-hidden className="text-content-quaternary size-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </FinanceSection>
      ) : null}
    </div>
  )
}

export { CloseStatusTab }
