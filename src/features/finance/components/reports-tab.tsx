"use client"

import * as React from "react"
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Download,
  FileText,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { cn } from "@/src/shared/lib/utils/utils"

import { useExportFinanceReportCsv } from "../lib/mutations/reports"
import { useFinanceReportCards } from "../lib/queries/reports"
import type { FinanceReportType } from "../lib/constants/report-types"
import type { FinanceReportCard } from "../lib/types"
import { FinanceErrorState, toastMutationError } from "./shared/finance-error-state"
import { FinancePageSpinner } from "./shared/finance-loading"

const REPORT_ICON: Record<FinanceReportType, React.ComponentType<{ className?: string }>> = {
  "revenue-summary": TrendingUp,
  receivables: Clock,
  "tax-summary": FileText,
  "expense-breakdown": PieChartIcon,
  "cashflow-projection": BarChart3,
  "invoice-aging": AlertTriangle,
}

const REPORT_ACCENT: Record<FinanceReportType, string> = {
  "revenue-summary": "bg-brand-success/12 text-brand-success",
  receivables: "bg-brand-primary/12 text-brand-primary",
  "tax-summary": "bg-rose-500/12 text-rose-500",
  "expense-breakdown": "bg-brand-warning/12 text-brand-warning",
  "cashflow-projection": "bg-violet-500/12 text-violet-500",
  "invoice-aging": "bg-brand-danger/12 text-brand-danger",
}

function formatMetricValue(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function ReportCard({ card }: { card: FinanceReportCard }) {
  const Icon = REPORT_ICON[card.type]
  const exportCsv = useExportFinanceReportCsv()

  const handleExport = () => {
    exportCsv.mutate(card.type, {
      onSuccess: (downloadUrl) => {
        window.open(downloadUrl, "_blank", "noopener,noreferrer")
      },
      onError: (err) => toastMutationError(err, "Failed to export report"),
    })
  }

  return (
    <Card
      variant="elevated"
      className="flex h-full flex-col gap-4 rounded-2xl border-stroke-default p-5"
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex shrink-0 rounded-2xl p-2.5", REPORT_ACCENT[card.type])}>
          <Icon className="size-5" />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-[12px] leading-[18px] font-medium text-content-primary">
            {card.title}
          </h3>
          <p className="text-[11px] leading-[15.4px] text-content-secondary">
            {card.subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {card.metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-2">
            <span className="text-[11px] leading-[15.4px] text-content-secondary">
              {metric.label}
            </span>
            <span className="text-[12px] leading-[18px] font-medium tabular-nums text-content-primary">
              {formatMetricValue(metric.value)}
            </span>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exportCsv.isPending}
        onClick={handleExport}
        className="h-8 w-full rounded-lg border-stroke-default text-[11px] font-medium text-content-primary"
      >
        <Download className="size-3.5" />
        {exportCsv.isPending ? "Exporting…" : "Export CSV"}
      </Button>
    </Card>
  )
}

export function ReportsTab() {
  const cardsQuery = useFinanceReportCards()

  if (cardsQuery.isLoading) return <FinancePageSpinner />
  if (cardsQuery.isError || !cardsQuery.data) {
    return (
      <FinanceErrorState
        message="Failed to load reports."
        onRetry={() => void cardsQuery.refetch()}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cardsQuery.data.map((card) => (
        <ReportCard key={card.type} card={card} />
      ))}
    </div>
  )
}
