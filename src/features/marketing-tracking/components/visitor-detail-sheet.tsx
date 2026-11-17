"use client"

import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"
import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Progress } from "@/src/shared/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/shared/components/ui/sheet"
import { TRACKED_MODULES } from "@/src/shared/lib/constants/modules"

import type { VisitorRecord } from "../lib/types"
import { ONBOARDING_STEP_IDS, ONBOARDING_STEP_LABEL_KEYS } from "../lib/types"
import {
  displayName,
  formatDateTime,
  formatDuration,
  initialsFor,
} from "../lib/format"
import { useOnboardingLabels } from "../lib/use-onboarding-labels"

type VisitorDetailSheetProps = {
  visitor: VisitorRecord | null
  onOpenChange: (open: boolean) => void
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-content-quaternary text-[11px] leading-[15.4px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-content-primary text-sm leading-5">{value}</span>
    </div>
  )
}

export function VisitorDetailSheet({ visitor, onOpenChange }: VisitorDetailSheetProps) {
  const t = useTranslations("MarketingTrackingVisitorDetail")
  const tStep = useTranslations("MarketingTrackingSteps")
  const tFormat = useTranslations("MarketingTrackingFormat")
  const tNav = useTranslations("Nav")
  const locale = useIntlLocale()
  const onboardingLabels = useOnboardingLabels()

  if (!visitor) return null

  const activeModules = TRACKED_MODULES.map((module) => ({
    module,
    stat: visitor.modules[module.id],
  })).filter((entry) => entry.stat && entry.stat.views > 0)

  const maxViews = Math.max(1, ...activeModules.map((entry) => entry.stat!.views))
  const completedSteps = visitor.onboarding?.stepsCompleted ?? []

  return (
    <Sheet open={Boolean(visitor)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[520px]">
        <SheetHeader className="gap-0">
          <div className="flex items-center gap-3">
            <Avatar
              size="lg"
              color="primary"
              fallback={initialsFor(visitor)}
              alt={displayName(visitor, tFormat)}
            />
            <div className="flex min-w-0 flex-col">
              <SheetTitle className="truncate text-base leading-6 font-semibold">
                {displayName(visitor, tFormat)}
              </SheetTitle>
              <SheetDescription className="truncate text-xs leading-4">
                {visitor.email ?? visitor.phone ?? t("notSignedIn")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-7 px-4 pb-8">
          <section className="grid grid-cols-2 gap-4">
            <Field label={t("company")} value={visitor.company ?? "—"} />
            <Field
              label={t("phone")}
              value={visitor.phone ? <span dir="ltr">{visitor.phone}</span> : "—"}
            />
            <Field
              label={t("industry")}
              value={
                visitor.onboarding?.industry
                  ? onboardingLabels.industry(visitor.onboarding.industry)
                  : "—"
              }
            />
            <Field
              label={t("stage")}
              value={
                visitor.onboarding?.stage
                  ? onboardingLabels.stage(visitor.onboarding.stage)
                  : "—"
              }
            />
            <Field
              label={t("teamSize")}
              value={
                visitor.onboarding?.teamSize
                  ? onboardingLabels.teamSize(visitor.onboarding.teamSize)
                  : "—"
              }
            />
            <Field
              label={t("firstSeen")}
              value={formatDateTime(visitor.firstSeenAt, locale)}
            />
            <Field
              label={t("lastActive")}
              value={formatDateTime(visitor.lastSeenAt, locale)}
            />
            <Field label={t("sessions")} value={visitor.sessions} />
            <Field
              label={t("timeInProduct")}
              value={formatDuration(visitor.totalMs, tFormat)}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-content-primary text-xs leading-4 font-semibold tracking-wide uppercase">
              {t("toolsTitle")}
            </h3>
            {visitor.onboarding?.tools.length ? (
              <div className="flex flex-wrap gap-1.5">
                {visitor.onboarding.tools.map((tool) => (
                  <Badge key={tool} variant="primary">
                    {onboardingLabels.tool(tool)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-content-tertiary text-sm leading-5">
                {t("noneSelected")}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-content-primary text-xs leading-4 font-semibold tracking-wide uppercase">
              {t("onboardingProgress")}
            </h3>
            <ol className="flex flex-col gap-2">
              {ONBOARDING_STEP_IDS.map((step) => {
                const done = completedSteps.includes(step)
                return (
                  <li key={step} className="flex items-center gap-2.5">
                    <span
                      aria-hidden
                      className={
                        done
                          ? "bg-brand-success size-2 shrink-0 rounded-full"
                          : "border-stroke-default size-2 shrink-0 rounded-full border-2"
                      }
                    />
                    <span
                      className={
                        done
                          ? "text-content-primary text-sm leading-5"
                          : "text-content-quaternary text-sm leading-5"
                      }
                    >
                      {tStep(ONBOARDING_STEP_LABEL_KEYS[step])}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-content-primary text-xs leading-4 font-semibold tracking-wide uppercase">
              {t("moduleEngagement")}
            </h3>
            {activeModules.length === 0 ? (
              <p className="text-content-tertiary text-sm leading-5">
                {t("noModules")}
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {activeModules
                  .sort((a, b) => b.stat!.views - a.stat!.views)
                  .map(({ module, stat }) => {
                    const Icon = module.icon
                    const pages = Object.entries(stat!.pages).sort(
                      (a, b) => b[1] - a[1],
                    )
                    return (
                      <li key={module.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-content-primary flex items-center gap-2 text-sm leading-5 font-medium">
                            <Icon className="text-content-tertiary size-4" aria-hidden />
                            {tNav(module.labelKey)}
                          </span>
                          <span className="text-content-tertiary shrink-0 font-mono text-[11px] leading-[15.4px]">
                            {t("moduleStat", {
                              count: stat!.views,
                              duration: formatDuration(stat!.msSpent, tFormat),
                            })}
                          </span>
                        </div>
                        <Progress
                          value={Math.round((stat!.views / maxViews) * 100)}
                          size="sm"
                        />
                        <ul className="flex flex-col gap-0.5 ps-6">
                          {pages.slice(0, 6).map(([path, count]) => (
                            <li
                              key={path}
                              className="text-content-tertiary flex items-baseline justify-between gap-3 text-[11px] leading-[15.4px]"
                            >
                              <span dir="ltr" className="truncate font-mono">
                                {path}
                              </span>
                              <span className="shrink-0">{count}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  })}
              </ul>
            )}
          </section>

          <p className="text-content-quaternary font-mono text-[11px] leading-[15.4px]">
            {t("visitorId", { id: visitor.visitorId })}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
