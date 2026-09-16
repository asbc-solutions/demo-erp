"use client"

import * as React from "react"

import { useCommandCenterSummary } from "../lib/queries/summary"
import { ActivityFeedSection } from "./activity-feed-section"
import { AiInsightsCard } from "./ai-insights-card"
import { KeyMetricsSection } from "./key-metrics-section"
import { QuickActionsCard } from "./quick-actions-card"
import { RecentInvoicesSection } from "./recent-invoices-section"
import { RevenueTrendSection } from "./revenue-trend-section"
import { CommandCenterErrorState } from "./shared/command-center-error-state"
import { CommandCenterPageSpinner } from "./shared/command-center-loading"
import { SummaryStripSection } from "./summary-strip-section"

const ORG_LABEL = "ASBC"

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="text-[11px] leading-4 font-semibold tracking-[0.88px] text-content-quaternary uppercase">
      {children}
    </p>
  )
}

export function CommandCenterView() {
  const { data: summary, isLoading, isError, refetch } = useCommandCenterSummary()

  return (
    <div className="bg-surface-page relative flex min-h-0 flex-1 flex-col gap-8 overflow-auto p-6 pl-7">
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
        aria-hidden
      />

      {isLoading ? (
        <CommandCenterPageSpinner />
      ) : isError || !summary ? (
        <CommandCenterErrorState
          message="Failed to load the command center summary."
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <SummaryStripSection strip={summary.strip} currencyCode={summary.currency_code} />

          <div className="flex flex-col gap-6">
            <SectionLabel>Key Metrics</SectionLabel>
            <KeyMetricsSection
              metrics={summary.key_metrics}
              currencyCode={summary.currency_code}
            />
          </div>
        </>
      )}

      <QuickActionsCard orgLabel={ORG_LABEL} />

      <div className="flex flex-col gap-6">
        <SectionLabel>Revenue Trend & Recent Activity</SectionLabel>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
          <RevenueTrendSection />
          <ActivityFeedSection />
        </div>
      </div>

      <RecentInvoicesSection />

      <AiInsightsCard orgLabel={ORG_LABEL} />
    </div>
  )
}
