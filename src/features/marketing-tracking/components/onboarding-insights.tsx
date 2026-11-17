"use client"

import { useTranslations } from "next-intl"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import { cn } from "@/src/shared/lib/utils/utils"

import type { BreakdownEntry, FunnelStep } from "../lib/types"
import { ONBOARDING_STEP_LABEL_KEYS } from "../lib/types"

type FunnelCardProps = {
  funnel: FunnelStep[]
  totalVisitors: number
}

/**
 * Drop-off across the five onboarding steps. Percentages are of *all* visitors,
 * not of the previous step, so the bars shrink monotonically and the gap between
 * two rows is the number of people lost there.
 */
export function OnboardingFunnelCard({ funnel, totalVisitors }: FunnelCardProps) {
  const t = useTranslations("MarketingTrackingOnboarding")
  const tStep = useTranslations("MarketingTrackingSteps")
  const base = Math.max(1, totalVisitors)

  return (
    <Card variant="elevated" className="p-6">
      <CardHeader className="flex flex-col items-start gap-1 p-0 pb-5">
        <CardTitle className="text-base leading-6 font-semibold">
          {t("funnelTitle")}
        </CardTitle>
        <CardDescription className="text-xs leading-4">
          {t("funnelDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0">
        {funnel.map((step, index) => {
          const percent = Math.round((step.count / base) * 100)
          const previous = index === 0 ? null : funnel[index - 1]
          const dropped = previous ? previous.count - step.count : 0
          return (
            <div key={step.step} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-content-primary text-xs leading-4 font-medium">
                  {tStep(ONBOARDING_STEP_LABEL_KEYS[step.step])}
                </span>
                <span className="text-content-tertiary font-mono text-[11px] leading-[15.4px]">
                  {step.count} · {percent}%
                  {dropped > 0 && (
                    <span className="text-brand-danger ms-1.5">−{dropped}</span>
                  )}
                </span>
              </div>
              <Progress
                value={percent}
                size="sm"
                color={index === funnel.length - 1 ? "emerald" : "indigo"}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

type BreakdownCardProps = {
  title: string
  description: string
  entries: BreakdownEntry[]
  className?: string
}

export function BreakdownCard({
  title,
  description,
  entries,
  className,
}: BreakdownCardProps) {
  const t = useTranslations("MarketingTrackingOnboarding")
  const max = Math.max(1, ...entries.map((entry) => entry.count))

  return (
    <Card variant="elevated" className={cn("p-6", className)}>
      <CardHeader className="flex flex-col items-start gap-1 p-0 pb-5">
        <CardTitle className="text-base leading-6 font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs leading-4">{description}</CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="text-content-tertiary py-8 text-center text-xs leading-4">
            {t("breakdownEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.slice(0, 8).map((entry) => (
              <li key={entry.key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-content-secondary truncate text-xs leading-4">
                    {entry.label}
                  </span>
                  <span className="text-content-tertiary shrink-0 font-mono text-[11px] leading-[15.4px]">
                    {entry.count}
                  </span>
                </div>
                <div className="bg-surface-hover h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-brand-primary h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.round((entry.count / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
