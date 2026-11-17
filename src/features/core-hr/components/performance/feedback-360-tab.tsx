"use client"

import { useState } from "react"
import { Clock, MessageSquare, Send, Star, Users } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import { SummaryStatCard } from "./performance-stats"
import { RequestFeedbackDialog } from "./request-feedback-dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackStatus = "complete" | "in_progress" | "pending"

interface FeedbackRow {
  id: string
  employee: string
  reviewers: number
  responses: string
  avgScore: number | null
  topStrength: string | null
  topImprove: string | null
  status: FeedbackStatus
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<FeedbackStatus, "success" | "warning" | "neutral"> = {
  complete: "success",
  in_progress: "warning",
  pending: "neutral",
}

const ROWS: FeedbackRow[] = [
  { id: "1", employee: "Sarah Chen",    reviewers: 6, responses: "5/6", avgScore: 4.4, topStrength: "Technical Leadership", topImprove: "Delegation",       status: "complete" },
  { id: "2", employee: "Marcus Webb",   reviewers: 5, responses: "4/5", avgScore: 4.2, topStrength: "Problem Solving",      topImprove: "Documentation",    status: "complete" },
  { id: "3", employee: "Emma Clarke",   reviewers: 5, responses: "4/5", avgScore: 3.9, topStrength: "Communication",        topImprove: "Time Management",  status: "complete" },
  { id: "4", employee: "James Hart",    reviewers: 5, responses: "5/5", avgScore: 4.5, topStrength: "Innovation",           topImprove: "Stakeholder Mgmt", status: "complete" },
  { id: "5", employee: "Priya Patel",   reviewers: 6, responses: "4/6", avgScore: 4.1, topStrength: "Collaboration",        topImprove: "Public Speaking",  status: "in_progress" },
  { id: "6", employee: "Tom Richards",  reviewers: 4, responses: "3/4", avgScore: 3.8, topStrength: "Client Relations",     topImprove: "Technical Depth",  status: "in_progress" },
  { id: "7", employee: "Jordan Davies", reviewers: 5, responses: "5/5", avgScore: 4.3, topStrength: "Strategic Thinking",   topImprove: "Mentoring",        status: "complete" },
  { id: "8", employee: "Olivia Smith",  reviewers: 4, responses: "2/4", avgScore: null, topStrength: null,                  topImprove: null,               status: "pending" },
]

// ─── Summary row ────────────────────────────────────────────────────────────────

function FeedbackKpis() {
  const t = useTranslations("HrPerformance")

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryStatCard
        label={t("kpiRequestsSent")}
        value="40"
        hint={t("acrossEmployees", { count: 8 })}
        icon={<Users strokeWidth={1.75} />}
        iconClassName="text-brand-info"
      />
      <SummaryStatCard
        label={t("kpiResponses")}
        value="32"
        valueClassName="text-brand-success"
        hint={t("responseRate", { percent: 80 })}
        icon={<MessageSquare strokeWidth={1.75} />}
        iconClassName="text-brand-success"
      />
      <SummaryStatCard
        label={t("kpiPending")}
        value="8"
        valueClassName="text-brand-warning"
        hint={t("awaitingResponse")}
        icon={<Clock strokeWidth={1.75} />}
        iconClassName="text-brand-warning"
      />
      <SummaryStatCard
        label={t("kpiAvgScore")}
        value="4.1"
        hint={t("outOfFivePointZero")}
        icon={<Star strokeWidth={1.75} />}
        iconClassName="text-brand-warning"
      />
    </div>
  )
}

// ─── Cells ──────────────────────────────────────────────────────────────────────

function AvgScore({ score }: Readonly<{ score: number | null }>) {
  const t = useTranslations("HrPerformance")
  if (score === null)
    return <span className="text-sm text-content-quaternary">—</span>
  return (
    <span className="text-content-primary">
      <span className="text-sm font-bold">{score}</span>
      <span className="ms-0.5 text-xs text-content-tertiary">
        {t("outOfFive")}
      </span>
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

export function Feedback360Tab() {
  const t = useTranslations("HrPerformance")
  const [requestOpen, setRequestOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <FeedbackKpis />

      <Card variant="elevated" className="gap-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg leading-7 font-semibold text-content-primary">
              {t("feedbackOverviewTitle")}
            </h3>
            <p className="text-sm leading-5 text-content-tertiary">
              {t("feedbackOverviewSubtitle")}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRequestOpen(true)}
          >
            <Send strokeWidth={2} />
            {t("newRequest")}
          </Button>
        </div>

        {/* Table */}
        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>{t("colEmployee")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colReviewers")}</TableHead>
                <TableHead className={cn(HEAD_CLASS, "text-center")}>
                  {t("kpiResponses")}
                </TableHead>
                <TableHead className={cn(HEAD_CLASS, "text-center")}>
                  {t("kpiAvgScore")}
                </TableHead>
                <TableHead className={HEAD_CLASS}>{t("colTopStrength")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colTopImprove")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => {
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="default" alt={row.employee} color="neutral" />
                        <span className="text-sm font-medium text-content-primary">
                          {row.employee}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-content-tertiary">
                      {row.reviewers}
                    </TableCell>
                    <TableCell className="text-center font-medium text-brand-warning">
                      {row.responses}
                    </TableCell>
                    <TableCell className="text-center">
                      <AvgScore score={row.avgScore} />
                    </TableCell>
                    <TableCell className="text-content-secondary">
                      {row.topStrength ?? (
                        <span className="text-content-quaternary">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-content-tertiary">
                      {row.topImprove ?? (
                        <span className="text-content-quaternary">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status]}>
                        {t(`feedbackStatus.${row.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RequestFeedbackDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}
