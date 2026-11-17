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
import { useTranslations } from "next-intl"

import { Badge } from "@/src/shared/components/ui/badge"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import { Skeleton } from "@/src/shared/components/ui/skeleton"
import { useIntlLocale } from "@/src/i18n/intl-locale"

import { useCertifications, usePrograms } from "../../lib/queries/training"
import type { ProgramStatus, TrainingProgram } from "../../lib/types"
import { HeroStatCard } from "../performance/performance-stats"
import { NewProgramDialog } from "./new-program-dialog"
import { ProgramDetailsDialog } from "./program-details-dialog"
import { categoryBadge } from "./training-format"

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<
  ProgramStatus,
  "success" | "info" | "warning" | "neutral"
> = {
  active: "success",
  completed: "info",
  paused: "warning",
  draft: "neutral",
  archived: "neutral",
}

function formatCost(program: TrainingProgram, intlLocale: string) {
  if (program.cost_per_seat == null) return null
  const currency = program.currency_code ? `${program.currency_code} ` : "£"
  return `${currency}${program.cost_per_seat.toLocaleString(intlLocale)}`
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

function ProgramCard({
  program,
  onView,
}: Readonly<{ program: TrainingProgram; onView: () => void }>) {
  const t = useTranslations("HrTraining")
  const tCommon = useTranslations("Common")
  const cat = categoryBadge(program.category, t)
  const status = program.status in STATUS_VARIANT ? program.status : "draft"
  const intlLocale = useIntlLocale()
  const cost = formatCost(program, intlLocale)

  return (
    <Card variant="elevated" className="gap-0 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h3 className="text-lg leading-6 font-semibold text-content-primary">
          {program.program_name}
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cat.className}>{cat.label}</Badge>
          <Badge variant={STATUS_VARIANT[status]}>
            {t(`programStatus.${status}`)}
          </Badge>
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
            {t("hoursCount", { count: program.total_duration_hours })}
          </MetaItem>
        )}
        {program.provider && (
          <MetaItem icon={<Building2 strokeWidth={1.75} />}>
            {program.provider}
          </MetaItem>
        )}
        {program.enrolled_count != null && (
          <MetaItem icon={<Users strokeWidth={1.75} />}>
            {t("enrolledCount", { count: program.enrolled_count })}
          </MetaItem>
        )}
        {cost && (
          <span className="text-sm text-content-primary">
            <span className="font-semibold">{cost}</span>
            <span className="ms-1 text-xs text-content-tertiary">
              {t("perSeat")}
            </span>
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between gap-2 border-t border-stroke-default pt-4">
        <span className="flex items-center gap-2 text-xs text-content-tertiary">
          <GraduationCap className="size-4" strokeWidth={1.75} />
          {program.program_code}
        </span>
        <Button variant="ghost-primary" size="sm" onClick={onView}>
          {tCommon("view")}
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
  const t = useTranslations("HrTraining")
  const [search, setSearch] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [viewing, setViewing] = useState<TrainingProgram | null>(null)

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
          label={t("kpiActiveProgrammes")}
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
          label={t("kpiTotalEnrolled")}
          value={totalEnrolled}
          icon={<Users strokeWidth={1.75} />}
          accent="blue"
        />
        <HeroStatCard
          label={t("kpiAvgPassRate")}
          value="—"
          icon={<Trophy strokeWidth={1.75} />}
          accent="emerald"
        />
        <HeroStatCard
          label={t("kpiCertsAtRisk")}
          value={atRisk}
          icon={<AlertTriangle strokeWidth={1.75} />}
          accent="amber"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-96">
          <Search
            className="absolute top-1/2 inset-s-3 size-4 -translate-y-1/2 text-content-quaternary"
            strokeWidth={1.75}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchProgrammes")}
            className="ps-9"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
          <Plus strokeWidth={2} />
          {t("newProgramme")}
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
            {t("programmesLoadError")}
          </span>
        </Card>
      ) : filtered.length === 0 ? (
        <Card
          variant="elevated"
          className="min-h-48 items-center justify-center p-6 text-center"
        >
          <span className="text-sm text-content-tertiary">
            {programs.length === 0
              ? t("programmesEmpty")
              : t("programmesNoMatch")}
          </span>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProgramCard
              key={p.program_id}
              program={p}
              onView={() => setViewing(p)}
            />
          ))}
        </div>
      )}

      <NewProgramDialog open={newOpen} onOpenChange={setNewOpen} />
      {viewing && (
        <ProgramDetailsDialog
          program={viewing}
          open
          onOpenChange={(next) => {
            if (!next) setViewing(null)
          }}
        />
      )}
    </div>
  )
}
