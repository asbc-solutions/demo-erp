"use client"

import { Link } from "@/src/i18n/navigation"
import { RefreshCw } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { KpiCard, type KpiAccent } from "@/src/shared/components/ui/kpi-card"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"

import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatDate, formatTime } from "../../../lib/utils/date"
import { useAssistantBriefing } from "../../lib/queries/overview"
import type { AssistantBriefing } from "../../lib/types/assistant"

type BriefingItem = AssistantBriefing["items"][number]

const TILE_ACCENTS: readonly KpiAccent[] = ["indigo", "teal", "amber", "blue"]

const COLUMNS: FinanceColumn<BriefingItem>[] = [
  { id: "item", header: "What I'd look at today", cell: (row) => row.item },
  { id: "count", header: "Count", align: "end", width: "w-20", cell: (row) => row.count },
  { id: "oldest", header: "Oldest", cell: (row) => formatDate(row.oldest) },
  { id: "owner", header: "Owner", cell: (row) => row.owner },
  {
    id: "destination",
    header: "Where it goes",
    cell: (row) => (
      <Link href={row.href} className="text-brand-primary hover:underline">
        {row.destination}
      </Link>
    ),
  },
]

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
  const { data, isError, isFetching, refetch } = useAssistantBriefing()

  if (isError) return <FinanceErrorState onRetry={() => refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-content-secondary text-sm leading-5">
          What still needs a person today, across every group you can see.
        </p>
        <div className="ms-auto flex items-center gap-3">
          <StatusPill status="pending" label={`Scope: ${entityCode}`} />
          {data ? (
            <span className="text-content-tertiary text-[13px] leading-5">
              Last computed {formatTime(data.computed_at)}
            </span>
          ) : null}
          <Button variant="secondary" size="sm" disabled={isFetching} onClick={() => refetch()}>
            <RefreshCw aria-hidden className={cn(isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {!data ? (
        <div aria-busy aria-label="Loading briefing" className="flex flex-col gap-6">
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
              caption="What needs a person today"
              columns={COLUMNS}
              rows={data.items}
              getRowId={(row) => row.id}
            />
            <p className="text-content-tertiary text-[13px] leading-5">
              Scope: {scopeLabel} · {data.items.length} items · every count equals its source screen
            </p>
          </div>

          <section aria-labelledby="briefing-follow-ups" className="flex flex-col gap-2">
            <h3 id="briefing-follow-ups" className="text-content-secondary text-[13px] leading-5 font-medium">
              Ask about this
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
