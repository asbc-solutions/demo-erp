"use client"

import { useState } from "react"
import { Star } from "lucide-react"

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

const STATUS_CONFIG: Record<
  AppraisalStatus,
  { label: string; variant: "success" | "warning" | "info" | "neutral" }
> = {
  pending: { label: "Pending", variant: "neutral" },
  self_in_progress: { label: "Self In Progress", variant: "warning" },
  self_submitted: { label: "Self Submitted", variant: "warning" },
  manager_in_progress: { label: "Manager In Progress", variant: "info" },
  manager_submitted: { label: "Manager Submitted", variant: "info" },
  calibrated: { label: "Calibrated", variant: "info" },
  finalised: { label: "Finalised", variant: "success" },
  acknowledged: { label: "Acknowledged", variant: "success" },
  self_done: { label: "Self Done", variant: "warning" },
  manager_done: { label: "Manager Done", variant: "info" },
}

const STATUS_FILTERS: { id: AppraisalStatus | "all"; label: string }[] = [
  { id: "all", label: "Filter by status" },
  { id: "pending", label: "Pending" },
  { id: "self_in_progress", label: "Self In Progress" },
  { id: "self_submitted", label: "Self Submitted" },
  { id: "manager_in_progress", label: "Manager In Progress" },
  { id: "manager_submitted", label: "Manager Submitted" },
  { id: "calibrated", label: "Calibrated" },
  { id: "finalised", label: "Finalised" },
  { id: "acknowledged", label: "Acknowledged" },
]

const HEAD_CLASS =
  "h-11 text-xs font-medium normal-case tracking-normal text-content-secondary"

/** Prefer an embedded employee name; fall back to the cycle so my-appraisals still reads well. */
function subjectLabel(a: Appraisal) {
  return a.employee?.full_name ?? a.cycle?.cycle_name ?? "Appraisal"
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
  if (score === null || score === undefined)
    return <span className="text-sm text-content-quaternary">—</span>
  return (
    <span className="text-content-primary">
      <span className="text-base font-bold">{score}</span>
      <span className="ml-0.5 text-xs text-content-tertiary">/5</span>
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TeamReviewTab() {
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
              Team Performance Reviews
            </h3>
            <p className="text-sm leading-5 text-content-tertiary">
              Appraisal overview and ratings across cycles.
            </p>
          </div>

          <Select
            value={statusFilt}
            onValueChange={(v) => setStatusFilt(v as AppraisalStatus | "all")}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
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
                <TableHead className={HEAD_CLASS}>Employee</TableHead>
                <TableHead className={HEAD_CLASS}>Self Rating</TableHead>
                <TableHead className={HEAD_CLASS}>Manager Rating</TableHead>
                <TableHead className={HEAD_CLASS}>Final Rating</TableHead>
                <TableHead className={HEAD_CLASS}>Status</TableHead>
                <TableHead className={cn(HEAD_CLASS, "text-right")}>
                  Actions
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
                      ? "No review cycle is available yet."
                      : isError
                        ? "Couldn't load reviews. Please try again."
                        : "No appraisals match the current filter."}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((row) => {
                  const st = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.pending
                  return (
                    <TableRow key={row.appraisal_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="default"
                            alt={subjectLabel(row)}
                            color="neutral"
                          />
                          <span className="text-sm font-medium text-content-primary">
                            {subjectLabel(row)}
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
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost-primary" size="sm">
                          View
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
