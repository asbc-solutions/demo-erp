"use client"

import { ShieldAlert } from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import { CircularProgress } from "@/src/shared/components/ui/circular-progress"
import { cn } from "@/src/shared/lib/utils/utils"

import { useComplianceScore, useCriticalAlerts } from "../lib/queries/overview"
import type { AlertSeverity, ComplianceScoreStatus } from "../lib/types/overview"
import { ComplianceErrorState } from "./shared/compliance-error-state"
import { CompliancePageSpinner } from "./shared/compliance-loading"

const SCORE_STATUS_LABEL: Record<ComplianceScoreStatus, string> = {
  strong: "Strong",
  adequate: "Adequate",
  at_risk: "At Risk",
  critical: "Critical",
  not_assessed: "Not Assessed",
}

const SCORE_STATUS_COLOR: Record<ComplianceScoreStatus, "emerald" | "blue" | "amber" | "red" | "violet"> = {
  strong: "emerald",
  adequate: "blue",
  at_risk: "amber",
  critical: "red",
  not_assessed: "violet",
}

const SCORE_STATUS_TEXT_CLASS: Record<ComplianceScoreStatus, string> = {
  strong: "text-brand-success",
  adequate: "text-brand-info",
  at_risk: "text-brand-warning",
  critical: "text-brand-danger",
  not_assessed: "text-content-tertiary",
}

const SEVERITY_BADGE_VARIANT: Record<AlertSeverity, "danger" | "warning" | "info"> = {
  critical: "danger",
  warning: "warning",
  info: "info",
}

export function OverviewTab() {
  const scoreQuery = useComplianceScore()
  const alertsQuery = useCriticalAlerts()

  const isLoading = scoreQuery.isLoading || alertsQuery.isLoading
  const isError = scoreQuery.isError || alertsQuery.isError

  if (isLoading) {
    return <CompliancePageSpinner />
  }

  if (isError || !scoreQuery.data) {
    return (
      <ComplianceErrorState
        message="Failed to load compliance overview."
        onRetry={() => {
          void scoreQuery.refetch()
          void alertsQuery.refetch()
        }}
      />
    )
  }

  const score = scoreQuery.data
  const alerts = alertsQuery.data ?? []
  const statusColor = SCORE_STATUS_COLOR[score.status]
  const statusTextClass = SCORE_STATUS_TEXT_CLASS[score.status]

  return (
    <div className="flex flex-col gap-6">
      <Card variant="elevated" className="gap-6 p-6">
        <div className="flex flex-wrap items-center gap-6">
          <CircularProgress
            value={score.score}
            color={statusColor}
            size={96}
            strokeWidth={8}
            className="shrink-0"
            label={`/ ${score.max}`}
          />
          <div className="min-w-[220px] flex-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className={cn("size-4", statusTextClass)} />
              <p className="text-content-primary text-[28px] leading-9 font-semibold">
                Compliance Score
              </p>
            </div>
            <p className={cn("text-[40px] leading-[44px] font-bold", statusTextClass)}>
              {SCORE_STATUS_LABEL[score.status]}
            </p>
            <p className="text-content-tertiary text-sm">
              Based on {score.based_on_rules} applicable rules
            </p>
          </div>
          <div className="grid min-w-[320px] flex-1 grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center dark:bg-emerald-950/30">
              <p className="text-brand-success text-3xl font-semibold">{score.compliant}</p>
              <p className="text-content-tertiary text-xs">Compliant</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center dark:bg-amber-950/30">
              <p className="text-brand-warning text-3xl font-semibold">{score.in_progress}</p>
              <p className="text-content-tertiary text-xs">In Progress</p>
            </div>
            <div className="rounded-xl bg-red-50 px-4 py-3 text-center dark:bg-red-950/30">
              <p className="text-brand-danger text-3xl font-semibold">{score.non_compliant}</p>
              <p className="text-content-tertiary text-xs">Non-compliant</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-content-secondary text-sm font-medium">
          Critical Alerts ({alerts.length})
        </p>
        {alerts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-content-tertiary text-sm">No critical alerts right now.</p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className="border-brand-danger/30 bg-brand-danger/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={SEVERITY_BADGE_VARIANT[alert.severity]}>
                      {alert.severity_label}
                    </Badge>
                    <Badge variant="neutral">{alert.code}</Badge>
                    <Badge variant="outline">{alert.framework}</Badge>
                    {alert.is_overdue ? <Badge variant="danger">Overdue</Badge> : null}
                  </div>
                  <p className="text-content-primary text-base font-semibold">{alert.title}</p>
                  <p className="text-content-tertiary text-sm">{alert.detail}</p>
                  <p className="text-content-quaternary text-xs">
                    {alert.owner} · Due {alert.due_date ?? "—"}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
