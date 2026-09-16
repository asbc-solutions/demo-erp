"use client"

import * as React from "react"
import {
  Download,
  Layers,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { Input } from "@/src/shared/components/ui/input"
import { KpiCard } from "@/src/shared/components/ui/kpi-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  MODULE_IDS,
  TRACKED_MODULES,
  getModuleLabel,
} from "@/src/shared/lib/constants/modules"
import { cn } from "@/src/shared/lib/utils/utils"

import { toCsv } from "../lib/format"
import type { VisitorRecord } from "../lib/types"
import { useTrackingSummary } from "../lib/use-tracking-summary"
import { ModuleInterestChart } from "./module-interest-chart"
import { BreakdownCard, OnboardingFunnelCard } from "./onboarding-insights"
import { VisitorDetailSheet } from "./visitor-detail-sheet"
import { VisitorsTable } from "./visitors-table"

const RANGES = [
  { id: "24h", label: "24h", hours: 24 },
  { id: "7d", label: "7 days", hours: 24 * 7 },
  { id: "30d", label: "30 days", hours: 24 * 30 },
  { id: "all", label: "All time", hours: Infinity },
] as const

type RangeId = (typeof RANGES)[number]["id"]

function downloadCsv(visitors: VisitorRecord[]): void {
  const blob = new Blob([toCsv(visitors, MODULE_IDS)], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `nucleus-demo-visitors-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function MarketingTrackingDashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useTrackingSummary()

  const [search, setSearch] = React.useState("")
  const [moduleFilter, setModuleFilter] = React.useState("all")
  const [range, setRange] = React.useState<RangeId>("all")
  const [selected, setSelected] = React.useState<VisitorRecord | null>(null)

  const visitors = React.useMemo(() => {
    if (!data) return []
    const hours = RANGES.find((r) => r.id === range)?.hours ?? Infinity
    // Anchor the window to the server's own clock rather than Date.now(), so the
    // filter is a pure function of the fetched payload.
    const generatedAt = new Date(data.generatedAt).getTime()
    const cutoff = hours === Infinity ? 0 : generatedAt - hours * 3_600_000
    const term = search.trim().toLowerCase()

    return data.visitors.filter((visitor) => {
      if (cutoff && new Date(visitor.lastSeenAt).getTime() < cutoff) return false
      if (moduleFilter !== "all") {
        const stat = visitor.modules[moduleFilter as (typeof MODULE_IDS)[number]]
        if (!stat || stat.views === 0) return false
      }
      if (!term) return true
      return [visitor.name, visitor.email, visitor.company].some((value) =>
        value?.toLowerCase().includes(term),
      )
    })
  }, [data, range, moduleFilter, search])

  const totals = data?.totals
  const leadingModule = data?.moduleTotals.find((entry) => entry.views > 0)

  return (
    <main className="bg-surface-page min-h-svh w-full">
      <header className="border-stroke-default bg-surface-white/90 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
          <div
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
          >
            <Zap className="size-5 fill-white" strokeWidth={2} suppressHydrationWarning />
          </div>

          <div className="mr-auto flex min-w-0 flex-col">
            <h1 className="font-heading text-content-primary text-base leading-6 font-semibold">
              Demo Insights
            </h1>
            <p className="text-content-tertiary truncate text-xs leading-4">
              What prospects explore inside the Nucleus demo
            </p>
          </div>

          <div className="border-stroke-default bg-surface-page flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5">
            {RANGES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRange(option.id)}
                aria-pressed={range === option.id}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs leading-4 font-medium transition-colors",
                  range === option.id
                    ? "bg-surface-white text-content-primary shadow-sm"
                    : "text-content-tertiary hover:text-content-primary",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn(isFetching && "animate-spin")} aria-hidden />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => downloadCsv(visitors)}
            disabled={visitors.length === 0}
          >
            <Download aria-hidden />
            Export CSV
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6">
        {isError && (
          <div className="border-stroke-default bg-surface-white rounded-[14px] border p-6">
            <p className="text-content-primary text-sm leading-5 font-medium">
              Couldn&apos;t load tracking data.
            </p>
            <p className="text-content-tertiary pt-1 text-xs leading-4">
              The tracking store may not be writable yet. Try refreshing.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[116px] rounded-[14px]" />
            ))}
          </div>
        )}

        {data && totals && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard
                icon={<Users className="size-5" aria-hidden />}
                accent="indigo"
                value={totals.visitors.toLocaleString()}
                label="Total visitors"
              />
              <KpiCard
                icon={<UserCheck className="size-5" aria-hidden />}
                accent="emerald"
                value={totals.identified.toLocaleString()}
                label="Signed in"
                trend={totals.identified > 0 ? "up" : "neutral"}
                trendValue={
                  totals.visitors
                    ? `${Math.round((totals.identified / totals.visitors) * 100)}%`
                    : "0%"
                }
                showTrendIcon
              />
              <KpiCard
                icon={<Sparkles className="size-5" aria-hidden />}
                accent="violet"
                value={totals.completedOnboarding.toLocaleString()}
                label="Completed onboarding"
              />
              <KpiCard
                icon={<Layers className="size-5" aria-hidden />}
                accent="blue"
                value={totals.avgModulesExplored.toFixed(1)}
                label={`Avg modules explored of ${TRACKED_MODULES.length}`}
              />
              <KpiCard
                icon={<Search className="size-5" aria-hidden />}
                accent="amber"
                value={leadingModule ? getModuleLabel(leadingModule.moduleId) : "—"}
                label="Most-wanted module"
                trendValue={leadingModule ? `${leadingModule.views} views` : undefined}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
              <ModuleInterestChart totals={data.moduleTotals} />
              <OnboardingFunnelCard
                funnel={data.funnel}
                totalVisitors={totals.visitors}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <BreakdownCard
                title="Industry"
                description="Sector mix of your prospects"
                entries={data.breakdowns.industry}
              />
              <BreakdownCard
                title="Company stage"
                description="How mature they are"
                entries={data.breakdowns.stage}
              />
              <BreakdownCard
                title="Team size"
                description="Seats they'd likely need"
                entries={data.breakdowns.teamSize}
              />
              <BreakdownCard
                title="Tools to connect"
                description="Integrations they asked for"
                entries={data.breakdowns.tools}
              />
            </section>

            <section className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search
                  aria-hidden
                  className="text-content-quaternary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, e-mail or company"
                  className="pl-9"
                  aria-label="Search visitors"
                />
              </div>

              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[220px]" aria-label="Filter by module">
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {TRACKED_MODULES.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-content-tertiary ml-auto text-xs leading-4">
                {visitors.length} of {data.visitors.length} visitors
              </span>
            </section>

            <VisitorsTable visitors={visitors} onSelect={setSelected} />

            <p className="text-content-quaternary pb-4 text-center text-[11px] leading-[15.4px]">
              Updated {new Date(data.generatedAt).toLocaleTimeString()} · refreshes
              every 30s
            </p>
          </>
        )}
      </div>

      <VisitorDetailSheet
        visitor={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </main>
  )
}
