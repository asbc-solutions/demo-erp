"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/src/i18n/navigation"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import { cn } from "@/src/shared/lib/utils/utils"

import { FilterSearch } from "../../../components/shared/filter-bar"
import { FinanceErrorState, FinanceTilesSkeleton } from "../../../components/shared/finance-states"
import { FinanceTable, type FinanceColumn } from "../../../components/shared/finance-table"
import { FinancePageBody, FinancePageHeader, HeaderFigure } from "../../../components/shared/page-header"
import { StatusPill } from "../../../components/shared/status-pill"
import { useFinanceDateFormat } from "../../../lib/hooks/use-finance-date-format"
import type { FinanceDateFormat } from "../../../lib/utils/date"
import { useAuditLog } from "../../lib/queries/reports"
import type { AuditEvent, AuditSource, ReportsMessageKey, ReportsTranslator } from "../../lib/types/reports"

const PAGE = 200

const FILTERS: { value: "all" | AuditSource; labelKey: ReportsMessageKey }[] = [
  { value: "all", labelKey: "all" },
  { value: "ui", labelKey: "sourceUser" },
  { value: "import", labelKey: "sourceImport" },
  { value: "system", labelKey: "sourceSystem" },
]

const SOURCE_LABEL_KEY: Record<AuditSource, ReportsMessageKey> = { ui: "sourceUi", import: "sourceImportPill", system: "sourceSystemPill" }

const SOURCE_TONE = { ui: "info", import: "success", system: "neutral" } as const

function buildColumns(t: ReportsTranslator, formatShortDateTime: FinanceDateFormat["formatShortDateTime"]): FinanceColumn<AuditEvent>[] {
  return [
    { id: "when", header: t("when"), width: "w-36", cell: (row) => <span className="tabular-nums">{formatShortDateTime(row.at)}</span> },
    { id: "actor", header: t("actor"), cell: (row) => <span className="text-content-primary font-medium">{row.actor}</span> },
    { id: "action", header: t("action"), cell: (row) => <span className="text-content-primary">{row.action}</span> },
    {
      id: "object",
      header: t("object"),
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
    { id: "source", header: t("source"), cell: (row) => <StatusPill status={`source-${row.source}`} label={t(SOURCE_LABEL_KEY[row.source])} tone={SOURCE_TONE[row.source]} /> },
  ]
}

/** 10.09 · Audit log — who did what to which record, newest first. */
function AuditLogPage() {
  const t = useTranslations("FinanceReports")
  const { formatShortDateTime } = useFinanceDateFormat()
  const locale = useIntlLocale()
  const columns = React.useMemo(() => buildColumns(t, formatShortDateTime), [t, formatShortDateTime])
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
      <FinancePageHeader title={t("auditLog")} figure={data ? <HeaderFigure label={t("eventsAllTime")}>{data.total.toLocaleString(locale)}</HeaderFigure> : null} />
      <FinancePageBody>
        {isError ? (
          <FinanceErrorState onRetry={() => refetch()} />
        ) : !data ? (
          <FinanceTilesSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:grid-cols-5">
              <KpiCard layout="bar" accent="indigo" label={t("userActions")} value={data.user.toLocaleString(locale)} />
              <KpiCard layout="bar" accent="teal" label={t("imports")} value={data.imports.toLocaleString(locale)} />
              <KpiCard layout="bar" accent="amber" label={t("sourceSystem")} value={data.system.toLocaleString(locale)} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label={t("filterBySource")} className="flex flex-wrap gap-1.5">
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
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
              <FilterSearch placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>

            <FinanceTable
              caption={t("auditEvents")}
              columns={columns}
              rows={shown}
              getRowId={(row) => row.id}
              empty={<p className="text-content-tertiary py-8 text-center text-sm">{t("noEventsMatch")}</p>}
            />
            <p className="text-content-secondary text-[13px] leading-5">
              {matching.length > PAGE
                ? t("showingRecent", { page: PAGE, total: matching.length.toLocaleString(locale) })
                : t("showingEvents", { count: matching.length })}
            </p>
          </>
        )}
      </FinancePageBody>
    </>
  )
}

export { AuditLogPage }
