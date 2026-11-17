"use client"

import { Link } from "@/src/i18n/navigation"
import { CircleCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { EmptyState } from "@/src/shared/components/ui/empty-state"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { FinanceErrorState } from "../../../components/shared/finance-states"
import { useFinanceExceptions } from "../../lib/queries/overview"

/** Exceptions — anything the module thinks is wrong, in one list, worst first. */
function ExceptionsTab() {
  const t = useTranslations("FinanceOverview")
  const { data: exceptions, isError, refetch } = useFinanceExceptions()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-content-tertiary text-[13px] leading-5">{t("exceptionsIntro")}</p>
      {isError ? (
        <FinanceErrorState onRetry={() => refetch()} />
      ) : !exceptions ? (
        <Skeleton aria-busy aria-label={t("loadingExceptions")} className="h-48 rounded-xl" />
      ) : exceptions.length === 0 ? (
        <EmptyState
          variant="card"
          icon={<CircleCheck />}
          title={t("exceptionsEmptyTitle")}
          description={t("exceptionsEmptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="border-stroke-default bg-surface-white flex items-center justify-between gap-4 rounded-xl border px-5 py-3 shadow-xs"
            >
              <span className="text-content-primary text-sm leading-5">{exception.label}</span>
              <Button variant="secondary" size="sm" asChild>
                <Link href={exception.href} aria-label={t("openLabel", { label: exception.label })}>
                  {t("open")}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { ExceptionsTab }
