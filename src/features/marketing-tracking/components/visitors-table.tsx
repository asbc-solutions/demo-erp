"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/shared/components/ui/tooltip"
import {
  TRACKED_MODULES,
  getModuleLabelKey,
} from "@/src/shared/lib/constants/modules"
import { cn } from "@/src/shared/lib/utils/utils"

import type { VisitorRecord } from "../lib/types"
import {
  displayName,
  formatDuration,
  formatRelative,
  initialsFor,
  modulesExplored,
  topModule,
} from "../lib/format"
import { useOnboardingLabels } from "../lib/use-onboarding-labels"

type VisitorsTableProps = {
  visitors: VisitorRecord[]
  onSelect: (visitor: VisitorRecord) => void
}

/**
 * Nine cells, one per module, shaded by how much of this visitor's activity
 * landed there. Gives a scannable fingerprint of intent per row without
 * needing nine numeric columns.
 */
function ModuleHeatStrip({ visitor }: { visitor: VisitorRecord }) {
  const t = useTranslations("MarketingTrackingVisitors")
  const tNav = useTranslations("Nav")
  const max = Math.max(
    1,
    ...TRACKED_MODULES.map((module) => visitor.modules[module.id]?.views ?? 0),
  )

  return (
    <div className="flex items-center gap-1">
      {TRACKED_MODULES.map((module) => {
        const views = visitor.modules[module.id]?.views ?? 0
        const intensity = views === 0 ? 0 : 0.18 + (views / max) * 0.82
        return (
          <Tooltip key={module.id}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "size-4 rounded-[3px] transition-transform hover:scale-125",
                  views === 0 && "bg-surface-hover",
                )}
                style={
                  views === 0
                    ? undefined
                    : {
                        backgroundColor: "var(--color-brand-primary)",
                        opacity: intensity,
                      }
                }
              />
            </TooltipTrigger>
            <TooltipContent>
              {t("heatTooltip", { module: tNav(module.labelKey), count: views })}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function VisitorsTable({ visitors, onSelect }: VisitorsTableProps) {
  const t = useTranslations("MarketingTrackingVisitors")
  const tFormat = useTranslations("MarketingTrackingFormat")
  const tNav = useTranslations("Nav")
  const onboardingLabels = useOnboardingLabels()
  return (
    <Card variant="elevated" className="p-6">
      <CardHeader className="flex flex-col items-start gap-1 p-0 pb-5">
        <CardTitle className="text-base leading-6 font-semibold">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-xs leading-4">
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {visitors.length === 0 ? (
          <p className="text-content-tertiary py-16 text-center text-sm leading-5">
            {t("empty")}
          </p>
        ) : (
          <div className="thin-scrollbar overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-stroke-default hover:bg-transparent">
                  <TableHead>{t("colVisitor")}</TableHead>
                  <TableHead>{t("colPhone")}</TableHead>
                  <TableHead>{t("colCompany")}</TableHead>
                  <TableHead>{t("colProfile")}</TableHead>
                  <TableHead>{t("colTopModule")}</TableHead>
                  <TableHead>{t("colModules")}</TableHead>
                  <TableHead className="text-end">{t("colViews")}</TableHead>
                  <TableHead className="text-end">{t("colTime")}</TableHead>
                  <TableHead className="text-end">{t("colLastActive")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => {
                  const best = topModule(visitor)
                  return (
                    <TableRow
                      key={visitor.visitorId}
                      onClick={() => onSelect(visitor)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onSelect(visitor)
                        }
                      }}
                      className="border-stroke-default hover:bg-surface-hover focus-visible:outline-brand-primary cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            size="sm"
                            color={visitor.email ? "primary" : "neutral"}
                            fallback={initialsFor(visitor)}
                            alt={displayName(visitor, tFormat)}
                          />
                          <div className="flex min-w-0 flex-col">
                            <span className="text-content-primary truncate text-xs leading-4 font-medium">
                              {displayName(visitor, tFormat)}
                            </span>
                            <span className="text-content-quaternary truncate text-[11px] leading-[15.4px]">
                              {visitor.email ?? t("anonymous")}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell
                        dir="ltr"
                        className="text-content-tertiary font-mono text-xs leading-4 whitespace-nowrap"
                      >
                        {visitor.phone ?? "—"}
                      </TableCell>

                      <TableCell className="text-content-tertiary text-xs leading-4">
                        {visitor.company ?? "—"}
                      </TableCell>

                      <TableCell className="text-content-tertiary text-xs leading-4">
                        {visitor.onboarding?.industry ? (
                          <span className="flex flex-col">
                            <span>{onboardingLabels.industry(visitor.onboarding.industry)}</span>
                            {visitor.onboarding.teamSize && (
                              <span className="text-content-quaternary text-[11px] leading-[15.4px]">
                                {onboardingLabels.teamSize(visitor.onboarding.teamSize)}
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell>
                        {best ? (
                          <Badge variant="primary">
                            {tNav(getModuleLabelKey(best.moduleId))}
                          </Badge>
                        ) : (
                          <span className="text-content-quaternary text-xs leading-4">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <ModuleHeatStrip visitor={visitor} />
                          <span className="text-content-quaternary shrink-0 font-mono text-[11px] leading-[15.4px]">
                            {modulesExplored(visitor)}/{TRACKED_MODULES.length}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-content-secondary text-end font-mono text-xs leading-4">
                        {visitor.totalViews}
                      </TableCell>

                      <TableCell className="text-content-secondary text-end font-mono text-xs leading-4">
                        {formatDuration(visitor.totalMs, tFormat)}
                      </TableCell>

                      <TableCell className="text-content-tertiary text-end text-xs leading-4">
                        {formatRelative(visitor.lastSeenAt, tFormat)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
