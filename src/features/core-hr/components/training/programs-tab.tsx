"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Building2,
  Clock,
  GraduationCap,
  Plus,
  Search,
  Trophy,
  Users,
} from "lucide-react"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { useCertifications, usePrograms } from "../../lib/queries/training"
import type { ProgramStatus, TrainingProgram } from "../../lib/types"
import { HeroStatCard } from "../performance/performance-stats"
import { categoryBadge } from "./training-format"

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  ProgramStatus,
  { label: string; variant: "success" | "info" | "warning" | "neutral" }
> = {
  active: { label: "Active", variant: "success" },
  completed: { label: "Completed", variant: "info" },
  paused: { label: "Paused", variant: "warning" },
  draft: { label: "Draft", variant: "neutral" },
  archived: { label: "Archived", variant: "neutral" },
}

function formatCost(program: TrainingProgram) {
  if (program.cost_per_seat == null) return null
  const currency = program.currency_code ? `${program.currency_code} ` : "£"
  return `${currency}${program.cost_per_seat.toLocaleString()}`
}

// ─── Program card ─────────────────────────────────────────────────────────────

function MetaItem({
  icon,
  children,
}: Readonly<{ icon: React.ReactNode; children: React.ReactNode }>) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm text-content-secondary">
      <span className="shrink-0 text-content-quaternary [&_svg]:size-3.5">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </span>
  )
}

function ProgramCard({ program }: Readonly<{ program: TrainingProgram }>) {
  const cat = categoryBadge(program.category)
  const st = STATUS_CFG[program.status] ?? STATUS_CFG.draft
  const cost = formatCost(program)

  return (
    <Card variant="elevated" className="gap-0 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg leading-6 font-semibold text-content-primary">
          {program.program_name}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cat.className}>{cat.label}</Badge>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
      </div>

      {/* Description */}
      {program.description && (
        <p className="mt-4 line-clamp-2 text-sm leading-5 text-content-tertiary">
          {program.description}
        </p>
      )}

      {/* Meta grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {program.total_duration_hours != null && (
          <MetaItem icon={<Clock strokeWidth={1.75} />}>
            {program.total_duration_hours} hours
          </MetaItem>
        )}
        {program.provider && (
          <MetaItem icon={<Building2 strokeWidth={1.75} />}>
            {program.provider}
          </MetaItem>
        )}
        {program.enrolled_count != null && (
          <MetaItem icon={<Users strokeWidth={1.75} />}>
            {program.enrolled_count} enrolled
          </MetaItem>
        )}
        {cost && (
          <span className="text-sm text-content-primary">
            <span className="font-semibold">{cost}</span>
            <span className="ml-1 text-xs text-content-tertiary">/seat</span>
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between gap-2 border-t border-stroke-default pt-4">
        <span className="flex items-center gap-2 text-xs text-content-tertiary">
          <GraduationCap className="size-4" strokeWidth={1.75} />
          {program.program_code}
        </span>
        <Button variant="ghost-primary" size="sm">
          View
        </Button>
      </div>
    </Card>
  )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function ProgramsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-[14px]" />
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ProgramsTab() {
  const [search, setSearch] = useState("")

  const { data, isLoading, isError } = usePrograms({ per_page: 100 })
  const { data: certData } = useCertifications({ per_page: 100 })

  const programs = data?.data ?? []
  const certs = certData?.data ?? []

  const filtered = programs.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.program_name.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false) ||
      (p.provider?.toLowerCase().includes(q) ?? false)
    )
  })

  const activeCount = programs.filter((p) => p.status === "active").length
  const totalEnrolled = programs.reduce((s, p) => s + (p.enrolled_count ?? 0), 0)
  const atRisk = certs.filter(
    (c) => c.status === "expiring_soon" || c.status === "expired",
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStatCard
          label="Active Programmes"
          value={
            <>
              {activeCount}
              <span className="text-lg font-normal text-content-tertiary">
                /{programs.length}
              </span>
            </>
          }
          icon={<GraduationCap strokeWidth={1.75} />}
          accent="violet"
        />
        <HeroStatCard
          label="Total Enrolled"
          value={totalEnrolled}
          icon={<Users strokeWidth={1.75} />}
          accent="blue"
        />
        <HeroStatCard
          label="Avg. Pass Rate"
          value="—"
          icon={<Trophy strokeWidth={1.75} />}
          accent="emerald"
        />
        <HeroStatCard
          label="Certifications at Risk"
          value={atRisk}
          icon={<AlertTriangle strokeWidth={1.75} />}
          accent="amber"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-96">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programmes..."
            className="pl-9"
          />
        </div>
        <Button variant="primary" size="sm">
          <Plus strokeWidth={2} />
          New Program
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <ProgramsSkeleton />
      ) : isError ? (
        <Card
          variant="elevated"
          className="min-h-48 items-center justify-center p-6 text-center"
        >
          <span className="text-sm text-content-tertiary">
            Couldn&apos;t load programmes. Please try again.
          </span>
        </Card>
      ) : filtered.length === 0 ? (
        <Card
          variant="elevated"
          className="min-h-48 items-center justify-center p-6 text-center"
        >
          <span className="text-sm text-content-tertiary">
            {programs.length === 0
              ? "No training programmes yet."
              : "No programmes match your search."}
          </span>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProgramCard key={p.program_id} program={p} />
          ))}
        </div>
      )}
    </div>
  )
}
