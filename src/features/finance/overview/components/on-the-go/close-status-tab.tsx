"use client"

import { Link } from "@/src/i18n/navigation"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { FinanceAlert } from "../../../components/shared/finance-alert"
import { FinanceSection } from "../../../components/shared/finance-section"
import { FinanceErrorState } from "../../../components/shared/finance-states"
import { useCloseReadiness } from "../../lib/queries/overview"

/** Close status — whether the period can close, so you know before you are asked. */
function CloseStatusTab() {
  const t = useTranslations("FinanceOverview")
  const { data, isError, refetch } = useCloseReadiness()

  if (isError) return <FinanceErrorState onRetry={() => refetch()} />
  if (!data) return <Skeleton aria-busy aria-label={t("loadingCloseStatus")} className="h-64 rounded-xl" />

  const blocking = data.checks.length

  return (
    <div className="flex flex-col gap-4">
      {blocking > 0 ? (
        <FinanceAlert tone="warning" className="text-status-warning-fg">
          {t("blockingCount", { count: blocking })}
        </FinanceAlert>
      ) : (
        <FinanceAlert tone="success">
          {t("nothingInTheWay", { period: data.period_label })}
        </FinanceAlert>
      )}
      <p className="text-content-tertiary text-[13px] leading-5">{t("closeStatusNote")}</p>
      {blocking > 0 ? (
        <FinanceSection title={t("whatIsInTheWay")}>
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
                  <ChevronRight aria-hidden className="text-content-quaternary size-4 shrink-0 rtl:rotate-180" />
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
