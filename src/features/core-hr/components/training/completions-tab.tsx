"use client"

import { Building2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompletionRecord {
  id: string
  employee: string
  department: string
  course: string
  completed: string | null
  score: number | null
}

const PASS_MARK = 70

// ─── Data ─────────────────────────────────────────────────────────────────────

const RECORDS: CompletionRecord[] = [
  { id: "r1", employee: "Sarah Chen", department: "Engineering", course: "AWS Solutions Architect Fundamentals", completed: "2025-06-20", score: 92 },
  { id: "r2", employee: "Sarah Chen", department: "Engineering", course: "Azure Infrastructure Deployment", completed: "2025-07-15", score: 88 },
  { id: "r3", employee: "Marcus Webb", department: "Engineering", course: "PMP Exam Preparation", completed: "2025-05-10", score: 79 },
  { id: "r4", employee: "Emma Clarke", department: "Analytics", course: "Python for Data Analysis", completed: "2025-08-01", score: 95 },
  { id: "r5", employee: "Emma Clarke", department: "Analytics", course: "Machine Learning with Scikit-learn", completed: "2025-09-12", score: 87 },
  { id: "r6", employee: "James Hart", department: "Product", course: "Executive Presentation Mastery", completed: "2025-04-18", score: 91 },
  { id: "r7", employee: "Priya Patel", department: "Engineering", course: "Kubernetes & Docker Essentials", completed: "2025-07-22", score: 83 },
  { id: "r8", employee: "Tom Richards", department: "Engineering", course: "Phishing & Social Engineering Defence", completed: "2025-06-05", score: 76 },
  { id: "r9", employee: "Tom Richards", department: "Engineering", course: "Data Protection & GDPR Compliance", completed: "2025-06-05", score: 82 },
  { id: "r10", employee: "Jordan Davies", department: "Engineering", course: "AWS Solutions Architect Fundamentals", completed: "2025-08-30", score: 65 },
  { id: "r11", employee: "Olivia Smith", department: "Operations", course: "PMP Exam Preparation", completed: "2025-09-01", score: 84 },
  { id: "r12", employee: "Daniel Lee", department: "Engineering", course: "Phishing & Social Engineering Defence", completed: "2025-05-28", score: 72 },
  { id: "r13", employee: "Rachel Brown", department: "IT", course: "AWS Solutions Architect Fundamentals", completed: "2025-07-10", score: 89 },
  { id: "r14", employee: "Sarah Chen", department: "Engineering", course: "Strategic Leadership & Vision", completed: null, score: null },
  { id: "r15", employee: "James Hart", department: "Product", course: "Negotiation & Influence Workshop", completed: null, score: null },
]

// ─── Department aggregation ─────────────────────────────────────────────────────

interface DeptSummary {
  department: string
  passed: number
  total: number
  rate: number
}

function buildDeptSummaries(records: CompletionRecord[]): DeptSummary[] {
  const map = new Map<string, { passed: number; total: number }>()
  for (const r of records) {
    const entry = map.get(r.department) ?? { passed: 0, total: 0 }
    entry.total += 1
    if (r.score !== null && r.score >= PASS_MARK) entry.passed += 1
    map.set(r.department, entry)
  }
  return Array.from(map.entries())
    .map(([department, { passed, total }]) => ({
      department,
      passed,
      total,
      rate: total ? Math.round((passed / total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate || a.department.localeCompare(b.department))
}

function rateColor(rate: number): "emerald" | "amber" | "red" {
  if (rate >= 80) return "emerald"
  if (rate >= 60) return "amber"
  return "red"
}

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

// ─── Department card ────────────────────────────────────────────────────────────

function DeptCard({ summary }: Readonly<{ summary: DeptSummary }>) {
  const t = useTranslations("HrTraining")
  return (
    <Card variant="elevated" className="gap-3 p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-content-primary">
          <Building2 className="size-4 text-content-tertiary" strokeWidth={1.75} />
          {summary.department}
        </span>
        <span className="text-lg leading-6 font-bold tabular-nums text-content-primary">
          {summary.rate}%
        </span>
      </div>
      <Progress value={summary.rate} color={rateColor(summary.rate)} />
      <span className="text-xs leading-4 text-content-tertiary">
        {t("coursesPassed", { passed: summary.passed, total: summary.total })}
      </span>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CompletionsTab() {
  const t = useTranslations("HrTraining")
  const summaries = buildDeptSummaries(RECORDS)

  return (
    <div className="flex flex-col gap-6">
      {/* Department cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s) => (
          <DeptCard key={s.department} summary={s} />
        ))}
      </div>

      {/* Completions table */}
      <Card variant="elevated" className="gap-0">
        <div className="flex flex-col gap-1 p-6">
          <h3 className="text-lg leading-7 font-semibold text-content-primary">
            {t("trainingCompletions")}
          </h3>
          <p className="text-sm leading-5 text-content-tertiary">
            {t("trainingCompletionsSubtitle")}
          </p>
        </div>

        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>{t("colEmployee")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colDepartment")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colCourse")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colCompleted")}</TableHead>
                <TableHead className={HEAD_CLASS}>{t("colStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECORDS.map((rec) => {
                const inProgress = rec.score === null
                const passed = rec.score !== null && rec.score >= PASS_MARK
                return (
                  <TableRow key={rec.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="default" alt={rec.employee} color="neutral" />
                        <span className="text-sm font-medium text-content-primary">
                          {rec.employee}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-content-tertiary">
                      {rec.department}
                    </TableCell>
                    <TableCell className="text-content-secondary">
                      {rec.course}
                    </TableCell>
                    <TableCell className="tabular-nums text-content-tertiary">
                      {rec.completed ?? (
                        <span className="text-content-quaternary">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inProgress ? (
                        <Badge variant="warning">{t("inProgress")}</Badge>
                      ) : (
                        <Badge variant={passed ? "success" : "danger"}>
                          {rec.score}%
                        </Badge>
                      )}
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
