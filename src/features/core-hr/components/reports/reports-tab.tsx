"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Clock,
  DollarSign,
  FileX2,
  LineChart as LineChartIcon,
  Shield,
  ShieldCheck,
  TrendingDown,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/shared/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { cn } from "@/src/shared/lib/utils/utils"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import { useDepartments } from "../../lib/queries/departments"
import {
  useAttritionReport,
  useDocumentComplianceReport,
  useHeadcountReport,
  useSalaryCostReport,
} from "../../lib/queries/reports"
import { HrSectionSpinner } from "../shared/hr-loading"

type ReportSubTab =
  | "headcount"
  | "attrition"
  | "salary-cost"
  | "document-compliance"

type TimeRangeKey = "30d" | "3m" | "6m" | "12m" | "custom"

type EmploymentKey = "all" | "full-time" | "part-time" | "contractor"

const TIME_RANGE_OPTIONS = [
  { id: "30d", labelKey: "last30Days" },
  { id: "3m", labelKey: "last3Months" },
  { id: "6m", labelKey: "last6Months" },
  { id: "12m", labelKey: "last12Months" },
  { id: "custom", labelKey: "customRange" },
] as const satisfies readonly { id: TimeRangeKey; labelKey: string }[]

const EMPLOYMENT_OPTIONS = [
  { id: "all", labelKey: "employmentAll" },
  { id: "full-time", labelKey: "fullTime" },
  { id: "part-time", labelKey: "partTime" },
  { id: "contractor", labelKey: "contractor" },
] as const satisfies readonly { id: EmploymentKey; labelKey: string }[]

const SUB_TABS = [
  {
    id: "headcount",
    labelKey: "tabHeadcount",
    icon: <Users className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "attrition",
    labelKey: "tabAttrition",
    icon: <LineChartIcon className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "salary-cost",
    labelKey: "tabSalaryCost",
    icon: <DollarSign className="size-4" strokeWidth={1.75} />,
  },
  {
    id: "document-compliance",
    labelKey: "tabDocumentCompliance",
    icon: <ShieldCheck className="size-4" strokeWidth={1.75} />,
  },
] as const satisfies readonly {
  id: ReportSubTab
  labelKey: string
  icon: React.ReactNode
}[]

const DEPT_COLOR_SEQUENCE = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "violet",
  "blue",
] as const

const BAR_COLOR: Record<(typeof DEPT_COLOR_SEQUENCE)[number], string> = {
  indigo: "bg-brand-primary",
  emerald: "bg-brand-success",
  amber: "bg-brand-warning",
  rose: "bg-brand-danger",
  violet: "bg-violet-500",
  blue: "bg-brand-info",
}

type ReportsTranslator = ReturnType<typeof useTranslations<"HrReports">>

function buildChartConfigs(t: ReportsTranslator) {
  return {
    terminations: {
      terminations: { label: t("terminations"), color: "#ef4444" },
    } satisfies ChartConfig,
    attritionTrend: {
      rate: { label: t("attritionRate"), color: "#6366f1" },
    } satisfies ChartConfig,
    docCompliance: {
      compliant: { label: t("compliance.compliant"), color: "#10b981" },
      expiring: { label: t("compliance.expiring"), color: "#f59e0b" },
      expired: { label: t("compliance.expired"), color: "#ef4444" },
      missing: { label: t("compliance.missing"), color: "#a1a1aa" },
    } satisfies ChartConfig,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateRange(
  range: TimeRangeKey,
): { date_from: string; date_to: string } | Record<string, never> {
  if (range === "custom") return {}
  const today = new Date()
  const to = today.toISOString().split("T")[0]
  const from = new Date(today)
  if (range === "30d") from.setDate(from.getDate() - 30)
  else if (range === "3m") from.setMonth(from.getMonth() - 3)
  else if (range === "6m") from.setMonth(from.getMonth() - 6)
  else from.setFullYear(from.getFullYear() - 1)
  return { date_from: from.toISOString().split("T")[0], date_to: to }
}

function formatPeriod(period: string, intlLocale: string): string {
  const [year, month] = period.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(intlLocale, { month: "short", year: "numeric" })
}

// ─── Shared components ───────────────────────────────────────────────────────

type MetricCardProps = Readonly<{
  label: string
  value: React.ReactNode
  description?: React.ReactNode
  trend?: React.ReactNode
  trendTone?: "success" | "danger"
  icon: React.ReactNode
  iconClassName?: string
  loading?: boolean
}>

function MetricCard({
  label,
  value,
  description,
  trend,
  trendTone = "success",
  icon,
  iconClassName,
  loading,
}: MetricCardProps) {
  return (
    <div className="border-stroke-default bg-surface-white flex items-start justify-between gap-4 rounded-[14px] border px-5 py-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-content-tertiary text-[11px] tracking-[0.4px] uppercase">
          {label}
        </span>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-16" />
        ) : (
          <span className="text-content-primary text-2xl leading-8 font-semibold">
            {value}
          </span>
        )}
        {trend && !loading && (
          <span
            className={cn(
              "text-xs font-medium",
              trendTone === "success" && "text-brand-success",
              trendTone === "danger" && "text-brand-danger",
            )}
          >
            {trend}
          </span>
        )}
        {description && !loading && (
          <span className="text-content-tertiary text-xs leading-4">
            {description}
          </span>
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-primary/10 text-brand-primary",
          iconClassName,
        )}
      >
        {icon}
      </span>
    </div>
  )
}

function ReportFilters({
  timeRange,
  onTimeRange,
  department,
  onDepartment,
  employment,
  onEmployment,
  deptOptions,
}: Readonly<{
  timeRange: TimeRangeKey
  onTimeRange: (v: TimeRangeKey) => void
  department: string
  onDepartment: (v: string) => void
  employment: EmploymentKey
  onEmployment: (v: EmploymentKey) => void
  deptOptions: { id: string; label: string }[]
}>) {
  const t = useTranslations("HrReports")

  return (
    <div className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {TIME_RANGE_OPTIONS.map((opt) => {
          const active = timeRange === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (opt.id === "custom") {
                  toast.message(t("customRangeComingSoon"))
                  return
                }
                onTimeRange(opt.id)
              }}
              className={cn(
                "h-8 rounded-[10px] px-3 text-xs font-medium transition-colors",
                active
                  ? "bg-brand-primary text-white"
                  : "bg-surface-hover text-content-tertiary hover:text-content-primary",
              )}
            >
              {t(opt.labelKey)}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={department} onValueChange={onDepartment}>
          <SelectTrigger className="border-stroke-default bg-surface-page h-9 w-full max-w-[220px] rounded-[10px] text-sm shadow-none">
            <SelectValue placeholder={t("department")} />
          </SelectTrigger>
          <SelectContent>
            {deptOptions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="bg-surface-page inline-flex flex-wrap gap-0.5 rounded-[10px] p-0.5">
          {EMPLOYMENT_OPTIONS.map((opt) => {
            const active = employment === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onEmployment(opt.id)}
                className={cn(
                  "h-8 rounded-[8px] px-3 text-xs font-medium transition-colors",
                  active
                    ? "bg-surface-white text-content-primary shadow-sm"
                    : "text-content-tertiary hover:text-content-primary",
                )}
              >
                {t(opt.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ReportsTab() {
  const t = useTranslations("HrReports")
  const intlLocale = useIntlLocale()
  const chartConfigs = React.useMemo(() => buildChartConfigs(t), [t])
  const [subTab, setSubTab] = React.useState<ReportSubTab>("headcount")
  const [timeRange, setTimeRange] = React.useState<TimeRangeKey>("30d")
  const [department, setDepartment] = React.useState("all")
  const [employment, setEmployment] =
    React.useState<EmploymentKey>("all")

  const dateRange = React.useMemo(() => toDateRange(timeRange), [timeRange])
  const deptId = department === "all" ? undefined : department

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data: departments } = useDepartments({ per_page: 100 })

  const { data: headcount, isLoading: headcountLoading } = useHeadcountReport({
    group_by: "employment_type",
    dept_id: deptId,
  })

  const attritionParams = React.useMemo(
    () => ({ ...dateRange, dept_id: deptId }),
    [dateRange, deptId],
  )
  const { data: attrition, isLoading: attritionLoading } =
    useAttritionReport(attritionParams)

  const salaryCostParams = React.useMemo(
    () => ({ group_by: "dept_id" as const, ...dateRange, dept_id: deptId }),
    [dateRange, deptId],
  )
  const { data: salaryCost, isLoading: salaryCostLoading } =
    useSalaryCostReport(salaryCostParams)

  const { data: docCompliance, isLoading: docComplianceLoading } =
    useDocumentComplianceReport()

  // ─── Derived data ─────────────────────────────────────────────────────────

  const deptOptions = React.useMemo(
    () => [
      { id: "all", label: t("allDepartments") },
      ...(departments?.data ?? []).map((d) => ({
        id: d.id,
        label: d.dept_name,
      })),
    ],
    [departments, t],
  )

  const headcountStats = React.useMemo(() => {
    if (!headcount) return null
    const rows = headcount.rows
    const total = rows.reduce((sum, r) => sum + r.headcount, 0)
    const share = (count: number) =>
      total > 0
        ? t("percentOfWorkforce", { percent: ((count / total) * 100).toFixed(1) })
        : "—"
    const fullTime = rows.find((r) => r.group_key === "full_time")?.headcount ?? 0
    const partTime = rows.find((r) => r.group_key === "part_time")?.headcount ?? 0
    const contractors = rows.find((r) => r.group_key === "contract")?.headcount ?? 0
    return {
      total,
      fullTime,
      fullTimePct: share(fullTime),
      partTime,
      partTimePct: share(partTime),
      contractors,
      contractorsPct: share(contractors),
    }
  }, [headcount, t])

  const attritionStats = React.useMemo(() => {
    if (!attrition?.rows) return null
    const rows = attrition.rows
    const avgRate =
      rows.length > 0
        ? rows.reduce((sum, r) => sum + (r.attrition_rate_pct ?? 0), 0) / rows.length
        : 0
    const voluntary = rows.reduce(
      (sum, r) =>
        sum +
        (r.reason_breakdown?.resignation ?? 0) +
        (r.reason_breakdown?.voluntary_resignation ?? 0),
      0,
    )
    const totalTerminations = rows.reduce((sum, r) => sum + (r.terminations ?? 0), 0)
    return {
      rate: t("percent", { percent: avgRate.toFixed(1) }),
      voluntary,
      involuntary: totalTerminations - voluntary,
      avgTenureYears: "—",
    }
  }, [attrition, t])

  const hiresTerminationsData = React.useMemo(() => {
    if (!attrition?.rows) return []
    return attrition.rows.map((p) => ({
      month: formatPeriod(p.period, intlLocale),
      terminations: p.terminations ?? 0,
    }))
  }, [attrition, intlLocale])

  const attritionTrendData = React.useMemo(() => {
    if (!attrition?.rows) return []
    return attrition.rows.map((p) => ({
      month: formatPeriod(p.period, intlLocale),
      rate: p.attrition_rate_pct ?? 0,
    }))
  }, [attrition, intlLocale])

  const salaryCostStats = React.useMemo(() => {
    if (!salaryCost) return null
    const rows = salaryCost.rows
    const totalGross = rows.reduce((sum, r) => sum + parseFloat(r.total_gross || "0"), 0)
    const totalNet = rows.reduce((sum, r) => sum + parseFloat(r.total_net || "0"), 0)
    const totalHeadcount = rows.reduce((sum, r) => sum + (r.headcount ?? 0), 0)
    const weightedAvgGross =
      totalHeadcount > 0
        ? rows.reduce((sum, r) => sum + parseFloat(r.avg_gross || "0") * (r.headcount ?? 0), 0) /
          totalHeadcount
        : 0
    const highest =
      rows.length > 0
        ? rows.reduce(
            (acc, r) => (parseFloat(r.avg_gross) > parseFloat(acc.avg_gross) ? r : acc),
            rows[0],
          )
        : null
    return {
      totalGross: totalGross.toLocaleString(intlLocale),
      totalNet: totalNet.toLocaleString(intlLocale),
      avgGross: Math.round(weightedAvgGross).toLocaleString(intlLocale),
      highestDeptAvg: highest
        ? parseFloat(highest.avg_gross).toLocaleString(intlLocale)
        : "—",
      highestDeptName: highest?.group_label ?? "—",
    }
  }, [salaryCost, intlLocale])

  const salaryCostBarsData = React.useMemo(() => {
    if (!salaryCost) return []
    return salaryCost.rows.map((r, i) => ({
      id: r.group_key,
      department: r.group_label,
      totalCost: parseFloat(r.total_gross || "0"),
      color: DEPT_COLOR_SEQUENCE[i % DEPT_COLOR_SEQUENCE.length],
    }))
  }, [salaryCost])

  const docStats = React.useMemo(() => {
    if (!docCompliance?.rows) return null
    const rows = docCompliance.rows
    const total = rows.length
    const compliant = rows.filter((r) => r.status === "valid").length
    const expiring = rows.filter((r) => r.status === "expiring").length
    const expired = rows.filter((r) => r.status === "expired").length
    return {
      total,
      compliant,
      compliantPct:
        total > 0
          ? t("percentOfTotal", { percent: ((compliant / total) * 100).toFixed(1) })
          : "—",
      expiring,
      expired,
    }
  }, [docCompliance, t])

  const docCompliancePieData = React.useMemo(() => {
    if (!docCompliance?.rows) return []
    const rows = docCompliance.rows
    return [
      {
        key: "compliant",
        label: t("compliance.compliant"),
        amount: rows.filter((r) => r.status === "valid").length,
        color: "#10b981",
      },
      {
        key: "expiring",
        label: t("compliance.expiring"),
        amount: rows.filter((r) => r.status === "expiring").length,
        color: "#f59e0b",
      },
      {
        key: "expired",
        label: t("compliance.expired"),
        amount: rows.filter((r) => r.status === "expired").length,
        color: "#ef4444",
      },
      {
        key: "missing",
        label: t("compliance.missing"),
        amount: rows.filter((r) => r.status === "missing").length,
        color: "#a1a1aa",
      },
    ]
  }, [docCompliance, t])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {SUB_TABS.map((tab) => {
          const active = subTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors",
                active
                  ? "border-stroke-default bg-surface-white text-content-primary border"
                  : "bg-surface-hover text-content-tertiary hover:text-content-primary",
              )}
            >
              {tab.icon}
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {subTab === "headcount" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t("metricTotal")}
            value={headcountStats?.total ?? "—"}
            icon={<Users className="size-4" strokeWidth={1.75} />}
            loading={headcountLoading}
          />
          <MetricCard
            label={t("fullTime")}
            value={headcountStats?.fullTime ?? "—"}
            description={headcountStats?.fullTimePct}
            icon={<UserCheck className="size-4" strokeWidth={1.75} />}
            loading={headcountLoading}
          />
          <MetricCard
            label={t("partTime")}
            value={headcountStats?.partTime ?? "—"}
            description={headcountStats?.partTimePct}
            icon={<Clock className="size-4" strokeWidth={1.75} />}
            loading={headcountLoading}
          />
          <MetricCard
            label={t("contractors")}
            value={headcountStats?.contractors ?? "—"}
            description={headcountStats?.contractorsPct}
            icon={<Briefcase className="size-4" strokeWidth={1.75} />}
            loading={headcountLoading}
          />
        </div>
      )}

      {subTab === "attrition" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t("attritionRate")}
            value={attritionStats?.rate ?? "—"}
            icon={<TrendingDown className="size-4" strokeWidth={1.75} />}
            loading={attritionLoading}
          />
          <MetricCard
            label={t("voluntaryExits")}
            value={attritionStats?.voluntary ?? "—"}
            description={t("thisPeriod")}
            icon={<UserMinus className="size-4" strokeWidth={1.75} />}
            loading={attritionLoading}
          />
          <MetricCard
            label={t("involuntaryExits")}
            value={attritionStats?.involuntary ?? "—"}
            description={t("thisPeriod")}
            icon={<AlertTriangle className="size-4" strokeWidth={1.75} />}
            loading={attritionLoading}
          />
          <MetricCard
            label={t("avgTenureAtExit")}
            value={attritionStats?.avgTenureYears ?? "—"}
            description={t("acrossAllExits")}
            icon={<Clock className="size-4" strokeWidth={1.75} />}
            loading={attritionLoading}
          />
        </div>
      )}

      {subTab === "salary-cost" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t("totalPayroll")}
            value={salaryCostStats?.totalGross ?? "—"}
            icon={<DollarSign className="size-4" strokeWidth={1.75} />}
            loading={salaryCostLoading}
          />
          <MetricCard
            label={t("avgSalary")}
            value={salaryCostStats?.avgGross ?? "—"}
            icon={<LineChartIcon className="size-4" strokeWidth={1.75} />}
            loading={salaryCostLoading}
          />
          <MetricCard
            label={t("highestDeptAvg")}
            value={salaryCostStats?.highestDeptAvg ?? "—"}
            description={salaryCostStats?.highestDeptName}
            icon={<ArrowUpRight className="size-4" strokeWidth={1.75} />}
            loading={salaryCostLoading}
          />
          <MetricCard
            label={t("netPayroll")}
            value={salaryCostStats?.totalNet ?? "—"}
            icon={<LineChartIcon className="size-4" strokeWidth={1.75} />}
            loading={salaryCostLoading}
          />
        </div>
      )}

      {subTab === "document-compliance" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t("totalDocuments")}
            value={docStats?.total ?? "—"}
            icon={<Shield className="size-4" strokeWidth={1.75} />}
            loading={docComplianceLoading}
          />
          <MetricCard
            label={t("compliance.compliant")}
            value={docStats?.compliant ?? "—"}
            trend={docStats?.compliantPct}
            trendTone="success"
            icon={<ShieldCheck className="size-4" strokeWidth={1.75} />}
            loading={docComplianceLoading}
          />
          <MetricCard
            label={t("expiring")}
            value={docStats?.expiring ?? "—"}
            icon={<AlertTriangle className="size-4" strokeWidth={1.75} />}
            iconClassName="bg-brand-danger/10 text-brand-danger"
            loading={docComplianceLoading}
          />
          <MetricCard
            label={t("compliance.expired")}
            value={docStats?.expired ?? "—"}
            icon={<FileX2 className="size-4" strokeWidth={1.75} />}
            iconClassName="bg-brand-danger/10 text-brand-danger"
            loading={docComplianceLoading}
          />
        </div>
      )}

      <ReportFilters
        timeRange={timeRange}
        onTimeRange={setTimeRange}
        department={department}
        onDepartment={setDepartment}
        employment={employment}
        onEmployment={setEmployment}
        deptOptions={deptOptions}
      />

      {subTab === "headcount" && (
        <section className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-5">
          <h3 className="text-content-primary text-base leading-6 font-semibold">
            {t("terminationsByMonth")}
          </h3>
          {attritionLoading ? (
            <HrSectionSpinner />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-content-tertiary">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-brand-danger size-2 rounded-full" />{" "}
                  {t("terminations")}
                </span>
              </div>
              <ChartContainer
                config={chartConfigs.terminations}
                className="aspect-auto h-72 w-full"
              >
                <BarChart
                  data={hiresTerminationsData}
                  margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    className="stroke-stroke-default"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-content-quaternary text-[11px]"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    className="text-content-quaternary text-[11px]"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="terminations"
                    fill="var(--color-terminations)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ChartContainer>
            </>
          )}
        </section>
      )}

      {subTab === "attrition" && (
        <section className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-5">
          <h3 className="text-content-primary text-base leading-6 font-semibold">
            {t("attritionRateTrend")}
          </h3>
          {attritionLoading ? (
            <HrSectionSpinner />
          ) : (
            <ChartContainer
              config={chartConfigs.attritionTrend}
              className="aspect-auto h-72 w-full"
            >
              <LineChart
                data={attritionTrendData}
                margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  className="stroke-stroke-default"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-content-quaternary text-[11px]"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  tickFormatter={(v) => `${v}%`}
                  className="text-content-quaternary text-[11px]"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--color-rate)"
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "var(--color-rate)",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </section>
      )}

      {subTab === "salary-cost" && (
        <section className="border-stroke-default bg-surface-white flex min-h-80 flex-col gap-4 rounded-[14px] border p-5">
          <h3 className="text-content-primary text-base leading-6 font-semibold">
            {t("salaryCostByDepartment")}
          </h3>
          {salaryCostLoading ? (
            <HrSectionSpinner />
          ) : (
            <ul className="flex flex-col gap-3">
              {salaryCostBarsData.map((row) => {
                const max = Math.max(...salaryCostBarsData.map((r) => r.totalCost))
                const percent = max === 0 ? 0 : (row.totalCost / max) * 100
                return (
                  <li key={row.id} className="flex items-center gap-3">
                    <span className="text-content-tertiary w-30 shrink-0 truncate text-xs">
                      {row.department}
                    </span>
                    <span className="bg-stroke-light relative h-3 flex-1 overflow-hidden rounded-full">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-y-0 inset-s-0 rounded-full",
                          BAR_COLOR[row.color],
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}

      {subTab === "document-compliance" && (
        <section className="border-stroke-default bg-surface-white flex flex-col gap-4 rounded-[14px] border p-5 md:flex-row md:items-center md:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-content-primary text-base leading-6 font-semibold">
              {t("documentComplianceDistribution")}
            </h3>
            <p className="text-content-tertiary text-sm">
              {t("documentComplianceDescription")}
            </p>
          </div>
          {docComplianceLoading ? (
            <HrSectionSpinner />
          ) : (
            <>
              <ChartContainer
                config={chartConfigs.docCompliance}
                className="mx-auto aspect-square h-55 w-55 shrink-0 md:mx-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={docCompliancePieData}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={88}
                    strokeWidth={2}
                    stroke="var(--surface-white)"
                  >
                    {docCompliancePieData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="flex min-w-45 flex-col gap-2 text-xs">
                {docCompliancePieData.map((entry) => (
                  <li
                    key={entry.key}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-content-tertiary inline-flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.label}
                    </span>
                    <span className="text-content-primary font-semibold tabular-nums">
                      {entry.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  )
}
