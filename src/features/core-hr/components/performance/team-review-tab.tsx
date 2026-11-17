"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import {
  useReviewCycles,
  useTeamAppraisals,
} from "../../lib/queries/performance"
import type { Appraisal, AppraisalStatus } from "../../lib/types"
import { ReviewCycleKpis } from "./performance-stats"

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<
  AppraisalStatus,
  "success" | "warning" | "info" | "neutral"
> = {
  pending: "neutral",
  self_in_progress: "warning",
  self_submitted: "warning",
  manager_in_progress: "info",
  manager_submitted: "info",
  calibrated: "info",
  finalised: "success",
  acknowledged: "success",
  self_done: "warning",
  manager_done: "info",
}

const STATUS_FILTERS: (AppraisalStatus | "all")[] = [
  "all",
  "pending",
  "self_in_progress",
  "self_submitted",
  "manager_in_progress",
  "manager_submitted",
  "calibrated",
  "finalised",
  "acknowledged",
]

const HEAD_CLASS =
  "h-11 text-xs font-medium normal-case tracking-normal text-content-secondary"

/** Prefer an embedded employee name; fall back to the cycle so my-appraisals still reads well. */
function subjectLabel(a: Appraisal, fallback: string) {
  return a.employee?.full_name ?? a.cycle?.cycle_name ?? fallback
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ score }: Readonly<{ score: number | null }>) {
  if (score === null || score === undefined)
    return <span className="text-sm text-content-quaternary">—</span>
  const rounded = Math.round(score)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i <= rounded
              ? "fill-brand-warning text-brand-warning"
              : "fill-stroke-default text-stroke-default",
          )}
        />
      ))}
    </div>
  )
}

function FinalRating({ score }: Readonly<{ score: number | null }>) {
  const t = useTranslations("HrPerformance")
  if (score === null || score === undefined)
    return <span className="text-sm text-content-quaternary">—</span>
  return (
    <span className="text-content-primary">
      <span className="text-base font-bold">{score}</span>
      <span className="ms-0.5 text-xs text-content-tertiary">
        {t("outOfFive")}
      </span>
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TeamReviewTab() {
  const t = useTranslations("HrPerformance")
  const tCommon = useTranslations("Common")
  const [statusFilt, setStatusFilt] = useState<AppraisalStatus | "all">("all")

  const {
    data: cyclesData,
    isError: cyclesIsError,
    isLoading: cyclesLoading,
  } = useReviewCycles({ per_page: 20 })
  const cycles = cyclesData?.data ?? []
  const activeCycle =
    cycles.find(
      (cycle) =>
        !["completed", "closed", "archived"].includes(cycle.status),
    ) ?? cycles[0]

  const {
    data,
    isError: appraisalsIsError,
    isLoading: appraisalsLoading,
  } = useTeamAppraisals(activeCycle?.cycle_id, {
    per_page: 100,
    status: statusFilt === "all" ? undefined : statusFilt,
  })
  const appraisals = data?.data ?? []
  const isLoading = cyclesLoading || appraisalsLoading
  const isError = cyclesIsError || appraisalsIsError

  const filtered = appraisals.filter(
    (a) => statusFilt === "all" || a.status === statusFilt,
  )

  return (
    <div className="flex flex-col gap-6">
      <ReviewCycleKpis />

      <Card variant="elevated" className="gap-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg leading-7 font-semibold text-content-primary">
              {t("teamReviewsTitle")}
            </h3>
            <p className="text-sm leading-5 text-content-tertiary">
              {t("teamReviewsSubtitle")}
            </p>
          </div>

          <Select
            value={statusFilt}
            onValueChange={(v) => setStatusFilt(v as AppraisalStatus | "all")}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder={t("filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? t("filterByStatus") : t(`appraisalStatus.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>{t("colEmployee")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colSelfRating")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colManagerRating")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colFinalRating")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colStatus")}</TableHead>
                <TableHead className={cn(HEAD_CLASS, "text-end")}>
                  {tCommon("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading &&
                (!activeCycle || isError || filtered.length === 0) && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-content-tertiary"
                  >
                    {!activeCycle
                      ? t("noReviewCycle")
                      : isError
                        ? t("reviewsLoadError")
                        : t("appraisalsEmpty")}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((row) => {
                  const status: AppraisalStatus =
                    row.status in STATUS_VARIANT ? row.status : "pending"
                  const subject = subjectLabel(row, t("appraisalFallback"))
                  return (
                    <TableRow key={row.appraisal_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="default"
                            alt={subject}
                            color="neutral"
                          />
                          <span className="text-sm font-medium text-content-primary">
                            {subject}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarRating score={row.self_score} />
                      </TableCell>
                      <TableCell>
                        <StarRating score={row.manager_score} />
                      </TableCell>
                      <TableCell>
                        <FinalRating score={row.final_score} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[status]}>
                          {t(`appraisalStatus.${status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost-primary" size="sm">
                          {tCommon("view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
