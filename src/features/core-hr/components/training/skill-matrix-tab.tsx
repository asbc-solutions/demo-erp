"use client"

import { useState } from "react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Badge } from "@/src/shared/components/ui/badge"
import { Card } from "@/src/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = "beginner" | "intermediate" | "advanced" | "expert"

interface Employee {
  id: string
  name: string
  department: string
  skills: Record<string, Level>
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SKILLS = [
  "Cloud Architecture",
  "Python",
  "Leadership",
  "Communication",
  "Project Management",
  "Security",
] as const

/** Ordered strongest → weakest, for the summary cards. */
const LEVEL_ORDER: Level[] = ["expert", "advanced", "intermediate", "beginner"]

const LEVEL_CFG: Record<Level, { label: string; className: string }> = {
  beginner: {
    label: "Beginner",
    className: "bg-surface-hover text-content-tertiary",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-brand-info/10 text-brand-info",
  },
  advanced: {
    label: "Advanced",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  expert: {
    label: "Expert",
    className: "bg-brand-success/10 text-brand-success",
  },
}

const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Sarah Chen", department: "Engineering", skills: { "Cloud Architecture": "expert", Python: "advanced", Leadership: "intermediate", Communication: "advanced", "Project Management": "intermediate", Security: "advanced" } },
  { id: "e2", name: "Marcus Webb", department: "Engineering", skills: { "Cloud Architecture": "advanced", Python: "intermediate", Leadership: "advanced", Communication: "advanced", "Project Management": "expert", Security: "intermediate" } },
  { id: "e3", name: "Emma Clarke", department: "Analytics", skills: { "Cloud Architecture": "intermediate", Python: "expert", Leadership: "intermediate", Communication: "advanced", "Project Management": "intermediate", Security: "intermediate" } },
  { id: "e4", name: "James Hart", department: "Product", skills: { "Cloud Architecture": "intermediate", Python: "intermediate", Leadership: "expert", Communication: "expert", "Project Management": "advanced", Security: "beginner" } },
  { id: "e5", name: "Priya Patel", department: "Engineering", skills: { "Cloud Architecture": "advanced", Python: "advanced", Leadership: "intermediate", Communication: "intermediate", "Project Management": "intermediate", Security: "expert" } },
  { id: "e6", name: "Tom Richards", department: "Engineering", skills: { "Cloud Architecture": "advanced", Python: "intermediate", Leadership: "beginner", Communication: "intermediate", "Project Management": "beginner", Security: "expert" } },
  { id: "e7", name: "Jordan Davies", department: "Engineering", skills: { "Cloud Architecture": "beginner", Python: "advanced", Leadership: "advanced", Communication: "intermediate", "Project Management": "advanced", Security: "intermediate" } },
  { id: "e8", name: "Rachel Brown", department: "IT", skills: { "Cloud Architecture": "intermediate", Python: "intermediate", Leadership: "beginner", Communication: "advanced", "Project Management": "intermediate", Security: "advanced" } },
]

const DEPARTMENTS = Array.from(new Set(EMPLOYEES.map((e) => e.department)))

const HEAD_CLASS =
  "h-10 text-xs font-medium normal-case tracking-normal text-content-secondary"

// ─── Skill summary card ─────────────────────────────────────────────────────────

function SkillSummaryCard({ skill }: Readonly<{ skill: string }>) {
  const counts = LEVEL_ORDER.reduce(
    (acc, level) => {
      acc[level] = EMPLOYEES.filter((e) => e.skills[skill] === level).length
      return acc
    },
    {} as Record<Level, number>,
  )

  return (
    <Card variant="elevated" className="gap-3 p-5">
      <h4 className="text-sm leading-5 font-medium text-content-primary">
        {skill}
      </h4>
      <dl className="flex flex-col gap-2">
        {LEVEL_ORDER.map((level) => (
          <div key={level} className="flex items-center justify-between gap-2">
            <dt className="text-sm text-content-tertiary">
              {LEVEL_CFG[level].label}
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-content-primary">
              {counts[level]}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SkillMatrixTab() {
  const [dept, setDept] = useState<string>("all")

  const rows = EMPLOYEES.filter((e) => dept === "all" || e.department === dept)

  return (
    <div className="flex flex-col gap-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-content-secondary">
          Proficiency Levels:
        </span>
        {LEVEL_ORDER.slice()
          .reverse()
          .map((level) => (
            <Badge key={level} className={LEVEL_CFG[level].className}>
              {LEVEL_CFG[level].label}
            </Badge>
          ))}
      </div>

      {/* Skill summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {SKILLS.map((skill) => (
          <SkillSummaryCard key={skill} skill={skill} />
        ))}
      </div>

      {/* Matrix table */}
      <Card variant="elevated" className="gap-0">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg leading-7 font-semibold text-content-primary">
              Skills Matrix
            </h3>
            <p className="text-sm leading-5 text-content-tertiary">
              Employee proficiency levels across key competencies.
            </p>
          </div>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-6 pb-2">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Employee</TableHead>
                {SKILLS.map((skill) => (
                  <TableHead key={skill} className={cn(HEAD_CLASS, "text-center")}>
                    {skill}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={SKILLS.length + 1}
                    className="h-24 text-center text-sm text-content-tertiary"
                  >
                    No employees in this department.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="default" alt={emp.name} color="neutral" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-content-primary">
                          {emp.name}
                        </span>
                        <span className="text-xs text-content-tertiary">
                          {emp.department}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  {SKILLS.map((skill) => {
                    const level = emp.skills[skill]
                    return (
                      <TableCell key={skill} className="text-center">
                        {level ? (
                          <Badge className={LEVEL_CFG[level].className}>
                            {LEVEL_CFG[level].label}
                          </Badge>
                        ) : (
                          <span className="text-content-quaternary">—</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
