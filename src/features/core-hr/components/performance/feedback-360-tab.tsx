"use client"

import { useState } from "react"
import { Clock, MessageSquare, Send, Star, Users } from "lucide-react"

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

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; variant: "success" | "warning" | "neutral" }
> = {
  complete: { label: "Complete", variant: "success" },
  in_progress: { label: "In Progress", variant: "warning" },
  pending: { label: "Pending", variant: "neutral" },
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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryStatCard
        label="Requests Sent"
        value="40"
        hint="Across 8 employees"
        icon={<Users strokeWidth={1.75} />}
        iconClassName="text-brand-info"
      />
      <SummaryStatCard
        label="Responses"
        value="32"
        valueClassName="text-brand-success"
        hint="80% response rate"
        icon={<MessageSquare strokeWidth={1.75} />}
        iconClassName="text-brand-success"
      />
      <SummaryStatCard
        label="Pending"
        value="8"
        valueClassName="text-brand-warning"
        hint="Awaiting response"
        icon={<Clock strokeWidth={1.75} />}
        iconClassName="text-brand-warning"
      />
      <SummaryStatCard
        label="Avg Score"
        value="4.1"
        hint="Out of 5.0"
        icon={<Star strokeWidth={1.75} />}
        iconClassName="text-brand-warning"
      />
    </div>
  )
}

// ─── Cells ──────────────────────────────────────────────────────────────────────

function AvgScore({ score }: Readonly<{ score: number | null }>) {
  if (score === null)
    return <span className="text-sm text-content-quaternary">—</span>
  return (
    <span className="text-content-primary">
      <span className="text-sm font-bold">{score}</span>
      <span className="ml-0.5 text-xs text-content-tertiary">/5</span>
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

export function Feedback360Tab() {
  const [requestOpen, setRequestOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <FeedbackKpis />

      <Card variant="elevated" className="gap-0">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg leading-7 font-semibold text-content-primary">
              360 Feedback Overview
            </h3>
            <p className="text-sm leading-5 text-content-tertiary">
              Multi-rater feedback requests and responses.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRequestOpen(true)}
          >
            <Send strokeWidth={2} />
            New Request
          </Button>
        </div>

        {/* Table */}
        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Employee</TableHead>
                <TableHead className={HEAD_CLASS}>Reviewers</TableHead>
                <TableHead className={cn(HEAD_CLASS, "text-center")}>
                  Responses
                </TableHead>
                <TableHead className={cn(HEAD_CLASS, "text-center")}>
                  Avg Score
                </TableHead>
                <TableHead className={HEAD_CLASS}>Top Strength</TableHead>
                <TableHead className={HEAD_CLASS}>Top Area to Improve</TableHead>
                <TableHead className={HEAD_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => {
                const st = STATUS_CONFIG[row.status]
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
                      <Badge variant={st.variant}>{st.label}</Badge>
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
