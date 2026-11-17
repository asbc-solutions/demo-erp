"use client"

import { Link } from "@/src/i18n/navigation"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard, type KpiAccent } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useAssistantBriefing } from "../../lib/queries/overview"
import type { AssistantBriefing } from "../../lib/types/assistant"

type BriefingItem = AssistantBriefing["items"][number]

const TILE_ACCENTS: readonly KpiAccent[] = ["indigo", "teal", "amber", "blue"]

type AssistantT = ReturnType<typeof useTranslations<"FinanceAssistant">>

function briefingColumns(t: AssistantT, formatDate: FinanceDateFormat["formatDate"]): FinanceColumn<BriefingItem>[] {
  return [
    { id: "item", header: t("colLookAtToday"), cell: (row) => row.item },
    { id: "count", header: t("colCount"), align: "end", width: "w-20", cell: (row) => row.count },
    { id: "oldest", header: t("colOldest"), cell: (row) => formatDate(row.oldest) },
    { id: "owner", header: t("colOwner"), cell: (row) => row.owner },
    {
      id: "destination",
      header: t("colWhereItGoes"),
      cell: (row) => (
        <Link href={row.href} className="text-brand-primary hover:underline">
          {row.destination}
        </Link>
      ),
    },
  ]
}

/**
 * Briefing — what needs a person today, read straight from Finance Core. It
 * needs no model, so it keeps working while the assistant is offline.
 */
function BriefingTab({
  entityCode,
  scopeLabel,
  onAsk,
}: {
  entityCode: string
  scopeLabel: string
  onAsk: (question: string) => void
}) {
  const t = useTranslations("FinanceAssistant")
  const { formatDate, formatTime } = useFinanceDateFormat()
  const { data, isError, isFetching, refetch } = useAssistantBriefing()

  if (isError) return <FinanceErrorState onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-content-secondary text-sm leading-5">{t("briefingIntro")}</p>
        <div className="ms-auto flex items-center gap-3">
          <StatusPill status="pending" label={t("scopeLabel", { scope: entityCode })} />
          {data ? (
            <span className="text-content-tertiary text-[13px] leading-5">
              {t("lastComputed", { time: formatTime(data.computed_at) })}
            </span>
          ) : null}
          <Button variant="secondary" size="sm" disabled={isFetching} onClick={() => refetch()}>
            <RefreshCw aria-hidden className={cn(isFetching && "animate-spin")} />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {!data ? (
        <div aria-busy aria-label={t("loadingBriefing")} className="flex flex-col gap-6">
          <FinanceTilesSkeleton count={4} className="md:grid-cols-4" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
            {data.tiles.map((tile, index) => (
              <KpiCard
                key={tile.id}
                layout="bar"
                accent={TILE_ACCENTS[index % TILE_ACCENTS.length]}
                label={tile.label}
                value={tile.value}
                caption={tile.caption}
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <FinanceTable
              caption={t("briefingCaption")}
              columns={briefingColumns(t, formatDate)}
              rows={data.items}
              getRowId={(row) => row.id}
            />
            <p className="text-content-tertiary text-[13px] leading-5">
              {t("briefingFooter", { scope: scopeLabel, count: data.items.length })}
            </p>
          </div>

          <section aria-labelledby="briefing-follow-ups" className="flex flex-col gap-2">
            <h3 id="briefing-follow-ups" className="text-content-secondary text-[13px] leading-5 font-medium">
              {t("askAboutThis")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.follow_ups.map((question) => (
                <Button key={question} variant="secondary" size="sm" onClick={() => onAsk(question)}>
                  {question}
                </Button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export { BriefingTab }
