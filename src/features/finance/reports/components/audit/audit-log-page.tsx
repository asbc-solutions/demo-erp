"use client"

import * as React from "react"
import { Link } from "@/src/i18n/navigation"

import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { cn } from "@/src/shared/lib/utils/utils"

import { FilterSearch } from "../../../components/shared/filter-bar"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { formatShortDateTime } from "../../../lib/utils/date"
import { useAuditLog } from "../../lib/queries/reports"
import type { AuditEvent, AuditSource } from "../../lib/types/reports"

const PAGE = 200

const FILTERS: { value: "all" | AuditSource; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ui", label: "User" },
  { value: "import", label: "Import" },
  { value: "system", label: "System" },
]

const SOURCE_TONE = { ui: "info", import: "success", system: "neutral" } as const

const COLUMNS: FinanceColumn<AuditEvent>[] = [
  { id: "when", header: "When", width: "w-36", cell: (row) => <span className="tabular-nums">{formatShortDateTime(row.at)}</span> },
  { id: "actor", header: "Actor", cell: (row) => <span className="text-content-primary font-medium">{row.actor}</span> },
  { id: "action", header: "Action", cell: (row) => <span className="text-content-primary">{row.action}</span> },
  {
    id: "object",
    header: "Object",
    cell: (row) => (
      <span className="flex items-baseline gap-1.5">
        <span className="text-content-tertiary">{row.object_type}</span>
        {row.href ? (
          <Link href={row.href} className="text-content-primary font-mono text-xs hover:underline">
            {row.object}
          </Link>
        ) : (
          <span className="text-content-primary font-mono text-xs">{row.object}</span>
        )}
      </span>
    ),
  },
  { id: "source", header: "Source", cell: (row) => <StatusPill status={`source-${row.source}`} label={row.source} tone={SOURCE_TONE[row.source]} /> },
]

/** 10.09 · Audit log — who did what to which record, newest first. */
function AuditLogPage() {
  const { data, isError, refetch } = useAuditLog()
  const [source, setSource] = React.useState<"all" | AuditSource>("all")
  const [query, setQuery] = React.useState("")
  const deferred = React.useDeferredValue(query.trim().toLowerCase())

  const matching =
    data?.items.filter(
      (row) =>
        (source === "all" || row.source === source) &&
        (!deferred || `${row.actor} ${row.action} ${row.object_type} ${row.object}`.toLowerCase().includes(deferred)),
    ) ?? []
  const shown = matching.slice(0, PAGE)

  return (
    <>
      <FinancePageHeader title="Audit log" figure={data ? <HeaderFigure label="Events (all time)">{data.total.toLocaleString("en-US")}</HeaderFigure> : null} />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label="User actions" value={data.user.toLocaleString("en-US")} />
              <KpiCard layout="bar" accent="teal" label="Imports" value={data.imports.toLocaleString("en-US")} />
              <KpiCard layout="bar" accent="amber" label="System" value={data.system.toLocaleString("en-US")} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Filter by source" className="flex flex-wrap gap-1.5">
                {FILTERS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={source === option.value}
                    onClick={() => setSource(option.value)}
                    className={cn(
                      "border-stroke-default text-content-secondary rounded-md border px-3 py-1 text-[13px] leading-5 outline-none focus-visible:ring-2",
                      source === option.value && "border-brand-primary bg-brand-primary/10 text-content-primary font-medium",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <FilterSearch placeholder="Search actor, action, object…" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>

            <FinanceTable
              caption="Audit events"
              columns={COLUMNS}
              rows={shown}
              getRowId={(row) => row.id}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">No events match. Clear the search or pick another source.</p>}
            />
            <p className="text-content-secondary text-[13px] leading-5">
              {matching.length > PAGE
                ? `Showing the most recent ${PAGE} of ${matching.length.toLocaleString("en-US")} matching events. Narrow the filters to see older activity.`
                : `Showing ${matching.length.toLocaleString("en-US")} ${matching.length === 1 ? "event" : "events"}.`}
            </p>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AuditLogPage }
